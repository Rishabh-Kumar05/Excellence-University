import {
  DAY_NAMES,
  PERIOD_TIMES,
  PERIODS,
  SEMESTER_GROUPS,
} from './timetableGenerator';
import type {
  CalendarEvent,
  CollegeNotice,
  Course,
  PortalOverview,
  SavedTimetable,
  Student,
  StudentResult,
  Teacher,
  TeacherAttendanceRecord,
} from '../types';

export interface FullSiteExportPayload {
  overview: PortalOverview | null;
  courses: Course[];
  notices: CollegeNotice[];
  teachers: Teacher[];
  teacherAttendance: TeacherAttendanceRecord[];
  savedTimetables: SavedTimetable[];
  students: Student[];
  studentResults: StudentResult[];
  calendarEvents: CalendarEvent[];
  liveUrl?: string;
}

export function buildFullWebsiteHtml(data: FullSiteExportPayload): string {
  const initialState = {
    overview: data.overview || {
      activeStudentsCount: 15000,
      facultyCount: 256,
      coursesCount: data.courses.length,
      enrollmentsCount: 0,
      appointmentsCount: 0,
      upcomingEventsCount: data.calendarEvents.length,
      placementRate: '98%',
      globalPartners: '40+',
    },
    courses: data.courses,
    notices: data.notices,
    teachers: data.teachers,
    teacherAttendance: data.teacherAttendance,
    savedTimetables: data.savedTimetables,
    students: data.students,
    studentResults: data.studentResults,
    calendarEvents: data.calendarEvents,
    liveUrl: data.liveUrl || '',
    exportedAt: new Date().toISOString(),
    meta: {
      periods: PERIODS,
      dayNames: [...DAY_NAMES],
      periodTimes: [...PERIOD_TIMES],
      semesterGroups: SEMESTER_GROUPS,
    },
  };

  const payloadJson = JSON.stringify(initialState).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Excellence University — Academic Portal (Full Offline Edition)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #f7f9ff;
      --surface: #ffffff;
      --surface-soft: #f1f4f9;
      --surface-muted: #ebeef3;
      --ink: #181c20;
      --muted: #45474a;
      --subtle: #76777b;
      --dark: #1a1c1f;
      --gold: #fed65b;
      --gold-hover: #e9c349;
      --gold-ink: #735c00;
      --gold-ink-deep: #745c00;
      --border: #dfe3ea;
      --green-bg: #dcfce7;
      --green-ink: #166534;
      --red-bg: #ffdad6;
      --red-ink: #93000a;
      --amber-bg: #fef3c7;
      --amber-ink: #92400e;
      --blue-bg: #dbeafe;
      --blue-ink: #1e40af;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4, .serif {
      font-family: 'Newsreader', Georgia, 'Times New Roman', serif;
    }
    a { color: inherit; text-decoration: none; }
    button, input, select, textarea { font-family: inherit; }
    .container {
      max-width: 1240px;
      margin: 0 auto;
      padding-left: 24px;
      padding-right: 24px;
    }
    /* Navbar */
    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(247, 249, 255, 0.94);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(198, 198, 202, 0.45);
    }
    .topbar-inner {
      height: 76px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 11px;
      cursor: pointer;
      border: none;
      background: transparent;
      padding: 0;
      color: var(--ink);
    }
    .brand-mark {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--dark);
      color: var(--gold);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .brand-title {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 21px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .nav-btn {
      border: none;
      background: transparent;
      color: var(--muted);
      font-size: 13.5px;
      font-weight: 500;
      padding: 7px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .nav-btn:hover { background: var(--surface-muted); color: var(--ink); }
    .nav-btn.active {
      background: var(--gold);
      color: var(--gold-ink-deep);
      font-weight: 700;
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    /* Buttons & Badges */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border-radius: 8px;
      padding: 9px 16px;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .btn-sm { padding: 6px 11px; font-size: 12px; }
    .btn-dark { background: var(--dark); color: #ffffff; }
    .btn-dark:hover { background: var(--gold-ink); }
    .btn-gold { background: var(--gold); color: var(--gold-ink-deep); font-weight: 700; }
    .btn-gold:hover { background: var(--gold-hover); }
    .btn-outline { background: #ffffff; color: var(--ink); border-color: #c6c6ca; }
    .btn-outline:hover { background: var(--surface-muted); }
    .btn-danger { background: var(--red-bg); color: var(--red-ink); }
    .btn-danger:hover { filter: brightness(0.95); }
    .btn-ghost-light { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.22); }
    .btn-ghost-light:hover { background: rgba(255,255,255,0.18); }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-gold { background: rgba(254, 214, 91, 0.28); color: var(--gold-ink); }
    .badge-green { background: var(--green-bg); color: var(--green-ink); }
    .badge-red { background: var(--red-bg); color: var(--red-ink); }
    .badge-amber { background: var(--amber-bg); color: var(--amber-ink); }
    .badge-blue { background: var(--blue-bg); color: var(--blue-ink); }
    .badge-gray { background: var(--surface-muted); color: var(--muted); }

    /* Hero & Banners */
    .hero {
      background: var(--dark);
      color: #ffffff;
      padding: 64px 0 88px;
      position: relative;
      overflow: hidden;
    }
    .hero-grid {
      display: grid;
      grid-template-columns: 1.35fr 0.95fr;
      gap: 40px;
      align-items: center;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #ffe088;
      margin: 0 0 12px;
    }
    .hero h1 {
      font-size: clamp(32px, 4.2vw, 48px);
      line-height: 1.1;
      margin: 0 0 16px;
      font-weight: 600;
    }
    .hero p.lead {
      font-size: 16.5px;
      color: #c6c6ca;
      margin: 0 0 24px;
      max-width: 600px;
    }
    .hero-card {
      background: linear-gradient(145deg, #24272c, #131518);
      border: 1px solid rgba(254, 214, 91, 0.28);
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
    }
    .page-banner {
      background: var(--dark);
      color: #ffffff;
      padding: 40px 0;
    }
    .page-banner-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .page-banner h1 { font-size: 34px; margin: 0 0 6px; }
    .page-banner p { margin: 0; color: #c6c6ca; font-size: 15px; max-width: 660px; }

    /* Cards & Layout */
    .quick-cards {
      margin-top: -42px;
      position: relative;
      z-index: 10;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 20px;
      margin-bottom: 48px;
    }
    .portal-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      text-align: left;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(24, 28, 32, 0.06);
      transition: transform 0.18s, box-shadow 0.18s;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .portal-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 26px rgba(24, 28, 32, 0.1);
    }
    .portal-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(254, 214, 91, 0.25);
      color: var(--gold-ink-deep);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      margin-bottom: 16px;
    }
    .portal-card h3 { font-size: 21px; margin: 0 0 8px; }
    .portal-card p { font-size: 13.5px; color: var(--muted); margin: 0 0 16px; }
    .portal-link { font-size: 13px; font-weight: 700; color: var(--gold-ink); }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px;
      box-shadow: 0 2px 10px rgba(24, 28, 32, 0.03);
    }
    .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }

    /* Tabs */
    .tabs-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 6px;
      background: var(--surface-muted);
      border-radius: 10px;
      margin-bottom: 24px;
    }
    .tab-btn {
      border: none;
      background: transparent;
      padding: 8px 14px;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
    }
    .tab-btn.active {
      background: #ffffff;
      color: var(--ink);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    /* Forms */
    .field { margin-bottom: 12px; }
    .field label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 5px;
    }
    .input, .select, .textarea {
      width: 100%;
      padding: 9px 12px;
      border-radius: 8px;
      border: 1px solid #c6c6ca;
      background: #ffffff;
      color: var(--ink);
      font-size: 13.5px;
    }
    .input:focus, .select:focus, .textarea:focus {
      outline: 2px solid var(--gold-ink);
      border-color: var(--gold-ink);
    }

    /* Tables */
    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: #ffffff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    thead tr {
      background: var(--dark);
      color: #ffffff;
      font-size: 12px;
    }
    th, td {
      padding: 11px 13px;
      border-bottom: 1px solid var(--border);
      border-left: 1px solid var(--border);
      vertical-align: top;
    }
    th:first-child, td:first-child { border-left: none; }
    tbody th { background: var(--surface-soft); font-weight: 600; }

    /* Calendar Grid */
    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 6px;
    }
    .cal-head {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
      padding: 6px 0;
    }
    .cal-cell {
      min-height: 76px;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 6px;
      background: #ffffff;
      font-size: 11.5px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cal-cell.empty { background: var(--surface-soft); border-color: transparent; }
    .cal-day { font-weight: 700; font-size: 12px; }
    .cal-pill {
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Alert & Modal */
    .alert {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13.5px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .alert-success { background: var(--green-bg); color: var(--green-ink); }
    .alert-error { background: var(--red-bg); color: var(--red-ink); }
    .alert-info { background: rgba(254, 214, 91, 0.25); color: var(--gold-ink-deep); }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 100;
    }
    .modal-box {
      background: #ffffff;
      border-radius: 14px;
      max-width: 560px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
    }

    .stats-band {
      background: var(--surface-soft);
      padding: 48px 0;
      margin: 48px 0 0;
      border-top: 1px solid var(--border);
    }
    .stat-num {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 40px;
      font-weight: 600;
      color: var(--gold-ink);
      margin: 0;
    }
    .stat-label { font-size: 13px; color: var(--muted); margin: 4px 0 0; font-weight: 500; }

    footer {
      background: var(--surface-soft);
      border-top: 1px solid var(--border);
      padding: 28px 0;
      margin-top: 48px;
      font-size: 13px;
      color: var(--muted);
    }
    .footer-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    @media (max-width: 960px) {
      .hero-grid { grid-template-columns: 1fr; }
      .quick-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .quick-cards, .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
      .cal-cell { min-height: 54px; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="container topbar-inner">
      <button type="button" class="brand" onclick="setPage('home')">
        <span class="brand-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3L3 7.5L12 12L21 7.5L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
            <path d="M6.5 10.5V16.2C6.5 17.8 8.9 19.5 12 19.5C15.1 19.5 17.5 17.8 17.5 16.2V10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </span>
        <span class="brand-title">Excellence University</span>
      </button>

      <nav class="nav-links" id="nav-links"></nav>

      <div class="topbar-actions">
        <button type="button" class="btn btn-outline btn-sm" onclick="exportCurrentSnapshot()">Download Updated HTML</button>
        <span id="live-link-slot"></span>
      </div>
    </div>
  </header>

  <main id="app-root"></main>

  <footer>
    <div class="container footer-inner">
      <p style="margin:0;">© 2024 Excellence University · Standalone Offline &amp; Live Academic Portal (Changes auto-saved locally in browser)</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
        <button type="button" class="nav-btn" onclick="setPage('home')">Home</button>
        <button type="button" class="nav-btn" onclick="setPage('admin')">Admin Portal</button>
        <button type="button" class="nav-btn" onclick="setPage('teachers')">Teachers</button>
        <button type="button" class="nav-btn" onclick="setPage('students')">Students</button>
        <button type="button" class="nav-btn" onclick="setPage('calendar')">Academic Calendar</button>
        <button type="button" class="btn btn-outline btn-sm" onclick="resetOfflineData()">Reset Snapshot</button>
      </div>
    </div>
  </footer>

  <div id="modal-root"></div>

  <script id="eu-initial-data" type="application/json">${payloadJson}</script>
  <script>
    const INITIAL_DATA = JSON.parse(document.getElementById('eu-initial-data').textContent);
    const STORAGE_KEY = 'excellence_university_offline_v1';
    const ADMIN_EMAIL = 'hey.demouser2026@gmail.com';
    const ADMIN_PASS = 'admin2026@';

    function loadPersistedState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.courses) && Array.isArray(parsed.teachers)) {
            return parsed;
          }
        }
      } catch (e) {}
      return JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    let STATE = loadPersistedState();
    let UI = {
      page: 'home',
      adminAuthed: false,
      adminTab: 'timetable',
      studentTab: 'notices',
      courseDept: 'All',
      courseSearch: '',
      showAllCourses: false,
      feedback: null,
      ttTitle: 'Master University Timetable (48 Sections)',
      ttTeachers: 48,
      ttSections: 48,
      ttRooms: 48,
      ttDays: 5,
      ttGroups: Array.from({ length: 48 }, function(_, i) { return Math.floor(i / 6) % 8; }),
      ttGenerated: null,
      ttSelectedSection: 0,
      studentSelectedTtIdx: 0,
      studentSelectedSection: 0,
      studentResultSearch: '',
      selectedTeacherId: (STATE.teachers[0] && STATE.teachers[0].id) || 1,
      attDate: new Date().toISOString().slice(0, 10),
      calYear: new Date().getFullYear(),
      calMonth: new Date().getMonth(),
      tCalYear: new Date().getFullYear(),
      tCalMonth: new Date().getMonth(),
    };

    if (STATE.savedTimetables && STATE.savedTimetables.length > 0) {
      const first = STATE.savedTimetables[0];
      UI.ttTitle = first.title;
      UI.ttTeachers = first.teachersCount;
      UI.ttSections = first.sectionsCount;
      UI.ttRooms = first.roomsCount;
      UI.ttDays = first.daysCount;
      UI.ttGroups = first.groups.slice();
      UI.ttGenerated = {
        ok: true,
        slots: first.slots,
        groups: first.groups,
        sectionsCount: first.sectionsCount,
        teachersCount: first.teachersCount,
        roomsCount: first.roomsCount,
        daysCount: first.daysCount,
      };
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
      } catch (e) {}
    }

    function resetOfflineData() {
      STATE = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveState();
      UI.feedback = { type: 'info', text: 'Restored original downloaded university snapshot.' };
      render();
    }

    function esc(v) {
      return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
      });
    }

    function setPage(p) {
      UI.page = p;
      UI.feedback = null;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function setAdminTab(t) {
      UI.adminTab = t;
      UI.feedback = null;
      render();
    }

    function setStudentTab(t) {
      UI.studentTab = t;
      render();
    }

    function showFeedback(type, text) {
      UI.feedback = { type: type, text: text };
      render();
    }

    function clearFeedback() {
      UI.feedback = null;
      render();
    }

    function getEffectiveGroups() {
      const base = INITIAL_DATA.meta.semesterGroups.map(function(g) {
        return { name: g.name, label: g.label, courses: g.courses.slice() };
      });
      const customTitles = (STATE.courses || []).filter(function(c) { return c.isCustom; }).map(function(c) { return c.title; });
      customTitles.forEach(function(title, idx) {
        const gIdx = Math.floor(idx / 6) % base.length;
        const sIdx = idx % 6;
        if (base[gIdx].courses.indexOf(title) === -1) {
          base[gIdx].courses[sIdx] = title;
        }
      });
      return base;
    }

    function shuffleArr(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
      return a;
    }

    function runGenerateTimetable() {
      const T = Math.max(1, Math.min(300, Number(UI.ttTeachers) || 48));
      const S = Math.max(1, Math.min(100, Number(UI.ttSections) || 48));
      const R = Math.max(1, Math.min(300, Number(UI.ttRooms) || 48));
      const D = Math.max(1, Math.min(7, Number(UI.ttDays) || 5));
      const P = 6;
      const numBlocks = Math.ceil(S / P);
      const neededT = numBlocks * P;
      const groups = [];
      for (let i = 0; i < S; i++) {
        groups.push(UI.ttGroups[i] != null ? UI.ttGroups[i] : Math.floor(i / P) % 8);
      }

      if (R < S) {
        showFeedback('error', 'Need at least ' + S + ' rooms for ' + S + ' parallel sections.');
        return;
      }
      if (T < neededT) {
        showFeedback('error', 'Sections 1-' + S + ' require at least ' + neededT + ' teachers (6 dedicated teachers per 6-section semester block).');
        return;
      }

      const effGroups = getEffectiveGroups();
      const teacherPool = Array.from({ length: T }, function(_, idx) {
        const real = (STATE.teachers || [])[idx];
        return {
          idx: idx,
          id: real ? real.id : (1001 + idx),
          name: real ? real.name : ('Teacher ' + (idx + 1)),
          preferred: real && real.assigned_course ? String(real.assigned_course).trim().toLowerCase() : '',
        };
      });

      const blockMaps = [];
      for (let b = 0; b < numBlocks; b++) {
        const sStart = b * P;
        const gIdx = groups[sStart] % effGroups.length;
        const blockTeachers = teacherPool.slice(b * P, (b + 1) * P);
        const used = {};
        const assigned = new Array(P).fill(null);

        for (let pos = 0; pos < P; pos++) {
          const cId = gIdx * P + pos;
          const cName = (effGroups[gIdx].courses[pos] || ('Course ' + (cId + 1))).toLowerCase();
          for (let tl = 0; tl < blockTeachers.length; tl++) {
            if (used[tl]) continue;
            if (blockTeachers[tl].preferred && blockTeachers[tl].preferred === cName) {
              used[tl] = true;
              assigned[pos] = { courseId: cId, courseName: effGroups[gIdx].courses[pos], teacher: blockTeachers[tl] };
              break;
            }
          }
        }
        let cursor = 0;
        for (let pos = 0; pos < P; pos++) {
          if (assigned[pos]) continue;
          while (used[cursor] && cursor < blockTeachers.length) cursor++;
          used[cursor] = true;
          const cId = gIdx * P + pos;
          assigned[pos] = { courseId: cId, courseName: effGroups[gIdx].courses[pos], teacher: blockTeachers[cursor] };
          cursor++;
        }
        blockMaps.push(assigned);
      }

      const slots = [];
      for (let d = 0; d < D; d++) {
        for (let b = 0; b < numBlocks; b++) {
          const sStart = b * P;
          const sEnd = Math.min(sStart + P, S);
          const perm = shuffleArr([0, 1, 2, 3, 4, 5]);
          const shifts = shuffleArr([0, 1, 2, 3, 4, 5]);
          const bMap = blockMaps[b];
          for (let s = sStart; s < sEnd; s++) {
            const shift = shifts[s - sStart];
            for (let p = 0; p < P; p++) {
              const entry = bMap[perm[(p + shift) % P]];
              slots.push({
                d: d,
                p: p,
                s: s,
                courseId: entry.courseId,
                courseName: entry.courseName,
                teacherIdx: entry.teacher.idx,
                teacherId: entry.teacher.id,
                teacherName: entry.teacher.name,
                roomNumber: ((s + p) % R) + 1,
              });
            }
          }
        }
      }

      UI.ttTeachers = T;
      UI.ttSections = S;
      UI.ttRooms = R;
      UI.ttDays = D;
      UI.ttGroups = groups;
      UI.ttSelectedSection = 0;
      UI.ttGenerated = {
        ok: true,
        slots: slots,
        groups: groups,
        sectionsCount: S,
        teachersCount: T,
        roomsCount: R,
        daysCount: D,
      };
      showFeedback('success', 'Generated ' + S + '-section conflict-free timetable (' + slots.length + ' slots, 0 clashes).');
    }

    function saveGeneratedTt() {
      if (!UI.ttGenerated) return;
      const item = {
        docId: 'offline_tt_' + Date.now(),
        title: UI.ttTitle || 'Master Timetable',
        teachersCount: UI.ttGenerated.teachersCount,
        sectionsCount: UI.ttGenerated.sectionsCount,
        roomsCount: UI.ttGenerated.roomsCount,
        daysCount: UI.ttGenerated.daysCount,
        groups: UI.ttGenerated.groups.slice(),
        slots: UI.ttGenerated.slots.slice(),
        createdAt: new Date().toISOString(),
      };
      STATE.savedTimetables = [item].concat(STATE.savedTimetables || []);
      saveState();
      showFeedback('success', 'Saved timetable "' + item.title + '" locally. Students can now view it read-only in the Student Portal.');
    }

    function deleteSavedTt(docId) {
      STATE.savedTimetables = (STATE.savedTimetables || []).filter(function(t) { return t.docId !== docId; });
      saveState();
      showFeedback('info', 'Removed saved timetable.');
    }

    function exportCurrentSnapshot() {
      const updatedPayload = Object.assign({}, INITIAL_DATA, STATE, { exportedAt: new Date().toISOString() });
      const clone = document.documentElement.cloneNode(true);
      const dataEl = clone.querySelector('#eu-initial-data');
      if (dataEl) {
        dataEl.textContent = JSON.stringify(updatedPayload).replace(/</g, '\\\\u003c');
      }
      const appRoot = clone.querySelector('#app-root');
      if (appRoot) appRoot.innerHTML = '';
      const modalRoot = clone.querySelector('#modal-root');
      if (modalRoot) modalRoot.innerHTML = '';
      const blob = new Blob(['<!doctype html>\\n' + clone.outerHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'excellence-university-portal.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }

    function scrollToCourses() {
      var el = document.getElementById('courses-sec');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    function loadSavedTtById(docId) {
      var found = (STATE.savedTimetables || []).find(function(x) { return x.docId === docId; });
      if (!found) return;
      UI.ttGenerated = found;
      UI.ttSelectedSection = 0;
      render();
    }

    function toggleEnrollCourse(courseId) {
      STATE.courses = (STATE.courses || []).map(function(c) {
        if (c.id !== courseId) return c;
        const enrolled = !c.enrolled;
        return Object.assign({}, c, {
          enrolled: enrolled,
          seats_taken: Math.max(0, c.seats_taken + (enrolled ? 1 : -1)),
        });
      });
      saveState();
      render();
    }

    function openSyllabusModal(courseId) {
      const c = (STATE.courses || []).find(function(x) { return x.id === courseId; });
      if (!c) return;
      document.getElementById('modal-root').innerHTML =
        '<div class="modal-backdrop" onclick="if(event.target===this)closeModal()">' +
        '<div class="modal-box">' +
        '<p class="eyebrow" style="color:var(--gold-ink);margin-bottom:6px;">' + esc(c.code) + ' · ' + esc(c.department) + '</p>' +
        '<h2 style="margin:0 0 12px;font-size:26px;">' + esc(c.title) + '</h2>' +
        '<div style="background:var(--surface-soft);padding:14px;border-radius:10px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;margin-bottom:14px;">' +
        '<div><div style="color:var(--muted);font-size:11px;">Instructor</div><strong>' + esc(c.instructor) + '</strong></div>' +
        '<div><div style="color:var(--muted);font-size:11px;">Schedule</div><strong>' + esc(c.schedule) + '</strong></div>' +
        '<div><div style="color:var(--muted);font-size:11px;">Duration &amp; Credits</div><strong>' + esc(c.duration) + ' · ' + c.credits + ' Credits</strong></div>' +
        '<div><div style="color:var(--muted);font-size:11px;">Capacity</div><strong>' + c.seats_taken + ' / ' + c.seats_total + ' Enrolled</strong></div>' +
        '</div>' +
        '<h4 style="margin:0 0 6px;font-family:inherit;font-size:13px;">Course Syllabus</h4>' +
        '<p style="font-size:13.5px;color:var(--muted);margin:0 0 18px;">' + esc(c.syllabus || c.description) + '</p>' +
        '<div style="display:flex;justify-content:flex-end;gap:10px;">' +
        '<button type="button" class="btn btn-outline" onclick="closeModal()">Close</button>' +
        '<button type="button" class="btn ' + (c.enrolled ? 'btn-gold' : 'btn-dark') + '" onclick="toggleEnrollCourse(' + c.id + ');closeModal();">' + (c.enrolled ? 'Drop Course' : 'Enroll in Course') + '</button>' +
        '</div></div></div>';
    }

    function openAddCourseModal() {
      document.getElementById('modal-root').innerHTML =
        '<div class="modal-backdrop" onclick="if(event.target===this)closeModal()">' +
        '<form class="modal-box" onsubmit="submitHomeCourse(event)">' +
        '<h2 style="margin:0 0 14px;">Publish New Course</h2>' +
        '<div class="grid-2">' +
        '<div class="field"><label>Course Code</label><input class="input" id="hc-code" required placeholder="e.g. CS-480" /></div>' +
        '<div class="field"><label>Department</label><select class="select" id="hc-dept"><option>Computer Science</option><option>Architecture</option><option>Economics</option></select></div>' +
        '</div>' +
        '<div class="field"><label>Course Title</label><input class="input" id="hc-title" required placeholder="e.g. Machine Learning Theory" /></div>' +
        '<div class="grid-2">' +
        '<div class="field"><label>Instructor</label><input class="input" id="hc-inst" required placeholder="Prof. S. Verma" /></div>' +
        '<div class="field"><label>Credits</label><input class="input" id="hc-cred" type="number" min="1" max="6" value="4" /></div>' +
        '</div>' +
        '<div class="field"><label>Summary</label><textarea class="textarea" id="hc-desc" rows="2" required placeholder="Brief academic overview..."></textarea></div>' +
        '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:12px;">' +
        '<button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-dark">Publish Course</button>' +
        '</div></form></div>';
    }

    function closeModal() {
      document.getElementById('modal-root').innerHTML = '';
    }

    function submitHomeCourse(e) {
      e.preventDefault();
      const newCourse = {
        id: Date.now(),
        docId: 'offline_course_' + Date.now(),
        isCustom: true,
        code: document.getElementById('hc-code').value.trim(),
        title: document.getElementById('hc-title').value.trim(),
        department: document.getElementById('hc-dept').value,
        duration: '12 Weeks',
        rating: 4.9,
        review_count: 1,
        instructor: document.getElementById('hc-inst').value.trim(),
        description: document.getElementById('hc-desc').value.trim(),
        image_key: 'cs',
        credits: Number(document.getElementById('hc-cred').value) || 4,
        seats_total: 40,
        seats_taken: 0,
        schedule: 'Mon / Wed · 10:00 AM',
        syllabus: 'Core lectures, readings, and capstone research.',
        featured: 1,
        enrolled: false,
      };
      STATE.courses = [newCourse].concat(STATE.courses || []);
      saveState();
      closeModal();
      showFeedback('success', 'Added course "' + newCourse.title + '".');
    }

    function submitAdminLogin(e) {
      e.preventDefault();
      const em = document.getElementById('admin-login-email').value.trim().toLowerCase();
      const pw = document.getElementById('admin-login-pass').value;
      if (em === ADMIN_EMAIL && pw === ADMIN_PASS) {
        UI.adminAuthed = true;
        UI.feedback = null;
        render();
      } else {
        showFeedback('error', 'Incorrect admin credentials. Use ' + ADMIN_EMAIL + ' / ' + ADMIN_PASS);
      }
    }

    function submitNotice(e) {
      e.preventDefault();
      const item = {
        docId: 'offline_notice_' + Date.now(),
        title: document.getElementById('n-title').value.trim(),
        category: document.getElementById('n-cat').value,
        audience: document.getElementById('n-aud').value,
        body: document.getElementById('n-body').value.trim(),
        publishedBy: ADMIN_EMAIL,
        isPinned: document.getElementById('n-pin').checked,
        isActive: true,
        expiresAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      STATE.notices = [item].concat(STATE.notices || []);
      saveState();
      showFeedback('success', 'Published notice "' + item.title + '" to ' + item.audience + '.');
    }

    function deleteNotice(docId) {
      STATE.notices = (STATE.notices || []).filter(function(n) { return n.docId !== docId; });
      saveState();
      showFeedback('info', 'Notice deleted.');
    }

    function submitTeacher(e) {
      e.preventDefault();
      const name = document.getElementById('t-name').value.trim();
      const dept = document.getElementById('t-dept').value;
      const email = document.getElementById('t-email').value.trim();
      const room = document.getElementById('t-room').value.trim() || 'Block A-101';
      const course = document.getElementById('t-course').value.trim();
      if (!name) return;
      const newT = {
        id: ((STATE.teachers || []).reduce(function(m, t) { return Math.max(m, t.id || 0); }, 0)) + 1,
        docId: 'offline_teacher_' + Date.now(),
        isCustom: true,
        name: name,
        title: 'Faculty Member',
        department: dept,
        email: email || (name.toLowerCase().replace(/[^a-z0-9]+/g, '.') + '@excellence.edu'),
        office_room: room,
        office_hours: 'Mon & Wed · 2:00 PM – 4:00 PM',
        specialization: course || 'Core Curriculum',
        assigned_course: course,
        publications_count: 0,
        bio: dept + ' Faculty Member.',
      };
      STATE.teachers = (STATE.teachers || []).concat([newT]);
      saveState();
      showFeedback('success', 'Saved teacher "' + name + '" (Teacher #' + STATE.teachers.length + ').');
    }

    function markTeacherAtt(teacherId, status) {
      const t = (STATE.teachers || []).find(function(x) { return x.id === teacherId; });
      if (!t) return;
      const dateIso = UI.attDate;
      const list = (STATE.teacherAttendance || []).filter(function(r) {
        return !(r.teacherId === teacherId && r.date === dateIso);
      });
      list.unshift({
        docId: 'att_' + teacherId + '_' + dateIso,
        teacherId: teacherId,
        teacherName: t.name,
        department: t.department,
        date: dateIso,
        status: status,
        notes: '',
        markedBy: ADMIN_EMAIL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      STATE.teacherAttendance = list;
      saveState();
      showFeedback('success', 'Marked ' + t.name + ' as ' + status + ' on ' + dateIso + '.');
    }

    function submitCalEvent(e) {
      e.preventDefault();
      const ev = {
        id: Date.now(),
        docId: 'offline_cal_' + Date.now(),
        title: document.getElementById('cal-title').value.trim(),
        category: document.getElementById('cal-cat').value,
        event_date: document.getElementById('cal-date').value,
        end_date: document.getElementById('cal-end').value || null,
        location: document.getElementById('cal-loc').value.trim() || 'Main Campus',
        semester: 'Fall 2024',
        description: document.getElementById('cal-desc').value.trim(),
        is_custom: 1,
      };
      STATE.calendarEvents = [ev].concat(STATE.calendarEvents || []);
      saveState();
      showFeedback('success', 'Added ' + ev.category + ' "' + ev.title + '" to Academic Calendar.');
    }

    function deleteCalEvent(id) {
      STATE.calendarEvents = (STATE.calendarEvents || []).filter(function(ev) { return ev.id !== id; });
      saveState();
      showFeedback('info', 'Removed calendar entry.');
    }

    function submitSetupStudent(e) {
      e.preventDefault();
      const stu = {
        id: Date.now(),
        docId: 'offline_stu_' + Date.now(),
        isCustom: true,
        name: document.getElementById('s-name').value.trim(),
        student_code: document.getElementById('s-code').value.trim(),
        major: document.getElementById('s-major').value.trim(),
        year_level: document.getElementById('s-year').value.trim() || 'Year 1',
        email: '',
        gpa: 0,
        honors: 'Enrolled',
        club_name: '',
        created_at: new Date().toISOString(),
      };
      STATE.students = [stu].concat(STATE.students || []);
      saveState();
      showFeedback('success', 'Added student "' + stu.name + '" (' + stu.student_code + ').');
    }

    function submitSetupResult(e) {
      e.preventDefault();
      const marks = Number(document.getElementById('r-marks').value) || 0;
      const maxMarks = Number(document.getElementById('r-max').value) || 100;
      const pct = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
      const grade = pct >= 90 ? 'O' : pct >= 80 ? 'E' : pct >= 70 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F';
      const item = {
        docId: 'offline_res_' + Date.now(),
        studentName: document.getElementById('r-name').value.trim(),
        studentCode: document.getElementById('r-code').value.trim() || 'EU-2024',
        courseName: document.getElementById('r-course').value.trim() || 'B.Tech CSE',
        subjectName: document.getElementById('r-subj').value.trim(),
        marks: marks,
        maxMarks: maxMarks,
        grade: grade,
        semester: document.getElementById('r-sem').value.trim() || 'Semester 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      STATE.studentResults = [item].concat(STATE.studentResults || []);
      saveState();
      showFeedback('success', 'Saved result for ' + item.studentName + ' (' + item.grade + ').');
    }

    function renderTimetableTable(tt, sectionIdx) {
      if (!tt || !tt.slots || tt.slots.length === 0) {
        return '<div class="card"><p style="margin:0;color:var(--muted);">No timetable generated or saved yet.</p></div>';
      }
      const P = 6;
      const days = INITIAL_DATA.meta.dayNames.slice(0, tt.daysCount);
      const times = INITIAL_DATA.meta.periodTimes;
      let html = '<div class="table-wrap"><table><thead><tr><th style="width:110px;">Period</th>';
      days.forEach(function(dn) { html += '<th>' + esc(dn) + '</th>'; });
      html += '</tr></thead><tbody>';
      for (let p = 0; p < P; p++) {
        html += '<tr><th><div>Period ' + (p + 1) + '</div><div style="font-size:11px;font-weight:400;color:var(--muted);">' + esc(times[p] || '') + '</div></th>';
        for (let d = 0; d < tt.daysCount; d++) {
          const cell = tt.slots.find(function(sl) { return sl.s === sectionIdx && sl.d === d && sl.p === p; });
          if (cell) {
            const tStr = cell.teacherName === ('Teacher ' + (cell.teacherIdx + 1)) ? cell.teacherName : ('T' + (cell.teacherIdx + 1) + ': ' + cell.teacherName);
            html += '<td><div style="font-weight:600;">' + esc(cell.courseName) + '</div><div style="font-size:11px;color:var(--muted);margin-top:3px;">' + esc(tStr) + ' · Room ' + cell.roomNumber + '</div></td>';
          } else {
            html += '<td>—</td>';
          }
        }
        html += '</tr>';
      }
      html += '</tbody></table></div>';
      return html;
    }

    function renderSectionOptions(tt, selectedIdx) {
      if (!tt) return '';
      return tt.groups.slice(0, tt.sectionsCount).map(function(g, idx) {
        const block = Math.floor(idx / 6);
        const sel = idx === selectedIdx ? ' selected' : '';
        return '<option value="' + idx + '"' + sel + '>Section ' + (idx + 1) + ' (Semester ' + (g + 1) + ' · Teachers ' + (block * 6 + 1) + '–' + ((block + 1) * 6) + ')</option>';
      }).join('');
    }

    function renderHome() {
      const courses = (STATE.courses || []).filter(function(c) {
        if (UI.courseDept !== 'All' && c.department !== UI.courseDept) return false;
        if (UI.courseSearch.trim()) {
          const q = UI.courseSearch.toLowerCase();
          return (c.title + ' ' + c.code + ' ' + c.instructor + ' ' + c.department).toLowerCase().indexOf(q) !== -1;
        }
        return true;
      });
      const shown = (UI.showAllCourses || UI.courseDept !== 'All' || UI.courseSearch.trim()) ? courses : courses.slice(0, 3);
      const notices = (STATE.notices || []).filter(function(n) { return n.isActive !== false; });

      return '' +
        '<section class="hero">' +
        '  <div class="container hero-grid">' +
        '    <div>' +
        '      <p class="eyebrow">Elite Academic Portal</p>' +
        '      <h1>Empowering College Students for Academic Excellence</h1>' +
        '      <p class="lead">Structured courses, conflict-free 48-section timetables, teacher attendance tracking, official notices, and a university calendar built for visionary scholars.</p>' +
        '      <div style="display:flex;flex-wrap:wrap;gap:10px;">' +
        '        <button type="button" class="btn btn-gold" onclick="scrollToCourses()">Explore Courses →</button>' +
        '        <button type="button" class="btn btn-ghost-light" onclick="setPage(\\'calendar\\')">View Calendar</button>' +
        '        <button type="button" class="btn btn-ghost-light" onclick="setPage(\\'admin\\')">Open Admin Portal</button>' +
        '      </div>' +
        '    </div>' +
        '    <div class="hero-card">' +
        '      <p class="eyebrow">Class of 2024 · Standalone Chrome Edition</p>' +
        '      <h2 style="margin:0 0 10px;font-size:28px;color:#fff;">Distinction in Every Step</h2>' +
        '      <p style="font-size:13.5px;color:#c6c6ca;margin:0 0 16px;">Every portal works right here in Chrome with automatic local saving—no internet connection required.</p>' +
        '      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12.5px;">' +
        '        <div style="background:rgba(255,255,255,0.06);padding:10px;border-radius:8px;"><strong>' + (STATE.courses || []).length + '</strong> Courses</div>' +
        '        <div style="background:rgba(255,255,255,0.06);padding:10px;border-radius:8px;"><strong>' + (STATE.teachers || []).length + '</strong> Faculty</div>' +
        '        <div style="background:rgba(255,255,255,0.06);padding:10px;border-radius:8px;"><strong>' + (STATE.savedTimetables || []).length + '</strong> Timetables</div>' +
        '        <div style="background:rgba(255,255,255,0.06);padding:10px;border-radius:8px;"><strong>' + (STATE.calendarEvents || []).length + '</strong> Events</div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</section>' +
        '<section class="container quick-cards">' +
        '  <button type="button" class="portal-card" onclick="setPage(\\'admin\\')"><div><div class="portal-icon">A</div><h3>Admin Portal</h3><p>Conflict-free timetables, notices, teacher attendance, calendar, and setup.</p></div><span class="portal-link">Admin Access →</span></button>' +
        '  <button type="button" class="portal-card" onclick="setPage(\\'teachers\\')"><div><div class="portal-icon">T</div><h3>Teachers</h3><p>View your monthly attendance calendar and official administrative notices.</p></div><span class="portal-link">Teacher Portal →</span></button>' +
        '  <button type="button" class="portal-card" onclick="setPage(\\'students\\')"><div><div class="portal-icon">S</div><h3>Students</h3><p>Access administrative notices, read-only class timetables, and saved results.</p></div><span class="portal-link">Student Portal →</span></button>' +
        '  <button type="button" class="portal-card" onclick="setPage(\\'calendar\\')"><div><div class="portal-icon">C</div><h3>Academic Calendar</h3><p>Official university holidays, campus notices, and important scheduled events.</p></div><span class="portal-link">View Calendar →</span></button>' +
        '</section>' +
        '<section id="courses-sec" class="container" style="margin-bottom:44px;">' +
        '  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:18px;">' +
        '    <div><p class="eyebrow" style="color:var(--gold-ink);">Curated Excellence</p><h2 style="margin:0;font-size:32px;">Featured Courses &amp; Resources</h2></div>' +
        '    <div style="display:flex;gap:10px;align-items:center;">' +
        '      <button type="button" class="btn btn-dark btn-sm" onclick="openAddCourseModal()">+ Add Course</button>' +
        '      <button type="button" class="btn btn-outline btn-sm" onclick="UI.showAllCourses=!UI.showAllCourses;render();">' + (UI.showAllCourses ? 'Show Featured Only' : 'Browse All (' + courses.length + ')') + '</button>' +
        '    </div>' +
        '  </div>' +
        '  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border);">' +
        '    <div style="display:flex;gap:6px;flex-wrap:wrap;background:var(--surface-muted);padding:4px;border-radius:8px;">' +
        ['All', 'Computer Science', 'Architecture', 'Economics'].map(function(d) {
          return '<button type="button" class="tab-btn ' + (UI.courseDept === d ? 'active' : '') + '" onclick="UI.courseDept=\\'' + d + '\\';render();">' + d + '</button>';
        }).join('') +
        '    </div>' +
        '    <input class="input" style="max-width:280px;" placeholder="Search course, code, or faculty..." value="' + esc(UI.courseSearch) + '" oninput="UI.courseSearch=this.value;render();" />' +
        '  </div>' +
        '  <div class="grid-3">' +
        shown.map(function(c) {
          return '<article class="card" style="display:flex;flex-direction:column;justify-content:space-between;">' +
            '<div>' +
            '  <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--gold-ink);font-weight:600;margin-bottom:8px;"><span>' + esc(c.department) + ' · ' + esc(c.code) + '</span><span>★ ' + Number(c.rating || 4.8).toFixed(1) + '</span></div>' +
            '  <h3 style="margin:0 0 8px;font-size:21px;">' + esc(c.title) + '</h3>' +
            '  <p style="font-size:13.5px;color:var(--muted);margin:0 0 12px;">' + esc(c.description) + '</p>' +
            '  <p style="font-size:12px;color:var(--subtle);margin:0 0 14px;">' + esc(c.duration) + ' · ' + c.credits + ' Credits · ' + Math.max(0, c.seats_total - c.seats_taken) + ' seats open</p>' +
            '</div>' +
            '<div style="padding-top:12px;border-top:1px solid var(--surface-muted);display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
            '  <span style="font-size:13px;font-weight:600;">' + esc(c.instructor) + '</span>' +
            '  <div style="display:flex;gap:6px;">' +
            '    <button type="button" class="btn btn-outline btn-sm" onclick="openSyllabusModal(' + c.id + ')">Syllabus</button>' +
            '    <button type="button" class="btn btn-sm ' + (c.enrolled ? 'btn-gold' : 'btn-dark') + '" onclick="toggleEnrollCourse(' + c.id + ')">' + (c.enrolled ? '✓ Enrolled' : 'Enroll') + '</button>' +
            '  </div>' +
            '</div></article>';
        }).join('') +
        '  </div>' +
        '</section>' +
        (notices.length ? (
          '<section class="container" style="margin-bottom:24px;">' +
          '  <p class="eyebrow" style="color:var(--gold-ink);">Campus Bulletin Board</p>' +
          '  <h2 style="margin:0 0 16px;font-size:30px;">Official College Notices</h2>' +
          '  <div class="grid-2">' +
          notices.slice(0, 4).map(function(n) {
            return '<div class="card"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:var(--gold-ink);margin-bottom:6px;"><span>' + esc(n.category) + ' · ' + esc(n.audience) + '</span>' + (n.isPinned ? '<span>Pinned</span>' : '') + '</div><h3 style="margin:0 0 8px;font-size:20px;">' + esc(n.title) + '</h3><p style="margin:0;font-size:13.5px;color:var(--muted);">' + esc(n.body) + '</p></div>';
          }).join('') +
          '  </div>' +
          '</section>'
        ) : '') +
        '<section class="stats-band"><div class="container grid-4" style="text-align:center;">' +
        '<div><p class="stat-num">' + ((STATE.overview.activeStudentsCount / 1000).toFixed(1)) + 'k+</p><p class="stat-label">Active Students</p></div>' +
        '<div><p class="stat-num">' + STATE.overview.facultyCount + '+</p><p class="stat-label">Expert Faculty</p></div>' +
        '<div><p class="stat-num">' + esc(STATE.overview.placementRate) + '</p><p class="stat-label">Placement Rate</p></div>' +
        '<div><p class="stat-num">' + esc(STATE.overview.globalPartners) + '</p><p class="stat-label">Global Partners</p></div>' +
        '</div></section>';
    }

    function renderAdmin() {
      if (!UI.adminAuthed) {
        return '<section class="page-banner"><div class="container"><p class="eyebrow">Restricted Portal</p><h1>Admin Portal Sign In</h1><p>Enter university administrator credentials to manage timetables, notices, teacher attendance, calendar, and setup data.</p></div></section>' +
          '<div class="container" style="max-width:460px;padding-top:36px;">' +
          '<form class="card" onsubmit="submitAdminLogin(event)">' +
          '<h2 style="margin:0 0 14px;">Administrator Login</h2>' +
          '<div class="field"><label>Admin Email</label><input id="admin-login-email" class="input" type="email" value="' + ADMIN_EMAIL + '" required /></div>' +
          '<div class="field"><label>Password</label><input id="admin-login-pass" class="input" type="password" placeholder="Enter admin password" required /></div>' +
          '<button type="submit" class="btn btn-dark" style="width:100%;margin-top:8px;">Sign In to Admin Portal</button>' +
          '</form></div>';
      }

      const tabs = [
        { id: 'timetable', label: 'Timetable' },
        { id: 'notices', label: 'Notices (' + (STATE.notices || []).length + ')' },
        { id: 'teachers', label: 'Teachers & Attendance (' + (STATE.teachers || []).length + ')' },
        { id: 'calendar', label: 'Academic Calendar (' + (STATE.calendarEvents || []).length + ')' },
        { id: 'setup', label: 'Setup' },
      ];

      let body = '';
      if (UI.adminTab === 'timetable') {
        const tt = UI.ttGenerated;
        body = '' +
          '<div class="card" style="margin-bottom:20px;">' +
          '  <h2 style="margin:0 0 6px;">Conflict-Free Master Timetable Generator</h2>' +
          '  <p style="font-size:13px;color:var(--muted);margin:0 0 16px;">Strict 6-section semester blocks: Sections 1–6 → Teachers 1–6, Sections 7–12 → Teachers 7–12, up to 48 sections &amp; 48 teachers with 0 clashes.</p>' +
          '  <div class="grid-4" style="margin-bottom:14px;">' +
          '    <div class="field"><label>Schedule Title</label><input class="input" value="' + esc(UI.ttTitle) + '" oninput="UI.ttTitle=this.value" /></div>' +
          '    <div class="field"><label>Teachers Count</label><input class="input" type="number" min="6" max="300" value="' + UI.ttTeachers + '" oninput="UI.ttTeachers=Number(this.value)" /></div>' +
          '    <div class="field"><label>Sections (up to 48+)</label><input class="input" type="number" min="1" max="100" value="' + UI.ttSections + '" oninput="UI.ttSections=Number(this.value)" /></div>' +
          '    <div class="field"><label>Rooms / Days</label><div style="display:flex;gap:6px;"><input class="input" type="number" min="1" max="300" value="' + UI.ttRooms + '" oninput="UI.ttRooms=Number(this.value)" /><input class="input" type="number" min="1" max="7" value="' + UI.ttDays + '" oninput="UI.ttDays=Number(this.value)" /></div></div>' +
          '  </div>' +
          '  <div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '    <button type="button" class="btn btn-gold" onclick="runGenerateTimetable()">Generate Conflict-Free Timetable</button>' +
          (tt ? '<button type="button" class="btn btn-dark" onclick="saveGeneratedTt()">Save to Student Portal</button>' : '') +
          '  </div>' +
          '</div>' +
          (tt ? (
            '<div class="card" style="margin-bottom:20px;">' +
            '  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:16px;">' +
            '    <div><span class="badge badge-green">0 Conflicts Verified</span><h3 style="margin:6px 0 0;font-size:24px;">Section Schedule Preview</h3></div>' +
            '    <div><label style="display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px;">Select Section</label><select class="select" style="min-width:300px;" onchange="UI.ttSelectedSection=Number(this.value);render();">' + renderSectionOptions(tt, UI.ttSelectedSection) + '</select></div>' +
            '  </div>' +
            renderTimetableTable(tt, UI.ttSelectedSection) +
            '</div>'
          ) : '') +
          '<div class="card"><h3 style="margin:0 0 12px;">Saved Timetables (' + (STATE.savedTimetables || []).length + ')</h3>' +
          ((STATE.savedTimetables || []).length === 0 ? '<p style="color:var(--muted);font-size:13px;margin:0;">No saved timetables yet.</p>' : (
            (STATE.savedTimetables || []).map(function(st) {
              return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);gap:10px;flex-wrap:wrap;">' +
                '<div><strong>' + esc(st.title) + '</strong><div style="font-size:12px;color:var(--muted);">' + st.sectionsCount + ' Sections · ' + st.teachersCount + ' Teachers · ' + st.daysCount + ' Days</div></div>' +
                '<div style="display:flex;gap:8px;"><button type="button" class="btn btn-outline btn-sm" onclick="loadSavedTtById(\\'' + st.docId + '\\')">Load</button><button type="button" class="btn btn-danger btn-sm" onclick="deleteSavedTt(\\'' + st.docId + '\\')">Delete</button></div>' +
                '</div>';
            }).join('')
          )) +
          '</div>';
      } else if (UI.adminTab === 'notices') {
        body = '<div class="grid-2">' +
          '<form class="card" onsubmit="submitNotice(event)">' +
          '<h3 style="margin:0 0 12px;">Publish Administrative Notice</h3>' +
          '<div class="field"><label>Title</label><input id="n-title" class="input" required placeholder="Notice subject..." /></div>' +
          '<div class="grid-2"><div class="field"><label>Category</label><select id="n-cat" class="select"><option>General</option><option>Academic</option><option>Examination</option><option>Urgent</option><option>Event</option></select></div>' +
          '<div class="field"><label>Send To</label><select id="n-aud" class="select"><option value="All Students &amp; Faculty">Both (Teachers &amp; Students)</option><option value="Teachers Only">Teachers Only</option><option value="Students Only">Students Only</option></select></div></div>' +
          '<div class="field"><label>Message</label><textarea id="n-body" class="textarea" rows="3" required placeholder="Write official details..."></textarea></div>' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:14px;"><input id="n-pin" type="checkbox" /> Pin Notice</label>' +
          '<button type="submit" class="btn btn-dark">Publish Notice</button>' +
          '</form>' +
          '<div class="card"><h3 style="margin:0 0 12px;">All Notices (' + (STATE.notices || []).length + ')</h3>' +
          (STATE.notices || []).map(function(n) {
            return '<div style="padding:12px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">' +
              '<div><div style="font-size:11px;font-weight:700;color:var(--gold-ink);">' + esc(n.category) + ' · ' + esc(n.audience) + '</div><div style="font-weight:600;">' + esc(n.title) + '</div><div style="font-size:12.5px;color:var(--muted);">' + esc(n.body) + '</div></div>' +
              '<button type="button" class="btn btn-danger btn-sm" onclick="deleteNotice(\\'' + n.docId + '\\')">Delete</button></div>';
          }).join('') +
          '</div></div>';
      } else if (UI.adminTab === 'teachers') {
        body = '<div class="grid-2">' +
          '<form class="card" onsubmit="submitTeacher(event)">' +
          '<h3 style="margin:0 0 12px;">Add Teacher to Roster</h3>' +
          '<div class="field"><label>Full Name</label><input id="t-name" class="input" required placeholder="e.g. Prof. R. Deshmukh" /></div>' +
          '<div class="grid-2"><div class="field"><label>Department</label><select id="t-dept" class="select"><option>Computer Science</option><option>Architecture</option><option>Economics</option><option>Mathematics</option><option>Physics</option></select></div>' +
          '<div class="field"><label>Assigned Course</label><input id="t-course" class="input" placeholder="e.g. Data Structures" /></div></div>' +
          '<div class="grid-2"><div class="field"><label>Email</label><input id="t-email" class="input" placeholder="faculty@excellence.edu" /></div>' +
          '<div class="field"><label>Office Room</label><input id="t-room" class="input" placeholder="e.g. Block B-204" /></div></div>' +
          '<button type="submit" class="btn btn-dark">Save Teacher</button>' +
          '</form>' +
          '<div class="card">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">' +
          '<h3 style="margin:0;">Daily Teacher Attendance</h3>' +
          '<input type="date" class="input" style="width:auto;" value="' + esc(UI.attDate) + '" onchange="UI.attDate=this.value;render();" />' +
          '</div>' +
          '<div style="max-height:420px;overflow-y:auto;">' +
          (STATE.teachers || []).map(function(t, idx) {
            const rec = (STATE.teacherAttendance || []).find(function(r) { return r.teacherId === t.id && r.date === UI.attDate; });
            return '<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
              '<div><strong>#' + (idx + 1) + ' ' + esc(t.name) + '</strong><div style="font-size:11.5px;color:var(--muted);">' + esc(t.department) + (rec ? ' · <span class="badge badge-gold">' + esc(rec.status) + '</span>' : '') + '</div></div>' +
              '<div style="display:flex;gap:4px;">' +
              '<button type="button" class="btn btn-sm ' + (rec && rec.status === 'Present' ? 'btn-gold' : 'btn-outline') + '" onclick="markTeacherAtt(' + t.id + ',\\'Present\\')">P</button>' +
              '<button type="button" class="btn btn-sm ' + (rec && rec.status === 'Absent' ? 'btn-danger' : 'btn-outline') + '" onclick="markTeacherAtt(' + t.id + ',\\'Absent\\')">A</button>' +
              '<button type="button" class="btn btn-sm ' + (rec && rec.status === 'Late' ? 'btn-gold' : 'btn-outline') + '" onclick="markTeacherAtt(' + t.id + ',\\'Late\\')">L</button>' +
              '<button type="button" class="btn btn-sm ' + (rec && rec.status === 'On Leave' ? 'btn-dark' : 'btn-outline') + '" onclick="markTeacherAtt(' + t.id + ',\\'On Leave\\')">Leave</button>' +
              '</div></div>';
          }).join('') +
          '</div></div></div>';
      } else if (UI.adminTab === 'calendar') {
        body = '<div class="grid-2">' +
          '<form class="card" onsubmit="submitCalEvent(event)">' +
          '<h3 style="margin:0 0 12px;">Add Holiday / Notice / Event</h3>' +
          '<div class="field"><label>Title</label><input id="cal-title" class="input" required placeholder="e.g. Winter Break Holiday" /></div>' +
          '<div class="grid-2"><div class="field"><label>Category</label><select id="cal-cat" class="select"><option>Holiday</option><option>Notice</option><option>Academic</option><option>Exam</option><option>Deadline</option></select></div>' +
          '<div class="field"><label>Date</label><input id="cal-date" class="input" type="date" required value="' + UI.attDate + '" /></div></div>' +
          '<div class="grid-2"><div class="field"><label>End Date (Optional)</label><input id="cal-end" class="input" type="date" /></div>' +
          '<div class="field"><label>Location</label><input id="cal-loc" class="input" placeholder="Main Auditorium" /></div></div>' +
          '<div class="field"><label>Description</label><textarea id="cal-desc" class="textarea" rows="2"></textarea></div>' +
          '<button type="submit" class="btn btn-dark">Add Calendar Entry</button>' +
          '</form>' +
          '<div class="card"><h3 style="margin:0 0 12px;">Calendar Entries (' + (STATE.calendarEvents || []).length + ')</h3>' +
          (STATE.calendarEvents || []).map(function(ev) {
            return '<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:10px;">' +
              '<div><span class="badge badge-gold">' + esc(ev.category) + '</span> <strong style="margin-left:6px;">' + esc(ev.title) + '</strong><div style="font-size:12px;color:var(--muted);">' + esc(ev.event_date) + (ev.location ? ' · ' + esc(ev.location) : '') + '</div></div>' +
              '<button type="button" class="btn btn-danger btn-sm" onclick="deleteCalEvent(' + ev.id + ')">Remove</button></div>';
          }).join('') +
          '</div></div>';
      } else {
        body = '<div class="grid-2">' +
          '<form class="card" onsubmit="submitSetupStudent(event)">' +
          '<h3 style="margin:0 0 12px;">Add Student Record</h3>' +
          '<div class="field"><label>Student Name</label><input id="s-name" class="input" required placeholder="e.g. Aarav Sharma" /></div>' +
          '<div class="grid-2"><div class="field"><label>ID Number</label><input id="s-code" class="input" required placeholder="EU-2024-101" /></div>' +
          '<div class="field"><label>Course / Major</label><input id="s-major" class="input" required placeholder="B.Tech Computer Science" /></div></div>' +
          '<div class="field"><label>Year Level</label><input id="s-year" class="input" value="Year 1" /></div>' +
          '<button type="submit" class="btn btn-dark">Save Student</button>' +
          '</form>' +
          '<form class="card" onsubmit="submitSetupResult(event)">' +
          '<h3 style="margin:0 0 12px;">Publish Student Result</h3>' +
          '<div class="grid-2"><div class="field"><label>Student Name</label><input id="r-name" class="input" required placeholder="Exact student name" /></div>' +
          '<div class="field"><label>ID Number</label><input id="r-code" class="input" placeholder="EU-2024-101" /></div></div>' +
          '<div class="grid-2"><div class="field"><label>Course</label><input id="r-course" class="input" placeholder="Computer Science" /></div>' +
          '<div class="field"><label>Subject</label><input id="r-subj" class="input" required placeholder="Data Structures" /></div></div>' +
          '<div class="grid-3"><div class="field"><label>Marks</label><input id="r-marks" class="input" type="number" required value="85" /></div>' +
          '<div class="field"><label>Max</label><input id="r-max" class="input" type="number" required value="100" /></div>' +
          '<div class="field"><label>Semester</label><input id="r-sem" class="input" value="Semester 1" /></div></div>' +
          '<button type="submit" class="btn btn-dark">Save Result</button>' +
          '</form></div>';
      }

      return '<section class="page-banner"><div class="container page-banner-row">' +
        '<div><p class="eyebrow">University Administration</p><h1>Admin Control Portal</h1><p>Manage timetables, notices, teacher attendance, academic calendar, and setup data.</p></div>' +
        '<div style="display:flex;gap:8px;align-items:center;"><span class="badge badge-gold">' + ADMIN_EMAIL + '</span><button type="button" class="btn btn-gold btn-sm" onclick="UI.adminAuthed=false;render();">Sign Out</button></div>' +
        '</div></section>' +
        '<div class="container" style="padding-top:28px;">' +
        '<div class="tabs-bar">' +
        tabs.map(function(tb) {
          return '<button type="button" class="tab-btn ' + (UI.adminTab === tb.id ? 'active' : '') + '" onclick="setAdminTab(\\'' + tb.id + '\\')">' + esc(tb.label) + '</button>';
        }).join('') +
        '</div>' + body + '</div>';
    }

    function renderTeachers() {
      const teachers = STATE.teachers || [];
      const selected = teachers.find(function(t) { return t.id === UI.selectedTeacherId; }) || teachers[0];
      const tAtt = selected ? (STATE.teacherAttendance || []).filter(function(r) { return r.teacherId === selected.id; }) : [];
      const teacherNotices = (STATE.notices || []).filter(function(n) {
        return n.isActive !== false && n.audience !== 'Students Only';
      });
      const year = UI.tCalYear;
      const month = UI.tCalMonth;
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

      let calCells = '';
      for (let i = 0; i < firstDay; i++) calCells += '<div class="cal-cell empty"></div>';
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        const rec = tAtt.find(function(r) { return r.date === iso; });
        const badgeClass = rec ? (rec.status === 'Present' ? 'badge-green' : rec.status === 'Absent' ? 'badge-red' : rec.status === 'Late' ? 'badge-amber' : 'badge-blue') : '';
        calCells += '<div class="cal-cell"><div class="cal-day">' + d + '</div>' + (rec ? '<span class="cal-pill ' + badgeClass + '">' + esc(rec.status) + '</span>' : '') + '</div>';
      }

      return '<section class="page-banner"><div class="container"><p class="eyebrow">Faculty Workspace</p><h1>Teacher Portal</h1><p>View your monthly attendance calendar and official administrative notices.</p></div></section>' +
        '<div class="container" style="padding-top:28px;"><div class="grid-2">' +
        '<div class="card">' +
        '  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">' +
        '    <h2 style="margin:0;font-size:24px;">Attendance Calendar</h2>' +
        '    <select class="select" style="width:auto;min-width:210px;" onchange="UI.selectedTeacherId=Number(this.value);render();">' +
        teachers.map(function(t) { return '<option value="' + t.id + '"' + (selected && selected.id === t.id ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') +
        '    </select>' +
        '  </div>' +
        '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
        '    <button type="button" class="btn btn-outline btn-sm" onclick="if(UI.tCalMonth===0){UI.tCalMonth=11;UI.tCalYear--;}else{UI.tCalMonth--;}render();">Prev</button>' +
        '    <strong>' + monthNames[month] + ' ' + year + '</strong>' +
        '    <button type="button" class="btn btn-outline btn-sm" onclick="if(UI.tCalMonth===11){UI.tCalMonth=0;UI.tCalYear++;}else{UI.tCalMonth++;}render();">Next</button>' +
        '  </div>' +
        '  <div class="cal-grid">' +
        ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(function(w) { return '<div class="cal-head">' + w + '</div>'; }).join('') +
        calCells +
        '  </div>' +
        '</div>' +
        '<div class="card"><h2 style="margin:0 0 14px;font-size:24px;">Notices from Admin (' + teacherNotices.length + ')</h2>' +
        (teacherNotices.length === 0 ? '<p style="color:var(--muted);">No faculty notices at this time.</p>' : teacherNotices.map(function(n) {
          return '<div style="padding:12px 0;border-bottom:1px solid var(--border);"><div style="font-size:11px;font-weight:700;color:var(--gold-ink);">' + esc(n.category) + ' · ' + esc(n.audience) + '</div><div style="font-weight:600;font-size:16px;margin:2px 0;">' + esc(n.title) + '</div><div style="font-size:13px;color:var(--muted);">' + esc(n.body) + '</div></div>';
        }).join('')) +
        '</div></div></div>';
    }

    function renderStudents() {
      const sNotices = (STATE.notices || []).filter(function(n) {
        return n.isActive !== false && n.audience !== 'Teachers Only';
      });
      const tts = STATE.savedTimetables || [];
      const activeTt = tts[UI.studentSelectedTtIdx] || tts[0] || null;
      const q = UI.studentResultSearch.trim().toLowerCase();
      const matchedResults = q
        ? (STATE.studentResults || []).filter(function(r) { return (r.studentName || '').toLowerCase().indexOf(q) !== -1; })
        : [];

      let content = '';
      if (UI.studentTab === 'notices') {
        content = '<div class="grid-2">' + (sNotices.length === 0 ? '<div class="card"><p>No active student notices.</p></div>' : sNotices.map(function(n) {
          return '<div class="card"><div style="font-size:11px;font-weight:700;color:var(--gold-ink);margin-bottom:4px;">' + esc(n.category) + ' · ' + esc(n.audience) + '</div><h3 style="margin:0 0 6px;">' + esc(n.title) + '</h3><p style="margin:0;font-size:13.5px;color:var(--muted);">' + esc(n.body) + '</p></div>';
        }).join('')) + '</div>';
      } else if (UI.studentTab === 'timetable') {
        content = '<div class="card">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:16px;">' +
          '  <div><span class="badge badge-gray">Read-Only View</span><h2 style="margin:6px 0 0;font-size:24px;">Class Timetable</h2></div>' +
          (activeTt ? (
            '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<select class="select" style="width:auto;" onchange="UI.studentSelectedTtIdx=Number(this.value);UI.studentSelectedSection=0;render();">' +
            tts.map(function(t, i) { return '<option value="' + i + '"' + (i === UI.studentSelectedTtIdx ? ' selected' : '') + '>' + esc(t.title) + '</option>'; }).join('') +
            '</select>' +
            '<select class="select" style="width:auto;" onchange="UI.studentSelectedSection=Number(this.value);render();">' +
            renderSectionOptions(activeTt, UI.studentSelectedSection) +
            '</select></div>'
          ) : '') +
          '</div>' +
          renderTimetableTable(activeTt, UI.studentSelectedSection) +
          '</div>';
      } else {
        content = '<div class="card">' +
          '<h2 style="margin:0 0 8px;font-size:24px;">Student Result Lookup</h2>' +
          '<p style="font-size:13.5px;color:var(--muted);margin:0 0 14px;">Enter your saved student name to view your published marks and grades.</p>' +
          '<input class="input" style="max-width:420px;margin-bottom:18px;" placeholder="Enter student name..." value="' + esc(UI.studentResultSearch) + '" oninput="UI.studentResultSearch=this.value;render();" />' +
          (!q ? '<p style="font-size:13px;color:var(--subtle);margin:0;">Type a student name above to search ' + (STATE.studentResults || []).length + ' saved result records.</p>' :
            matchedResults.length === 0 ? '<p style="font-size:13.5px;color:var(--muted);margin:0;">No saved results found matching "' + esc(UI.studentResultSearch) + '".</p>' : (
              '<div class="table-wrap"><table><thead><tr><th>Student</th><th>ID</th><th>Subject</th><th>Semester</th><th>Marks</th><th>Grade</th></tr></thead><tbody>' +
              matchedResults.map(function(r) {
                return '<tr><td><strong>' + esc(r.studentName) + '</strong></td><td>' + esc(r.studentCode) + '</td><td>' + esc(r.subjectName) + '</td><td>' + esc(r.semester) + '</td><td>' + r.marks + ' / ' + r.maxMarks + '</td><td><span class="badge badge-gold">' + esc(r.grade) + '</span></td></tr>';
              }).join('') +
              '</tbody></table></div>'
            )
          ) +
          '</div>';
      }

      return '<section class="page-banner"><div class="container"><p class="eyebrow">Scholar Access</p><h1>Student Portal</h1><p>Read administrative notices, view your class timetable (read-only), and look up saved academic results by name.</p></div></section>' +
        '<div class="container" style="padding-top:28px;">' +
        '<div class="tabs-bar">' +
        '<button type="button" class="tab-btn ' + (UI.studentTab === 'notices' ? 'active' : '') + '" onclick="setStudentTab(\\'notices\\')">Notices (' + sNotices.length + ')</button>' +
        '<button type="button" class="tab-btn ' + (UI.studentTab === 'timetable' ? 'active' : '') + '" onclick="setStudentTab(\\'timetable\\')">Timetable (Read-Only)</button>' +
        '<button type="button" class="tab-btn ' + (UI.studentTab === 'results' ? 'active' : '') + '" onclick="setStudentTab(\\'results\\')">My Results</button>' +
        '</div>' + content + '</div>';
    }

    function renderCalendar() {
      const year = UI.calYear;
      const month = UI.calMonth;
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const events = STATE.calendarEvents || [];

      let cells = '';
      for (let i = 0; i < firstDay; i++) cells += '<div class="cal-cell empty"></div>';
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        const dayEvs = events.filter(function(ev) {
          return ev.event_date === iso || (ev.end_date && iso >= ev.event_date && iso <= ev.end_date);
        });
        cells += '<div class="cal-cell"><div class="cal-day">' + d + '</div>' +
          dayEvs.map(function(ev) {
            const cls = ev.category === 'Holiday' ? 'badge-red' : ev.category === 'Exam' ? 'badge-amber' : 'badge-gold';
            return '<div class="cal-pill ' + cls + '" title="' + esc(ev.title) + '">' + esc(ev.title) + '</div>';
          }).join('') +
          '</div>';
      }

      return '<section class="page-banner"><div class="container"><p class="eyebrow">University Schedule</p><h1>Academic Calendar</h1><p>Official university holidays, administrative notices, examinations, and campus milestones.</p></div></section>' +
        '<div class="container" style="padding-top:28px;"><div class="grid-2">' +
        '<div class="card">' +
        '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
        '    <button type="button" class="btn btn-outline btn-sm" onclick="if(UI.calMonth===0){UI.calMonth=11;UI.calYear--;}else{UI.calMonth--;}render();">Prev</button>' +
        '    <h2 style="margin:0;font-size:22px;">' + monthNames[month] + ' ' + year + '</h2>' +
        '    <button type="button" class="btn btn-outline btn-sm" onclick="if(UI.calMonth===11){UI.calMonth=0;UI.calYear++;}else{UI.calMonth++;}render();">Next</button>' +
        '  </div>' +
        '  <div class="cal-grid">' +
        ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(function(w) { return '<div class="cal-head">' + w + '</div>'; }).join('') +
        cells +
        '  </div>' +
        '</div>' +
        '<div class="card"><h2 style="margin:0 0 14px;font-size:22px;">Holidays &amp; Important Events (' + events.length + ')</h2>' +
        events.map(function(ev) {
          return '<div style="padding:12px 0;border-bottom:1px solid var(--border);"><span class="badge ' + (ev.category === 'Holiday' ? 'badge-red' : 'badge-gold') + '">' + esc(ev.category) + '</span> <strong style="margin-left:6px;">' + esc(ev.title) + '</strong><div style="font-size:12px;color:var(--muted);margin-top:3px;">' + esc(ev.event_date) + (ev.end_date ? ' to ' + esc(ev.end_date) : '') + ' · ' + esc(ev.location) + '</div><p style="font-size:13px;color:var(--muted);margin:4px 0 0;">' + esc(ev.description) + '</p></div>';
        }).join('') +
        '</div></div></div>';
    }

    function render() {
      const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'admin', label: 'Admin Portal' },
        { id: 'teachers', label: 'Teachers' },
        { id: 'students', label: 'Students' },
        { id: 'calendar', label: 'Academic Calendar' },
      ];
      document.getElementById('nav-links').innerHTML = navItems.map(function(item) {
        return '<button type="button" class="nav-btn ' + (UI.page === item.id ? 'active' : '') + '" onclick="setPage(\\'' + item.id + '\\')">' + esc(item.label) + '</button>';
      }).join('');

      const liveSlot = document.getElementById('live-link-slot');
      if (INITIAL_DATA.liveUrl) {
        liveSlot.innerHTML = '<a href="' + esc(INITIAL_DATA.liveUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-dark btn-sm">Open Live Cloud Site</a>';
      }

      const alertHtml = UI.feedback
        ? '<div class="container" style="padding-top:18px;"><div class="alert alert-' + UI.feedback.type + '"><span>' + esc(UI.feedback.text) + '</span><button type="button" class="btn btn-outline btn-sm" onclick="clearFeedback()">Dismiss</button></div></div>'
        : '';

      let pageHtml = '';
      if (UI.page === 'home') pageHtml = renderHome();
      else if (UI.page === 'admin') pageHtml = renderAdmin();
      else if (UI.page === 'teachers') pageHtml = renderTeachers();
      else if (UI.page === 'students') pageHtml = renderStudents();
      else pageHtml = renderCalendar();

      document.getElementById('app-root').innerHTML = alertHtml + pageHtml;
    }

    render();
  </script>
</body>
</html>`;
}

export function downloadFullWebsiteHtml(data: FullSiteExportPayload): void {
  const html = buildFullWebsiteHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'excellence-university-portal.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
