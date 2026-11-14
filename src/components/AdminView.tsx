import { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  LogOut,
  MapPin,
  Megaphone,
  Pin,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  buildEffectiveGroups,
  calculateGrade,
  DAY_NAMES,
  findTimetableConflicts,
  generateConflictFreeTimetable,
  PERIOD_TIMES,
  PERIODS,
  SEMESTER_GROUPS,
  type BlockTeacherAllocation,
  type GenerationResult,
} from '../lib/timetableGenerator';
import type {
  CalendarEvent,
  CollegeNotice,
  Course,
  LoginLog,
  NoticeCategory,
  RegisteredAccount,
  SavedTimetable,
  Student,
  StudentResult,
  Teacher,
  TeacherAttendanceRecord,
  TeacherAttendanceStatus,
  TimetableSlot,
} from '../types';

interface AdminViewProps {
  adminEmail: string;
  loginLogs: LoginLog[];
  accounts: RegisteredAccount[];
  notices: CollegeNotice[];
  courses: Course[];
  teachers: Teacher[];
  teacherAttendance: TeacherAttendanceRecord[];
  savedTimetables: SavedTimetable[];
  students: Student[];
  studentResults: StudentResult[];
  calendarEvents: CalendarEvent[];
  loadingAdminData: boolean;
  onRefresh: () => Promise<void>;
  onSaveTimetable: (payload: {
    title: string;
    teachersCount: number;
    sectionsCount: number;
    roomsCount: number;
    daysCount: number;
    groups: number[];
    slots: TimetableSlot[];
  }) => Promise<SavedTimetable>;
  onUpdateTimetableSlots: (docId: string, slots: TimetableSlot[]) => Promise<void>;
  onDeleteTimetable: (docId: string) => Promise<void>;
  onCreateNotice: (payload: {
    title: string;
    category: NoticeCategory;
    audience: string;
    body: string;
    isPinned: boolean;
    expiresAt?: string;
  }) => Promise<void>;
  onUpdateNotice: (
    docId: string,
    patch: Partial<{
      title: string;
      category: NoticeCategory;
      audience: string;
      body: string;
      isPinned: boolean;
      isActive: boolean;
      expiresAt: string | null;
    }>
  ) => Promise<void>;
  onDeleteNotice: (docId: string) => Promise<void>;
  onAddTeacher: (payload: {
    name: string;
    title: string;
    department: string;
    email: string;
    office_room: string;
    office_hours: string;
    specialization: string;
    assigned_course?: string;
    publications_count?: number;
    bio?: string;
  }) => Promise<void>;
  onUpdateTeacher: (
    teacher: Teacher,
    patch: {
      name: string;
      title: string;
      department: string;
      email: string;
      office_room: string;
      office_hours: string;
      specialization: string;
      assigned_course?: string;
      publications_count?: number;
      bio?: string;
    }
  ) => Promise<void>;
  onDeleteTeacher: (docId: string) => Promise<void>;
  onMarkTeacherAttendance: (payload: {
    teacherId: number;
    teacherName: string;
    department: string;
    date: string;
    status: TeacherAttendanceStatus;
    notes?: string;
  }) => Promise<void>;
  onCreateCalendarEvent: (payload: {
    title: string;
    category: 'Academic' | 'Exam' | 'Holiday' | 'Deadline' | 'Notice';
    event_date: string;
    end_date?: string;
    location: string;
    semester: string;
    description: string;
  }) => Promise<void>;
  onDeleteCalendarEvent: (ev: CalendarEvent) => Promise<void>;
  onCreateCourse: (payload: {
    code: string;
    title: string;
    department: string;
    duration: string;
    instructor: string;
    description: string;
    credits: number;
    seats_total: number;
    schedule: string;
    syllabus: string;
  }) => Promise<void>;
  onDeleteCourse: (docId: string) => Promise<void>;
  onAddSetupStudent: (payload: {
    name: string;
    student_code: string;
    major: string;
    year_level?: string;
  }) => Promise<void>;
  onDeleteStudent: (docId: string) => Promise<void>;
  onSaveStudentResult: (payload: {
    studentCode: string;
    studentName: string;
    courseName: string;
    subjectName: string;
    marks: number;
    maxMarks: number;
    grade: string;
    semester: string;
  }) => Promise<void>;
  onDeleteStudentResult: (docId: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}

type AdminTab = 'timetable' | 'notices' | 'teachers' | 'calendar' | 'setup' | 'logins';

const NOTICE_CATEGORIES: NoticeCategory[] = [
  'General',
  'Academic',
  'Examination',
  'Urgent',
  'Event',
];

const AUDIENCE_OPTIONS = [
  { value: 'All Students & Faculty', label: 'Both (Teachers & Students)' },
  { value: 'Teachers Only', label: 'Teachers Only' },
  { value: 'Students Only', label: 'Students Only' },
];

const TEACHER_STATUSES: TeacherAttendanceStatus[] = ['Present', 'Absent', 'Late', 'On Leave'];

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

function summarizeUserAgent(ua: string): string {
  if (!ua) return 'Web Browser';
  const browser = ua.includes('Edg/')
    ? 'Edge'
    : ua.includes('Chrome/')
      ? 'Chrome'
      : ua.includes('Firefox/')
        ? 'Firefox'
        : ua.includes('Safari/')
          ? 'Safari'
          : 'Browser';
  const os = ua.includes('Windows')
    ? 'Windows'
    : ua.includes('Mac OS X')
      ? 'macOS'
      : ua.includes('Android')
        ? 'Android'
        : ua.includes('iPhone') || ua.includes('iPad')
          ? 'iOS'
          : ua.includes('Linux')
            ? 'Linux'
            : 'Desktop';
  return `${browser} on ${os}`;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatActionError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  const msg = err.message.trim();
  if (msg.startsWith('{')) {
    try {
      const parsed = JSON.parse(msg) as { error?: string; path?: string };
      if (parsed.error) {
        return parsed.path ? `${parsed.error} (${parsed.path})` : parsed.error;
      }
    } catch {
      // fall through
    }
  }
  return msg || fallback;
}

function defaultGroupsForSections(count: number): number[] {
  return Array.from({ length: count }, (_, i) => Math.floor(i / 6) % 8);
}

export function AdminView({
  adminEmail,
  loginLogs,
  accounts,
  notices,
  courses,
  teachers,
  teacherAttendance,
  savedTimetables,
  students,
  studentResults,
  calendarEvents,
  loadingAdminData,
  onRefresh,
  onSaveTimetable,
  onDeleteTimetable,
  onCreateNotice,
  onUpdateNotice,
  onDeleteNotice,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onMarkTeacherAttendance,
  onCreateCalendarEvent,
  onDeleteCalendarEvent,
  onCreateCourse,
  onDeleteCourse,
  onAddSetupStudent,
  onDeleteStudent,
  onSaveStudentResult,
  onDeleteStudentResult,
  onSignOut,
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('timetable');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // =================== TAB 1: TIMETABLE GENERATOR ===================
  const [ttTitle, setTtTitle] = useState('University Master Timetable');
  const [ttTeachers, setTtTeachers] = useState(48);
  const [ttSections, setTtSections] = useState(48);
  const [ttRooms, setTtRooms] = useState(48);
  const [ttDays, setTtDays] = useState(5);
  const [ttGroups, setTtGroups] = useState<number[]>(() => defaultGroupsForSections(48));
  const [generatedResult, setGeneratedResult] = useState<GenerationResult | null>(null);
  const [ttConfigSnapshot, setTtConfigSnapshot] = useState<{
    T: number;
    S: number;
    R: number;
    D: number;
    groups: number[];
  } | null>(null);
  const [selectedSectionView, setSelectedSectionView] = useState(0);
  const [savingTimetable, setSavingTimetable] = useState(false);

  // =================== TAB 2: NOTICES ===================
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>('General');
  const [noticeAudience, setNoticeAudience] = useState(AUDIENCE_OPTIONS[0].value);
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeExpiresAt, setNoticeExpiresAt] = useState('');
  const [noticePinned, setNoticePinned] = useState(false);
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);

