import { useState } from 'react';
import { STORIES, Story } from '@/data/stories';
import { useParvaz, UNLOCKS } from '@/store/parvaz';
import { Lock, Check, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const Stories = () => {
  const { xp, today, markStoryRead, unlockedStories, unlockStory } = useParvaz();
  const [active, setActive] = useState<Story | null>(null);
  const [filter, setFilter] = useState<'All' | Story['category']>('All');
  const sectionUnlocked = xp >= UNLOCKS.stories;

  if (!sectionUnlocked) {
    return (
      <div className="animate-fade-in space-y-6">
        <header className="animate-fade-up">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Stories</p>
          <h1 className="font-display text-4xl md:text-5xl">Stories of <span className="gold-text">light</span></h1>
        </header>
        <LockedCard xp={xp} required={UNLOCKS.stories} message="Earn XP through prayer and reading. Stories of Prophets, companions, and luminous moments in Muslim history await." />
      </div>
    );
  }

  if (active) {
    const read = today.storiesRead.includes(active.id);
    const opened = unlockedStories.includes(active.id) || active.unlockCost === 0;
    return (
      <article className="animate-fade-in space-y-6 max-w-2xl mx-auto">
        <button onClick={() => setActive(null)} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <header className="space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] text-primary/80">{active.category}</span>
          <h1 className="font-display text-4xl md:text-5xl leading-tight">{active.title}</h1>
          <p className="text-muted-foreground italic">{active.subtitle}</p>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><Clock className="w-3 h-3" /> {active.readTime}</p>
        </header>

        {!opened ? (
          <div className="glass-strong rounded-3xl p-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-dawn flex items-center justify-center"><Lock className="w-5 h-5 text-primary" /></div>
            <p className="text-foreground/80 text-sm">{active.excerpt}</p>
            <button
              onClick={() => {
                if (unlockStory(active.id, active.unlockCost)) toast.success('Story revealed', { description: `−${active.unlockCost} XP` });
                else toast.error('Not enough XP yet', { description: `Need ${active.unlockCost - xp} more.` });
              }}
              className="px-5 py-3 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium shadow-glow"
            >
              Unlock for {active.unlockCost} XP
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {active.body.map((para, i) => (
                <p key={i} className="text-foreground/85 leading-relaxed text-[17px] animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>{para}</p>
              ))}
            </div>
            {active.source && <p className="text-xs text-muted-foreground italic">Source: {active.source}</p>}
            {!read ? (
              <button onClick={() => { markStoryRead(active.id); toast.success('+25 XP', { description: 'Reflection completed.' }); }}
                className="w-full py-4 rounded-2xl bg-gradient-gold text-primary-foreground font-medium shadow-glow hover:scale-[1.01] transition-transform">
                Mark as read · +25 XP
              </button>
            ) : (
              <div className="w-full py-4 rounded-2xl glass text-center text-primary inline-flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Read · XP earned</div>
            )}
          </>
        )}
      </article>
    );
  }

  const filtered = filter === 'All' ? STORIES : STORIES.filter((s) => s.category === filter);
  const cats: ('All' | Story['category'])[] = ['All', 'Prophets', 'Companions', 'Events', 'Figures'];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Stories</p>
        <h1 className="font-display text-4xl md:text-5xl">Stories of <span className="gold-text">light</span></h1>
        <p className="text-muted-foreground text-sm mt-1">Authentic — drawn from the Quran, Sahih hadith, and classical sira.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-2 px-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`shrink-0 px-4 py-2 rounded-full text-xs transition-all ${filter === c ? 'bg-gradient-gold text-primary-foreground shadow-glow' : 'glass text-foreground/70'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((s, i) => {
          const read = today.storiesRead.includes(s.id);
          const opened = unlockedStories.includes(s.id) || s.unlockCost === 0;
          const canAfford = xp >= s.unlockCost;
          return (
            <button key={s.id} onClick={() => setActive(s)} className="text-left glass rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-elevated animate-fade-up group" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary/80">{s.category}</span>
                <span className="flex items-center gap-2">
                  {read && <Check className="w-4 h-4 text-primary" />}
                  {!opened && <span className={`text-[10px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${canAfford ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}><Lock className="w-3 h-3" /> {s.unlockCost} XP</span>}
                </span>
              </div>
              <h3 className="font-display text-2xl leading-tight group-hover:gold-text transition-all">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 italic">{s.subtitle}</p>
              {opened && <p className="text-sm text-foreground/70 mt-3 line-clamp-2">{s.excerpt}</p>}
              <p className="text-xs text-muted-foreground mt-4 inline-flex items-center gap-1.5"><Clock className="w-3 h-3" /> {s.readTime}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const LockedCard = ({ xp, required, message }: { xp: number; required: number; message: string }) => {
  const pct = Math.min(100, Math.round((xp / required) * 100));
  return (
    <div className="glass-strong rounded-3xl p-8 text-center space-y-5 animate-scale-in">
      <div className="mx-auto w-16 h-16 rounded-full bg-gradient-dawn flex items-center justify-center animate-breathe"><Lock className="w-6 h-6 text-primary" /></div>
      <div>
        <h3 className="font-display text-2xl">Unlocks at {required} XP</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{message}</p>
      </div>
      <div>
        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden max-w-xs mx-auto">
          <div className="h-full bg-gradient-gold transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{xp} / {required} XP</p>
      </div>
      <p className="text-xs text-muted-foreground inline-flex items-center justify-center gap-1.5"><Sparkles className="w-3 h-3" /> Pray, read, reflect — XP grows naturally.</p>
    </div>
  );
};
