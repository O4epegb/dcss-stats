import Link from 'next/link';

export const Logo = () => {
  return (
    <Link href="/">
      <a className="inline-flex items-center space-x-2">
        <img width="128" height="128" src="/logo.png" className="w-8 h-8" />
        <h1 className="text-4xl text-center">DCSS Stats</h1>
      </a>
    </Link>
  );
};
