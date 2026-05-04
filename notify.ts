// Parvaz Noor — Notification system
// Uses Service Worker for background notifications (fires even when app is closed)
// Falls back to window.setTimeout when SW is unavailable
//
// Notification types:
//   1. Pre-adhan  — 5 min before each prayer
//   2. Adhan      — exactly at prayer time
//   3. Strict     — 30 min after prayer time if still not marked done
//   4. Quran      — daily at 18:00 local time

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

// ── Notification copy ──────────────────────────────────────────────────────

const PRE_ADHAN_COPY: Record<PrayerName, { title: string; body: string }> = {
  Fajr:    { title: '🌅 Fajr in 5 minutes',    body: 'Prepare for the dawn prayer. The best of sleep is the one that ends with remembrance.' },
  Dhuhr:   { title: '☀️ Dhuhr in 5 minutes',    body: 'Step away soon — a brief pause restores the heart.' },
  Asr:     { title: '🌤️ Asr in 5 minutes',      body: 'The afternoon prayer is almost here. Wrap up and prepare.' },
  Maghrib: { title: '🌇 Maghrib in 5 minutes',  body: 'Sunset is near. Take a moment before it arrives.' },
  Isha:    { title: '🌙 Isha in 5 minutes',      body: 'Almost time to close the day in peace.' },
};

const ADHAN_COPY: Record<PrayerName, { title: string; body: string }> = {
  Fajr:    { title: '🌅 Fajr — time to rise',          body: 'A gentle dawn awaits. Begin the day with light.' },
  Dhuhr:   { title: '☀️ Dhuhr — pause the noise',       body: 'Step away from the world for a moment.' },
  Asr:     { title: '🌤️ Asr — a mid-afternoon breath',  body: 'Reconnect before the day slips by.' },
  Maghrib: { title: '🌇 Maghrib — sunset prayer',        body: 'The sky is calling. Don\'t miss this moment.' },
  Isha:    { title: '🌙 Isha — close the day in peace',  body: 'End the day with stillness and light.' },
};

const STRICT_COPY: Record<PrayerName, { title: string; body: string }> = {
  Fajr:    { title: '⚠️ Fajr is slipping away',     body: 'It\'s been 30 minutes. Don\'t let the dawn pass without it.' },
  Dhuhr:   { title: '⚠️ Dhuhr still pending',       body: '30 minutes have passed. The world can wait — your soul cannot.' },
  Asr:     { title: '⚠️ Asr is waiting',            body: '30 minutes gone. A few minutes now is all it takes.' },
  Maghrib: { title: '⚠️ Maghrib window is closing', body: 'Don\'t let the sunset pass you by. Pray now.' },
  Isha:    { title: '⚠️ Isha not yet prayed',       body: 'Close the day properly — even a short prayer counts.' },
};

// ── Fallback timers ────────────────────────────────────────────────────────

let fallbackTimers: ReturnType<typeof setTimeout>[] = [];
let fallbackQuranTimer: ReturnType<typeof setTimeout> | null = null;

const clearFallback = () => {
  fallbackTimers.forEach(clearTimeout);
  fallbackTimers = [];
};

const fireDirect = (title: string, body: string, tag: string, requireInteraction = false) => {
  if (Notification.permission !== 'granted') return;
  try {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body, tag, icon: '/icon-192x192.png', badge: '/icon-32x32.png',
        vibrate: [120, 60, 120],
        requireInteraction,
      } as NotificationOptions);
    }).catch(() => {
      new Notification(title, { body, tag, icon: '/icon-192x192.png' });
    });
  } catch {
    new Notification(title, { body, icon: '/icon-192x192.png' });
  }
};

// ── Prayer notifications ───────────────────────────────────────────────────

/**
 * Schedule prayer notifications.
 * Sends three notifications per prayer: 5-min warning, adhan, strict follow-up.
 * Prefers Service Worker (background) — falls back to setTimeout (foreground only).
 */
export const schedulePrayerNotifications = (
  rows: PrayerTimeRow[],
  isDone: (p: PrayerName) => boolean
) => {
  clearFallback();
  if (!canNotify() || Notification.permission !== 'granted') return;

  const now = Date.now();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      const prayers = rows.map(row => ({
        name:          row.name,
        preAdhanAt:    row.date.getTime() - 5 * 60 * 1000,
        adhanAt:       row.date.getTime(),
        strictAt:      row.date.getTime() + 30 * 60 * 1000,
        preAdhanTitle: PRE_ADHAN_COPY[row.name].title,
        preAdhanBody:  PRE_ADHAN_COPY[row.name].body,
        adhanTitle:    ADHAN_COPY[row.name].title,
        adhanBody:     ADHAN_COPY[row.name].body,
        strictTitle:   STRICT_COPY[row.name].title,
        strictBody:    STRICT_COPY[row.name].body,
      }));
      reg.active?.postMessage({ type: 'SCHEDULE_PRAYERS', prayers });
    }).catch(() => {
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
    const preAdhanAt = row.date.getTime() - 5 * 60 * 1000;
    const adhanAt    = row.date.getTime();
    const strictAt   = adhanAt + 30 * 60 * 1000;

    if (preAdhanAt > now) {
      fallbackTimers.push(setTimeout(() => {
        if (!isDone(row.name)) {
          const c = PRE_ADHAN_COPY[row.name];
          fireDirect(c.title, c.body, `noor-${row.name}-pre`);
        }
      }, preAdhanAt - now));
    }
    if (adhanAt > now) {
      fallbackTimers.push(setTimeout(() => {
        const c = ADHAN_COPY[row.name];
        fireDirect(c.title, c.body, `noor-${row.name}-adhan`);
      }, adhanAt - now));
    }
    if (strictAt > now) {
      fallbackTimers.push(setTimeout(() => {
        if (!isDone(row.name)) {
          const c = STRICT_COPY[row.name];
          fireDirect(c.title, c.body, `noor-${row.name}-strict`, true);
        }
      }, strictAt - now));
    }
  }
};

// ── Quran reminder ─────────────────────────────────────────────────────────

/** Milliseconds until next 18:00 local time (today or tomorrow if already past) */
const msUntilNext6pm = (): number => {
  const now = new Date();
  const target = new Date();
  target.setHours(18, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
};

/**
 * Schedule (or cancel) the daily Quran reminder at 18:00.
 * Call this whenever notification settings change or on every app open.
 */
export const scheduleQuranReminder = (enabled: boolean) => {
  if (fallbackQuranTimer !== null) {
    clearTimeout(fallbackQuranTimer);
    fallbackQuranTimer = null;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.active?.postMessage({ type: 'SCHEDULE_QURAN_REMINDER', enabled });
    }).catch(() => {
      if (enabled) scheduleFallbackQuran();
    });
  } else if (enabled) {
    scheduleFallbackQuran();
  }
};

const scheduleFallbackQuran = () => {
  const ms = msUntilNext6pm();
  fallbackQuranTimer = setTimeout(() => {
    fireDirect(
      '📖 Time for Quran',
      'Even 5 minutes of reflection can illuminate your evening.',
      'noor-quran-daily'
    );
    // Reschedule for same time tomorrow
    scheduleFallbackQuran();
  }, ms);
};

// ── Mark done / cancel ─────────────────────────────────────────────────────

/** Call when user marks a prayer done — tells SW to cancel the strict follow-up */
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
