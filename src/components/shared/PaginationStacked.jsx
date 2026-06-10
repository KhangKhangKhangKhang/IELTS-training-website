// Stacked-style pagination matching the magicpath indigo/purple theme.
// Renders: ‹ First / ‹ Prev / 1 2 3 ... n / Next › / Last › with current page
// highlighted. Tone indigo matches the rest of the canvas.
import React from "react";

function NavBtn({ children, onClick, disabled, active }) {
  const base =
    "min-w-9 h-9 px-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all flex items-center justify-center";
  if (active) {
    return (
      <button
        disabled
        className={`${base} bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca] cursor-default`}
      >
        {children}
      </button>
    );
  }
  if (disabled) {
    return (
      <button
        disabled
        className={`${base} bg-[#f1f1f6] text-[#94a3b8] cursor-not-allowed`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`${base} bg-white text-[#64748b] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1] hover:text-[#6366f1] active:translate-y-[1px] active:shadow-[0_1px_0_#e6e6ed]`}
    >
      {children}
    </button>
  );
}

function getPageNumbers(current, total) {
  // Show up to 5 page buttons with ellipsis when needed.
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("...");
    out.push(p);
  });
  return out;
}

export const PaginationStacked = ({ page, totalPages, onChange, total, pageSize }) => {
  if (totalPages <= 1) {
    return total > 0 ? (
      <div className="text-[11px] font-bold text-[#94a3b8]">
        {total} mục
      </div>
    ) : null;
  }
  const pages = getPageNumbers(page, totalPages);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div className="text-[11px] font-bold text-[#94a3b8]">
        Trang {page}/{totalPages} · {total} mục
        {pageSize ? ` · ${pageSize}/trang` : ""}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <NavBtn onClick={() => onChange(1)} disabled={page === 1}>
          «
        </NavBtn>
        <NavBtn onClick={() => onChange(page - 1)} disabled={page === 1}>
          ‹ Trước
        </NavBtn>
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`dots-${i}`}
              className="px-1 text-[#94a3b8] font-extrabold text-xs"
            >
              …
            </span>
          ) : (
            <NavBtn
              key={p}
              onClick={() => onChange(p)}
              active={p === page}
            >
              {p}
            </NavBtn>
          )
        )}
        <NavBtn onClick={() => onChange(page + 1)} disabled={page === totalPages}>
          Sau ›
        </NavBtn>
        <NavBtn onClick={() => onChange(totalPages)} disabled={page === totalPages}>
          »
        </NavBtn>
      </div>
    </div>
  );
};

export default PaginationStacked;
