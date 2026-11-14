import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  CalendarClock,
  Megaphone,
  Pin,
  Search,
} from 'lucide-react';
import { isNoticeForAudience } from '../lib/api';
import {
  calculateGrade,
  DAY_NAMES,
  PERIOD_TIMES,
  PERIODS,
} from '../lib/timetableGenerator';
import type {
  CollegeNotice,
  SavedTimetable,
  StudentResult,
  Teacher,
  TeacherAttendanceRecord,
} from '../types';

interface StudentsViewProps {
  notices: CollegeNotice[];
  savedTimetables: SavedTimetable[];
  studentResults: StudentResult[];
  teachers: Teacher[];
  teacherAttendance: TeacherAttendanceRecord[];
}

type StudentTab = 'notices' | 'timetable' | 'results';

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function StudentsView({
  notices,
  savedTimetables,
  studentResults,
  teachers,
  teacherAttendance,
}: StudentsViewProps) {
  const [activeTab, setActiveTab] = useState<StudentTab>('notices');
  const [selectedTimetableIdx, setSelectedTimetableIdx] = useState(0);
  const [selectedSection, setSelectedSection] = useState(0);
  const [resultNameQuery, setResultNameQuery] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');

  const studentNotices = useMemo(
    () => notices.filter((n) => isNoticeForAudience(n.audience, 'student')),
    [notices]
  );

  const activeTimetable = savedTimetables[selectedTimetableIdx] || savedTimetables[0] || null;
  const safeSection =
    activeTimetable && selectedSection < activeTimetable.sectionsCount ? selectedSection : 0;

  const todayIso = getTodayIso();
  const absentTodayTeacherIds = useMemo(() => {
    const set = new Set<number>();
    teacherAttendance.forEach((rec) => {
      if (rec.date === todayIso && (rec.status === 'Absent' || rec.status === 'On Leave')) {
        set.add(rec.teacherId);
      }
    });
    return set;
  }, [teacherAttendance, todayIso]);

  const absentTodayTeachers = useMemo(
    () => teachers.filter((t) => absentTodayTeacherIds.has(t.id)),
    [teachers, absentTodayTeacherIds]
  );

  const todayDayIndex = useMemo(() => {
    // 0 = Monday ... 6 = Sunday
    return (new Date().getDay() + 6) % 7;
  }, []);

  // Group student results by exact studentName
  const matchedStudentNames = useMemo(() => {
    const q = resultNameQuery.trim().toLowerCase();
    const names = Array.from(new Set(studentResults.map((r) => r.studentName.trim()))).filter(
      Boolean
    );
    if (!q) return [];
    return names.filter((n) => n.toLowerCase().includes(q));
  }, [studentResults, resultNameQuery]);

  const resolvedStudentName = useMemo(() => {
    const q = resultNameQuery.trim().toLowerCase();
    if (!q) return '';
    if (
      selectedStudentName &&
      matchedStudentNames.some((n) => n.toLowerCase() === selectedStudentName.toLowerCase())
    ) {
      return selectedStudentName;
    }
    const exact = matchedStudentNames.find((n) => n.toLowerCase() === q);
    return exact || matchedStudentNames[0] || '';
  }, [resultNameQuery, selectedStudentName, matchedStudentNames]);

  const selectedResults = useMemo(() => {
    if (!resolvedStudentName) return [];
    return studentResults.filter(
      (r) => r.studentName.trim().toLowerCase() === resolvedStudentName.toLowerCase()
    );
  }, [studentResults, resolvedStudentName]);

  const sgpaSummary = useMemo(() => {
    if (selectedResults.length === 0) return null;
    const totalPoints = selectedResults.reduce((sum, r) => {
      const calc = calculateGrade(r.marks, r.maxMarks);
      return sum + calc.points;
    }, 0);
    return (totalPoints / selectedResults.length).toFixed(2);
  }, [selectedResults]);

  return (
    <div className="bg-[#f7f9ff] min-h-screen">
      {/* Header Banner */}
      <section className="bg-[#1a1c1f] text-white py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-widest text-[#ffe088] mb-2">
            Student Portal
          </p>
          <h1 className="text-4xl font-['Newsreader',Georgia,serif] font-semibold tracking-tight mb-2">
            Notices, Timetable &amp; Results
          </h1>
          <p className="text-base text-[#c6c6ca] max-w-2xl">
            Read official administrative notices, view your class timetable, and look up your
            examination results by name.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-8">
        {/* Segmented Tab Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#ebeef3] rounded-lg self-start w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('notices')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'notices'
                ? 'bg-white text-[#181c20] shadow-sm'
                : 'text-[#45474a] hover:text-[#181c20]'
            }`}
          >
            <Megaphone className="w-4 h-4 text-[#735c00]" />
            <span>Notices ({studentNotices.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timetable')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'timetable'
                ? 'bg-white text-[#181c20] shadow-sm'
                : 'text-[#45474a] hover:text-[#181c20]'
            }`}
          >
            <CalendarClock className="w-4 h-4 text-[#735c00]" />
            <span>Timetable (Read-Only)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'results'
                ? 'bg-white text-[#181c20] shadow-sm'
                : 'text-[#45474a] hover:text-[#181c20]'
            }`}
          >
            <Award className="w-4 h-4 text-[#735c00]" />
            <span>Results</span>
          </button>
        </div>

        {/* SECTION 1: STUDENT NOTICES */}
        {activeTab === 'notices' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                  Official Student Notices
                </h2>
                <p className="text-sm text-[#45474a] mt-1">
                  Announcements issued by university administration for students.
                </p>
              </div>
              <span className="text-xs text-[#45474a] tabular-nums">
                {studentNotices.length} active
              </span>
            </div>

            {studentNotices.length === 0 ? (
              <div className="bg-white rounded-xl p-10 border border-[#c6c6ca]/40 text-center text-sm text-[#45474a]">
                No student notices have been published yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {studentNotices.map((notice) => (
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
        )}

        {/* SECTION 2: READ-ONLY TIMETABLE */}
        {activeTab === 'timetable' && (
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                  Class Timetable
                </h2>
                <p className="text-sm text-[#45474a] mt-1">
                  View the official university timetable published by administration (read-only).
                </p>
              </div>
            </div>

            {absentTodayTeachers.length > 0 && (
              <div className="p-4 rounded-xl bg-[#ffdad6]/70 border border-[#ba1a1a]/20 text-[#93000a] text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>
                  Faculty absent today ({todayIso}):{' '}
                  <strong>{absentTodayTeachers.map((t) => t.name).join(', ')}</strong>. Their
                  scheduled classes today are highlighted below.
                </span>
              </div>
            )}

            {!activeTimetable ? (
              <div className="bg-white rounded-xl p-10 border border-[#c6c6ca]/40 text-center space-y-2">
                <CalendarClock className="w-8 h-8 text-[#735c00] mx-auto" />
                <p className="text-lg font-['Newsreader',Georgia,serif] text-[#181c20]">
                  No timetable published yet
                </p>
                <p className="text-sm text-[#45474a]">
                  Once the Administrator generates and saves the timetable in the Admin Portal, it
                  will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-[#ebeef3]">
                  {savedTimetables.length > 1 && (
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Published Schedule
                      </label>
                      <select
                        value={selectedTimetableIdx}
                        onChange={(e) => {
                          setSelectedTimetableIdx(Number(e.target.value));
                          setSelectedSection(0);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] bg-white text-sm"
                      >
                        {savedTimetables.map((tt, idx) => (
                          <option key={tt.docId} value={idx}>
                            {tt.title} ({tt.sectionsCount} sections)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Select Section
                    </label>
                    <select
                      value={safeSection}
                      onChange={(e) => setSelectedSection(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] bg-white text-sm"
                    >
                      {activeTimetable.groups.map((g, idx) => (
                        <option key={idx} value={idx}>
                          Section {idx + 1} (Semester {g + 1} · Year {Math.floor(g / 2) + 1}, Sem{' '}
                          {(g % 2) + 1})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#ebeef3] rounded-xl">
                  <table className="w-full text-left border-collapse min-w-[680px]">
                    <thead>
                      <tr className="bg-[#1a1c1f] text-white text-xs font-semibold">
                        <th className="py-3 px-4 w-28">Period</th>
                        {Array.from({ length: activeTimetable.daysCount }, (_, d) => (
                          <th
                            key={d}
                            className={`py-3 px-4 ${
                              d === todayDayIndex ? 'text-[#fed65b]' : 'text-white'
                            }`}
                          >
                            {DAY_NAMES[d]}
                            {d === todayDayIndex ? ' · Today' : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebeef3] text-sm">
                      {Array.from({ length: PERIODS }, (_, p) => (
                        <tr key={p} className="hover:bg-[#f7f9ff]/60">
                          <th className="py-3 px-4 bg-[#f1f4f9] text-[#181c20] font-semibold whitespace-nowrap">
                            <div>Period {p + 1}</div>
                            <div className="text-xs font-normal text-[#45474a] tabular-nums">
                              {PERIOD_TIMES[p]}
                            </div>
                          </th>
                          {Array.from({ length: activeTimetable.daysCount }, (_, d) => {
                            const slot = activeTimetable.slots.find(
                              (sl) => sl.s === safeSection && sl.d === d && sl.p === p
                            );
                            const isAbsentToday =
                              Boolean(slot) &&
                              d === todayDayIndex &&
                              absentTodayTeacherIds.has(slot!.teacherId);

                            return (
                              <td
                                key={d}
                                className={`py-3 px-4 align-top border-l border-[#ebeef3] ${
                                  isAbsentToday ? 'bg-[#ffdad6]/50' : ''
                                }`}
                              >
                                {slot ? (
                                  <div>
                                    <p className="font-semibold text-[#181c20] leading-snug">
                                      {slot.courseName}
                                    </p>
                                    <p className="text-xs text-[#45474a] mt-1">
                                      {slot.teacherName === `Teacher ${slot.teacherIdx + 1}`
                                        ? slot.teacherName
                                        : `Teacher ${slot.teacherIdx + 1} (${slot.teacherName})`}{' '}
                                      · Room {slot.roomNumber}
                                    </p>
                                    {isAbsentToday && (
                                      <p className="text-[11px] font-semibold text-[#ba1a1a] mt-1">
                                        Teacher Absent Today
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-[#76777b]">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: EXAMINATION RESULTS (BY NAME ONLY) */}
        {activeTab === 'results' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                Student Examination Results
              </h2>
              <p className="text-sm text-[#45474a] mt-1">
                Enter your full or partial student name to look up your saved results.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-5">
              <div className="max-w-lg">
                <label className="block text-xs font-medium text-[#45474a] mb-1.5">
                  Search Result by Student Name
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#76777b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={resultNameQuery}
                    onChange={(e) => {
                      setResultNameQuery(e.target.value);
                      setSelectedStudentName('');
                    }}
                    placeholder="Type student name (e.g. Aarav Mehta)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#f7f9ff] border border-[#c6c6ca] text-sm text-[#181c20] focus:outline-2 focus:outline-[#735c00]"
                  />
                </div>
              </div>

              {matchedStudentNames.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#45474a]">Matching students:</span>
                  {matchedStudentNames.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSelectedStudentName(n)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        resolvedStudentName.toLowerCase() === n.toLowerCase()
                          ? 'bg-[#fed65b] text-[#745c00] border-[#735c00]/30'
                          : 'bg-[#f1f4f9] text-[#181c20] border-[#c6c6ca]/40 hover:bg-[#ebeef3]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}

              {!resultNameQuery.trim() ? (
                <div className="p-8 rounded-xl bg-[#f7f9ff] border border-[#ebeef3] text-center text-sm text-[#45474a]">
                  Enter a student name above to display their saved subject marks, grades, and SGPA.
                </div>
              ) : selectedResults.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#f7f9ff] border border-[#ebeef3] text-center text-sm text-[#45474a]">
                  No saved results found matching <strong>"{resultNameQuery.trim()}"</strong>.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#f1f4f9] border border-[#c6c6ca]/40">
                    <div>
                      <p className="text-xs font-medium text-[#735c00] uppercase tracking-wider">
                        {selectedResults[0].courseName} · ID: {selectedResults[0].studentCode}
                      </p>
                      <h3 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] mt-0.5">
                        {selectedResults[0].studentName}
                      </h3>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-[#45474a]">Cumulative SGPA</p>
                      <p className="text-3xl font-['Newsreader',Georgia,serif] font-semibold text-[#735c00] tabular-nums">
                        {sgpaSummary}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-[#ebeef3] rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#ebeef3] bg-[#f1f4f9] text-xs font-semibold text-[#45474a]">
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Semester</th>
                          <th className="py-3 px-4 text-right">Marks</th>
                          <th className="py-3 px-4 text-right">Percentage</th>
                          <th className="py-3 px-4 text-right">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebeef3] text-sm">
                        {selectedResults.map((res) => {
                          const pct =
                            res.maxMarks > 0
                              ? Math.round((res.marks / res.maxMarks) * 100)
                              : 0;
                          const isFail = res.grade === 'F' || pct < 40;
                          return (
                            <tr key={res.docId} className="hover:bg-[#f7f9ff]">
                              <td className="py-3.5 px-4 font-semibold text-[#181c20]">
                                {res.subjectName}
                              </td>
                              <td className="py-3.5 px-4 text-xs text-[#45474a]">
                                {res.semester}
                              </td>
                              <td className="py-3.5 px-4 text-right tabular-nums text-[#181c20]">
                                {res.marks} / {res.maxMarks}
                              </td>
                              <td className="py-3.5 px-4 text-right tabular-nums text-[#45474a]">
                                {pct}%
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                                    isFail
                                      ? 'bg-[#ffdad6] text-[#93000a]'
                                      : 'bg-[#fed65b]/35 text-[#735c00]'
                                  }`}
                                >
                                  {res.grade}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
