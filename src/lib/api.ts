import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, isAdminEmail, OperationType } from './firebase';
import type {
  CalendarEvent,
  CollegeNotice,
  Course,
  Enrollment,
  LoginLog,
  NoticeCategory,
  PortalOverview,
  RegisteredAccount,
  SavedTimetable,
  Student,
  StudentResult,
  Teacher,
  TeacherAttendanceRecord,
  TeacherAttendanceStatus,
  TimetableSlot,
} from '../types';

const BASE_COURSES: Array<Omit<Course, 'enrolled'>> = [
  {
    id: 1,
    code: 'CS-401',
    title: 'Advanced Data Structures & Algorithms',
    department: 'Computer Science',
    duration: '12 Weeks',
    rating: 4.9,
    review_count: 128,
    instructor: 'Prof. A. Sharma',
    description:
      'Master optimal algorithmic design, graph theory, and complex memory management techniques.',
    image_key: 'cs',
    credits: 4,
    seats_total: 60,
    seats_taken: 42,
    schedule: 'Mon / Wed · 10:00 AM – 11:30 AM',
    syllabus:
      'Amortized analysis, Fibonacci heaps, balanced search trees, network flow, NP-completeness, and randomized approximation algorithms.',
    featured: 1,
  },
  {
    id: 2,
    code: 'ARCH-310',
    title: 'Sustainable Urban Design & Planning',
    department: 'Architecture',
    duration: '10 Weeks',
    rating: 4.8,
    review_count: 95,
    instructor: 'Dr. M. Varma',
    description:
      'Explore ecological frameworks, green building standards, and future urban ecosystems.',
    image_key: 'architecture',
    credits: 4,
    seats_total: 40,
    seats_taken: 31,
    schedule: 'Tue / Thu · 1:30 PM – 3:15 PM',
    syllabus:
      'Bioclimatic site analysis, passive solar architecture, transit-oriented urbanism, adaptive reuse, and net-zero material life cycles.',
    featured: 1,
  },
  {
    id: 3,
    code: 'ECON-405',
    title: 'Macroeconomic Policy & Global Markets',
    department: 'Economics',
    duration: '8 Weeks',
    rating: 5.0,
    review_count: 210,
    instructor: 'Prof. R. Iyer',
    description:
      'Analyze central banking policies, fiscal levers, and international trade dynamics.',
    image_key: 'economics',
    credits: 3,
    seats_total: 55,
    seats_taken: 47,
    schedule: 'Mon / Fri · 2:00 PM – 3:30 PM',
    syllabus:
      'Monetary transmission mechanisms, sovereign debt sustainability, exchange rate regimes, and cross-border capital flow modeling.',
    featured: 1,
  },
  {
    id: 4,
    code: 'CS-440',
    title: 'Distributed Systems & Consensus Architecture',
    department: 'Computer Science',
    duration: '12 Weeks',
    rating: 4.9,
    review_count: 84,
    instructor: 'Dr. Elena Vance',
    description:
      'Design fault-tolerant replicated state machines, consensus protocols, and global storage engines.',
    image_key: 'cs',
    credits: 4,
    seats_total: 50,
    seats_taken: 36,
    schedule: 'Tue / Thu · 10:30 AM – 12:00 PM',
    syllabus:
      'Logical clocks, Raft and Paxos consensus, Byzantine fault tolerance, sharded transactions, and distributed tracing.',
    featured: 0,
  },
  {
    id: 5,
    code: 'ECON-330',
    title: 'Quantitative Econometrics & Causal Inference',
    department: 'Economics',
    duration: '10 Weeks',
    rating: 4.7,
    review_count: 67,
    instructor: 'Prof. Vikram Patel',
    description:
      'Apply instrumental variables, panel regressions, and natural experiments to empirical policy data.',
    image_key: 'economics',
    credits: 4,
    seats_total: 45,
    seats_taken: 29,
    schedule: 'Wed / Fri · 9:30 AM – 11:00 AM',
    syllabus:
      'Difference-in-differences, regression discontinuity, synthetic controls, GMM estimation, and structural policy evaluation.',
    featured: 0,
  },
  {
    id: 6,
    code: 'ARCH-412',
    title: 'Computational Tectonics & Timber Structures',
    department: 'Architecture',
    duration: '12 Weeks',
    rating: 4.9,
    review_count: 52,
    instructor: 'Dr. Claire Sterling',
    description:
      'Bridge parametric structural modeling with mass-timber fabrication and civic pavilion engineering.',
    image_key: 'architecture',
    credits: 4,
    seats_total: 32,
    seats_taken: 24,
    schedule: 'Mon / Thu · 3:30 PM – 5:15 PM',
    syllabus:
      'Cross-laminated timber mechanics, parametric shell optimization, CNC joinery, and seismic load-path simulation.',
    featured: 0,
  },
];

