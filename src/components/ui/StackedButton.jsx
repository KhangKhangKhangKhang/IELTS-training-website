// components/ui/StackedButton.jsx
// Shared "stacked shadow" button primitive used across redesigned screens
// (landing page, auth, test manager). Tones: indigo | cyan | coral | amber | ghost.
import React from "react";

const TONE_STYLES = {
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

const SIZE_STYLES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3.5 text-base",
};

const StackedButton = ({
  children,
  tone = "indigo",
  size = "md",
  className = "",
  onClick,
  disabled,
  type = "button",
}) => {
  const toneClass = TONE_STYLES[tone] || TONE_STYLES.indigo;
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${toneClass} ${sizeClass} font-extrabold uppercase tracking-wide rounded-2xl active:translate-y-[2px] active:shadow-[0_2px_0] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

export default StackedButton;
