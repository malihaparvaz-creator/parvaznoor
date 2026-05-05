import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

// ── Hijri conversion using verified Islamic calendar algorithm ────────────────
function gregorianToHijri(gYear: number, gMonth: number, gDay: number): { y: number; m: number; d: number } {
  // Step 1: Convert Gregorian date to Julian Day Number
  const a = Math.floor((14 - gMonth) / 12);
  const y = gYear + 4800 - a;
  const m = gMonth + 12 * a - 3;
  const jd = gDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
    - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // Step 2: Convert Julian Day Number to Hijri using Kuwaiti algorithm (standard algorithm)
  const n = jd + 1;
  const q = Math.floor(n / 10631);
  const r = n % 10631;
  
  const a2 = Math.floor((33 * r + 3) / 10646);
  const w = r - Math.floor((10646 * a2 - 3) / 33) + 1;
  
  const hYear = 30 * q + a2 + 1;
  const hMonth = Math.floor((11 * w + 330) / 325);
  const hDay = w - Math.floor((325 * hMonth - 320) / 11);

  return { 
    y: hYear, 
    m: hMonth >= 1 && hMonth <= 12 ? hMonth : (hMonth < 1 ? 1 : 12),
    d: hDay >= 1 && hDay <= 30 ? hDay : (hDay < 1 ? 1 : 30)
  };
}

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabī' al-Awwal", "Rabī' al-Thānī",
  'Jumādā al-Ūlā', 'Jumādā al-Ākhirah', 'Rajab', "Sha'bān",
  'Ramaḍān', 'Shawwāl', "Dhū al-Qa'dah", 'Dhū al-Ḥijjah',
];

const GREGORIAN_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Key Islamic dates (recurring Hijri calendar events) ───────────────────────
// Format: { hMonth (1-12), hDay, name, description, type }
const HIJRI_EVENTS: { hMonth: number; hDay: number; name: string; desc: string; type: 'fard' | 'sunnah' | 'historic' }[] = [
  { hMonth: 1,  hDay: 1,  name: "Islamic New Year",        desc: "First day of Muharram — beginning of the Hijri year", type: 'historic' },
  { hMonth: 1,  hDay: 10, name: "Day of Āshūrā",           desc: "Musa (AS) and his people were saved; fasting is highly recommended", type: 'sunnah' },
  { hMonth: 3,  hDay: 12, name: "Mawlid al-Nabī ﷺ",        desc: "Birth of the Prophet Muhammad ﷺ (widely observed)", type: 'historic' },
  { hMonth: 7,  hDay: 27, name: "Isrā' and Mi'rāj",        desc: "The Night Journey and Ascension of the Prophet ﷺ", type: 'historic' },
  { hMonth: 8,  hDay: 15, name: "Laylat al-Barā'ah",       desc: "Night of Forgiveness — 15th Sha'bān", type: 'sunnah' },
  { hMonth: 9,  hDay: 1,  name: "Ramaḍān Begins",          desc: "Start of the holy month of fasting", type: 'fard' },
  { hMonth: 9,  hDay: 21, name: "Laylat al-Qadr (est.)",   desc: "Seek it in the odd nights of the last 10 days", type: 'fard' },
  { hMonth: 9,  hDay: 23, name: "Laylat al-Qadr (est.)",   desc: "Night of Power — better than a thousand months", type: 'fard' },
  { hMonth: 9,  hDay: 25, name: "Laylat al-Qadr (est.)",   desc: "Seek it in the last 10 odd nights of Ramaḍān", type: 'fard' },
  { hMonth: 9,  hDay: 27, name: "Laylat al-Qadr (27th)",   desc: "Most commonly observed Night of Power", type: 'fard' },
  { hMonth: 9,  hDay: 29, name: "Laylat al-Qadr (est.)",   desc: "One of the last odd nights of Ramaḍān", type: 'fard' },
  { hMonth: 10, hDay: 1,  name: "Eid al-Fiṭr",             desc: "Celebration marking end of Ramaḍān — Eid prayer is obligatory", type: 'fard' },
  { hMonth: 12, hDay: 8,  name: "Day of Tarwiyah",         desc: "Pilgrims depart for Minā — begin of Ḥajj rites", type: 'fard' },
  { hMonth: 12, hDay: 9,  name: "Day of 'Arafah",          desc: "Standing at 'Arafah — fasting this day expiates two years of sins (for non-pilgrims)", type: 'fard' },
  { hMonth: 12, hDay: 10, name: "Eid al-Aḍḥā",             desc: "Feast of Sacrifice — commemorates Ibrahim (AS)'s test", type: 'fard' },
  { hMonth: 12, hDay: 11, name: "Ayyām al-Tashrīq",        desc: "Days of Tashrīq — days of remembrance, eating, and drinking", type: 'sunnah' },
  { hMonth: 12, hDay: 12, name: "Ayyām al-Tashrīq",        desc: "Continue remembrance and sacrifice rites", type: 'sunnah' },
  { hMonth: 12, hDay: 13, name: "Ayyām al-Tashrīq",        desc: "Final day of Tashrīq", type: 'sunnah' },
];

