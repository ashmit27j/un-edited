# Backend setup (Supabase + Android build)

What's in the repo and what still needs doing by hand. The code is done; these steps need your accounts.

## What the backend does

- **`supabase/migrations/`**: tables (`sources`, `articles`, `story_groups`, `reports`, `reader_state`, `push_targets`, `sent_alerts`) with row-level security, the starting outlet list (24 outlets, feeds checked 2026-10-09), and the schedule.
- **`supabase/functions/fetch-news`**: every 30 min. Reads each outlet's own RSS feed; if a feed fails, falls back to NewsData.io, then NewsAPI.org, then GNews (only links on the outlet's own domain are kept). Stores the publisher's headline and excerpt, and the full text only when the feed carries it. Files each story under a topic by keyword rules and groups stories about the same event by shared names and numbers (≥2 shared, ≥50% of the shorter headline's names, 36h window, same language). No AI anywhere. Deletes unsaved stories after 30 days.
- **`supabase/functions/send-notifications`**: every 30 min. Morning Edition at each reader's time and days (held until quiet hours end), Big stories, topic/source alerts with the publisher's exact headline, Sunday papers note; one cap for alerts. Web Push and Expo push (Android).
- **`supabase/functions/register-push`**: the app sends its push token and notification settings here.
- **The app** reads live stories (`src/data/news.tsx`), caches them for offline, and falls back to the sample stories when nothing live is available. Signed-in readers' settings, folders and folder downloads sync to `reader_state` (`src/session/account-sync.ts`).

## 1. Supabase (one time)

Project: `pqouqidkhpxtblpwfhea`.

```bash
npx supabase login                     # opens the browser
npx supabase link --project-ref pqouqidkhpxtblpwfhea
npx supabase db push                   # creates the tables, outlets and schedule
npx supabase secrets set --env-file supabase/.env
npx supabase functions deploy fetch-news
npx supabase functions deploy send-notifications
npx supabase functions deploy register-push
```

Then in the SQL editor (Dashboard › SQL), so the schedule can call the functions. Use the `CRON_SECRET` value from `supabase/.env`:

```sql
select vault.create_secret('https://pqouqidkhpxtblpwfhea.supabase.co', 'project_url');
select vault.create_secret('<CRON_SECRET from supabase/.env>', 'cron_secret');
```

Run the fetch once by hand to fill the first edition (Dashboard › Edge Functions › fetch-news › Test, with header `Authorization: Bearer <CRON_SECRET>`), or wait for the next half hour.

**Sign-in** (from `.env.example`): Authentication › Providers: turn on Email and Google. URL Configuration › Redirect URLs: `unedited://sign-in`, `http://localhost:8081/sign-in`, `https://unedited-six.vercel.app/sign-in`. Email templates › Magic Link: include `{{ .Token }}`.

**News API fallbacks (optional)**: sign up and paste the keys into `supabase/.env`, then run `secrets set` again.
- NewsData.io: free tier, 200 credits/day.
- NewsAPI.org: the free "Developer" plan is **not allowed in production** and its results are delayed; it needs a paid plan before launch.
- GNews: free tier, 100 requests/day, non-commercial.

## 2. Vercel

Project › Settings › Environment Variables, add `EXPO_PUBLIC_VAPID_PUBLIC_KEY` (value in `.env.local`) for Production and Preview, so Git builds can offer web notifications.

## 3. Android APK

```bash
npx eas-cli login
npx eas-cli init                       # creates the EAS project and writes its id into app.json
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_URL --value <from .env.local> --environment preview --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_KEY --value <from .env.local> --environment preview --visibility plaintext
npx eas-cli build -p android --profile preview
```

The build gives a link to the APK. Package name: `app.unedited` (fixed once installed). Push notifications on Android also need Firebase credentials uploaded to EAS (`npx eas-cli credentials`, Android › FCM V1 key); without them the app falls back to its on-phone edition reminder.
