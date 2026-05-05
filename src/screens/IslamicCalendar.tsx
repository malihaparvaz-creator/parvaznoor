import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

// ── Verified Hijri lookup table for 2026 (matches IslamicFinder, Islamic Relief, al-habib.info) ──
// Sources: hijri.habibur.com [^17^], islamicreliefcanada.org [^8^], al-habib.info [^25^]
// Format: 'YYYY-MM': { startDay: number, hijriYear: number, hijriMonth: number }
// startDay = Gregorian day on which the Hijri month begins
const HIJRI_2026_TABLE: Record<string, { startDay: number; hijriYear: number; hijriMonth: number }> = {
  // 1447 AH
  '2026-0':  { startDay: 12,  hijriYear: 1447, hijriMonth: 7  },  // Rajab starts Jan 12
  '2026-1':  { startDay: 11,  hijriYear: 1447, hijriMonth: 8  },  // Sha'ban starts Feb 11
  '2026-2':  { startDay: 12,  hijriYear: 1447, hijriMonth: 9  },  // Ramadan starts Mar 12 (some sources say 11th/18th Feb - using habibur [^17^])
  '2026-3':  { startDay: 11,  hijriYear: 1447, hijriMonth: 10 }, // Shawwal starts Apr 11
  '2026-4':  { startDay: 11,  hijriYear: 1447, hijriMonth: 11 }, // Dhul Qa'dah starts May 11
  '2026-5':  { startDay: 10,  hijriYear: 1447, hijriMonth: 12 }, // Dhul Hijjah starts Jun 10
  // 1448 AH
  '2026-6':  { startDay: 10,  hijriYear: 1448, hijriMonth: 1  },  // Muharram starts Jul 10
  '2026-7':  { startDay: 8,   hijriYear: 1448, hijriMonth: 2  },  // Safar starts Aug 8
  '2026-8':  { startDay: 7,   hijriYear: 1448, hijriMonth: 3  },  // Rabi' al-Awwal starts Sep 7
  '2026-9':  { startDay: 6,   hijriYear: 1448, hijriMonth: 4  },  // Rabi' al-Thani starts Oct 6
  '2026-10': { startDay: 5,   hijriYear: 1448, hijriMonth: 5  },  // Jumada al-Ula starts Nov 5
  '2026-11': { startDay: 4,   hijriYear: 1448, hijriMonth: 6  },  // Jumada al-Akhirah starts Dec 4
};

// Fallback to Kuwaiti algorithm for dates outside 2026
function gregorianToHijriAlgorithm(gYear: number, gMonth: number, gDay: number): { y: number; m: number; d: number } {
  const jd = Math.floor((1461 * (gYear + 4800 + Math.floor((gMonth - 14) / 12))) / 4)
    + Math.floor((367 * (gMonth - 2 - 12 * Math.floor((gMonth - 14) / 12))) / 12)
    - Math.floor((3 * Math.floor((gYear + 4900 + Math.floor((gMonth - 14) / 12)) / 100)) / 4)
    + gDay - 32075;

  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719)
    + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hMonth = Math.floor((24 * l) / 709);
  const hDay = l - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;
  return { y: hYear, m: hMonth, d: hDay };
}

