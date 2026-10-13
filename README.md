# Un:edited

**Every story, as it was written.**

A free news reader that shows stories exactly as publishers wrote them, from outlets the reader picks. No AI rewrites, no ranking algorithm, no ads, no paywall.

- **Web:** https://unedited-bulletin.vercel.app (installable PWA)
- **Android:** APK from the landing page's "Get the Android app" button
- **iPhone:** open the website in Safari → Share → Add to Home Screen (no App Store build)

Languages: English, Hindi, Marathi.

## Stack

| Part | What |
|---|---|
| App | Expo SDK 57 + Expo Router, one codebase for Android and web (`src/`) |
| Backend | Supabase: Postgres, auth (email code + Google), Edge Functions, pg_cron (`supabase/`) |
| Web hosting | Vercel, built from every push to `master` (`vercel.json`, `scripts/build-web.mjs`) |
| Android builds | EAS Build, project `@ashmit27j/unedited`, package `app.unedited` (`eas.json`) |
| Push | Web Push (VAPID) for browsers; Expo push + Firebase Cloud Messaging for Android |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the Supabase URL, anon key and VAPID public key
npm run web                  # or: npm start, then press a / w
```

Without Supabase keys the app still runs, guest-only.

### Scripts

| Command | Does |
|---|---|
| `npm start` | Expo dev server |
| `npm run web` / `npm run android` | Start on web / Android |
| `npm run lint` | `expo lint` |
| `npm run deploy:web` | Build and deploy the web app to Vercel by hand |
| `npx tsc --noEmit` | Type check |

### Android APK

```bash
npx eas-cli build -p android --profile preview      # APK for sideloading
npx eas-cli build -p android --profile production   # app bundle for Play
```

`EXPO_PUBLIC_*` values for builds live in EAS environments (`.env.local` isn't uploaded). After a new preview build, update `ANDROID_APK_URL` in `src/components/landing-page.web.tsx` with the build's APK link (`npx eas-cli build:view <id> --json`, field `applicationArchiveUrl`).

### Backend

Setup, migrations and function deploys are in [`docs/backend-setup.md`](docs/backend-setup.md). Edge Functions:

| Function | Job |
|---|---|
| `fetch-news` | Pulls the outlets' RSS feeds and groups stories |
| `extract-articles` | Opens new stories' pages for fuller text, photos and video (free-to-read outlets only) |
| `register-push` | Stores a reader's push subscription / device token |
| `send-notifications` | Sends edition and alert notifications (per-kind Android channels) |

## Project layout

```
src/
  app/          routes (Expo Router): tabs, article, folder, onboarding, sign-in, landing, you/*
  components/   UI, incl. landing-page.web.tsx and wide/ (web layouts ≥ 768px)
  constants/    theme tokens (Paper / Ink)
  store/        reader state (sources, saves, folders, downloads)
  session/      Supabase session
  lib/ hooks/ theme/ tour/ data/ types/
supabase/       migrations, Edge Functions, config.toml
scripts/        web build and deploy
public/         static web files: PWA manifest, service worker, icons, landing images, privacy.html
assets/         app images, stamps, cursors
design/         design boards (.dc.html), screenshots, motion specs
docs/           current config, changelog, backend setup, history
```

## Design and docs

- [`docs/current-config.md`](docs/current-config.md): where the product, brand, screens and backend stand today. Start here.
- [`docs/changelog.md`](docs/changelog.md): every change, newest first.
- [`design/README.md`](design/README.md): the screen boards and how to preview them (`cd design/screens && python3 -m http.server 8000`).
- [`design/motion/MOTION.md`](design/motion/MOTION.md): every animation's timing, easing and reduced-motion fallback.
- `docs/history/`: original design doc and decisions (read-only snapshots).
- `CLAUDE.md` / `AGENTS.md`: working notes for coding agents.

## Brand rules

- Nothing a reader sees is written or rewritten by AI.
- No "verified" or "fact-checked" claims.
- Mockups use fictional outlet names.
- Every animation has a reduced-motion fallback.

## Secrets

Never commit these (all gitignored): `.env.local`, `supabase/.env`, and Firebase admin keys (`*firebase-adminsdk*.json`). The FCM V1 key lives in EAS credentials. `google-services.json` is a public client config and is committed.

## Contact

Built by one person. ashmit27j@gmail.com · [Privacy](https://unedited-bulletin.vercel.app/privacy)
