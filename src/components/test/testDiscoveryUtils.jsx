// Pure helpers used by /test discovery page.
// All functions are deterministic and side-effect free.

/**
 * Map API testType enum (READING/LISTENING/WRITING/SPEAKING)
 * to MagicPath-style skill key used by the design component.
 */
export const mapTestTypeToSkill = (testType) => {
  switch ((testType || "").toString().toUpperCase()) {
    case "READING":
      return "reading";
    case "LISTENING":
      return "listening";
    case "WRITING":
      return "writing";
    case "SPEAKING":
      return "speaking";
    default:
      return "reading";
  }
};

/**
 * Map API Level enum (Low/Mid/High/Great) to MagicPath difficulty.
 * 4 buckets per user request: Dễ / Trung bình / Khó / Rất khó.
 */
export const mapLevelToDiff = (level) => {
  switch ((level || "").toString()) {
    case "Low":
      return "easy";
    case "Mid":
      return "medium";
    case "High":
      return "hard";
    case "Great":
      return "veryHard";
    default:
      return "medium";
  }
};

/**
 * Format duration in seconds → "60 phút".
 *
 * NB: API stores duration in seconds (per Prisma schema + DTO + seed).
 * Some legacy data may have been entered in minutes (per user report
 * "đề nhập vô bị lỗi"). Heuristic:
 *   - If value > 200 → treat as seconds, divide by 60
 *   - If value <= 200 → treat as already-minutes, use raw (caller is
 *     expected to fix the underlying DB record)
 *
 * Returns { label, suspicious } so the UI can warn when units look wrong.
 */
export const formatDuration = (raw) => {
  if (raw === null || raw === undefined || Number.isNaN(Number(raw))) {
    return { label: "— phút", suspicious: false };
  }
  const value = Number(raw);
  if (value > 200) {
    const minutes = Math.round(value / 60);
    return { label: `${minutes} phút`, suspicious: false };
  }
  // Value <= 200 — assume minutes. Flag as suspicious so the UI can hint
  // to the user that the underlying record may need fixing.
  return { label: `${value} phút`, suspicious: value > 0 && value <= 10 };
};

/**
 * Returns true if the test is in the top N most recent (by createdAt desc).
 * Used to render the "Mới" badge on cards.
 */
export const isNewByRecency = (exams, exam, topN = 5) => {
  if (!exams || !exam) return false;
  const sorted = [...exams].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const topIds = new Set(sorted.slice(0, topN).map((e) => e.idTest || e.id));
  return topIds.has(exam.idTest || exam.id);
};

/**
 * Format a finishedAt ISO/string into a Vietnamese relative string.
 * Already handled inside the .tsx component as well; kept here for any
 * future consumers that need it externally.
 */
export const formatRelativeFinishedAtVi = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "vừa xong";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk} tuần trước`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} tháng trước`;
  return `${Math.floor(day / 365)} năm trước`;
};

/**
 * Per-skill counts for filter pills.
 */
export const getSkillCounts = (exams) => {
  const counts = {
    all: exams?.length || 0,
    reading: 0,
    listening: 0,
    writing: 0,
    speaking: 0,
  };
  if (!exams) return counts;
  for (const e of exams) {
    const skill = mapTestTypeToSkill(e.testType);
    if (counts[skill] !== undefined) counts[skill] += 1;
  }
  return counts;
};

/**
 * sessionStorage cache for user stats (5 min TTL).
 * Keyed by idUser so multiple users on the same browser don't collide.
 */
const STATS_CACHE_TTL_MS = 5 * 60 * 1000;

export const getCachedUserStats = (idUser) => {
  if (!idUser) return null;
  try {
    const raw = sessionStorage.getItem(`userBestBandStats:${idUser}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (Date.now() - (parsed.cachedAt || 0) > STATS_CACHE_TTL_MS) return null;
    return parsed.data || null;
  } catch {
    return null;
  }
};

export const setCachedUserStats = (idUser, data) => {
  if (!idUser) return;
  try {
    sessionStorage.setItem(
      `userBestBandStats:${idUser}`,
      JSON.stringify({ cachedAt: Date.now(), data })
    );
  } catch {
    // ignore quota errors
  }
};

export const clearCachedUserStats = (idUser) => {
  if (!idUser) return;
  try {
    sessionStorage.removeItem(`userBestBandStats:${idUser}`);
  } catch {
    // ignore
  }
};
