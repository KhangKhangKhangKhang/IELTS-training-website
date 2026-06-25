import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/authContext";
import { getStudyPlanAPI, getDailyCompletionAPI, completeTaskAPI } from "@/services/apiStudyPlanner";
import { Target, CheckCircle, BookOpen, Headphones, PenTool, Mic, Clock, Calendar, TrendingUp, AlertTriangle, Sparkles, Flame } from "lucide-react";
import { Progress } from "antd";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

// === Skill meta (icon emoji + color) — đồng bộ homePage ===
const SKILL_META = {
  READING: { icon: "📖", label: "Đọc", color: "bg-[#6366f1]" },
  LISTENING: { icon: "🎧", label: "Nghe", color: "bg-[#06b6d4]" },
  WRITING: { icon: "✍️", label: "Viết", color: "bg-[#fb7185]" },
  SPEAKING: { icon: "🎤", label: "Nói", color: "bg-[#a855f7]" },
  VOCABULARY: { icon: "📚", label: "Từ vựng", color: "bg-[#8b5cf6]" },
  GRAMMAR: { icon: "📝", label: "Ngữ pháp", color: "bg-[#f59e0b]" },
};

const SKILL_KEYS = ["READING", "LISTENING", "WRITING", "SPEAKING"];

const STAGE_META = {
  FOUNDATION: { label: "Nền tảng", icon: "🌱", color: "from-[#10b981] to-[#059669]" },
  SKILL_BUILDING: { label: "Rèn luyện", icon: "🎯", color: "from-[#6366f1] to-[#a855f7]" },
  INTEGRATION: { label: "Tích hợp", icon: "🧩", color: "from-[#f59e0b] to-[#d97706]" },
  EXAM_PREP: { label: "Luyện thi", icon: "🏆", color: "from-[#fb7185] to-[#e11d48]" },
};

// === Route by task.type (FE defensive — không tin BE route vì BE /doTest cần state) ===
const TASK_ROUTE_BY_TYPE = {
  GRAMMAR: "/grammar",
  VOCABULARY: "/vocabulary",
  READING: "/test",
  LISTENING: "/test",
  WRITING: "/test",
  SPEAKING: "/test",
};

// === Reusable lesson row (MagicPath) ===
function TaskRow({ task, onClick, onToggle, completed }) {
  const meta = SKILL_META[task.type] || { icon: "📚", label: task.type || "Khác", color: "bg-[#6366f1]" };
  const badge = completed
    ? { label: "✓ Hoàn thành", tone: "bg-[#d1fae5] text-[#047857]" }
    : { label: "Chưa làm", tone: "bg-[#f1f1f6] text-[#64748b]" };
  return (
    <div
      onClick={() => onClick(task)}
      className={`flex items-center gap-3 bg-white p-3 rounded-2xl border-2 transition-all cursor-pointer ${
        completed
          ? "border-[#d1fae5] bg-[#f0fdf4]"
          : "border-[#e6e6ed] hover:border-[#6366f1]/40 hover:shadow-[0_3px_0_#e6e6ed]"
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-none shadow-[0_3px_0_rgba(0,0,0,0.15)] transition-all ${
          completed ? "bg-[#10b981] shadow-[0_3px_0_#047857]" : `${meta.color}`
        }`}
      >
        {completed ? <CheckCircle className="w-6 h-6 text-white" /> : meta.icon}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`font-extrabold text-sm truncate ${completed ? "text-[#64748b] line-through" : "text-[#1e1b4b]"}`}>
          {task.name || "Bài tập"}
        </div>
        {task.description && (
          <div className="text-xs text-[#64748b] truncate">
            {task.description}
          </div>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {task.estimatedMinutes != null && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
              ⏱ {task.estimatedMinutes}p
            </span>
          )}
          {task.difficulty && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
              · {task.difficulty}
            </span>
          )}
        </div>
      </div>
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${badge.tone}`}>
        {badge.label}
      </span>
      {!completed && (
        <button
          onClick={(e) => { e.stopPropagation(); onClick(task); }}
          className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-[#eef2ff] text-[#4338ca] font-extrabold text-[10px] uppercase tracking-wide hover:bg-[#e0e7ff] transition-all"
        >
          Làm ngay →
        </button>
      )}
    </div>
  );
}

// === Stat card mini ===
function MiniStat({ icon, value, label, tone, loading }) {
  return (
    <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-4 flex flex-col items-center text-center">
      <div className={`w-10 h-10 rounded-xl ${tone} flex items-center justify-center text-base font-black mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-black text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
        {loading ? "..." : (value ?? "—")}
      </div>
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] mt-0.5">
        {label}
      </div>
    </div>
  );
}

