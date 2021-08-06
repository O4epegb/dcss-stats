import { reduce } from 'lodash-es';
import { CharStat, Matrix } from '@types';

export const getSummary = (matrix: Matrix) => {
  return reduce(
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
};

export type Summary = ReturnType<typeof getSummary>;
