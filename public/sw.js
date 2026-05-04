// Parvaz Noor — Service Worker
// Handles: offline caching + background prayer notifications

const CACHE = 'parvaz-noor-v1';
const PRECACHE = ['/', '/index.html', '/manifest.json', '/icon-192x192.png', '/icon-512x512.png'];

// Install
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {})));
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.url.includes('api.alquran.cloud') || e.request.url.includes('nominatim')) return;

  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && e.request.mode === 'navigate') {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      }
      return res;
    }).catch(() =>
      caches.match(e.request).then(cached =>
        cached || (e.request.mode === 'navigate' ? caches.match('/index.html') : new Response('Offline', { status: 503 }))
      )
    )
  );
});

// Notification click — open app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Scheduled prayer notifications from app
const prayerTimers = new Map();

self.addEventListener('message', e => {
  const msg = e.data;
  if (!msg?.type) return;

  if (msg.type === 'SCHEDULE_PRAYERS') {
    // Clear existing
    prayerTimers.forEach(id => clearTimeout(id));
    prayerTimers.clear();

    const now = Date.now();
    for (const prayer of (msg.prayers || [])) {
      const adhanMs = prayer.adhanAt - now;
      const strictMs = prayer.strictAt - now;

      if (adhanMs > 0 && adhanMs < 86400000) {
        const id = setTimeout(() => {
          self.registration.showNotification(prayer.adhanTitle, {
            body: prayer.adhanBody,
            icon: '/icon-192x192.png',
            badge: '/icon-32x32.png',
            tag: `noor-${prayer.name}-adhan`,
            vibrate: [120, 60, 120],
          });
        }, adhanMs);
        prayerTimers.set(`${prayer.name}-adhan`, id);
      }

      if (strictMs > 0 && strictMs < 86400000) {
        const id = setTimeout(() => {
          // App will send PRAYER_DONE messages — only fire if not done
          if (!prayerTimers.get(`${prayer.name}-done`)) {
            self.registration.showNotification(prayer.strictTitle, {
              body: prayer.strictBody,
              icon: '/icon-192x192.png',
              badge: '/icon-32x32.png',
              tag: `noor-${prayer.name}-strict`,
              requireInteraction: true,
              vibrate: [200, 100, 200],
            });
          }
        }, strictMs);
        prayerTimers.set(`${prayer.name}-strict`, id);
      }
    }
  }

  if (msg.type === 'PRAYER_DONE') {
    // Mark prayer done so strict follow-up won't fire
    prayerTimers.set(`${msg.prayer}-done`, true);
    // Also dismiss any pending strict notification
    self.registration.getNotifications({ tag: `noor-${msg.prayer}-strict` })
      .then(notifs => notifs.forEach(n => n.close()));
  }

  if (msg.type === 'SKIP_WAITING') self.skipWaiting();
});
