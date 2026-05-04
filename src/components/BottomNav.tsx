import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Moon, Sparkles, Compass, Settings as SettingsIcon, Repeat2, CalendarDays, Scroll } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/quran', label: 'Quran', icon: BookOpen },
  { to: '/salah', label: 'Salah', icon: Moon },
  { to: '/qibla', label: 'Qibla', icon: Compass },
  { to: '/stories', label: 'Stories', icon: Scroll },
  { to: '/explorer', label: 'Ayah', icon: Sparkles },
  { to: '/dhikr', label: 'Dhikr', icon: Repeat2 },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  return (
    <>
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden max-w-[calc(100vw-1rem)]" aria-label="Primary">
        <div className="glass-strong rounded-full px-1.5 py-1.5 flex items-center gap-0.5 shadow-elevated">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <NavLink key={to} to={to} aria-label={label} className={cn('relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-500', active ? 'text-primary-foreground' : 'text-muted-foreground')}>
                {active && <span className="absolute inset-1 rounded-full bg-gradient-gold shadow-glow animate-scale-in" />}
                <Icon className="relative z-10 w-4 h-4" strokeWidth={active ? 2.4 : 1.8} />
                <span className="relative z-10 text-[9px] mt-0.5 font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <aside className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-2 glass-strong rounded-full p-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <NavLink key={to} to={to} aria-label={label} className={cn('group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500', active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {active && <span className="absolute inset-0 rounded-full bg-gradient-gold shadow-glow animate-scale-in" />}
              <Icon className="relative z-10 w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
              <span className="absolute left-full ml-3 px-3 py-1.5 rounded-full glass text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{label}</span>
            </NavLink>
          );
        })}
      </aside>
    </>
  );
};
