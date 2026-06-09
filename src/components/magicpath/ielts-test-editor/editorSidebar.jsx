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
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] shadow-[0_3px_0_#312e81] flex items-center justify-center text-white font-black tracking-tight text-sm">
            IELTS
          </div>
          <div>
            <div className="font-black text-[#1e1b4b]">IELTS Editor</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1]">
              MagicPath test builder
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
            {meta.label}
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

        {onCreate && (
          <button
            onClick={onCreate}
            className="w-full mt-2 px-3 py-2 rounded-xl text-xs font-bold border-2 border-dashed border-[#e6e6ed] text-[#64748b] hover:border-[#6366f1] hover:text-[#6366f1] active:scale-[0.98] transition-all"
          >
            + Add {partWord}
          </button>
        )}

        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] px-3 py-2 pt-4">
          Overview
        </div>
        <div className="mx-1 rounded-2xl border-2 border-[#e6e6ed] bg-[#fafafc] p-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-2xl bg-white border-2 border-[#e6e6ed] flex items-center justify-center shadow-[0_2px_0_#e6e6ed]">
              <span className="text-sm font-black text-[#4338ca]">{completionPct}%</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-[#1e1b4b]">Build readiness</div>
              <div className="text-[10px] text-[#64748b] font-bold leading-snug">
                Structure, questions, and exam settings at a glance.
              </div>
            </div>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden border border-[#e6e6ed]">
            <div
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#10b981] rounded-full"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Parts" value={String(list.length)} />
            <Metric
              label="Questions"
              value={targetQuestions > 0 ? `${totalQuestions}/${targetQuestions}` : `${totalQuestions}`}
            />
          </div>
          <div className="rounded-xl bg-white border border-[#e6e6ed] p-2 space-y-1.5">
            <MiniCheck ok={list.length > 0} text="Part structure ready" />
            <MiniCheck ok={totalQuestions > 0} text="Question content started" />
            <MiniCheck ok={!targetQuestions || totalQuestions >= targetQuestions} text="Target count reached" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-white border border-[#e6e6ed] p-2">
      <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#94a3b8]">
        {label}
      </div>
      <div className="text-sm font-black text-[#1e1b4b] mt-0.5">{value}</div>
    </div>
  );
}

function MiniCheck({ ok, text }) {
  return (
    <div className={`flex items-center gap-2 text-[10px] font-bold ${ok ? "text-[#047857]" : "text-[#b45309]"}`}>
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${ok ? "bg-[#d1fae5]" : "bg-[#fef3c7]"}`}>
        {ok ? "✓" : "!"}
      </span>
      <span>{text}</span>
    </div>
  );
}
