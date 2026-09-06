// Badge - pill tone màu, dùng cho moderation status, count, hot...
// Props:
//   tone: 'indigo' | 'cyan' | 'coral' | 'amber' | 'green' | 'purple' | 'slate'
//   children: nội dung
//   className: string (override)
const TONE_CLASS = {
  indigo: "bg-indigo-100 text-indigo-700",
  cyan: "bg-cyan-100 text-cyan-700",
  coral: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
  purple: "bg-violet-100 text-violet-700",
  slate: "bg-slate-100 text-slate-700",
};

export const Badge = ({
  tone = "slate",
  children,
  className = "",
}) => {
  const toneClass = TONE_CLASS[tone] || TONE_CLASS.slate;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
