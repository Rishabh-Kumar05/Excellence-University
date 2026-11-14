import type { Course, Teacher, TimetableSlot } from '../types';

export const PERIODS = 6;
export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export const PERIOD_TIMES = ['9:00', '10:00', '11:00', '12:00', '2:00', '3:00'] as const;

export interface SemesterGroup {
  name: string;
  label: string;
  courses: string[];
}

export const SEMESTER_GROUPS: SemesterGroup[] = [
  {
    name: '1-1',
    label: 'Year 1 · Sem 1',
    courses: [
      'Engineering Mathematics I',
      'Engineering Physics',
      'Programming in C',
      'Basic Electrical Engineering',
      'English Communication',
      'Engineering Graphics',
    ],
  },
  {
    name: '1-2',
    label: 'Year 1 · Sem 2',
    courses: [
      'Engineering Mathematics II',
      'Engineering Chemistry',
      'Data Structures',
      'Digital Logic',
      'Environmental Science',
      'Workshop Practice',
    ],
  },
  {
    name: '2-1',
    label: 'Year 2 · Sem 1',
    courses: [
      'Discrete Mathematics',
      'Object-Oriented Programming',
      'Computer Organization',
      'Database Systems',
      'Probability and Statistics',
      'Analog Electronics',
    ],
  },
  {
    name: '2-2',
    label: 'Year 2 · Sem 2',
    courses: [
      'Design and Analysis of Algorithms',
      'Operating Systems',
      'Theory of Computation',
      'Software Engineering',
      'Computer Networks',
      'Microprocessors',
    ],
  },
  {
    name: '3-1',
    label: 'Year 3 · Sem 1',
    courses: [
      'Compiler Design',
      'Web Technologies',
      'Artificial Intelligence',
      'Information Security',
      'Embedded Systems',
      'Professional Elective I',
    ],
  },
  {
    name: '3-2',
    label: 'Year 3 · Sem 2',
    courses: [
      'Machine Learning',
      'Cloud Computing',
      'Data Mining',
      'Mobile Application Development',
      'Professional Elective II',
      'Open Elective I',
    ],
  },
  {
    name: '4-1',
    label: 'Year 4 · Sem 1',
    courses: [
      'Deep Learning',
      'Big Data Analytics',
      'Internet of Things',
      'Professional Elective III',
      'Open Elective II',
      'Project Phase I',
    ],
  },
  {
    name: '4-2',
    label: 'Year 4 · Sem 2',
    courses: [
      'Blockchain Technology',
      'Natural Language Processing',
      'Professional Elective IV',
      'Open Elective III',
      'Project Phase II',
      'Industrial Seminar',
    ],
  },
];

export interface TimetableConfig {
  T: number;
  S: number;
  R: number;
  D: number;
  groups: number[];
}

export interface ConflictReport {
  teacher: string[];
  room: string[];
  repeat: string[];
  semester: string[];
  empty: string[];
  multi: string[];
}

export interface BlockTeacherAllocation {
  blockIndex: number;
  semesterIndex: number;
  semesterLabel: string;
  sectionStart: number;
  sectionEnd: number;
  teacherStart: number;
  teacherEnd: number;
  assignments: Array<{
    courseId: number;
    courseName: string;
    teacherIdx: number;
    teacherId: number;
    teacherName: string;
  }>;
}

export interface GenerationResult {
  ok: boolean;
  errors: string[];
  slots: TimetableSlot[];
  courseTeachers: Record<number, Array<{ idx: number; id: number; name: string }>>;
  blockAllocations?: BlockTeacherAllocation[];
  conflicts: ConflictReport;
  effectiveGroups: SemesterGroup[];
}

export function buildEffectiveGroups(customCourses: Course[]): SemesterGroup[] {
  const cloned = SEMESTER_GROUPS.map((g) => ({
    ...g,
    courses: [...g.courses],
  }));

  const setupCourseTitles = customCourses
    .filter((c) => c.isCustom)
    .map((c) => c.title.trim())
    .filter(Boolean);

  if (setupCourseTitles.length > 0) {
    setupCourseTitles.forEach((title, idx) => {
      const groupIdx = Math.floor(idx / PERIODS) % cloned.length;
      const slotIdx = idx % PERIODS;
      if (!cloned[groupIdx].courses.includes(title)) {
        cloned[groupIdx].courses[slotIdx] = title;
      }
    });
  }

  return cloned;
}

