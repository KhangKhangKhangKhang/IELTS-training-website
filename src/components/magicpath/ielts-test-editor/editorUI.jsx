import React from "react";

export const SKILL_META = {
  READING: {
    icon: "📖",
    label: "Reading",
    color: "bg-[#6366f1]",
    shadow: "shadow-[0_4px_0_#4338ca]",
    tone: "bg-[#eef2ff] text-[#4338ca]",
  },
  LISTENING: {
    icon: "🎧",
    label: "Listening",
    color: "bg-[#06b6d4]",
    shadow: "shadow-[0_4px_0_#0891b2]",
    tone: "bg-[#cffafe] text-[#0e7490]",
  },
  WRITING: {
    icon: "✍️",
    label: "Writing",
    color: "bg-[#fb7185]",
    shadow: "shadow-[0_4px_0_#e11d48]",
    tone: "bg-[#fff1f2] text-[#e11d48]",
  },
  SPEAKING: {
    icon: "🗣️",
    label: "Speaking",
    color: "bg-[#a855f7]",
    shadow: "shadow-[0_4px_0_#7e22ce]",
    tone: "bg-[#f3e8ff] text-[#7e22ce]",
  },
};

export function StackedButton({
  children,
  tone = "indigo",
  size = "md",
  className = "",
  onClick,
}) {
  const styles = {
    indigo: "bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] hover:brightness-110",
    cyan: "bg-[#06b6d4] text-white shadow-[0_4px_0_#0891b2] hover:brightness-110",
    coral: "bg-[#fb7185] text-white shadow-[0_4px_0_#e11d48] hover:brightness-110",
    amber: "bg-[#f59e0b] text-white shadow-[0_4px_0_#b45309] hover:brightness-110",
    purple: "bg-[#a855f7] text-white shadow-[0_4px_0_#7e22ce] hover:brightness-110",
    ghost:
      "bg-white text-[#6366f1] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]",
  };
  const sz =
    size === "sm"
      ? "px-3 py-1.5 text-xs"
      : size === "lg"
      ? "px-6 py-3.5 text-base"
      : "px-4 py-2 text-sm";
  return (
    <button
      onClick={onClick}
      className={`${styles[tone]} ${sz} font-extrabold uppercase tracking-wide rounded-2xl active:translate-y-[2px] active:shadow-[0_2px_0] transition-all whitespace-nowrap ${className}`}
    >
      {children}
    </button>
  );
}

export function SkillSwitcher({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 bg-white rounded-2xl border-2 border-[#e6e6ed] p-1.5 shadow-[0_2px_0_#e6e6ed]">
      {Object.keys(SKILL_META).map((s) => {
        const m = SKILL_META[s];
        const active = value === s;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all ${
              active
                ? `${m.color} text-white ${m.shadow}`
                : "text-[#64748b] hover:bg-[#f1f1f6]"
            }`}
          >
            <span className="text-sm">{m.icon}</span>
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
        {label}
      </span>
      {children}
      {hint && (
        <span className="text-[10px] text-[#94a3b8] font-medium mt-1 block">
          {hint}
        </span>
      )}
    </label>
  );
}

export function inputCls() {
  return "w-full px-4 py-2.5 rounded-2xl border-2 border-[#e6e6ed] focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.15)] font-semibold text-[#1e1b4b] outline-none transition-all";
}
