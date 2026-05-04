import { getLevel } from '@/store/parvaz';

export const XpRing = ({ xp, size = 140 }: { xp: number; size?: number }) => {
  const { current, next, progress } = getLevel(xp);
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - progress * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(42 85% 72%)" />
            <stop offset="100%" stopColor="hsl(38 70% 60%)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#xpGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-3xl gold-text leading-none">{xp}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">XP</span>
        <span className="text-xs mt-1 text-foreground/80 font-medium">{current.name}</span>
      </div>
    </div>
  );
};
