// Pages/teacher/teacherDashboard.jsx
// UI adapted from MagicPath "IELTS Teacher Dashboard v2".
// API endpoints consumed:
//   GET /dashboard/overview              -> { totalStudents, testsThisMonth, avgBandScore,
//                                             reviewsThisWeek, reviewsLastWeek, reviewsToday }
//   GET /dashboard/skills                -> { LISTENING, READING, WRITING, SPEAKING }
//   GET /dashboard/top-streaks           -> [{ idUser, nameUser, avatar, currentStreak }]
//   GET /dashboard/top-performers        -> [{ idUser, nameUser, avatar,
//                                             averageBandScore, totalTestsTaken }]
//   GET /teacher-review/pending-tickets  -> [{ idTicket, type, aiBandScore, createdAt,
//                                             studentName, studentAvatar, testTitle }]
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/authContext";
import {
  getDashboardOverviewAPI,
  getDashboardSkillPerformanceAPI,
  getDashboardTopStreaksAPI,
  getDashboardTopPerformersAPI,
  getRecentSubmissionsAPI,
} from "@/services/apiTeacherDashboard";
import StackedButton from "@/components/ui/StackedButton";

/* ----------------------------- Helpers ----------------------------- */
const FONT_HEAD = { fontFamily: "Nunito" };

const formatGreetingDate = () => {
  const d = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
};

const formatRelative = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const min = 60_000;
  const hour = 60 * min;
  if (diff < min) return "Just now";
  if (diff < hour) return `${Math.floor(diff / min)} min ago`;
  if (diff < 24 * hour) return `${Math.floor(diff / hour)} hr ago`;
  return `${Math.floor(diff / (24 * hour))} days ago`;
};

const computeDelta = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(Math.abs(((current - previous) / previous) * 100));
};

const inferPriority = (iso) => {
  if (!iso) return "low";
  const ageHours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (ageHours > 24) return "high";
  if (ageHours > 8) return "medium";
  return "low";
};

const PRIORITY_STYLE = {
  high: "bg-rose-50 text-[#be123c] border border-rose-100",
  medium: "bg-amber-50 text-[#b45309] border border-amber-100",
  low: "bg-emerald-50 text-[#047857] border border-emerald-100",
};
const PRIORITY_LABEL = { high: "Urgent", medium: "Med", low: "Low" };

const SKILL_LABEL = {
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};

/* ----------------------------- Sub-components ----------------------------- */
const CardHeader = ({ eyebrow, title, subtitle, eyebrowClass = "text-[#6366f1]", right }) => (
  <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-[#eef0f4]">
    <div className="min-w-0">
      <div className={`text-[11px] font-extrabold uppercase tracking-wider ${eyebrowClass}`}>
        {eyebrow}
      </div>
      <h2 className="text-lg font-extrabold text-[#1e1b4b] leading-tight mt-0.5" style={FONT_HEAD}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-[13px] text-[#64748b] mt-1 leading-snug">{subtitle}</p>
      )}
    </div>
    {right && <div className="flex-none">{right}</div>}
  </div>
);

const StatCard = ({ label, value, subtitle, subtitleClass, icon, circle, trend, isLoading }) => (
  <div className="group bg-white rounded-2xl border border-[#eef0f4] shadow-[0_1px_3px_rgba(30,27,75,0.04)] overflow-hidden hover:shadow-[0_8px_24px_rgba(30,27,75,0.06)] hover:-translate-y-0.5 transition-all duration-200">
    <div className="h-1 bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#fb7185]" />
    <div className="p-4 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-none ${circle}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#94a3b8] leading-tight">
          {label}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span
            className="text-3xl font-black text-[#1e1b4b] leading-none tabular-nums"
            style={FONT_HEAD}
          >
            {isLoading ? "—" : value}
          </span>
          <span className={`text-[12px] font-semibold ${subtitleClass} truncate`}>
            {subtitle}
          </span>
        </div>
      </div>
      <div
        className={`hidden sm:flex w-9 h-9 rounded-lg items-center justify-center flex-none ${
          trend === "up"
            ? "bg-emerald-50 text-emerald-600"
            : trend === "down"
            ? "bg-rose-50 text-rose-600"
            : "bg-slate-50 text-slate-400"
        }`}
        aria-hidden="true"
      >
        {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}
      </div>
    </div>
  </div>
);

