-- Every 30 minutes: fetch the news, then send whatever notifications are due.
-- Needs two Vault secrets, set once (SQL editor):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<a long random string>', 'cron_secret');
-- and the same random string as the functions' CRON_SECRET (supabase secrets set CRON_SECRET=...).

create or replace function public.call_function(name text) returns void language sql security definer as $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where vault.decrypted_secrets.name = 'project_url') || '/functions/v1/' || name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where vault.decrypted_secrets.name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
$$;

select cron.schedule('fetch-news', '*/30 * * * *', $$ select public.call_function('fetch-news') $$);
-- A few minutes later, so new stories are in before alerts go out. Editions go at :00 and :30 (IST times
-- 6:00 to 9:00 all fall on the half hour).
select cron.schedule('send-notifications', '2,32 * * * *', $$ select public.call_function('send-notifications') $$);
