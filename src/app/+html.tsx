import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Baskervville:ital,wght@0,400..700;1,400..700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Mukta:wght@400;500&family=Tiro+Devanagari+Hindi&family=Tiro+Devanagari+Marathi&display=swap';

// Light (Paper) is the default. A saved choice ('paper' | 'ink' | 'system') is applied before first paint,
// so the page never flashes the wrong theme. Same storage key as ThemeProvider.
const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('unedited.theme');var d=s==='ink'||(s==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var t=d?'ink':'paper';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=d?'dark':'light';var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',d?'#1E1C19':'#F1EBE0');}catch(e){}})();`;

// Colour tokens (docs/current-config.md §3) as CSS variables, for the web-only landing page and the body.
const BASE_CSS = `
:root,:root[data-theme="paper"]{--bg:#F1EBE0;--surface:#F8F3EA;--ink:#1C1A17;--muted:#6B645A;--rule:#DDD4C4;--accent:#A8372A;--line:#C2B6A2;--body:#3F3A33;color-scheme:light}
:root[data-theme="ink"]{--bg:#1E1C19;--surface:#262320;--ink:#C9C0B0;--muted:#8E8678;--rule:#38332D;--accent:#C8705F;--line:#4A443C;--body:#B5AC9C;color-scheme:dark}
body{background:var(--bg);color:var(--ink)}
html{scrollbar-width:thin;scrollbar-color:rgba(122,112,98,.45) transparent}
`;

/** Root HTML for the web build: PWA tags, fonts, theme colour and page background (no flash). */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" data-theme="paper">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Every story, as it was written. A free news reader that shows stories exactly as publishers wrote them, from the outlets you choose." />
        <meta name="theme-color" content="#F1EBE0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Un:edited" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta property="og:title" content="Un:edited" />
        <meta property="og:description" content="Every story, as it was written." />
        <meta property="og:type" content="website" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
