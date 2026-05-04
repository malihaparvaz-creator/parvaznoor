import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParvaz, getLevel, UNLOCKS, PrayerName } from '@/store/parvaz';
import { computePrayerTimes, getNextPrayerFrom, formatCountdown } from '@/lib/prayer';
import { schedulePrayerNotifications, cancelPrayerNotifications, requestNotificationPermission, canNotify } from '@/lib/notify';
import { todayReminder } from '@/data/content';
import { XpRing } from '@/components/XpRing';
import { 
  Flame, 
  BookOpen, 
  Moon, 
  Sparkles, 
  Compass, 
  Lock, 
  ArrowRight, 
  Settings as SettingsIcon,
  Repeat2,          // ← Added
  CalendarDays      // ← Added
} from 'lucide-react';


const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Peaceful night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 20) return 'Good evening';
  return 'Peaceful night';
};

export const Home = () => {
  const { xp, streak, today, settings, touchStreak, updateSettings } = useParvaz();
  const [, setTick] = useState(0);

  useEffect(() => {
    touchStreak();
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [touchStreak]);

  // Auto-detect location on first launch so prayer times are accurate immediately.
  useEffect(() => {
    if (settings.location || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const { reverseGeocode } = await import('@/lib/prayer');
        const meta = await reverseGeocode(latitude, longitude);
        updateSettings({ location: { latitude, longitude, ...meta } });
      },
      () => { /* user declined — they can set manually in Settings */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, [settings.location, updateSettings]);


  const prayers = useMemo(
    () => computePrayerTimes(settings.location, settings.calcMethod, settings.madhab),
    [settings.location, settings.calcMethod, settings.madhab, today.date]
  );
  const next = getNextPrayerFrom(prayers, settings.location, settings.calcMethod, settings.madhab);
  const reminder = todayReminder();
  const completedToday = Object.values(today.prayers).filter(Boolean).length;
  const { next: nextLvl, progress } = getLevel(xp);

  // Keep an always-fresh reference to today's prayer-completion map so the
  // strict 30-min follow-up notification can check the latest state at fire time.
  const prayersDoneRef = useRef(today.prayers);
  useEffect(() => { prayersDoneRef.current = today.prayers; }, [today.prayers]);

  // (Re)schedule local prayer notifications whenever inputs change.
  useEffect(() => {
    if (!settings.notifications || !canNotify()) {
      cancelPrayerNotifications();
      return;
    }
    let cancelled = false;
    (async () => {
      const perm = await requestNotificationPermission();
      if (cancelled || perm !== 'granted') return;
      schedulePrayerNotifications(prayers, (p: PrayerName) => !!prayersDoneRef.current[p]);
    })();
    return () => {
      cancelled = true;
      cancelPrayerNotifications();
    };
  }, [prayers, settings.notifications]);


  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-start justify-between gap-3 animate-fade-up" style={{ animationDelay: '50ms' }}>
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{greeting()}</p>
          <h1 className="font-display text-4xl md:text-5xl">As-salāmu <span className="gold-text">ʿalaykum</span></h1>
          <p className="text-muted-foreground text-sm">
            {settings.location?.city ? `${settings.location.city} · ` : ''}A small step today is enough.
          </p>
        </div>
        <Link to="/settings" className="glass rounded-full w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Settings">
          <SettingsIcon className="w-4 h-4" />
        </Link>
      </header>

      <section className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-dawn blur-3xl opacity-60 animate-breathe" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.25em] text-primary/80 mb-2">Next prayer</p>
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-4xl md:text-5xl">{next.prayer.name}</h2>
              <span className="text-muted-foreground text-lg">{next.prayer.time}</span>
            </div>
            <p className="mt-3 text-sm text-foreground/70">in <span className="text-primary font-medium">{formatCountdown(next.msUntil)}</span></p>
          </div>
          <XpRing xp={xp} />
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 md:gap-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <Stat icon={<Flame className="w-4 h-4" />} label="Streak" value={`${streak}d`} accent />
        <Stat icon={<Moon className="w-4 h-4" />} label="Salah" value={`${completedToday}/5`} />
        <Stat icon={<BookOpen className="w-4 h-4" />} label="Quran" value={`${today.quranMinutes}m`} />
      </section>

      <section className="glass rounded-3xl p-6 md:p-8 relative overflow-hidden animate-fade-up" style={{ animationDelay: '280ms' }}>
        <div className="absolute top-4 right-4 text-primary/30 text-6xl font-display leading-none select-none">"</div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Reminder of the day</p>
        <p className="font-display text-2xl md:text-3xl leading-snug text-foreground/95">{reminder.text}</p>
        <p className="text-xs text-primary/80 mt-4 tracking-wide">— {reminder.source}</p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-fade-up" style={{ animationDelay: '360ms' }}>
        <QuickCard to="/quran" icon={<BookOpen />} title="Quran" subtitle="All 114 surahs" />
        <QuickCard to="/qibla" icon={<Compass />} title="Qibla" subtitle="Find direction" />
        <QuickCard to="/explorer" icon={<Sparkles />} title="Ayah Explorer" subtitle={xp >= UNLOCKS.ayahExplorer ? 'Reflect' : `Unlocks at ${UNLOCKS.ayahExplorer} XP`} locked={xp < UNLOCKS.ayahExplorer} />
        <QuickCard to="/stories" icon={<Moon />} title="Stories" subtitle={xp >= UNLOCKS.stories ? 'Discover' : `Unlocks at ${UNLOCKS.stories} XP`} locked={xp < UNLOCKS.stories} />
        <QuickCard to="/dhikr" icon={<Repeat2 />} title="Dhikr" subtitle="Remember Allah" />
        <QuickCard to="/calendar" icon={<CalendarDays />} title="Calendar" subtitle="Hijri dates & events" />
      </section>

      <section className="animate-fade-up" style={{ animationDelay: '440ms' }}>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display text-xl">Today's Salah</h3>
          <Link to="/salah" className="text-xs text-primary/90 inline-flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="glass rounded-2xl divide-y divide-border/50">
          {prayers.map((p) => (
            <div key={p.name} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${today.prayers[p.name] ? 'bg-primary shadow-glow' : 'bg-muted'}`} />
                <span className={today.prayers[p.name] ? 'text-foreground' : 'text-muted-foreground'}>{p.name}</span>
              </div>
              <span className="text-sm text-muted-foreground tabular-nums">{p.time}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: '520ms' }}>
        {Math.round(progress * 100)}% toward <span className="text-primary/90">{nextLvl.name}</span>
      </p>
    </div>
  );
};

const Stat = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) => (
  <div className="glass rounded-2xl px-4 py-3.5 flex flex-col gap-1">
    <span className={`flex items-center gap-1.5 text-xs ${accent ? 'text-primary' : 'text-muted-foreground'}`}>{icon} {label}</span>
    <span className="font-display text-2xl">{value}</span>
  </div>
);

const QuickCard = ({ to, icon, title, subtitle, locked }: { to: string; icon: React.ReactNode; title: string; subtitle: string; locked?: boolean }) => (
  <Link to={to} className="group glass rounded-2xl p-4 md:p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-elevated relative overflow-hidden">
    <div className="w-10 h-10 rounded-xl bg-gradient-dawn flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform duration-500">
      {locked ? <Lock className="w-4 h-4" /> : <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
    </div>
    <h4 className="font-display text-lg leading-tight">{title}</h4>
    <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
  </Link>
);
