/* Un:edited service worker: shows Web Push notifications (send-notifications) and opens the right page.
   Plain text only: the server sends the title and body exactly as they should appear. */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Un:edited', body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Un:edited', {
      body: data.body || '',
      icon: '/icon-192.png',
      // Android shows the badge as a mask in the status bar: it must be a single colour on transparent.
      badge: '/badge-96.png',
      tag: data.tag,
      data: { open: data.open || '/home' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data && event.notification.data.open ? event.notification.data.open : '/home', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) {
          w.navigate(url);
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
