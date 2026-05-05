import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Loader2 } from 'lucide-react';

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabī' al-Awwal", "Rabī' al-Thānī",
  'Jumādā al-Ūlā', 'Jumādā al-Ākhirah', 'Rajab', "Sha'bān",
  'Ramaḍān', 'Shawwāl', "Dhū al-Qa'dah", 'Dhū al-Ḥijjah',
];

const GREGORIAN_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

interface HijriInfo {
  y: number;
  m: number;
  d: number;
}

interface CalendarDay {
  gDate: Date;
  hijri: HijriInfo;
  events: Event[];
}

interface Event {
  name: string;
  desc: string;
  type: 'fard' | 'sunnah' | 'historic';
}

const EVENT_COLORS = {
  fard: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  sunnah: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' },
  historic: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
};

export const IslamicCalendar = () => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'worldwide' | 'indian'>('worldwide');

  const [dayData, setDayData] = useState<CalendarDay[]>([]);
  const [todayHijri, setTodayHijri] = useState<HijriInfo>({ y: 1447, m: 11, d: 18 });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const getCalendarMethod = () => {
    return calendarMode === 'indian' ? 'ISNA' : ''; // ISNA is commonly used in India/Pakistan region
  };

  const fetchHijri = async (gYear: number, gMonth: number, gDay: number): Promise<HijriInfo> => {
    try {
      const dateStr = `${gDay.toString().padStart(2,'0')}-${gMonth.toString().padStart(2,'0')}-${gYear}`;
      let url = `https://api.aladhan.com/v1/gToH/${dateStr}`;

      const method = getCalendarMethod();
      if (method) url += `?calendarMethod=${method}`;

      const res = await fetch(url);
      const json = await res.json();
      const h = json.data.hijri;

      return {
        y: parseInt(h.year),
        m: parseInt(h.month.number),
        d: parseInt(h.day)
      };
    } catch (err) {
      console.error("Hijri fetch error:", err);
      return { y: 1447, m: 1, d: 1 };
    }
  };

  // Load current month
  useEffect(() => {
    const loadMonth = async () => {
      setLoading(true);
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const result: CalendarDay[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const hijri = await fetchHijri(viewYear, viewMonth + 1, d);
        const events = getEvents(hijri);
        result.push({
          gDate: new Date(viewYear, viewMonth, d),
          hijri,
          events
        });
      }
      setDayData(result);
      setLoading(false);
    };

    loadMonth();
  }, [viewYear, viewMonth, calendarMode]);

  // Today's Hijri
  useEffect(() => {
    fetchHijri(today.getFullYear(), today.getMonth() + 1, today.getDate())
      .then(setTodayHijri);
  }, [calendarMode]);

  // Upcoming Events
  useEffect(() => {
    const loadUpcoming = async () => {
      const results: any[] = [];
      for (let i = 0; i <= 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const hijri = await fetchHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
        const events = getEvents(hijri);
        events.forEach(ev => results.push({ date: new Date(d), event: ev, hijri }));
      }
      setUpcomingEvents(results.slice(0, 8));
    };
    loadUpcoming();
  }, [calendarMode]);

  const getEvents = (hijri: HijriInfo): Event[] => {
    const events: Event[] = [];
    const { m: month, d: day } = hijri;

    if (month === 9 && day === 1) events.push({ name: "Ramaḍān Begins", desc: "Start of the blessed month", type: 'fard' });
    if (month === 9 && [21,23,25,27,29].includes(day)) events.push({ name: "Laylat al-Qadr", desc: "Night of Power", type: 'fard' });
    if (month === 10 && day === 1) events.push({ name: "Eid al-Fiṭr", desc: "Festival of Breaking Fast", type: 'fard' });
    if (month === 12 && day === 9) events.push({ name: "Day of 'Arafah", desc: "Hajj - Standing at Arafah", type: 'fard' });
    if (month === 12 && day === 10) events.push({ name: "Eid al-Aḍḥā", desc: "Feast of Sacrifice", type: 'fard' });
    if (month === 1 && day === 1) events.push({ name: "Islamic New Year", desc: "1 Muharram", type: 'historic' });
    if (month === 1 && day === 10) events.push({ name: "Day of Āshūrā", desc: "Fasting recommended", type: 'sunnah' });
    if (month === 3 && day === 12) events.push({ name: "Mawlid al-Nabī ﷺ", desc: "Birth of Prophet Muhammad ﷺ", type: 'historic' });
    if (month === 7 && day === 27) events.push({ name: "Isrā' and Mi'rāj", desc: "Night Journey & Ascension", type: 'historic' });

    return events;
  };

  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = firstDay.getDay();

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

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Calendar</p>
        <h1 className="font-display text-4xl md:text-5xl">
          Islamic <span className="gold-text">Calendar</span>
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-muted-foreground text-sm">
            {HIJRI_MONTHS[todayHijri.m - 1]} {todayHijri.d}, {todayHijri.y} AH
          </p>
          <div className="flex gap-2">
            <button onClick={() => setCalendarMode('worldwide')}
              className={`text-xs px-3 py-1 rounded-full ${calendarMode === 'worldwide' ? 'bg-primary text-white' : 'bg-secondary'}`}>
              Worldwide
            </button>
            <button onClick={() => setCalendarMode('indian')}
              className={`text-xs px-3 py-1 rounded-full ${calendarMode === 'indian' ? 'bg-primary text-white' : 'bg-secondary'}`}>
              Indian
            </button>
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <section className="glass-strong rounded-3xl p-5">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="glass rounded-full w-9 h-9 flex items-center justify-center hover:bg-secondary/40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="font-display text-xl">{GREGORIAN_MONTHS[viewMonth]} {viewYear}</p>
          </div>
          <button onClick={nextMonth} className="glass rounded-full w-9 h-9 flex items-center justify-center hover:bg-secondary/40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-2">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <p key={d} className={`text-center text-[10px] font-medium pb-1 ${d === 'Fr' ? 'text-primary' : 'text-muted-foreground'}`}>{d}</p>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: startDow }).map((_, i) => <div key={`empty-${i}`} />)}
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
                      ${isSel ? 'bg-gradient-gold text-primary-foreground scale-105 shadow-glow' : 
                        isToday ? 'ring-1 ring-primary/60' : 'hover:bg-secondary/30'}
                      ${isFriday && !isSel ? 'text-primary' : ''}`}
                  >
                    <span className="text-sm">{gDate.getDate()}</span>
                    <span className="text-[9px] mt-0.5 text-muted-foreground">{hijri.d}</span>
                    {(hasFard || hasSunnah || hasHistoric) && (
                      <div className="flex gap-0.5 mt-1">
                        {hasFard && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                        {hasSunnah && <span className="w-1 h-1 rounded-full bg-primary" />}
                        {hasHistoric && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Selected Day */}
      {selectedData && (
        <section className="glass rounded-3xl p-5">
          <p className="font-display text-2xl">
            {selectedData.gDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {HIJRI_MONTHS[selectedData.hijri.m - 1]} {selectedData.hijri.d}, {selectedData.hijri.y} AH
          </p>

          {selectedData.events.length === 0 ? (
            <p className="italic text-muted-foreground mt-6">No special events today.</p>
          ) : (
            <div className="space-y-3 mt-4">
              {selectedData.events.map((ev, i) => {
                const colors = EVENT_COLORS[ev.type];
                return (
                  <div key={i} className={`rounded-2xl px-4 py-4 border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center gap-2">
                      <Star className={`w-4 h-4 ${colors.text}`} />
                      <p className={`font-medium ${colors.text}`}>{ev.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{ev.desc}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Upcoming Events */}
      <section>
        <h3 className="font-display text-xl mb-3">Upcoming Events</h3>
        <div className="space-y-3">
          {upcomingEvents.map(({ date, event, hijri }, i) => {
            const colors = EVENT_COLORS[event.type];
            const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86400000);

            return (
              <div key={i} className="glass rounded-2xl p-4 flex gap-4">
                <div className={`px-3 py-2 rounded-xl text-center min-w-[3.5rem] ${colors.bg} ${colors.border} border`}>
                  <p className={`text-lg font-display ${colors.text}`}>{date.getDate()}</p>
                  <p className={`text-[9px] uppercase ${colors.text}`}>{GREGORIAN_MONTHS[date.getMonth()].slice(0,3)}</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{event.name}</p>
                  <p className="text-sm text-muted-foreground">{event.desc}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {HIJRI_MONTHS[hijri.m - 1]} {hijri.d} • {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};