// send-notifications: every 30 minutes (pg_cron). Delivery rules from the NotificationDelivery board as combined
// with the 10-09 settings (docs/current-config.md, Notifications):
// - Morning Edition: one a day at the reader's time (6:00–9:00 IST) on their days; held until quiet hours end
//   (7:00). Plain text, never a headline.
// - Big stories: covered by ≥5 of the reader's sources (or 60%, whichever is lower) within 6 hours; once per story.
// - Topic and source alerts: only what the reader ticked, with the publisher's own headline, quoted exactly.
// - Papers & Reports: a Sunday note at edition time.
// - Big story + topic + source alerts share the reader's daily cap (1/3/5). Quiet hours (22:00–07:00) hold
//   alerts; nothing is urgent. Guests get the edition only.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

type Notify = {
  all: boolean;
  edition: boolean;
  time: string;
  days: string[];
  quiet: boolean;
  big: boolean;
  papers: boolean;
  alerts: boolean;
  alertTopics: string[];
  alertSources: string[];
  cap: number;
  sound: boolean;
};
type Target = {
  id: string;
  user_id: string | null;
  kind: 'web' | 'expo';
  token: string;
  web_keys: { p256dh: string; auth: string } | null;
  notify: Notify;
  sources: string[];
  first_seen: number | null;
  sent_today: number;
  sent_on: string | null;
};
type Message = { title: string; body: string; open: string; key: string; counts: boolean };

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY');
if (VAPID_PUBLIC && VAPID_PRIVATE) webpush.setVapidDetails('mailto:notifications@unedited.app', VAPID_PUBLIC, VAPID_PRIVATE);

const DAY_CODES = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
const IST = 330 * 60_000;

/** Morning Edition is built at 06:00 IST (00:30 UTC). Same count as src/data/sample.ts editionNumber. */
const editionIndex = (ms: number) => Math.floor((ms - 30 * 60_000) / 86_400_000);
const editionNumber = (first: number, now: number) => Math.max(1, editionIndex(now) - editionIndex(first) + 1);

function istParts(now: number) {
  const d = new Date(now + IST);
  return { day: DAY_CODES[d.getUTCDay()], minutes: d.getUTCHours() * 60 + d.getUTCMinutes(), date: d.toISOString().slice(0, 10) };
}

/** Quiet hours end at 7:00; an edition due inside them arrives then. */
function editionMinutes(n: Notify) {
  const [h, m] = n.time.split(':').map(Number);
  const at = h * 60 + m;
  return n.quiet && at < 7 * 60 ? 7 * 60 : at;
}

async function deliver(t: Target, m: Message) {
  if (t.kind === 'web') {
    if (!VAPID_PUBLIC || !t.web_keys) return false;
    try {
      await webpush.sendNotification(
        { endpoint: t.token, keys: t.web_keys },
        JSON.stringify({ title: m.title, body: m.body, open: m.open, tag: m.key }),
        { TTL: 6 * 3600 },
      );
      return true;
    } catch (e) {
      // Gone: the browser dropped the subscription.
      if ((e as { statusCode?: number }).statusCode === 410 || (e as { statusCode?: number }).statusCode === 404)
        await db.from('push_targets').delete().eq('id', t.id);
      return false;
    }
  }
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ to: t.token, title: m.title, body: m.body, data: { open: m.open }, sound: t.notify.sound ? 'default' : null, channelId: 'default' }),
  });
  const json = await res.json().catch(() => null);
  if (json?.data?.details?.error === 'DeviceNotRegistered') await db.from('push_targets').delete().eq('id', t.id);
  return res.ok && json?.data?.status === 'ok';
}

