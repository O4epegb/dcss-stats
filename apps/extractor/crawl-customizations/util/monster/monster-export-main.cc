/**
 * @file
 * @brief Contains code for the `monster` utility.
 **/

#include "AppHdr.h"

#include "fake-main.hpp"

#include "coordit.h"
#include "database.h"  // databaseSystemInit
#include "describe.h" // get_size_adj
#include "initfile.h" // SysEnv
#include "fight.h"    // spines_damage
#include "item-name.h" // init_item_name_cache, make_name
#include "items.h"
#include "los.h"
#include "message.h"
#include "mon-explode.h" // ball_lightning_damage
#include "mon-project.h"
#include "spl-damage.h"
#include "spl-summoning.h" // mons_ball_lighting_hd
#include "spl-zap.h"
#include "syscalls.h"
#include "tag-version.h"
#include "tile-flags.h"
#include "tilepick.h"
#include "version.h"

#include "rltiles/tiledef-player.h"

#include "contrib/cjson/cJSON.h"

const coord_def MONSTER_PLACE(20, 20);

const int PLAYER_MAXHP = 500;
const int PLAYER_MAXMP = 50;

static string attack_flavour_name(const attack_flavour flavour)
{
  switch (flavour)
  {
  case AF_PLAIN:         return "plain";
  case AF_ACID:          return "acid";
  case AF_BLINK:         return "blink";
  case AF_BLINK_WITH:    return "blink_with";
  case AF_COLD:          return "cold";
  case AF_CONFUSE:       return "confuse";
  case AF_DRAIN:         return "drain";
  case AF_ELEC:          return "elec";
  case AF_FIRE:          return "fire";
  case AF_POISON_PARALYSE: return "poison_paralyse";
  case AF_POISON:        return "poison";
  case AF_POISON_STRONG: return "poison_strong";
  case AF_VAMPIRIC:      return "vampiric";
  case AF_DISTORT:       return "distort";
  case AF_RAGE:          return "rage";
  case AF_CHAOTIC:       return "chaotic";
  case AF_STEAL:         return "steal";
  case AF_CRUSH:         return "crush";
  case AF_REACH:         return "reach";
  case AF_HOLY:          return "holy";
  case AF_ANTIMAGIC:     return "antimagic";
  case AF_PAIN:          return "pain";
  case AF_ENSNARE:       return "ensnare";
  case AF_PURE_FIRE:     return "pure_fire";
  case AF_DRAIN_SPEED:   return "drain_speed";
  case AF_VULN:          return "vuln";
  case AF_SHADOWSTAB:    return "shadowstab";
  case AF_DROWN:         return "drown";
  case AF_CORRODE:       return "corrode";
  case AF_SCARAB:        return "scarab";
  case AF_TRAMPLE:       return "trample";
  case AF_REACH_TONGUE:  return "reach_tongue";
  case AF_WEAKNESS:      return "weakness";
  case AF_SWOOP:         return "swoop";
  case AF_FOUL_FLAME:    return "foul_flame";
  case AF_SEAR:          return "sear";
  case AF_BARBS:         return "barbs";
  case AF_SPIDER:        return "spider";
  case AF_BLOODZERK:     return "bloodzerk";
  case AF_SLEEP:         return "sleep";
  case AF_MINIPARA:      return "minipara";
  case AF_AIRSTRIKE:     return "airstrike";
  case AF_ALEMBIC:       return "alembic";
  case AF_BOMBLET:       return "bomblet";
  case AF_RIFT:          return "rift";
  case AF_HELL_HUNT:     return "hell_hunt";
  case AF_FLANK:         return "flank";
  case AF_DRAG:          return "drag";
  case AF_SWARM:         return "swarm";
  case AF_TRICKSTER:     return "trickster";
  default:               return "unknown";
  }
}

static const char *shout_type_str(shout_type s)
{
  switch (s)
  {
  case S_SILENT:          return "silent";
  case S_SHOUT:           return "shout";
  case S_BARK:            return "bark";
  case S_HOWL:            return "howl";
  case S_SHOUT2:          return "shout2";
  case S_ROAR:            return "roar";
  case S_SCREAM:          return "scream";
  case S_BELLOW:          return "bellow";
  case S_BLEAT:           return "bleat";
  case S_TRUMPET:         return "trumpet";
  case S_SCREECH:         return "screech";
  case S_BUZZ:            return "buzz";
  case S_MOAN:            return "moan";
  case S_GURGLE:          return "gurgle";
  case S_CROAK:           return "croak";
  case S_GROWL:           return "growl";
  case S_HISS:            return "hiss";
  case S_SKITTER:         return "skitter";
  case S_FAINT_SKITTER:   return "faint_skitter";
  case S_DEMON_TAUNT:     return "demon_taunt";
  case S_CHERUB:          return "cherub";
  case S_SQUEAL:          return "squeal";
  case S_LOUD_ROAR:       return "loud_roar";
  case S_RUSTLE:          return "rustle";
  case S_SQUEAK:          return "squeak";
  case S_CAW:             return "caw";
  case S_LAUGH:           return "laugh";
  default:                return "unknown";
  }
}