const BASE_TEACHERS: Teacher[] = [
  {
    id: 1,
    name: 'Prof. A. Sharma',
    title: 'Chair of Theoretical Computing',
    department: 'Computer Science',
    email: 'a.sharma@excellence.edu',
    office_room: 'Turing Pavilion 402',
    office_hours: 'Mon & Wed · 2:00 PM – 4:00 PM',
    specialization: 'Graph Algorithms & Cache-Oblivious Data Structures',
    assigned_course: 'Data Structures',
    publications_count: 64,
    bio: 'Leads the Algorithmic Foundations Laboratory with two decades of research in combinatorial optimization and parallel graph processing.',
  },
  {
    id: 2,
    name: 'Dr. M. Varma',
    title: 'Associate Professor of Urban Ecology',
    department: 'Architecture',
    email: 'm.varma@excellence.edu',
    office_room: 'Atelier North 205',
    office_hours: 'Tue & Thu · 3:30 PM – 5:00 PM',
    specialization: 'Net-Zero Civic Infrastructure & Bioclimatic Design',
    assigned_course: 'Environmental Science',
    publications_count: 38,
    bio: 'Award-winning urbanist advising municipal climate resilience frameworks across South Asia and Europe.',
  },
  {
    id: 3,
    name: 'Prof. R. Iyer',
    title: 'Distinguished Fellow in Macroeconomics',
    department: 'Economics',
    email: 'r.iyer@excellence.edu',
    office_room: 'Keynes Hall 314',
    office_hours: 'Wed · 1:00 PM – 4:00 PM',
    specialization: 'Monetary Policy, Sovereign Debt & Emerging Markets',
    assigned_course: 'Probability and Statistics',
    publications_count: 51,
    bio: 'Former central bank senior advisor specializing in open-economy macroeconomics and systemic liquidity modeling.',
  },
  {
    id: 4,
    name: 'Dr. Elena Vance',
    title: 'Professor of Distributed Computing',
    department: 'Computer Science',
    email: 'e.vance@excellence.edu',
    office_room: 'Turing Pavilion 318',
    office_hours: 'Tue · 1:30 PM – 3:30 PM',
    specialization: 'Consensus Protocols & High-Availability Storage',
    assigned_course: 'Operating Systems',
    publications_count: 43,
    bio: 'Researches deterministic simulation testing and geo-replicated transactional databases for mission-critical infrastructure.',
  },
  {
    id: 5,
    name: 'Prof. Vikram Patel',
    title: 'Senior Lecturer in Econometrics',
    department: 'Economics',
    email: 'v.patel@excellence.edu',
    office_room: 'Keynes Hall 208',
    office_hours: 'Fri · 11:30 AM – 1:30 PM',
    specialization: 'Causal Inference & Labor Market Dynamics',
    assigned_course: 'Database Systems',
    publications_count: 29,
    bio: 'Combines large-scale administrative microdata with quasi-experimental designs to evaluate education and labor policy.',
  },
  {
    id: 6,
    name: 'Dr. Claire Sterling',
    title: 'Director of Structural Tectonics',
    department: 'Architecture',
    email: 'c.sterling@excellence.edu',
    office_room: 'Atelier North 110',
    office_hours: 'Thu · 10:00 AM – 12:30 PM',
    specialization: 'Mass Timber Engineering & Robotic Fabrication',
    assigned_course: 'Engineering Graphics',
    publications_count: 31,
    bio: 'Architect and structural engineer pioneering low-carbon long-span timber pavilions and computational joinery.',
  },
];

const BASE_STUDENTS: Student[] = [
  {
    id: 1,
    student_code: 'EU-2024-0418',
    name: 'Aarav Mehta',
    email: 'CS',
    major: 'Computer Science',
    year_level: 'Senior · Class of 2024',
    gpa: 3.94,
    honors: 'Enrolled Scholar',
    club_name: 'Computer Science',
    created_at: '2026-08-15T08:00:00.000Z',
  },
  {
    id: 2,
    student_code: 'EU-2025-0192',
    name: 'Sophia Lin',
    email: 'ARCH',
    major: 'Architecture',
    year_level: 'Junior · Class of 2025',
    gpa: 3.88,
    honors: 'Enrolled Scholar',
    club_name: 'Architecture',
    created_at: '2026-08-16T08:00:00.000Z',
  },
  {
    id: 3,
    student_code: 'EU-2024-0874',
    name: 'Daniel Okafor',
    email: 'ECON',
    major: 'Economics',
    year_level: 'Senior · Class of 2024',
    gpa: 3.91,
    honors: 'Enrolled Scholar',
    club_name: 'Economics',
    created_at: '2026-08-17T08:00:00.000Z',
  },
];

const BASE_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 1,
    title: "Chancellor's Convocation & Opening Ceremony",
    category: 'Academic',
    event_date: '2026-09-07',
    end_date: null,
    location: 'Grand Auditorium, Founders Hall',
    semester: 'Fall 2026',
    description:
      'Formal matriculation ceremony welcoming incoming scholars and honoring distinguished faculty chairs.',
    is_custom: 0,
  },
  {
    id: 2,
    title: 'Midterm Examination Period',
    category: 'Exam',
    event_date: '2026-10-19',
    end_date: '2026-10-24',
    location: 'Examination Halls A–D',
    semester: 'Fall 2026',
    description:
      'Scheduled proctored mid-semester assessments across all academic departments.',
    is_custom: 0,
  },
  {
    id: 3,
    title: 'Annual Undergraduate Research Symposium',
    category: 'Academic',
    event_date: '2026-11-12',
    end_date: '2026-11-13',
    location: 'Innovation Commons Atrium',
    semester: 'Fall 2026',
    description:
      'Poster presentations, architectural model exhibitions, and keynote faculty panels.',
    is_custom: 0,
  },
  {
    id: 4,
    title: 'Thanksgiving Academic Recess',
    category: 'Holiday',
    event_date: '2026-11-25',
    end_date: '2026-11-29',
    location: 'University-Wide',
    semester: 'Fall 2026',
    description: 'Official holiday recess; regular classes suspended across campus.',
    is_custom: 0,
  },
  {
    id: 5,
    title: 'Final Examination Period',
    category: 'Exam',
    event_date: '2026-12-14',
    end_date: '2026-12-21',
    location: 'Main Campus Examination Halls',
    semester: 'Fall 2026',
    description: 'End-of-term written and studio jury examinations for all Fall 2026 courses.',
    is_custom: 0,
  },
  {
    id: 6,
    title: 'Winter Recess & Campus Closure',
    category: 'Holiday',
    event_date: '2026-12-22',
    end_date: '2027-01-10',
    location: 'University-Wide',
    semester: 'Winter 2026',
    description: 'Official winter break following Fall term grade finalization.',
    is_custom: 0,
  },
];

