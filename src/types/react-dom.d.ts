// react-dom ships without types here; only flushSync is used (web theme fade).
declare module 'react-dom' {
  export function flushSync<R>(fn: () => R): R;
}