  // =================== TAB 3: TEACHERS & ATTENDANCE ===================
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [tName, setTName] = useState('');
  const [tTitle, setTTitle] = useState('Assistant Professor');
  const [tDept, setTDept] = useState('Computer Science');
  const [tEmail, setTEmail] = useState('');
  const [tRoom, setTRoom] = useState('');
  const [tHours, setTHours] = useState('Mon & Wed · 2:00 PM – 4:00 PM');
  const [tSpec, setTSpec] = useState('');
  const [tAssignedCourse, setTAssignedCourse] = useState('');
  const [tBio, setTBio] = useState('');
  const [teacherSaving, setTeacherSaving] = useState(false);
  const [teacherInlineMsg, setTeacherInlineMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [attDate, setAttDate] = useState(getTodayIso());
  const [attBusyTeacherId, setAttBusyTeacherId] = useState<number | null>(null);
  const [calendarTeacherId, setCalendarTeacherId] = useState<number>(teachers[0]?.id || 1);
  const now = new Date();
  const [tCalYear, setTCalYear] = useState(now.getFullYear());
  const [tCalMonth, setTCalMonth] = useState(now.getMonth());

  // =================== TAB 4: ACADEMIC CALENDAR ===================
  const [calTitle, setCalTitle] = useState('');
  const [calCategory, setCalCategory] = useState<
    'Holiday' | 'Notice' | 'Academic' | 'Exam' | 'Deadline'
  >('Holiday');
  const [calStartDate, setCalStartDate] = useState(getTodayIso());
  const [calEndDate, setCalEndDate] = useState('');
  const [calLocation, setCalLocation] = useState('University Campus');
  const [calSemester, setCalSemester] = useState('Fall 2026');
  const [calDescription, setCalDescription] = useState('');
  const [calSubmitting, setCalSubmitting] = useState(false);
  const [adminCalYear, setAdminCalYear] = useState(now.getFullYear());
  const [adminCalMonth, setAdminCalMonth] = useState(now.getMonth());

  // =================== TAB 5: SETUP ===================
  // Course Setup
  const [sCourseCode, setSCourseCode] = useState('');
  const [sCourseTitle, setSCourseTitle] = useState('');
  const [sCourseDept, setSCourseDept] = useState('Computer Science');
  const [sCourseInstructor, setSCourseInstructor] = useState('');
  const [sCourseCredits, setSCourseCredits] = useState(4);
  const [sCourseSchedule, setSCourseSchedule] = useState('Mon / Wed · 10:00 AM');
  const [sCourseBusy, setSCourseBusy] = useState(false);

  // Student Setup
  const [sStuName, setSStuName] = useState('');
  const [sStuCode, setSStuCode] = useState('');
  const [sStuCourse, setSStuCourse] = useState('Computer Science');
  const [sStuYear, setSStuYear] = useState('Semester 1');
  const [sStuBusy, setSStuBusy] = useState(false);

  // Teacher Quick Setup
  const [qTeacherName, setQTeacherName] = useState('');
  const [qTeacherSubject, setQTeacherSubject] = useState('');
  const [qTeacherDept, setQTeacherDept] = useState('Computer Science');
  const [qTeacherRoom, setQTeacherRoom] = useState('');
  const [qTeacherBusy, setQTeacherBusy] = useState(false);
  const [qTeacherInlineMsg, setQTeacherInlineMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Result Setup
  const [resStudentName, setResStudentName] = useState('');
  const [resStudentCode, setResStudentCode] = useState('');
  const [resCourseName, setResCourseName] = useState('Computer Science');
  const [resSubjectName, setResSubjectName] = useState('');
  const [resMarks, setResMarks] = useState(85);
  const [resMaxMarks, setResMaxMarks] = useState(100);
  const [resSemester, setResSemester] = useState('Semester 1');
  const [resBusy, setResBusy] = useState(false);

  // =================== TAB 6: LOGIN INFO ===================
  const [loginSearch, setLoginSearch] = useState('');

  // =================== HANDLERS ===================
  const handleRefreshClick = async () => {
    setRefreshing(true);
    setFeedback(null);
    try {
      await onRefresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to refresh records.',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // --- Timetable handlers ---
  const handleSectionsCountChange = (val: number) => {
    const clean = Math.min(100, Math.max(1, val || 1));
    setTtSections(clean);
    setTtGroups((prev) => {
      const next: number[] = [];
      for (let i = 0; i < clean; i += 1) {
        const blockStart = Math.floor(i / PERIODS) * PERIODS;
        const blockGroup =
          prev[blockStart] !== undefined ? prev[blockStart] : Math.floor(i / PERIODS) % 8;
        next.push(blockGroup);
      }
      return next;
    });
    if (selectedSectionView >= clean) setSelectedSectionView(0);
  };

  const handleBlockSemesterChange = (blockIdx: number, semesterGroupIdx: number) => {
    setTtGroups((prev) => {
      const copy = [...prev];
      const start = blockIdx * PERIODS;
      const end = Math.min(start + PERIODS, ttSections);
      for (let s = start; s < end; s += 1) {
        copy[s] = semesterGroupIdx;
      }
      return copy;
    });
  };

  const handleGenerateTimetable = () => {
    setFeedback(null);
    const cfg = {
      T: Math.min(300, Math.max(1, ttTeachers)),
      S: Math.min(100, Math.max(1, ttSections)),
      R: Math.min(300, Math.max(1, ttRooms)),
      D: Math.min(7, Math.max(1, ttDays)),
      groups: ttGroups.slice(0, ttSections),
    };
    const res = generateConflictFreeTimetable(cfg, teachers, courses);
    setTtConfigSnapshot(cfg);
    setGeneratedResult(res);
    setSelectedSectionView(0);

    if (res.ok) {
      setFeedback({
        type: 'success',
        text: `Generated conflict-free timetable for ${cfg.S} section(s) over ${cfg.D} day(s) with strict 6-section block teachers and 0 clashes.`,
      });
    } else {
      setFeedback({
        type: 'error',
        text: res.errors[0] || 'Unable to generate timetable with current counts.',
      });
    }
  };

  const handleResetTimetableInputs = () => {
    setTtTeachers(48);
    setTtSections(48);
    setTtRooms(48);
    setTtDays(5);
    setTtGroups(defaultGroupsForSections(48));
    setGeneratedResult(null);
    setTtConfigSnapshot(null);
    setFeedback(null);
  };

  const handleSaveGeneratedTimetable = async () => {
    if (!generatedResult || !generatedResult.ok || !ttConfigSnapshot) return;
    setSavingTimetable(true);
    setFeedback(null);
    try {
      await onSaveTimetable({
        title: ttTitle,
        teachersCount: ttConfigSnapshot.T,
        sectionsCount: ttConfigSnapshot.S,
        roomsCount: ttConfigSnapshot.R,
        daysCount: ttConfigSnapshot.D,
        groups: ttConfigSnapshot.groups,
        slots: generatedResult.slots,
      });
      setFeedback({
        type: 'success',
        text: 'Timetable saved to Cloud Firestore! Students can now view it read-only in the Student Portal.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: formatActionError(err, 'Unable to save timetable.'),
      });
    } finally {
      setSavingTimetable(false);
    }
  };

  const handleLoadSavedTimetable = (tt: SavedTimetable) => {
    const cfg = {
      T: tt.teachersCount,
      S: tt.sectionsCount,
      R: tt.roomsCount,
      D: tt.daysCount,
      groups: tt.groups,
    };
    setTtTitle(tt.title);
    setTtTeachers(tt.teachersCount);
    setTtSections(tt.sectionsCount);
    setTtRooms(tt.roomsCount);
    setTtDays(tt.daysCount);
    setTtGroups(tt.groups);
    setTtConfigSnapshot(cfg);

    const effectiveGroups = buildEffectiveGroups(courses);
    const conflicts = findTimetableConflicts(tt.slots, cfg, effectiveGroups);
    const courseTeachers: GenerationResult['courseTeachers'] = {};
    tt.slots.forEach((sl) => {
      const list = (courseTeachers[sl.courseId] ||= []);
      if (!list.some((x) => x.idx === sl.teacherIdx)) {
        list.push({ idx: sl.teacherIdx, id: sl.teacherId, name: sl.teacherName });
      }
    });

    const numBlocks = Math.ceil(tt.sectionsCount / PERIODS);
    const blockAllocations: BlockTeacherAllocation[] = [];
    for (let b = 0; b < numBlocks; b += 1) {
      const sStart = b * PERIODS;
      const sEnd = Math.min(sStart + PERIODS, tt.sectionsCount);
      const g = tt.groups[sStart] ?? (b % effectiveGroups.length);
      const seenCourses = new Map<
        number,
        {
          courseId: number;
          courseName: string;
          teacherIdx: number;
          teacherId: number;
          teacherName: string;
        }
      >();
      tt.slots
        .filter((sl) => sl.s >= sStart && sl.s < sEnd)
        .forEach((sl) => {
          if (!seenCourses.has(sl.courseId)) {
            seenCourses.set(sl.courseId, {
              courseId: sl.courseId,
              courseName: sl.courseName,
              teacherIdx: sl.teacherIdx,
              teacherId: sl.teacherId,
              teacherName: sl.teacherName,
            });
          }
        });
      blockAllocations.push({
        blockIndex: b,
        semesterIndex: g + 1,
        semesterLabel: effectiveGroups[g]?.label || `Semester ${g + 1}`,
        sectionStart: sStart + 1,
        sectionEnd: sEnd,
        teacherStart: b * PERIODS + 1,
        teacherEnd: (b + 1) * PERIODS,
        assignments: Array.from(seenCourses.values()).sort(
          (a, c) => a.teacherIdx - c.teacherIdx
        ),
      });
    }

    setGeneratedResult({
      ok: true,
      errors: [],
      slots: tt.slots,
      courseTeachers,
      blockAllocations,
      conflicts,
      effectiveGroups,
    });
    setSelectedSectionView(0);
    setFeedback({ type: 'success', text: `Loaded saved timetable "${tt.title}".` });
  };

  // --- Notice handlers ---
  const resetNoticeForm = () => {
    setEditingNoticeId(null);
    setNoticeTitle('');
    setNoticeCategory('General');
    setNoticeAudience(AUDIENCE_OPTIONS[0].value);
    setNoticeBody('');
    setNoticeExpiresAt('');
    setNoticePinned(false);
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoticeSubmitting(true);
    setFeedback(null);
    try {
      if (editingNoticeId) {
        await onUpdateNotice(editingNoticeId, {
          title: noticeTitle,
          category: noticeCategory,
          audience: noticeAudience,
          body: noticeBody,
          isPinned: noticePinned,
          expiresAt: noticeExpiresAt || null,
        });
        setFeedback({ type: 'success', text: 'Notice updated in Cloud Firestore.' });
      } else {
        await onCreateNotice({
          title: noticeTitle,
          category: noticeCategory,
          audience: noticeAudience,
          body: noticeBody,
          isPinned: noticePinned,
          expiresAt: noticeExpiresAt || undefined,
        });
        setFeedback({
          type: 'success',
          text: `Notice published to "${noticeAudience}".`,
        });
      }
      resetNoticeForm();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save notice.',
      });
    } finally {
      setNoticeSubmitting(false);
    }
  };

  // --- Teacher Add/Update & Attendance handlers ---
  const resetTeacherForm = () => {
    setEditingTeacher(null);
    setTName('');
    setTTitle('Assistant Professor');
    setTDept('Computer Science');
    setTEmail('');
    setTRoom('');
    setTHours('Mon & Wed · 2:00 PM – 4:00 PM');
    setTSpec('');
    setTAssignedCourse('');
    setTBio('');
  };

  const startEditTeacher = (t: Teacher) => {
    setTeacherInlineMsg(null);
    setEditingTeacher(t);
    setTName(t.name);
    setTTitle(t.title);
    setTDept(t.department);
    setTEmail(t.email);
    setTRoom(t.office_room);
    setTHours(t.office_hours);
    setTSpec(t.specialization);
    setTAssignedCourse(t.assigned_course || '');
    setTBio(t.bio);
  };

  const handleTeacherFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherSaving(true);
    setFeedback(null);
    setTeacherInlineMsg(null);
    const payload = {
      name: tName,
      title: tTitle,
      department: tDept,
      email: tEmail,
      office_room: tRoom,
      office_hours: tHours,
      specialization: tSpec || tAssignedCourse || 'Core Curriculum',
      assigned_course: tAssignedCourse,
      bio: tBio,
    };

    try {
      if (editingTeacher) {
        await onUpdateTeacher(editingTeacher, payload);
        const msg = `Saved updates for ${tName.trim()} to Cloud Firestore.`;
        setFeedback({ type: 'success', text: msg });
        setTeacherInlineMsg({ type: 'success', text: msg });
      } else {
        await onAddTeacher(payload);
        const msg = `Added new faculty member ${tName.trim()} to Cloud Firestore.`;
        setFeedback({ type: 'success', text: msg });
        setTeacherInlineMsg({ type: 'success', text: msg });
      }
      resetTeacherForm();
    } catch (err) {
      const errText = formatActionError(err, 'Unable to save teacher details.');
      setFeedback({ type: 'error', text: errText });
      setTeacherInlineMsg({ type: 'error', text: errText });
    } finally {
      setTeacherSaving(false);
    }
  };

  const handleMarkTeacher = async (teacher: Teacher, date: string, status: TeacherAttendanceStatus) => {
    setAttBusyTeacherId(teacher.id);
    setFeedback(null);
    try {
      await onMarkTeacherAttendance({
        teacherId: teacher.id,
        teacherName: teacher.name,
        department: teacher.department,
        date,
        status,
      });
      setFeedback({
        type: 'success',
        text: `Marked ${teacher.name} as ${status} on ${date}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to mark teacher attendance.',
      });
    } finally {
      setAttBusyTeacherId(null);
    }
  };

  const cycleCalendarDateStatus = async (teacher: Teacher, dateIso: string) => {
    const existing = teacherAttendance.find(
      (r) => r.teacherId === teacher.id && r.date === dateIso
    );
    const nextStatus: TeacherAttendanceStatus = !existing
      ? 'Present'
      : existing.status === 'Present'
        ? 'Absent'
        : existing.status === 'Absent'
          ? 'Late'
          : existing.status === 'Late'
            ? 'On Leave'
            : 'Present';
    await handleMarkTeacher(teacher, dateIso, nextStatus);
  };

  // --- Academic Calendar handlers ---
  const handleAddCalendarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalSubmitting(true);
    setFeedback(null);
    try {
      await onCreateCalendarEvent({
        title: calTitle,
        category: calCategory,
        event_date: calStartDate,
        end_date: calEndDate || undefined,
        location: calLocation,
        semester: calSemester,
        description: calDescription || `${calCategory} scheduled by University Administration.`,
      });
      setCalTitle('');
      setCalDescription('');
      setCalEndDate('');
      setFeedback({
        type: 'success',
        text: `Added ${calCategory} "${calTitle}" to Academic Calendar.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save calendar event.',
      });
    } finally {
      setCalSubmitting(false);
    }
  };

  // --- Setup handlers ---
  const handleSetupAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSCourseBusy(true);
    setFeedback(null);
    try {
      await onCreateCourse({
        code: sCourseCode,
        title: sCourseTitle,
        department: sCourseDept,
        duration: '12 Weeks',
        instructor: sCourseInstructor || 'Faculty Instructor',
        description: `${sCourseTitle} offered under ${sCourseDept}.`,
        credits: sCourseCredits,
        seats_total: 60,
        schedule: sCourseSchedule,
        syllabus: 'Core lectures, laboratory assignments, and assessments.',
      });
      setSCourseCode('');
      setSCourseTitle('');
      setSCourseInstructor('');
      setFeedback({ type: 'success', text: `Course "${sCourseTitle}" added to catalog & timetable setup.` });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to add course.',
      });
    } finally {
      setSCourseBusy(false);
    }
  };

  const handleSetupAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSStuBusy(true);
    setFeedback(null);
    try {
      await onAddSetupStudent({
        name: sStuName,
        student_code: sStuCode,
        major: sStuCourse,
        year_level: sStuYear,
      });
      setSStuName('');
      setSStuCode('');
      setFeedback({ type: 'success', text: `Student "${sStuName}" saved to directory.` });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to add student.',
      });
    } finally {
      setSStuBusy(false);
    }
  };

  const handleSetupQuickTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setQTeacherBusy(true);
    setFeedback(null);
    setQTeacherInlineMsg(null);
    const cleanName = qTeacherName.trim();
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    try {
      await onAddTeacher({
        name: cleanName,
        title: 'Faculty Lecturer',
        department: qTeacherDept,
        email: `${slug || `faculty.${teachers.length + 1}`}@excellence.edu`,
        office_room: qTeacherRoom.trim() || 'Faculty Wing 101',
        office_hours: 'Mon & Wed · 2:00 PM – 4:00 PM',
        specialization: qTeacherSubject.trim() || 'Core Curriculum',
        assigned_course: qTeacherSubject,
        bio: `Teaches ${qTeacherSubject.trim() || qTeacherDept} at Excellence University.`,
      });
      setQTeacherName('');
      setQTeacherSubject('');
      setQTeacherRoom('');
      const msg = `Teacher "${cleanName}" saved to Cloud Firestore and linked to Timetable Generator.`;
      setFeedback({ type: 'success', text: msg });
      setQTeacherInlineMsg({ type: 'success', text: msg });
    } catch (err) {
      const errText = formatActionError(err, 'Unable to add teacher.');
      setFeedback({ type: 'error', text: errText });
      setQTeacherInlineMsg({ type: 'error', text: errText });
    } finally {
      setQTeacherBusy(false);
    }
  };

  const handleSetupSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setResBusy(true);
    setFeedback(null);
    const gradeObj = calculateGrade(resMarks, resMaxMarks);
    try {
      await onSaveStudentResult({
        studentCode: resStudentCode || 'STU-101',
        studentName: resStudentName,
        courseName: resCourseName,
        subjectName: resSubjectName,
        marks: resMarks,
        maxMarks: resMaxMarks,
        grade: gradeObj.letter,
        semester: resSemester,
      });
      setResSubjectName('');
      setFeedback({
        type: 'success',
        text: `Saved result for ${resStudentName} (${gradeObj.letter}). Searchable by name in Student Portal.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save result.',
      });
    } finally {
      setResBusy(false);
    }
  };

  // =================== COMPUTED DATA ===================
  const selectedCalendarTeacher =
    teachers.find((t) => t.id === calendarTeacherId) || teachers[0] || null;

  const teacherCalendarCells = useMemo(() => {
    const first = new Date(tCalYear, tCalMonth, 1).getDay();
    const total = new Date(tCalYear, tCalMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; iso: string; isSunday: boolean }> = [];
    for (let i = 0; i < first; i += 1) cells.push({ day: null, iso: '', isSunday: false });
    for (let d = 1; d <= total; d += 1) {
      const iso = `${tCalYear}-${String(tCalMonth + 1).padStart(2, '0')}-${String(d).padStart(
        2,
        '0'
      )}`;
      cells.push({
        day: d,
        iso,
        isSunday: new Date(tCalYear, tCalMonth, d).getDay() === 0,
      });
    }
    return cells;
  }, [tCalYear, tCalMonth]);

  const adminCalendarCells = useMemo(() => {
    const first = new Date(adminCalYear, adminCalMonth, 1).getDay();
    const total = new Date(adminCalYear, adminCalMonth + 1, 0).getDate();
    const cells: Array<{
      day: number | null;
      iso: string;
      isSunday: boolean;
      dayEvents: CalendarEvent[];
    }> = [];
    for (let i = 0; i < first; i += 1)
      cells.push({ day: null, iso: '', isSunday: false, dayEvents: [] });
    for (let d = 1; d <= total; d += 1) {
      const iso = `${adminCalYear}-${String(adminCalMonth + 1).padStart(2, '0')}-${String(
        d
      ).padStart(2, '0')}`;
      const dayEvents = calendarEvents.filter((ev) => {
        if (ev.event_date === iso) return true;
        if (ev.end_date && iso >= ev.event_date && iso <= ev.end_date) return true;
        return false;
      });
      cells.push({
        day: d,
        iso,
        isSunday: new Date(adminCalYear, adminCalMonth, d).getDay() === 0,
        dayEvents,
      });
    }
    return cells;
  }, [adminCalYear, adminCalMonth, calendarEvents]);

  const filteredLogs = useMemo(() => {
    const q = loginSearch.trim().toLowerCase();
    if (!q) return loginLogs;
    return loginLogs.filter(
      (l) =>
        l.email.toLowerCase().includes(q) ||
        l.displayName.toLowerCase().includes(q) ||
        l.uid.toLowerCase().includes(q)
    );
  }, [loginLogs, loginSearch]);

  const conflictSummaryCount = generatedResult
    ? Object.values(generatedResult.conflicts).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <div className="bg-[#f7f9ff] min-h-screen">
      {/* Dark Page Banner */}
      <section className="bg-[#1a1c1f] text-white py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#ffe088] mb-2">
              University Administration
            </p>
            <h1 className="text-4xl font-['Newsreader',Georgia,serif] font-semibold tracking-tight mb-2">
              Admin Control Portal
            </h1>
            <p className="text-base text-[#c6c6ca] max-w-2xl">
              Generate conflict-free timetables, send targeted notices, manage teachers &amp;
              attendance, update the academic calendar, and configure courses, students &amp;
              results.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <span className="text-xs text-[#c6c6ca] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-[#fed65b]" />
              <span>{adminEmail}</span>
            </span>
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={refreshing || loadingAdminData}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#fed65b] ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync Data</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#fed65b] text-[#745c00] hover:bg-[#e9c349] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-8">
        {/* Segmented Tab Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e0e3e8]">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#ebeef3] rounded-lg self-start">
            {(
              [
                { id: 'timetable', label: 'Timetable', icon: Clock },
                { id: 'notices', label: `Notices (${notices.length})`, icon: Megaphone },
                { id: 'teachers', label: `Teachers & Attendance (${teachers.length})`, icon: UserCheck },
                { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
                { id: 'setup', label: 'Setup', icon: Settings },
                { id: 'logins', label: `Login Info (${loginLogs.length})`, icon: Users },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setFeedback(null);
                  }}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-[#181c20] shadow-sm'
                      : 'text-[#45474a] hover:text-[#181c20]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#735c00]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-sm flex items-center justify-between gap-3 ${
              feedback.type === 'success'
                ? 'bg-[#fed65b]/30 text-[#574500] border border-[#735c00]/20'
                : 'bg-[#ffdad6] text-[#93000a]'
            }`}
          >
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </span>
            <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 1: CONFLICT-FREE TIMETABLE GENERATOR                            */}
        {/* =================================================================== */}
        {activeTab === 'timetable' && (
          <div className="space-y-8">
            <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#735c00]">
                    Zero-Clash Scheduler
                  </p>
                  <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] mt-0.5">
                    College Timetable Setup &amp; Generator
                  </h2>
                  <p className="text-xs text-[#45474a] mt-1">
                    Assign each section to a year and semester, then generate a guaranteed
                    conflict-free timetable in a split second.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTtTeachers(48);
                      setTtSections(48);
                      setTtRooms(48);
                      setTtGroups(defaultGroupsForSections(48));
                    }}
                    className="px-3 py-2 rounded-lg border border-[#c6c6ca] text-xs font-semibold text-[#181c20] hover:bg-[#f1f4f9] cursor-pointer"
                  >
                    48 Sections · 48 Teachers Preset
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTtTeachers(Math.max(Math.ceil(ttSections / PERIODS) * PERIODS, teachers.length))
                    }
                    className="px-3 py-2 rounded-lg border border-[#c6c6ca] text-xs font-semibold text-[#181c20] hover:bg-[#f1f4f9] cursor-pointer"
                  >
                    Use Setup Teachers ({teachers.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTimetableInputs}
                    className="px-3 py-2 rounded-lg border border-[#c6c6ca] text-xs font-semibold text-[#45474a] hover:bg-[#f1f4f9] cursor-pointer"
                  >
                    Reset Values
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-[#45474a] mb-1">
                    Schedule Title
                  </label>
                  <input
                    value={ttTitle}
                    onChange={(e) => setTtTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#45474a] mb-1">
                    Number of Teachers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={ttTeachers}
                    onChange={(e) => setTtTeachers(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#45474a] mb-1">
                    Number of Sections
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={ttSections}
                    onChange={(e) => handleSectionsCountChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#45474a] mb-1">
                    Number of Rooms
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={ttRooms}
                    onChange={(e) => setTtRooms(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Days (1–7)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={ttDays}
                      onChange={(e) => setTtDays(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Periods
                    </label>
                    <input
                      type="number"
                      value={PERIODS}
                      readOnly
                      className="w-full px-2.5 py-2 rounded-lg border border-[#ebeef3] bg-[#f1f4f9] text-sm text-[#76777b] tabular-nums cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-[#181c20]">
                    Semester &amp; Dedicated Teacher Blocks ({ttSections} Sections)
                  </h3>
                  <span className="text-xs text-[#735c00] font-medium">
                    Sections 1–6 → Teachers 1–6 · Sections 7–12 → Teachers 7–12 · … · Sections
                    43–48 → Teachers 43–48
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto border border-[#ebeef3] rounded-xl divide-y divide-[#ebeef3] px-4">
                  {Array.from(
                    { length: Math.ceil(ttSections / PERIODS) },
                    (_, blockIdx) => {
                      const sStart = blockIdx * PERIODS + 1;
                      const sEnd = Math.min((blockIdx + 1) * PERIODS, ttSections);
                      const tStart = blockIdx * PERIODS + 1;
                      const tEnd = (blockIdx + 1) * PERIODS;
                      const g = ttGroups[blockIdx * PERIODS] ?? (blockIdx % SEMESTER_GROUPS.length);
                      return (
                        <div
                          key={blockIdx}
                          className="py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                        >
                          <div className="md:col-span-4">
                            <p className="text-xs font-semibold text-[#181c20]">
                              Sections {sStart}–{sEnd}
                            </p>
                            <p className="text-[11px] text-[#735c00] font-medium">
                              Assigned Teachers: Teacher {tStart} – Teacher {tEnd}
                            </p>
                          </div>
                          <div className="md:col-span-5 flex items-center gap-2">
                            <label className="text-xs text-[#45474a] shrink-0">Semester</label>
                            <select
                              value={g}
                              onChange={(e) =>
                                handleBlockSemesterChange(blockIdx, Number(e.target.value))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#c6c6ca] bg-white text-xs font-medium"
                            >
                              {SEMESTER_GROUPS.map((sem, semIdx) => (
                                <option key={sem.name} value={semIdx}>
                                  Semester {semIdx + 1} ({sem.label})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-3 text-[11px] text-[#45474a] md:text-right">
                            6 subjects · 0 overlap
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGenerateTimetable}
                  className="px-5 py-2.5 rounded-lg bg-[#000000] text-white text-sm font-semibold hover:bg-[#735c00] transition-colors cursor-pointer"
                >
                  Generate Conflict-Free Timetable
                </button>
                {generatedResult?.ok && ttConfigSnapshot && (
                  <button
                    type="button"
                    disabled={savingTimetable}
                    onClick={handleSaveGeneratedTimetable}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#fed65b] text-[#745c00] text-sm font-semibold hover:bg-[#e9c349] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingTimetable ? 'Saving...' : 'Save Timetable to Portal'}</span>
                  </button>
                )}
              </div>
            </section>

            {/* Generated Result Grid + Conflict Report */}
            {generatedResult && !generatedResult.ok && (
              <section className="bg-[#ffdad6] text-[#93000a] rounded-xl p-6 space-y-2">
                <h3 className="text-lg font-semibold">
                  A valid timetable cannot be generated with these numbers
                </h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {generatedResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </section>
            )}

            {generatedResult && generatedResult.ok && ttConfigSnapshot && (
              <>
                <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                        Section Timetable Preview
                      </h2>
                      <p className="text-xs text-[#45474a]">
                        Inspect any section across {ttConfigSnapshot.D} working day(s). Section{' '}
                        {selectedSectionView + 1} uses Teachers{' '}
                        {Math.floor(selectedSectionView / PERIODS) * PERIODS + 1}–
                        {(Math.floor(selectedSectionView / PERIODS) + 1) * PERIODS} only.
                      </p>
                    </div>
                    <div className="w-full md:w-80">
                      <select
                        value={selectedSectionView}
                        onChange={(e) => setSelectedSectionView(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] bg-white text-sm"
                      >
                        {ttConfigSnapshot.groups.map((g, idx) => {
                          const b = Math.floor(idx / PERIODS);
                          return (
                            <option key={idx} value={idx}>
                              Section {idx + 1} (Sem {g + 1} · Year {Math.floor(g / 2) + 1}, S
                              {(g % 2) + 1} · Teachers {b * PERIODS + 1}–{(b + 1) * PERIODS})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Courses in this semester */}
                  <div className="flex flex-wrap gap-2">
                    {generatedResult.effectiveGroups[
                      ttConfigSnapshot.groups[selectedSectionView]
                    ]?.courses.map((cName) => (
                      <span
                        key={cName}
                        className="px-3 py-1 rounded-full bg-[#f1f4f9] border border-[#c6c6ca]/40 text-xs font-medium text-[#181c20]"
                      >
                        {cName}
                      </span>
                    ))}
                  </div>

                  <div className="overflow-x-auto border border-[#ebeef3] rounded-xl">
                    <table className="w-full text-left border-collapse min-w-[680px]">
                      <thead>
                        <tr className="bg-[#1a1c1f] text-white text-xs font-semibold">
                          <th className="py-3 px-4 w-28">Period</th>
                          {Array.from({ length: ttConfigSnapshot.D }, (_, d) => (
                            <th key={d} className="py-3 px-4">
                              {DAY_NAMES[d]}
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
                            {Array.from({ length: ttConfigSnapshot.D }, (_, d) => {
                              const cell = generatedResult.slots.find(
                                (sl) => sl.s === selectedSectionView && sl.d === d && sl.p === p
                              );
                              return (
                                <td key={d} className="py-3 px-4 border-l border-[#ebeef3]">
                                  {cell ? (
                                    <div>
                                      <p className="font-semibold text-[#181c20]">
                                        {cell.courseName}
                                      </p>
                                      <p className="text-xs text-[#45474a] mt-0.5">
                                        {cell.teacherName === `Teacher ${cell.teacherIdx + 1}`
                                          ? cell.teacherName
                                          : `Teacher ${cell.teacherIdx + 1} (${cell.teacherName})`}{' '}
                                        · Room {cell.roomNumber}
                                      </p>
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

                  {/* Block Teacher Allocation Summary */}
                  {generatedResult.blockAllocations &&
                    generatedResult.blockAllocations.length > 0 && (
                      <div className="pt-2 space-y-3">
                        <h3 className="text-sm font-semibold text-[#181c20]">
                          Block Teacher Mapping (Dedicated 6 Teachers per 6 Sections)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                          {generatedResult.blockAllocations.map((blk) => {
                            const isCurrentBlock =
                              Math.floor(selectedSectionView / PERIODS) === blk.blockIndex;
                            return (
                              <div
                                key={blk.blockIndex}
                                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                                  isCurrentBlock
                                    ? 'bg-[#fed65b]/20 border-[#735c00]/40'
                                    : 'bg-[#f7f9ff] border-[#ebeef3]'
                                }`}
                              >
                                <div className="flex items-center justify-between font-semibold text-[#181c20]">
                                  <span>
                                    Sem {blk.semesterIndex} · Sec {blk.sectionStart}–
                                    {blk.sectionEnd}
                                  </span>
                                  <span className="text-[#735c00]">
                                    Teachers {blk.teacherStart}–{blk.teacherEnd}
                                  </span>
                                </div>
                                <div className="space-y-0.5 text-[11px] text-[#45474a]">
                                  {blk.assignments.map((a) => (
                                    <div key={a.courseId} className="truncate">
                                      <strong className="text-[#181c20]">
                                        T{a.teacherIdx + 1}
                                      </strong>{' '}
                                      {a.teacherName !== `Teacher ${a.teacherIdx + 1}`
                                        ? `(${a.teacherName}) `
                                        : ''}
                                      → {a.courseName}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </section>

                {/* Conflict Report */}
                <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-4">
                  <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                    Conflict Verification Report
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    {[
                      { label: 'Teacher clashes', val: generatedResult.conflicts.teacher.length },
                      { label: 'Room clashes', val: generatedResult.conflicts.room.length },
                      { label: 'Repeated courses', val: generatedResult.conflicts.repeat.length },
                      { label: 'Semester errors', val: generatedResult.conflicts.semester.length },
                      { label: 'Empty slots', val: generatedResult.conflicts.empty.length },
                      { label: 'Multi-subject teachers', val: generatedResult.conflicts.multi.length },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="p-3 rounded-lg bg-[#f7f9ff] border border-[#ebeef3]"
                      >
                        <p className="text-[#45474a]">{stat.label}</p>
                        <p className="text-xl font-bold text-[#735c00] mt-1 tabular-nums">
                          {stat.val}
                        </p>
                      </div>
                    ))}
                  </div>
                  {conflictSummaryCount === 0 && (
                    <div className="p-3.5 rounded-lg bg-[#e8f6f0] text-[#12805c] border border-[#b5e2d0] text-sm font-medium">
                      No conflicts found. Every 6-section block strictly uses its 6 assigned
                      teachers without any overlap.
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Saved Timetables in Firestore */}
            <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                  Saved Timetables ({savedTimetables.length})
                </h2>
                <span className="text-xs text-[#45474a]">
                  Visible read-only in Student Portal
                </span>
              </div>

              {savedTimetables.length === 0 ? (
                <p className="text-sm text-[#45474a]">
                  No timetables saved yet. Generate a timetable above and click &ldquo;Save
                  Timetable to Portal&rdquo;.
                </p>
              ) : (
                <div className="divide-y divide-[#ebeef3] border border-[#ebeef3] rounded-xl overflow-hidden">
                  {savedTimetables.map((tt) => (
                    <div
                      key={tt.docId}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f7f9ff]"
                    >
                      <div>
                        <p className="font-semibold text-[#181c20]">{tt.title}</p>
                        <p className="text-xs text-[#45474a] mt-0.5 tabular-nums">
                          {tt.sectionsCount} Sections · {tt.teachersCount} Teachers ·{' '}
                          {tt.roomsCount} Rooms · {tt.daysCount} Days · Saved{' '}
                          {formatDateTime(tt.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleLoadSavedTimetable(tt)}
                          className="px-3 py-1.5 rounded-lg border border-[#c6c6ca] text-xs font-semibold text-[#181c20] hover:bg-[#ebeef3] cursor-pointer"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteTimetable(tt.docId);
                            setFeedback({ type: 'success', text: `Deleted timetable "${tt.title}".` });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#c6c6ca] text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: COLLEGE NOTICES (STUDENTS, TEACHERS, OR BOTH)                */}
        {/* =================================================================== */}
        {activeTab === 'notices' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={handleNoticeSubmit}
              className="lg:col-span-5 bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                  {editingNoticeId ? 'Edit Notice' : 'Publish Official Notice'}
                </h2>
                {editingNoticeId && (
                  <button
                    type="button"
                    onClick={resetNoticeForm}
                    className="text-xs font-semibold text-[#735c00] hover:underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#45474a] mb-1">
                  Notice Title
                </label>
                <input
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Semester Examination Schedule Released"
                  className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#45474a] mb-1">Category</label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as NoticeCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] bg-white text-sm"
                  >
                    {NOTICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#45474a] mb-1">Send To</label>
                  <select
                    value={noticeAudience}
                    onChange={(e) => setNoticeAudience(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] bg-white text-sm"
                  >
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#45474a] mb-1">
                  Notice Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={noticeBody}
                  onChange={(e) => setNoticeBody(e.target.value)}
                  placeholder="Write the official notice for teachers and/or students..."
                  className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-medium text-[#45474a] mb-1">
                    Expires On (Optional)
                  </label>
                  <input
                    type="date"
                    value={noticeExpiresAt}
                    onChange={(e) => setNoticeExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#181c20] pt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noticePinned}
                    onChange={(e) => setNoticePinned(e.target.checked)}
                    className="w-4 h-4 accent-[#735c00]"
                  />
                  <span>Pin to top</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={noticeSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-[#000000] text-white text-sm font-semibold hover:bg-[#735c00] transition-colors cursor-pointer disabled:opacity-60"
              >
                {noticeSubmitting
                  ? 'Publishing...'
                  : editingNoticeId
                    ? 'Update Notice'
                    : 'Publish Notice'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                  Published Notices ({notices.length})
                </h2>
              </div>

              {notices.length === 0 ? (
                <div className="bg-white rounded-xl p-10 border border-[#c6c6ca]/40 text-center text-sm text-[#45474a]">
                  No notices stored in Cloud Firestore yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {notices.map((notice) => (
                    <article
                      key={notice.docId}
                      className={`bg-white rounded-xl p-5 border shadow-sm space-y-3 ${
                        notice.isActive
                          ? 'border-[#c6c6ca]/40'
                          : 'border-[#ebeef3] opacity-70 bg-[#f7f9ff]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-[#735c00]">
                            {notice.category} · {notice.audience}
                            {notice.isPinned ? ' · Pinned' : ''}
                            {!notice.isActive ? ' · Hidden' : ''}
                          </p>
                          <h3 className="text-xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] mt-0.5">
                            {notice.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateNotice(notice.docId, { isPinned: !notice.isPinned })
                            }
                            title={notice.isPinned ? 'Unpin' : 'Pin'}
                            className="p-1.5 rounded-lg border border-[#c6c6ca]/60 text-[#735c00] hover:bg-[#f1f4f9] cursor-pointer"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateNotice(notice.docId, { isActive: !notice.isActive })
                            }
                            title={notice.isActive ? 'Hide' : 'Show'}
                            className="p-1.5 rounded-lg border border-[#c6c6ca]/60 text-[#45474a] hover:bg-[#f1f4f9] cursor-pointer"
                          >
                            {notice.isActive ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoticeId(notice.docId);
                              setNoticeTitle(notice.title);
                              setNoticeCategory(notice.category);
                              setNoticeAudience(notice.audience);
                              setNoticeBody(notice.body);
                              setNoticeExpiresAt(notice.expiresAt || '');
                              setNoticePinned(notice.isPinned);
                            }}
                            title="Edit"
                            className="p-1.5 rounded-lg border border-[#c6c6ca]/60 text-[#181c20] hover:bg-[#f1f4f9] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteNotice(notice.docId);
                              setFeedback({
                                type: 'success',
                                text: `Deleted notice "${notice.title}".`,
                              });
                            }}
                            title="Delete"
                            className="p-1.5 rounded-lg border border-[#c6c6ca]/60 text-[#ba1a1a] hover:bg-[#ffdad6]/50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-[#45474a] leading-relaxed">{notice.body}</p>
                      <p className="text-xs text-[#76777b] tabular-nums">
                        Published {formatDateTime(notice.createdAt)}
                        {notice.expiresAt ? ` · Expires ${notice.expiresAt}` : ''}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: TEACHER ADD/UPDATE & ATTENDANCE CALENDAR                     */}
        {/* =================================================================== */}
        {activeTab === 'teachers' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Add / Update Teacher Form */}
              <form
                onSubmit={handleTeacherFormSubmit}
                className="lg:col-span-5 bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                    {editingTeacher ? `Update ${editingTeacher.name}` : 'Add New Teacher'}
                  </h2>
                  {editingTeacher && (
                    <button
                      type="button"
                      onClick={resetTeacherForm}
                      className="text-xs font-semibold text-[#735c00] hover:underline cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Full Name
                    </label>
                    <input
                      required
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                      placeholder="Prof. Ananya Verma"
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Department
                    </label>
                    <input
                      required
                      value={tDept}
                      onChange={(e) => setTDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Title / Designation
                    </label>
                    <input
                      required
                      value={tTitle}
                      onChange={(e) => setTTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Email Address
                    </label>
                    <input
                      type="text"
                      value={tEmail}
                      onChange={(e) => setTEmail(e.target.value)}
                      placeholder="Auto-generated if left blank"
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Office Room
                    </label>
                    <input
                      value={tRoom}
                      onChange={(e) => setTRoom(e.target.value)}
                      placeholder="Turing Pavilion 210"
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Office Hours
                    </label>
                    <input
                      value={tHours}
                      onChange={(e) => setTHours(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Assigned Subject (Timetable)
                    </label>
                    <input
                      value={tAssignedCourse}
                      onChange={(e) => setTAssignedCourse(e.target.value)}
                      placeholder="e.g. Data Structures"
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Specialization
                    </label>
                    <input
                      value={tSpec}
                      onChange={(e) => setTSpec(e.target.value)}
                      placeholder="Algorithms & ML"
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#45474a] mb-1">
                    Faculty Bio
                  </label>
                  <textarea
                    rows={2}
                    value={tBio}
                    onChange={(e) => setTBio(e.target.value)}
                    placeholder="Short academic background..."
                    className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                  />
                </div>

                {teacherInlineMsg && (
                  <div
                    className={`p-3 rounded-lg text-xs font-medium ${
                      teacherInlineMsg.type === 'success'
                        ? 'bg-[#e8f6f0] text-[#12805c] border border-[#b5e2d0]'
                        : 'bg-[#ffdad6] text-[#93000a]'
                    }`}
                  >
                    {teacherInlineMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={teacherSaving}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#000000] text-white text-sm font-semibold hover:bg-[#735c00] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {teacherSaving
                    ? 'Saving...'
                    : editingTeacher
                      ? 'Update Teacher Details'
                      : 'Add Teacher to Database'}
                </button>
              </form>

              {/* Right: Daily Teacher Attendance Roster */}
              <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#ebeef3]">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#735c00]">
                      Daily Attendance Roll
                    </p>
                    <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] mt-0.5">
                      Mark Teacher Present / Absent
                    </h2>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Attendance Date
                    </label>
                    <input
                      type="date"
                      value={attDate}
                      onChange={(e) => setAttDate(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#ebeef3] rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f1f4f9] border-b border-[#ebeef3] text-xs font-semibold text-[#45474a]">
                        <th className="py-3 px-4">Teacher</th>
                        <th className="py-3 px-4">Status ({attDate})</th>
                        <th className="py-3 px-4 text-right">Mark Attendance &amp; Edit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebeef3] text-sm">
                      {teachers.map((t, idx) => {
                        const rec = teacherAttendance.find(
                          (r) => r.teacherId === t.id && r.date === attDate
                        );
                        const isBusy = attBusyTeacherId === t.id;
                        return (
                          <tr
                            key={t.id}
                            className={`hover:bg-[#f7f9ff] ${
                              calendarTeacherId === t.id ? 'bg-[#fed65b]/10' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => setCalendarTeacherId(t.id)}
                                className="text-left font-semibold text-[#181c20] hover:text-[#735c00] underline decoration-[#c6c6ca] cursor-pointer"
                                title="Open monthly attendance calendar"
                              >
                                <span className="text-xs text-[#735c00] mr-1.5 tabular-nums">
                                  T{idx + 1}
                                </span>
                                {t.name}
                              </button>
                              <p className="text-xs text-[#45474a]">
                                {t.department} · {t.office_room}
                                {t.assigned_course ? ` · ${t.assigned_course}` : ''}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold whitespace-nowrap">
                              <span
                                className={
                                  rec?.status === 'Present'
                                    ? 'text-[#12805c]'
                                    : rec?.status === 'Absent'
                                      ? 'text-[#ba1a1a]'
                                      : rec?.status
                                        ? 'text-[#735c00]'
                                        : 'text-[#76777b]'
                                }
                              >
                                {rec ? rec.status : 'Not Marked'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {TEACHER_STATUSES.map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleMarkTeacher(t, attDate, st)}
                                    className={`px-2 py-1 rounded text-[11px] font-semibold border cursor-pointer transition-colors ${
                                      rec?.status === st
                                        ? st === 'Absent'
                                          ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]'
                                          : st === 'Present'
                                            ? 'bg-[#12805c] text-white border-[#12805c]'
                                            : 'bg-[#fed65b] text-[#745c00] border-[#735c00]'
                                        : 'bg-white text-[#45474a] border-[#c6c6ca]/60 hover:bg-[#f1f4f9]'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => startEditTeacher(t)}
                                  title="Update teacher details"
                                  className="p-1.5 rounded border border-[#c6c6ca]/60 text-[#181c20] hover:bg-[#f1f4f9] cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {t.isCustom && t.docId && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await onDeleteTeacher(t.docId!);
                                      setFeedback({
                                        type: 'success',
                                        text: `Deleted faculty profile ${t.name}.`,
                                      });
                                    }}
                                    title="Delete custom teacher"
                                    className="p-1.5 rounded border border-[#c6c6ca]/60 text-[#ba1a1a] hover:bg-[#ffdad6]/50 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Interactive Teacher Attendance Calendar */}
            {selectedCalendarTeacher && (
              <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ebeef3]">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#735c00]">
                      Interactive Monthly Attendance Calendar
                    </p>
                    <h3 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                      {selectedCalendarTeacher.name} ({selectedCalendarTeacher.department})
                    </h3>
                    <p className="text-xs text-[#45474a] mt-0.5">
                      Click any calendar date to cycle attendance: Present → Absent → Late → On
                      Leave.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        let m = tCalMonth - 1;
                        let y = tCalYear;
                        if (m < 0) {
                          m = 11;
                          y -= 1;
                        }
                        setTCalMonth(m);
                        setTCalYear(y);
                      }}
                      className="p-2 rounded-lg border border-[#c6c6ca] hover:bg-[#f1f4f9] cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-[#181c20] min-w-[130px] text-center">
                      {MONTH_NAMES[tCalMonth]} {tCalYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        let m = tCalMonth + 1;
                        let y = tCalYear;
                        if (m > 11) {
                          m = 0;
                          y += 1;
                        }
                        setTCalMonth(m);
                        setTCalYear(y);
                      }}
                      className="p-2 rounded-lg border border-[#c6c6ca] hover:bg-[#f1f4f9] cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAYS.map((w) => (
                    <div
                      key={w}
                      className="text-center py-2 text-xs font-semibold text-[#45474a] bg-[#f1f4f9] rounded-lg"
                    >
                      {w}
                    </div>
                  ))}
                  {teacherCalendarCells.map((cell, i) => {
                    if (!cell.day) {
                      return <div key={`tc-empty-${i}`} className="min-h-[64px] rounded-lg bg-[#f7f9ff]/50" />;
                    }
                    const rec = teacherAttendance.find(
                      (r) =>
                        r.teacherId === selectedCalendarTeacher.id && r.date === cell.iso
                    );
                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        onClick={() => cycleCalendarDateStatus(selectedCalendarTeacher, cell.iso)}
                        className={`min-h-[64px] p-2 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                          cell.iso === getTodayIso()
                            ? 'border-2 border-[#735c00] bg-[#fed65b]/15'
                            : cell.isSunday
                              ? 'border-[#ebeef3] bg-[#f1f4f9]'
                              : 'border-[#ebeef3] bg-white hover:bg-[#f7f9ff]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
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
                            />
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-[#45474a] truncate">
                          {rec ? rec.status : cell.isSunday ? 'Sunday' : 'Click to mark'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: ACADEMIC CALENDAR (ADD / REMOVE HOLIDAYS & NOTICES)          */}
        {/* =================================================================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <form
                onSubmit={handleAddCalendarItem}
                className="lg:col-span-5 bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-4"
              >
                <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                  Add Holiday, Notice or Event
                </h2>

                <div>
                  <label className="block text-xs font-medium text-[#45474a] mb-1">Title</label>
                  <input
                    required
                    value={calTitle}
                    onChange={(e) => setCalTitle(e.target.value)}
                    placeholder="e.g. Republic Day / Annual Fest"
                    className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">Type</label>
                    <select
                      value={calCategory}
                      onChange={(e) =>
                        setCalCategory(
                          e.target.value as
                            | 'Holiday'
                            | 'Notice'
                            | 'Academic'
                            | 'Exam'
                            | 'Deadline'
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] bg-white text-sm"
                    >
                      <option value="Holiday">Holiday</option>
                      <option value="Notice">Notice</option>
                      <option value="Academic">University Event</option>
                      <option value="Exam">Examination</option>
                      <option value="Deadline">Deadline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Semester
                    </label>
                    <input
                      value={calSemester}
                      onChange={(e) => setCalSemester(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={calStartDate}
                      onChange={(e) => setCalStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={calEndDate}
                      onChange={(e) => setCalEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#45474a] mb-1">
                    Location / Note
                  </label>
                  <input
                    value={calLocation}
                    onChange={(e) => setCalLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#45474a] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={calDescription}
                    onChange={(e) => setCalDescription(e.target.value)}
                    placeholder="Details shown in the Academic Calendar portal..."
                    className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={calSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#000000] text-white text-sm font-semibold hover:bg-[#735c00] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {calSubmitting ? 'Adding...' : 'Add to Academic Calendar'}
                </button>
              </form>

              {/* Monthly View + Existing Items */}
              <div className="lg:col-span-7 space-y-6">
                <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        let m = adminCalMonth - 1;
                        let y = adminCalYear;
                        if (m < 0) {
                          m = 11;
                          y -= 1;
                        }
                        setAdminCalMonth(m);
                        setAdminCalYear(y);
                      }}
                      className="p-2 rounded-lg border border-[#c6c6ca] hover:bg-[#f1f4f9] cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                      {MONTH_NAMES[adminCalMonth]} {adminCalYear}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        let m = adminCalMonth + 1;
                        let y = adminCalYear;
                        if (m > 11) {
                          m = 0;
                          y += 1;
                        }
                        setAdminCalMonth(m);
                        setAdminCalYear(y);
                      }}
                      className="p-2 rounded-lg border border-[#c6c6ca] hover:bg-[#f1f4f9] cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map((w) => (
                      <div
                        key={w}
                        className="text-center py-1.5 text-xs font-semibold text-[#45474a] bg-[#f1f4f9] rounded"
                      >
                        {w}
                      </div>
                    ))}
                    {adminCalendarCells.map((cell, i) => {
                      if (!cell.day) {
                        return (
                          <div
                            key={`ac-empty-${i}`}
                            className="min-h-[64px] rounded bg-[#f7f9ff]/50"
                          />
                        );
                      }
                      const isHol =
                        cell.isSunday ||
                        cell.dayEvents.some((e) => e.category === 'Holiday');
                      return (
                        <div
                          key={cell.iso}
                          className={`min-h-[64px] p-1.5 rounded border text-xs ${
                            isHol
                              ? 'border-[#f3bcbc] bg-[#ffdad6]/40'
                              : cell.dayEvents.length > 0
                                ? 'border-[#fed65b] bg-[#fed65b]/20'
                                : 'border-[#ebeef3] bg-white'
                          }`}
                        >
                          <div className="font-semibold text-[#181c20] tabular-nums">
                            {cell.day}
                          </div>
                          {cell.dayEvents.slice(0, 1).map((ev) => (
                            <div
                              key={ev.id}
                              className="text-[10px] font-medium truncate text-[#735c00] mt-0.5"
                            >
                              {ev.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-4">
                  <h3 className="text-xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                    Scheduled Holidays, Notices &amp; Events ({calendarEvents.length})
                  </h3>
                  <div className="divide-y divide-[#ebeef3]">
                    {calendarEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#735c00]">
                            {ev.category} · {ev.event_date}
                            {ev.end_date ? ` → ${ev.end_date}` : ''}
                          </p>
                          <p className="font-semibold text-[#181c20] text-sm">{ev.title}</p>
                          <p className="text-xs text-[#45474a] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#735c00]" />
                            <span>{ev.location}</span>
                          </p>
                        </div>
                        {ev.is_custom === 1 && ev.docId ? (
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteCalendarEvent(ev);
                              setFeedback({
                                type: 'success',
                                text: `Removed "${ev.title}" from Academic Calendar.`,
                              });
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#c6c6ca] text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#76777b]">University Standard</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: SETUP (COURSES, STUDENTS, TEACHERS FOR TIMETABLE & RESULTS)  */}
        {/* =================================================================== */}
        {activeTab === 'setup' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 1. Course Setup */}
              <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#735c00]" />
                  <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                    1. Add Course Name
                  </h2>
                </div>
                <form onSubmit={handleSetupAddCourse} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Course Code
                      </label>
                      <input
                        required
                        value={sCourseCode}
                        onChange={(e) => setSCourseCode(e.target.value)}
                        placeholder="CS-450"
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Department
                      </label>
                      <input
                        required
                        value={sCourseDept}
                        onChange={(e) => setSCourseDept(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#45474a] mb-1">
                      Course Name
                    </label>
                    <input
                      required
                      value={sCourseTitle}
                      onChange={(e) => setSCourseTitle(e.target.value)}
                      placeholder="e.g. Cloud Native Architecture"
                      className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Instructor
                      </label>
                      <input
                        value={sCourseInstructor}
                        onChange={(e) => setSCourseInstructor(e.target.value)}
                        placeholder="Prof. Name"
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Credits
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={sCourseCredits}
                        onChange={(e) => setSCourseCredits(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Schedule
                      </label>
                      <input
                        value={sCourseSchedule}
                        onChange={(e) => setSCourseSchedule(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={sCourseBusy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#000000] text-white text-xs font-semibold hover:bg-[#735c00] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{sCourseBusy ? 'Saving...' : 'Save Course'}</span>
                  </button>
                </form>

                {courses.some((c) => c.isCustom) && (
                  <div className="pt-3 border-t border-[#ebeef3] space-y-2 max-h-48 overflow-y-auto">
                    {courses
                      .filter((c) => c.isCustom && c.docId)
                      .map((c) => (
                        <div
                          key={c.docId}
                          className="flex items-center justify-between text-xs py-1.5"
                        >
                          <span>
                            <strong>{c.code}</strong> · {c.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteCourse(c.docId!)}
                            className="text-[#ba1a1a] hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </section>

              {/* 2. Student Setup (Name, ID Number, Course Name) */}
              <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#735c00]" />
                  <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                    2. Add Student Details
                  </h2>
                </div>
                <form onSubmit={handleSetupAddStudent} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Student Name
                      </label>
                      <input
                        required
                        value={sStuName}
                        onChange={(e) => setSStuName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        ID Number
                      </label>
                      <input
                        required
                        value={sStuCode}
                        onChange={(e) => setSStuCode(e.target.value)}
                        placeholder="EU-2026-101"
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Course Name
                      </label>
                      <input
                        required
                        value={sStuCourse}
                        onChange={(e) => setSStuCourse(e.target.value)}
                        placeholder="Computer Science"
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Semester / Cohort
                      </label>
                      <input
                        value={sStuYear}
                        onChange={(e) => setSStuYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={sStuBusy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#000000] text-white text-xs font-semibold hover:bg-[#735c00] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{sStuBusy ? 'Saving...' : 'Save Student'}</span>
                  </button>
                </form>

                {students.length > 0 && (
                  <div className="pt-3 border-t border-[#ebeef3] space-y-2 max-h-48 overflow-y-auto">
                    {students.map((st) => (
                      <div
                        key={st.docId || st.id}
                        className="flex items-center justify-between text-xs py-1.5"
                      >
                        <span>
                          <strong>{st.name}</strong> ({st.student_code}) · {st.major}
                        </span>
                        {st.isCustom && st.docId && (
                          <button
                            type="button"
                            onClick={() => onDeleteStudent(st.docId!)}
                            className="text-[#ba1a1a] hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 3. Teachers for Timetable */}
              <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#735c00]" />
                    <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                      3. Add Teacher for Timetable
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-[#735c00] tabular-nums">
                    {teachers.length} saved
                  </span>
                </div>
                <form onSubmit={handleSetupQuickTeacher} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Teacher Name
                      </label>
                      <input
                        required
                        value={qTeacherName}
                        onChange={(e) => setQTeacherName(e.target.value)}
                        placeholder="Prof. K. Nair"
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Assigned Subject / Course
                      </label>
                      <input
                        value={qTeacherSubject}
                        onChange={(e) => setQTeacherSubject(e.target.value)}
                        placeholder="Operating Systems"
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Department
                      </label>
                      <input
                        value={qTeacherDept}
                        onChange={(e) => setQTeacherDept(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Room
                      </label>
                      <input
                        value={qTeacherRoom}
                        onChange={(e) => setQTeacherRoom(e.target.value)}
                        placeholder="Room 204"
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                  </div>

                  {qTeacherInlineMsg && (
                    <div
                      className={`p-3 rounded-lg text-xs font-medium ${
                        qTeacherInlineMsg.type === 'success'
                          ? 'bg-[#e8f6f0] text-[#12805c] border border-[#b5e2d0]'
                          : 'bg-[#ffdad6] text-[#93000a]'
                      }`}
                    >
                      {qTeacherInlineMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={qTeacherBusy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#000000] text-white text-xs font-semibold hover:bg-[#735c00] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{qTeacherBusy ? 'Saving...' : 'Add Teacher'}</span>
                  </button>
                </form>

                {teachers.length > 0 && (
                  <div className="pt-3 border-t border-[#ebeef3] space-y-2 max-h-48 overflow-y-auto">
                    {teachers.map((t, idx) => (
                      <div
                        key={t.docId || t.id}
                        className="flex items-center justify-between text-xs py-1.5"
                      >
                        <span>
                          <strong className="text-[#735c00] tabular-nums">T{idx + 1}</strong> ·{' '}
                          <strong>{t.name}</strong> ({t.department}
                          {t.assigned_course ? ` · ${t.assigned_course}` : ''})
                        </span>
                        {t.isCustom && t.docId && (
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteTeacher(t.docId!);
                              setQTeacherInlineMsg({
                                type: 'success',
                                text: `Deleted teacher "${t.name}".`,
                              });
                            }}
                            className="text-[#ba1a1a] hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 4. Student Results Setup */}
              <section className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#735c00]" />
                  <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                    4. Save Student Results
                  </h2>
                </div>
                <form onSubmit={handleSetupSaveResult} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Student Name
                      </label>
                      <input
                        required
                        value={resStudentName}
                        onChange={(e) => setResStudentName(e.target.value)}
                        placeholder="Aarav Mehta"
                        list="setup-students-datalist"
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                      <datalist id="setup-students-datalist">
                        {students.map((st) => (
                          <option key={st.id} value={st.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        ID Number
                      </label>
                      <input
                        required
                        value={resStudentCode}
                        onChange={(e) => setResStudentCode(e.target.value)}
                        placeholder="EU-2024-0418"
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Course Name
                      </label>
                      <input
                        required
                        value={resCourseName}
                        onChange={(e) => setResCourseName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Subject Name
                      </label>
                      <input
                        required
                        value={resSubjectName}
                        onChange={(e) => setResSubjectName(e.target.value)}
                        placeholder="Data Structures"
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Marks
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        value={resMarks}
                        onChange={(e) => setResMarks(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Max Marks
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={resMaxMarks}
                        onChange={(e) => setResMaxMarks(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474a] mb-1">
                        Semester
                      </label>
                      <input
                        required
                        value={resSemester}
                        onChange={(e) => setResSemester(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={resBusy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#000000] text-white text-xs font-semibold hover:bg-[#735c00] cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{resBusy ? 'Saving...' : 'Save Student Result'}</span>
                  </button>
                </form>

                {studentResults.length > 0 && (
                  <div className="pt-3 border-t border-[#ebeef3] space-y-2 max-h-48 overflow-y-auto">
                    {studentResults.map((r) => (
                      <div
                        key={r.docId}
                        className="flex items-center justify-between text-xs py-1.5"
                      >
                        <span>
                          <strong>{r.studentName}</strong> · {r.subjectName}: {r.marks}/{r.maxMarks}{' '}
                          ({r.grade})
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteStudentResult(r.docId)}
                          className="text-[#ba1a1a] hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 6: LOGIN INFORMATION                                            */}
        {/* =================================================================== */}
        {activeTab === 'logins' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                <div className="bg-white rounded-xl p-4 border border-[#c6c6ca]/40">
                  <p className="text-xs text-[#45474a]">Total Logins</p>
                  <p className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] mt-1 tabular-nums">
                    {loginLogs.length}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#c6c6ca]/40">
                  <p className="text-xs text-[#45474a]">Registered Accounts</p>
                  <p className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#735c00] mt-1 tabular-nums">
                    {accounts.length}
                  </p>
                </div>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#76777b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={loginSearch}
                  onChange={(e) => setLoginSearch(e.target.value)}
                  placeholder="Search email or UID..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-[#c6c6ca]/60 text-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#c6c6ca]/40 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#ebeef3] bg-[#f1f4f9] text-xs font-semibold text-[#45474a]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User &amp; Email</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Device / Browser</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef3] text-sm">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-[#45474a]">
                        No login events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#f7f9ff]">
                        <td className="py-3 px-4 text-xs tabular-nums whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#181c20]">
                            {log.displayName} ·{' '}
                            <span className="text-xs text-[#735c00]">
                              {log.role === 'admin' ? 'Admin' : 'Scholar'}
                            </span>
                          </p>
                          <p className="text-xs text-[#45474a]">{log.email}</p>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium">{log.eventType}</td>
                        <td className="py-3 px-4 text-xs text-[#45474a]">
                          {log.provider === 'google.com' ? 'Google OAuth' : 'Email / Password'}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#45474a]">
                          {summarizeUserAgent(log.userAgent)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