const EmptyState = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="w-12 h-12 bg-[#f1f1f6] rounded-full flex items-center justify-center mb-3 text-xl">
      {icon}
    </div>
    <p className="text-sm text-[#1e1b4b] font-extrabold" style={{ fontFamily: "Nunito, sans-serif" }}>{title}</p>
    {subtitle && <p className="text-xs text-[#64748b] mt-1">{subtitle}</p>}
  </div>
);

// === Day chip for weekly preview ===
function DayChip({ day, tasksCount, completedCount, isToday, isPast }) {
  const pct = tasksCount ? Math.round((completedCount / tasksCount) * 100) : 0;
  return (
    <div
      className={`relative rounded-2xl border-2 p-2 flex flex-col items-center justify-center text-center transition-all ${
        isToday
          ? "border-[#6366f1] bg-[#eef2ff] shadow-[0_3px_0_#4338ca]"
          : isPast && pct === 100
          ? "border-[#10b981] bg-[#d1fae5]"
          : "border-[#e6e6ed] bg-white"
      }`}
    >
      <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#64748b]">
        {day.weekday}
      </div>
      <div className="text-base font-black text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
        {day.dayNum}
      </div>
      <div className={`text-[10px] font-extrabold mt-0.5 ${
        isToday ? "text-[#4338ca]" : pct === 100 ? "text-[#047857]" : "text-[#64748b]"
      }`}>
        {tasksCount > 0 ? `${completedCount}/${tasksCount}` : "—"}
      </div>
      {pct === 100 && tasksCount > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#10b981] text-white text-[10px] flex items-center justify-center">✓</div>
      )}
    </div>
  );
}

// Hook chung: gọi getStudyPlanAPI cho 1 user, trả về data + loading + reload()
function useStudyPlan(idUser) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const reload = async () => {
    if (!idUser) return;
    setLoading(true);
    try {
      const data = await getStudyPlanAPI(idUser);
      setPlan(data);
    } catch (err) {
      console.error("Failed to fetch study plan:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUser]);
  return { plan, loading, reload };
}

// Context share plan xuống các sub-component để tránh duplicate fetch
const PlanContext = React.createContext(null);
function usePlanContext() {
  return useContext(PlanContext);
}

// === PROGRESSIVE SECTIONS ===

function PlanHeroSection() {
  const { plan, loading } = usePlanContext();
  const navigate = useNavigate();
  if (loading) return <Skeleton className="h-44 rounded-3xl" />;
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#fb7185] rounded-3xl p-6 sm:p-7 text-white shadow-[0_4px_0_#4338ca]">
      <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      <div className="relative flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-90 mb-1">
            🎯 Lộ trình cá nhân
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>
            Lộ trình học của bạn
          </h1>
          <p className="opacity-90 text-sm mb-4 max-w-md">
            {plan?.stageTheme || "Cá nhân hóa theo mục tiêu và tiến độ của bạn"}
            {plan?.daysUntilExam != null && (
              <> · Còn <strong>{plan.daysUntilExam} ngày</strong> đến kỳ thi</>
            )}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => navigate("/weakness")}
              className="bg-white/15 backdrop-blur text-white px-4 py-2 rounded-2xl font-extrabold uppercase tracking-wide text-xs border-2 border-white/30 hover:bg-white/25 transition-all"
            >
              Xem điểm yếu
            </button>
          </div>
        </div>
        <div className="hidden md:block text-7xl lg:text-8xl flex-none">🧭</div>
      </div>
    </section>
  );
}