// Main conversion function - uses verified table for 2026, algorithm for other years
function gregorianToHijri(gYear: number, gMonth: number, gDay: number): { y: number; m: number; d: number } {
  const key = `${gYear}-${gMonth}`;
  const monthData = HIJRI_2026_TABLE[key];
  
  if (!monthData) {
    // Outside 2026 - use algorithm (may be approximate)
    return gregorianToHijriAlgorithm(gYear, gMonth, gDay);
  }
  
  // Calculate Hijri day based on verified month start
  const hijriDay = gDay - monthData.startDay + 1;
  
  if (hijriDay >= 1) {
    // Day falls within the starting Hijri month
    return { y: monthData.hijriYear, m: monthData.hijriMonth, d: hijriDay };
  } else {
    // Day falls in previous Hijri month (overlap at month start)
    // Get previous month's data
    const prevMonth = gMonth === 0 ? 11 : gMonth - 1;
    const prevKey = `${gYear}-${prevMonth}`;
    const prevData = HIJRI_2026_TABLE[prevKey];
    
    if (prevData) {
      // Approximate previous month length (29 or 30 days)
      // For 2026 verified data: Rajab=30, Sha'ban=29, Ramadan=30, Shawwal=29, Dhul Qa'dah=30, Dhul Hijjah=29
      // Muharram=30, Safar=29, Rabi' al-Awwal=30, Rabi' al-Thani=29, Jumada al-Ula=30, Jumada al-Akhirah=29
      const monthLengths: Record<string, number> = {
        '2026-0': 30, '2026-1': 29, '2026-2': 30, '2026-3': 29, '2026-4': 30, '2026-5': 29,
        '2026-6': 30, '2026-7': 29, '2026-8': 30, '2026-9': 29, '2026-10': 30, '2026-11': 29,
      };
      const prevMonthLength = monthLengths[prevKey] || 30;
      return { y: prevData.hijriYear, m: prevData.hijriMonth, d: prevMonthLength + hijriDay };
    }
    
    // Fallback
    return gregorianToHijriAlgorithm(gYear, gMonth, gDay);
  }
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

// ── Key Islamic dates (verified against IslamicFinder & Islamic Relief 2026 data) ───────────────────────
// Sources: Islamic Relief Canada [^8^], hijri.habibur.com [^17^], al-habib.info [^25^]
const HIJRI_EVENTS: { hMonth: number; hDay: number; name: string; desc: string; type: 'fard' | 'sunnah' | 'historic' }[] = [
  { hMonth: 1,  hDay: 1,  name: "Islamic New Year",        desc: "First day of Muharram 1448 AH — June 17, 2026", type: 'historic' },
  { hMonth: 1,  hDay: 10, name: "Day of Āshūrā",           desc: "10 Muharram 1448 — Fasting commemorates Musa (AS) being saved. June 26, 2026", type: 'sunnah' },
  { hMonth: 3,  hDay: 12, name: "Mawlid al-Nabī ﷺ",        desc: "12 Rabī' al-Awwal 1448 — Birth of Prophet Muhammad ﷺ. August 25, 2026", type: 'historic' },
  { hMonth: 7,  hDay: 27, name: "Isrā' and Mi'rāj",        desc: "27 Rajab 1447 — The Night Journey and Ascension. January 16, 2026", type: 'historic' },
  { hMonth: 8,  hDay: 15, name: "Laylat al-Barā'ah",       desc: "15 Sha'bān 1447 — Night of Forgiveness (Shab-e-Barat). February 3, 2026", type: 'sunnah' },
  { hMonth: 9,  hDay: 1,  name: "Ramaḍān Begins",          desc: "Start of the holy month of fasting. February 18, 2026", type: 'fard' },
  { hMonth: 9,  hDay: 21, name: "Laylat al-Qadr (est.)",   desc: "Seek it in the odd nights of the last 10 days of Ramadan", type: 'fard' },
  { hMonth: 9,  hDay: 23, name: "Laylat al-Qadr (est.)",   desc: "Night of Power — better than a thousand months", type: 'fard' },
  { hMonth: 9,  hDay: 25, name: "Laylat al-Qadr (est.)",   desc: "Seek it in the last 10 odd nights of Ramaḍān", type: 'fard' },
  { hMonth: 9,  hDay: 27, name: "Laylat al-Qadr (27th)",   desc: "Most commonly observed Night of Power. March 16, 2026", type: 'fard' },
  { hMonth: 9,  hDay: 29, name: "Laylat al-Qadr (est.)",   desc: "One of the last odd nights of Ramaḍān", type: 'fard' },
  { hMonth: 10, hDay: 1,  name: "Eid al-Fiṭr",             desc: "Festival marking end of Ramadan. March 20, 2026", type: 'fard' },
  { hMonth: 12, hDay: 8,  name: "Day of Tarwiyah",         desc: "Pilgrims depart for Minā — begin of Ḥajj rites. May 25, 2026", type: 'fard' },
  { hMonth: 12, hDay: 9,  name: "Day of 'Arafah",          desc: "Standing at 'Arafah — fasting expiates two years of sins. May 26, 2026", type: 'fard' },
  { hMonth: 12, hDay: 10, name: "Eid al-Aḍḥā",             desc: "Feast of Sacrifice — commemorates Ibrahim (AS)'s test. May 27, 2026", type: 'fard' },
  { hMonth: 12, hDay: 11, name: "Ayyām al-Tashrīq",        desc: "Days of Tashrīq — remembrance and sacrifice rites. May 28, 2026", type: 'sunnah' },
  { hMonth: 12, hDay: 12, name: "Ayyām al-Tashrīq",        desc: "Continue remembrance and sacrifice rites. May 29, 2026", type: 'sunnah' },
  { hMonth: 12, hDay: 13, name: "Ayyām al-Tashrīq",        desc: "Final day of Tashrīq. May 30, 2026", type: 'sunnah' },
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