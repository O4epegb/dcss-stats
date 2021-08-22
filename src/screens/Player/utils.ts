import { keys, orderBy, reduce, uniqBy } from 'lodash-es';
import { CharStat, Class, God, Matrix, Race } from '@types';

export const getSummary = (matrix: Matrix, races: Race[], classes: Class[], gods: God[]) => {
  const stats = reduce(
    matrix,
    (acc, value, key) => {
      const race = key.slice(0, 2);
      const klass = key.slice(2, 4);

      acc.classes[klass] = {
        wins: (acc.classes[klass]?.wins || 0) + value.wins,
        games: (acc.classes[klass]?.games || 0) + value.games,
        maxXl: Math.max(acc.classes[klass]?.maxXl || 0, value.maxXl),
      };

      acc.races[race] = {
        wins: (acc.races[race]?.wins || 0) + value.wins,
        games: (acc.races[race]?.games || 0) + value.games,
        maxXl: Math.max(acc.races[race]?.maxXl || 0, value.maxXl),
      };

      return acc;
    },
    {
      races: {},
      classes: {},
      combos: matrix,
    } as {
      races: Record<string, CharStat>;
      classes: Record<string, CharStat>;
      combos: Record<string, typeof matrix[string]>;
    },
  );

  const trunkRaces = orderBy(
    races.filter((x) => x.trunk),
    (x) => x.abbr,
  );
  const trunkClasses = orderBy(
    classes.filter((x) => x.trunk),
    (x) => x.abbr,
  );

  return {
    stats,
    trunkRaces,
    trunkClasses,
    allActualRaces: getActual(races, stats.races),
    allActualClasses: getActual(classes, stats.classes),
    wonRaces: trunkRaces.filter((x) => stats.races[x.abbr]?.wins > 0),
    wonClasses: trunkClasses.filter((x) => stats.classes[x.abbr]?.wins > 0),
    wonGods: gods.filter((g) => g.win),
    notWonRaces: trunkRaces.filter((x) => !(stats.races[x.abbr]?.wins > 0)),
    notWonClasses: trunkClasses.filter((x) => !(stats.classes[x.abbr]?.wins > 0)),
    notWonGods: orderBy(
      gods.filter((g) => !g.win),
      (x) => x.name,
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

const storageKey = 'favorites';
export const getFavorites = () => localStorage.getItem(storageKey) || '';

export const addToFavorite = (name: string) => {
  localStorage.setItem(storageKey, `${getFavorites()},${name}`);
};

export const removeFromFavorite = (name: string) => {
  localStorage.setItem(
    storageKey,
    getFavorites()
      .split(',')
      .filter((x) => x && x !== name)
      .join(','),
  );
};
