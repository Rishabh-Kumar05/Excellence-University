export type PagePath = 'home' | 'admin' | 'teachers' | 'students' | 'academic-calendar';

export interface Course {
  id: number;
  docId?: string;
  isCustom?: boolean;
  code: string;
  title: string;
  department: string;
  duration: string;
  rating: number;
  review_count: number;
  instructor: string;
  description: string;
  image_key: string;
  credits: number;
  seats_total: number;
  seats_taken: number;
  schedule: string;
  syllabus: string;
  featured: number;
  enrolled: boolean;
}

export interface Enrollment {
  id: number;
  student_email: string;
  student_name: string;
  course_id: number;
  enrolled_at: string;
  code: string;
  title: string;
  department: string;
  instructor: string;
  duration: string;
  credits: number;
  schedule: string;
}

export interface Teacher {
  id: number;
  docId?: string;
  isCustom?: boolean;
  name: string;
  title: string;
  department: string;
  email: string;
  office_room: string;
  office_hours: string;
  specialization: string;
  assigned_course?: string;
  publications_count: number;
  bio: string;
}

export type TeacherAttendanceStatus = 'Present' | 'Absent' | 'Late' | 'On Leave';

export interface TeacherAttendanceRecord {
  docId: string;
  teacherId: number;
  teacherName: string;
  department: string;
  date: string;
  status: TeacherAttendanceStatus;
  notes: string;
  markedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableSlot {
  d: number;
  p: number;
  s: number;
  courseId: number;
  courseName: string;
  teacherIdx: number;
  teacherId: number;
  teacherName: string;
  roomNumber: number;
}

export interface SavedTimetable {
  docId: string;
  title: string;
  teachersCount: number;
  sectionsCount: number;
  roomsCount: number;
  daysCount: number;
  groups: number[];
  slots: TimetableSlot[];
  createdAt: string;
}

export interface Student {
  id: number;
  docId?: string;
  isCustom?: boolean;
  student_code: string;
  name: string;
  email: string;
  major: string;
  year_level: string;
  gpa: number;
  honors: string;
  club_name: string;
  created_at: string;
}

export interface StudentResult {
  docId: string;
  studentCode: string;
  studentName: string;
  courseName: string;
  subjectName: string;
  marks: number;
  maxMarks: number;
  grade: string;
  semester: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: number;
  docId?: string;
  title: string;
  category: 'Academic' | 'Exam' | 'Holiday' | 'Deadline' | 'Notice';
  event_date: string;
  end_date: string | null;
  location: string;
  semester: string;
  description: string;
  is_custom: number;
}

export interface PortalOverview {
  activeStudentsCount: number;
  facultyCount: number;
  coursesCount: number;
  enrollmentsCount: number;
  appointmentsCount: number;
  upcomingEventsCount: number;
  placementRate: string;
  globalPartners: string;
}

export interface LoginLog {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'scholar';
  provider: string;
  emailVerified: boolean;
  eventType: 'Sign In' | 'Sign Up' | 'Session Restored';
  userAgent: string;
  lastSignInTime: string | null;
  accountCreatedAt: string | null;
  createdAt: string;
}

export interface RegisteredAccount {
  uid: string;
  displayName: string;
  email: string;
  major: string;
  role: 'admin' | 'scholar';
  provider: string;
  emailVerified: boolean;
  loginCount: number;
  lastLoginAt: string;
  createdAt: string;
}

export type NoticeCategory = 'General' | 'Academic' | 'Examination' | 'Urgent' | 'Event';

export interface CollegeNotice {
  docId: string;
  title: string;
  category: NoticeCategory;
  audience: string;
  body: string;
  publishedBy: string;
  isPinned: boolean;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}
