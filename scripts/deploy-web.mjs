// Builds the web export and deploys it to Vercel (production) from this machine.
// Usage: npm run deploy:web      (needs `vercel login` once, and .env.local for the Supabase keys)
// The build itself lives in scripts/build-web.mjs, which Vercel's Git builds also run.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd });

run('node scripts/build-web.mjs');

if (!existsSync('dist/.vercel')) console.log('First deploy from this folder: Vercel will ask to link the project "unedited".');
run('npx vercel deploy --prod --yes --name unedited', 'dist');