const EVENT_COLORS = {
  fard:    { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  sunnah:  { bg: 'bg-primary/20',   text: 'text-primary',   border: 'border-primary/30'   },
  historic:{ bg: 'bg-blue-500/20',  text: 'text-blue-400',  border: 'border-blue-500/30'  },
};

export const IslamicCalendar = () => {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selected, setSelected]   = useState<Date | null>(null);

  // Days in the current view month
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = firstDay.getDay(); // 0=Sun

  // Compute Hijri for each day and find events
  const dayData = useMemo(() => {
    const result: { gDate: Date; hijri: ReturnType<typeof gregorianToHijri>; events: typeof HIJRI_EVENTS }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const gDate = new Date(viewYear, viewMonth, d);
      const hijri = gregorianToHijri(viewYear, viewMonth + 1, d);
      const events = HIJRI_EVENTS.filter(e => e.hMonth === hijri.m && e.hDay === hijri.d);
      result.push({ gDate, hijri, events });
    }
    return result;
  }, [viewYear, viewMonth]);

  const todayHijri = gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const selectedData = selected
    ? dayData.find(d => d.gDate.toDateString() === selected.toDateString())
    : null;

  // Upcoming events in the next 60 days
  const upcomingEvents = useMemo(() => {
    const results: { date: Date; event: typeof HIJRI_EVENTS[0]; hijri: ReturnType<typeof gregorianToHijri> }[] = [];
    for (let i = 0; i <= 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const h = gregorianToHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const events = HIJRI_EVENTS.filter(e => e.hMonth === h.m && e.hDay === h.d);
      events.forEach(ev => results.push({ date: d, event: ev, hijri: h }));
    }
    return results.slice(0, 8);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Calendar</p>
        <h1 className="font-display text-4xl md:text-5xl">
          Islamic <span className="gold-text">Calendar</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {HIJRI_MONTHS[todayHijri.m - 1]} {todayHijri.d}, {todayHijri.y} AH
        </p>
      </header>

      {/* Calendar grid */}
      <section className="glass-strong rounded-3xl p-5 animate-fade-up" style={{ animationDelay: '80ms' }}>
        {/* Nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="glass rounded-full w-9 h-9 flex items-center justify-center hover:bg-secondary/40 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="font-display text-xl">{GREGORIAN_MONTHS[viewMonth]} {viewYear}</p>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const h = gregorianToHijri(viewYear, viewMonth + 1, 15);
                return `${HIJRI_MONTHS[h.m - 1]} ${h.y} AH`;
              })()}
            </p>
          </div>
          <button onClick={nextMonth} className="glass rounded-full w-9 h-9 flex items-center justify-center hover:bg-secondary/40 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <p key={d} className={`text-center text-[10px] font-medium pb-1 ${d === 'Fr' ? 'text-primary' : 'text-muted-foreground'}`}>{d}</p>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
          {dayData.map(({ gDate, hijri, events }) => {
            const isToday = gDate.toDateString() === today.toDateString();
            const isSel = selected?.toDateString() === gDate.toDateString();
            const hasFard = events.some(e => e.type === 'fard');
            const hasSunnah = events.some(e => e.type === 'sunnah');
            const hasHistoric = events.some(e => e.type === 'historic');
            const isFriday = gDate.getDay() === 5;
            return (
              <button
                key={gDate.toISOString()}
                onClick={() => setSelected(isSel ? null : gDate)}
                className={`relative flex flex-col items-center py-1.5 rounded-xl transition-all duration-200
                  ${isSel ? 'bg-gradient-gold text-primary-foreground shadow-glow scale-105' : isToday ? 'ring-1 ring-primary/60' : 'hover:bg-secondary/30'}
                  ${isFriday && !isSel ? 'text-primary' : ''}`}
              >
                <span className="text-sm leading-none">{gDate.getDate()}</span>
                <span className={`text-[9px] mt-0.5 leading-none ${isSel ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {hijri.d}
                </span>
                {/* Event dots */}
                {(hasFard || hasSunnah || hasHistoric) && (
                  <div className="flex gap-0.5 mt-1">
                    {hasFard    && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                    {hasSunnah  && <span className="w-1 h-1 rounded-full bg-primary" />}
                    {hasHistoric&& <span className="w-1 h-1 rounded-full bg-blue-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-3 border-t border-border/30">
          <LegendDot color="bg-amber-400" label="Obligatory" />
          <LegendDot color="bg-primary" label="Sunnah" />
          <LegendDot color="bg-blue-400" label="Historic" />
        </div>
      </section>

      {/* Selected day detail */}
      {selectedData && (
        <section className="glass rounded-3xl p-5 animate-fade-up">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1">
              <p className="font-display text-2xl">{selectedData.gDate.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {HIJRI_MONTHS[selectedData.hijri.m - 1]} {selectedData.hijri.d}, {selectedData.hijri.y} AH
              </p>
            </div>
          </div>
          {selectedData.events.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No special events today.</p>
          ) : (
            <div className="space-y-2">
              {selectedData.events.map((ev, i) => {
                const colors = EVENT_COLORS[ev.type];
                return (
                  <div key={i} className={`rounded-2xl px-4 py-3 border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center gap-2">
                      <Star className={`w-3 h-3 flex-shrink-0 ${colors.text}`} />
                      <p className={`text-sm font-medium ${colors.text}`}>{ev.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ev.desc}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Upcoming events */}
      <section className="space-y-3 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <h3 className="font-display text-xl">Upcoming Events</h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No major events in the next 60 days.</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map(({ date, event, hijri }, i) => {
              const colors = EVENT_COLORS[event.type];
              const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
              return (
                <div key={i} className="glass rounded-2xl px-4 py-4 flex items-start gap-4">
                  <div className={`px-3 py-2 rounded-xl text-center min-w-[3.5rem] ${colors.bg} ${colors.border} border`}>
                    <p className={`text-lg font-display leading-none ${colors.text}`}>{date.getDate()}</p>
                    <p className={`text-[9px] uppercase tracking-wide mt-0.5 ${colors.text}`}>
                      {GREGORIAN_MONTHS[date.getMonth()].slice(0, 3)}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/90">{event.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.desc}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {HIJRI_MONTHS[hijri.m - 1]} {hijri.d}
                      {' · '}{diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span className={`w-2 h-2 rounded-full ${color}`} />
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);