function MissingSkillsAlert() {
  const { plan, loading } = usePlanContext();
  if (loading) return null;
  if (!plan?.missingSkills?.length) return null;
  return (
    <section className="bg-[#fff7ed] border-2 border-[#fdba74] rounded-3xl shadow-[0_3px_0_#fdba74] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#f59e0b] text-white flex items-center justify-center text-base shadow-[0_2px_0_#b45309]">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309]">
            ⚠️ Cần đánh giá
          </div>
          <div className="text-sm font-extrabold text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
            Kỹ năng chưa được đánh giá
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {plan.missingSkills.map((skill) => {
          const meta = SKILL_META[skill];
          return (
            <span
              key={skill}
              className="px-3 py-1.5 rounded-full bg-white text-xs font-extrabold text-[#1e1b4b] border-2 border-[#fdba74] flex items-center gap-1.5"
            >
              <span>{meta?.icon || "📚"}</span>
              {meta?.label || skill}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function StatsRowSection({ dailyTasks, completionMap }) {
  const isTaskCompleted = (t) => completionMap?.[t.type]?.completed === true;
  const completedCount = dailyTasks.filter(isTaskCompleted).length;
  const totalMinutes = dailyTasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
  const remainingMinutes = dailyTasks
    .filter((t) => !isTaskCompleted(t))
    .reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
  const progressPercent = dailyTasks.length ? Math.round((completedCount / dailyTasks.length) * 100) : 0;
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MiniStat icon="📋" value={dailyTasks.length} label="Tổng task" tone="bg-[#eef2ff] text-[#4338ca]" loading={false} />
      <MiniStat icon="✓" value={completedCount} label="Hoàn thành" tone="bg-[#d1fae5] text-[#047857]" loading={false} />
      <MiniStat icon="📈" value={`${progressPercent}%`} label="Tiến độ" tone="bg-[#fef3c7] text-[#b45309]" loading={false} />
      <MiniStat
        icon="⏱"
        value={remainingMinutes > 0 ? `${remainingMinutes}p` : (totalMinutes > 0 ? "✓" : "—")}
        label="Còn lại"
        tone="bg-[#fce7f3] text-[#be185d]"
        loading={false}
      />
    </section>
  );
}

function ProgressBarSection({ dailyTasks, completionMap }) {
  const isTaskCompleted = (t) => completionMap?.[t.type]?.completed === true;
  const completedCount = dailyTasks.filter(isTaskCompleted).length;
  const progressPercent = dailyTasks.length ? Math.round((completedCount / dailyTasks.length) * 100) : 0;
  return (
    <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1]">
            📅 Hôm nay · {new Date().toLocaleDateString("vi-VN")}
          </div>
          <h2 className="text-xl font-black text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
            Tiến độ hôm nay
          </h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#eef2ff] text-[#4338ca] font-extrabold text-xs border-2 border-[#a5b4fc]">
          <span>⏱</span> {completedCount} / {dailyTasks.length || 0}
        </div>
      </div>
      <div className="h-3 bg-[#f1f1f6] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-[#64748b]">
        <span>0%</span>
        <span className="font-extrabold text-[#4338ca]">{progressPercent}%</span>
        <span>100%</span>
      </div>
    </section>
  );
}

function StageCardSection() {
  const { plan, loading } = usePlanContext();
  if (loading) {
    return <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5 space-y-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-16 w-full" /></div>;
  }
  const stage = plan?.currentStage ? STAGE_META[plan.currentStage] : null;
  const stageProgressPct = plan?.stageProgress?.stageProgressPercent ?? 0;
  return (
    <section className="relative overflow-hidden bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#a855f7]">
            🚦 Giai đoạn hiện tại
          </div>
          <h2 className="text-xl font-black text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
            {stage ? stage.label : "Chưa xác định"}
          </h2>
        </div>
        {stage && (
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stage.color} text-white shadow-[0_3px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-2xl`}>
            {stage.icon}
          </div>
        )}
      </div>
      {plan?.stageThemeDescription && (
        <p className="text-sm text-[#64748b] mb-3">{plan.stageThemeDescription}</p>
      )}
      {stageProgressPct > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-extrabold text-[#1e1b4b]">Tiến độ giai đoạn</span>
            <span className="font-extrabold text-[#4338ca]">{stageProgressPct}%</span>
          </div>
          <div className="h-2 bg-[#f1f1f6] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"
              style={{ width: `${Math.min(100, stageProgressPct)}%` }}
            />
          </div>
        </div>
      )}
      {!stage && (
        <EmptyState
          icon="🚦"
          title="Chưa xác định giai đoạn"
          subtitle="Hoàn thành bài đánh giá để biết bạn đang ở đâu"
        />
      )}
    </section>
  );
}

function SkillsBreakdownSection({ dailyTasks }) {
  const tasksBySkill = {};
  dailyTasks.forEach((task) => {
    const skill = task.type || "OTHER";
    if (!tasksBySkill[skill]) tasksBySkill[skill] = [];
    tasksBySkill[skill].push(task);
  });
  const totalMinutes = dailyTasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
          🎯 Phân bổ theo kỹ năng
        </h2>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
          {totalMinutes} phút tổng
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SKILL_KEYS.map((key) => {
          const meta = SKILL_META[key];
          const tasks = tasksBySkill[key] || [];
          const mins = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
          const done = tasks.filter((t) => t.completed).length;
          return (
            <motion.div
              key={key}
              whileHover={{ y: -3 }}
              className="relative bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] hover:border-[#6366f1]/40 hover:shadow-[0_5px_0_#e6e6ed] p-4 transition-all overflow-hidden"
            >
              <div className={`absolute -top-8 -right-8 w-24 h-24 ${meta.color} rounded-full opacity-20 blur-2xl`} />
              <div className="relative">
                <div className={`w-11 h-11 rounded-2xl ${meta.color} text-white shadow-[0_3px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-xl mb-2`}>
                  {meta.icon}
                </div>
                <div className="text-sm font-extrabold text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
                  {meta.label}
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] mt-0.5">
                  {tasks.length > 0 ? `${done}/${tasks.length} task` : "Chưa có"}
                </div>
                <div className="text-base font-black text-[#1e1b4b] mt-1.5" style={{ fontFamily: "Nunito, sans-serif" }}>
                  {mins > 0 ? `${mins} phút` : "—"}
                </div>
                {tasks.length > 0 && (
                  <div className="h-1.5 bg-[#f1f1f6] rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${meta.color} rounded-full`}
                      style={{ width: `${(done / tasks.length) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function DailyTasksSection({ dailyTasks, completionMap, onToggle, onClick, onAllDone }) {
  if (dailyTasks.length === 0) {
    return (
      <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1]">
              ✅ Kế hoạch hôm nay
            </div>
            <h2 className="text-xl font-black text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
              Danh sách công việc
            </h2>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[#eef2ff] text-[#4338ca] font-extrabold text-xs border-2 border-[#a5b4fc]">
            0 task
          </span>
        </div>
        <EmptyState
          icon="📅"
          title="Chưa có kế hoạch hôm nay"
          subtitle="Hoàn thành bài đánh giá để nhận lộ trình cá nhân"
        />
      </section>
    );
  }
  const isTaskCompleted = (t) => completionMap?.[t.type]?.completed === true;
  return (
    <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1]">
            ✅ Kế hoạch hôm nay
          </div>
          <h2 className="text-xl font-black text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
            Danh sách công việc
          </h2>
        </div>
        <span className="px-3 py-1 rounded-xl bg-[#eef2ff] text-[#4338ca] font-extrabold text-xs border-2 border-[#a5b4fc]">
          {dailyTasks.length} task
        </span>
      </div>
      <div className="space-y-2.5">
        {dailyTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            completed={isTaskCompleted(task)}
            onClick={onClick}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}

function WeeklyPreviewSection() {
  const { plan, loading } = usePlanContext();
  const buildWeeklyPreview = () => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - today.getDay() + i);
      const wd = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()];
      days.push({
        date: d,
        weekday: wd,
        dayNum: d.getDate(),
        isToday: d.toDateString() === today.toDateString(),
        isPast: d < today && d.toDateString() !== today.toDateString(),
      });
    }
    return days;
  };
  const weekDays = buildWeeklyPreview();
  const weeklyTaskMap = {};
  if (Array.isArray(plan?.weeklyPlan)) {
    plan.weeklyPlan.forEach((wp) => {
      const dateKey = wp.date || wp.day || wp.weekDate;
      if (!dateKey) return;
      const key = typeof dateKey === "string" ? dateKey.split("T")[0] : new Date(dateKey).toISOString().split("T")[0];
      const tasks = Array.isArray(wp.tasks) ? wp.tasks : [];
      weeklyTaskMap[key] = {
        total: tasks.length,
        completed: tasks.filter((t) => t.completed).length,
      };
    });
  }
  if (loading) {
    return <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5"><Skeleton className="h-20 w-full" /></div>;
  }
  return (
    <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#06b6d4]">
            📆 Tuần này
          </div>
          <h2 className="text-xl font-black text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
            Kế hoạch 7 ngày
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((d) => {
          const key = d.date.toISOString().split("T")[0];
          const stat = weeklyTaskMap[key] || { total: 0, completed: 0 };
          return (
            <DayChip
              key={key}
              day={d}
              tasksCount={stat.total}
              completedCount={stat.completed}
              isToday={d.isToday}
              isPast={d.isPast}
            />
          );
        })}
      </div>
    </section>
  );
}

function StrandBalanceSection() {
  const { plan, loading } = usePlanContext();
  if (loading || !plan?.fourStrandBalance) return null;
  return (
    <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#fb7185]">
            ⚖️ Phân bổ thời gian
          </div>
          <h2 className="text-xl font-black text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
            4 nhóm kỹ năng
          </h2>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
          {plan?.dailyMinutes ?? 0} phút/ngày
        </span>
      </div>
      <div className="space-y-3">
        {[
          { name: "Đọc & Nghe", minutes: plan.fourStrandBalance.input, color: "bg-[#6366f1]", icon: "📖" },
          { name: "Viết & Nói", minutes: plan.fourStrandBalance.output, color: "bg-[#fb7185]", icon: "✍️" },
          { name: "Từ vựng & Ngữ pháp", minutes: plan.fourStrandBalance.language, color: "bg-[#a855f7]", icon: "📚" },
          { name: "Luyện tốc độ", minutes: plan.fourStrandBalance.fluency, color: "bg-[#f59e0b]", icon: "⚡" },
        ].map((strand) => {
          const pct = plan.dailyMinutes ? (strand.minutes / plan.dailyMinutes) * 100 : 0;
          return (
            <div key={strand.name} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${strand.color} text-white shadow-[0_2px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-base flex-none`}>
                {strand.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-extrabold text-[#1e1b4b]">{strand.name}</span>
                  <span className="text-xs font-extrabold text-[#64748b]">{strand.minutes}p</span>
                </div>
                <div className="h-2 bg-[#f1f1f6] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strand.color} rounded-full`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AIRecommendationsSection() {
  const { plan, loading } = usePlanContext();
  if (loading) return null;
  if (!Array.isArray(plan?.recommendations) || plan.recommendations.length === 0) return null;
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#eef2ff] to-[#f3e8ff] border-2 border-[#a5b4fc] rounded-3xl p-5">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#6366f1] rounded-full opacity-20 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white shadow-[0_3px_0_#4338ca] flex items-center justify-center text-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4338ca]">
              💡 AI đề xuất
            </div>
            <h2 className="text-lg font-black text-[#1e1b4b]" style={{ fontFamily: "Nunito, sans-serif" }}>
              Gợi ý cho bạn
            </h2>
          </div>
        </div>
        <ul className="space-y-2">
          {plan.recommendations.slice(0, 3).map((rec, idx) => (
            <li
              key={idx}
              className="bg-white/70 backdrop-blur rounded-2xl p-3 border-2 border-white text-sm text-[#1e1b4b] flex items-start gap-2"
            >
              <span className="text-base flex-none">💡</span>
              <span className="flex-1">{typeof rec === "string" ? rec : rec.message || rec.text || JSON.stringify(rec)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const StudyPlanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const idUser = user?.idUser;
  const [completionMap, setCompletionMap] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch daily completion (không cache, ~50ms). Share xuống các section.
  const refetchCompletion = async () => {
    if (!idUser) return;
    try {
      const completion = await getDailyCompletionAPI(idUser);
      if (completion?.tasks) setCompletionMap(completion.tasks);
    } catch {}
  };
  useEffect(() => {
    refetchCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUser]);

  // Listen for test-submitted → refetch completion (no plan refetch — mỗi section tự load)
  useEffect(() => {
    const onTestSubmitted = () => {
      refetchCompletion();
    };
    window.addEventListener("test-submitted", onTestSubmitted);
    return () => window.removeEventListener("test-submitted", onTestSubmitted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUser]);

  // dailyTasks cần cho StatsRowSection + ProgressBarSection + SkillsBreakdown + DailyTasksSection.
  // Tách riêng 1 hook load full plan (KHÔNG cache qua parent state — mỗi sub-component đã tự cache).
  // Nhưng để tránh 8 hook gọi song song, parent load 1 lần + share qua props.
  const { plan: parentPlan, loading: parentLoading } = useStudyPlan(idUser);
  const dailyTasks = useMemo(() => parentPlan?.dailyTasks ?? [], [parentPlan?.dailyTasks]);

  const handleToggle = async (taskId) => {
    const task = dailyTasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      await completeTaskAPI(taskId, !task.completed);
      const updated = dailyTasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
      // Trigger re-fetch của completionMap để đồng bộ
      refetchCompletion();
      if (updated.length > 0 && updated.every((t) => t.completed)) setShowCelebration(true);
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleTaskClick = (task) => {
    const route = TASK_ROUTE_BY_TYPE[task.type] || task.route;
    if (!route) return;
    navigate(route);
  };

  return (
    <div className="min-h-screen w-full bg-[#fafafc]">
      <PlanContext.Provider value={{ plan: parentPlan, loading: parentLoading, completionMap }}>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <PlanHeroSection />
          <MissingSkillsAlert />

          {/* Stats row + ProgressBar cần dailyTasks + completionMap. Render khi plan ready */}
          {parentLoading ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-3xl" />
                ))}
              </div>
              <Skeleton className="h-24 rounded-3xl" />
            </>
          ) : (
            <>
              <StatsRowSection dailyTasks={dailyTasks} completionMap={completionMap} />
              <ProgressBarSection dailyTasks={dailyTasks} completionMap={completionMap} />
            </>
          )}

          <StageCardSection />
          {parentLoading ? (
            <Skeleton className="h-32 rounded-3xl" />
          ) : (
            <SkillsBreakdownSection dailyTasks={dailyTasks} />
          )}

          {parentLoading ? (
            <Skeleton className="h-48 rounded-3xl" />
          ) : (
            <DailyTasksSection
              dailyTasks={dailyTasks}
              completionMap={completionMap}
              onToggle={handleToggle}
              onClick={handleTaskClick}
            />
          )}

          <WeeklyPreviewSection />
          <StrandBalanceSection />
          <AIRecommendationsSection />

          {/* Bottom tip — static */}
          <section className="bg-[#eef2ff] border-2 border-[#a5b4fc] rounded-3xl p-4 flex gap-3">
            <div className="text-2xl flex-none">🦉</div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4338ca] mb-0.5">
                Mẹo từ Owl
              </div>
              <div className="text-xs text-[#1e1b4b] leading-relaxed font-bold">
                Hoàn thành task đầu tiên trong ngày để tạo đà. 25 phút tập trung hiệu quả hơn 2 giờ mơ màng.
              </div>
            </div>
          </section>
        </main>
      </PlanContext.Provider>

      {/* === Celebration Modal === */}
      {showCelebration && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCelebration(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-[#fb7185] via-[#f59e0b] to-[#fbbf24] shadow-[0_5px_0_#b45309] flex items-center justify-center text-5xl">
              🎉
            </div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#f59e0b] mb-1">
              Hoàn thành xuất sắc
            </div>
            <h2 className="text-2xl font-black text-[#1e1b4b] mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>
              Tuyệt vời!
            </h2>
            <p className="text-sm text-[#64748b] mb-6">
              Bạn đã hoàn thành {dailyTasks.length} task hôm nay. Hãy giữ vững phong độ nhé!
            </p>
            <button
              onClick={() => setShowCelebration(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white font-extrabold uppercase tracking-wide text-sm shadow-[0_4px_0_#4338ca] active:translate-y-[2px] active:shadow-[0_2px_0_#4338ca] transition-all flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4" /> Tiếp tục phát huy
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;