static const char *habitat_str(habitat_type h)
{
  if (h == HT_FLYER)               return "fly";
  if (h == HT_AMPHIBIOUS_LAVA)     return "amphibious_lava";
  if (h == HT_AMPHIBIOUS)          return "amphibious";
  if (h == HT_WATER)               return "water";
  if (h == HT_LAND)                return "land";
  if (h == HT_LAVA)                return "lava";
  if (h & HT_WALLS_ONLY)           return "wall";
  if (h & HT_DRY_LAND)             return "land";
  return "unknown";
}

static const char *uses_str(mon_itemuse_type u)
{
  switch (u)
  {
  case MONUSE_NOTHING:             return "nothing";
  case MONUSE_OPEN_DOORS:          return "open_doors";
  case MONUSE_STARTING_EQUIPMENT:  return "starting_equipment";
  case MONUSE_WEAPONS_ARMOUR:      return "weapons_armour";
  default:                         return "unknown";
  }
}

static string monster_size(const monster &mon)
{
  return get_size_adj(mon.body_size());
}

static cJSON *cJSON_AddResistLevels(cJSON *parent, const char *name, resists_t r)
{
  cJSON *obj = cJSON_CreateObject();
  const struct { mon_resist_flags flag; const char *name; } entries[] = {
    { MR_RES_ELEC,    "elec" },
    { MR_RES_POISON,  "poison" },
    { MR_RES_FIRE,    "fire" },
    { MR_RES_COLD,    "cold" },
    { MR_RES_NEG,     "neg" },
    { MR_RES_CORR,    "corr" },
    { MR_RES_MIASMA,  "miasma" },
    { MR_RES_TORMENT, "torment" },
    { MR_RES_PETRIFY, "petrify" },
    { MR_RES_DAMNATION, "damnation" },
    { MR_RES_STEAM,   "steam" },
  };
  for (const auto &e : entries)
  {
    int val = get_resist(r, e.flag);
    if (val != 0)
      cJSON_AddNumberToObject(obj, e.name, val);
  }
  cJSON_AddItemToObject(parent, name, obj);
  return obj;
}

static cJSON *cJSON_AddSpeed(cJSON *parent, const char *name, const monster &mon, int speed_base)
{
  const mon_energy_usage &cost = mons_energy(mon);
  bool stationary = speed_base > 0 && mons_class_flag(mon.type, M_STATIONARY);

  cJSON *obj = cJSON_CreateObject();
  cJSON_AddNumberToObject(obj, "base", speed_base);

  cJSON *costs = cJSON_AddObjectToObject(obj, "energy_costs");
  cJSON_AddNumberToObject(costs, "move", cost.move);
  cJSON_AddNumberToObject(costs, "attack", cost.attack);
  cJSON_AddNumberToObject(costs, "spell", cost.spell);
  cJSON_AddNumberToObject(costs, "missile", cost.missile);
  cJSON_AddNumberToObject(costs, "swim", cost.swim);

  cJSON_AddBoolToObject(obj, "stationary", stationary);
  cJSON_AddItemToObject(parent, name, obj);
  return obj;
}

static void add_string_if(cJSON *arr, bool cond, const char *str)
{
  if (cond)
    cJSON_AddItemToArray(arr, cJSON_CreateString(str));
}

static void add_resist_string(cJSON *arr, int val, const char *prefix)
{
  if (val > 0)
    cJSON_AddItemToArray(arr, cJSON_CreateString((string(prefix) + string(val, '+')).c_str()));
}

static void initialize_crawl()
{
  init_monsters();
  init_properties();
  init_item_name_cache();

  init_zap_index();
  init_spell_descs();
  init_monster_symbols();
  init_mon_name_cache();
  init_spell_name_cache();
  init_mons_spells();
  init_element_colours();
  init_show_table();
  SysEnv.crawl_dir = ".";
  databaseSystemInit();

  dgn_reset_level();
  for (rectangle_iterator ri(0); ri; ++ri)
    env.grid(*ri) = DNGN_FLOOR;

  los_changed();
  you.hp = you.hp_max = PLAYER_MAXHP;
  you.magic_points = you.max_magic_points = PLAYER_MAXMP;
  you.species = SP_HUMAN;
}

static string dice_def_string(dice_def dice)
{
  return dice.num == 1 ? make_stringf("d%d", dice.size) : make_stringf("%dd%d", dice.num, dice.size);
}