const Avatar = ({ name, avatar, color, size = 10 }) => {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const dim = `${size === 9 ? 2.25 : size === 12 ? 3 : 2.5}rem`;
  return (
    <div
      className={`${color || "bg-[#6366f1]"} text-white flex items-center justify-center text-base flex-none shadow-sm rounded-full`}
      style={{ width: dim, height: dim }}
      aria-hidden="true"
    >
      {avatar || initial}
    </div>
  );
};

/* ----------------------------- Main ----------------------------- */
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [overview, setOverview] = useState({
    totalStudents: 0,
    testsThisMonth: 0,
    avgBandScore: 0,
    reviewsThisWeek: 0,
    reviewsLastWeek: 0,
    reviewsToday: 0,
  });
  const [skills, setSkills] = useState({
    LISTENING: 0,
    READING: 0,
    WRITING: 0,
    SPEAKING: 0,
  });
  const [topPerformers, setTopPerformers] = useState([]);
  const [topStreaks, setTopStreaks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [overviewData, skillsData, performersData, streaksData, submissionsData] =
          await Promise.all([
            getDashboardOverviewAPI(),
            getDashboardSkillPerformanceAPI(),
            getDashboardTopPerformersAPI(),
            getDashboardTopStreaksAPI(),
            getRecentSubmissionsAPI(5),
          ]);
        if (!isMounted) return;
        setOverview(overviewData);
        setSkills(skillsData);
        setTopPerformers(performersData);
        setTopStreaks(streaksData);
        setSubmissions(submissionsData);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const userName = useMemo(
    () => user?.fullName || user?.nameUser || "Teacher",
    [user],
  );

  const reviewsDelta = useMemo(
    () => computeDelta(overview.reviewsThisWeek, overview.reviewsLastWeek),
    [overview.reviewsThisWeek, overview.reviewsLastWeek],
  );

  const reviewsTrend =
    reviewsDelta === 0
      ? "flat"
      : overview.reviewsThisWeek >= overview.reviewsLastWeek
      ? "up"
      : "down";

  // Compose submissions with priority + age
  const submissionsEnriched = useMemo(
    () =>
      submissions.map((s) => ({
        ...s,
        priority: inferPriority(s.createdAt),
        submitted: formatRelative(s.createdAt),
      })),
    [submissions],
  );

  // Radar chart (inline SVG, canvas v2 style)
  const radarAxes = useMemo(
    () => [
      { label: "Nghe", value: Number(skills.LISTENING) || 0, fullMark: 9 },
      { label: "Reading", value: Number(skills.READING) || 0, fullMark: 9 },
      { label: "Writing", value: Number(skills.WRITING) || 0, fullMark: 9 },
      { label: "Speaking", value: Number(skills.SPEAKING) || 0, fullMark: 9 },
    ],
    [skills],
  );

  // Filter for submissions
  const filterTabs = ["All", "Writing", "Speaking"];
  const [activeFilter, setActiveFilter] = useState("All");
  const filteredSubmissions = useMemo(() => {
    if (activeFilter === "All") return submissionsEnriched;
    const target = activeFilter === "Writing" ? "WRITING" : "SPEAKING";
    return submissionsEnriched.filter((s) => s.type === target);
  }, [submissionsEnriched, activeFilter]);

  // Pagination for submissions queue
  const QUEUE_PAGE_SIZE = 5;
  const [queuePage, setQueuePage] = useState(1);
  const queueTotalPages = Math.max(
    1,
    Math.ceil(filteredSubmissions.length / QUEUE_PAGE_SIZE),
  );
  const queuePageSafe = Math.min(queuePage, queueTotalPages);
  const queuePaged = useMemo(() => {
    const start = (queuePageSafe - 1) * QUEUE_PAGE_SIZE;
    return filteredSubmissions.slice(start, start + QUEUE_PAGE_SIZE);
  }, [filteredSubmissions, queuePageSafe]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setQueuePage(1);
  }, [activeFilter]);

  // Quick actions
  const quickActions = [
    { icon: "📝", label: "Create test", hint: "Compose new test", to: "../testManager/testCreate" },
    { icon: "📊", label: "Report", hint: "Analytics", to: "../statistic" },
    { icon: "✉️", label: "Invite students", hint: "Add students", to: "../userList" },
    { icon: "💬", label: "Forum", hint: "Moderate", to: "../moderation" },
  ];

  // Top performers with rank + growth placeholder
  const topPerformersRanked = useMemo(
    () =>
      topPerformers.slice(0, 5).map((s, i) => ({
        rank: i + 1,
        name: s.nameUser,
        avatar: s.avatar,
        avatarColor: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
        band: Number(s.averageBandScore) || 0,
        growth: 0, // not in API; UI can still show neutral badge
      })),
    [topPerformers],
  );

  const topStreaksRanked = useMemo(
    () =>
      topStreaks.slice(0, 5).map((s, i) => ({
        rank: i + 1,
        name: s.nameUser,
        avatar: s.avatar,
        avatarColor: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
        streak: s.currentStreak || 0,
        band: 0,
      })),
    [topStreaks],
  );

  // Today progress: 5 fixed daily target (cosmetic)
  const dailyTarget = 8;
  const dailyProgress = Math.min(
    100,
    Math.round((overview.reviewsToday / dailyTarget) * 100),
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#fafafc] via-[#f5f3ff] to-[#fef2f4]">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-5">
        {/* Top bar */}
        <header className="bg-white/90 backdrop-blur-md border border-[#eef0f4] rounded-2xl shadow-[0_1px_3px_rgba(30,27,75,0.04)] px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-4 sticky top-0 z-30">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] leading-tight">
              {formatGreetingDate()}
            </div>
            <h1
              className="text-lg sm:text-xl font-black text-[#1e1b4b] truncate leading-tight"
              style={FONT_HEAD}
            >
              Good morning, {userName} 👋
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <StackedButton
              tone="indigo"
              size="md"
              onClick={() => navigate("../testManager/testCreate")}
            >
              + Create new test
            </StackedButton>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stat strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Total students"
            value={overview.totalStudents.toLocaleString("vi-VN")}
            subtitle="currently enrolled"
            subtitleClass="text-[#64748b]"
            icon="👥"
            circle="bg-indigo-50 text-[#6366f1]"
            trend="up"
            isLoading={loading}
          />
          <StatCard
            label="Graded lessons this week"
            value={overview.reviewsThisWeek.toLocaleString("vi-VN")}
            subtitle={
              reviewsDelta > 0
                ? `↑ ${reviewsDelta}% vs last week`
                : reviewsDelta === 0
                ? "= same as last week"
                : `↓ ${reviewsDelta}% vs last week`
            }
            subtitleClass={
              reviewsTrend === "up"
                ? "text-emerald-600"
                : reviewsTrend === "down"
                ? "text-rose-600"
                : "text-[#64748b]"
            }
            icon="📋"
            circle="bg-rose-50 text-[#fb7185]"
            trend={reviewsTrend}
            isLoading={loading}
          />
        </section>

        {/* Work area: row 1 — Radar (left) + Quick actions (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Radar skill (col-span-7) */}
          <section className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-[#eef0f4] shadow-[0_1px_3px_rgba(30,27,75,0.04)] p-5 sm:p-6">
            <CardHeader
              eyebrow="Skill analytics"
              title="IELTS 4-skill performance"
              subtitle="Average band score across all current students · updated today"
              right={
                <div className="flex items-center gap-3 text-[12px] font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#6366f1]" />
                    Medium
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-[#94a3b8]" />
                    Target 7.5
                  </span>
                </div>
              }
            />
            <RadarChart axes={radarAxes} isLoading={loading} />
          </section>

          {/* Quick actions + Today (col-span-5) */}
          <aside className="hidden md:flex flex-col gap-5 lg:col-span-5">
            <div className="flex-1 bg-white rounded-2xl border border-[#eef0f4] shadow-[0_1px_3px_rgba(30,27,75,0.04)] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#94a3b8]">
                  Action nhanh
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.to)}
                    className="flex flex-col items-start gap-2 p-3 rounded-xl border border-[#eef0f4] hover:border-[#6366f1] hover:bg-[#fafbff] transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-indigo-50 text-[#6366f1]">
                      {a.icon}
                    </div>
                    <div>
                      <div className="text-[13px] font-extrabold text-[#1e1b4b] leading-tight">
                        {a.label}
                      </div>
                      <div className="text-[10px] text-[#94a3b8] font-semibold leading-tight mt-0.5">
                        {a.hint}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-[0_8px_24px_rgba(99,102,241,0.25)]">
              <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">
                Today
              </div>
              <div className="text-2xl font-black mt-1 tabular-nums" style={FONT_HEAD}>
                {overview.reviewsToday} tests
              </div>
              <div className="text-[12px] opacity-90 font-semibold">
                Graded · target {dailyTarget} tests/day
              </div>
              <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
              <div className="text-[10px] opacity-80 mt-2 font-bold">
                {dailyProgress}% daily target
              </div>
            </div>
          </aside>
        </div>

        {/* Work area: row 2 — Queue (left) + Top performers (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch mt-5">
          {/* Submissions queue (col-span-7) — fixed height = top performers */}
          <section className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-[#eef0f4] shadow-[0_1px_3px_rgba(30,27,75,0.04)] overflow-hidden h-[480px]">
            <div className="h-1 bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#fb7185]" />
            <div className="p-5 sm:p-6 flex-1 flex flex-col min-h-0">
              <CardHeader
                eyebrow="Queue"
                eyebrowClass="text-[#fb7185]"
                title="Tests to grade"
                subtitle={`${submissionsEnriched.length} tests are waiting for your review. Start to keep SLA under 24h.`}
                right={
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex bg-[#f5f6fa] rounded-lg p-0.5 text-[11px]">
                      {filterTabs.map((t) => (
                        <button
                          key={t}
                          onClick={() => setActiveFilter(t)}
                          className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                            activeFilter === t
                              ? "bg-white text-[#6366f1] shadow-sm"
                              : "text-[#64748b]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
                        Live
                      </span>
                    </div>
                  </div>
                }
              />

              <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
                {loading && (
                  <div className="p-6 text-center text-[#64748b] text-sm">
                    Loading...
                  </div>
                )}
                {!loading && filteredSubmissions.length === 0 && (
                  <div className="p-6 text-center text-[#64748b] text-sm">
                    No tests waiting
                  </div>
                )}
                {!loading &&
                  queuePaged.map((s) => {
                    const isWriting = s.type === "WRITING";
                    return (
                      <div
                        key={s.idTicket}
                        className="group flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-[#e0e7ff] hover:bg-[#fafbff] cursor-pointer transition-all"
                        onClick={() => navigate("../teacher-review")}
                      >
                        <Avatar name={s.studentName} avatar={s.studentAvatar} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#1e1b4b] text-sm">
                              {s.studentName}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded text-white ${
                                isWriting ? "bg-[#6366f1]" : "bg-[#a855f7]"
                              }`}
                            >
                              {isWriting ? "✍️ Writing" : "🎤 Speaking"}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded ${PRIORITY_STYLE[s.priority]}`}
                            >
                              {PRIORITY_LABEL[s.priority]}
                            </span>
                          </div>
                          <div className="text-xs text-[#64748b] truncate mt-0.5">
                            {s.testTitle}
                          </div>
                        </div>
                        <div className="hidden sm:block text-[11px] text-[#94a3b8] flex-none font-semibold">
                          {s.submitted}
                        </div>
                        {Number(s.aiBandScore) > 0 ? (
                          <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold text-xs flex-none border border-emerald-100">
                            ✓ {Number(s.aiBandScore).toFixed(1)}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("../teacher-review");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#6366f1] text-white font-bold text-xs flex-none shadow-sm group-hover:bg-[#4f46e5] transition-colors"
                          >
                            Grade
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>

              {filteredSubmissions.length > 0 && (
                <div className="pt-3 mt-4 border-t border-[#eef0f4] flex items-center justify-between text-[12px] gap-2">
                  <span className="text-[#94a3b8] font-semibold">
                    Page {queuePageSafe}/{queueTotalPages} · {filteredSubmissions.length} tests
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
                      disabled={queuePageSafe === 1}
                      className="h-7 w-7 rounded-md border border-[#eef0f4] text-[#64748b] hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition flex items-center justify-center"
                      title="Previous page"
                    >
                      ‹
                    </button>
                    {Array.from({ length: queueTotalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setQueuePage(p)}
                          className={`h-7 min-w-7 px-2 rounded-md text-[11px] font-bold transition ${
                            p === queuePageSafe
                              ? "bg-[#6366f1] text-white shadow-sm"
                              : "border border-[#eef0f4] text-[#64748b] hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setQueuePage((p) => Math.min(queueTotalPages, p + 1))
                      }
                      disabled={queuePageSafe === queueTotalPages}
                      className="h-7 w-7 rounded-md border border-[#eef0f4] text-[#64748b] hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition flex items-center justify-center"
                      title="Page sau"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Top performers (col-span-5) — fixed height = queue */}
          <section className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-[#eef0f4] shadow-[0_1px_3px_rgba(30,27,75,0.04)] p-5 sm:p-6 h-[480px]">
            <CardHeader
              eyebrow="Top students"
              eyebrowClass="text-[#d97706]"
              title="Top 5 by band score"
              subtitle="Ranked by average band of completed tests"
              right={
                <button
                  onClick={() => navigate("../userList")}
                  className="text-[12px] font-extrabold text-[#6366f1] hover:underline whitespace-nowrap"
                >
                  View all →
                </button>
              }
            />
            <div className="mt-4 space-y-2.5 flex-1">
              {!loading && topPerformersRanked.length === 0 && (
                <div className="p-6 text-center text-[#64748b] text-sm">
                  No data yet
                </div>
              )}
              {topPerformersRanked.map((s) => (
                <div
                  key={s.idUser}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition"
                >
                  <span className="text-[12px] font-extrabold w-7 text-center text-[#94a3b8] tabular-nums">
                    {s.rank}
                  </span>
                  <Avatar name={s.nameUser} avatar={s.avatar} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-[#1e1b4b] truncate">
                      {s.nameUser}
                    </div>
                    <div className="text-[10px] text-[#94a3b8] font-semibold mt-0.5">
                      {s.totalTestsTaken} tests done
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[#6366f1] font-extrabold text-xs flex-none border border-indigo-100 tabular-nums">
                    {Number(s.averageBandScore).toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Work area: row 3 — Top streaks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mt-5">
          <section className="lg:col-span-12 bg-white rounded-2xl border border-[#eef0f4] shadow-[0_1px_3px_rgba(30,27,75,0.04)] p-5 sm:p-6">
            <CardHeader
              eyebrow="Streaks"
              eyebrowClass="text-[#ea580c]"
              title="Top streak"
              subtitle="Students with the most consistent learning pace"
              right={
                <button className="text-[12px] font-extrabold text-[#6366f1] hover:underline whitespace-nowrap">
                  View →
                </button>
              }
            />
            <div className="space-y-1">
              {loading && (
                <div className="text-xs text-center text-[#64748b] py-3">Loading...</div>
              )}
              {!loading && topStreaksRanked.length === 0 && (
                <div className="text-xs text-center text-[#64748b] py-3">No data yet</div>
              )}
              {topStreaksRanked.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#fffaf5] transition-colors"
                >
                  <div
                    className={`w-7 text-center text-sm font-black flex-none ${
                      s.rank === 1
                        ? "text-[#ea580c]"
                        : s.rank <= 3
                        ? "text-[#1e1b4b]"
                        : "text-[#94a3b8]"
                    }`}
                  >
                    #{s.rank}
                  </div>
                  <Avatar name={s.name} avatar={s.avatar} color={s.avatarColor} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#1e1b4b] truncate">{s.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-[#c2410c] font-extrabold text-sm flex-none border border-orange-100">
                    <span aria-hidden="true">🔥</span>
                    {s.streak}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const AVATAR_PALETTE = [
  "bg-[#6366f1]",
  "bg-[#06b6d4]",
  "bg-[#fb7185]",
  "bg-[#a855f7]",
  "bg-[#f59e0b]",
];

/* ----------------------------- Radar (inline SVG) ----------------------------- */
const RADAR_SIZE = 300;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = 100;
const AXIS_ANGLES = [-90, 0, 90, 180];
const RADAR_RINGS = [0.25, 0.5, 0.75, 1];
const RADAR_TICKS = [3, 5, 7, 9];

function polarPoint(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: RADAR_CENTER + radius * Math.cos(rad),
    y: RADAR_CENTER + radius * Math.sin(rad),
  };
}

const RadarChart = ({ axes, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-[340px] flex items-center justify-center text-[#64748b] text-sm">
        Loading...
      </div>
    );
  }

  const dataPoints = axes.map((axis, i) => {
    const r = (axis.value / axis.fullMark) * RADAR_RADIUS;
    return polarPoint(AXIS_ANGLES[i], r);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6 items-center">
      <div className="h-[340px] flex items-center justify-center">
        <svg
          width={RADAR_SIZE}
          height={RADAR_SIZE}
          viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
          className="max-w-full max-h-full"
          role="img"
          aria-label="IELTS 4-skill band score radar chart"
        >
          {/* Grid rings */}
          {RADAR_RINGS.map((ring) => {
            const pts = AXIS_ANGLES.map((a) => {
              const p = polarPoint(a, RADAR_RADIUS * ring);
              return `${p.x},${p.y}`;
            }).join(" ");
            return (
              <polygon
                key={ring}
                points={pts}
                fill={ring === 1 ? "#fafbff" : "none"}
                stroke="#e6e6ed"
                strokeWidth={1}
              />
            );
          })}

          {/* Target ring (dashed at 7.5/9) */}
          {(() => {
            const targetR = (7.5 / 9) * RADAR_RADIUS;
            const pts = AXIS_ANGLES.map((a) => {
              const p = polarPoint(a, targetR);
              return `${p.x},${p.y}`;
            }).join(" ");
            return (
              <polygon
                points={pts}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            );
          })()}

          {/* Spokes */}
          {AXIS_ANGLES.map((a) => {
            const p = polarPoint(a, RADAR_RADIUS);
            return (
              <line
                key={`spoke-${a}`}
                x1={RADAR_CENTER}
                y1={RADAR_CENTER}
                x2={p.x}
                y2={p.y}
                stroke="#eef0f4"
                strokeWidth={1}
              />
            );
          })}

          {/* Scale ticks */}
          {RADAR_TICKS.map((tick) => {
            const r = (tick / 9) * RADAR_RADIUS;
            const p = polarPoint(-90, r);
            return (
              <text
                key={`tick-${tick}`}
                x={p.x + 6}
                y={p.y + 4}
                fontSize="10"
                fontWeight="700"
                fill="#94a3b8"
              >
                {tick}
              </text>
            );
          })}

          {/* Data polygon */}
          <polygon
            points={dataPolygon}
            fill="#6366f1"
            fillOpacity={0.18}
            stroke="#6366f1"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* Data points + labels */}
          {axes.map((axis, i) => {
            const p = dataPoints[i];
            const labelPt = polarPoint(AXIS_ANGLES[i], RADAR_RADIUS + 22);
            let valueY = p.y - 10;
            let valueX = p.x;
            if (AXIS_ANGLES[i] === 0) {
              valueX = p.x + 12;
              valueY = p.y + 4;
            }
            if (AXIS_ANGLES[i] === 180) {
              valueX = p.x - 12;
              valueY = p.y + 4;
            }
            return (
              <g key={axis.label}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill="#6366f1"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                />
                <text
                  x={valueX}
                  y={valueY}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="900"
                  fill="#1e1b4b"
                  style={FONT_HEAD}
                >
                  {axis.value.toFixed(1)}
                </text>
                <text
                  x={labelPt.x}
                  y={labelPt.y + 4}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill="#475569"
                >
                  {axis.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Per-skill breakdown */}
      <div className="space-y-2.5">
        {axes.map((axis) => {
          const pct = (axis.value / 9) * 100;
          const target = 7.5;
          const delta = axis.value - target;
          return (
            <div
              key={axis.label}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-[#eef0f4]"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-[#6366f1] flex items-center justify-center font-extrabold text-sm flex-none">
                {axis.label[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-extrabold text-[#1e1b4b]">
                    {axis.label}
                  </span>
                  <span
                    className="text-lg font-black text-[#1e1b4b]"
                    style={FONT_HEAD}
                  >
                    {axis.value.toFixed(1)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 bg-[#f1f1f6] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      delta >= 0 ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div
                  className={`text-[10px] font-bold mt-1 ${
                    delta >= 0 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)} vs target
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherDashboard;
