import { formatNumber } from '@utils';

export const WinrateStats = ({ games, wins }: { games: number; wins: number }) => {
  return (
    <div className="flex space-x-4 text-xl font-bold">
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
