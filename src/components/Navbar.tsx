import { useState } from 'react';
import { BookOpen, Download, Lock, LogIn, Menu, X } from 'lucide-react';
import type { PagePath } from '../types';

interface NavbarProps {
  activePage: PagePath;
  onNavigate: (page: PagePath) => void;
  isSignedIn: boolean;
  isAdmin: boolean;
  scholarName: string;
  enrollmentCount: number;
  onOpenPortal: () => void;
  onOpenAuth: () => void;
  onDownloadSite: () => void;
}

const NAV_ITEMS: Array<{ path: PagePath; label: string; protected?: boolean; adminOnly?: boolean }> = [
  { path: 'home', label: 'Home' },
  { path: 'admin', label: 'Admin Portal', protected: true, adminOnly: true },
  { path: 'teachers', label: 'Teachers', protected: true },
  { path: 'students', label: 'Students' },
  { path: 'academic-calendar', label: 'Academic Calendar' },
];

export function Navbar({
  activePage,
  onNavigate,
  isSignedIn,
  isAdmin,
  scholarName,
  enrollmentCount,
  onOpenPortal,
  onOpenAuth,
  onDownloadSite,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: PagePath) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#f7f9ff]/90 backdrop-blur-xl border-b border-[#c6c6ca]/40">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#735c00] rounded-lg py-1 cursor-pointer"
        >
          <span className="w-9 h-9 rounded-lg bg-[#1a1c1f] text-[#fed65b] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3L3 7.5L12 12L21 7.5L12 3Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 10.5V16.2C6.5 17.8 8.9 19.5 12 19.5C15.1 19.5 17.5 17.8 17.5 16.2V10.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="text-[21px] font-bold tracking-tight text-[#181c20] font-['Newsreader',Georgia,serif]">
            Excellence University
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.path;
            const showLock = item.adminOnly ? !isAdmin : Boolean(item.protected && !isSignedIn);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`text-sm whitespace-nowrap shrink-0 transition-colors px-3 py-1.5 rounded-lg cursor-pointer inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#fed65b] text-[#745c00] font-semibold'
                    : 'text-[#45474a] hover:text-[#181c20] hover:bg-[#ebeef3]'
                }`}
              >
                <span>{item.label}</span>
                {showLock && <Lock className="w-3 h-3 text-[#76777b]" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onDownloadSite}
            title="Download full offline website (.html) to open in Chrome"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#c6c6ca] bg-white text-[#181c20] text-xs font-semibold hover:bg-[#ebeef3] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#735c00]" />
            <span>Download HTML</span>
          </button>

          {isSignedIn ? (
            <button
              type="button"
              onClick={onOpenPortal}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a1c1f] text-white text-sm font-medium hover:bg-[#735c00] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#fed65b]" />
              <span className="truncate max-w-[130px]">{scholarName.split(' ')[0]}'s Portal</span>
              <span className="tabular-nums text-xs text-[#fed65b] font-semibold">
                ({enrollmentCount})
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a1c1f] text-white text-sm font-medium hover:bg-[#735c00] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#fed65b]" />
              <span>Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg text-[#181c20] hover:bg-[#ebeef3] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#f7f9ff] border-t border-[#c6c6ca]/40 px-6 py-4 space-y-2 shadow-lg">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.path;
            const showLock = item.adminOnly ? !isAdmin : Boolean(item.protected && !isSignedIn);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                  isActive
                    ? 'bg-[#fed65b] text-[#745c00]'
                    : 'text-[#45474a] hover:bg-[#ebeef3] hover:text-[#181c20]'
                }`}
              >
                <span>{item.label}</span>
                {showLock && <Lock className="w-3.5 h-3.5 text-[#76777b]" />}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onDownloadSite();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#c6c6ca] bg-white text-[#181c20] text-sm font-semibold mt-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#735c00]" />
            <span>Download Full Website (.html)</span>
          </button>

          {isSignedIn ? (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPortal();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#1a1c1f] text-white text-sm font-medium mt-2"
            >
              <span>Scholar Portal ({scholarName})</span>
              <span className="text-[#fed65b] tabular-nums">{enrollmentCount} courses</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a1c1f] text-white text-sm font-medium mt-2"
            >
              <LogIn className="w-4 h-4 text-[#fed65b]" />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
