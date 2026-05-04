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
let quranReminderTimer = null;

// Calculate ms until next 18:00 local time
function msUntilNext6pm() {
  const now = new Date();
  const target = new Date();
  target.setHours(18, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

function scheduleQuranReminderSW() {
  const ms = msUntilNext6pm();
  quranReminderTimer = setTimeout(() => {
    self.registration.showNotification('📖 Time for Quran', {
      body: 'Even 5 minutes of reflection can illuminate your evening.',
      icon: '/icon-192x192.png',
      badge: '/icon-32x32.png',
      tag: 'noor-quran-daily',
      vibrate: [100, 50, 100],
    });
    // Reschedule for tomorrow same time
    scheduleQuranReminderSW();
  }, ms);
}

self.addEventListener('message', e => {
  const msg = e.data;
  if (!msg?.type) return;

  if (msg.type === 'SCHEDULE_PRAYERS') {
    // Clear existing prayer timers
    prayerTimers.forEach((v, k) => { if (k !== 'quran') clearTimeout(v); });
    // Remove all non-done markers too
    const keys = [...prayerTimers.keys()];
    keys.forEach(k => { if (!k.endsWith('-done')) prayerTimers.delete(k); });

    const now = Date.now();
    for (const prayer of (msg.prayers || [])) {
      const preMs    = prayer.preAdhanAt - now;
      const adhanMs  = prayer.adhanAt    - now;
      const strictMs = prayer.strictAt   - now;

      // 5-min pre-adhan warning (only if not already done)
      if (preMs > 0 && preMs < 86400000) {
        const id = setTimeout(() => {
          if (!prayerTimers.get(`${prayer.name}-done`)) {
            self.registration.showNotification(prayer.preAdhanTitle, {
              body: prayer.preAdhanBody,
              icon: '/icon-192x192.png',
              badge: '/icon-32x32.png',
              tag: `noor-${prayer.name}-pre`,
              vibrate: [60, 30, 60],
            });
          }
        }, preMs);
        prayerTimers.set(`${prayer.name}-pre`, id);
      }

      // Adhan notification (always fires at prayer time)
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

      // 30-min strict follow-up (only if not marked done by then)
      if (strictMs > 0 && strictMs < 86400000) {
        const id = setTimeout(() => {
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
    // Mark done so strict follow-up won't fire
    prayerTimers.set(`${msg.prayer}-done`, true);
    // Cancel pending pre-adhan and strict timers
    const preId    = prayerTimers.get(`${msg.prayer}-pre`);
    const strictId = prayerTimers.get(`${msg.prayer}-strict`);
    if (preId)    clearTimeout(preId);
    if (strictId) clearTimeout(strictId);
    // Dismiss any already-shown notifications for this prayer
    self.registration.getNotifications({ tag: `noor-${msg.prayer}-pre` })
      .then(notifs => notifs.forEach(n => n.close()));
    self.registration.getNotifications({ tag: `noor-${msg.prayer}-strict` })
      .then(notifs => notifs.forEach(n => n.close()));
  }

  if (msg.type === 'SCHEDULE_QURAN_REMINDER') {
    if (quranReminderTimer) { clearTimeout(quranReminderTimer); quranReminderTimer = null; }
    if (msg.enabled) scheduleQuranReminderSW();
  }

  if (msg.type === 'SKIP_WAITING') self.skipWaiting();
});
