import Link from 'next/link';

export const Logo = () => {
  return (
    <Link href="/">
      <a className="inline-flex items-center space-x-2">
        <img width="128" height="128" src="/logo.png" className="h-8 w-8" />
        <h1 className="whitespace-nowrap text-center text-2xl sm:text-4xl">DCSS Stats</h1>
      </a>
    </Link>
  );
};
