import { orderBy } from 'lodash-es';
import { StaticData } from '@types';
import { fetchApi } from '@api/server';

// Quite hard to implement with App Router because shallow routing does not work

export default async function Page() {
  const data: StaticData = await fetchApi('/combos', { next: { revalidate: 300 } }).then((r) =>
    r.json(),
  );

  const props = {
    races: orderBy(data.races, [(x) => x.trunk, (x) => x.name], ['desc', 'asc']),
    classes: orderBy(data.classes, [(x) => x.trunk, (x) => x.name], ['desc', 'asc']),
    gods: orderBy(data.gods, (x) => x.name.toLowerCase()),
    skills: data.skills,
    versions: data.versions,
  };

  // eslint-disable-next-line no-console
  console.log(props);

  return <div>search</div>;
}
