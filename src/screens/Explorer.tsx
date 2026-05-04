import { useState } from 'react';
import { POWERFUL_AYAHS, PowerfulAyah } from '@/data/stories';
import { useParvaz, UNLOCKS } from '@/store/parvaz';
import { LockedCard } from './Stories';
import { Bookmark, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const Explorer = () => {
  const { xp, unlockedAyahCards, unlockAyahCard, bookmarks, toggleBookmark } = useParvaz();
  const sectionUnlocked = xp >= UNLOCKS.ayahExplorer;
  const [active, setActive] = useState<PowerfulAyah | null>(null);

  if (!sectionUnlocked) {
    return (
      <div className="animate-fade-in space-y-6">
        <header className="animate-fade-up">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ayah Explorer</p>
          <h1 className="font-display text-4xl md:text-5xl">A space for <span className="gold-text">reflection</span></h1>
        </header>
        <LockedCard xp={xp} required={UNLOCKS.ayahExplorer} message="Powerful ayahs to reflect on, save, and return to whenever your heart needs them." />
      </div>
    );
  }

  if (active) {
    const opened = unlockedAyahCards.includes(active.id) || active.unlockCost === 0;
    const bmKey = `${active.surah}:${active.ayah}`;
    const isBookmarked = bookmarks.includes(bmKey);
    return (
      <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
        <button onClick={() => setActive(null)} className="text-sm text-muted-foreground hover:text-foreground">← Back to ayahs</button>
        <article className="glass-strong rounded-3xl p-8 md:p-10 text-center space-y-6 relative overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-dawn blur-3xl opacity-40 animate-breathe" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/80">{active.surahName} · {active.surah}:{active.ayah}</p>
            <p className="font-arabic text-4xl md:text-5xl my-8 leading-loose">{active.arabic}</p>
            <p className="font-display text-xl md:text-2xl text-foreground/90 italic">"{active.translation}"</p>
            {opened && (
              <p className="text-sm text-muted-foreground mt-6 max-w-md mx-auto leading-relaxed animate-fade-up">{active.reflection}</p>
            )}
          </div>
        </article>
        <div className="flex gap-3">
          {!opened ? (
            <button
              onClick={() => {
                if (unlockAyahCard(active.id, active.unlockCost)) toast.success('Reflection revealed', { description: `−${active.unlockCost} XP` });
                else toast.error('Not enough XP', { description: `Need ${active.unlockCost - xp} more.` });
              }}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-gold text-primary-foreground font-medium shadow-glow"
            >
              Unlock reflection · {active.unlockCost} XP
            </button>
          ) : (
            <button onClick={() => toggleBookmark(bmKey)} className="flex-1 py-3.5 rounded-2xl glass inline-flex items-center justify-center gap-2">
              <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
              {isBookmarked ? 'Saved' : 'Save ayah'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ayah Explorer</p>
        <h1 className="font-display text-4xl md:text-5xl">Reflect on a <span className="gold-text">single verse</span></h1>
        <p className="text-muted-foreground text-sm mt-1">Powerful ayahs — unlock each with XP.</p>
      </header>
      <div className="grid md:grid-cols-2 gap-3">
        {POWERFUL_AYAHS.map((a, i) => {
          const opened = unlockedAyahCards.includes(a.id) || a.unlockCost === 0;
          const bmKey = `${a.surah}:${a.ayah}`;
          const isBookmarked = bookmarks.includes(bmKey);
          return (
            <button key={a.id} onClick={() => setActive(a)} className="text-left glass rounded-2xl p-5 transition-all duration-500 hover:-translate-y-0.5 animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary/80">{a.surahName} · {a.surah}:{a.ayah}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {isBookmarked && <Bookmark className="w-3.5 h-3.5 text-primary" fill="currentColor" />}
                  {opened ? <Sparkles className="w-3.5 h-3.5 text-primary" /> : <span className="text-[10px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary"><Lock className="w-3 h-3" /> {a.unlockCost}</span>}
                </span>
              </div>
              <p className="font-arabic text-2xl text-right leading-loose mb-2 line-clamp-2">{a.arabic}</p>
              <p className="text-xs text-muted-foreground italic line-clamp-2">{a.translation}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
