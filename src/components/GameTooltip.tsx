import { useState } from 'react';
import useSWRImmutable from 'swr/immutable';
import { api } from '@api';
import { Game } from '@types';
import { canUseDOM } from '@constants';
import { TippyProps } from '@tippyjs/react';
import { Tooltip } from '@components/Tooltip';
import { GameItem } from '@components/GamesList';

export const GameTooltip = ({
  children,
  ...rest
}: {
  player: string;
  children: TippyProps['children'];
} & (
  | {
      isWin: boolean;
      title: string;
      player: string;
    }
  | {
      id: string;
    }
)) => {
  const [isActive, setIsActive] = useState(false);
  const { data, error } = useSWRImmutable<{ data: Game[]; count: number }>(
    isActive ? ['/games', rest] : null,
    (url, params) => api.get(url, { params }).then((res) => res.data),
  );

  return (
    <Tooltip
      interactive
      delay={100}
      appendTo={canUseDOM ? document.body : undefined}
      content={
        data ? (
          data.data.length > 0 ? (
            <GameItem game={data.data[0]} />
          ) : (
            'Game not found'
          )
        ) : error ? (
          'Error occured, try to reload the page'
        ) : (
          'Loading'
        )
      }
      onTrigger={() => setIsActive(true)}
    >
      {children}
    </Tooltip>
  );
};
