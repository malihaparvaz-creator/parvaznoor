import { useState } from 'react';
import { useParvaz, CalcMethod, Madhab } from '@/store/parvaz';
import { reverseGeocode, geocode } from '@/lib/prayer';
import { MapPin, Loader2, RotateCcw, Bell, BellOff, Globe, Moon, Clock } from 'lucide-react';
import { toast } from 'sonner';

const methods: { value: CalcMethod; label: string; description: string }[] = [
  { value: 'MWL', label: 'Muslim World League', description: 'Default — works globally' },
  { value: 'ISNA', label: 'ISNA', description: 'North America' },
  { value: 'Egypt', label: 'Egyptian Authority', description: 'Africa, Levant' },
  { value: 'Makkah', label: 'Umm al-Qura, Makkah', description: 'Saudi Arabia' },
  { value: 'Karachi', label: 'Karachi', description: 'South Asia' },
  { value: 'Tehran', label: 'Tehran', description: 'Iran, Shia' },
];

export const Settings = () => {
  const { settings, updateSettings, reset, resetXpAndStreak, resetPrayerHistory, resetDhikr, resetBookmarks, resetQuranProgress, xp, streak, history, dhikr, bookmarks } = useParvaz();
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const detectLocation = () => {
    if (!('geolocation' in navigator)) return toast.error('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const meta = await reverseGeocode(latitude, longitude);
        updateSettings({ location: { latitude, longitude, ...meta } });
        toast.success('Location updated', { description: meta.city ?? `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` });
        setLocating(false);
      },
      () => { toast.error('Could not get location'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const searchCity = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const loc = await geocode(query);
    setSearching(false);
    if (!loc) return toast.error('City not found');
    updateSettings({ location: loc });
    setQuery('');
    toast.success('Location set', { description: `${loc.city ?? ''}${loc.country ? `, ${loc.country}` : ''}` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
        <h1 className="font-display text-4xl md:text-5xl">Make it <span className="gold-text">yours</span></h1>
        <p className="text-muted-foreground text-sm mt-1">{xp} XP · {streak}-day streak</p>
      </header>

      {/* Location */}
      <Section title="Location" icon={<MapPin className="w-4 h-4" />}>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current</span>
            <span className="text-foreground/90">
              {settings.location
                ? `${settings.location.city ?? '—'}${settings.location.country ? `, ${settings.location.country}` : ''}`
                : 'Not set'}
            </span>
          </div>
          <button
            onClick={detectLocation}
            disabled={locating}
            className="w-full glass rounded-2xl py-3 inline-flex items-center justify-center gap-2 text-sm hover:bg-secondary/40 transition-colors"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            Detect automatically
          </button>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchCity()}
              placeholder="Search city (e.g. Istanbul)"
              className="flex-1 glass rounded-2xl px-4 py-3 text-sm bg-transparent placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              onClick={searchCity}
              disabled={searching}
              className="px-4 rounded-2xl bg-gradient-gold text-primary-foreground text-sm font-medium shadow-glow"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set'}
            </button>
          </div>
        </div>
      </Section>

      {/* Calculation method */}
      <Section title="Prayer time calculation" icon={<Globe className="w-4 h-4" />}>
        <div className="grid gap-2">
          {methods.map((m) => {
            const active = settings.calcMethod === m.value;
            return (
              <button
                key={m.value}
                onClick={() => updateSettings({ calcMethod: m.value })}
                className={`text-left rounded-2xl px-4 py-3 transition-all duration-300 ${
                  active ? 'bg-gradient-gold text-primary-foreground shadow-glow' : 'glass hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{m.label}</span>
                  {active && <span className="text-[10px] uppercase tracking-widest">selected</span>}
                </div>
                <p className={`text-xs mt-0.5 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{m.description}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Madhab */}
      <Section title="Madhab (Asr calculation)" icon={<Moon className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-2">
          {(['Shafi', 'Hanafi'] as Madhab[]).map((m) => {
            const active = settings.madhab === m;
            return (
              <button
                key={m}
                onClick={() => updateSettings({ madhab: m })}
                className={`rounded-2xl py-3 text-sm transition-all ${
                  active ? 'bg-gradient-gold text-primary-foreground shadow-glow' : 'glass'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {settings.madhab === 'Shafi' ? 'Asr when shadow = object length (Shafi/Maliki/Hanbali).' : 'Asr when shadow = 2× object length (Hanafi).'}
        </p>
      </Section>

      {/* Reading preferences */}
      <Section title="Reading" icon={<Bell className="w-4 h-4" />}>
        <div className="space-y-3">
          <Row label="Show translation">
            <Toggle on={settings.showTranslation} onChange={(v) => updateSettings({ showTranslation: v })} />
          </Row>
          <Row label="Arabic size">
            <div className="flex gap-1">
              {(['sm', 'md', 'lg'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateSettings({ arabicSize: s })}
                  className={`px-3 py-1.5 rounded-full text-xs ${
                    settings.arabicSize === s ? 'bg-gradient-gold text-primary-foreground' : 'glass'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Translation">
            <select
              value={settings.translationEdition}
              onChange={(e) => updateSettings({ translationEdition: e.target.value })}
              className="glass rounded-full px-3 py-1.5 text-xs bg-transparent"
            >
              <option value="en.sahih">Saheeh International</option>
              <option value="en.pickthall">Pickthall</option>
              <option value="en.yusufali">Yusuf Ali</option>
              <option value="ur.jalandhry">Urdu — Jalandhry</option>
              <option value="id.indonesian">Indonesian</option>
              <option value="tr.diyanet">Turkish — Diyanet</option>
              <option value="fr.hamidullah">French — Hamidullah</option>
            </select>
          </Row>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={settings.notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}>
        <Row label="Gentle prayer reminders">
          <Toggle on={settings.notifications} onChange={(v) => updateSettings({ notifications: v })} />
        </Row>
      </Section>

      {/* Reset */}
      <Section title="Reset & Clear" icon={<RotateCcw className="w-4 h-4" />}>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">Reset specific data without affecting everything else.</p>

          <ResetButton label="Reset XP & Streak" desc="Clears XP, level progress and streak count" onConfirm={() => { resetXpAndStreak(); toast.success('XP & streak reset'); }} />
          <ResetButton label="Reset Prayer History" desc="Clears today's prayers and all prayer logs" onConfirm={() => { resetPrayerHistory(); toast.success('Prayer history cleared'); }} />
          <ResetButton label="Reset Dhikr History" desc="Deletes all saved dhikr sessions" onConfirm={() => { resetDhikr(); toast.success('Dhikr history cleared'); }} />
          <ResetButton label="Reset Bookmarks" desc="Removes all bookmarked ayahs and unlocked content" onConfirm={() => { resetBookmarks(); toast.success('Bookmarks cleared'); }} />
          <ResetButton label="Reset Quran Progress" desc="Clears reading time and progress" onConfirm={() => { resetQuranProgress(); toast.success('Quran progress reset'); }} />

          <div className="pt-2 border-t border-border/30">
            <ResetButton
              label="Reset Everything"
              desc="Wipes all data — XP, prayers, dhikr, bookmarks, streak"
              danger
              onConfirm={() => { reset(); toast.success('All data reset', { description: 'A fresh beginning.' }); }}
            />
          </div>
        </div>
      </Section>

      <p className="text-center text-xs text-muted-foreground italic pt-2">
        "Allah is gentle and loves gentleness in all matters." — Sahih Muslim
      </p>
    </div>
  );
};

const ResetButton = ({ label, desc, onConfirm, danger = false }: {
  label: string; desc: string; onConfirm: () => void; danger?: boolean;
}) => (
  <button
    onClick={() => { if (confirm(desc + '\n\nAre you sure?')) onConfirm(); }}
    className={`w-full text-left rounded-2xl px-4 py-3 transition-colors border text-sm ${
      danger
        ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
        : 'glass hover:bg-secondary/40 border-border/30'
    }`}
  >
    <p className="font-medium">{label}</p>
    <p className={`text-xs mt-0.5 ${danger ? 'text-destructive/70' : 'text-muted-foreground'}`}>{desc}</p>
  </button>
);

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <section className="glass rounded-3xl p-5 md:p-6 animate-fade-up">
    <h3 className="font-display text-xl flex items-center gap-2 mb-4 text-foreground/90">
      <span className="text-primary/80">{icon}</span> {title}
    </h3>
    {children}
  </section>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm text-foreground/85">{label}</span>
    {children}
  </div>
);

const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!on)}
    className={`w-11 h-6 rounded-full transition-colors relative ${on ? 'bg-gradient-gold' : 'bg-muted'}`}
    aria-pressed={on}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
  </button>
);
