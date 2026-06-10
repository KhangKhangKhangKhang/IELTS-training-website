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

export const STATUS_META = {
  pending: { label: "Đang chờ AI", cls: "bg-[#f1f1f6] text-[#64748b]" },
  auto_approved: { label: "Tự duyệt (AI)", cls: "bg-[#d1fae5] text-[#047857]" },
  needs_review: { label: "Cần duyệt tay", cls: "bg-[#fef3c7] text-[#b45309]" },
  auto_rejected: { label: "Tự từ chối (AI)", cls: "bg-[#fee2e2] text-[#b91c1c]" },
  approved: { label: "Đã duyệt", cls: "bg-[#dbeafe] text-[#1d4ed8]" },
  rejected: { label: "Đã từ chối", cls: "bg-[#ffe4e6] text-[#be123c]" },
  changes_requested: { label: "Yêu cầu sửa", cls: "bg-[#f3e8ff] text-[#7e22ce]" },
};

export function StatusTag({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

export function ScorePill({ score }) {
  const cls =
    score >= 80
      ? "bg-[#d1fae5] text-[#047857]"
      : score <= 20
      ? "bg-[#fee2e2] text-[#b91c1c]"
      : "bg-[#fef3c7] text-[#b45309]";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black ${cls}`}
    >
      🤖 {score}
    </span>
  );
}

export function ActionBtn({ children, onClick, variant }) {
  const styles = {
    approve:
      "bg-[#10b981] text-white shadow-[0_2px_0_#047857] hover:brightness-110",
    reject:
      "bg-[#ef4444] text-white shadow-[0_2px_0_#b91c1c] hover:brightness-110",
    changes:
      "bg-[#a855f7] text-white shadow-[0_2px_0_#7e22ce] hover:brightness-110",
    ghost:
      "bg-white text-[#64748b] border-2 border-[#e6e6ed] hover:border-[#6366f1] hover:text-[#6366f1]",
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all active:translate-y-[1px] ${
        styles[variant] || styles.ghost
      }`}
    >
      {children}
    </button>
  );
}
