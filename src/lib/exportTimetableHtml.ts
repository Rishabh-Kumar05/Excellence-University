import { DAY_NAMES, PERIOD_TIMES, PERIODS } from './timetableGenerator';
import type { TimetableSlot } from '../types';

export interface ExportTimetableInput {
  title: string;
  sectionsCount: number;
  teachersCount: number;
  roomsCount: number;
  daysCount: number;
  groups: number[];
  slots: TimetableSlot[];
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildStandaloneTimetableHtml(data: ExportTimetableInput): string {
  const payloadJson = JSON.stringify({
    title: data.title,
    sectionsCount: data.sectionsCount,
    teachersCount: data.teachersCount,
    roomsCount: data.roomsCount,
    daysCount: data.daysCount,
    groups: data.groups,
    slots: data.slots,
    dayNames: DAY_NAMES.slice(0, data.daysCount),
    periodTimes: PERIOD_TIMES,
    periods: PERIODS,
  }).replace(/</g, '\\u003c');

  const safeTitle = escapeHtml(data.title || 'Excellence University Master Timetable');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} — Excellence University</title>
  <style>
    :root {
      --bg: #f7f9ff;
      --surface: #ffffff;
      --surface-soft: #f1f4f9;
      --ink: #181c20;
      --muted: #45474a;
      --header: #1a1c1f;
      --gold: #fed65b;
      --gold-ink: #735c00;
      --border: #dfe3ea;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.45;
    }
    header {
      background: var(--header);
      color: #ffffff;
      padding: 28px 24px;
    }
    .container {
      max-width: 1180px;
      margin: 0 auto;
    }
    .eyebrow {
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #ffe088;
      margin: 0 0 6px;
      font-weight: 600;
    }
    h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 30px;
      margin: 0 0 8px;
    }
    .meta {
      font-size: 13px;
      color: #c6c6ca;
      margin: 0;
    }
    main {
      padding: 28px 24px 48px;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 2px 10px rgba(24, 28, 32, 0.04);
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 6px;
    }
    select {
      min-width: 320px;
      max-width: 100%;
      padding: 9px 12px;
      border-radius: 8px;
      border: 1px solid #c6c6ca;
      background: #ffffff;
      font-size: 14px;
      color: var(--ink);
    }
    button.btn {
      padding: 9px 16px;
      border-radius: 8px;
      border: none;
      background: var(--gold);
      color: #574500;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    button.btn:hover { background: #e9c349; }
    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 680px;
      text-align: left;
    }
    thead tr {
      background: var(--header);
      color: #ffffff;
      font-size: 12px;
    }
    th, td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      border-left: 1px solid var(--border);
      vertical-align: top;
    }
    tbody th {
      background: var(--surface-soft);
      border-left: none;
      width: 118px;
      font-size: 13px;
    }
    .time {
      font-size: 11px;
      font-weight: 400;
      color: var(--muted);
      margin-top: 2px;
    }
    .course {
      font-weight: 600;
      font-size: 13px;
      margin: 0;
    }
    .teacher {
      font-size: 11px;
      color: var(--muted);
      margin: 4px 0 0;
    }
    .blocks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px;
    }
    .block-box {
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--bg);
      font-size: 12px;
    }
    .block-box.active {
      background: rgba(254, 214, 91, 0.24);
      border-color: rgba(115, 92, 0, 0.45);
    }
    .block-head {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .block-head span:last-child { color: var(--gold-ink); }
    .block-line {
      font-size: 11px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    @media print {
      header { padding: 16px; }
      .no-print { display: none; }
      body { background: #ffffff; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <p class="eyebrow">Excellence University · Conflict-Free Schedule</p>
      <h1>${safeTitle}</h1>
      <p class="meta">${data.sectionsCount} Sections · ${data.teachersCount} Teachers · ${data.roomsCount} Rooms · ${data.daysCount} Days</p>
    </div>
  </header>
  <main class="container">
    <section class="card">
      <div class="controls">
        <div>
          <label for="section-select">Select Section</label>
          <select id="section-select"></select>
        </div>
        <button class="btn no-print" type="button" onclick="window.print()">Print / Save as PDF</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr id="day-headers"></tr>
          </thead>
          <tbody id="grid-body"></tbody>
        </table>
      </div>
    </section>
    <section class="card">
      <h2 style="font-family: Georgia, serif; font-size: 20px; margin: 0 0 12px;">Block Teacher Mapping (Dedicated 6 Teachers per 6 Sections)</h2>
      <div id="blocks-grid" class="blocks-grid"></div>
    </section>
  </main>
  <script>
    const DATA = ${payloadJson};
    const selectEl = document.getElementById('section-select');
    const dayHeadersEl = document.getElementById('day-headers');
    const gridBodyEl = document.getElementById('grid-body');
    const blocksGridEl = document.getElementById('blocks-grid');

    function esc(s) {
      return String(s).replace(/[&<>"']/g, function(ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
      });
    }

    DATA.groups.forEach(function(g, idx) {
      const opt = document.createElement('option');
      const blockIdx = Math.floor(idx / DATA.periods);
      opt.value = String(idx);
      opt.textContent = 'Section ' + (idx + 1) + ' (Semester ' + (g + 1) + ' · Year ' + (Math.floor(g / 2) + 1) + ', Sem ' + ((g % 2) + 1) + ' · Teachers ' + (blockIdx * DATA.periods + 1) + '–' + ((blockIdx + 1) * DATA.periods) + ')';
      selectEl.appendChild(opt);
    });

    let headHtml = '<th style="width:118px">Period</th>';
    DATA.dayNames.forEach(function(dName) {
      headHtml += '<th>' + esc(dName) + '</th>';
    });
    dayHeadersEl.innerHTML = headHtml;

    function renderSection(sectionIdx) {
      let bodyHtml = '';
      for (let p = 0; p < DATA.periods; p++) {
        bodyHtml += '<tr><th><div>Period ' + (p + 1) + '</div><div class="time">' + esc(DATA.periodTimes[p] || '') + '</div></th>';
        for (let d = 0; d < DATA.daysCount; d++) {
          const cell = DATA.slots.find(function(sl) { return sl.s === sectionIdx && sl.d === d && sl.p === p; });
          if (cell) {
            const tLabel = cell.teacherName === 'Teacher ' + (cell.teacherIdx + 1)
              ? cell.teacherName
              : 'Teacher ' + (cell.teacherIdx + 1) + ' (' + cell.teacherName + ')';
            bodyHtml += '<td><p class="course">' + esc(cell.courseName) + '</p><p class="teacher">' + esc(tLabel) + ' · Room ' + cell.roomNumber + '</p></td>';
          } else {
            bodyHtml += '<td>—</td>';
          }
        }
        bodyHtml += '</tr>';
      }
      gridBodyEl.innerHTML = bodyHtml;

      const activeBlock = Math.floor(sectionIdx / DATA.periods);
      const numBlocks = Math.ceil(DATA.sectionsCount / DATA.periods);
      let blocksHtml = '';
      for (let b = 0; b < numBlocks; b++) {
        const sStart = b * DATA.periods;
        const sEnd = Math.min(sStart + DATA.periods, DATA.sectionsCount);
        const g = DATA.groups[sStart] || 0;
        const seen = {};
        DATA.slots.filter(function(sl) { return sl.s >= sStart && sl.s < sEnd; }).forEach(function(sl) {
          if (!seen[sl.courseId]) seen[sl.courseId] = sl;
        });
        const items = Object.values(seen).sort(function(a, c) { return a.teacherIdx - c.teacherIdx; });
        blocksHtml += '<div class="block-box ' + (b === activeBlock ? 'active' : '') + '">';
        blocksHtml += '<div class="block-head"><span>Sem ' + (g + 1) + ' · Sec ' + (sStart + 1) + '–' + sEnd + '</span><span>Teachers ' + (sStart + 1) + '–' + ((b + 1) * DATA.periods) + '</span></div>';
        items.forEach(function(item) {
          const extra = item.teacherName !== 'Teacher ' + (item.teacherIdx + 1) ? ' (' + item.teacherName + ')' : '';
          blocksHtml += '<div class="block-line"><strong>T' + (item.teacherIdx + 1) + '</strong>' + esc(extra) + ' → ' + esc(item.courseName) + '</div>';
        });
        blocksHtml += '</div>';
      }
      blocksGridEl.innerHTML = blocksHtml;
    }

    selectEl.addEventListener('change', function() {
      renderSection(Number(selectEl.value));
    });
    renderSection(0);
  </script>
</body>
</html>`;
}

export function downloadTimetableHtml(data: ExportTimetableInput): void {
  const html = buildStandaloneTimetableHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const slug = (data.title || 'excellence-university-timetable')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug || 'excellence-university-timetable'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
