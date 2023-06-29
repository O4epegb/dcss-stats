import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { PlayerInfoResponse } from '@types';
import { fetchApi } from '@api/server';
import { cookieKeyCompactView, cookieKeyOpenFilters } from '@screens/Player/utils';
import PlayerPage from '@screens/Player';

async function getData(slug: string) {
  const response = await fetchApi(`/players/${slug}`, { cache: 'no-store' });

  if (response.ok) {
    const data: PlayerInfoResponse = await response.json();

    if (data.player.name !== slug) {
      return redirect(`/players/${data.player.name}`);
    }

    cookies();

    return {
      ...data,
      isCompact: cookies().has(cookieKeyCompactView),
      isFiltersOpen: cookies().has(cookieKeyOpenFilters),
    };
  } else {
    if (response.status === 404) {
      return notFound();
    } else {
      throw new Error(`Error: ${response.status}`);
    }
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);

  return <PlayerPage {...data} />;
}
