import { saveToFirestore, loadFromFirestore } from '@/lib/firebase';
import { markPrayerDoneNotification } from '@/lib/notify';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type CalcMethod =
  | 'MWL'      // Muslim World League
  | 'ISNA'    // Islamic Society of North America
  | 'Egypt'   // Egyptian General Authority
  | 'Makkah'  // Umm al-Qura, Makkah
  | 'Karachi' // University of Islamic Sciences, Karachi
  | 'Tehran'  // Institute of Geophysics, Tehran
  | 'Jafari'; // Shia Ithna Ashari

export type Madhab = 'Shafi' | 'Hanafi';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface Settings {
  location: UserLocation | null;
  calcMethod: CalcMethod;
  madhab: Madhab;
  notifications: boolean;
  arabicSize: 'sm' | 'md' | 'lg';
  showTranslation: boolean;
  translationEdition: string; // alquran.cloud edition identifier
  reciter: string;
  hijriOffset: number; // -2..+2
}

export interface DhikrSession {
  id: string;
  name: string;
  target: number;       // e.g. 33, 99, 100
  count: number;        // completed count
  durationSeconds: number;
  completedAt: string;  // ISO
  sets: number;         // how many full target cycles completed
}

export interface DhikrState {
  sessions: DhikrSession[];
  totalCount: number;
}

/** In-progress counter state — persisted so crashes don't lose your place */
export interface ActiveDhikrDraft {
  presetName: string;    // matches PRESETS[n].name, or 'custom'
  customTarget: string;
  count: number;
  sets: number;
  elapsed: number;       // seconds already counted before last pause/close
}

interface DayRecord {
  date: string; // YYYY-MM-DD
  prayers: Record<PrayerName, boolean>;
  quranMinutes: number;
  storiesRead: string[];
}

interface ParvazState {
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  bookmarks: string[];          // "surah:ayah"
  unlockedAyahs: string[];      // explorer ayah keys
  unlockedStories: string[];    // story ids that user spent XP to open
  unlockedAyahCards: string[];  // explorer card ids spent XP to reveal
  today: DayRecord;
  history: DayRecord[];
  settings: Settings;
  dhikr: DhikrState;
  activeDhikrDraft: ActiveDhikrDraft | null;

  addXp: (amount: number) => void;
  spendXp: (amount: number) => boolean;
  togglePrayer: (p: PrayerName) => void;
  addQuranMinutes: (min: number) => void;
  toggleBookmark: (key: string) => void;
  unlockAyah: (key: string) => void;
  unlockStory: (id: string, cost: number) => boolean;
  unlockAyahCard: (id: string, cost: number) => boolean;
  markStoryRead: (id: string) => void;
  touchStreak: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  saveDhikrSession: (session: DhikrSession) => void;
  deleteDhikrSession: (id: string) => void;
  setActiveDhikrDraft: (draft: ActiveDhikrDraft | null) => void;
  checkDailyReset: () => void;
  resetDhikr: () => void;
  resetPrayerHistory: () => void;
  resetXpAndStreak: () => void;
  resetBookmarks: () => void;
  resetQuranProgress: () => void;
  reset: () => void;
}

const todayKey = () => new Date().toISOString().slice(0, 10);

const emptyDay = (): DayRecord => ({
  date: todayKey(),
  prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false },
  quranMinutes: 0,
  storiesRead: [],
});

const defaultSettings: Settings = {
  location: null,
  calcMethod: 'MWL',
  madhab: 'Shafi',
  notifications: true,
  arabicSize: 'md',
  showTranslation: true,
  translationEdition: 'en.sahih',
  reciter: 'ar.alafasy',
  hijriOffset: 0,
};

