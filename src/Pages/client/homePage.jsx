import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, message, Spin } from "antd";
import { motion } from "framer-motion";
import {
  getOverallScroreAPI,
  getRecomendedTestsAPI,
  getSkillOverviewAPI,
  getTestResultByIdUserAPI,
} from "@/services/apiStatistics";
import { getStreakAPI, userProfileAPI } from "@/services/apiUser";
import { getStudyPlanAPI } from "@/services/apiStudyPlanner";
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

const computeLessonStatuses = (tasks) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return [];
  const statuses = [];
  let firstIncompleteFound = false;
  for (const t of tasks) {
    if (t.completed) {
      statuses.push(firstIncompleteFound ? "locked" : "done");
    } else {
      if (!firstIncompleteFound) {
        statuses.push("current");
        firstIncompleteFound = true;
      } else {
        statuses.push("locked");
      }
    }
  }
  return statuses;
};

// --- MAIN COMPONENT ---
const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const idUser = user?.idUser;

  // --- Data states ---
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(null);
  const [skillOverview, setSkillOverview] = useState(null);
  const [overall, setOverall] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [history, setHistory] = useState([]);

  // --- UI states ---
  const [loading, setLoading] = useState(true);
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
  const [selectedExamToStart, setSelectedExamToStart] = useState(null);
  const [startingTest, setStartingTest] = useState(false);

  // --- API CALLS ---
  useEffect(() => {
    if (!idUser) return;
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        userProfileAPI(idUser).catch(() => null),
        getStreakAPI(idUser).catch(() => null),
        getSkillOverviewAPI(idUser).catch(() => null),
        getOverallScroreAPI(idUser).catch(() => null),
        getStudyPlanAPI(idUser).catch(() => null),
        getRecomendedTestsAPI(idUser).catch(() => null),
        getTestResultByIdUserAPI(idUser).catch(() => null),
      ]);
      if (cancelled) return;
      const [rProfile, rStreak, rSkill, rOverall, rDaily, rRec, rHist] = results;
      if (rProfile.status === "fulfilled" && rProfile.value?.data) {
        setProfile(rProfile.value.data);
      } else if (user) {
        setProfile({ nameUser: user.nameUser, avatar: user.avatar });
      }
      if (rStreak.status === "fulfilled" && rStreak.value?.data) {
        setStreak(rStreak.value.data);
      }
      if (rSkill.status === "fulfilled" && rSkill.value?.data) {
        setSkillOverview(rSkill.value.data);
      }
      if (rOverall.status === "fulfilled" && rOverall.value) {
        setOverall(rOverall.value);
      }
      if (rDaily.status === "fulfilled") {
        const tasks = rDaily.value?.dailyTasks ?? rDaily.value?.data?.dailyTasks ?? [];
        setTodayTasks(Array.isArray(tasks) ? tasks : []);
      }
      if (rRec.status === "fulfilled" && rRec.value) {
        const rec = Array.isArray(rRec.value) ? rRec.value : rRec.value?.data ?? [];
        setRecommended(Array.isArray(rec) ? rec : []);
      }
      if (rHist.status === "fulfilled") {
        const hist = rHist.value?.data ?? rHist.value ?? [];
        setHistory(Array.isArray(hist) ? hist : []);
      }
      setLoading(false);
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [idUser, user?.nameUser, user?.avatar]);

  // --- Derived ---
  const greetingName = profile?.nameUser || user?.nameUser || user?.email?.split("@")[0] || "bạn";
  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;

  const todayStatuses = useMemo(() => computeLessonStatuses(todayTasks), [todayTasks]);
  const remainingToday = useMemo(
    () => todayTasks.filter((t) => !t.completed).length,
    [todayTasks],
  );
  const recommendedSlice = useMemo(() => recommended.slice(0, 3), [recommended]);
  const historySlice = useMemo(() => history.slice(0, 4), [history]);

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

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center text-purple-600 bg-[#fafafc]">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-[#fafafc]">
      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* --- HERO --- */}
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
                  Bạn đã giữ streak{" "}
                  <strong>{currentStreak} ngày</strong> liên tục.{" "}
                  {remainingToday > 0
                    ? `Còn ${remainingToday} lesson nữa là hoàn thành mục tiêu hôm nay.`
                    : "Bạn đã hoàn thành mục tiêu hôm nay!"}
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

          {/* --- 4 SKILLS --- */}
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
                onClick={() => navigate("/statistic")}
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
                    target={skill?.targetBand ?? 7.0}
                    color={s.color}
                    accent={s.accent}
                  />
                );
              })}
            </div>
          </section>

          {/* --- TODAY PLAN --- */}
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
              {todayTasks.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#eef2ff] text-[#4338ca] font-extrabold text-xs border-2 border-[#a5b4fc]">
                  <span>⏱</span>{" "}
                  {todayTasks.filter((t) => t.completed).length} / {todayTasks.length}
                </div>
              )}
            </div>

            {todayTasks.length === 0 ? (
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
                {todayTasks.map((t, i) => {
                  const status = todayStatuses[i] || "locked";
                  const badges = { done: "✓ Done", current: "Đang làm", locked: "Chờ" };
                  return (
                    <LessonRow
                      key={t.id ?? i}
                      icon={
                        t.skill === "reading"
                          ? "📖"
                          : t.skill === "listening"
                            ? "🎧"
                            : t.skill === "writing"
                              ? "✍️"
                              : t.skill === "speaking"
                                ? "🎤"
                                : "📚"
                      }
                      title={t.title || t.name || `Lesson ${i + 1}`}
                      sub={
                        t.durationMinutes
                          ? `${t.durationMinutes} phút`
                          : t.description || ""
                      }
                      status={status}
                      badge={badges[status]}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* --- RECOMMENDED --- */}
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

            {recommendedSlice.length === 0 ? (
              <div className="text-sm text-[#64748b] bg-white rounded-2xl border-2 border-[#e6e6ed] p-5">
                Chưa có đề xuất nào.
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-3">
                {recommendedSlice.map((t, i) => {
                  const meta =
                    ACTIVITY_META[t.testType] || ACTIVITY_META.READING;
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
                        onClick={() => handleRecommendClick(t)}
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

          {/* --- RECENT ACTIVITY --- */}
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
            {historySlice.length === 0 ? (
              <p className="text-sm text-[#64748b]">Chưa có hoạt động nào.</p>
            ) : (
              <div className="space-y-3">
                {historySlice.map((a, i) => {
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
        </div>

        {/* --- RIGHT RAIL --- */}
        <aside className="space-y-4 lg:sticky lg:top-[78px] lg:self-start">
          {/* Streak widget */}
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

          {/* Owl tip */}
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
        </aside>
      </main>

      {/* --- START-TEST MODAL --- */}
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
