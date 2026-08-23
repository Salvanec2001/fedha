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
