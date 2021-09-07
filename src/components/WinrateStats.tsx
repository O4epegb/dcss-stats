import { formatNumber } from '@utils';

export const WinrateStats = ({ games, wins }: { games: number; wins: number }) => {
  return (
    <div className="flex space-x-4 text-xl font-bold">
      <div className="text-blue-600 whitespace-nowrap">{formatNumber(games)}G</div>
      <div className="text-green-600 whitespace-nowrap">{formatNumber(wins)}W</div>
      <div className="text-pink-600 whitespace-nowrap">
        {formatNumber((wins / games) * 100, {
          maximumFractionDigits: 2,
        })}
        % WR
      </div>
    </div>
  );
};
