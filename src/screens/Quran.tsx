import { useEffect, useRef, useState } from 'react';
import { SURAH_LIST, fetchSurah, SurahFull } from '@/lib/quran';
import { useParvaz } from '@/store/parvaz';
import { Bookmark, Pause, Play, RotateCcw, Check, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MIN_SECONDS = 5 * 60;

export const Quran = () => {
  const { bookmarks, toggleBookmark, addQuranMinutes, today, settings } = useParvaz();
  const [surahNum, setSurahNum] = useState(1);
  const [surah, setSurah] = useState<SurahFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchSurah(surahNum, settings.translationEdition)
      .then((s) => { if (alive) setSurah(s); })
      .catch(() => toast.error('Could not load surah', { description: 'Check your connection.' }))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [surahNum, settings.translationEdition]);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  const progress = Math.min(1, seconds / MIN_SECONDS);
  const eligible = seconds >= MIN_SECONDS && !claimed;

  const claim = () => {
    const minutes = Math.max(5, Math.floor(seconds / 60));
    addQuranMinutes(minutes);
    setClaimed(true);
    setRunning(false);
    toast.success(`+${minutes * 5} XP — ${minutes} min of reading`, { description: 'May Allah accept your recitation.' });
  };
  const reset = () => { setSeconds(0); setRunning(false); setClaimed(false); };

  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  const filtered = SURAH_LIST.filter((s) => {
    const q = query.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.translation.toLowerCase().includes(q) || String(s.number) === q;
  });

  const arabicSize = settings.arabicSize === 'sm' ? 'text-2xl md:text-3xl' : settings.arabicSize === 'lg' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl';

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Quran</p>
        <h1 className="font-display text-4xl md:text-5xl">Read with <span className="gold-text">presence</span></h1>
        <p className="text-muted-foreground text-sm mt-1">All 114 surahs · Today: {today.quranMinutes} min · 5 XP per minute</p>
      </header>

      <div className="relative animate-fade-up" style={{ animationDelay: '80ms' }}>
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search surah by name or number"
          className="w-full glass rounded-full pl-11 pr-4 py-3 text-sm bg-transparent placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>

      {/* Surah grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1 animate-fade-up" style={{ animationDelay: '120ms' }}>
        {filtered.map((s) => (
          <button
            key={s.number}
            onClick={() => setSurahNum(s.number)}
            className={`text-left rounded-2xl px-3 py-2.5 text-sm transition-all duration-300 ${
              s.number === surahNum ? 'bg-gradient-gold text-primary-foreground shadow-glow' : 'glass hover:bg-secondary/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">{s.number}. {s.name}</span>
              <span className="font-arabic text-base shrink-0">{s.arabicName}</span>
            </div>
            <p className={`text-[10px] mt-0.5 ${s.number === surahNum ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {s.ayahCount} ayahs · {s.revelation}
            </p>
          </button>
        ))}
      </div>

      {/* Reading timer */}
      <section className="glass-strong rounded-3xl p-6 animate-fade-up" style={{ animationDelay: '160ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary/80">Reading session</p>
            <p className="font-display text-3xl tabular-nums mt-1">{mm}:{ss}</p>
          </div>
          <div className="flex gap-2">
            {!claimed && (
              <button onClick={() => setRunning((r) => !r)} className="w-12 h-12 rounded-full bg-gradient-gold text-primary-foreground flex items-center justify-center shadow-glow hover:scale-105 transition-transform" aria-label={running ? 'Pause' : 'Start'}>
                {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
            )}
            <button onClick={reset} className="w-12 h-12 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Reset">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <div className="h-full bg-gradient-gold rounded-full transition-all duration-700" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground">
            {seconds < MIN_SECONDS ? `${Math.ceil((MIN_SECONDS - seconds) / 60)} min until reward` : claimed ? 'Reward claimed' : 'You may claim your XP'}
          </p>
          {eligible && (
            <button onClick={claim} className="px-4 py-2 rounded-full bg-gradient-gold text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 shadow-glow">
              <Check className="w-3.5 h-3.5" /> Claim XP
            </button>
          )}
        </div>
      </section>

      {/* Surah header + ayahs */}
      {loading || !surah ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">Loading surah…</p>
        </div>
      ) : (
        <>
          <section className="text-center py-6 animate-fade-up">
            <p className="font-arabic text-5xl mb-2">{surah.arabicName}</p>
            <p className="text-sm text-muted-foreground">{surah.name} · {surah.translation}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{surah.ayahCount} ayahs · Revealed in {surah.revelation === 'Meccan' ? 'Mecca' : 'Medina'}</p>
          </section>
          <section className="space-y-3 animate-fade-up">
            {surah.ayahs.map((ayah) => {
              const key = `${surah.number}:${ayah.number}`;
              const bookmarked = bookmarks.includes(key);
              return (
                <article key={key} className="glass rounded-2xl p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="w-8 h-8 rounded-full bg-secondary text-xs flex items-center justify-center text-primary/80 font-medium shrink-0">{ayah.number}</span>
                    <button onClick={() => toggleBookmark(key)} className={`transition-colors ${bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} aria-label="Bookmark">
                      <Bookmark className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <p className={`font-arabic text-right text-foreground leading-loose ${arabicSize}`}>{ayah.arabic}</p>
                  {settings.showTranslation && (
                    <p className="text-sm md:text-base text-muted-foreground mt-4 leading-relaxed italic">{ayah.translation}</p>
                  )}
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
};
