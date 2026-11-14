import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { AdminAuthGate } from './components/AdminAuthGate';
import { AdminView } from './components/AdminView';
import { AuthGate } from './components/AuthGate';
import { CalendarView } from './components/CalendarView';
import { HomeView } from './components/HomeView';
import { Navbar } from './components/Navbar';
import { ScholarPortalModal } from './components/ScholarPortalModal';
import { StudentsView } from './components/StudentsView';
import { TeachersView } from './components/TeachersView';
import { api } from './lib/api';
import { auth, isAdminEmail, signOut } from './lib/firebase';
import type {
  CalendarEvent,
  CollegeNotice,
  Course,
  Enrollment,
  LoginLog,
  NoticeCategory,
  PagePath,
  PortalOverview,
  RegisteredAccount,
  SavedTimetable,
  Student,
  StudentResult,
  Teacher,
  TeacherAttendanceRecord,
  TeacherAttendanceStatus,
  TimetableSlot,
} from './types';

export default function App() {
  const [activePage, setActivePage] = useState<PagePath>('home');
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [overview, setOverview] = useState<PortalOverview | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [notices, setNotices] = useState<CollegeNotice[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendanceRecord[]>([]);
  const [savedTimetables, setSavedTimetables] = useState<SavedTimetable[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Admin Portal State
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>([]);
  const [adminNotices, setAdminNotices] = useState<CollegeNotice[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyCourseId, setBusyCourseId] = useState<number | null>(null);
  const [portalOpen, setPortalOpen] = useState(false);

  const isAdmin = isAdminEmail(firebaseUser?.email);

  const activeScholar = {
    name: firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Scholar',
    email: firebaseUser?.email || '',
    emailVerified: Boolean(firebaseUser?.emailVerified),
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (user) {
        setAuthModalOpen(false);
        try {
          await api.syncSignedInUserProfile();
          await api.syncAdminRoleDoc();
          const sessionKey = `eu_session_logged_${user.uid}`;
          if (typeof window !== 'undefined' && !window.sessionStorage.getItem(sessionKey)) {
            window.sessionStorage.setItem(sessionKey, '1');
            await api.recordLoginActivity('Session Restored');
          }
        } catch (err) {
          console.error('Failed to sync profile:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const loadAllData = useCallback(async () => {
    setError('');
    try {
      const [
        overviewData,
        coursesData,
        enrollmentsData,
        noticesData,
        teachersData,
        teacherAttData,
        timetablesData,
        studentsData,
        resultsData,
        calendarData,
      ] = await Promise.all([
        api.getOverview(),
        api.getCourses(),
        api.getEnrollments(),
        api.getCollegeNotices(false),
        api.getTeachers(),
        api.getTeacherAttendance(),
        api.getSavedTimetables(),
        api.getStudents(),
        api.getStudentResults(),
        api.getCalendarEvents(),
      ]);

      setOverview(overviewData);
      setCourses(coursesData);
      setEnrollments(enrollmentsData);
      setNotices(noticesData);
      setTeachers(teachersData);
      setTeacherAttendance(teacherAttData);
      setSavedTimetables(timetablesData);
      setStudents(studentsData);
      setStudentResults(resultsData);
      setCalendarEvents(calendarData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load portal data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!auth.currentUser || !isAdminEmail(auth.currentUser.email)) {
      setLoginLogs([]);
      setRegisteredAccounts([]);
      setAdminNotices([]);
      return;
    }

    setLoadingAdminData(true);
    try {
      const [logs, allNotices] = await Promise.all([
        api.getLoginLogs(),
        api.getCollegeNotices(true),
      ]);
      const accounts = await api.getRegisteredAccounts(logs);
      setLoginLogs(logs);
      setRegisteredAccounts(accounts);
      setAdminNotices(allNotices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Admin Portal records.');
    } finally {
      setLoadingAdminData(false);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    void loadAllData();
  }, [authReady, firebaseUser?.uid, loadAllData]);

  useEffect(() => {
    if (!authReady) return;
    void loadAdminData();
  }, [authReady, firebaseUser?.uid, isAdmin, loadAdminData]);

  const handleActionError = (err: unknown) => {
    if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
      setAuthModalOpen(true);
      return;
    }
    setError(err instanceof Error ? err.message : 'Action failed.');
  };

  const handleToggleEnroll = async (course: Course) => {
    if (!firebaseUser) {
      setAuthModalOpen(true);
      return;
    }
    setBusyCourseId(course.id);
    try {
      if (course.enrolled) {
        await api.dropCourse(course.id);
      } else {
        await api.enrollCourse(course);
      }
      await loadAllData();
    } catch (err) {
      handleActionError(err);
    } finally {
      setBusyCourseId(null);
    }
  };

  const handleDropCourse = async (courseId: number) => {
    try {
      await api.dropCourse(courseId);
      await loadAllData();
    } catch (err) {
      handleActionError(err);
    }
  };

  const handleCreateCourse = async (payload: {
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
  }) => {
    if (!firebaseUser) {
      setAuthModalOpen(true);
      throw new Error('Please sign in first to publish a course.');
    }
    await api.createCourse(payload);
    await loadAllData();
  };

  const handleDeleteCourse = async (docId: string) => {
    await api.deleteCourse(docId);
    await loadAllData();
  };

  // Admin handlers
  const handleSaveTimetable = async (payload: {
    title: string;
    teachersCount: number;
    sectionsCount: number;
    roomsCount: number;
    daysCount: number;
    groups: number[];
    slots: TimetableSlot[];
  }) => {
    const saved = await api.saveTimetable(payload);
    await loadAllData();
    return saved;
  };

  const handleUpdateTimetableSlots = async (docId: string, slots: TimetableSlot[]) => {
    await api.updateTimetableSlots(docId, slots);
    await loadAllData();
  };

  const handleDeleteTimetable = async (docId: string) => {
    await api.deleteTimetable(docId);
    await loadAllData();
  };

  const handleCreateNotice = async (payload: {
    title: string;
    category: NoticeCategory;
    audience: string;
    body: string;
    isPinned: boolean;
    expiresAt?: string;
  }) => {
    await api.createCollegeNotice(payload);
    await Promise.all([loadAdminData(), loadAllData()]);
  };

  const handleUpdateNotice = async (
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
  ) => {
    await api.updateCollegeNotice(docId, patch);
    await Promise.all([loadAdminData(), loadAllData()]);
  };

  const handleDeleteNotice = async (docId: string) => {
    await api.deleteCollegeNotice(docId);
    await Promise.all([loadAdminData(), loadAllData()]);
  };

  const handleAddTeacher = async (payload: {
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
  }) => {
    await api.addTeacher(payload);
    await loadAllData();
  };

  const handleUpdateTeacher = async (
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
  ) => {
    await api.updateTeacher(teacher, patch);
    await loadAllData();
  };

  const handleDeleteTeacher = async (docId: string) => {
    await api.deleteTeacher(docId);
    await loadAllData();
  };

  const handleMarkTeacherAttendance = async (payload: {
    teacherId: number;
    teacherName: string;
    department: string;
    date: string;
    status: TeacherAttendanceStatus;
    notes?: string;
  }) => {
    await api.markTeacherAttendance(payload);
    await loadAllData();
  };

  const handleCreateCalendarEvent = async (payload: {
    title: string;
    category: 'Academic' | 'Exam' | 'Holiday' | 'Deadline' | 'Notice';
    event_date: string;
    end_date?: string;
    location: string;
    semester: string;
    description: string;
  }) => {
    await api.createCalendarEvent(payload);
    await loadAllData();
  };

  const handleDeleteCalendarEvent = async (event: CalendarEvent) => {
    await api.deleteCalendarEvent(event);
    await loadAllData();
  };

  const handleAddSetupStudent = async (payload: {
    name: string;
    student_code: string;
    major: string;
    year_level?: string;
  }) => {
    await api.addSetupStudent(payload);
    await loadAllData();
  };

  const handleDeleteStudent = async (docId: string) => {
    await api.deleteStudent(docId);
    await loadAllData();
  };

  const handleSaveStudentResult = async (payload: {
    studentCode: string;
    studentName: string;
    courseName: string;
    subjectName: string;
    marks: number;
    maxMarks: number;
    grade: string;
    semester: string;
  }) => {
    await api.saveStudentResult(payload);
    await loadAllData();
  };

  const handleDeleteStudentResult = async (docId: string) => {
    await api.deleteStudentResult(docId);
    await loadAllData();
  };

  const handleSignOut = async () => {
    if (firebaseUser && typeof window !== 'undefined') {
      window.sessionStorage.removeItem(`eu_session_logged_${firebaseUser.uid}`);
    }
    await signOut(auth);
    if (activePage === 'admin' || activePage === 'teachers') {
      setActivePage('home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9ff] text-[#181c20]">
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        isSignedIn={Boolean(firebaseUser)}
        isAdmin={isAdmin}
        scholarName={activeScholar.name}
        enrollmentCount={enrollments.length}
        onOpenPortal={() => setPortalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="w-full pt-20 flex-grow">
        {error && (
          <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-6">
            <div className="p-4 rounded-xl bg-[#ffdad6] text-[#93000a] text-sm flex items-center justify-between gap-4">
              <span className="break-words">{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                className="font-semibold underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {loading || !authReady ? (
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 text-center">
            <p className="text-xl font-['Newsreader',Georgia,serif] text-[#45474a]">
              Loading Excellence University Portal...
            </p>
          </div>
        ) : activePage === 'admin' && !isAdmin ? (
          <AdminAuthGate
            currentUserEmail={firebaseUser?.email}
            onAuthenticated={() => {
              void loadAdminData();
            }}
          />
        ) : activePage === 'teachers' && !firebaseUser ? (
          <AuthGate
            title="Sign In to Teacher Portal"
            subtitle="Sign in with your university account to view your attendance calendar and administrative notices."
          />
        ) : (
          <>
            {activePage === 'home' && (
              <HomeView
                courses={courses}
                notices={notices}
                overview={overview}
                onNavigate={setActivePage}
                onToggleEnroll={handleToggleEnroll}
                onCreateCourse={handleCreateCourse}
                busyCourseId={busyCourseId}
              />
            )}

            {activePage === 'admin' && isAdmin && (
              <AdminView
                adminEmail={activeScholar.email}
                loginLogs={loginLogs}
                accounts={registeredAccounts}
                notices={adminNotices}
                courses={courses}
                teachers={teachers}
                teacherAttendance={teacherAttendance}
                savedTimetables={savedTimetables}
                students={students}
                studentResults={studentResults}
                calendarEvents={calendarEvents}
                loadingAdminData={loadingAdminData}
                onRefresh={async () => {
                  await Promise.all([loadAdminData(), loadAllData()]);
                }}
                onSaveTimetable={handleSaveTimetable}
                onUpdateTimetableSlots={handleUpdateTimetableSlots}
                onDeleteTimetable={handleDeleteTimetable}
                onCreateNotice={handleCreateNotice}
                onUpdateNotice={handleUpdateNotice}
                onDeleteNotice={handleDeleteNotice}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onMarkTeacherAttendance={handleMarkTeacherAttendance}
                onCreateCalendarEvent={handleCreateCalendarEvent}
                onDeleteCalendarEvent={handleDeleteCalendarEvent}
                onCreateCourse={handleCreateCourse}
                onDeleteCourse={handleDeleteCourse}
                onAddSetupStudent={handleAddSetupStudent}
                onDeleteStudent={handleDeleteStudent}
                onSaveStudentResult={handleSaveStudentResult}
                onDeleteStudentResult={handleDeleteStudentResult}
                onSignOut={handleSignOut}
              />
            )}

            {activePage === 'teachers' && (
              <TeachersView
                teachers={teachers}
                teacherAttendance={teacherAttendance}
                notices={notices}
                activeScholar={activeScholar}
              />
            )}

            {activePage === 'students' && (
              <StudentsView
                notices={notices}
                savedTimetables={savedTimetables}
                studentResults={studentResults}
                teachers={teachers}
                teacherAttendance={teacherAttendance}
              />
            )}

            {activePage === 'academic-calendar' && <CalendarView events={calendarEvents} />}
          </>
        )}
      </main>

      <footer className="w-full bg-[#f1f4f9] py-10 border-t border-[#c6c6ca]/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#45474a]">
          <p>© 2024 Excellence University. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => {
                setActivePage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#181c20] cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePage('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#181c20] cursor-pointer"
            >
              Admin Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePage('teachers');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#181c20] cursor-pointer"
            >
              Teachers
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePage('students');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#181c20] cursor-pointer"
            >
              Students
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePage('academic-calendar');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#181c20] cursor-pointer"
            >
              Academic Calendar
            </button>
          </div>
        </div>
      </footer>

      {authModalOpen && (
        <AuthGate
          isModal
          onClose={() => setAuthModalOpen(false)}
          onAuthenticated={() => setAuthModalOpen(false)}
        />
      )}

      {firebaseUser && (
        <ScholarPortalModal
          open={portalOpen}
          onClose={() => setPortalOpen(false)}
          activeScholar={activeScholar}
          enrollments={enrollments}
          notices={notices}
          onDropCourse={handleDropCourse}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