const BASE_NOTICES: CollegeNotice[] = [
  {
    docId: 'default-notice-1',
    title: 'Fall 2026 Semester Attendance & Mid-Term Eligibility Policy',
    category: 'Academic',
    audience: 'All Students & Faculty',
    body: 'Scholars must maintain at least 75% recorded attendance across enrolled lectures and laboratory seminars to sit for end-of-term examinations.',
    publishedBy: 'University Administration',
    isPinned: true,
    isActive: true,
    expiresAt: '2026-12-20',
    createdAt: '2026-11-01T09:00:00.000Z',
    updatedAt: '2026-11-01T09:00:00.000Z',
    isDefault: true,
  },
  {
    docId: 'default-notice-2',
    title: 'Library Extended Study Hours During Examination Preparation',
    category: 'General',
    audience: 'Students Only',
    body: 'Central Research Library Reading Rooms A–C will remain open until 11:30 PM on weekdays through the conclusion of final assessments.',
    publishedBy: 'University Administration',
    isPinned: false,
    isActive: true,
    expiresAt: '2026-12-22',
    createdAt: '2026-11-05T10:30:00.000Z',
    updatedAt: '2026-11-05T10:30:00.000Z',
    isDefault: true,
  },
];

function sanitizeDocKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48) || 'item';
}

function requireSignedInUser() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('AUTH_REQUIRED');
  }
  return user;
}

function requireAdminUser() {
  const user = requireSignedInUser();
  if (!isAdminEmail(user.email)) {
    throw new Error('ADMIN_REQUIRED');
  }
  return user;
}

function stableNumericId(docId: string): number {
  let hash = 1000;
  for (let i = 0; i < docId.length; i += 1) {
    hash = (hash * 31 + docId.charCodeAt(i)) % 1000000;
  }
  return hash + 100;
}

export function isNoticeForAudience(
  noticeAudience: string,
  targetRole: 'teacher' | 'student'
): boolean {
  const norm = noticeAudience.trim().toLowerCase();
  if (
    norm === 'all' ||
    norm.includes('all') ||
    norm.includes('both') ||
    norm.includes('everyone')
  ) {
    return true;
  }
  if (targetRole === 'teacher') {
    return norm.includes('teacher') || norm.includes('faculty');
  }
  return norm.includes('student') || norm.includes('scholar');
}

