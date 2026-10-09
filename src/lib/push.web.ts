/** Web Push: a subscription from the service worker (public/sw.js) with the server's VAPID public key. */
export async function pushToken(): Promise<{ kind: 'web'; token: string; web_keys: { p256dh: string; auth: string } } | null> {
  const key = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key || typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  // Never prompt from here: only subscribe once the reader has allowed notifications in You › Notifications.
  if (Notification.permission !== 'granted') return null;
  const reg = await navigator.serviceWorker.register('/sw.js');
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(key) }));
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
  return { kind: 'web', token: json.endpoint, web_keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } };
}

function urlBase64ToBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
