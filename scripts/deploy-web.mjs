// Builds the web export and deploys it to Vercel (production).
// Usage: npm run deploy:web      (needs `vercel login` once, and .env.local for the Supabase keys)
//
// Why the extra steps: Expo exports dynamic routes as `article/[id].html` and `folder/[name].html`.
// Vercel's static hosting won't serve those for /article/some-id, so each is copied to a plain name
// and vercel.json rewrites to it. The bracketed folders are removed so they can't shadow the rewrite.
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, rmSync } from 'node:fs';

const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd });

rmSync('dist', { recursive: true, force: true });
run('npx expo export -p web');

copyFileSync('dist/article/[id].html', 'dist/_dynamic-article.html');
copyFileSync('dist/folder/[name].html', 'dist/_dynamic-folder.html');
rmSync('dist/article', { recursive: true, force: true });
rmSync('dist/folder', { recursive: true, force: true });
copyFileSync('vercel.json', 'dist/vercel.json');

if (!existsSync('dist/.vercel')) console.log('First deploy from this folder: Vercel will ask to link the project "unedited".');
run('npx vercel deploy --prod --yes --name unedited', 'dist');