export const api = {
  async syncSignedInUserProfile(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    const publicPath = `users/${user.uid}`;
    const privatePath = `users/${user.uid}/private/info`;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          displayName: (user.displayName || user.email?.split('@')[0] || 'Scholar').slice(0, 120),
          major: 'General Studies',
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: (user.displayName || user.email?.split('@')[0] || 'Scholar').slice(0, 120),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, publicPath);
      }
    }

    if (user.email) {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'private', 'info'),
          {
            uid: user.uid,
            email: user.email.slice(0, 160),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        try {
          await updateDoc(doc(db, 'users', user.uid, 'private', 'info'), {
            email: user.email.slice(0, 160),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, privatePath);
        }
      }
    }
  },

  async getOverview(): Promise<PortalOverview> {
    const user = auth.currentUser;
    let customCoursesCount = 0;
    let customStudentsCount = 0;
    let customEventsCount = 0;
    let customTeachersCount = 0;
    let enrollmentsCount = 0;

    try {
      const [coursesSnap, studentsSnap, eventsSnap, teachersSnap] = await Promise.all([
        getDocs(collection(db, 'custom_courses')),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'calendar_events')),
        getDocs(collection(db, 'custom_teachers')),
      ]);
      customCoursesCount = coursesSnap.size;
      customStudentsCount = studentsSnap.size;
      customEventsCount = eventsSnap.size;
      customTeachersCount = teachersSnap.size;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'overview_public');
    }

    if (user) {
      try {
        const enrollSnap = await getDocs(
          query(collection(db, 'enrollments'), where('uid', '==', user.uid))
        );
        enrollmentsCount = enrollSnap.size;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'enrollments');
      }
    }

    return {
      activeStudentsCount: 15000 + BASE_STUDENTS.length + customStudentsCount,
      facultyCount: 250 + BASE_TEACHERS.length + customTeachersCount,
      coursesCount: BASE_COURSES.length + customCoursesCount,
      enrollmentsCount,
      appointmentsCount: 0,
      upcomingEventsCount: BASE_CALENDAR_EVENTS.length + customEventsCount,
      placementRate: '98%',
      globalPartners: '40+',
    };
  },

  async getCourses(): Promise<Course[]> {
    const user = auth.currentUser;
    const enrolledIds = new Set<number>();

    if (user) {
      try {
        const snap = await getDocs(query(collection(db, 'enrollments'), where('uid', '==', user.uid)));
        snap.docs.forEach((d) => {
          enrolledIds.add(Number(d.data().courseId));
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'enrollments');
      }
    }

    let customCourses: Array<Omit<Course, 'enrolled'>> = [];
    try {
      const snap = await getDocs(collection(db, 'custom_courses'));
      customCourses = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: Number(data.numericId) || stableNumericId(d.id),
          docId: d.id,
          isCustom: true,
          code: String(data.code),
          title: String(data.title),
          department: String(data.department),
          duration: String(data.duration),
          rating: Number(data.rating) || 4.9,
          review_count: Number(data.review_count) || 1,
          instructor: String(data.instructor),
          description: String(data.description),
          image_key: String(data.image_key || 'cs'),
          credits: Number(data.credits) || 4,
          seats_total: Number(data.seats_total) || 40,
          seats_taken: Number(data.seats_taken) || 0,
          schedule: String(data.schedule),
          syllabus: String(data.syllabus),
          featured: Number(data.featured) || 0,
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'custom_courses');
    }

    return [...BASE_COURSES, ...customCourses].map((c) => ({
      ...c,
      enrolled: enrolledIds.has(c.id),
      seats_taken: c.seats_taken + (enrolledIds.has(c.id) ? 1 : 0),
    }));
  },

  async createCourse(payload: {
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
  }): Promise<Course> {
    const user = requireSignedInUser();
    const code = payload.code.trim().toUpperCase().slice(0, 24);
    const numericId = Math.floor(100 + Math.random() * 900000);
    const image_key =
      payload.department === 'Architecture'
        ? 'architecture'
        : payload.department === 'Economics'
          ? 'economics'
          : 'cs';

    const docData = {
      uid: user.uid,
      numericId,
      code: code.length >= 2 ? code : 'GEN-101',
      title: payload.title.trim().slice(0, 160),
      department: (payload.department.trim() || 'Computer Science').slice(0, 80),
      duration: (payload.duration.trim() || '12 Weeks').slice(0, 40),
      rating: 4.9,
      review_count: 1,
      instructor: (payload.instructor.trim() || 'Faculty Instructor').slice(0, 100),
      description: (payload.description.trim() || 'Core university curriculum course.').slice(0, 600),
      image_key,
      credits: Math.min(12, Math.max(1, Number(payload.credits) || 4)),
      seats_total: Math.min(500, Math.max(1, Number(payload.seats_total) || 40)),
      seats_taken: 0,
      schedule: (payload.schedule.trim() || 'Tue / Thu · 11:00 AM – 12:30 PM').slice(0, 120),
      syllabus: (
        payload.syllabus.trim() || 'Core lectures, seminar discussions, and capstone project.'
      ).slice(0, 1000),
      featured: 0,
      createdAt: serverTimestamp(),
    };

    let createdDocId = '';
    try {
      const ref = await addDoc(collection(db, 'custom_courses'), docData);
      createdDocId = ref.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'custom_courses');
    }

    return {
      id: numericId,
      docId: createdDocId,
      isCustom: true,
      code: docData.code,
      title: docData.title,
      department: docData.department,
      duration: docData.duration,
      rating: docData.rating,
      review_count: docData.review_count,
      instructor: docData.instructor,
      description: docData.description,
      image_key: docData.image_key,
      credits: docData.credits,
      seats_total: docData.seats_total,
      seats_taken: 0,
      schedule: docData.schedule,
      syllabus: docData.syllabus,
      featured: 0,
      enrolled: false,
    };
  },

  async deleteCourse(docId: string): Promise<void> {
    requireSignedInUser();
    try {
      await deleteDoc(doc(db, 'custom_courses', docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `custom_courses/${docId}`);
    }
  },

  async getEnrollments(): Promise<Enrollment[]> {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      const snap = await getDocs(query(collection(db, 'enrollments'), where('uid', '==', user.uid)));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: Number(data.courseId),
          student_email: user.email || '',
          student_name: user.displayName || 'Scholar',
          course_id: Number(data.courseId),
          enrolled_at:
            typeof data.createdAt?.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          code: String(data.code),
          title: String(data.title),
          department: String(data.department),
          instructor: String(data.instructor),
          duration: String(data.duration),
          credits: Number(data.credits) || 4,
          schedule: String(data.schedule),
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'enrollments');
    }
  },

  async enrollCourse(course: Course): Promise<void> {
    const user = requireSignedInUser();
    const docId = `${user.uid}_${course.id}`;
    try {
      await setDoc(doc(db, 'enrollments', docId), {
        uid: user.uid,
        courseId: course.id,
        code: course.code.slice(0, 24),
        title: course.title.slice(0, 160),
        department: course.department.slice(0, 80),
        instructor: course.instructor.slice(0, 100),
        duration: course.duration.slice(0, 40),
        credits: Math.min(12, Math.max(1, course.credits)),
        schedule: course.schedule.slice(0, 120),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `enrollments/${docId}`);
    }
  },

  async dropCourse(courseId: number): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('AUTH_REQUIRED');
    const docId = `${user.uid}_${courseId}`;
    try {
      await deleteDoc(doc(db, 'enrollments', docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `enrollments/${docId}`);
    }
  },

  // ========================== Teachers ==========================
  async getTeachers(): Promise<Teacher[]> {
    let customList: Array<Teacher & { createdMs: number }> = [];
    try {
      const snap = await getDocs(collection(db, 'custom_teachers'));
      customList = snap.docs.map((d) => {
        const data = d.data();
        const createdMs =
          typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate().getTime() : 0;
        return {
          id: Number(data.numericId) || stableNumericId(d.id),
          docId: d.id,
          isCustom: true,
          name: String(data.name || ''),
          title: String(data.title || 'Faculty Lecturer'),
          department: String(data.department || 'Academic Faculty'),
          email: String(data.email || ''),
          office_room: String(data.office_room || 'Academic Block'),
          office_hours: String(data.office_hours || 'Mon–Fri · 2:00 PM – 4:00 PM'),
          specialization: String(data.specialization || 'Core Curriculum'),
          assigned_course: data.assigned_course ? String(data.assigned_course) : undefined,
          publications_count: Number(data.publications_count) || 0,
          bio: String(data.bio || 'Dedicated faculty member at Excellence University.'),
          createdMs,
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'custom_teachers');
    }

    const byNumericId = new Map<number, Teacher & { createdMs?: number }>();
    BASE_TEACHERS.forEach((t) => byNumericId.set(t.id, t));
    customList
      .sort((a, b) => a.createdMs - b.createdMs || a.id - b.id)
      .forEach((ct) => byNumericId.set(ct.id, ct));

    return Array.from(byNumericId.values())
      .sort((a, b) => {
        const aBase = a.id <= BASE_TEACHERS.length;
        const bBase = b.id <= BASE_TEACHERS.length;
        if (aBase && bBase) return a.id - b.id;
        if (aBase !== bBase) return aBase ? -1 : 1;
        const aTime = a.createdMs || 0;
        const bTime = b.createdMs || 0;
        if (aTime !== bTime) return aTime - bTime;
        return a.id - b.id;
      })
      .map(({ createdMs: _createdMs, ...teacher }) => teacher);
  },

  async addTeacher(payload: {
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
  }): Promise<Teacher> {
    const user = requireAdminUser();
    const cleanName = payload.name.trim().slice(0, 120);
    if (!cleanName) {
      throw new Error('Please enter the teacher name before saving.');
    }

    // Assign a deterministic sequential numericId (7, 8, 9, ...) after BASE_TEACHERS (1..6)
    let maxNumericId = BASE_TEACHERS.length;
    try {
      const existingSnap = await getDocs(collection(db, 'custom_teachers'));
      existingSnap.docs.forEach((d) => {
        const n = Number(d.data().numericId);
        if (Number.isFinite(n) && n > maxNumericId && n < 100) {
          maxNumericId = n;
        }
      });
      if (maxNumericId === BASE_TEACHERS.length) {
        maxNumericId = BASE_TEACHERS.length + existingSnap.docs.filter((d) => !d.id.startsWith('base_')).length;
      }
    } catch {
      maxNumericId = BASE_TEACHERS.length + Math.floor(Math.random() * 500) + 1;
    }
    const numericId = Math.max(BASE_TEACHERS.length + 1, maxNumericId + 1);

    const assignedCourse = payload.assigned_course?.trim()
      ? payload.assigned_course.trim().slice(0, 120)
      : null;

    const rawSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    const emailCandidate = payload.email.trim();
    const safeEmail = (
      emailCandidate.length >= 3
        ? emailCandidate
        : `${rawSlug || `faculty.${numericId}`}@excellence.edu`
    ).slice(0, 160);

    const docData = {
      uid: user.uid,
      numericId,
      name: cleanName,
      title: (payload.title.trim() || 'Assistant Professor').slice(0, 120),
      department: (payload.department.trim() || 'Computer Science').slice(0, 80),
      email: safeEmail,
      office_room: (payload.office_room.trim() || 'Main Faculty Wing').slice(0, 80),
      office_hours: (payload.office_hours.trim() || 'Mon & Wed · 2:00 PM – 4:00 PM').slice(0, 100),
      specialization: (payload.specialization.trim() || assignedCourse || 'Academic Instruction').slice(
        0,
        160
      ),
      assigned_course: assignedCourse,
      publications_count: Math.min(2000, Math.max(0, Number(payload.publications_count) || 5)),
      bio: (
        payload.bio?.trim() || 'Faculty scholar teaching core and elective courses.'
      ).slice(0, 600),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    let createdDocId = '';
    try {
      const ref = await addDoc(collection(db, 'custom_teachers'), docData);
      createdDocId = ref.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'custom_teachers');
    }

    return {
      id: numericId,
      docId: createdDocId,
      isCustom: true,
      name: docData.name,
      title: docData.title,
      department: docData.department,
      email: docData.email,
      office_room: docData.office_room,
      office_hours: docData.office_hours,
      specialization: docData.specialization,
      assigned_course: assignedCourse || undefined,
      publications_count: docData.publications_count,
      bio: docData.bio,
    };
  },

  async updateTeacher(
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
  ): Promise<void> {
    const user = requireAdminUser();
    const cleanName = (patch.name.trim() || teacher.name).slice(0, 120);
    const assignedCourse = patch.assigned_course?.trim()
      ? patch.assigned_course.trim().slice(0, 120)
      : null;
    const emailCandidate = patch.email.trim() || teacher.email;
    const safeEmail = (
      emailCandidate.length >= 3 ? emailCandidate : `faculty.${teacher.id}@excellence.edu`
    ).slice(0, 160);

    const commonFields = {
      name: cleanName,
      title: (patch.title.trim() || teacher.title || 'Assistant Professor').slice(0, 120),
      department: (patch.department.trim() || teacher.department || 'Computer Science').slice(0, 80),
      email: safeEmail,
      office_room: (patch.office_room.trim() || teacher.office_room || 'Main Faculty Wing').slice(
        0,
        80
      ),
      office_hours: (
        patch.office_hours.trim() ||
        teacher.office_hours ||
        'Mon & Wed · 2:00 PM – 4:00 PM'
      ).slice(0, 100),
      specialization: (
        patch.specialization.trim() ||
        teacher.specialization ||
        assignedCourse ||
        'Academic Instruction'
      ).slice(0, 160),
      assigned_course: assignedCourse,
      publications_count: Math.min(
        2000,
        Math.max(0, Number(patch.publications_count ?? teacher.publications_count) || 0)
      ),
      bio: (
        patch.bio?.trim() ||
        teacher.bio ||
        'Dedicated faculty member at Excellence University.'
      ).slice(0, 600),
      updatedAt: serverTimestamp(),
    };

    if (teacher.docId) {
      try {
        await updateDoc(doc(db, 'custom_teachers', teacher.docId), commonFields);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `custom_teachers/${teacher.docId}`);
      }
      return;
    }

    const docId = `base_${teacher.id}`;
    try {
      const existingBaseSnap = await getDoc(doc(db, 'custom_teachers', docId));
      if (existingBaseSnap.exists()) {
        await updateDoc(doc(db, 'custom_teachers', docId), commonFields);
      } else {
        await setDoc(doc(db, 'custom_teachers', docId), {
          uid: user.uid,
          numericId: teacher.id,
          ...commonFields,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `custom_teachers/${docId}`);
    }
  },

  async deleteTeacher(docId: string): Promise<void> {
    requireAdminUser();
    try {
      await deleteDoc(doc(db, 'custom_teachers', docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `custom_teachers/${docId}`);
    }
  },

  // ========================== Teacher Attendance ==========================
  async getTeacherAttendance(): Promise<TeacherAttendanceRecord[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'teacher_attendance'), where('teacherId', '>=', 1))
      );
      return snap.docs
        .map((d) => {
          const data = d.data();
          return {
            docId: d.id,
            teacherId: Number(data.teacherId),
            teacherName: String(data.teacherName || ''),
            department: String(data.department || ''),
            date: String(data.date || ''),
            status: (data.status as TeacherAttendanceStatus) || 'Present',
            notes: String(data.notes || ''),
            markedBy: String(data.markedBy || 'Admin'),
            createdAt:
              typeof data.createdAt?.toDate === 'function'
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
            updatedAt:
              typeof data.updatedAt?.toDate === 'function'
                ? data.updatedAt.toDate().toISOString()
                : new Date().toISOString(),
          };
        })
        .sort((a, b) => {
          const cmp = b.date.localeCompare(a.date);
          return cmp !== 0 ? cmp : a.teacherName.localeCompare(b.teacherName);
        });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'teacher_attendance');
    }
  },

  async markTeacherAttendance(payload: {
    teacherId: number;
    teacherName: string;
    department: string;
    date: string;
    status: TeacherAttendanceStatus;
    notes?: string;
  }): Promise<void> {
    const user = requireAdminUser();
    const docId = `${payload.teacherId}_${sanitizeDocKey(payload.date)}`;
    const ref = doc(db, 'teacher_attendance', docId);
    const markedBy = (user.displayName || 'University Admin').slice(0, 120);
    const notes = (payload.notes || '').trim().slice(0, 400);

    try {
      const existingSnap = await getDoc(ref);
      if (existingSnap.exists()) {
        await updateDoc(ref, {
          status: payload.status,
          notes,
          markedBy,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          uid: user.uid,
          teacherId: Math.max(1, Number(payload.teacherId)),
          teacherName: payload.teacherName.trim().slice(0, 120),
          department: (payload.department.trim() || 'Academic Faculty').slice(0, 80),
          date: payload.date.trim().slice(0, 20),
          status: payload.status,
          notes,
          markedBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `teacher_attendance/${docId}`);
    }
  },

  async deleteTeacherAttendance(docId: string): Promise<void> {
    requireAdminUser();
    try {
      await deleteDoc(doc(db, 'teacher_attendance', docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `teacher_attendance/${docId}`);
    }
  },

  // ========================== Timetables ==========================
  async getSavedTimetables(): Promise<SavedTimetable[]> {
    try {
      const snap = await getDocs(collection(db, 'timetables'));
      return snap.docs
        .map((d) => {
          const data = d.data();
          const rawSlots = Array.isArray(data.slots) ? data.slots : [];
          const rawGroups = Array.isArray(data.groups) ? data.groups : [];
          return {
            docId: d.id,
            title: String(data.title || 'College Master Timetable'),
            teachersCount: Number(data.teachersCount) || 1,
            sectionsCount: Number(data.sectionsCount) || 1,
            roomsCount: Number(data.roomsCount) || 1,
            daysCount: Number(data.daysCount) || 5,
            groups: rawGroups.map((g) => Number(g)),
            slots: rawSlots.map((sl) => ({
              d: Number(sl.d),
              p: Number(sl.p),
              s: Number(sl.s),
              courseId: Number(sl.courseId),
              courseName: String(sl.courseName || ''),
              teacherIdx: Number(sl.teacherIdx),
              teacherId: Number(sl.teacherId),
              teacherName: String(sl.teacherName || ''),
              roomNumber: Number(sl.roomNumber),
            })),
            createdAt:
              typeof data.createdAt?.toDate === 'function'
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'timetables');
    }
  },

  async saveTimetable(payload: {
    title: string;
    teachersCount: number;
    sectionsCount: number;
    roomsCount: number;
    daysCount: number;
    groups: number[];
    slots: TimetableSlot[];
  }): Promise<SavedTimetable> {
    const user = requireAdminUser();
    const docData = {
      uid: user.uid,
      title: (payload.title.trim() || 'University Master Timetable').slice(0, 160),
      teachersCount: payload.teachersCount,
      sectionsCount: payload.sectionsCount,
      roomsCount: payload.roomsCount,
      daysCount: payload.daysCount,
      groups: payload.groups,
      slots: payload.slots,
      createdAt: serverTimestamp(),
    };

    try {
      const ref = await addDoc(collection(db, 'timetables'), docData);
      return {
        docId: ref.id,
        title: docData.title,
        teachersCount: docData.teachersCount,
        sectionsCount: docData.sectionsCount,
        roomsCount: docData.roomsCount,
        daysCount: docData.daysCount,
        groups: docData.groups,
        slots: docData.slots,
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'timetables');
    }
  },

  async updateTimetableSlots(docId: string, slots: TimetableSlot[]): Promise<void> {
    requireAdminUser();
    try {
      await updateDoc(doc(db, 'timetables', docId), { slots });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `timetables/${docId}`);
    }
  },

  async deleteTimetable(docId: string): Promise<void> {
    requireAdminUser();
    try {
      await deleteDoc(doc(db, 'timetables', docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `timetables/${docId}`);
    }
  },

  // ========================== Students ==========================
  async getStudents(): Promise<Student[]> {
    let customStudents: Student[] = [];
    try {
      const snap = await getDocs(collection(db, 'students'));
      customStudents = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: stableNumericId(d.id),
          docId: d.id,
          isCustom: true,
          student_code: String(data.student_code),
          name: String(data.name),
          email: String(data.major),
          major: String(data.major),
          year_level: String(data.year_level),
          gpa: Number(data.gpa) || 3.8,
          honors: String(data.honors),
          club_name: String(data.club_name),
          created_at:
            typeof data.createdAt?.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'students');
    }

    return [...customStudents, ...BASE_STUDENTS];
  },

  async addSetupStudent(payload: {
    name: string;
    student_code: string;
    major: string;
    year_level?: string;
  }): Promise<void> {
    const user = requireAdminUser();
    const code = (
      payload.student_code.trim() || `EU-2026-${Math.floor(1000 + Math.random() * 9000)}`
    )
      .toUpperCase()
      .slice(0, 32);
    const major = (payload.major.trim() || 'Computer Science').slice(0, 80);

    try {
      await addDoc(collection(db, 'students'), {
        uid: user.uid,
        student_code: code.length >= 2 ? code : 'EU-1001',
        name: payload.name.trim().slice(0, 120),
        major: major.length >= 2 ? major : 'General Studies',
        year_level: (payload.year_level?.trim() || 'Enrolled Cohort').slice(0, 80),
        gpa: 3.8,
        honors: 'Active Scholar',
        club_name: major.length >= 2 ? major : 'Academic Cohort',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'students');
    }
  },

  async deleteStudent(docId: string): Promise<void> {
    requireAdminUser();
    try {
      await deleteDoc(doc(db, 'students', docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${docId}`);
    }
  },

  // ========================== Student Results ==========================
  async getStudentResults(): Promise<StudentResult[]> {
    try {
      const snap = await getDocs(collection(db, 'student_results'));
      return snap.docs
        .map((d) => {
          const data = d.data();
          return {
            docId: d.id,
            studentCode: String(data.studentCode || ''),
            studentName: String(data.studentName || ''),
            courseName: String(data.courseName || ''),
            subjectName: String(data.subjectName || ''),
            marks: Number(data.marks) || 0,
            maxMarks: Number(data.maxMarks) || 100,
            grade: String(data.grade || 'P'),
            semester: String(data.semester || 'Semester 1'),
            createdAt:
              typeof data.createdAt?.toDate === 'function'
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
            updatedAt:
              typeof data.updatedAt?.toDate === 'function'
                ? data.updatedAt.toDate().toISOString()
                : new Date().toISOString(),
          };
        })
        .sort((a, b) => a.studentName.localeCompare(b.studentName));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'student_results');
    }
  },

  async saveStudentResult(payload: {
    studentCode: string;
    studentName: string;
    courseName: string;
    subjectName: string;
    marks: number;
    maxMarks: number;
    grade: string;
    semester: string;
  }): Promise<void> {
    const user = requireAdminUser();
    const docId = sanitizeDocKey(
      `${payload.studentName.trim().toLowerCase()}_${payload.subjectName.trim().toLowerCase()}_${payload.semester.trim().toLowerCase()}`
    );
    const ref = doc(db, 'student_results', docId);
    const cleanPayload = {
      studentCode: (payload.studentCode.trim() || 'STU-001').slice(0, 40),
      studentName: payload.studentName.trim().slice(0, 120),
      courseName: (payload.courseName.trim() || 'General Program').slice(0, 120),
      subjectName: payload.subjectName.trim().slice(0, 160),
      marks: Math.min(1000, Math.max(0, Number(payload.marks) || 0)),
      maxMarks: Math.min(1000, Math.max(1, Number(payload.maxMarks) || 100)),
      grade: (payload.grade.trim() || 'A').slice(0, 8),
      semester: (payload.semester.trim() || 'Semester 1').slice(0, 40),
      updatedAt: serverTimestamp(),
    };

    try {
      const existingSnap = await getDoc(ref);
      if (existingSnap.exists()) {
        await updateDoc(ref, cleanPayload);
      } else {
        await setDoc(ref, {
          uid: user.uid,
          ...cleanPayload,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `student_results/${docId}`);
    }
  },

  async deleteStudentResult(docId: string): Promise<void> {
    requireAdminUser();
    try {
      await deleteDoc(doc(db, 'student_results', docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `student_results/${docId}`);
    }
  },

  // ========================== Academic Calendar ==========================
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    let customEvents: CalendarEvent[] = [];
    try {
      const snap = await getDocs(collection(db, 'calendar_events'));
      customEvents = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: stableNumericId(d.id),
          docId: d.id,
          title: String(data.title),
          category: (data.category as CalendarEvent['category']) || 'Holiday',
          event_date: String(data.event_date),
          end_date: data.end_date ? String(data.end_date) : null,
          location: String(data.location),
          semester: String(data.semester),
          description: String(data.description),
          is_custom: Number(data.is_custom) || 1,
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'calendar_events');
    }

    return [...BASE_CALENDAR_EVENTS, ...customEvents].sort((a, b) =>
      a.event_date.localeCompare(b.event_date)
    );
  },

  async createCalendarEvent(payload: {
    title: string;
    category: 'Academic' | 'Exam' | 'Holiday' | 'Deadline' | 'Notice';
    event_date: string;
    end_date?: string;
    location: string;
    semester: string;
    description: string;
  }): Promise<void> {
    const user = requireAdminUser();
    try {
      await addDoc(collection(db, 'calendar_events'), {
        uid: user.uid,
        title: payload.title.trim().slice(0, 160),
        category: payload.category,
        event_date: payload.event_date.slice(0, 20),
        end_date: payload.end_date ? payload.end_date.slice(0, 20) : null,
        location: (payload.location.trim() || 'University Campus').slice(0, 120),
        semester: (payload.semester.trim() || 'Academic Term').slice(0, 40),
        description: (payload.description.trim() || 'University calendar item.').slice(0, 600),
        is_custom: 1,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'calendar_events');
    }
  },

  async deleteCalendarEvent(ev: CalendarEvent): Promise<void> {
    requireAdminUser();
    if (!ev.docId || ev.is_custom !== 1) {
      throw new Error('Built-in university baseline dates cannot be deleted.');
    }
    try {
      await deleteDoc(doc(db, 'calendar_events', ev.docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `calendar_events/${ev.docId}`);
    }
  },

  // ========================== Admin Auth Logs ==========================
  async syncAdminRoleDoc(): Promise<void> {
    const user = auth.currentUser;
    if (!user || !isAdminEmail(user.email)) return;
    const adminRef = doc(db, 'admins', user.uid);
    try {
      const snap = await getDoc(adminRef);
      if (!snap.exists()) {
        await setDoc(adminRef, {
          uid: user.uid,
          email: (user.email || '').toLowerCase().slice(0, 160),
          role: 'admin',
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admins/${user.uid}`);
    }
  },

  async recordLoginActivity(eventType: 'Sign In' | 'Sign Up' | 'Session Restored'): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    const provider = user.providerData?.[0]?.providerId || 'password';
    const role: 'admin' | 'scholar' = isAdminEmail(user.email) ? 'admin' : 'scholar';
    const ua =
      typeof navigator !== 'undefined' && navigator.userAgent
        ? navigator.userAgent.slice(0, 240)
        : 'Web Browser';

    try {
      await addDoc(collection(db, 'login_logs'), {
        uid: user.uid,
        email: user.email.slice(0, 160),
        displayName: (user.displayName || user.email.split('@')[0] || 'Scholar').slice(0, 120),
        role,
        provider: provider.slice(0, 60),
        emailVerified: Boolean(user.emailVerified),
        eventType,
        userAgent: ua,
        lastSignInTime: user.metadata?.lastSignInTime?.slice(0, 80) || null,
        accountCreatedAt: user.metadata?.creationTime?.slice(0, 80) || null,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'login_logs');
    }
  },

  async getLoginLogs(): Promise<LoginLog[]> {
    requireAdminUser();
    try {
      const snap = await getDocs(collection(db, 'login_logs'));
      return snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: String(data.uid || ''),
            email: String(data.email || ''),
            displayName: String(data.displayName || 'Scholar'),
            role: (data.role === 'admin' ? 'admin' : 'scholar') as 'admin' | 'scholar',
            provider: String(data.provider || 'password'),
            emailVerified: Boolean(data.emailVerified),
            eventType: (data.eventType as LoginLog['eventType']) || 'Sign In',
            userAgent: String(data.userAgent || 'Web Browser'),
            lastSignInTime: data.lastSignInTime ? String(data.lastSignInTime) : null,
            accountCreatedAt: data.accountCreatedAt ? String(data.accountCreatedAt) : null,
            createdAt:
              typeof data.createdAt?.toDate === 'function'
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'login_logs');
    }
  },

  async getRegisteredAccounts(logs: LoginLog[]): Promise<RegisteredAccount[]> {
    requireAdminUser();
    const accountMap = new Map<string, RegisteredAccount>();

    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      await Promise.all(
        usersSnap.docs.map(async (uDoc) => {
          const pub = uDoc.data();
          let email = '';
          try {
            const privSnap = await getDoc(doc(db, 'users', uDoc.id, 'private', 'info'));
            if (privSnap.exists()) {
              email = String(privSnap.data().email || '');
            }
          } catch {
            // Fall back to login logs if private doc doesn't exist
          }
          const createdAt =
            typeof pub.createdAt?.toDate === 'function'
              ? pub.createdAt.toDate().toISOString()
              : new Date().toISOString();

          accountMap.set(uDoc.id, {
            uid: uDoc.id,
            displayName: String(pub.displayName || 'Scholar'),
            email,
            major: String(pub.major || 'General Studies'),
            role: isAdminEmail(email) ? 'admin' : 'scholar',
            provider: 'password',
            emailVerified: false,
            loginCount: 0,
            lastLoginAt: createdAt,
            createdAt,
          });
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }

    for (const log of logs) {
      const existingAcc = accountMap.get(log.uid);
      if (existingAcc) {
        existingAcc.loginCount += 1;
        if (!existingAcc.email && log.email) existingAcc.email = log.email;
        if (isAdminEmail(existingAcc.email)) existingAcc.role = 'admin';
        existingAcc.provider = log.provider;
        existingAcc.emailVerified = log.emailVerified;
        if (log.createdAt > existingAcc.lastLoginAt) {
          existingAcc.lastLoginAt = log.createdAt;
        }
      } else {
        accountMap.set(log.uid, {
          uid: log.uid,
          displayName: log.displayName,
          email: log.email,
          major: 'General Studies',
          role: log.role,
          provider: log.provider,
          emailVerified: log.emailVerified,
          loginCount: 1,
          lastLoginAt: log.createdAt,
          createdAt: log.accountCreatedAt || log.createdAt,
        });
      }
    }

    return Array.from(accountMap.values()).sort((a, b) =>
      b.lastLoginAt.localeCompare(a.lastLoginAt)
    );
  },

  // ========================== College Notices ==========================
  async getCollegeNotices(includeInactive = false): Promise<CollegeNotice[]> {
    let customNotices: CollegeNotice[] = [];
    try {
      const snap = await getDocs(collection(db, 'college_notices'));
      customNotices = snap.docs.map((d) => {
        const data = d.data();
        return {
          docId: d.id,
          title: String(data.title || ''),
          category: (data.category as NoticeCategory) || 'General',
          audience: String(data.audience || 'All Students & Faculty'),
          body: String(data.body || ''),
          publishedBy: String(data.publishedBy || 'University Administration'),
          isPinned: Boolean(data.isPinned),
          isActive: Boolean(data.isActive),
          expiresAt: data.expiresAt ? String(data.expiresAt) : null,
          createdAt:
            typeof data.createdAt?.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          updatedAt:
            typeof data.updatedAt?.toDate === 'function'
              ? data.updatedAt.toDate().toISOString()
              : new Date().toISOString(),
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'college_notices');
    }

    const sorted = customNotices.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    if (includeInactive) {
      return sorted;
    }

    const active = sorted.filter((n) => n.isActive);
    return active.length > 0 ? active : BASE_NOTICES;
  },

  async createCollegeNotice(payload: {
    title: string;
    category: NoticeCategory;
    audience: string;
    body: string;
    isPinned: boolean;
    expiresAt?: string;
  }): Promise<void> {
    const user = requireAdminUser();
    try {
      await addDoc(collection(db, 'college_notices'), {
        uid: user.uid,
        title: payload.title.trim().slice(0, 180),
        category: payload.category,
        audience: (payload.audience.trim() || 'All Students & Faculty').slice(0, 80),
        body: payload.body.trim().slice(0, 2000),
        publishedBy: (user.displayName || 'University Administration').slice(0, 120),
        isPinned: Boolean(payload.isPinned),
        isActive: true,
        expiresAt: payload.expiresAt?.trim() ? payload.expiresAt.trim().slice(0, 20) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'college_notices');
    }
  },

  async updateCollegeNotice(
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
  ): Promise<void> {
    requireAdminUser();
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (patch.title !== undefined) payload.title = patch.title.trim().slice(0, 180);
    if (patch.category !== undefined) payload.category = patch.category;
    if (patch.audience !== undefined) payload.audience = patch.audience.trim().slice(0, 80);
    if (patch.body !== undefined) payload.body = patch.body.trim().slice(0, 2000);
    if (patch.isPinned !== undefined) payload.isPinned = Boolean(patch.isPinned);
    if (patch.isActive !== undefined) payload.isActive = Boolean(patch.isActive);
    if (patch.expiresAt !== undefined) {
      payload.expiresAt = patch.expiresAt ? patch.expiresAt.trim().slice(0, 20) : null;
    }

    try {
      await updateDoc(doc(db, 'college_notices', docId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `college_notices/${docId}`);
    }
  },

  async deleteCollegeNotice(docId: string): Promise<void> {
    requireAdminUser();
    try {
      await deleteDoc(doc(db, 'college_notices', docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `college_notices/${docId}`);
    }
  },
};
