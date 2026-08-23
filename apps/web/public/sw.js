// Minimal pass-through fetch handler — required by Chrome for the app to be
// considered "installable" as a PWA. No offline caching yet (keeps behavior
// identical to a normal page load); can be extended later.
self.addEventListener('fetch', () => {});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Fedha', body: 'You have a new notification.' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Fedha', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/dashboard'));
});
