// register-push: the app sends its push token (Expo on Android) or Web Push subscription with a snapshot of
// You › Notifications, whenever those settings change. Guests may register (edition only); the user id is only
// set from a verified session token, never from the request body.
import { createClient } from 'npm:@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const body = await req.json().catch(() => null);
  if (!body || (body.kind !== 'web' && body.kind !== 'expo') || typeof body.token !== 'string' || body.token.length > 2000)
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: cors });

  // Who is this? Only a valid session token links the device to an account.
  let userId: string | null = null;
  const jwt = req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (jwt) {
    const { data } = await db.auth.getUser(jwt);
    userId = data.user?.id ?? null;
  }

  if (body.remove) {
    await db.from('push_targets').delete().eq('token', body.token);
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  const notify = typeof body.notify === 'object' && body.notify ? body.notify : {};
  const { error } = await db.from('push_targets').upsert(
    {
      user_id: userId,
      kind: body.kind,
      token: body.token,
      web_keys: body.kind === 'web' ? body.web_keys ?? null : null,
      // Guests: edition only.
      notify: userId ? notify : { ...notify, big: false, papers: false, alerts: false },
      sources: userId && Array.isArray(body.sources) ? body.sources.slice(0, 200) : [],
      lang: ['en', 'hi', 'mr'].includes(body.lang) ? body.lang : 'en',
      first_seen: typeof body.first_seen === 'number' ? body.first_seen : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );
  return new Response(JSON.stringify({ ok: !error, error: error?.message }), { status: error ? 500 : 200, headers: cors });
});
