import React from "react";
import { SKILL_META } from "./editorUI";

// Reusable sidebar. Pass `parts` (from props) or fall back to per-skill static demo.
// `parts` shape: [{ id, name, meta, status }] where status ∈ 'done' | 'editing' | 'todo'
const STATIC_PARTS = {
  READING: [
    { name: "Part 1", meta: "0 questions", status: "todo" },
    { name: "Part 2", meta: "0 questions", status: "todo" },
    { name: "Part 3", meta: "0 questions", status: "todo" },
  ],
  LISTENING: [
    { name: "Section 1", meta: "0 questions · audio", status: "todo" },
    { name: "Section 2", meta: "0 questions · audio", status: "todo" },
    { name: "Section 3", meta: "0 questions · audio", status: "todo" },
    { name: "Section 4", meta: "0 questions · audio", status: "todo" },
  ],
  WRITING: [
    { name: "Task 1", meta: "≥150 words", status: "todo" },
    { name: "Task 2", meta: "≥250 words", status: "todo" },
  ],
  SPEAKING: [
    { name: "Part 1", meta: "0 topics", status: "todo" },
    { name: "Part 2", meta: "0 topics", status: "todo" },
    { name: "Part 3", meta: "0 topics", status: "todo" },
  ],
};

export function EditorSidebar({
  skill,
  parts,
  activeIdx = 0,
  onSelect,
  onCreate,
  exam,
  totalQuestions = 0,
  targetQuestions = 0,
}) {
  const meta = SKILL_META[skill];
  const list = parts && parts.length > 0 ? parts : STATIC_PARTS[skill];
  const partWord =
    skill === "LISTENING" ? "Section" : skill === "WRITING" ? "Task" : "Part";

  const completed = list.filter((p) => p.status === "done").length;
  const completionPct =
    list.length > 0 ? Math.round((completed / list.length) * 100) : 0;

  return (
    <aside className="hidden lg:flex w-60 flex-col bg-white border-r-2 border-[#e6e6ed] sticky top-0 h-screen">
      <div className="p-5 border-b-2 border-[#e6e6ed]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] shadow-[0_3px_0_#4338ca] flex items-center justify-center text-lg">
            🦉
          </div>
          <div>
            <div className="font-black text-[#1e1b4b]">OwlIELTS</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#fb7185]">
              Teacher
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] px-3 py-2">
          Test Structure
        </div>
        <div className={`px-3 py-2 rounded-xl ${meta.tone} mb-2`}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1">
            {meta.icon} {meta.label}
          </div>
          <div className="text-sm font-extrabold text-[#1e1b4b] truncate">
            {exam?.title || "Untitled"}
          </div>
        </div>

        {list.map((p, i) => {
          const active = activeIdx === i;
          const dot =
            p.status === "editing"
              ? "bg-[#6366f1]"
              : p.status === "done"
              ? "bg-[#10b981]"
              : "bg-[#94a3b8]";
          return (
            <button
              key={p.id || p.name}
              onClick={() => onSelect && onSelect(i)}
              className={`w-full px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5 transition-all text-left ${
                active
                  ? "bg-[#eef2ff] text-[#4338ca]"
                  : "text-[#64748b] hover:bg-[#f1f1f6]"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-none ${
                  active
                    ? "bg-[#6366f1] text-white"
                    : "bg-white border-2 border-[#e6e6ed] text-[#64748b]"
                }`}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold truncate">{p.name}</div>
                <div className="text-[10px] flex items-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <span>{p.meta}</span>
                </div>
              </div>
            </button>
          );
        })}

        <button
          onClick={onCreate}
          className="w-full mt-2 px-3 py-2 rounded-xl text-xs font-bold border-2 border-dashed border-[#e6e6ed] text-[#64748b] hover:border-[#6366f1] hover:text-[#6366f1]"
        >
          + Add {partWord}
        </button>

        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] px-3 py-2 pt-4">
          Overview
        </div>
        <div className="px-3 py-2 space-y-2">
          <Row label="Parts" value={String(list.length)} />
          <Row
            label="Completed"
            value={`${completionPct}%`}
            valueColor="text-[#10b981]"
          />
          <div className="h-1.5 bg-[#f1f1f6] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#10b981] rounded-full"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <Row
            label="Questions"
            value={
              targetQuestions > 0
                ? `${totalQuestions} / ${targetQuestions}`
                : `${totalQuestions}`
            }
          />
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value, valueColor = "text-[#1e1b4b]" }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[#64748b]">{label}</span>
      <span className={`font-extrabold ${valueColor}`}>{value}</span>
    </div>
  );
}
