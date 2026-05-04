import { Coordinates, CalculationMethod, PrayerTimes, Madhab as AdhanMadhab } from 'adhan';
// @ts-ignore - tz-lookup has no types
import tzlookup from 'tz-lookup';
import { CalcMethod, Madhab, PrayerName, UserLocation } from '@/store/parvaz';

export interface PrayerTimeRow {
  name: PrayerName;
  time: string; // "HH:MM" in the location's local timezone
  date: Date;   // absolute UTC instant
  tz: string;   // IANA timezone of the location
}

const safeTz = (lat: number, lon: number): string => {
  try { return tzlookup(lat, lon); }
  catch { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
};

const methodMap: Record<CalcMethod, () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>> = {
  MWL:    () => CalculationMethod.MuslimWorldLeague(),
  ISNA:   () => CalculationMethod.NorthAmerica(),
  Egypt:  () => CalculationMethod.Egyptian(),
  Makkah: () => CalculationMethod.UmmAlQura(),
  Karachi:() => CalculationMethod.Karachi(),
  Tehran: () => CalculationMethod.Tehran(),
  Jafari: () => CalculationMethod.Tehran(),
};

// Format an absolute Date as HH:MM in a specific IANA timezone.
const fmtInTz = (d: Date, tz: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const h = parts.find(p => p.type === 'hour')?.value ?? '00';
  const m = parts.find(p => p.type === 'minute')?.value ?? '00';
  return `${h}:${m}`;
};

// Default fallback location: Mecca
const FALLBACK: UserLocation = { latitude: 21.4225, longitude: 39.8262, city: 'Mecca' };

export const computePrayerTimes = (
  loc: UserLocation | null,
  method: CalcMethod = 'MWL',
  madhab: Madhab = 'Shafi',
  date: Date = new Date()
): PrayerTimeRow[] => {
  const useLoc = loc ?? FALLBACK;
  const tz = safeTz(useLoc.latitude, useLoc.longitude);
  const coords = new Coordinates(useLoc.latitude, useLoc.longitude);
  const params = methodMap[method]();
  params.madhab = madhab === 'Hanafi' ? AdhanMadhab.Hanafi : AdhanMadhab.Shafi;
  // Anchor to the calendar date as seen at the target location (handles users
  // viewing prayer times for a city in a different timezone).
  const localDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date); // YYYY-MM-DD
  const [y, m, d] = localDateStr.split('-').map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const pt = new PrayerTimes(coords, anchor, params);
  return [
    { name: 'Fajr',    date: pt.fajr,    time: fmtInTz(pt.fajr, tz),    tz },
    { name: 'Dhuhr',   date: pt.dhuhr,   time: fmtInTz(pt.dhuhr, tz),   tz },
    { name: 'Asr',     date: pt.asr,     time: fmtInTz(pt.asr, tz),     tz },
    { name: 'Maghrib', date: pt.maghrib, time: fmtInTz(pt.maghrib, tz), tz },
    { name: 'Isha',    date: pt.isha,    time: fmtInTz(pt.isha, tz),    tz },
  ];
};

export const getNextPrayerFrom = (
  rows: PrayerTimeRow[],
  loc: UserLocation | null,
  method: CalcMethod,
  madhab: Madhab
): { prayer: PrayerTimeRow; msUntil: number } => {
  const now = Date.now();
  for (const p of rows) {
    if (p.date.getTime() > now) return { prayer: p, msUntil: p.date.getTime() - now };
  }
  // tomorrow's Fajr
  const tomorrow = new Date(Date.now() + 86400000);
  const next = computePrayerTimes(loc, method, madhab, tomorrow);
  return { prayer: next[0], msUntil: next[0].date.getTime() - now };
};

export const formatCountdown = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
};

// ---------------- Qibla ----------------
// Bearing from given point to the Kaaba in Mecca (21.4225° N, 39.8262° E)
const KAABA = { lat: 21.4225, lon: 39.8262 };

export const qiblaBearing = (lat: number, lon: number): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA.lat);
  const Δλ = toRad(KAABA.lon - lon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

// Reverse-geocode helper (free, no key) — returns city/country
export const reverseGeocode = async (lat: number, lon: number): Promise<{ city?: string; country?: string }> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    return {
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.state,
      country: data.address?.country,
    };
  } catch {
    return {};
  }
};

// Forward-geocode by query
export const geocode = async (query: string): Promise<UserLocation | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    const { lat, lon, display_name } = data[0];
    const parts = display_name.split(', ');
    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      city: parts[0],
      country: parts[parts.length - 1],
    };
  } catch {
    return null;
  }
};
