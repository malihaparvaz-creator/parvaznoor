// Parvaz Noor — Notification system
// Uses Service Worker for background notifications (fires even when app is closed)
// Falls back to window.setTimeout when SW is unavailable

import type { PrayerTimeRow } from './prayer';
import type { PrayerName } from '@/store/parvaz';

export const canNotify = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!canNotify()) return 'denied';
  if (Notification.permission === 'default') {
    try { return await Notification.requestPermission(); } catch { return 'denied'; }
  }
  return Notification.permission;
};

const ADHAN_COPY: Record<PrayerName, { title: string; body: string }> = {
  Fajr:    { title: '🌅 Fajr — time to rise',           body: 'A gentle dawn awaits. Begin the day with light.' },
  Dhuhr:   { title: '☀️ Dhuhr — pause the noise',        body: 'Step away from the world for a moment.' },
  Asr:     { title: '🌤️ Asr — a mid-afternoon breath',   body: 'Reconnect before the day slips by.' },
  Maghrib: { title: '🌇 Maghrib — sunset prayer',         body: 'The sky is calling. Don\'t miss this moment.' },
  Isha:    { title: '🌙 Isha — close the day in peace',   body: 'End the day with stillness and light.' },
};

const STRICT_COPY: Record<PrayerName, { title: string; body: string }> = {
  Fajr:    { title: '⚠️ Fajr is slipping away',      body: 'It\'s been 30 minutes. Don\'t let the dawn pass without it.' },
  Dhuhr:   { title: '⚠️ Dhuhr still pending',        body: '30 minutes have passed. The world can wait — your soul cannot.' },
  Asr:     { title: '⚠️ Asr is waiting',             body: '30 minutes gone. A few minutes now is all it takes.' },
  Maghrib: { title: '⚠️ Maghrib window is closing',  body: 'Don\'t let the sunset pass you by. Pray now.' },
  Isha:    { title: '⚠️ Isha not yet prayed',        body: 'Close the day properly — even a short prayer counts.' },
};

// Fallback timers for when SW isn't available
let fallbackTimers: ReturnType<typeof setTimeout>[] = [];

const clearFallback = () => {
  fallbackTimers.forEach(clearTimeout);
  fallbackTimers = [];
};

const fireDirect = (title: string, body: string, tag: string) => {
  if (Notification.permission !== 'granted') return;
  try {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body, tag, icon: '/icon-192x192.png', badge: '/icon-32x32.png',
        vibrate: [120, 60, 120],
      } as NotificationOptions);
    }).catch(() => {
      new Notification(title, { body, tag, icon: '/icon-192x192.png' });
    });
  } catch {
    new Notification(title, { body, icon: '/icon-192x192.png' });
  }
};

/**
 * Schedule prayer notifications.
 * Prefers Service Worker (background) — falls back to setTimeout (foreground only).
 */
export const schedulePrayerNotifications = (
  rows: PrayerTimeRow[],
  isDone: (p: PrayerName) => boolean
) => {
  clearFallback();
  if (!canNotify() || Notification.permission !== 'granted') return;

  const now = Date.now();

  // Try SW first — works when app is closed
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      const prayers = rows.map(row => ({
        name: row.name,
        adhanAt: row.date.getTime(),
        strictAt: row.date.getTime() + 30 * 60 * 1000,
        adhanTitle: ADHAN_COPY[row.name].title,
        adhanBody:  ADHAN_COPY[row.name].body,
        strictTitle: STRICT_COPY[row.name].title,
        strictBody:  STRICT_COPY[row.name].body,
      }));
      reg.active?.postMessage({ type: 'SCHEDULE_PRAYERS', prayers });
    }).catch(() => {
      // SW not ready — use fallback
      scheduleFallback(rows, isDone, now);
    });
  } else {
    scheduleFallback(rows, isDone, now);
  }
};

const scheduleFallback = (
  rows: PrayerTimeRow[],
  isDone: (p: PrayerName) => boolean,
  now: number
) => {
  for (const row of rows) {
    const adhanAt = row.date.getTime();
    const strictAt = adhanAt + 30 * 60 * 1000;
    if (adhanAt > now) {
      fallbackTimers.push(setTimeout(() => {
        const a = ADHAN_COPY[row.name];
        fireDirect(a.title, a.body, `noor-${row.name}-adhan`);
      }, adhanAt - now));
    }
    if (strictAt > now) {
      fallbackTimers.push(setTimeout(() => {
        if (!isDone(row.name)) {
          const s = STRICT_COPY[row.name];
          fireDirect(s.title, s.body, `noor-${row.name}-strict`);
        }
      }, strictAt - now));
    }
  }
};

/** Call when user marks a prayer done — dismisses strict follow-up */
export const markPrayerDoneNotification = (prayer: PrayerName) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.active?.postMessage({ type: 'PRAYER_DONE', prayer });
    }).catch(() => {});
  }
};

export const cancelPrayerNotifications = () => {
  clearFallback();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.active?.postMessage({ type: 'SCHEDULE_PRAYERS', prayers: [] });
    }).catch(() => {});
  }
};
