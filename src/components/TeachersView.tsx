import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Pin,
  UserCheck,
} from 'lucide-react';
import { isNoticeForAudience } from '../lib/api';
import type {
  CollegeNotice,
  Teacher,
  TeacherAttendanceRecord,
  TeacherAttendanceStatus,
} from '../types';

interface TeachersViewProps {
  teachers: Teacher[];
  teacherAttendance: TeacherAttendanceRecord[];
  notices: CollegeNotice[];
  activeScholar: { name: string; email: string };
}

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

export function TeachersView({
  teachers,
  teacherAttendance,
  notices,
  activeScholar,
}: TeachersViewProps) {
  const matchedTeacher = useMemo(() => {
    const emailLower = activeScholar.email.trim().toLowerCase();
    return (
      teachers.find((t) => t.email.trim().toLowerCase() === emailLower) ||
      teachers[0] ||
      null
    );
  }, [teachers, activeScholar.email]);

  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(
    matchedTeacher?.id ?? 0
  );

  useEffect(() => {
    if (
      matchedTeacher &&
      !teachers.some((t) => t.id === selectedTeacherId)
    ) {
      setSelectedTeacherId(matchedTeacher.id);
    }
  }, [matchedTeacher, teachers, selectedTeacherId]);

  const activeTeacher =
    teachers.find((t) => t.id === selectedTeacherId) || matchedTeacher;

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const todayIso = getTodayIso();

  const teacherNotices = useMemo(
    () => notices.filter((n) => isNoticeForAudience(n.audience, 'teacher')),
    [notices]
  );

  const myAttendanceMap = useMemo(() => {
    const map = new Map<string, TeacherAttendanceRecord>();
    if (!activeTeacher) return map;
    teacherAttendance.forEach((rec) => {
      if (rec.teacherId === activeTeacher.id) {
        map.set(rec.date, rec);
      }
    });
    return map;
  }, [teacherAttendance, activeTeacher]);

  const attendanceSummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let onLeave = 0;
    const presentDates: string[] = [];
    const absentDates: string[] = [];

    myAttendanceMap.forEach((rec) => {
      if (rec.status === 'Present') {
        present += 1;
        presentDates.push(rec.date);
      } else if (rec.status === 'Absent') {
        absent += 1;
        absentDates.push(rec.date);
      } else if (rec.status === 'Late') {
        late += 1;
        presentDates.push(rec.date);
      } else if (rec.status === 'On Leave') {
        onLeave += 1;
        absentDates.push(rec.date);
      }
    });

    presentDates.sort((a, b) => b.localeCompare(a));
    absentDates.sort((a, b) => b.localeCompare(a));
    return { present, absent, late, onLeave, presentDates, absentDates };
  }, [myAttendanceMap]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; iso: string; isSunday: boolean }> = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push({ day: null, iso: '', isSunday: false });
    }
    for (let d = 1; d <= totalDays; d += 1) {
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(
        d
      ).padStart(2, '0')}`;
      const isSunday = new Date(viewYear, viewMonth, d).getDay() === 0;
      cells.push({ day: d, iso, isSunday });
    }
    return cells;
  }, [viewYear, viewMonth]);

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

  const statusBadgeStyle = (status?: TeacherAttendanceStatus) => {
    if (status === 'Present') return 'bg-[#e8f6f0] text-[#12805c] border-[#b5e2d0]';
    if (status === 'Absent') return 'bg-[#ffdad6] text-[#93000a] border-[#f3bcbc]';
    if (status === 'Late' || status === 'On Leave')
      return 'bg-[#fed65b]/35 text-[#735c00] border-[#735c00]/20';
    return 'bg-[#f1f4f9] text-[#45474a] border-[#c6c6ca]/40';
  };

  const todayRecord = myAttendanceMap.get(todayIso);

  return (
    <div className="bg-[#f7f9ff] min-h-screen">
      {/* Banner */}
      <section className="bg-[#1a1c1f] text-white py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#ffe088] mb-2">
              Faculty Portal
            </p>
            <h1 className="text-4xl font-['Newsreader',Georgia,serif] font-semibold tracking-tight mb-2">
              Teacher Attendance &amp; Notices
            </h1>
            <p className="text-base text-[#c6c6ca] max-w-2xl">
              Review your monthly attendance calendar marked by administration and stay updated
              with official faculty notices.
            </p>
          </div>

          {teachers.length > 0 && (
            <div className="w-full md:w-72">
              <label className="block text-xs font-medium text-[#c6c6ca] mb-1.5">
                Faculty Profile
              </label>
              <select
                value={activeTeacher?.id ?? ''}
                onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-2 focus:outline-[#fed65b]"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id} className="text-[#181c20] bg-white">
                    {t.name} ({t.department})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-10">
        {/* Section 1: Attendance Calendar */}
        <section className="bg-white rounded-xl p-6 sm:p-8 border border-[#c6c6ca]/40 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#ebeef3]">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#735c00]">
                Attendance Record
              </p>
              <h2 className="text-2xl sm:text-3xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] mt-1 flex items-center gap-2.5">
                <CalendarDays className="w-6 h-6 text-[#735c00]" />
                <span>
                  {activeTeacher ? `${activeTeacher.name} — Attendance Calendar` : 'Attendance Calendar'}
                </span>
              </h2>
              {activeTeacher && (
                <p className="text-sm text-[#45474a] mt-1">
                  {activeTeacher.department} · {activeTeacher.office_room}
                  {activeTeacher.assigned_course ? ` · Course: ${activeTeacher.assigned_course}` : ''}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold ${statusBadgeStyle(
                  todayRecord?.status
                )}`}
              >
                <UserCheck className="w-4 h-4" />
                <span>
                  Today ({todayIso}): {todayRecord ? todayRecord.status : 'Not Marked'}
                </span>
              </span>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl p-4 bg-[#f7f9ff] border border-[#c6c6ca]/40">
              <p className="text-xs text-[#45474a] font-medium">Days Present</p>
              <p className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#12805c] mt-1 tabular-nums">
                {attendanceSummary.present}
              </p>
            </div>
            <div className="rounded-xl p-4 bg-[#f7f9ff] border border-[#c6c6ca]/40">
              <p className="text-xs text-[#45474a] font-medium">Days Absent</p>
              <p className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#ba1a1a] mt-1 tabular-nums">
                {attendanceSummary.absent}
              </p>
            </div>
            <div className="rounded-xl p-4 bg-[#f7f9ff] border border-[#c6c6ca]/40">
              <p className="text-xs text-[#45474a] font-medium">Late Arrivals</p>
              <p className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#735c00] mt-1 tabular-nums">
                {attendanceSummary.late}
              </p>
            </div>
            <div className="rounded-xl p-4 bg-[#f7f9ff] border border-[#c6c6ca]/40">
              <p className="text-xs text-[#45474a] font-medium">On Leave</p>
              <p className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] mt-1 tabular-nums">
                {attendanceSummary.onLeave}
              </p>
            </div>
          </div>

          {/* Month Controls */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#c6c6ca] text-xs font-semibold text-[#181c20] hover:bg-[#f1f4f9] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <h3 className="text-xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#c6c6ca] text-xs font-semibold text-[#181c20] hover:bg-[#f1f4f9] cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Monthly Calendar Grid */}
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
                return <div key={`empty-${idx}`} className="min-h-[72px] rounded-lg bg-[#f7f9ff]/50" />;
              }
              const rec = myAttendanceMap.get(cell.iso);
              const isToday = cell.iso === todayIso;
              return (
                <div
                  key={cell.iso}
                  className={`min-h-[72px] p-2 rounded-lg border flex flex-col justify-between transition-colors ${
                    isToday
                      ? 'border-2 border-[#735c00] bg-[#fed65b]/15'
                      : cell.isSunday
                        ? 'border-[#ebeef3] bg-[#f1f4f9]/80'
                        : 'border-[#ebeef3] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#181c20] tabular-nums">
                      {cell.day}
                    </span>
                    {rec && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          rec.status === 'Present'
                            ? 'bg-[#12805c]'
                            : rec.status === 'Absent'
                              ? 'bg-[#ba1a1a]'
                              : 'bg-[#735c00]'
                        }`}
                        title={rec.status}
                      />
                    )}
                  </div>
                  <div className="text-[11px] font-medium truncate">
                    {rec ? (
                      <span
                        className={
                          rec.status === 'Present'
                            ? 'text-[#12805c]'
                            : rec.status === 'Absent'
                              ? 'text-[#ba1a1a]'
                              : 'text-[#735c00]'
                        }
                      >
                        {rec.status}
                      </span>
                    ) : cell.isSunday ? (
                      <span className="text-[#76777b]">Sunday</span>
                    ) : (
                      <span className="text-[#c6c6ca]">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#45474a] pt-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12805c]" /> Present
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" /> Absent
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#735c00]" /> Late / On Leave
            </span>
          </div>
        </section>

        {/* Section 2: Notices from Admin Portal */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#735c00]">
                Official Bulletins
              </p>
              <h2 className="text-3xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] mt-1 flex items-center gap-2.5">
                <Megaphone className="w-6 h-6 text-[#735c00]" />
                <span>Notices Provided by Administration</span>
              </h2>
            </div>
            <span className="text-xs text-[#45474a] tabular-nums">
              {teacherNotices.length} notice(s) for faculty
            </span>
          </div>

          {teacherNotices.length === 0 ? (
            <div className="bg-white rounded-xl p-10 border border-[#c6c6ca]/40 text-center text-sm text-[#45474a]">
              No faculty notices published by administration yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teacherNotices.map((notice) => (
                <article
                  key={notice.docId}
                  className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#735c00] mb-1.5">
                      <span>
                        {notice.category} · {notice.audience}
                      </span>
                      {notice.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[#735c00]">
                          <Pin className="w-3.5 h-3.5" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                      {notice.title}
                    </h3>
                    <p className="text-sm text-[#45474a] mt-2 leading-relaxed">{notice.body}</p>
                  </div>
                  <p className="text-xs text-[#76777b] tabular-nums pt-3 border-t border-[#ebeef3]">
                    Issued by {notice.publishedBy} ·{' '}
                    {new Date(notice.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {notice.expiresAt ? ` · Valid until ${notice.expiresAt}` : ''}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
