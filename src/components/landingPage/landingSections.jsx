// components/landingPage/landingSections.jsx
// Reusable section components for the redesigned landing page.
// Design language: playful "stacked shadow" buttons + light paper background.
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

/* --------------------------- StackedButton --------------------------- */
export const StackedButton = ({
  children,
  tone = "indigo",
  size = "md",
  onClick,
  type = "button",
}) => {
  const styles = {
    indigo:
      "bg-[#6366f1] text-white shadow-[0_5px_0_#4338ca] hover:brightness-110",
    cyan: "bg-[#06b6d4] text-white shadow-[0_5px_0_#0891b2] hover:brightness-110",
    coral:
      "bg-[#fb7185] text-white shadow-[0_5px_0_#e11d48] hover:brightness-110",
    amber:
      "bg-[#f59e0b] text-white shadow-[0_5px_0_#b45309] hover:brightness-110",
    ghost:
      "bg-white text-[#6366f1] border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] hover:border-[#6366f1]",
  };
  const sz =
    size === "sm"
      ? "px-3 py-1.5 text-xs"
      : size === "lg"
      ? "px-8 py-4 text-base"
      : "px-5 py-2.5 text-sm";
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${styles[tone]} ${sz} font-extrabold uppercase tracking-wide rounded-2xl active:translate-y-[2px] active:shadow-[0_2px_0] transition-all`}
    >
      {children}
    </button>
  );
};

/* ----------------------------- FeatureCard ----------------------------- */
export const FeatureCard = ({ icon, title, desc, gradient }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-6 hover:shadow-[0_6px_0_#e6e6ed] hover:border-[#6366f1]/30 transition-all"
    >
      <div
        className={`w-14 h-14 rounded-2xl ${gradient} shadow-[0_3px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-2xl mb-4`}
      >
        {icon}
      </div>
      <h3
        className="text-lg font-black text-[#1e1b4b] mb-2"
        style={{ fontFamily: "Nunito" }}
      >
        {title}
      </h3>
      <p className="text-sm text-[#64748b] leading-relaxed">{desc}</p>
    </motion.div>
  );
};

/* ----------------------------- Testimonial ----------------------------- */
export const Testimonial = ({ name, band, avatar, text, color }) => {
  return (
    <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-2xl shadow-[0_3px_0_rgba(0,0,0,0.15)]`}
        >
          {avatar}
        </div>
        <div>
          <div className="font-extrabold text-[#1e1b4b]">{name}</div>
          <div className="text-xs font-bold text-[#6366f1] flex items-center gap-1">
            ⭐ Band {band}
          </div>
        </div>
      </div>
      <p className="text-sm text-[#1e1b4b] leading-relaxed">{text}</p>
    </div>
  );
};

/* ----------------------------- PricingCard ----------------------------- */
export const PricingCard = ({ tier, price, badge, features, highlight }) => {
  const navigate = useNavigate();
  return (
    <div
      className={`relative rounded-3xl border-2 p-7 ${
        highlight
          ? "bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] border-[#6366f1] text-white shadow-[0_5px_0_#4338ca]"
          : "bg-white border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed]"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#fb7185] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-[0_2px_0_#e11d48]">
          {badge}
        </div>
      )}
      <div
        className={`text-xs font-bold uppercase tracking-wider mb-2 ${
          highlight ? "opacity-90" : "text-[#6366f1]"
        }`}
      >
        {tier}
      </div>
      <div className="flex items-baseline gap-1 mb-4">
        <span
          className={`text-4xl font-black ${highlight ? "" : "text-[#1e1b4b]"}`}
          style={{ fontFamily: "Nunito" }}
        >
          {price}
        </span>
        <span
          className={`text-sm font-bold ${
            highlight ? "opacity-80" : "text-[#64748b]"
          }`}
        >
          / tháng
        </span>
      </div>
      <ul className="space-y-2.5 mb-6">
        {features.map((f, i) => (
          <li
            key={i}
            className={`flex items-start gap-2 text-sm ${
              highlight ? "" : "text-[#1e1b4b]"
            }`}
          >
            <span
              className={`flex-none w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                highlight ? "bg-white/20" : "bg-[#10b981] text-white"
              }`}
            >
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => navigate("/signup")}
        className={`w-full py-3 rounded-2xl font-extrabold uppercase tracking-wide text-sm transition-all active:translate-y-[2px] ${
          highlight
            ? "bg-white text-[#4338ca] shadow-[0_4px_0_rgba(0,0,0,0.25)] active:shadow-[0_2px_0_rgba(0,0,0,0.25)]"
            : "bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] active:shadow-[0_2px_0_#4338ca]"
        }`}
      >
        Bắt đầu
      </button>
    </div>
  );
};
