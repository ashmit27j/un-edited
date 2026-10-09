// Builds the web export and deploys it to Vercel (production).
// Usage: npm run deploy:web      (needs `vercel login` once, and .env.local for the Supabase keys)
//
// Why the extra steps: Expo exports dynamic routes as `article/[id].html` and `folder/[name].html`.
// Vercel's static hosting won't serve those for /article/some-id, so each is copied to a plain name
// and vercel.json rewrites to it. The bracketed folders are removed so they can't shadow the rewrite.
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd });

rmSync('dist', { recursive: true, force: true });
run('npx expo export -p web');

copyFileSync('dist/article/[id].html', 'dist/_dynamic-article.html');
copyFileSync('dist/folder/[name].html', 'dist/_dynamic-folder.html');
rmSync('dist/article', { recursive: true, force: true });
rmSync('dist/folder', { recursive: true, force: true });
copyFileSync('vercel.json', 'dist/vercel.json');

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

if (!existsSync('dist/.vercel')) console.log('First deploy from this folder: Vercel will ask to link the project "unedited".');
run('npx vercel deploy --prod --yes --name unedited', 'dist');