static dice_def mi_calc_iood_damage(monster *mons)
{
  const int pow = mons_power_for_hd(SPELL_IOOD, mons->get_hit_dice());
  return iood_damage(pow, INFINITE_DISTANCE);
}

static string mi_calc_smiting_damage(monster * /*mons*/) { return "7-17"; }
static string mi_calc_brain_bite_damage(monster * /*mons*/) { return "4-8*"; }
static string mi_calc_pyre_arrow_damage(monster *mons)
{
  return make_stringf("2d%d*", 2 + mons->get_hit_dice() * 12 / 14);
}
static string mi_calc_gaze_drain(monster *mons, spell_type spell_cast)
{
  const int pow = mons_power_for_hd(spell_cast, mons->get_hit_dice());
  return make_stringf("0-%d MP", pow / 8);
}
static string mi_calc_airstrike_damage(monster *mons, spell_type spell_cast)
{
  const int pow = mons_power_for_hd(spell_cast, mons->get_hit_dice());
  dice_def dice = base_airstrike_damage(pow);
  return make_stringf("%dd%d+(%d/space)", dice.num, dice.size,
                      spell_cast == SPELL_SLEETSTRIKE ? 3 : 2);
}
static string mi_calc_glaciate_damage(monster *mons)
{
  int pow = 12 * mons->get_experience_level();
  int minimum = min(10, (54 + 3 * pow / 2) / 6);
  int max = (54 + 3 * pow / 2) / 3;

  return make_stringf("%d-%d", minimum, max);
}
static string mi_calc_chain_lightning_damage(monster *mons)
{
  const spell_type spell = SPELL_CHAIN_LIGHTNING;
  const zap_type zap = spell_to_zap(spell);
  const int pow = mons_power_for_hd(spell, mons->spell_hd(spell));
  const dice_def dice = zap_damage(zap, pow, true, false);
  return dice_def_string(dice);
}
static string mi_calc_vampiric_drain_damage(monster *mons)
{
  int pow = 12 * mons->get_experience_level();
  int min = 4;
  int max = 12 + (pow - 1) / 7;
  return make_stringf("%d-%d", min, max);
}
static string mi_calc_major_healing(monster *mons)
{
  const int min = 50;
  const int max = min + mons->spell_hd(SPELL_MAJOR_HEALING) * 10;
  return make_stringf("%d-%d", min, max);
}
static string mi_calc_scorch_damage(monster *mons)
{
  const int pow = mons_power_for_hd(SPELL_SCORCH, mons->get_hit_dice());
  return dice_def_string(scorch_damage(pow, false));
}
static string mi_calc_irradiate_damage(const monster &mon)
{
  const int pow = mons_power_for_hd(SPELL_IRRADIATE, mon.get_hit_dice());
  return dice_def_string(irradiate_damage(pow));
}
static string mi_calc_resonance_strike_damage(monster *mons)
{
  const int pow = mons->spell_hd(SPELL_RESONANCE_STRIKE);
  dice_def dice = resonance_strike_base_damage(pow);
  return describe_resonance_strike_dam(dice);
}

static string mons_human_readable_spell_damage_string(monster *monster,
                                                      spell_type sp)
{
  const int pow = mons_power_for_hd(sp, monster->spell_hd(sp));
  bolt spell_beam = mons_spell_beam(monster, sp, pow, true);
  switch (sp)
  {
  case SPELL_PORTAL_PROJECTILE:
  case SPELL_LRD:
    return "";
  case SPELL_SCORCH:
    return mi_calc_scorch_damage(monster);
  case SPELL_SMITING:
    return mi_calc_smiting_damage(monster);
  case SPELL_BRAIN_BITE:
    return mi_calc_brain_bite_damage(monster);
  case SPELL_PYRE_ARROW:
    return mi_calc_pyre_arrow_damage(monster);
  case SPELL_ANTIMAGIC_GAZE:
  case SPELL_DRAINING_GAZE:
    return mi_calc_gaze_drain(monster, sp);
  case SPELL_AIRSTRIKE:
  case SPELL_SLEETSTRIKE:
    return mi_calc_airstrike_damage(monster, sp);
  case SPELL_GLACIATE:
    return mi_calc_glaciate_damage(monster);
  case SPELL_CHAIN_LIGHTNING:
    return mi_calc_chain_lightning_damage(monster);
  case SPELL_CONJURE_BALL_LIGHTNING:
    return "3x" + dice_def_string(ball_lightning_damage(mons_ball_lightning_hd(pow, false)));
  case SPELL_MARSHLIGHT:
    return "2x" + dice_def_string(zap_damage(ZAP_FOXFIRE, pow, true));
  case SPELL_PLASMA_BEAM:
    return "2x" + dice_def_string(zap_damage(ZAP_PLASMA, pow, true));
  case SPELL_PERMAFROST_ERUPTION:
    return "2x" + dice_def_string(zap_damage(ZAP_PERMAFROST_ERUPTION_COLD, pow, true));
  case SPELL_WATERSTRIKE:
    spell_beam.damage = waterstrike_damage(monster->spell_hd(sp));
    break;
  case SPELL_RESONANCE_STRIKE:
    return mi_calc_resonance_strike_damage(monster);
  case SPELL_IOOD:
    spell_beam.damage = mi_calc_iood_damage(monster);
    break;
  case SPELL_POLAR_VORTEX:
    return dice_def_string(polar_vortex_dice(pow, true)) + "*";
  case SPELL_IRRADIATE:
    return mi_calc_irradiate_damage(*monster);
  case SPELL_VAMPIRIC_DRAINING:
    return mi_calc_vampiric_drain_damage(monster);
  case SPELL_MAJOR_HEALING:
    return mi_calc_major_healing(monster);
  case SPELL_MINOR_HEALING:
  case SPELL_HEAL_OTHER:
    return dice_def_string(spell_beam.damage) + "+3";
  default:
    break;
  }

  if (spell_beam.damage.size && spell_beam.damage.num)
    return dice_def_string(spell_beam.damage);
  return "";
}

