import React from "react";
import { SKILL_META, StackedButton, SkillSwitcher } from "./editorUI";

export function EditorHeader({
  skill,
  onSkillChange,
  tab,
  onTabChange,
  exam,
  onPreview,
  onImportPdf,
  onPublish,
  busy = false,
}) {
  const meta = SKILL_META[skill];
  const hasContentTab = skill === "READING";
  const contentLabel =
    skill === "READING"
      ? "📄 Passage"
      : skill === "LISTENING"
      ? "🎧 Audio & Script"
      : skill === "WRITING"
      ? "🖊️ Prompt"
      : "🗣️ Topics & Questions";
  const questionsLabel =
    skill === "WRITING" || skill === "SPEAKING" ? null : "❓ Questions";

  const tabs = [
    ...(hasContentTab
      ? [{ id: "content", label: contentLabel, count: null }]
      : []),
    ...(questionsLabel
      ? [{ id: "questions", label: questionsLabel, count: null }]
      : [{ id: "questions", label: contentLabel, count: null }]),
    { id: "settings", label: "⚙️ Settings", count: null },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b-2 border-[#e6e6ed]">
      <div className="px-4 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 rounded-xl bg-white border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1] flex items-center justify-center text-sm font-bold text-[#64748b]"
        >
          ←
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748b] font-bold">Test Manager</span>
            <span className="text-[#94a3b8]">/</span>
            <span className="font-extrabold text-[#1e1b4b] truncate">
              {exam?.title || "Test"}
            </span>
            <span className="text-[#94a3b8]">/</span>
            <span className={`font-extrabold px-1.5 rounded ${meta.tone}`}>
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-lg font-black text-[#1e1b4b] truncate">
              {meta.icon} {exam?.title || "Untitled test"}
            </h1>
            <span className="text-[10px] font-extrabold uppercase bg-[#fef3c7] text-[#b45309] px-2 py-0.5 rounded-full">
              Draft
            </span>
          </div>
        </div>

        <SkillSwitcher value={skill} onChange={onSkillChange} />

        <div className="flex items-center gap-2">
          <StackedButton tone="ghost" onClick={onPreview}>
            👁 Preview
          </StackedButton>
          <StackedButton tone="cyan" onClick={onImportPdf} disabled={busy}>
            📄 Import PDF
          </StackedButton>
          <StackedButton tone="indigo" onClick={onPublish} disabled={busy}>
            🚀 Publish
          </StackedButton>
        </div>
      </div>

      <div className="px-4 sm:px-6 flex items-center gap-1 border-t border-[#e6e6ed] overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`px-4 py-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              tab === t.id
                ? "border-[#6366f1] text-[#4338ca]"
                : "border-transparent text-[#64748b] hover:text-[#1e1b4b]"
            }`}
          >
            {t.label}
            {t.count && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  tab === t.id
                    ? "bg-[#eef2ff] text-[#4338ca]"
                    : "bg-[#f1f1f6] text-[#64748b]"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </header>
  );
}