function getCourseName(groups: SemesterGroup[], id: number): string {
  const gIdx = Math.floor(id / PERIODS);
  const cIdx = id % PERIODS;
  return groups[gIdx]?.courses[cIdx] || `Course ${id + 1}`;
}

function groupCourseIds(g: number): number[] {
  return Array.from({ length: PERIODS }, (_, k) => g * PERIODS + k);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function checkTimetableFeasibility(cfg: TimetableConfig): string[] {
  const problems: string[] = [];
  if (cfg.R < cfg.S) {
    problems.push(
      `Not enough rooms: ${cfg.S} sections have a class in every period, so at least ${cfg.S} rooms are needed. You entered ${cfg.R}.`
    );
  }

  const numBlocks = Math.ceil(cfg.S / PERIODS);
  const neededTeachers = numBlocks * PERIODS;
  if (cfg.T < neededTeachers) {
    problems.push(
      `Not enough teachers: ${cfg.S} section(s) span ${numBlocks} semester block(s) of 6 sections (Sections 1–6 → Teachers 1–6, Sections 7–12 → Teachers 7–12, …, up to 48), requiring at least ${neededTeachers} teachers. You entered ${cfg.T}.`
    );
  }

  for (let b = 0; b < numBlocks; b += 1) {
    const startS = b * PERIODS;
    const endS = Math.min(startS + PERIODS, cfg.S);
    const baseGroup = cfg.groups[startS];
    for (let s = startS + 1; s < endS; s += 1) {
      if (cfg.groups[s] !== baseGroup) {
        problems.push(
          `Sections ${startS + 1}–${endS} share Teachers ${startS + 1}–${
            (b + 1) * PERIODS
          } and must belong to the same semester.`
        );
        break;
      }
    }
  }

  return problems;
}

export function findTimetableConflicts(
  slots: TimetableSlot[],
  cfg: TimetableConfig,
  effectiveGroups: SemesterGroup[] = SEMESTER_GROUPS
): ConflictReport {
  const out: ConflictReport = {
    teacher: [],
    room: [],
    repeat: [],
    semester: [],
    empty: [],
    multi: [],
  };
  const subjectsOf: Record<number, Set<number>> = {};

  for (let d = 0; d < cfg.D; d += 1) {
    for (let p = 0; p < PERIODS; p += 1) {
      const periodSlots = slots.filter((sl) => sl.d === d && sl.p === p);
      const teachersMap: Record<number, number[]> = {};
      const roomsMap: Record<number, number[]> = {};
      const where = `${DAY_NAMES[d]}, period ${p + 1}`;

      for (let s = 0; s < cfg.S; s += 1) {
        const cell = periodSlots.find((sl) => sl.s === s);
        if (!cell) {
          out.empty.push(`Section ${s + 1} is empty on ${where}`);
          continue;
        }
        (teachersMap[cell.teacherIdx] ||= []).push(s + 1);
        (subjectsOf[cell.teacherIdx] ||= new Set()).add(cell.courseId);
        (roomsMap[cell.roomNumber] ||= []).push(s + 1);
      }

      Object.entries(teachersMap).forEach(([tIdx, secs]) => {
        if (secs.length > 1) {
          out.teacher.push(
            `Teacher ${Number(tIdx) + 1} is in sections ${secs.join(', ')} on ${where}`
          );
        }
      });

      Object.entries(roomsMap).forEach(([rNum, secs]) => {
        if (secs.length > 1) {
          out.room.push(`Room ${rNum} is used by sections ${secs.join(', ')} on ${where}`);
        }
      });
    }

    for (let s = 0; s < cfg.S; s += 1) {
      const seen = new Set<number>();
      const own = new Set(groupCourseIds(cfg.groups[s]));
      const daySlots = slots.filter((sl) => sl.d === d && sl.s === s);

      daySlots.forEach((cell) => {
        if (seen.has(cell.courseId)) {
          out.repeat.push(
            `Section ${s + 1} repeats "${getCourseName(effectiveGroups, cell.courseId)}" on ${
              DAY_NAMES[d]
            }`
          );
        }
        if (!own.has(cell.courseId)) {
          out.semester.push(
            `Section ${s + 1} has "${getCourseName(
              effectiveGroups,
              cell.courseId
            )}" from another semester`
          );
        }
        seen.add(cell.courseId);
      });

      if (seen.size < PERIODS) {
        out.semester.push(
          `Section ${s + 1} is missing some semester courses on ${DAY_NAMES[d]}`
        );
      }
    }
  }

  Object.entries(subjectsOf).forEach(([tIdx, courseSet]) => {
    if (courseSet.size > 1) {
      out.multi.push(`Teacher ${Number(tIdx) + 1} teaches ${courseSet.size} different subjects`);
    }
  });

  return out;
}

export function generateConflictFreeTimetable(
  cfg: TimetableConfig,
  teachersList: Teacher[],
  customCourses: Course[] = []
): GenerationResult {
  const effectiveGroups = buildEffectiveGroups(customCourses);
  const errors = checkTimetableFeasibility(cfg);
  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      slots: [],
      courseTeachers: {},
      blockAllocations: [],
      conflicts: { teacher: [], room: [], repeat: [], semester: [], empty: [], multi: [] },
      effectiveGroups,
    };
  }

  // Build teacher roster of size cfg.T using Setup & Directory teachers in order (1..T)
  const teacherPool: Array<{ idx: number; id: number; name: string; preferredCourse: string }> =
    Array.from({ length: cfg.T }, (_, idx) => {
      const real = teachersList[idx];
      return {
        idx,
        id: real ? real.id : 1000 + idx + 1,
        name: real ? real.name : `Teacher ${idx + 1}`,
        preferredCourse: (real?.assigned_course || '').trim().toLowerCase(),
      };
    });

  // Strict 6-section / 6-teacher block partitioning:
  // Block 0 (Sections 1..6)  -> Teachers 1..6   (indices 0..5)
  // Block 1 (Sections 7..12) -> Teachers 7..12  (indices 6..11)
  // ...
  // Block 7 (Sections 43..48)-> Teachers 43..48 (indices 42..47)
  const numBlocks = Math.ceil(cfg.S / PERIODS);
  const courseTeachers: Record<number, Array<{ idx: number; id: number; name: string }>> = {};
  const blockAllocations: BlockTeacherAllocation[] = [];
  const blockSubjectTeacherMap: Array<
    Array<{ courseId: number; teacher: { idx: number; id: number; name: string } }>
  > = [];

  for (let b = 0; b < numBlocks; b += 1) {
    const sStart = b * PERIODS;
    const sEnd = Math.min(sStart + PERIODS, cfg.S);
    const g = cfg.groups[sStart] ?? (b % effectiveGroups.length);
    const blockCourses = groupCourseIds(g);
    const blockTeachers = teacherPool.slice(b * PERIODS, (b + 1) * PERIODS);
    const usedTeacherLocalIdx = new Set<number>();
    const assignedForBlock: Array<{
      courseId: number;
      teacher: { idx: number; id: number; name: string };
    } | null> = Array(PERIODS).fill(null);

    // Pass 1: honor Setup assigned_course within this block's 6 dedicated teachers
    blockCourses.forEach((cId, pos) => {
      const cNameLower = getCourseName(effectiveGroups, cId).toLowerCase();
      for (let tLocal = 0; tLocal < blockTeachers.length; tLocal += 1) {
        if (usedTeacherLocalIdx.has(tLocal)) continue;
        if (
          blockTeachers[tLocal].preferredCourse &&
          blockTeachers[tLocal].preferredCourse === cNameLower
        ) {
          usedTeacherLocalIdx.add(tLocal);
          assignedForBlock[pos] = {
            courseId: cId,
            teacher: {
              idx: blockTeachers[tLocal].idx,
              id: blockTeachers[tLocal].id,
              name: blockTeachers[tLocal].name,
            },
          };
          break;
        }
      }
    });

    // Pass 2: assign remaining teachers from this block's 6-teacher pool in order
    let tCursor = 0;
    blockCourses.forEach((cId, pos) => {
      if (assignedForBlock[pos]) return;
      while (tCursor < blockTeachers.length && usedTeacherLocalIdx.has(tCursor)) {
        tCursor += 1;
      }
      const chosen = blockTeachers[tCursor];
      usedTeacherLocalIdx.add(tCursor);
      tCursor += 1;
      assignedForBlock[pos] = {
        courseId: cId,
        teacher: {
          idx: chosen.idx,
          id: chosen.id,
          name: chosen.name,
        },
      };
    });

    const finalized = assignedForBlock as Array<{
      courseId: number;
      teacher: { idx: number; id: number; name: string };
    }>;

    finalized.forEach(({ courseId, teacher }) => {
      (courseTeachers[courseId] ||= []).push(teacher);
    });

    blockSubjectTeacherMap.push(finalized);
    blockAllocations.push({
      blockIndex: b,
      semesterIndex: g + 1,
      semesterLabel: effectiveGroups[g]?.label || `Semester ${g + 1}`,
      sectionStart: sStart + 1,
      sectionEnd: sEnd,
      teacherStart: b * PERIODS + 1,
      teacherEnd: (b + 1) * PERIODS,
      assignments: finalized.map(({ courseId, teacher }) => ({
        courseId,
        courseName: getCourseName(effectiveGroups, courseId),
        teacherIdx: teacher.idx,
        teacherId: teacher.id,
        teacherName: teacher.name,
      })),
    });
  }

  // Generate each day using a 6x6 Latin square per block so:
  // - Sections 6b+1..6b+6 strictly use ONLY Teachers 6b+1..6b+6
  // - No teacher appears in two sections at the same period
  // - Every section gets all 6 subjects of its semester once per day
  // - Every room is distinct per period across all sections (roomNumber = ((s + p) % cfg.R) + 1)
  const slots: TimetableSlot[] = [];

  for (let d = 0; d < cfg.D; d += 1) {
    for (let b = 0; b < numBlocks; b += 1) {
      const sStart = b * PERIODS;
      const sEnd = Math.min(sStart + PERIODS, cfg.S);
      const perm = shuffle([0, 1, 2, 3, 4, 5]);
      const shifts = shuffle([0, 1, 2, 3, 4, 5]);
      const blockMap = blockSubjectTeacherMap[b];

      for (let s = sStart; s < sEnd; s += 1) {
        const localIdx = s - sStart;
        const shift = shifts[localIdx];
        for (let p = 0; p < PERIODS; p += 1) {
          const subjectPos = perm[(p + shift) % PERIODS];
          const entry = blockMap[subjectPos];
          slots.push({
            d,
            p,
            s,
            courseId: entry.courseId,
            courseName: getCourseName(effectiveGroups, entry.courseId),
            teacherIdx: entry.teacher.idx,
            teacherId: entry.teacher.id,
            teacherName: entry.teacher.name,
            roomNumber: ((s + p) % cfg.R) + 1,
          });
        }
      }
    }
  }

  const conflicts = findTimetableConflicts(slots, cfg, effectiveGroups);

  return {
    ok: true,
    errors: [],
    slots,
    courseTeachers,
    blockAllocations,
    conflicts,
    effectiveGroups,
  };
}

export function calculateGrade(marks: number, maxMarks = 100): { letter: string; points: number } {
  const pct = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
  if (pct >= 90) return { letter: 'O', points: 10 };
  if (pct >= 80) return { letter: 'E', points: 9 };
  if (pct >= 70) return { letter: 'A', points: 8 };
  if (pct >= 60) return { letter: 'B', points: 7 };
  if (pct >= 50) return { letter: 'C', points: 6 };
  if (pct >= 40) return { letter: 'D', points: 5 };
  return { letter: 'F', points: 0 };
}
