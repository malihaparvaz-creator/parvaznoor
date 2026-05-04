import { useState, useEffect, useRef, useCallback } from 'react';
import { useParvaz, DhikrSession } from '@/store/parvaz';
import { Plus, Trash2, RotateCcw, Clock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

// ── Built-in dhikr presets ────────────────────────────────────────────────────
const PRESETS = [
  { name: 'Subḥānallāh', arabic: 'سُبْحَانَ اللّٰهِ', translation: 'Glory be to Allah', target: 33 },
  { name: 'Alḥamdulillāh', arabic: 'اَلْحَمْدُ لِلّٰهِ', translation: 'All praise is due to Allah', target: 33 },
  { name: 'Allāhu Akbar', arabic: 'اَللّٰهُ أَكْبَرُ', translation: 'Allah is the Greatest', target: 34 },
  { name: 'Lā ilāha illallāh', arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ', translation: 'There is no god but Allah', target: 100 },
  { name: 'Astaghfirullāh', arabic: 'أَسْتَغْفِرُ اللّٰهَ', translation: 'I seek forgiveness from Allah', target: 100 },
  { name: 'Ṣallā Allāhu ʿalayhī wa-sallam', arabic: 'صَلَّى اللّٰهُ عَلَيْهِ وَسَلَّمَ', translation: 'Darood Ibrahim', target: 100 },
  { name: 'Bismillāh', arabic: 'بِسْمِ اللّٰهِ', translation: 'In the name of Allah', target: 21 },
  { name: 'Ḥasbiyallāh', arabic: 'حَسْبِيَ اللّٰهُ', translation: 'Allah is sufficient for me', target: 7 },
  { name: 'Lā ḥawla wa-lā quwwata illā billāh', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ', translation: 'There is no power except with Allah', target: 99 },
];

function formatDuration(s: number) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export const Dhikr = () => {
  const { dhikr, saveDhikrSession, deleteDhikrSession } = useParvaz();

  // ── Active counter state ───────────────────────────────────────────────────
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [customTarget, setCustomTarget] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [count, setCount] = useState(0);
  const [sets, setSets] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const target = showCustom && customTarget
    ? Math.max(1, parseInt(customTarget) || 1)
    : selectedPreset.target;

  const progress = Math.min(count / target, 1);
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference * (1 - progress);

  // Timer tick
  useEffect(() => {
    if (!isActive) return;
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]);

  const setsRef = useRef(0);
  // keep setsRef in sync
  useEffect(() => { setsRef.current = sets; }, [sets]);

  const handleCount = useCallback(() => {
    if (!isActive) {
      setIsActive(true);
      setStartTime(Date.now());
    }
    setCount(prev => {
      const next = prev + 1;
      if (next >= target) {
        const newSets = setsRef.current + 1;
        setSets(newSets);
        setsRef.current = newSets;
        if ('vibrate' in navigator) navigator.vibrate([80, 40, 80]);
        toast.success(`Set ${newSets} complete! ${newSets * target} total`, { duration: 1500 });
        return 0;
      }
      if (next % 10 === 0 && 'vibrate' in navigator) navigator.vibrate(30);
      return next;
    });
  }, [isActive, target]);

  const handleSave = () => {
    const totalCount = sets * target + count;
    if (totalCount === 0) { toast.error('No counts to save'); return; }

    const session: DhikrSession = {
      id: `dhikr_${Date.now()}`,
      name: showCustom && customTarget ? `Custom (${target})` : selectedPreset.name,
      target,
      count: totalCount,
      durationSeconds: elapsed,
      completedAt: new Date().toISOString(),
      sets,
    };
    saveDhikrSession(session);
    // Reset
    setCount(0); setSets(0); setElapsed(0); setIsActive(false); setStartTime(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    toast.success('Dhikr saved. Jazākallāhu Khayran 🤲');
  };

  const handleReset = () => {
    setCount(0); setSets(0); setElapsed(0); setIsActive(false); setStartTime(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleDelete = (id: string) => {
    deleteDhikrSession(id);
    toast.success('Session deleted');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Dhikr</p>
        <h1 className="font-display text-4xl md:text-5xl">
          Remember <span className="gold-text">Allah</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {dhikr.totalCount.toLocaleString()} total counts · {dhikr.sessions.length} sessions
        </p>
      </header>

      {/* ── Preset selector ── */}
      <section className="glass rounded-3xl p-5 animate-fade-up space-y-3" style={{ animationDelay: '80ms' }}>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Choose Dhikr</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => {
            const active = !showCustom && selectedPreset.name === p.name;
            return (
              <button
                key={p.name}
                onClick={() => { setSelectedPreset(p); setShowCustom(false); handleReset(); }}
                className={`text-left rounded-2xl px-3 py-2.5 transition-all duration-300 ${active ? 'bg-gradient-gold text-primary-foreground shadow-glow' : 'glass hover:bg-secondary/40'}`}
              >
                <p className="text-xs font-medium leading-tight">{p.name}</p>
                <p className={`text-[10px] mt-0.5 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {p.target}×
                </p>
              </button>
            );
          })}
          <button
            onClick={() => { setShowCustom(true); handleReset(); }}
            className={`text-left rounded-2xl px-3 py-2.5 transition-all duration-300 ${showCustom ? 'bg-gradient-gold text-primary-foreground shadow-glow' : 'glass hover:bg-secondary/40'}`}
          >
            <p className="text-xs font-medium">Custom</p>
            <p className={`text-[10px] mt-0.5 ${showCustom ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>Set your own</p>
          </button>
        </div>

        {showCustom && (
          <input
            type="number"
            value={customTarget}
            onChange={e => setCustomTarget(e.target.value)}
            placeholder="Target count (e.g. 100)"
            className="w-full glass rounded-2xl px-4 py-3 text-sm bg-transparent placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        )}
      </section>

      {/* ── Counter ── */}
      <section className="glass-strong rounded-3xl p-8 animate-fade-up flex flex-col items-center gap-6" style={{ animationDelay: '160ms' }}>
        {/* Arabic */}
        <div className="text-center">
          {!showCustom && (
            <>
              <p className="font-arabic text-3xl text-foreground/90 leading-relaxed">
                {selectedPreset.arabic}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{selectedPreset.translation}</p>
            </>
          )}
          {showCustom && <p className="text-lg font-display text-foreground/90">Custom Dhikr</p>}
        </div>

        {/* SVG Ring counter */}
        <div className="relative w-56 h-56">
          <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor"
              className="text-muted/30" strokeWidth="6" />
            <circle cx="100" cy="100" r="90" fill="none"
              stroke="url(#goldGrad)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#F5D76E" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-6xl leading-none">{count}</span>
            <span className="text-xs text-muted-foreground mt-1">of {target}</span>
            {sets > 0 && (
              <span className="text-xs text-primary mt-1">{sets} set{sets > 1 ? 's' : ''} done</span>
            )}
          </div>
        </div>

        {/* Timer display */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clock className="w-3.5 h-3.5" />
          <span className="tabular-nums">{formatDuration(elapsed)}</span>
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
        </div>

        {/* Tap button */}
        <button
          onClick={handleCount}
          className="w-36 h-36 rounded-full bg-gradient-gold text-primary-foreground shadow-glow text-xl font-display active:scale-95 transition-transform select-none"
          style={{ touchAction: 'manipulation' }}
        >
          Tap
        </button>

        {/* Controls */}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleReset}
            className="flex-1 glass rounded-2xl py-3 text-sm flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-2xl py-3 text-sm flex items-center justify-center gap-2 bg-gradient-gold text-primary-foreground shadow-glow"
          >
            <CheckCircle2 className="w-4 h-4" /> Save
          </button>
        </div>
      </section>

      {/* ── History ── */}
      {dhikr.sessions.length > 0 && (
        <section className="glass rounded-3xl overflow-hidden animate-fade-up" style={{ animationDelay: '240ms' }}>
          <button
            onClick={() => setShowHistory(h => !h)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors"
          >
            <span className="font-display text-lg">Past Sessions</span>
            {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showHistory && (
            <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
              {dhikr.sessions.map((s) => (
                <div key={s.id} className="flex items-start gap-3 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/90 truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.count.toLocaleString()} counts
                      {s.sets > 0 ? ` · ${s.sets} sets of ${s.target}` : ` · target ${s.target}`}
                      {' · '}{formatDuration(s.durationSeconds)}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDate(s.completedAt)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <p className="text-center text-xs text-muted-foreground italic">
        "Verily in the remembrance of Allah do hearts find rest." — 13:28
      </p>
    </div>
  );
};
