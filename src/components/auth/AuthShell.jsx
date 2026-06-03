// components/auth/AuthShell.jsx
// Shared two-pane layout for auth screens (left brand panel + right form panel).
// Brand: AIELTS (BookOpen icon) · Layout adapted from MagicPath "IELTS Auth Screens"
import React from "react";
import { motion } from "framer-motion";

/**
 * AuthShell
 * @param {Object} props
 * @param {string} props.title - small uppercase tracking label (e.g. "Bước 1 · Login flow")
 * @param {string} props.icon - emoji for the brand panel hero
 * @param {React.ReactNode} props.children - the right-side form
 * @param {string} props.bgClassName - optional override for outer wrapper
 */
const AuthShell = ({ title, icon = "📘", children }) => {
  const stats = [
    { v: "12.4K", l: "Học viên" },
    { v: "7.5", l: "Band TB" },
    { v: "94%", l: "Đạt mục tiêu" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#fafafc] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Decorative blobs (background) */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#6366f1]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#fb7185]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[1100px] grid lg:grid-cols-[1.1fr_1fr] rounded-[36px] overflow-hidden bg-white border-2 border-[#e6e6ed] shadow-[0_8px_0_#e6e6ed]">
        {/* Left brand panel */}
        <aside className="relative bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] p-10 text-white flex flex-col justify-between overflow-hidden min-h-[600px]">
          <div className="absolute -top-12 -right-12 w-72 h-72 bg-[#6366f1]/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-[#fb7185]/20 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#fb7185] to-[#f59e0b] shadow-[0_3px_0_rgba(0,0,0,0.3)] flex items-center justify-center text-lg">
                📘
              </div>
              <span
                className="text-xl font-black"
                style={{ fontFamily: "Nunito" }}
              >
                AIELTS
              </span>
            </div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-9xl mb-6"
            >
              {icon}
            </motion.div>

            <h2
              className="text-3xl font-black mb-2"
              style={{ fontFamily: "Nunito" }}
            >
              Master IELTS.
            </h2>
            <p className="text-white/80 text-sm leading-relaxed max-w-md">
              4 kỹ năng · AI chấm Writing &amp; Speaking · Streak giữ động lực ·
              12,400+ học viên đã đạt band mơ ước.
            </p>
          </div>

          <div className="relative space-y-3">
            {/* Mini stat cards */}
            <div className="grid grid-cols-3 gap-2">
              {stats.map((s) => (
                <div
                  key={s.l}
                  className="bg-white/10 backdrop-blur rounded-2xl p-3"
                >
                  <div
                    className="text-xl font-black"
                    style={{ fontFamily: "Nunito" }}
                  >
                    {s.v}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            {/* Flow indicator */}
            {title && (
              <div className="bg-white/10 backdrop-blur rounded-2xl p-3 flex items-center gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  🧭
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    Đang ở
                  </div>
                  <div className="font-extrabold">{title}</div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right form panel */}
        <main className="relative p-8 lg:p-10 flex flex-col justify-center min-h-[600px] overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AuthShell;
