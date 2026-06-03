// Pages/landingPage.jsx
// Adapted from MagicPath "IELTS Landing Page" (sparklingly-tide-6083)
// Brand: AIELTS · Theme: light (paper #fafafc) with playful stacked-shadow buttons
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  StackedButton,
  FeatureCard,
  Testimonial,
  PricingCard,
} from "@/components/landingPage/landingSections";

const LandingPage = () => {
  return (
    <div className="min-h-screen w-full bg-[#fafafc] text-[#1e1b4b]">
      <Nav />
      <Hero />
      <StatsStrip />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;

/* ----------------------------- Nav ----------------------------- */
const Nav = () => {
  const navigate = useNavigate();
  const items = ["Khóa học", "Practice tests", "Vocab", "Cộng đồng", "Giá"];

  const scrollTo = (label) => {
    const map = {
      "Khóa học": "features",
      "Practice tests": "features",
      Vocab: "features",
      "Cộng đồng": "testimonials",
      Giá: "pricing",
    };
    const id = map[label];
    if (id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b-2 border-[#e6e6ed]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] shadow-[0_3px_0_#4338ca] flex items-center justify-center text-lg">
            📘
          </div>
          <span
            className="text-xl font-black text-[#1e1b4b]"
            style={{ fontFamily: "Nunito" }}
          >
            AIELTS
          </span>
        </a>

        <div className="hidden md:flex items-center gap-1 ml-6">
          {items.map((item) => (
            <button
              key={item}
              onClick={() => scrollTo(item)}
              className="px-3 py-2 rounded-xl text-sm font-bold text-[#64748b] hover:bg-[#f1f1f6] hover:text-[#1e1b4b] cursor-pointer transition-all"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate("/login")}
            className="px-3 py-2 rounded-xl text-sm font-bold text-[#1e1b4b] hover:bg-[#f1f1f6] cursor-pointer transition-all"
          >
            Đăng nhập
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="bg-[#6366f1] text-white shadow-[0_5px_0_#4338ca] hover:brightness-110 px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide rounded-2xl active:translate-y-[2px] active:shadow-[0_2px_0_#4338ca] transition-all"
          >
            Bắt đầu miễn phí
          </button>
        </div>
      </div>
    </nav>
  );
};

/* ----------------------------- Hero ----------------------------- */
const Hero = () => {
  const navigate = useNavigate();
  return (
    <section
      id="top"
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#eef2ff] via-white to-[#fff1f2]" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#6366f1]/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#fb7185]/15 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] mb-6">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1]">
              🎉 Mới ra mắt
            </span>
            <span className="text-xs font-semibold text-[#1e1b4b]">
              AI Speaking với band realtime
            </span>
          </div>
          <h1
            className="text-5xl lg:text-6xl font-black text-[#1e1b4b] leading-[1.05] tracking-tight mb-5"
            style={{ fontFamily: "Nunito" }}
          >
            Master IELTS,
            <br />
            <span className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#fb7185] bg-clip-text text-transparent">
              không cần ra trung tâm.
            </span>
          </h1>
          <p className="text-lg text-[#64748b] leading-relaxed mb-8 max-w-xl">
            Luyện 4 kỹ năng với{" "}
            <strong className="text-[#1e1b4b]">đề Cambridge real</strong>, AI chấm
            Writing & Speaking trong 30 giây, từ vựng theo chủ đề và streak để
            giữ động lực hằng ngày.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-8">
            <StackedButton
              tone="indigo"
              size="lg"
              onClick={() => navigate("/signup")}
            >
              🚀 Học ngay miễn phí
            </StackedButton>
            <StackedButton
              tone="ghost"
              size="lg"
              onClick={() => navigate("/login")}
            >
              Xem demo 2 phút
            </StackedButton>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex -space-x-2">
              {["👨", "👩", "🧑", "👨‍🎓", "👩‍🎓"].map((e, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366f1] to-[#fb7185] flex items-center justify-center text-sm border-2 border-white"
                >
                  {e}
                </div>
              ))}
            </div>
            <div>
              <div className="font-extrabold text-[#1e1b4b]">
                12,400+ học viên
              </div>
              <div className="text-xs text-[#64748b]">
                ⭐ 4.9 / 5 từ 2,800 reviews
              </div>
            </div>
          </div>
        </div>

        {/* Hero illustration */}
        <div className="relative">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-4 right-4 z-10 bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_4px_0_#e6e6ed] p-4 w-56"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#10b981] text-white flex items-center justify-center text-sm">
                ✓
              </div>
              <div className="font-extrabold text-[#1e1b4b] text-sm">
                Đúng rồi!
              </div>
            </div>
            <div className="text-xs text-[#64748b]">+10 XP · Streak +1 ngày</div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -bottom-4 -left-4 z-10 bg-gradient-to-br from-[#fb7185] to-[#f59e0b] rounded-3xl shadow-[0_4px_0_#b45309] p-4 text-white w-48"
          >
            <div className="text-2xl font-black">12 🔥</div>
            <div className="text-xs font-bold uppercase tracking-wide opacity-90">
              Day streak
            </div>
          </motion.div>

          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_5px_0_#e6e6ed] p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1]">
                  Cambridge IELTS 17
                </div>
                <div className="font-extrabold text-[#1e1b4b]">
                  Reading · Test 3
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-[#eef2ff] text-[#4338ca] text-xs font-extrabold">
                ⏱ 18:42
              </div>
            </div>

            <div className="bg-[#fafafc] rounded-2xl p-4 mb-3 text-sm leading-relaxed text-[#1e1b4b]">
              Tea is one of the world's most popular{" "}
              <span className="bg-[#fef3c7] rounded px-1">beverages</span>,
              second only to{" "}
              <span className="bg-[#eef2ff] rounded px-1">water</span>...
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#eef2ff] border-2 border-[#6366f1]">
                <div className="w-8 h-8 rounded-lg bg-[#6366f1] text-white font-black flex items-center justify-center text-sm">
                  B
                </div>
                <div className="text-sm font-semibold text-[#1e1b4b]">
                  Tang Dynasty
                </div>
                <span className="ml-auto text-[#6366f1]">✓</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-[#e6e6ed]">
                <div className="w-8 h-8 rounded-lg bg-[#f1f1f6] text-[#64748b] font-black flex items-center justify-center text-sm">
                  C
                </div>
                <div className="text-sm font-semibold text-[#64748b]">
                  Ming Dynasty
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-md text-xs font-extrabold flex items-center justify-center ${
                      i <= 2
                        ? "bg-[#eef2ff] text-[#4338ca] border-2 border-[#a5b4fc]"
                        : i === 3
                        ? "bg-[#6366f1] text-white"
                        : "bg-white border-2 border-[#e6e6ed] text-[#64748b]"
                    }`}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <span className="text-xs font-bold text-[#6366f1]">Q3 / 13</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* --------------------------- Stats strip --------------------------- */
const StatsStrip = () => {
  const stats = [
    { num: "12.4K+", label: "Học viên đang học" },
    { num: "7.5", label: "Band trung bình đạt" },
    { num: "50+", label: "Đề Cambridge thật" },
    { num: "94%", label: "Đạt mục tiêu band" },
  ];
  return (
    <section className="bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white py-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div
              className="text-4xl font-black mb-1"
              style={{ fontFamily: "Nunito" }}
            >
              {s.num}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* --------------------------- Features --------------------------- */
const Features = () => {
  const features = [
    {
      icon: "📖",
      title: "Reading thật từ Cambridge",
      desc: "50+ test từ Cambridge IELTS 1-19, kèm bản dịch và giải thích từng câu.",
      gradient: "bg-gradient-to-br from-[#6366f1] to-[#a855f7]",
    },
    {
      icon: "🎧",
      title: "Listening 4 sections",
      desc: "Nghe accent đa dạng (UK/US/AU), tốc độ nói thật 1x, không tua được như thi.",
      gradient: "bg-gradient-to-br from-[#06b6d4] to-[#0891b2]",
    },
    {
      icon: "✍️",
      title: "AI chấm Writing",
      desc: "Dự đoán band trong 30 giây + sửa lỗi grammar và gợi ý từ vựng C1.",
      gradient: "bg-gradient-to-br from-[#fb7185] to-[#f59e0b]",
    },
    {
      icon: "🎤",
      title: "Speaking với AI examiner",
      desc: "Examiner ảo phỏng vấn 3 parts, đánh giá fluency & pronunciation realtime.",
      gradient: "bg-gradient-to-br from-[#a855f7] to-[#ec4899]",
    },
  ];

  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1] mb-2">
          Tính năng
        </div>
        <h2
          className="text-4xl font-black text-[#1e1b4b] mb-3"
          style={{ fontFamily: "Nunito" }}
        >
          Mọi thứ bạn cần để đạt band 7+
        </h2>
        <p className="text-lg text-[#64748b]">
          4 kỹ năng · AI chấm bài · Vocab có hệ thống · Cộng đồng học viên
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
};

/* ------------------------- How it works ------------------------- */
const HowItWorks = () => {
  const steps = [
    {
      num: "1",
      title: "Test đầu vào",
      desc: "Làm 1 mock test mini để OwlIELTS biết band hiện tại.",
      emoji: "🎯",
    },
    {
      num: "2",
      title: "Lộ trình AI",
      desc: "AI tạo lộ trình 4-12 tuần dựa trên band mục tiêu của bạn.",
      emoji: "🗺",
    },
    {
      num: "3",
      title: "Học hằng ngày",
      desc: "Mỗi ngày 20-30 phút, giữ streak, lên band thật.",
      emoji: "🚀",
    },
  ];
  return (
    <section className="bg-white border-y-2 border-[#e6e6ed] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1] mb-2">
            3 bước
          </div>
          <h2
            className="text-4xl font-black text-[#1e1b4b]"
            style={{ fontFamily: "Nunito" }}
          >
            Học IELTS như chơi game
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {steps.map((s) => (
            <div
              key={s.num}
              className="relative bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-6"
            >
              <div className="absolute -top-4 -left-2 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white shadow-[0_3px_0_#4338ca] flex items-center justify-center text-xl font-black">
                {s.num}
              </div>
              <div className="text-5xl mt-6 mb-4">{s.emoji}</div>
              <h3
                className="text-xl font-black text-[#1e1b4b] mb-2"
                style={{ fontFamily: "Nunito" }}
              >
                {s.title}
              </h3>
              <p className="text-sm text-[#64748b] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -------------------------- Testimonials -------------------------- */
const Testimonials = () => {
  const items = [
    {
      name: "Minh Anh",
      band: "7.5",
      avatar: "👩‍🎓",
      color: "bg-gradient-to-br from-[#6366f1] to-[#a855f7]",
      text: "Mình tự học hoàn toàn ở nhà, 3 tháng từ 6.0 lên 7.5. AI Speaking giúp mình tự tin nói nhiều hơn, không còn ngại.",
    },
    {
      name: "Quang Hưng",
      band: "8.0",
      avatar: "👨‍💼",
      color: "bg-gradient-to-br from-[#06b6d4] to-[#0891b2]",
      text: "Bộ đề Cambridge thật giá quá ổn so với học trung tâm. Giải thích từng câu sai cực kỹ.",
    },
    {
      name: "Lan Phương",
      band: "7.0",
      avatar: "🧕",
      color: "bg-gradient-to-br from-[#fb7185] to-[#f59e0b]",
      text: "Streak là động lực lớn nhất. Mỗi ngày 30 phút, không ngày nào bỏ qua suốt 80 ngày.",
    },
  ];
  return (
    <section id="testimonials" className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1] mb-2">
          Học viên nói gì
        </div>
        <h2
          className="text-4xl font-black text-[#1e1b4b]"
          style={{ fontFamily: "Nunito" }}
        >
          Họ đã đạt band như thế
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {items.map((t) => (
          <Testimonial key={t.name} {...t} />
        ))}
      </div>
    </section>
  );
};

/* ----------------------------- Pricing ----------------------------- */
const Pricing = () => {
  const tiers = [
    {
      tier: "Free",
      price: "0₫",
      features: [
        "10 test/tháng",
        "Vocab cơ bản 500 từ",
        "Cộng đồng forum",
        "Streak tracker",
      ],
    },
    {
      tier: "Pro",
      price: "299K",
      badge: "Phổ biến nhất",
      highlight: true,
      features: [
        "Toàn bộ 50+ test Cambridge",
        "AI chấm Writing & Speaking",
        "Vocab 5,000 từ phân band",
        "Lộ trình AI cá nhân hóa",
        "Teacher review 4 bài/tháng",
      ],
    },
    {
      tier: "Premium",
      price: "599K",
      features: [
        "Tất cả Pro",
        "Teacher review 16 bài/tháng",
        "Live class 1-1 với giáo viên",
        "Cam kết hoàn tiền nếu không đạt",
      ],
    },
  ];
  return (
    <section id="pricing" className="bg-white border-y-2 border-[#e6e6ed] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1] mb-2">
            Học phí
          </div>
          <h2
            className="text-4xl font-black text-[#1e1b4b]"
            style={{ fontFamily: "Nunito" }}
          >
            Chọn plan phù hợp
          </h2>
          <p className="text-[#64748b] mt-2">
            Hủy bất kỳ lúc nào · 7 ngày dùng thử miễn phí
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {tiers.map((p) => (
            <PricingCard key={p.tier} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
};

/* --------------------------------- CTA --------------------------------- */
const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="relative bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#fb7185] rounded-[40px] p-12 text-center text-white overflow-hidden shadow-[0_5px_0_#4338ca]">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="text-6xl mb-4">📘</div>
          <h2
            className="text-4xl font-black mb-3"
            style={{ fontFamily: "Nunito" }}
          >
            Sẵn sàng đạt band mơ ước?
          </h2>
          <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
            7 ngày dùng thử miễn phí. Không cần thẻ. Hủy bất cứ lúc nào.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="bg-white text-[#4338ca] px-8 py-4 rounded-2xl font-extrabold uppercase tracking-wide shadow-[0_5px_0_rgba(0,0,0,0.25)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-all text-base"
          >
            🚀 Bắt đầu miễn phí
          </button>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------- Footer ------------------------------- */
const Footer = () => {
  const cols = [
    { title: "Sản phẩm", items: ["Practice tests", "Vocab", "Speaking AI", "Writing AI"] },
    { title: "Công ty", items: ["Giới thiệu", "Blog", "Tuyển dụng", "Liên hệ"] },
    { title: "Hỗ trợ", items: ["Trung tâm trợ giúp", "Cộng đồng", "Điều khoản", "Bảo mật"] },
  ];
  return (
    <footer className="bg-[#1e1b4b] text-white py-12">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-base">
              📘
            </div>
            <span
              className="text-lg font-black"
              style={{ fontFamily: "Nunito" }}
            >
              AIELTS
            </span>
          </div>
          <p className="text-sm opacity-70 leading-relaxed">
            App học IELTS thông minh nhất Việt Nam.
          </p>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <div className="text-xs font-extrabold uppercase tracking-wider mb-3 opacity-90">
              {col.title}
            </div>
            <ul className="space-y-2 text-sm opacity-70">
              {col.items.map((it) => (
                <li
                  key={it}
                  className="hover:opacity-100 cursor-pointer transition-opacity"
                >
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-white/10 text-xs opacity-60 flex items-center justify-between">
        <span>© {new Date().getFullYear()} AIELTS. All rights reserved.</span>
        <span>Made with 💜 in Vietnam</span>
      </div>
    </footer>
  );
};
