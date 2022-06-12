import clsx from 'clsx';
import { formatNumber } from '@utils';

export const WinrateStats = ({
  games,
  wins,
  small,
}: {
  games: number;
  wins: number;
  small?: boolean;
}) => {
  return (
    <div className={clsx('flex font-bold', small ? 'space-x-1' : 'space-x-4 text-xl')}>
      <div className="whitespace-nowrap text-blue-600">{formatNumber(games)}G</div>
      <div className="whitespace-nowrap text-emerald-600">{formatNumber(wins)}W</div>
      <div className="whitespace-nowrap text-pink-600">
        {formatNumber((wins / games || 0) * 100, {
          maximumFractionDigits: 2,
        })}
        % WR
      </div>
    </div>
  );
};
