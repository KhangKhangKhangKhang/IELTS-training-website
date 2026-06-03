// components/auth/AuthPrimitives.jsx
// Shared light-theme form primitives for auth screens.
// Adapted from MagicPath Auth design language (stacked-shadow buttons, rounded-2xl).
import React, { useRef, useState } from "react";

/* ----------------------------- AuthInput ----------------------------- */
export const AuthInput = ({
  label,
  type = "text",
  placeholder,
  icon,
  value,
  onChange,
  error,
  hint,
  autoFocus,
  rightSlot,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
        {label}
      </label>
      <div
        className={`relative flex items-center rounded-2xl border-2 bg-white transition-all ${
          error
            ? "border-[#fb7185] shadow-[0_0_0_4px_rgba(251,113,133,0.15)]"
            : focused
            ? "border-[#6366f1] shadow-[0_0_0_4px_rgba(99,102,241,0.18)]"
            : "border-[#e6e6ed]"
        }`}
      >
        {icon && <span className="pl-4 text-lg">{icon}</span>}
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 px-4 py-3.5 bg-transparent text-[#1e1b4b] font-semibold outline-none placeholder-[#94a3b8]"
        />
        {rightSlot}
      </div>
      {error && (
        <div className="text-xs font-bold text-[#e11d48]">⚠ {error}</div>
      )}
      {hint && !error && (
        <div className="text-xs text-[#64748b]">{hint}</div>
      )}
    </div>
  );
};

/* ----------------------------- AuthButton ----------------------------- */
export const AuthButton = ({
  children,
  tone = "indigo",
  size = "md",
  className = "",
  onClick,
  disabled,
  type = "button",
}) => {
  const styles = {
    indigo:
      "bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] hover:brightness-110",
    cyan: "bg-[#06b6d4] text-white shadow-[0_4px_0_#0891b2] hover:brightness-110",
    coral:
      "bg-[#fb7185] text-white shadow-[0_4px_0_#e11d48] hover:brightness-110",
    amber:
      "bg-[#f59e0b] text-white shadow-[0_4px_0_#b45309] hover:brightness-110",
    ghost:
      "bg-white text-[#6366f1] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]",
  };
  const sz =
    size === "sm"
      ? "px-3 py-1.5 text-xs"
      : size === "lg"
      ? "px-6 py-3.5 text-base"
      : "px-5 py-2.5 text-sm";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles[tone]} ${sz} font-extrabold uppercase tracking-wide rounded-2xl active:translate-y-[2px] active:shadow-[0_2px_0] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

/* ----------------------------- SocialButton ----------------------------- */
export const SocialButton = ({ icon, label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1] hover:shadow-[0_3px_0_#e6e6ed] active:translate-y-[1px] active:shadow-[0_1px_0_#e6e6ed] transition-all"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-extrabold text-[#1e1b4b]">{label}</span>
    </button>
  );
};

/* ----------------------------- OtpBoxes ----------------------------- */
export const OtpBoxes = ({ value, onChange, maxLength = 6 }) => {
  const refs = useRef([]);

  // ensure array length
  const arr = Array.from({ length: maxLength }, (_, i) => value[i] || "");

  const handleChange = (i, v) => {
    if (v.length > 1) v = v.slice(-1);
    const next = [...arr];
    next[i] = v;
    onChange(next.join(""));
    if (v && i < maxLength - 1) refs.current[i + 1]?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !arr[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="flex gap-2 justify-between">
      {arr.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          maxLength={1}
          inputMode="numeric"
          className={`w-12 h-14 text-center text-2xl font-black rounded-2xl border-2 transition-all outline-none ${
            v
              ? "bg-[#eef2ff] border-[#6366f1] text-[#4338ca] shadow-[0_2px_0_#4338ca]"
              : "bg-white border-[#e6e6ed] text-[#1e1b4b] focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.18)]"
          }`}
        />
      ))}
    </div>
  );
};

/* ----------------------------- ProgressDots ----------------------------- */
export const ProgressDots = ({ current, total }) => {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < current
              ? "w-8 bg-[#6366f1]"
              : i === current
              ? "w-8 bg-gradient-to-r from-[#6366f1] to-[#a855f7]"
              : "w-2 bg-[#e6e6ed]"
          }`}
        />
      ))}
    </div>
  );
};

/* ----------------------------- maskEmail ----------------------------- */
export const maskEmail = (e) => {
  if (!e || typeof e !== "string") return "";
  const [u, d] = e.split("@");
  if (!u || !d) return e;
  return `${u.slice(0, 4)}***@${d}`;
};

/* ----------------------------- fmtTime ----------------------------- */
export const fmtTime = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
