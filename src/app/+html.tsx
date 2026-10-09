import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/** Root HTML for the web build: PWA tags, theme colour and page background (no white flash). */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Every story, as it was written. A free news reader that shows stories exactly as publishers wrote them, from the outlets you choose." />
        <meta name="theme-color" content="#F1EBE0" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1E1C19" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Un:edited" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta property="og:title" content="Un:edited" />
        <meta property="og:description" content="Every story, as it was written." />
        <meta property="og:type" content="website" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body{background:#F1EBE0;color:#1C1A17}
              @media (prefers-color-scheme: dark){body{background:#1E1C19;color:#C9C0B0}}
              html{scrollbar-width:thin;scrollbar-color:rgba(122,112,98,.45) transparent}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
