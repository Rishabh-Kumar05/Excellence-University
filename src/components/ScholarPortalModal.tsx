import { GraduationCap, LogOut, Megaphone, ShieldCheck, Trash2, X } from 'lucide-react';
import type { CollegeNotice, Enrollment } from '../types';

interface ScholarPortalModalProps {
  open: boolean;
  onClose: () => void;
  activeScholar: { name: string; email: string; emailVerified: boolean };
  enrollments: Enrollment[];
  notices: CollegeNotice[];
  onDropCourse: (courseId: number) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function ScholarPortalModal({
  open,
  onClose,
  activeScholar,
  enrollments,
  notices,
  onDropCourse,
  onSignOut,
}: ScholarPortalModalProps) {
  if (!open) return null;

  const totalCredits = enrollments.reduce((sum, item) => sum + item.credits, 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scholar Portal"
    >
      <div className="bg-[#ffffff] rounded-xl max-w-3xl w-full max-h-[88vh] overflow-hidden shadow-2xl border border-[#c6c6ca]/40 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-[#1a1c1f] text-white flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#ffe088] font-medium">
              Firebase Scholar Account
            </p>
            <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold mt-0.5">
              {activeScholar.name}
            </h2>
            <p className="text-sm text-[#c6c6ca]">{activeScholar.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await onSignOut();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#fed65b]" />
              <span>Sign Out</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#c6c6ca] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-8">
          <div className="bg-[#f1f4f9] rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#735c00] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#181c20]">
                  Active University Session
                </p>
                <p className="text-xs text-[#45474a]">
                  Your course enrollments and faculty inquiries are synced to Cloud Firestore.
                </p>
              </div>
            </div>
          </div>

          {/* Enrolled Courses */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#735c00]" />
                <span>Enrolled Courses</span>
              </h3>
              <span className="text-sm text-[#45474a] tabular-nums">
                {enrollments.length} courses · {totalCredits} credits
              </span>
            </div>

            {enrollments.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#f7f9ff] border border-[#c6c6ca]/40 text-sm text-[#45474a]">
                No active course enrollments yet. Explore the course catalog on the Home page to enroll.
              </div>
            ) : (
              <div className="divide-y divide-[#ebeef3] border border-[#ebeef3] rounded-xl overflow-hidden">
                {enrollments.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs text-[#735c00] font-medium">
                        {item.code} · {item.department} · {item.credits} Credits
                      </p>
                      <p className="text-base font-semibold text-[#181c20] mt-0.5">{item.title}</p>
                      <p className="text-xs text-[#45474a] mt-1">
                        {item.instructor} · {item.schedule}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDropCourse(item.course_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c6c6ca] text-xs font-medium text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors self-start sm:self-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Drop Course</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Official College Notices */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-['Newsreader',Georgia,serif] font-semibold text-[#181c20] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#735c00]" />
                <span>Official College Notices</span>
              </h3>
              <span className="text-sm text-[#45474a] tabular-nums">
                {notices.length} active
              </span>
            </div>

            {notices.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#f7f9ff] border border-[#c6c6ca]/40 text-sm text-[#45474a]">
                No active college notices at this time.
              </div>
            ) : (
              <div className="divide-y divide-[#ebeef3] border border-[#ebeef3] rounded-xl overflow-hidden">
                {notices.slice(0, 4).map((notice) => (
                  <div key={notice.docId} className="p-4 bg-white">
                    <p className="text-xs text-[#735c00] font-medium">
                      {notice.category} · {notice.audience}
                      {notice.isPinned ? ' · Pinned' : ''}
                    </p>
                    <p className="text-base font-semibold text-[#181c20] mt-0.5">{notice.title}</p>
                    <p className="text-xs text-[#45474a] mt-1 leading-relaxed">{notice.body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
