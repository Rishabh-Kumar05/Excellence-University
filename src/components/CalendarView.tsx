import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import type { CalendarEvent } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
}

const CATEGORIES = ['All', 'Holiday', 'Notice', 'Academic', 'Exam', 'Deadline'] as const;
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function CalendarView({ events }: CalendarViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const todayIso = getTodayIso();

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (categoryFilter !== 'All' && ev.category !== categoryFilter) return false;
      return true;
    });
  }, [events, categoryFilter]);

  const monthKeyPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{
      day: number | null;
      iso: string;
      isSunday: boolean;
      dayEvents: CalendarEvent[];
    }> = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push({ day: null, iso: '', isSunday: false, dayEvents: [] });
    }
    for (let d = 1; d <= totalDays; d += 1) {
      const iso = `${monthKeyPrefix}-${String(d).padStart(2, '0')}`;
      const isSunday = new Date(viewYear, viewMonth, d).getDay() === 0;
      const dayEvents = filteredEvents.filter((ev) => {
        if (ev.event_date === iso) return true;
        if (ev.end_date && iso >= ev.event_date && iso <= ev.end_date) return true;
        return false;
      });
      cells.push({ day: d, iso, isSunday, dayEvents });
    }
    return cells;
  }, [viewYear, viewMonth, monthKeyPrefix, filteredEvents]);

  const navigateMonth = (delta: number) => {
    let nextM = viewMonth + delta;
    let nextY = viewYear;
    if (nextM < 0) {
      nextM = 11;
      nextY -= 1;
    } else if (nextM > 11) {
      nextM = 0;
      nextY += 1;
    }
    setViewMonth(nextM);
    setViewYear(nextY);
  };

  const formatDateBlock = (iso: string) => {
    const parsed = new Date(`${iso}T00:00:00`);
    const month = parsed.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = String(parsed.getDate()).padStart(2, '0');
    const year = parsed.getFullYear();
    return { month, day, year };
  };

  return (
    <div className="bg-[#f7f9ff] min-h-screen">
      {/* Header Banner */}
      <section className="bg-[#1a1c1f] text-white py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-widest text-[#ffe088] mb-2">
            University Schedule
          </p>
          <h1 className="text-4xl font-['Newsreader',Georgia,serif] font-semibold tracking-tight mb-2">
            Academic Calendar, Holidays &amp; Events
          </h1>
          <p className="text-base text-[#c6c6ca] max-w-2xl">
            Official university holidays, campus notices, examination schedules, and key academic
            events published by administration.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-10">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#e0e3e8]">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#ebeef3] rounded-lg">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-white text-[#181c20] shadow-sm font-semibold'
                    : 'text-[#45474a] hover:text-[#181c20]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#45474a] tabular-nums">
            {filteredEvents.length} scheduled item(s)
          </span>
        </div>

        {/* Interactive Monthly Grid */}
        <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#c6c6ca] text-xs font-semibold text-[#181c20] hover:bg-[#f1f4f9] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#c6c6ca] text-xs font-semibold text-[#181c20] hover:bg-[#f1f4f9] cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((dayName) => (
              <div
                key={dayName}
                className="text-center py-2 text-xs font-semibold text-[#45474a] bg-[#f1f4f9] rounded-lg"
              >
                {dayName}
              </div>
            ))}

            {calendarCells.map((cell, idx) => {
              if (!cell.day) {
                return (
                  <div key={`empty-${idx}`} className="min-h-[82px] rounded-lg bg-[#f7f9ff]/50" />
                );
              }
              const isHoliday =
                cell.isSunday || cell.dayEvents.some((e) => e.category === 'Holiday');
              const hasEvents = cell.dayEvents.length > 0;
              const isToday = cell.iso === todayIso;

              return (
                <div
                  key={cell.iso}
                  className={`min-h-[82px] p-2 rounded-lg border flex flex-col gap-1 transition-colors ${
                    isToday
                      ? 'border-2 border-[#735c00] bg-[#fed65b]/15'
                      : isHoliday
                        ? 'border-[#f3bcbc] bg-[#ffdad6]/40'
                        : hasEvents
                          ? 'border-[#fed65b] bg-[#fed65b]/20'
                          : 'border-[#ebeef3] bg-white'
                  }`}
                >
                  <span className="text-xs font-semibold text-[#181c20] tabular-nums">
                    {cell.day}
                  </span>
                  <div className="space-y-1 overflow-hidden">
                    {cell.dayEvents.slice(0, 2).map((ev) => (
                      <p
                        key={ev.id}
                        className={`text-[11px] font-medium leading-tight truncate ${
                          ev.category === 'Holiday' ? 'text-[#93000a]' : 'text-[#735c00]'
                        }`}
                        title={`${ev.category}: ${ev.title}`}
                      >
                        {ev.title}
                      </p>
                    ))}
                    {cell.dayEvents.length === 0 && cell.isSunday && (
                      <p className="text-[11px] text-[#93000a]">Sunday Off</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Events & Holidays List */}
        <section className="space-y-4">
          <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
            Holidays &amp; University Events Directory
          </h2>

          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-xl p-10 border border-[#c6c6ca]/40 text-center">
              <CalendarDays className="w-8 h-8 text-[#735c00] mx-auto mb-3" />
              <p className="text-lg font-['Newsreader',Georgia,serif] text-[#181c20]">
                No holidays or university events match this filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((ev) => {
                const { month, day, year } = formatDateBlock(ev.event_date);
                const isHol = ev.category === 'Holiday';
                return (
                  <article
                    key={ev.id}
                    className="bg-white rounded-xl p-5 sm:p-6 border border-[#c6c6ca]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className={`w-16 h-16 rounded-xl border flex flex-col items-center justify-center shrink-0 tabular-nums ${
                          isHol
                            ? 'bg-[#ffdad6]/50 border-[#f3bcbc]'
                            : 'bg-[#f1f4f9] border-[#c6c6ca]/40'
                        }`}
                      >
                        <span
                          className={`text-[11px] font-bold tracking-wider ${
                            isHol ? 'text-[#93000a]' : 'text-[#735c00]'
                          }`}
                        >
                          {month}
                        </span>
                        <span className="text-2xl font-['Newsreader',Georgia,serif] font-bold text-[#181c20] leading-none">
                          {day}
                        </span>
                      </div>

                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            isHol ? 'text-[#93000a]' : 'text-[#735c00]'
                          }`}
                        >
                          {ev.category} · {ev.semester} · {year}
                          {ev.end_date ? ` (Through ${ev.end_date})` : ''}
                        </p>
                        <h3 className="text-xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] mt-1">
                          {ev.title}
                        </h3>
                        <p className="text-sm text-[#45474a] mt-1 leading-relaxed">
                          {ev.description}
                        </p>
                        <p className="text-xs text-[#45474a] mt-2 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#735c00]" />
                          <span>{ev.location}</span>
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