struct SpellInfo
{
  string name;
  int level;
  int mana;
  int range;
  string damage;
  bool antimagic;
  bool silence;
  bool breath;
  bool critical;
};

static SpellInfo make_spell_info(monster *mp, const string &name, spell_type sp, mon_spell_slot_flags flags)
{
  return {
    name,
    spell_difficulty(sp),
    spell_mana(sp),
    spell_has_variable_range(sp) ? 0 : spell_range(sp),
    mons_human_readable_spell_damage_string(mp, sp),
    (bool)(flags & MON_SPELL_ANTIMAGIC_MASK),
    (bool)(flags & MON_SPELL_SILENCE_MASK),
    (bool)(flags & MON_SPELL_BREATH),
    (bool)(flags & MON_SPELL_EMERGENCY),
  };
}

static void record_spell_set(monster *mp, map<string, SpellInfo> &spell_map)
{
  set<string> seen;

  for (const auto &slot : mp->spells)
  {
    if (spell_is_soh_breath(slot.spell))
    {
      const vector<spell_type> *breaths = soh_breath_spells(slot.spell);
      ASSERT(breaths);
      for (unsigned int k = 0; k < mp->number; ++k)
      {
        string name = make_stringf("head %d: ", k + 1) + spell_title((*breaths)[k]);
        if (seen.insert(name).second)
          spell_map[name] = make_spell_info(mp, name, (*breaths)[k], slot.flags);
      }
      continue;
    }

    string name = spell_title(slot.spell);
    if (seen.insert(name).second)
      spell_map[name] = make_spell_info(mp, name, slot.spell, slot.flags);
  }
}

static inline void set_min_max(int num, int &min, int &max)
{
  if (!min || num < min)
    min = num;
  if (!max || num > max)
    max = num;
}

static string monster_symbol(const monster &mon)
{
  const monsterentry *me = mon.find_monsterentry();
  return me ? string(1, me->basechar) : "";
}

static string monster_tile_name(const monster &mon)
{
  monster_info info(&mon, MILEV_NAME);
  const tileidx_t tile = tileidx_monster(info) & TILE_FLAG_MASK;
  return tile_player_name(tile);
}

static int _mi_create_monster(mons_spec spec)
{
  monster *monster =
      dgn_place_monster(spec, MONSTER_PLACE, true, false, false);
  if (monster)
  {
    monster->behaviour = BEH_SEEK;
    monster->foe = MHITYOU;
    msg::suppress mx;
    return monster->mindex();
  }
  return NON_MONSTER;
}

static void rebind_mspec(string *requested_name,
                         const string &actual_name, mons_spec *mspec)
{
  if (*requested_name != actual_name && requested_name->find("draconian") == 0)
  {
    mons_list mons;
    const string err = mons.add_mons(actual_name, false);
    if (err.empty())
    {
      *mspec = mons.get_monster(0);
      *requested_name = actual_name;
    }
  }
}

