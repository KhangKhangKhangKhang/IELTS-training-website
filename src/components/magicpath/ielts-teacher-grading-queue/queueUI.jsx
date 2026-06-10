import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] ${className}`}
    >
      {children}
    </div>
  );
}

export function Tag({ tone, children }) {
  const map = {
    writing: "bg-[#eef2ff] text-[#4338ca]",
    speaking: "bg-[#f3e8ff] text-[#7e22ce]",
    pending: "bg-[#fef3c7] text-[#b45309]",
    claimed: "bg-[#cffafe] text-[#0e7490]",
    in_progress: "bg-[#f3e8ff] text-[#7e22ce]",
    completed: "bg-[#d1fae5] text-[#047857]",
    slate: "bg-[#f1f1f6] text-[#64748b]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
        map[tone] || map.slate
      }`}
    >
      {children}
    </span>
  );
}

export function PillButton({
  children,
  onClick,
  variant = "primary",
  size = "sm",
}) {
  const sz = size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-5 py-2.5 text-sm";
  const styles = {
    primary:
      "bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#4338ca]",
    cyan: "bg-[#06b6d4] text-white shadow-[0_3px_0_#0891b2] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#0891b2]",
    green:
      "bg-[#10b981] text-white shadow-[0_3px_0_#047857] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#047857]",
    ghost:
      "bg-white text-[#64748b] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1] hover:text-[#6366f1]",
  };
  return (
    <button
      onClick={onClick}
      className={`${sz} ${
        styles[variant] || styles.primary
      } font-extrabold uppercase tracking-wide rounded-xl transition-all whitespace-nowrap`}
    >
      {children}
    </button>
  );
}
