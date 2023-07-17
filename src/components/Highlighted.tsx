import { escapeRegExp } from 'lodash-es';

export const Highlighted = ({ text, query }: { text: string; query: string }) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts
        .filter(Boolean)
        .map((part, i) => (regex.test(part) ? <b key={i}>{part}</b> : <span key={i}>{part}</span>))}
    </span>
  );
};