int main(int argc, char *argv[])
{
  crawl_state.test = true;
  if (argc < 2)
  {
    cJSON *root = cJSON_CreateObject();
    cJSON_AddStringToObject(root, "error", "Usage: @? <monster name>");
    char *json = cJSON_PrintUnformatted(root);
    printf("%s\n", json);
    free(json);
    cJSON_Delete(root);
    return 0;
  }

  if (!strcmp(argv[1], "-version") || !strcmp(argv[1], "--version"))
  {
    cJSON *root = cJSON_CreateObject();
    cJSON_AddStringToObject(root, "version", Version::Long);
    char *json = cJSON_PrintUnformatted(root);
    printf("%s\n", json);
    free(json);
    cJSON_Delete(root);
    return 0;
  }
  else if (!strcmp(argv[1], "-list") || !strcmp(argv[1], "--list"))
  {
    initialize_crawl();

    cJSON *root = cJSON_CreateObject();
    cJSON *arr = cJSON_AddArrayToObject(root, "monsters");

    for (int i = 0; i < NUM_MONSTERS; ++i)
    {
      if (i == MONS_PROGRAM_BUG || i == MONS_PLAYER || i == MONS_PLAYER_GHOST || i == MONS_PLAYER_ILLUSION || invalid_monster_type(static_cast<monster_type>(i)))
        continue;

      const monsterentry *me = get_monster_data(static_cast<monster_type>(i));
      if (!me || me->mc == MONS_0)
        continue;

      cJSON_AddItemToArray(arr, cJSON_CreateString(mons_type_name(static_cast<monster_type>(i), DESC_PLAIN).c_str()));
    }

    char *json = cJSON_PrintUnformatted(root);
    printf("%s\n", json);
    free(json);
    cJSON_Delete(root);
    return 0;
  }

  initialize_crawl();

  mons_list mons;
  string target = argv[1];

  if (argc > 2)
    for (int x = 2; x < argc; x++)
    {
      target.append(" ");
      target.append(argv[x]);
    }

  trim_string(target);

  string err = mons.add_mons(target, false);
  if (!err.empty())
  {
    cJSON *root = cJSON_CreateObject();
    cJSON_AddStringToObject(root, "error", err.c_str());
    char *json = cJSON_PrintUnformatted(root);
    printf("%s\n", json);
    free(json);
    cJSON_Delete(root);
    return 1;
  }

  mons_spec spec = mons.get_monster(0);
  monster_type spec_type = static_cast<monster_type>(spec.type);

  if (spec_type < 0 || spec_type >= NUM_MONSTERS || spec_type == MONS_PLAYER_GHOST)
  {
    cJSON *root = cJSON_CreateObject();
    string msg = "invalid monster type: \"" + target + "\"";
    cJSON_AddStringToObject(root, "error", msg.c_str());
    char *json = cJSON_PrintUnformatted(root);
    printf("%s\n", json);
    free(json);
    cJSON_Delete(root);
    return 1;
  }

  if (mons_is_unique(spec_type))
    you.unique_creatures.set(spec_type, false);

  int index = _mi_create_monster(spec);
  if (index < 0 || index >= MAX_MONSTERS)
  {
    cJSON *root = cJSON_CreateObject();
    string msg = "Failed to create test monster for " + target;
    cJSON_AddStringToObject(root, "error", msg.c_str());
    char *json = cJSON_PrintUnformatted(root);
    printf("%s\n", json);
    free(json);
    cJSON_Delete(root);
    return 1;
  }

  const int ntrials = 200;

  long exp = 0L;
  int hp_min = 0;
  int hp_max = 0;
  int mac_sum = 0;
  int mev_sum = 0;
  map<string, SpellInfo> spell_map;
  for (int i = 0; i < ntrials; ++i)
  {
    monster *mp = &env.mons[index];
    const string mname = mp->name(DESC_PLAIN, true);
    exp += exp_value(*mp);
    mac_sum += mp->armour_class();
    mev_sum += mp->evasion();
    set_min_max(mp->hit_points, hp_min, hp_max);

    record_spell_set(mp, spell_map);

    for (int obj : mp->inv)
      if (obj != NON_ITEM)
        set_unique_item_status(env.item[obj], UNIQ_NOT_EXISTS);
    mp->reset();
    you.unique_creatures.set(spec_type, false);

    rebind_mspec(&target, mname, &spec);

    index = _mi_create_monster(spec);
    if (index == -1)
    {
      cJSON *root = cJSON_CreateObject();
      string msg = "Unexpected failure generating monster for " + target;
      cJSON_AddStringToObject(root, "error", msg.c_str());
      char *json = cJSON_PrintUnformatted(root);
      printf("%s\n", json);
      free(json);
      cJSON_Delete(root);
      return 1;
    }
  }
  exp /= ntrials;
  const int ac_sim = mac_sum / ntrials;
  const int ev_sim = mev_sum / ntrials;

  monster &mon(env.mons[index]);

  const string symbol(monster_symbol(mon));

  const bool shapeshifter = mon.is_shapeshifter() || spec_type == MONS_SHAPESHIFTER || spec_type == MONS_GLOWING_SHAPESHIFTER;

  const monsterentry *me =
      shapeshifter ? get_monster_data(spec_type) : mon.find_monsterentry();

  const monster_type draconian_base =
      mons_is_draconian(mon.type) ? draconian_subspecies(mon) : MONS_NO_MONSTER;

  if (me)
  {
    const bool changing_name =
        mon.has_hydra_multi_attack() || mon.type == MONS_PANDEMONIUM_LORD || shapeshifter || mon.type == MONS_DANCING_WEAPON;

    const int ac_base = me->AC;
    const int ev_base = me->ev;

    record_spell_set(&mon, spell_map);

    cJSON *root = cJSON_CreateObject();

    cJSON_AddStringToObject(root, "name", (changing_name ? me->name : mon.name(DESC_PLAIN, true)).c_str());
    cJSON_AddStringToObject(root, "symbol", symbol.c_str());
    cJSON_AddStringToObject(root, "tile", monster_tile_name(mon).c_str());

    if (mons_class_flag(mon.type, M_UNFINISHED))
      cJSON_AddTrueToObject(root, "unfinished");

    cJSON_AddSpeed(root, "speed", mon, me->speed);
    cJSON_AddNumberToObject(root, "hd", mon.get_experience_level());

    if (hp_min < hp_max)
    {
      char hp_buf[64];
      snprintf(hp_buf, sizeof(hp_buf), "%d-%d", hp_min, hp_max);
      cJSON_AddStringToObject(root, "hp", hp_buf);
    }
    else
    {
      char hp_buf[32];
      snprintf(hp_buf, sizeof(hp_buf), "%d", hp_min);
      cJSON_AddStringToObject(root, "hp", hp_buf);
    }

    cJSON_AddNumberToObject(root, "ac", ac_base);
    cJSON_AddNumberToObject(root, "ev", ev_base);
    if (ac_sim != ac_base || ev_sim != ev_base)
    {
      cJSON_AddNumberToObject(root, "ac_sim", ac_sim);
      cJSON_AddNumberToObject(root, "ev_sim", ev_sim);
    }

    // Defenses
    cJSON *defenses = cJSON_CreateArray();
    if (mon.is_spiny())
      cJSON_AddItemToArray(defenses, cJSON_CreateString((string("spiny ") + dice_def_string(spines_damage(mon.type))).c_str()));
    if (mons_species(mons_base_type(mon)) == MONS_MINOTAUR)
      cJSON_AddItemToArray(defenses, cJSON_CreateString("headbutt: d20-1"));
    if (cJSON_GetArraySize(defenses) > 0)
      cJSON_AddItemToObject(root, "defenses", defenses);
    else
      cJSON_Delete(defenses);

    // Attacks
    cJSON *attacks = cJSON_CreateArray();
    mon.wield_melee_weapon();
    for (int x = 0; x < 4; x++)
    {
      int attack_num = x;
      if (mon.has_hydra_multi_attack())
        attack_num = x == 0 ? x : x + mon.number - 1;
      mon_attack_def attk = mons_attack_spec(mon, attack_num);
      if (attk.type)
      {
        cJSON *atk = cJSON_CreateObject();

        short int dam = attk.damage;
        if (mon.berserk_or_frenzied() || mon.has_ench(ENCH_MIGHT))
          dam = dam * 3 / 2;
        if (mon.has_ench(ENCH_WEAK))
          dam = dam * 2 / 3;

        cJSON *dmg = cJSON_AddObjectToObject(atk, "damage");
        cJSON_AddNumberToObject(dmg, "num", 1);
        cJSON_AddNumberToObject(dmg, "size", dam);

        cJSON_AddStringToObject(atk, "type", mon_attack_name_short(attk.type).c_str());

        if (attk.flavour != AF_PLAIN)
        {
          cJSON_AddStringToObject(atk, "flavour", attack_flavour_name(attk.flavour).c_str());

          int extra = flavour_damage(attk.flavour, mon.get_hit_dice(), false);
          if (extra == 0)
          {
            switch (attk.flavour)
            {
            case AF_POISON:          extra = mon.get_hit_dice() * 4;       break;
            case AF_POISON_STRONG:   extra = mon.get_hit_dice() * 13 / 2;  break;
            case AF_POISON_PARALYSE: extra = mon.get_hit_dice() * 5 / 2;   break;
            case AF_MINIPARA:        extra = mon.get_hit_dice() * 2;       break;
            default: break;
            }
          }
          if (extra > 0)
            cJSON_AddNumberToObject(atk, "extra_damage", extra);
        }

        if (attk.type == AT_CONSTRICT)
          cJSON_AddTrueToObject(atk, "constrict");
        if (attk.type == AT_CLAW && mon.has_claws() >= 3)
          cJSON_AddTrueToObject(atk, "claw");
        if (_monster_has_reachcleave(mon))
        {
          cJSON_AddTrueToObject(atk, "cleave");
          cJSON_AddTrueToObject(atk, "reach");
        }
        else if (flavour_has_reach(attk.flavour))
          cJSON_AddTrueToObject(atk, "reach");

        if (x == 0 && mon.has_hydra_multi_attack())
          cJSON_AddTrueToObject(atk, "per_head");

        cJSON_AddItemToArray(attacks, atk);
      }
    }
    cJSON_AddItemToObject(root, "attacks", attacks);

    // Flags
    cJSON *flags = cJSON_CreateArray();

    // Holiness flags (canonical names from crawl)
    for (const auto bit : mon_holy_type::range())
      if (me->holiness & bit)
        cJSON_AddItemToArray(flags, cJSON_CreateString(holiness_name(bit)));

    switch (me->gmon_use)
    {
    case MONUSE_WEAPONS_ARMOUR:
      cJSON_AddItemToArray(flags, cJSON_CreateString("weapons"));
    case MONUSE_STARTING_EQUIPMENT:
      cJSON_AddItemToArray(flags, cJSON_CreateString("items"));
    case MONUSE_OPEN_DOORS:
      cJSON_AddItemToArray(flags, cJSON_CreateString("doors"));
    default:
      break;
    }

    add_string_if(flags, mons_class_flag(mon.type, M_EAT_DOORS), "eats doors");
    add_string_if(flags, mons_class_flag(mon.type, M_CRASH_DOORS), "breaks doors");
    add_string_if(flags, mons_wields_two_weapons(mon), "two-weapon");
    add_string_if(flags, mon.is_fighter(), "fighter");
    add_string_if(flags, mon.is_archer() && !mons_class_flag(mon.type, M_PREFER_RANGED), "archer");
    add_string_if(flags, mon.is_archer() && mons_class_flag(mon.type, M_PREFER_RANGED), "master archer");
    add_string_if(flags, mon.is_priest(), "priest");
    add_string_if(flags, me->habitat == HT_AMPHIBIOUS, "amphibious");
    add_string_if(flags, mon.evil(), "evil");
    add_string_if(flags, mon.is_actual_spellcaster(), "spellcaster");
    add_string_if(flags, mons_class_flag(mon.type, M_COLD_BLOOD), "cold-blooded");
    add_string_if(flags, mons_class_sees_invis(mon.type, draconian_base), "see invisible");
    add_string_if(flags, mons_class_flag(mon.type, M_FLIES), "fly");
    add_string_if(flags, mons_class_flag(mon.type, M_FAST_REGEN), "regen");
    add_string_if(flags, mon.is_unbreathing(), "unbreathing");
    add_string_if(flags, mon.is_insubstantial(), "insubstantial");
    add_string_if(flags, mon.is_amorphous(), "amorphous");
    add_string_if(flags, mons_class_flag(mon.type, M_WARDED), "warded");

    cJSON_AddItemToObject(root, "flags", flags);

    // Resistances
    cJSON *resistances = cJSON_CreateArray();
    const resists_t res(shapeshifter ? me->resists : get_mons_resists(mon));

    if (mons_invuln_will(mon))
      cJSON_AddItemToArray(resistances, cJSON_CreateString("will(invuln)"));
    else
    {
      int wl = mons_class_willpower(mon.type, draconian_base);
      if (wl > 0)
      {
        char buf[64];
        snprintf(buf, sizeof(buf), "will(%d)", wl);
        cJSON_AddItemToArray(resistances, cJSON_CreateString(buf));
      }
    }

    add_resist_string(resistances, get_resist(res, MR_RES_FIRE), "fire");
    add_resist_string(resistances, get_resist(res, MR_RES_DAMNATION), "damnation");
    add_resist_string(resistances, get_resist(res, MR_RES_COLD), "cold");
    add_resist_string(resistances, get_resist(res, MR_RES_ELEC), "elec");
    add_resist_string(resistances, get_resist(res, MR_RES_POISON), "poison");
    add_resist_string(resistances, get_resist(res, MR_RES_CORR), "corr");
    add_resist_string(resistances, get_resist(res, MR_RES_STEAM), "steam");
    add_string_if(resistances, mons_class_flag(mon.type, M_UNBLINDABLE), "blind");
    add_string_if(resistances, mon.res_water_drowning(), "drown");
    add_string_if(resistances, mon.res_miasma(), "miasma");
    add_resist_string(resistances, mon.res_negative_energy(true), "neg");
    add_resist_string(resistances, mon.res_holy_energy(), "holy");
    add_resist_string(resistances, mon.res_foul_flame(), "foul_flame");
    add_string_if(resistances, mon.res_torment(), "torm");
    add_string_if(resistances, mon.res_polar_vortex(), "vortex");
    add_string_if(resistances, mon.res_sticky_flame(), "napalm");

    cJSON_AddItemToObject(root, "resistances", resistances);

    // Vulnerabilities
    cJSON *vulns = cJSON_CreateArray();
    add_string_if(vulns, get_resist(res, MR_RES_FIRE) < 0, "fire");
    add_string_if(vulns, get_resist(res, MR_RES_COLD) < 0, "cold");
    add_string_if(vulns, get_resist(res, MR_RES_ELEC) < 0, "elec");
    add_string_if(vulns, mon.how_chaotic() > 0, "silver");

    if (cJSON_GetArraySize(vulns) > 0)
      cJSON_AddItemToObject(root, "vulnerabilities", vulns);
    else
      cJSON_Delete(vulns);

    cJSON_AddBoolToObject(root, "corpse", me->leaves_corpse);
    cJSON_AddNumberToObject(root, "xp", exp);

    // Spells
    cJSON *spells = cJSON_CreateArray();
    {
      if (shapeshifter || mon.type == MONS_PANDEMONIUM_LORD || mon.type == MONS_ORC_APOSTLE)
      {
        cJSON *sp = cJSON_CreateObject();
        cJSON_AddStringToObject(sp, "name", "(random)");
        cJSON_AddNumberToObject(sp, "level", 0);
        cJSON_AddNumberToObject(sp, "mana", 0);
        cJSON_AddItemToArray(spells, sp);
      }
      else
      {
        for (auto &it : spell_map)
        {
          cJSON *sp = cJSON_CreateObject();
          cJSON_AddStringToObject(sp, "name", it.second.name.c_str());
          cJSON_AddNumberToObject(sp, "level", it.second.level);
          cJSON_AddNumberToObject(sp, "mana", it.second.mana);
          if (it.second.range > 0)
            cJSON_AddNumberToObject(sp, "range", it.second.range);
          if (!it.second.damage.empty())
            cJSON_AddStringToObject(sp, "damage", it.second.damage.c_str());
          if (it.second.antimagic)
            cJSON_AddTrueToObject(sp, "antimagic");
          if (it.second.silence)
            cJSON_AddTrueToObject(sp, "silence");
          if (it.second.breath)
            cJSON_AddTrueToObject(sp, "breath");
          if (it.second.critical)
            cJSON_AddTrueToObject(sp, "critical");
          cJSON_AddItemToArray(spells, sp);
        }
      }
    }
    cJSON_AddItemToObject(root, "spells", spells);

    cJSON_AddStringToObject(root, "size", monster_size(mon).c_str());
    string intel = lowercase_string(intelligence_description(mons_intel(mon)));
    cJSON_AddStringToObject(root, "intelligence", intel.c_str());

    cJSON_AddStringToObject(root, "species", mons_type_name(me->species, DESC_PLAIN).c_str());
    cJSON_AddStringToObject(root, "genus", mons_type_name(me->genus, DESC_PLAIN).c_str());
    cJSON_AddNumberToObject(root, "spell_hd", mon.spell_hd());
    cJSON_AddBoolToObject(root, "shapeshifter", shapeshifter);

    if (mons_invuln_will(mon))
      cJSON_AddNumberToObject(root, "willpower", 5000);
    else
      cJSON_AddNumberToObject(root, "willpower", mons_class_willpower(mon.type, draconian_base));

    cJSON_AddStringToObject(root, "shape", get_mon_shape_str(me->shape).c_str());
    cJSON_AddStringToObject(root, "holiness", holiness_description(me->holiness).c_str());
    cJSON_AddStringToObject(root, "habitat", habitat_str(me->habitat));
    cJSON_AddStringToObject(root, "shout", shout_type_str(me->shouts));
    cJSON_AddStringToObject(root, "uses", uses_str(me->gmon_use));
    cJSON_AddResistLevels(root, "resist_levels", me->resists);

    // Description
    {
      string desc = getLongDescription(string(me->name));
      while (true)
      {
        auto pos = desc.find('<');
        if (pos == string::npos) break;
        auto end = desc.find('>', pos);
        if (end == string::npos) break;
        desc.erase(pos, end - pos + 1);
      }
      while (!desc.empty() && (desc.back() == '\n' || desc.back() == ' '))
        desc.pop_back();
      cJSON_AddStringToObject(root, "description", desc.c_str());
    }

    char *json_str = cJSON_PrintUnformatted(root);
    printf("%s\n", json_str);
    free(json_str);
    cJSON_Delete(root);

    return 0;
  }

  cJSON *root = cJSON_CreateObject();
  string msg = "Failed to find monster entry for " + target;
  cJSON_AddStringToObject(root, "error", msg.c_str());
  char *json = cJSON_PrintUnformatted(root);
  printf("%s\n", json);
  free(json);
  cJSON_Delete(root);
  return 1;
}
