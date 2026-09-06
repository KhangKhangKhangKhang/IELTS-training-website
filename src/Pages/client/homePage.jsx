import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, message } from "antd";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getRecomendedTestsAPI,
  getSkillOverviewAPI,
  getTestResultByIdUserAPI,
} from "@/services/apiStatistics";
import { getGrammarDashboardAPI } from "@/services/apiGrammar";
import { getStreakAPI, userProfileAPI } from "@/services/apiUser";
import { getStudyPlanAPI, getDailyCompletionAPI } from "@/services/apiStudyPlanner";
import { StartTestAPI } from "@/services/apiDoTest";
import { useAuth } from "@/context/authContext";

// --- LessonRow (MagicPath style) ---
function LessonRow({ icon, title, sub, status, badge }) {
  const colors = {
    done: "bg-[#10b981] shadow-[0_3px_0_#047857]",
    current: "bg-[#6366f1] shadow-[0_3px_0_#4338ca] ring-4 ring-[#6366f1]/20",
    locked: "bg-[#cbd5e1] shadow-[0_3px_0_#94a3b8]",
  };
  return (
    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1] cursor-pointer transition-colors">
      <div
        className={`${colors[status]} w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-none`}
      >
        {status === "locked" ? "🔒" : icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-[#1e1b4b] text-sm truncate">
          {title}
        </div>
        <div className="text-xs text-[#64748b] truncate">{sub}</div>
      </div>
      {badge && (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
            status === "done"
              ? "bg-[#d1fae5] text-[#047857]"
              : status === "current"
                ? "bg-[#eef2ff] text-[#4338ca]"
                : "bg-[#f1f1f6] text-[#64748b]"
          }`}
        >
          {badge}
        </span>
      )}
      <span className="text-[#64748b] text-lg">→</span>
    </div>
  );
}

// --- SkillCard (MagicPath style, lessons dropped per plan) ---
function SkillCard({ icon, name, band, target, color, accent }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] hover:shadow-[0_5px_0_#e6e6ed] hover:border-[#6366f1]/40 p-5 cursor-pointer transition-all overflow-hidden"
    >
      <div
        className={`absolute -top-12 -right-12 w-40 h-40 ${accent} rounded-full opacity-20 blur-2xl`}
      />
      <div className="relative">
        <div
          className={`w-12 h-12 rounded-2xl ${color} shadow-[0_3px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-2xl mb-3`}
        >
          {icon}
        </div>
        <h3
          className="text-lg font-black text-[#1e1b4b] mb-1"
          style={{ fontFamily: "Nunito" }}
        >
          {name}
        </h3>
        <div className="text-xs text-[#64748b] mb-3">
          Mục tiêu: {target != null ? target.toFixed(1) : "—"}
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span
            className="text-3xl font-black text-[#1e1b4b]"
            style={{ fontFamily: "Nunito" }}
          >
            {band == null ? "—" : band.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-[#64748b]">band hiện tại</span>
        </div>
        <div className="h-2 bg-[#f1f1f6] rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full`}
            style={{
              width: `${
                band != null && target
                  ? Math.min(100, (band / target) * 100)
                  : 0
              }%`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// --- Helpers ---
const SKILL_CARDS = [
  { key: "reading", icon: "📖", name: "Reading", color: "bg-[#6366f1]", accent: "bg-[#6366f1]" },
  { key: "listening", icon: "🎧", name: "Listening", color: "bg-[#06b6d4]", accent: "bg-[#06b6d4]" },
  { key: "writing", icon: "✍️", name: "Writing", color: "bg-[#fb7185]", accent: "bg-[#fb7185]" },
  { key: "speaking", icon: "🎤", name: "Speaking", color: "bg-[#a855f7]", accent: "bg-[#a855f7]" },
];

const ACTIVITY_META = {
  READING: { icon: "📖", color: "bg-[#6366f1]" },
  LISTENING: { icon: "🎧", color: "bg-[#06b6d4]" },
  WRITING: { icon: "✍️", color: "bg-[#fb7185]" },
  SPEAKING: { icon: "🎤", color: "bg-[#a855f7]" },
};

const formatGreeting = (now = new Date()) => {
  const h = now.getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

const formatActivityTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Hôm qua";
  if (diffD < 7) return `${diffD} ngày trước`;
  return d.toLocaleDateString("vi-VN");
};

// --- PROGRESSIVE SECTIONS ---
// Each section fetches its own data and renders its own skeleton.
// Sections mount in parallel; the page becomes interactive as each
// section resolves independently. No global Promise.allSettled.

function HeroSection({ idUser, fallbackName }) {
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!idUser) return undefined;
    let cancelled = false;
    (async () => {
      const [rProfile, rStreak] = await Promise.allSettled([
        userProfileAPI(idUser).catch(() => null),
        getStreakAPI(idUser).catch(() => null),
      ]);
      if (cancelled) return;
      const p = rProfile.status === "fulfilled" ? rProfile.value?.data : null;
      setProfile(p || (fallbackName ? { nameUser: fallbackName } : null));
      if (rStreak.status === "fulfilled" && rStreak.value?.data) {
        setStreak(rStreak.value.data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [idUser, fallbackName]);

  const greetingName =
    profile?.nameUser || fallbackName || "bạn";
  const currentStreak = streak?.currentStreak ?? 0;

  if (loading) {
    return <Skeleton className="h-44 rounded-3xl" />;
  }

  return (
    <section className="relative bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#fb7185] rounded-3xl p-7 text-white overflow-hidden shadow-[0_4px_0_#4338ca]">
      <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-90 mb-1">
            {formatGreeting()}, {greetingName} 🌞
          </div>
          <h1
            className="text-3xl font-black mb-2"
            style={{ fontFamily: "Nunito" }}
          >
            Hôm nay học gì nào?
          </h1>
          <p className="opacity-90 text-sm mb-4 max-w-md">
            Bạn đã giữ streak <strong>{currentStreak} ngày</strong> liên tục.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => navigate("/study-planner")}
              className="bg-white text-[#4338ca] px-5 py-2.5 rounded-2xl font-extrabold uppercase tracking-wide text-sm shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-all"
            >
              ▶ Tiếp tục lesson
            </button>
            <button
              onClick={() => navigate("/study-planner")}
              className="bg-white/15 backdrop-blur text-white px-5 py-2.5 rounded-2xl font-extrabold uppercase tracking-wide text-sm border-2 border-white/30 hover:bg-white/25 transition-all"
            >
              Xem lộ trình
            </button>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="text-8xl">🦉</div>
        </div>
      </div>
    </section>
  );
}

function SkillsSection({ idUser }) {
  const [skillOverview, setSkillOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!idUser) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await getSkillOverviewAPI(idUser);
        if (!cancelled) setSkillOverview(res?.data ?? null);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idUser]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-xl font-black text-[#1e1b4b]"
            style={{ fontFamily: "Nunito" }}
          >
            4 kỹ năng của bạn
          </h2>
          <div className="text-xs text-[#64748b]">
            Điểm trung bình theo các bài test đã hoàn thành
          </div>
        </div>
        <button
          onClick={() => navigate("/weakness")}
          className="text-xs font-bold text-[#6366f1] hover:underline"
        >
          Chi tiết →
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SKILL_CARDS.map((s) => {
          const skill = skillOverview?.[s.key];
          return (
            <SkillCard
              key={s.key}
              icon={s.icon}
              name={s.name}
              band={skill?.currentBand ?? null}
              target={skill?.targetBand ?? null}
              color={s.color}
              accent={s.accent}
            />
          );
        })}
      </div>
    </section>
  );
}

function TodayPlanSection({ idUser }) {
  const [tasks, setTasks] = useState([]);
  const [completionMap, setCompletionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!idUser) return undefined;
    let cancelled = false;
    (async () => {
      const [rPlan, rCompletion] = await Promise.allSettled([
        getStudyPlanAPI(idUser).catch(() => null),
        getDailyCompletionAPI(idUser).catch(() => null),
      ]);
      if (cancelled) return;
      if (rPlan.status === "fulfilled") {
        const v = rPlan.value;
        const list = v?.dailyTasks ?? v?.data?.dailyTasks ?? [];
        setTasks(Array.isArray(list) ? list : []);
      }
      if (rCompletion.status === "fulfilled" && rCompletion.value?.tasks) {
        setCompletionMap(rCompletion.value.tasks);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [idUser]);

  const isTaskCompleted = (t) =>
    completionMap?.[t.type]?.completed === true;
  const completedCount = tasks.filter(isTaskCompleted).length;

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-3/4 rounded-2xl" />
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1]">
            Hôm nay · {new Date().toLocaleDateString("vi-VN")}
          </div>
          <h2
            className="text-xl font-black text-[#1e1b4b]"
            style={{ fontFamily: "Nunito" }}
          >
            Kế hoạch học hôm nay
          </h2>
        </div>
        {tasks.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#eef2ff] text-[#4338ca] font-extrabold text-xs border-2 border-[#a5b4fc]">
            <span>⏱</span> {completedCount} / {tasks.length}
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-sm text-[#64748b] mb-3">
            Chưa có kế hoạch hôm nay.
          </p>
          <button
            onClick={() => navigate("/study-planner")}
            className="px-4 py-2 rounded-xl bg-[#eef2ff] text-[#4338ca] font-extrabold text-xs uppercase tracking-wide hover:bg-[#e0e7ff] transition-all"
          >
            Tạo lộ trình →
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((t, i) => {
            const completed = isTaskCompleted(t);
            const lessonIcon = (() => {
              const k = (t.type || t.skill)?.toLowerCase();
              if (k === "reading") return "📖";
              if (k === "listening") return "🎧";
              if (k === "writing") return "✍️";
              if (k === "speaking") return "🎤";
              if (k === "grammar") return "📝";
              return "📚";
            })();
            return (
              <LessonRow
                key={t.id ?? i}
                icon={lessonIcon}
                title={t.name || t.title || `Lesson ${i + 1}`}
                sub={
                  t.estimatedMinutes ?? t.durationMinutes
                    ? `${t.estimatedMinutes ?? t.durationMinutes} phút`
                    : t.description || ""
                }
                status={completed ? "done" : "current"}
                badge={completed ? "✓ Hoàn thành" : "Chưa làm"}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function WeaknessSection({ idUser }) {
  const [grammar, setGrammar] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!idUser) return undefined;
    let cancelled = false;
    (async () => {
      const [rG] = await Promise.allSettled([
        getGrammarDashboardAPI(idUser).catch(() => null),
      ]);
      if (cancelled) return;
      if (rG.status === "fulfilled" && rG.value) {
        const dash = rG.value;
        const weakAreas = Array.isArray(dash?.weakAreas)
          ? dash.weakAreas
          : Array.isArray(dash)
            ? dash
            : [];
        setGrammar(weakAreas.slice(0, 3));
        // localStorage write deferred — don't block render
        queueMicrotask(() => {
          try {
            localStorage.setItem("grammarDashboard", JSON.stringify(dash));
          } catch (_) {
            // ignore
          }
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [idUser]);

  // Listen for test-submitted → refetch weakness data
  useEffect(() => {
    if (!idUser) return undefined;
    const onTestSubmitted = () => {
      getGrammarDashboardAPI(idUser)
        .catch(() => null)
        .then((dash) => {
          if (!dash) return;
          const weakAreas = Array.isArray(dash?.weakAreas)
            ? dash.weakAreas
            : Array.isArray(dash)
              ? dash
              : [];
          setGrammar(weakAreas.slice(0, 3));
        });
    };
    window.addEventListener("test-submitted", onTestSubmitted);
    return () => window.removeEventListener("test-submitted", onTestSubmitted);
  }, [idUser]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (grammar.length === 0) return null;

  return (
    <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#fb7185]">
            ⚠️ Cần cải thiện
          </div>
          <h2
            className="text-xl font-black text-[#1e1b4b]"
            style={{ fontFamily: "Nunito" }}
          >
            Điểm yếu của bạn
          </h2>
        </div>
        <button
          onClick={() => navigate("/weakness")}
          className="text-xs font-bold text-[#6366f1] hover:underline"
        >
          Xem tất cả →
        </button>
      </div>
      <div>
        <h3 className="text-xs font-extrabold text-[#64748b] mb-2 uppercase tracking-wider">
          📚 Ngữ pháp
        </h3>
        {grammar.length === 0 ? (
          <p className="text-sm text-[#64748b] p-2.5">Chưa có dữ liệu.</p>
        ) : (
          <ul className="space-y-2">
            {grammar.map((item, idx) => {
              const title = item.title || item.name || "Grammar";
              const errCount =
                item.violations ?? item.wrongCount ?? item.exercisesWrong ?? 0;
              return (
                <li
                  key={item.idGrammar || idx}
                  className="p-2.5 bg-red-50 rounded-xl flex justify-between items-center border border-red-100"
                >
                  <span className="text-sm font-bold text-[#1e1b4b] truncate flex-1 min-w-0">
                    {title}
                  </span>
                  <span className="text-xs text-red-600 font-extrabold ml-2 flex-none">
                    {errCount} lỗi
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function RecommendedSection({ idUser, onStartTest }) {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idUser) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await getRecomendedTestsAPI(idUser);
        if (!cancelled) {
          const rec = Array.isArray(res) ? res : res?.data ?? [];
          setRecommended(Array.isArray(rec) ? rec.slice(0, 3) : []);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idUser]);

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#fb7185]">
            🎯 Đề xuất cho bạn
          </div>
          <h2
            className="text-xl font-black text-[#1e1b4b]"
            style={{ fontFamily: "Nunito" }}
          >
            Test phù hợp band hiện tại
          </h2>
        </div>
      </div>

      {recommended.length === 0 ? (
        <div className="text-sm text-[#64748b] bg-white rounded-2xl border-2 border-[#e6e6ed] p-5">
          Chưa có đề xuất nào.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-3">
          {recommended.map((t, i) => {
            const meta = ACTIVITY_META[t.testType] || ACTIVITY_META.READING;
            return (
              <motion.div
                key={t.idTest ?? i}
                whileHover={{ y: -3 }}
                className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] hover:border-[#6366f1]/30 hover:shadow-[0_5px_0_#e6e6ed] p-5 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${meta.color} shadow-[0_3px_0_rgba(0,0,0,0.15)] text-white flex items-center justify-center text-lg`}
                  >
                    {meta.icon}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide bg-[#f1f1f6] text-[#64748b] px-2 py-0.5 rounded-full">
                    {t.level || "—"}
                  </span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-1">
                  {t.testType || ""}
                </div>
                <h3 className="font-extrabold text-[#1e1b4b] mb-3">
                  {t.title || `Test ${i + 1}`}
                </h3>
                <div className="flex items-center gap-3 text-xs text-[#64748b] mb-3">
                  <span>⏱ {t.duration ? `${t.duration} phút` : "—"}</span>
                </div>
                <button
                  onClick={() => onStartTest?.(t)}
                  className="w-full py-2 rounded-xl bg-[#eef2ff] text-[#4338ca] font-extrabold text-xs uppercase tracking-wide hover:bg-[#e0e7ff] transition-all"
                >
                  Bắt đầu →
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecentActivitySection({ idUser }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!idUser) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await getTestResultByIdUserAPI(idUser);
        if (!cancelled) {
          const hist = res?.data ?? res ?? [];
          setHistory(Array.isArray(hist) ? hist.slice(0, 4) : []);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idUser]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5 space-y-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-black text-[#1e1b4b]"
          style={{ fontFamily: "Nunito" }}
        >
          Hoạt động gần đây
        </h2>
        <button
          onClick={() => navigate("/test")}
          className="text-xs font-bold text-[#6366f1] hover:underline"
        >
          Xem tất cả →
        </button>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-[#64748b]">Chưa có hoạt động nào.</p>
      ) : (
        <div className="space-y-3">
          {history.map((a, i) => {
            const meta =
              ACTIVITY_META[a.test?.testType] || {
                icon: "📝",
                color: "bg-[#6366f1]",
              };
            return (
              <div
                key={a.idTestResult ?? i}
                className="flex items-center gap-3 py-2 border-b border-[#f1f1f6] last:border-0"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${meta.color} text-white shadow-[0_2px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-base`}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-sm text-[#1e1b4b] truncate">
                    {a.test?.title || `Test ${a.test?.testType || ""}`}
                  </div>
                  <div className="text-xs text-[#64748b]">
                    Band {a.bandScore?.toFixed?.(1) ?? "—"} ·{" "}
                    {a.totalCorrect ?? 0}/{a.totalQuestions ?? 0} đúng
                  </div>
                </div>
                <div className="text-xs text-[#94a3b8] flex-none">
                  {formatActivityTime(a.finishedAt || a.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StreakSidebar({ idUser }) {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idUser) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await getStreakAPI(idUser);
        if (!cancelled) setStreak(res?.data ?? null);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idUser]);

  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;

  if (loading) {
    return (
      <>
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-[#fb7185] via-[#f59e0b] to-[#fbbf24] rounded-3xl shadow-[0_4px_0_#b45309] text-white p-5 overflow-hidden relative">
        <div className="absolute -top-6 -right-6 text-9xl opacity-20">🔥</div>
        <div className="relative">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-90 mb-1">
            Streak hiện tại
          </div>
          <div
            className="text-5xl font-black mb-1"
            style={{ fontFamily: "Nunito" }}
          >
            {currentStreak} 🔥
          </div>
          <div className="text-xs opacity-90 mb-2">
            {longestStreak > 0
              ? `Kỷ lục: ${longestStreak} ngày · Tiếp tục để phá kỷ lục`
              : "Hãy học mỗi ngày để giữ streak!"}
          </div>
        </div>
      </div>

      <div className="bg-[#eef2ff] border-2 border-[#a5b4fc] rounded-3xl p-4 flex gap-3">
        <div className="text-3xl flex-none">🦉</div>
        <div>
          <div className="text-xs font-extrabold text-[#4338ca] mb-1">
            Mẹo từ Owl
          </div>
          <div className="text-xs text-[#1e1b4b] leading-relaxed">
            Học 25 phút mỗi ngày hiệu quả hơn 3 giờ cuối tuần. Giữ thói quen!
          </div>
        </div>
      </div>
    </>
  );
}

// --- MAIN COMPONENT ---
const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const idUser = user?.idUser;

  // Modal state (cross-section: only RecommendedSection needs to open it)
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
  const [selectedExamToStart, setSelectedExamToStart] = useState(null);
  const [startingTest, setStartingTest] = useState(false);

  const handleRecommendClick = (test) => {
    setSelectedExamToStart(test);
    setConfirmStartOpen(true);
  };

  const handleConfirmStart = async () => {
    if (!idUser || !selectedExamToStart) return;
    setStartingTest(true);
    try {
      const res = await StartTestAPI(idUser, selectedExamToStart.idTest, {});
      const testResultData = res?.data;
      if (testResultData?.idTestResult) {
        message.success("Bắt đầu làm bài!");
        setConfirmStartOpen(false);
        navigate("/doTest", {
          state: {
            idTest: selectedExamToStart.idTest,
            testType: selectedExamToStart.testType,
            duration: selectedExamToStart.duration,
            initialTestResult: testResultData,
          },
        });
      } else {
        message.error("Không khởi tạo được bài thi.");
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi bắt đầu bài thi.");
    } finally {
      setStartingTest(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fafafc]">
      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <HeroSection idUser={idUser} fallbackName={user?.nameUser} />
          <SkillsSection idUser={idUser} />
          <TodayPlanSection idUser={idUser} />
          <WeaknessSection idUser={idUser} />
          <RecommendedSection idUser={idUser} onStartTest={handleRecommendClick} />
          <RecentActivitySection idUser={idUser} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[78px] lg:self-start">
          <StreakSidebar idUser={idUser} />
        </aside>
      </main>

      <Modal
        title="Xác nhận làm bài"
        open={confirmStartOpen}
        onOk={handleConfirmStart}
        onCancel={() => setConfirmStartOpen(false)}
        confirmLoading={startingTest}
        okText="Bắt đầu ngay"
        cancelText="Để sau"
        okButtonProps={{ className: "bg-[#6366f1] hover:opacity-90" }}
      >
        <p>
          Bạn có muốn bắt đầu làm đề thi được đề xuất:{" "}
          <strong>{selectedExamToStart?.title}</strong>?
        </p>
        <div className="bg-[#eef2ff] text-[#4338ca] p-3 rounded mt-3 text-sm">
          <p>
            • Thời gian: <strong>{selectedExamToStart?.duration} phút</strong>
          </p>
          <p>• Kỹ năng: {selectedExamToStart?.testType}</p>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;