import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { getSkillOverviewAPI } from "@/services/apiStatistics";

// Stacked button used throughout the homepage hero & recommendations.
function StackedButton({
  children,
  tone = "indigo",
  size = "md",
  className = "",
}) {
  const styles = {
    indigo: "bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] hover:brightness-110",
    cyan: "bg-[#06b6d4] text-white shadow-[0_4px_0_#0891b2] hover:brightness-110",
    coral: "bg-[#fb7185] text-white shadow-[0_4px_0_#e11d48] hover:brightness-110",
    amber: "bg-[#f59e0b] text-white shadow-[0_4px_0_#b45309] hover:brightness-110",
    ghost:
      "bg-white text-[#6366f1] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]",
  };
  const sz =
    size === "sm"
      ? "px-3 py-1.5 text-xs"
      : size === "lg"
        ? "px-7 py-3.5 text-base"
        : "px-5 py-2.5 text-sm";
  return (
    <button
      className={`${styles[tone]} ${sz} font-extrabold uppercase tracking-wide rounded-2xl active:translate-y-[2px] active:shadow-[0_2px_0] transition-all ${className}`}
    >
      {children}
    </button>
  );
}

function SkillCard({ icon, name, band, target, color, accent, lessons }) {
  const pct = (band / target) * 100;
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
        {lessons && <div className="text-xs text-[#64748b] mb-3">{lessons}</div>}

        <div className="flex items-baseline gap-2 mb-2">
          <span
            className="text-3xl font-black text-[#1e1b4b]"
            style={{ fontFamily: "Nunito" }}
          >
            {band == null ? "—" : band.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-[#64748b]">
            / Band {target}
          </span>
        </div>
        <div className="h-2 bg-[#f1f1f6] rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

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

export const IELTSStudentHomepage = () => {
  const { user } = useAuth();
  const idUser = user?.idUser ?? user?.id;
  const [skillOverview, setSkillOverview] = useState(null);

  useEffect(() => {
    if (!idUser) return;
    let cancelled = false;
    getSkillOverviewAPI(idUser)
      .then((res) => {
        if (cancelled) return;
        setSkillOverview(res?.data ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setSkillOverview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [idUser]);

  const skillCards = [
    { key: "reading", icon: "📖", name: "Reading", color: "bg-[#6366f1]", accent: "bg-[#6366f1]" },
    { key: "listening", icon: "🎧", name: "Listening", color: "bg-[#06b6d4]", accent: "bg-[#06b6d4]" },
    { key: "writing", icon: "✍️", name: "Writing", color: "bg-[#fb7185]", accent: "bg-[#fb7185]" },
    { key: "speaking", icon: "🎤", name: "Speaking", color: "bg-[#a855f7]", accent: "bg-[#a855f7]" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#fafafc]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b-2 border-[#e6e6ed]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] shadow-[0_3px_0_#4338ca] flex items-center justify-center text-lg">
              🦉
            </div>
            <span
              className="text-lg font-black text-[#1e1b4b]"
              style={{ fontFamily: "Nunito" }}
            >
              OwlIELTS
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1 ml-6">
            {[
              { name: "Trang chủ", icon: "🏠", active: true },
              { name: "Practice", icon: "📝" },
              { name: "Vocab", icon: "📚" },
              { name: "Grammar", icon: "🎓" },
              { name: "Cộng đồng", icon: "💬" },
            ].map((item) => (
              <a
                key={item.name}
                className={`px-3 py-2 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
                  item.active
                    ? "bg-[#eef2ff] text-[#4338ca]"
                    : "text-[#64748b] hover:bg-[#f1f1f6]"
                }`}
              >
                <span className="text-xs">{item.icon}</span>
                {item.name}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#fff1f2] text-[#e11d48] font-extrabold border-2 border-[#fb7185]/30">
              <span>🔥</span> 12
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#fef3c7] text-[#b45309] font-extrabold border-2 border-[#f59e0b]/30">
              <span>💎</span> 1,240
            </div>
            <button className="w-10 h-10 rounded-xl bg-white border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] flex items-center justify-center hover:border-[#6366f1] transition-all">
              🔔
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#fb7185] to-[#f59e0b] flex items-center justify-center text-lg shadow-[0_3px_0_#b45309]">
              👩
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* Hero greeting */}
          <section className="relative bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#fb7185] rounded-3xl p-7 text-white overflow-hidden shadow-[0_4px_0_#4338ca]">
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-90 mb-1">
                  Chào buổi sáng, Minh Anh 🌞
                </div>
                <h1
                  className="text-3xl font-black mb-2"
                  style={{ fontFamily: "Nunito" }}
                >
                  Hôm nay học gì nào?
                </h1>
                <p className="opacity-90 text-sm mb-4 max-w-md">
                  Bạn đã giữ streak <strong>12 ngày</strong> liên tục — kỷ lục
                  mới! Còn <strong>2 lesson</strong> nữa là hoàn thành mục tiêu
                  hôm nay.
                </p>

                <div className="flex flex-wrap gap-2.5">
                  <button className="bg-white text-[#4338ca] px-5 py-2.5 rounded-2xl font-extrabold uppercase tracking-wide text-sm shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-all">
                    ▶ Tiếp tục lesson
                  </button>
                  <button className="bg-white/15 backdrop-blur text-white px-5 py-2.5 rounded-2xl font-extrabold uppercase tracking-wide text-sm border-2 border-white/30 hover:bg-white/25 transition-all">
                    Xem lộ trình
                  </button>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="text-8xl">🦉</div>
              </div>
            </div>
          </section>

          {/* 4 skills */}
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
                  Mục tiêu: Band 7.5 trước tháng 9
                </div>
              </div>
              <button className="text-xs font-bold text-[#6366f1] hover:underline">
                Chi tiết →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {skillCards.map((s) => {
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

          {/* Today plan */}
          <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1]">
                  Hôm nay · 29/05
                </div>
                <h2
                  className="text-xl font-black text-[#1e1b4b]"
                  style={{ fontFamily: "Nunito" }}
                >
                  Kế hoạch học hôm nay
                </h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#eef2ff] text-[#4338ca] font-extrabold text-xs border-2 border-[#a5b4fc]">
                <span>⏱</span> 25 / 45 phút
              </div>
            </div>

            <div className="space-y-2.5">
              <LessonRow
                icon="📖"
                title="Cambridge 17 · Reading Test 3 · Passage 1"
                sub="13 câu hỏi · 18 phút"
                status="done"
                badge="✓ Done"
              />
              <LessonRow
                icon="📚"
                title="Vocab Daily · Topic: Environment"
                sub="20 từ mới · 8 phút"
                status="done"
                badge="✓ Done"
              />
              <LessonRow
                icon="🎤"
                title="Speaking Part 2 · Describe a journey"
                sub="Cue card + AI feedback · 12 phút"
                status="current"
                badge="Đang làm"
              />
              <LessonRow
                icon="✍️"
                title="Writing Task 2 · Discussion essay"
                sub="40 phút · AI chấm"
                status="locked"
                badge="Chờ"
              />
              <LessonRow
                icon="🎓"
                title="Grammar · Conditional sentences"
                sub="15 câu · 10 phút"
                status="locked"
                badge="Chờ"
              />
            </div>
          </section>

          {/* Recommended */}
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

            <div className="grid md:grid-cols-3 gap-3">
              {[
                {
                  title: "Cambridge IELTS 18",
                  test: "Test 1 · Reading",
                  diff: "Trung bình",
                  band: "6.5 - 7.5",
                  color: "bg-[#6366f1]",
                  icon: "📖",
                  minutes: "60 phút",
                },
                {
                  title: "Cambridge IELTS 17",
                  test: "Test 4 · Listening",
                  diff: "Khó",
                  band: "7.0+",
                  color: "bg-[#06b6d4]",
                  icon: "🎧",
                  minutes: "40 phút",
                },
                {
                  title: "Mock Test 2026",
                  test: "Full Speaking",
                  diff: "Dễ",
                  band: "6.0+",
                  color: "bg-[#fb7185]",
                  icon: "🎤",
                  minutes: "15 phút",
                },
              ].map((t, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -3 }}
                  className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] hover:border-[#6366f1]/30 hover:shadow-[0_5px_0_#e6e6ed] p-5 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${t.color} shadow-[0_3px_0_rgba(0,0,0,0.15)] text-white flex items-center justify-center text-lg`}
                    >
                      {t.icon}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide bg-[#f1f1f6] text-[#64748b] px-2 py-0.5 rounded-full">
                      {t.diff}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-1">
                    {t.title}
                  </div>
                  <h3 className="font-extrabold text-[#1e1b4b] mb-3">
                    {t.test}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-[#64748b] mb-3">
                    <span>⏱ {t.minutes}</span>
                    <span>· Band {t.band}</span>
                  </div>
                  <button className="w-full py-2 rounded-xl bg-[#eef2ff] text-[#4338ca] font-extrabold text-xs uppercase tracking-wide hover:bg-[#e0e7ff] transition-all">
                    Bắt đầu →
                  </button>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Recent activity */}
          <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-black text-[#1e1b4b]"
                style={{ fontFamily: "Nunito" }}
              >
                Hoạt động gần đây
              </h2>
              <button className="text-xs font-bold text-[#6366f1] hover:underline">
                Xem tất cả →
              </button>
            </div>
            <div className="space-y-3">
              {[
                {
                  icon: "📖",
                  color: "bg-[#6366f1]",
                  title: "Cambridge 17 · Test 3 Reading",
                  meta: "Band 7.0 · 11/13 đúng",
                  time: "10 phút trước",
                },
                {
                  icon: "🎤",
                  color: "bg-[#a855f7]",
                  title: "Speaking Part 1 — Hometown",
                  meta: "AI band 6.5 · Fluency tốt",
                  time: "2 giờ trước",
                },
                {
                  icon: "📚",
                  color: "bg-[#06b6d4]",
                  title: "Vocab Daily — Education",
                  meta: "20/20 từ · +50 XP",
                  time: "Hôm qua",
                },
                {
                  icon: "✍️",
                  color: "bg-[#fb7185]",
                  title: "Writing Task 1 — Bar chart",
                  meta: "AI band 6.0 · Grammar cần cải thiện",
                  time: "2 ngày trước",
                },
              ].map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 border-b border-[#f1f1f6] last:border-0"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${a.color} text-white shadow-[0_2px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-base`}
                  >
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm text-[#1e1b4b] truncate">
                      {a.title}
                    </div>
                    <div className="text-xs text-[#64748b]">{a.meta}</div>
                  </div>
                  <div className="text-xs text-[#94a3b8] flex-none">
                    {a.time}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <aside className="space-y-4 lg:sticky lg:top-[78px] lg:self-start">
          {/* Streak */}
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
                12 🔥
              </div>
              <div className="text-xs opacity-90 mb-4">
                Kỷ lục: 18 ngày · Tiếp tục để phá kỷ lục
              </div>

              <div className="grid grid-cols-7 gap-1">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d, i) => {
                  const done = i < 5;
                  const today = i === 5;
                  return (
                    <div key={i} className="text-center">
                      <div className="text-[9px] font-bold opacity-80 mb-1">
                        {d}
                      </div>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black mx-auto ${
                          done
                            ? "bg-white text-[#b45309]"
                            : today
                              ? "bg-white/30 ring-2 ring-white"
                              : "bg-white/10"
                        }`}
                      >
                        {done ? "✓" : today ? "!" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Weekly XP */}
          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  XP tuần này
                </div>
                <div
                  className="text-3xl font-black text-[#1e1b4b]"
                  style={{ fontFamily: "Nunito" }}
                >
                  1,240
                </div>
              </div>
              <div className="text-3xl">⚡</div>
            </div>
            <div className="h-2.5 bg-[#f1f1f6] rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-[#6366f1] via-[#06b6d4] to-[#fb7185] rounded-full"
                style={{ width: "83%" }}
              />
            </div>
            <div className="text-xs text-[#64748b] mb-4">
              1,240 / 1,500 XP · Còn 260 XP
            </div>

            <div className="grid grid-cols-7 gap-1">
              {[80, 120, 200, 150, 240, 180, 270].map((v, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-full h-12 bg-[#f1f1f6] rounded-md relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#6366f1] to-[#a855f7] rounded-md"
                      style={{ height: `${(v / 270) * 100}%` }}
                    />
                  </div>
                  <div className="text-[9px] font-bold text-[#64748b]">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Huy hiệu
                </div>
                <div className="text-sm font-extrabold text-[#1e1b4b]">
                  7 / 24 đã đạt
                </div>
              </div>
              <button className="text-xs font-bold text-[#6366f1] hover:underline">
                Xem →
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { e: "🏆", got: true, name: "7 day streak" },
                { e: "🔥", got: true, name: "10 day streak" },
                { e: "📚", got: true, name: "100 từ" },
                { e: "🎯", got: true, name: "First test" },
                { e: "⭐", got: true, name: "Band 6+" },
                { e: "🌟", got: true, name: "Band 7+" },
                { e: "💎", got: true, name: "1000 XP" },
                { e: "🚀", got: false, name: "Band 8+" },
              ].map((b, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-2xl border-2 ${
                    b.got
                      ? "bg-gradient-to-br from-[#fef3c7] to-[#fde68a] border-[#f59e0b]/40 shadow-[0_2px_0_#f59e0b]/30"
                      : "bg-[#f1f1f6] border-[#e6e6ed] grayscale opacity-50"
                  }`}
                  title={b.name}
                >
                  {b.e}
                </div>
              ))}
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
                Học 25 phút mỗi ngày hiệu quả hơn 3 giờ cuối tuần. Giữ thói
                quen!
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default IELTSStudentHomepage;
