import { useEffect, useMemo, useState } from 'react';
import { useParvaz } from '@/store/parvaz';
import { computePrayerTimes, getNextPrayerFrom, formatCountdown } from '@/lib/prayer';
import { requestNotificationPermission, canNotify } from '@/lib/notify';
import { Check, Bell } from 'lucide-react';
import { toast } from 'sonner';

export const Salah = () => {
  const { today, togglePrayer, settings, updateSettings } = useParvaz();

  const enableReminders = async () => {
    if (!canNotify()) {
      toast.error('This device doesn’t support notifications');
      return;
    }
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      updateSettings({ notifications: true });
      toast.success('Gentle reminders enabled', {
        description: 'You’ll be nudged at each prayer + a stricter follow-up after 30 min if not marked done.',
      });
    } else if (perm === 'denied') {
      toast.error('Permission blocked', { description: 'Enable notifications for this site in your browser settings.' });
    }
  };
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const prayers = useMemo(
    () => computePrayerTimes(settings.location, settings.calcMethod, settings.madhab),
    [settings.location, settings.calcMethod, settings.madhab]
  );
  const next = getNextPrayerFrom(prayers, settings.location, settings.calcMethod, settings.madhab);
  const completed = Object.values(today.prayers).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Salah</p>
        <h1 className="font-display text-4xl md:text-5xl">Five gentle <span className="gold-text">pauses</span></h1>
        <p className="text-muted-foreground text-sm mt-1">
          {completed}/5 completed · 15 XP each{settings.location?.city ? ` · ${settings.location.city}` : ''}
        </p>
      </header>

      <section className="glass-strong rounded-3xl p-6 relative overflow-hidden animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-gradient-dawn blur-3xl opacity-60 animate-breathe" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80">Up next</p>
          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="font-display text-4xl">{next.prayer.name}</h2>
            <span className="text-muted-foreground">{next.prayer.time}</span>
          </div>
          <p className="text-sm text-foreground/70 mt-1">in {formatCountdown(next.msUntil)}</p>
          <button
            onClick={settings.notifications ? () => updateSettings({ notifications: false }) : enableReminders}
            className="mt-4 inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-full glass text-foreground/80 hover:text-foreground transition-colors"
          >
            <Bell className="w-3.5 h-3.5" /> {settings.notifications ? 'Gentle reminders on · tap to mute' : 'Enable gentle reminders'}
          </button>
        </div>
      </section>

      <section className="space-y-3 animate-fade-up" style={{ animationDelay: '180ms' }}>
        {prayers.map((p) => {
          const done = today.prayers[p.name];
          const isNext = next.prayer.name === p.name;
          return (
            <button
              key={p.name}
              onClick={() => togglePrayer(p.name)}
              className={`w-full glass rounded-2xl p-5 flex items-center gap-4 text-left transition-all duration-500 hover:-translate-y-0.5 ${isNext ? 'ring-1 ring-primary/40 shadow-glow' : ''}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${done ? 'bg-gradient-gold text-primary-foreground shadow-glow' : 'glass text-muted-foreground'}`}>
                {done ? <Check className="w-5 h-5" strokeWidth={2.5} /> : <span className="font-display text-lg">{p.name[0]}</span>}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-2xl leading-tight">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{p.time}{isNext && !done ? ' · upcoming' : ''}</p>
              </div>
              <span className={`text-xs ${done ? 'text-primary' : 'text-muted-foreground'}`}>{done ? 'Completed · +15 XP' : 'Mark done'}</span>
            </button>
          );
        })}
      </section>

      <p className="text-center text-xs text-muted-foreground italic pt-2">
        "Indeed, prayer prohibits immorality and wrongdoing." — 29:45
      </p>
    </div>
  );
};
