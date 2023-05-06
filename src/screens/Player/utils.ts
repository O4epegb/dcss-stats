import { keys, orderBy, reduce, uniqBy, keyBy } from 'lodash-es';
import { CharStat, Class, GamesToFirstWin, God, Matrix, Race } from '@types';
import { notEmpty } from '@utils';

export const cookieKeyCompactView = 'dcss-compact-view';
export const cookieKeyOpenFilters = 'dcss-open-filters';

export const unavailableCombos = keyBy([
  'GhTm',
  'MuTm',
  'DgMo',
  'DgCK',
  'DgCA',
  'DgBe',
  'DgAK',
  'FeHu',
  'FeGl',
  'FeBr',
  'FeHs',
]);

export const getSummary = (
  matrix: Matrix,
  races: Race[],
  classes: Class[],
  gods: God[],
  gamesToFirstWin: GamesToFirstWin,
) => {
  const trunkRaces = orderBy(
    races.filter((x) => x.trunk),
    (x) => x.abbr,
  );
  const trunkClasses = orderBy(
    classes.filter((x) => x.trunk),
    (x) => x.abbr,
  );

  const countStat = (acc: CharStat | undefined, item: CharStat, gamesToWin: number | undefined) => {
    const stat = {
      wins: (acc?.wins || 0) + item.wins,
      games: (acc?.games || 0) + item.games,
      maxXl: Math.max(acc?.maxXl || 0, item.maxXl),
    };

    return {
      ...stat,
      winRate: stat.wins / stat.games,
      gamesToFirstWin: gamesToWin ?? 0,
    };
  };

  const stats = reduce(
    matrix,
    (acc, item, key) => {
      const race = key.slice(0, 2);
      const klass = key.slice(2, 4);

      acc.classes[klass] = countStat(acc.classes[klass], item, gamesToFirstWin.classes[klass]);
      acc.races[race] = countStat(acc.races[race], item, gamesToFirstWin.races[race]);

      return acc;
    },
    {
      races: {},
      classes: {},
      combos: matrix,
    } as {
      races: Record<string, CharStat>;
      classes: Record<string, CharStat>;
      combos: Record<string, CharStat>;
    },
  );

  const wonRaces = trunkRaces.filter((x) => stats.races[x.abbr]?.wins > 0);
  const wonClasses = trunkClasses.filter((x) => stats.classes[x.abbr]?.wins > 0);
  const allActualRaces = getActual(races, stats.races);
  const allActualClasses = getActual(classes, stats.classes);
  const greatRaces = wonRaces.filter((race) => {
    return trunkClasses.every((klass) => {
      const combo = race.abbr + klass.abbr;

      return unavailableCombos[combo] || matrix[combo]?.wins > 0;
    });
  });
  const greatClasses = wonClasses.filter((klass) => {
    return trunkRaces.every((race) => {
      const combo = race.abbr + klass.abbr;

      return unavailableCombos[combo] || matrix[combo]?.wins > 0;
    });
  });

  const combosCompleted = trunkRaces
    .map((race) => {
      return trunkClasses.map((klass) => {
        const combo = race.abbr + klass.abbr;

        return matrix[combo]?.wins > 0 ? combo : null;
      });
    })
    .flat()
    .filter(notEmpty).length;

  return {
    stats,
    combosCompleted,
    totalCombos: trunkRaces.length * trunkClasses.length - Object.keys(unavailableCombos).length,
    trunkRaces,
    trunkClasses,
    allActualRaces,
    allActualClasses,
    wonRaces,
    wonClasses,
    greatRaces: keyBy(greatRaces, (x) => x.abbr),
    greatClasses: keyBy(greatClasses, (x) => x.abbr),
    wonGods: gods.filter((g) => g.win),
    notWonRaces: trunkRaces.filter((x) => !(stats.races[x.abbr]?.wins > 0)),
    notWonClasses: trunkClasses.filter((x) => !(stats.classes[x.abbr]?.wins > 0)),
    notWonGods: orderBy(
      gods.filter((g) => !g.win),
      (x) => x.name.toLowerCase(),
    ),
  };
};

const getActual = (items: Array<Race | Class>, summaryItems: Record<string, CharStat>) =>
  orderBy(
    uniqBy(
      [
        ...items.filter((x) => x.trunk || summaryItems[x.abbr]),
        ...keys(summaryItems).map((abbr) => ({ trunk: false, abbr, name: abbr })),
      ],
      (x) => x.abbr,
    ),
    (x) => x.abbr,
  );

export type Summary = ReturnType<typeof getSummary>;

const favoritesStorageKey = 'favorites';
export const getFavorites = () => localStorage.getItem(favoritesStorageKey) || '';

export const addToFavorite = (name: string) => {
  localStorage.setItem(favoritesStorageKey, `${getFavorites()},${name}`);
};

export const removeFromFavorite = (name: string) => {
  localStorage.setItem(
    favoritesStorageKey,
    getFavorites()
      .split(',')
      .filter((x) => x && x !== name)
      .join(','),
  );
};
