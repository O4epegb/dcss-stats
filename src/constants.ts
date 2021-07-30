export const isProduction = process.env.NODE_ENV === 'production';

export const canUseDOM: boolean =
  typeof window !== 'undefined' && Boolean(window.document && window.document.createElement);

export const rootUrl =
  process.env.NEXT_PUBLIC_ROOT_URL ||
  (process.env.NEXT_PUBLIC_APP_ENV === 'production'
    ? 'https://example.com'
    : 'https://stage.example.com');