export const useParvaz = create<ParvazState>()(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      lastActiveDate: null,
      bookmarks: [],
      unlockedAyahs: [],
      unlockedStories: [],
      unlockedAyahCards: [],
      today: emptyDay(),
      history: [],
      settings: defaultSettings,
      dhikr: { sessions: [], totalCount: 0 },
      activeDhikrDraft: null,

      addXp: (amount) => {
        get().touchStreak();
        set((s) => ({ xp: s.xp + amount }));
      },

      spendXp: (amount) => {
        if (get().xp < amount) return false;
        set((s) => ({ xp: s.xp - amount }));
        return true;
      },

      togglePrayer: (p) => {
        const t = get().today;
        const wasDone = t.prayers[p];
        const prayers = { ...t.prayers, [p]: !wasDone };
        set({ today: { ...t, prayers } });
        if (!wasDone) {
          get().addXp(15);
          // Tell the SW to cancel the 30-min strict follow-up for this prayer
          markPrayerDoneNotification(p);
        }
      },

      addQuranMinutes: (min) => {
        const t = get().today;
        set({ today: { ...t, quranMinutes: t.quranMinutes + min } });
        get().addXp(min * 5);
      },

      toggleBookmark: (key) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(key)
            ? s.bookmarks.filter((b) => b !== key)
            : [...s.bookmarks, key],
        })),

      unlockAyah: (key) =>
        set((s) => ({
          unlockedAyahs: s.unlockedAyahs.includes(key) ? s.unlockedAyahs : [...s.unlockedAyahs, key],
        })),

      unlockStory: (id, cost) => {
        const s = get();
        if (s.unlockedStories.includes(id)) return true;
        if (s.xp < cost) return false;
        set({ xp: s.xp - cost, unlockedStories: [...s.unlockedStories, id] });
        return true;
      },

      unlockAyahCard: (id, cost) => {
        const s = get();
        if (s.unlockedAyahCards.includes(id)) return true;
        if (s.xp < cost) return false;
        set({ xp: s.xp - cost, unlockedAyahCards: [...s.unlockedAyahCards, id] });
        return true;
      },

      markStoryRead: (id) => {
        const t = get().today;
        if (t.storiesRead.includes(id)) return;
        set({ today: { ...t, storiesRead: [...t.storiesRead, id] } });
        get().addXp(25);
      },

      touchStreak: () => {
        const last = get().lastActiveDate;
        const today = todayKey();
        if (last === today) return;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak = last === yesterday ? get().streak + 1 : 1;
        const t = get().today;
        if (t.date !== today) {
          set((s) => ({ history: [...s.history, t].slice(-30), today: emptyDay() }));
        }
        set({ streak: newStreak, lastActiveDate: today });
      },

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      saveDhikrSession: (session) => set((s) => ({
        activeDhikrDraft: null,   // clear in-progress draft on explicit save
        dhikr: {
          sessions: [session, ...s.dhikr.sessions].slice(0, 200),
          totalCount: s.dhikr.totalCount + session.count,
        },
      })),

      deleteDhikrSession: (id) => set((s) => ({
        dhikr: {
          ...s.dhikr,
          sessions: s.dhikr.sessions.filter(se => se.id !== id),
        },
      })),

      setActiveDhikrDraft: (draft) => set({ activeDhikrDraft: draft }),

      resetDhikr: () => set({ dhikr: { sessions: [], totalCount: 0 }, activeDhikrDraft: null }),

      checkDailyReset: () => {
        const today = todayKey();
        const t = get().today;
        if (t.date !== today) {
          // Archive previous day and start fresh — XP/streak untouched
          set((s) => ({
            history: [...s.history, t].slice(-30),
            today: emptyDay(),
          }));
        }
      },

      resetPrayerHistory: () => set((s) => ({
        today: { ...s.today, prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false } },
        history: [],
      })),

      resetXpAndStreak: () => set({ xp: 0, streak: 0, lastActiveDate: null }),

      resetBookmarks: () => set({ bookmarks: [], unlockedAyahs: [], unlockedAyahCards: [], unlockedStories: [] }),

      resetQuranProgress: () => set({ today: { ...emptyDay(), quranMinutes: 0 } }),

      reset: () =>
        set({
          xp: 0, streak: 0, lastActiveDate: null,
          bookmarks: [], unlockedAyahs: [], unlockedStories: [], unlockedAyahCards: [],
          today: emptyDay(), history: [],
        }),
    }),
    { name: 'parvaz-noor-v2' }
  )
);

// Firebase sync — debounced 2s after any state change
let _fbTimer: ReturnType<typeof setTimeout> | null = null;
useParvaz.subscribe((state) => {
  if (_fbTimer) clearTimeout(_fbTimer);
  _fbTimer = setTimeout(() => saveToFirestore(state), 2000);
});

// Load from Firebase on first app open (cross-device sync)
// Only runs once per session
if (typeof window !== 'undefined' && !sessionStorage.getItem('parvaz-noor-synced')) {
  sessionStorage.setItem('parvaz-noor-synced', '1');
  loadFromFirestore().then(remote => {
    if (remote) {
      useParvaz.setState(remote);
    }
  }).catch(() => {});
}

export const LEVELS = [
  { name: 'Seeker', min: 0 },
  { name: 'Wayfarer', min: 100 },
  { name: 'Devotee', min: 300 },
  { name: 'Reflector', min: 600 },
  { name: 'Illuminated', min: 1200 },
  { name: 'Companion of Light', min: 2000 },
];

export const getLevel = (xp: number) => {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? LEVELS[i];
    }
  }
  const span = next.min - current.min || 1;
  const progress = Math.min(1, (xp - current.min) / span);
  return { current, next, progress };
};

// Section-level unlock thresholds
export const UNLOCKS = {
  ayahExplorer: 500,
  stories: 1000,
  qibla: 0, // always available
};
