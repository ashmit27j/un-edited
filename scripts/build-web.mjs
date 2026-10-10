// Builds the web export into dist/, ready for Vercel. Used by both:
//   - Vercel's Git builds (vercel.json `buildCommand`, output directory `dist`)
//   - `npm run deploy:web` (scripts/deploy-web.mjs), which uploads dist/ with the CLI
//
// Why the extra steps: Expo exports dynamic routes as `article/[id].html` and `folder/[name].html`.
// Vercel's static hosting won't serve those for /article/some-id, so each is copied to a plain name
// and vercel.json rewrites to it. The bracketed folders are removed so they can't shadow the rewrite.
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

// Vercel's Git builds don't see .env.local. Without these the site ships with no backend and shows no news,
// so stop the build instead. (Locally, Expo reads .env.local itself, so this only checks on Vercel.)
if (process.env.VERCEL) {
  const missing = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_KEY'].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Set ${missing.join(' and ')} in the Vercel project's environment variables.`);
}

rmSync('dist', { recursive: true, force: true });
run('npx expo export -p web');

copyFileSync('dist/article/[id].html', 'dist/_dynamic-article.html');
copyFileSync('dist/folder/[name].html', 'dist/_dynamic-folder.html');
rmSync('dist/article', { recursive: true, force: true });
rmSync('dist/folder', { recursive: true, force: true });

// The CLI deploy uploads dist/ as its own project root, so it needs a vercel.json there. Copy only the
// routing settings: the build fields in the root file would make Vercel try to rebuild inside dist/.
const { buildCommand, outputDirectory, installCommand, ...routing } = JSON.parse(readFileSync('vercel.json', 'utf8'));
writeFileSync('dist/vercel.json', JSON.stringify(routing, null, 2) + '\n');

// Expo puts package assets (all the fonts, some icons) in dist/assets/node_modules/, but the Vercel CLI
// never uploads folders named node_modules, so they 404 in production. Rename it and rewrite the paths.
if (existsSync('dist/assets/node_modules')) {
  renameSync('dist/assets/node_modules', 'dist/assets/pkg');
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
  for (const file of walk('dist').filter((f) => /\.(html|js|css|json)$/.test(f))) {
    const text = readFileSync(file, 'utf8');
    if (text.includes('/assets/node_modules/')) writeFileSync(file, text.replaceAll('/assets/node_modules/', '/assets/pkg/'));
  }
}
