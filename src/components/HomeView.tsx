import { useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  GraduationCap,
  Megaphone,
  Pin,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import { getCourseImage, HERO_GRADUATION_IMAGE } from '../lib/courseImages';
import type { CollegeNotice, Course, PagePath, PortalOverview } from '../types';

interface HomeViewProps {
  courses: Course[];
  notices: CollegeNotice[];
  overview: PortalOverview | null;
  onNavigate: (page: PagePath) => void;
  onToggleEnroll: (course: Course) => Promise<void>;
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
  busyCourseId: number | null;
}

const DEPARTMENTS = ['All', 'Computer Science', 'Architecture', 'Economics'];

export function HomeView({
  courses,
  notices,
  overview,
  onNavigate,
  onToggleEnroll,
  onCreateCourse,
  busyCourseId,
}: HomeViewProps) {
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [activeSyllabusCourse, setActiveSyllabusCourse] = useState<Course | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});

  // Add Course Form state
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDept, setFormDept] = useState('Computer Science');
  const [formDuration, setFormDuration] = useState('10 Weeks');
  const [formInstructor, setFormInstructor] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCredits, setFormCredits] = useState(4);
  const [formSeats, setFormSeats] = useState(40);
  const [formSchedule, setFormSchedule] = useState('Tue / Thu · 11:00 AM – 12:30 PM');
  const [formSyllabus, setFormSyllabus] = useState('');
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [formError, setFormError] = useState('');

  const filteredCourses = courses.filter((course) => {
    if (selectedDepartment !== 'All' && course.department !== selectedDepartment) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        course.title.toLowerCase().includes(q) ||
        course.code.toLowerCase().includes(q) ||
        course.instructor.toLowerCase().includes(q) ||
        course.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const displayedCourses =
    showAllCourses || selectedDepartment !== 'All' || searchQuery.trim()
      ? filteredCourses
      : filteredCourses.slice(0, 3);

  const handleScrollToCourses = () => {
    const el = document.getElementById('courses-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmittingCourse(true);
    try {
      await onCreateCourse({
        code: formCode,
        title: formTitle,
        department: formDept,
        duration: formDuration,
        instructor: formInstructor,
        description: formDescription,
        credits: formCredits,
        seats_total: formSeats,
        schedule: formSchedule,
        syllabus: formSyllabus,
      });
      setShowAddModal(false);
      setShowAllCourses(true);
      setFormCode('');
      setFormTitle('');
      setFormInstructor('');
      setFormDescription('');
      setFormSyllabus('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save course.');
    } finally {
      setSubmittingCourse(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#f7f9ff]">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-[#1a1c1f] text-[#838488] py-16 px-6 lg:px-12 pt-28 pb-24">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${HERO_GRADUATION_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1c1f] via-[#1a1c1f]/90 to-transparent" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 flex flex-col items-start">
            <p className="text-xs font-medium uppercase tracking-widest text-[#ffe088] mb-4">
              Elite Academic Portal
            </p>
            <h1 className="text-4xl sm:text-5xl font-['Newsreader',Georgia,serif] font-semibold text-white mb-6 tracking-tight leading-[1.1] max-w-2xl [text-wrap:balance]">
              Empowering College Students for Academic Excellence
            </h1>
            <p className="text-lg text-[#c6c6ca] mb-8 max-w-2xl leading-relaxed">
              Unlock your true academic potential with structured courses, elite mentorship,
              transparent office resources, and a streamlined calendar built for visionary scholars.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleScrollToCourses}
                className="px-6 py-3 rounded-lg bg-[#fed65b] text-[#745c00] font-semibold text-sm transition-transform hover:scale-[1.02] shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('academic-calendar')}
                className="px-6 py-3 rounded-lg bg-white/10 text-white font-medium text-sm border border-[#76777b]/40 hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap"
              >
                View Calendar
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border border-[#fed65b]/20 group bg-[#191c1d]">
              <img
                src={HERO_GRADUATION_IMAGE}
                alt="Black graduation cap with shimmering golden tassel resting above open academic books"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-6">
                <div className="text-white">
                  <p className="text-xs text-[#ffe088] uppercase tracking-wider font-medium">
                    Class of 2024
                  </p>
                  <p className="text-2xl font-['Newsreader',Georgia,serif] font-medium">
                    Distinction in Every Step
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Cards Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 -mt-12 relative z-20 w-full mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="text-left group bg-white p-7 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-[#76777b]/15 flex flex-col justify-between relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#fed65b] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#fed65b]/25 text-[#745c00] flex items-center justify-center mb-5 group-hover:bg-[#fed65b] transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-[22px] text-[#181c20] font-['Newsreader',Georgia,serif] font-medium mb-2">
                Admin Portal
              </h3>
              <p className="text-sm text-[#45474a] leading-relaxed">
                Conflict-free timetables, notices, teacher attendance, calendar, and setup.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-sm text-[#735c00] font-semibold group-hover:translate-x-1 transition-transform">
              <span>Admin Access</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('teachers')}
            className="text-left group bg-white p-7 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-[#76777b]/15 flex flex-col justify-between relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#fed65b] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#fed65b]/25 text-[#745c00] flex items-center justify-center mb-5 group-hover:bg-[#fed65b] transition-colors">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-[22px] text-[#181c20] font-['Newsreader',Georgia,serif] font-medium mb-2">
                Teachers
              </h3>
              <p className="text-sm text-[#45474a] leading-relaxed">
                View your monthly attendance calendar and official administrative notices.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-sm text-[#735c00] font-semibold group-hover:translate-x-1 transition-transform">
              <span>Teacher Portal</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('students')}
            className="text-left group bg-white p-7 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-[#76777b]/15 flex flex-col justify-between relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#fed65b] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#fed65b]/25 text-[#745c00] flex items-center justify-center mb-5 group-hover:bg-[#fed65b] transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-[22px] text-[#181c20] font-['Newsreader',Georgia,serif] font-medium mb-2">
                Students
              </h3>
              <p className="text-sm text-[#45474a] leading-relaxed">
                Access administrative notices, read-only class timetables, and saved results.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-sm text-[#735c00] font-semibold group-hover:translate-x-1 transition-transform">
              <span>Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('academic-calendar')}
            className="text-left group bg-white p-7 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-[#76777b]/15 flex flex-col justify-between relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#fed65b] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#fed65b]/25 text-[#745c00] flex items-center justify-center mb-5 group-hover:bg-[#fed65b] transition-colors">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="text-[22px] text-[#181c20] font-['Newsreader',Georgia,serif] font-medium mb-2">
                Academic Calendar
              </h3>
              <p className="text-sm text-[#45474a] leading-relaxed">
                Official university holidays, campus notices, and important scheduled events.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-sm text-[#735c00] font-semibold group-hover:translate-x-1 transition-transform">
              <span>View Calendar</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </section>

      {/* Featured Courses & Resources Section */}
      <section id="courses-section" className="max-w-7xl mx-auto px-6 lg:px-12 py-12 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <p className="text-xs font-medium text-[#735c00] uppercase tracking-widest mb-2">
              Curated Excellence
            </p>
            <h2 className="text-4xl text-[#181c20] font-['Newsreader',Georgia,serif] font-semibold tracking-tight">
              Featured Courses &amp; Resources
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a1c1f] text-white text-sm font-medium hover:bg-[#735c00] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-[#fed65b]" />
              <span>Add Course</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAllCourses((prev) => !prev)}
              className="text-sm font-semibold text-[#181c20] hover:text-[#735c00] transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap px-2 py-2"
            >
              <span>{showAllCourses ? 'Show featured only' : `Browse all programs (${courses.length})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#e0e3e8]">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#ebeef3] rounded-lg self-start">
            {DEPARTMENTS.map((dept) => {
              const active = selectedDepartment === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-[#181c20] shadow-sm'
                      : 'text-[#45474a] hover:text-[#181c20]'
                  }`}
                >
                  {dept}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#76777b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course, code, or faculty..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-[#c6c6ca]/60 text-sm text-[#181c20] placeholder:text-[#76777b] focus:outline-2 focus:outline-[#735c00]"
            />
          </div>
        </div>

        {/* Course Grid */}
        {displayedCourses.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e0e3e8] p-12 text-center">
            <p className="text-lg font-['Newsreader',Georgia,serif] text-[#181c20]">
              No courses match your current filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedDepartment('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-[#fed65b] text-[#745c00] text-sm font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayedCourses.map((course) => {
              const isBusy = busyCourseId === course.id;
              const imgFailed = imageErrorMap[course.id];
              return (
                <article
                  key={course.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-[#76777b]/15 flex flex-col"
                >
                  <div className="h-48 w-full relative bg-[#1a1c1f] overflow-hidden">
                    {!imgFailed ? (
                      <img
                        src={getCourseImage(course.image_key)}
                        alt={course.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImageErrorMap((prev) => ({ ...prev, [course.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a1c1f] to-[#45474a] flex items-center justify-center p-6 text-center">
                        <span className="text-white font-['Newsreader',Georgia,serif] text-xl">
                          {course.department}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  </div>

                  <div className="p-6 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2 text-xs text-[#45474a]">
                        <span className="font-medium text-[#735c00]">
                          {course.department} · {course.code}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#735c00] font-semibold tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-[#fed65b] text-[#735c00]" />
                          {course.rating.toFixed(1)} ({course.review_count})
                        </span>
                      </div>

                      <h3 className="text-[22px] text-[#181c20] font-['Newsreader',Georgia,serif] font-medium leading-snug mb-2">
                        {course.title}
                      </h3>

                      <p className="text-sm text-[#45474a] leading-relaxed mb-4">
                        {course.description}
                      </p>

                      <p className="text-xs text-[#45474a] tabular-nums mb-4">
                        {course.duration} · {course.credits} Credits ·{' '}
                        {course.seats_total - course.seats_taken} of {course.seats_total} seats open
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#ebeef3] flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveSyllabusCourse(course)}
                        className="text-left text-sm font-semibold text-[#181c20] hover:text-[#735c00] transition-colors truncate cursor-pointer"
                        title="View course syllabus & schedule"
                      >
                        {course.instructor}
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveSyllabusCourse(course)}
                          className="px-3 py-2 rounded-lg text-xs font-medium text-[#45474a] hover:bg-[#ebeef3] transition-colors cursor-pointer"
                        >
                          Syllabus
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onToggleEnroll(course)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                            course.enrolled
                              ? 'bg-[#fed65b] text-[#745c00] hover:bg-[#e9c349]'
                              : 'bg-[#000000] text-white hover:bg-[#735c00]'
                          } disabled:opacity-60`}
                        >
                          {course.enrolled && <Check className="w-3.5 h-3.5" />}
                          <span>
                            {isBusy
                              ? 'Updating...'
                              : course.enrolled
                                ? 'Enrolled'
                                : 'Enroll'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Official College Notices Section */}
      {notices.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-medium text-[#735c00] uppercase tracking-widest mb-1.5">
                Campus Bulletin Board
              </p>
              <h2 className="text-3xl text-[#181c20] font-['Newsreader',Georgia,serif] font-semibold tracking-tight flex items-center gap-2.5">
                <Megaphone className="w-6 h-6 text-[#735c00]" />
                <span>Official College Notices</span>
              </h2>
            </div>
            <span className="text-xs text-[#45474a] tabular-nums">
              {notices.length} active announcements
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notices.slice(0, 4).map((notice) => (
              <article
                key={notice.docId}
                className="bg-white rounded-xl p-6 border border-[#c6c6ca]/40 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#735c00] mb-1.5">
                    <span>
                      {notice.category} · {notice.audience}
                    </span>
                    {notice.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[#735c00]">
                        <Pin className="w-3 h-3" />
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
        </section>
      )}

      {/* Statistics & Trust Banner */}
      <section className="bg-[#f1f4f9] py-16 my-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="p-4">
            <p className="text-4xl sm:text-5xl font-['Newsreader',Georgia,serif] font-semibold text-[#735c00] mb-1 tabular-nums">
              {overview ? `${(overview.activeStudentsCount / 1000).toFixed(1)}k+` : '15.0k+'}
            </p>
            <p className="text-sm text-[#45474a] font-medium">Active Students</p>
          </div>
          <div className="p-4">
            <p className="text-4xl sm:text-5xl font-['Newsreader',Georgia,serif] font-semibold text-[#735c00] mb-1 tabular-nums">
              {overview ? `${overview.facultyCount}+` : '256+'}
            </p>
            <p className="text-sm text-[#45474a] font-medium">Expert Faculty</p>
          </div>
          <div className="p-4">
            <p className="text-4xl sm:text-5xl font-['Newsreader',Georgia,serif] font-semibold text-[#735c00] mb-1 tabular-nums">
              {overview ? overview.placementRate : '98%'}
            </p>
            <p className="text-sm text-[#45474a] font-medium">Placement Rate</p>
          </div>
          <div className="p-4">
            <p className="text-4xl sm:text-5xl font-['Newsreader',Georgia,serif] font-semibold text-[#735c00] mb-1 tabular-nums">
              {overview ? overview.globalPartners : '40+'}
            </p>
            <p className="text-sm text-[#45474a] font-medium">Global Partners</p>
          </div>
        </div>
      </section>

      {/* Syllabus Detail Modal */}
      {activeSyllabusCourse && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-[#c6c6ca]/40 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#735c00] uppercase tracking-wider">
                  {activeSyllabusCourse.code} · {activeSyllabusCourse.department}
                </p>
                <h3 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] mt-1">
                  {activeSyllabusCourse.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSyllabusCourse(null)}
                className="p-1.5 rounded-lg text-[#45474a] hover:bg-[#ebeef3] cursor-pointer"
                aria-label="Close syllabus"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#f1f4f9] rounded-lg p-4 text-sm">
              <div>
                <p className="text-xs text-[#45474a]">Instructor</p>
                <p className="font-semibold text-[#181c20]">{activeSyllabusCourse.instructor}</p>
              </div>
              <div>
                <p className="text-xs text-[#45474a]">Schedule</p>
                <p className="font-semibold text-[#181c20]">{activeSyllabusCourse.schedule}</p>
              </div>
              <div>
                <p className="text-xs text-[#45474a]">Duration &amp; Credits</p>
                <p className="font-semibold text-[#181c20] tabular-nums">
                  {activeSyllabusCourse.duration} · {activeSyllabusCourse.credits} Credits
                </p>
              </div>
              <div>
                <p className="text-xs text-[#45474a]">Enrollment Capacity</p>
                <p className="font-semibold text-[#181c20] tabular-nums">
                  {activeSyllabusCourse.seats_taken} / {activeSyllabusCourse.seats_total} Enrolled
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#181c20] mb-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                Course Syllabus &amp; Curriculum
              </h4>
              <p className="text-sm text-[#45474a] leading-relaxed">
                {activeSyllabusCourse.syllabus}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveSyllabusCourse(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#45474a] hover:bg-[#ebeef3] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = activeSyllabusCourse;
                  await onToggleEnroll(target);
                  setActiveSyllabusCourse(null);
                }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                  activeSyllabusCourse.enrolled
                    ? 'bg-[#fed65b] text-[#745c00]'
                    : 'bg-[#000000] text-white'
                }`}
              >
                {activeSyllabusCourse.enrolled ? 'Drop Course' : 'Enroll in Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleCourseSubmit}
            className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-[#c6c6ca]/40 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20]">
                Publish New Course
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-[#45474a] hover:bg-[#ebeef3] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-[#ffdad6] text-[#93000a] text-sm">{formError}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#45474a] mb-1">Course Code</label>
                <input
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. CS-480"
                  className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#45474a] mb-1">Department</label>
                <select
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm bg-white"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Economics">Economics</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#45474a] mb-1">Course Title</label>
              <input
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Machine Learning Theory & Generalization"
                className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#45474a] mb-1">Instructor</label>
                <input
                  required
                  value={formInstructor}
                  onChange={(e) => setFormInstructor(e.target.value)}
                  placeholder="Prof. S. Verma"
                  className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#45474a] mb-1">Duration</label>
                <input
                  required
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#45474a] mb-1">Credits / Seats</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={formCredits}
                    onChange={(e) => setFormCredits(Number(e.target.value))}
                    className="w-1/2 px-2.5 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                  />
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={formSeats}
                    onChange={(e) => setFormSeats(Number(e.target.value))}
                    className="w-1/2 px-2.5 py-2 rounded-lg border border-[#c6c6ca] text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#45474a] mb-1">Schedule</label>
              <input
                value={formSchedule}
                onChange={(e) => setFormSchedule(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#45474a] mb-1">Summary</label>
              <textarea
                required
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief academic overview of the course..."
                className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#45474a] mb-1">Syllabus Topics</label>
              <textarea
                rows={2}
                value={formSyllabus}
                onChange={(e) => setFormSyllabus(e.target.value)}
                placeholder="Key modules, readings, and capstone milestones..."
                className="w-full px-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#45474a] hover:bg-[#ebeef3] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingCourse}
                className="px-5 py-2 rounded-lg bg-[#000000] text-white text-sm font-semibold hover:bg-[#735c00] transition-colors cursor-pointer disabled:opacity-60"
              >
                {submittingCourse ? 'Saving...' : 'Publish Course'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