Deno.serve(async (req) => {
  // Only the scheduler may run this: it sends the CRON_SECRET (function secret = Vault 'cron_secret').
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`)
    return new Response('Forbidden', { status: 403 });
  const now = Date.now();
  const ist = istParts(now);
  const quiet = ist.minutes >= 22 * 60 || ist.minutes < 7 * 60;
  const { data: targets } = await db.from('push_targets').select('*');
  const sent: Record<string, number> = { edition: 0, big: 0, alert: 0, papers: 0 };

  // Recent stories for alerts and Big stories.
  const since6h = new Date(now - 6 * 3_600_000).toISOString();
  const since30m = new Date(now - 35 * 60_000).toISOString();
  const { data: recent } = await db
    .from('articles')
    .select('id, source_id, title, topic, group_id, published_at')
    .gte('published_at', since6h)
    .order('published_at', { ascending: false })
    .limit(2000);

  for (const t of (targets ?? []) as Target[]) {
    const n = t.notify;
    if (!n?.all) continue;
    const { data: already } = await db.from('sent_alerts').select('key').eq('target_id', t.id).gte('sent_at', new Date(now - 7 * 86_400_000).toISOString());
    const done = new Set((already ?? []).map((r) => r.key));
    let today = t.sent_on === ist.date ? t.sent_today : 0;
    const due: Message[] = [];

    // Morning Edition: the half-hour slot that contains the reader's (quiet-adjusted) time.
    const at = editionMinutes(n);
    if (n.edition && n.days.includes(ist.day) && ist.minutes >= at && ist.minutes < at + 30 && !done.has(`edition:${ist.date}`)) {
      due.push({
        title: t.user_id && t.first_seen ? `Morning Edition Nº ${editionNumber(t.first_seen, now)} is ready` : 'Your morning edition is ready',
        body: 'Tap to read today’s stories from the outlets you chose.',
        open: '/home',
        key: `edition:${ist.date}`,
        counts: false,
      });
      // Papers & Reports: Sunday, with the edition.
      if (t.user_id && n.papers && ist.day === 'Su' && !done.has(`papers:${ist.date}`)) {
        const { count } = await db
          .from('articles')
          .select('id, sources!inner(paper_label)', { count: 'exact', head: true })
          .not('sources.paper_label', 'is', null)
          .gte('published_at', new Date(now - 7 * 86_400_000).toISOString());
        if (count)
          due.push({
            title: 'Papers & Reports this week',
            body: `${count} new ${count === 1 ? 'paper or report' : 'papers and reports'} from your sources.`,
            open: '/search?q=papers',
            key: `papers:${ist.date}`,
            counts: false,
          });
      }
    }

    // Signed-in alerts, held during quiet hours.
    if (t.user_id && !quiet) {
      const mine = (recent ?? []).filter((a) => t.sources.includes(a.source_id));
      if (n.big) {
        const need = Math.max(2, Math.min(5, Math.ceil(t.sources.length * 0.6)));
        const byGroup = new Map<string, { sources: Set<string>; first: (typeof mine)[number] }>();
        for (const a of mine) {
          if (!a.group_id) continue;
          const g = byGroup.get(a.group_id) ?? { sources: new Set(), first: a };
          g.sources.add(a.source_id);
          byGroup.set(a.group_id, g);
        }
        for (const [groupId, g] of byGroup)
          if (g.sources.size >= need && !done.has(`big:${groupId}`))
            due.push({
              title: `Big story · covered by ${g.sources.size} of your sources`,
              body: `“${g.first.title}”`,
              open: `/article/${g.first.id}`,
              key: `big:${groupId}`,
              counts: true,
            });
      }
      if (n.alerts)
        for (const a of mine)
          if (a.published_at >= since30m && (n.alertSources.includes(a.source_id) || n.alertTopics.includes(a.topic)) && !done.has(`alert:${a.id}`))
            due.push({ title: a.topic, body: `“${a.title}”`, open: `/article/${a.id}`, key: `alert:${a.id}`, counts: true });
    }

    for (const m of due) {
      if (m.counts && today >= (n.cap || 3)) continue;
      if (!(await deliver(t, m))) continue;
      await db.from('sent_alerts').insert({ target_id: t.id, key: m.key });
      if (m.counts) today++;
      sent[m.key.split(':')[0]]++;
    }
    await db.from('push_targets').update({ sent_today: today, sent_on: ist.date }).eq('id', t.id);
  }

  return new Response(JSON.stringify({ ist, sent }), { headers: { 'content-type': 'application/json' } });
});
