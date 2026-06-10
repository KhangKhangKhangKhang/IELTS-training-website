import React, { useMemo, useState } from "react";

const VALIDATIONS = {
  READING: [
    { ok: true, text: "Passage added for the first Part" },
    { ok: true, text: "At least 1 question group exists" },
    { ok: false, warn: true, text: "Some groups still need answers" },
    { ok: true, text: "Total questions = 13 / Required 13" },
  ],
  LISTENING: [
    { ok: true, text: "Audio uploaded for Section 1" },
    { ok: false, warn: true, text: "Sections 2-4 have no audio yet" },
    { ok: true, text: "First question group is ready" },
    { ok: false, warn: true, text: "Need 40 questions (currently 10)" },
  ],
  WRITING: [
    { ok: true, text: "Task 1 has prompt and image" },
    { ok: true, text: "Task 1 has time limit (20 min)" },
    { ok: false, warn: true, text: "Task 2 prompt is missing" },
    { ok: true, text: "Total time = 60 minutes" },
  ],
  SPEAKING: [
    { ok: true, text: "Part 1 has 2 topics" },
    { ok: true, text: "Each question has a speak time" },
    { ok: false, warn: true, text: "Part 2 (cue card) has no content yet" },
    { ok: false, warn: true, text: "Part 3 has no questions yet" },
  ],
};

const TIPS = {
  READING:
    "Highlight a sentence in the passage then click 'Create question' to auto-link it.",
  LISTENING:
    "Upload clear audio and add timestamps per section so students can follow along.",
  WRITING: "Task 1 needs a clear chart. Task 2 should be an open argumentative prompt.",
  SPEAKING:
    "Add sub-prompts to suggest answer directions and help students practice better.",
};

const SAMPLE_QUESTIONS = {
  READING: {
    title: "Question 6",
    prompt: "Camellia sinensis produces tea with bolder flavours.",
    answers: ["TRUE", "FALSE", "NOT GIVEN"],
    correct: 1,
    context: "TFNG · student taps one option · instant selection state",
  },
  LISTENING: {
    title: "Question 4",
    prompt: "Write ONE WORD ONLY: The tour starts near the ____.",
    answers: ["station", "museum", "harbour"],
    correct: 0,
    context: "Listening gap-fill · answer pill preview",
  },
};

export function EditorRail({
  skill,
  exam,
  tab,
  onTabChange,
  sidebarState = {},
  totalQuestions = 0,
  targetQuestions = 0,
}) {
  const [picked, setPicked] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const items = useMemo(
    () => buildValidations({ skill, sidebarState, totalQuestions, targetQuestions }),
    [skill, sidebarState, totalQuestions, targetQuestions]
  );
  const done = items.filter((i) => i.ok).length;
  const score = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <aside className="hidden xl:block w-[340px] shrink-0 border-l-2 border-[#e6e6ed] bg-white">
      <div className="sticky top-[120px] p-4 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
        <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white rounded-3xl shadow-[0_3px_0_#0b0a1f] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                Student preview
              </div>
              <div className="text-[11px] opacity-70 font-semibold">Live mini simulation</div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-emerald-400/20 text-emerald-100 text-[10px] font-black">Live</span>
          </div>
          <PreviewBlock skill={skill} picked={picked} setPicked={setPicked} showHint={showHint} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-[10px] font-black uppercase transition-colors"
            >
              {showHint ? "Hide hint" : "Show hint"}
            </button>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase transition-colors"
            >
              Reset answer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#fb7185]">
              Validation
            </div>
            <span className="text-[10px] font-black text-[#4338ca] bg-[#eef2ff] px-2 py-0.5 rounded-full">
              {done}/{items.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#eef2ff] overflow-hidden mb-3">
            <div className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#6366f1] transition-all" style={{ width: `${score}%` }} />
          </div>
          <ul className="space-y-2 text-xs">
            {items.map((v, i) => (
              <li
                key={i}
                className={`flex items-start gap-2 ${
                  v.ok
                    ? "text-[#047857]"
                    : v.warn
                    ? "text-[#b45309]"
                    : "text-[#64748b]"
                }`}
              >
                <span>{v.ok ? "✓" : v.warn ? "!" : "○"}</span>
                <span>{v.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#eef2ff] border-2 border-[#c7d2fe] rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold text-[#4338ca]">Prep tip</div>
            <div className="w-8 h-8 rounded-xl bg-white border border-[#c7d2fe] flex items-center justify-center text-[10px] font-black text-[#4338ca]">
              IELTS
            </div>
          </div>
          <div className="text-xs text-[#1e1b4b] leading-relaxed">
            {TIPS[skill]}
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4 space-y-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
            Quick actions
          </div>
          <button
            type="button"
            onClick={() => onTabChange?.("questions")}
            className={`w-full px-3 py-2 rounded-xl text-xs font-black text-left transition-colors ${tab === "questions" ? "bg-[#eef2ff] text-[#4338ca]" : "bg-[#f8fafc] text-[#475569] border border-[#e2e8f0] hover:border-[#6366f1]"}`}
          >
            Review question groups
          </button>
          {skill === "READING" && (
            <button
              type="button"
              onClick={() => onTabChange?.("content")}
              className={`w-full px-3 py-2 rounded-xl text-xs font-black text-left transition-colors ${tab === "content" ? "bg-[#eef2ff] text-[#4338ca]" : "bg-[#f8fafc] text-[#475569] border border-[#e2e8f0] hover:border-[#6366f1]"}`}
            >
              Edit passage content
            </button>
          )}
          <div className="rounded-2xl bg-[#fafafc] border border-[#e6e6ed] p-3 text-[11px] text-[#64748b] font-semibold">
            {exam?.duration || 60} min · target {targetQuestions || exam?.numberQuestion || 40} Qs · current {totalQuestions || 0}
          </div>
        </div>
      </div>
    </aside>
  );
}

function buildValidations({ skill, sidebarState, totalQuestions, targetQuestions }) {
  if (skill !== "READING" && skill !== "LISTENING") return VALIDATIONS[skill] || [];
  const parts = sidebarState.parts || [];
  const groupCount = Number(sidebarState.groupCount) || 0;
  const target = Number(targetQuestions) || 40;
  const hasContent = skill === "READING" ? !!sidebarState.hasPassage : true;
  return [
    { ok: parts.length > 0, text: `${skill === "READING" ? "Passage/part" : "Audio part"} structure exists` },
    { ok: hasContent, warn: !hasContent, text: skill === "READING" ? "Active part has passage content" : "Listening audio attached" },
    { ok: groupCount > 0, warn: groupCount === 0, text: `${groupCount} question group${groupCount === 1 ? "" : "s"} in active part` },
    { ok: totalQuestions >= target, warn: totalQuestions > 0 && totalQuestions < target, text: `Total questions = ${totalQuestions} / Required ${target}` },
  ];
}

function PreviewBlock({ skill, picked, setPicked, showHint }) {
  if (skill === "WRITING") {
    return (
      <div className="bg-white/10 rounded-2xl p-3 backdrop-blur space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">Task 1</div>
          <span className="text-[10px] bg-white/15 rounded-lg px-2 py-1">20 min</span>
        </div>
        <div className="text-xs font-semibold">The chart below shows the percentage of households...</div>
        <div className="h-16 rounded-lg bg-white/15 flex items-end gap-1 p-3">
          {[35, 52, 28, 61, 46].map((h, i) => <span key={i} className="flex-1 rounded-t bg-cyan-300/80" style={{ height: `${h}%` }} />)}
        </div>
        {showHint && <div className="text-[10px] bg-emerald-400/20 rounded-xl p-2">Student sees task + visual first. Add chart labels if missing.</div>}
      </div>
    );
  }
  if (skill === "SPEAKING") {
    return (
      <div className="bg-white/10 rounded-2xl p-3 backdrop-blur space-y-3">
        <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">Part 1 · Hometown</div>
        <div className="text-xs font-semibold">Where is your hometown?</div>
        <div className="h-2 rounded-full bg-white/15 overflow-hidden"><div className="h-full w-2/3 bg-[#a855f7]" /></div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="px-2 py-1 rounded-lg bg-white/15">🎙️ 45s speak</span>
          <span className="px-2 py-1 rounded-lg bg-[#a855f7]">● Recording</span>
        </div>
        {showHint && <div className="text-[10px] bg-emerald-400/20 rounded-xl p-2">Preview checks timer + prompt density.</div>}
      </div>
    );
  }

  const sample = SAMPLE_QUESTIONS[skill] || SAMPLE_QUESTIONS.READING;
  return (
    <div className="bg-white/10 rounded-2xl p-3 backdrop-blur">
      {skill === "LISTENING" && (
        <div className="mb-2 space-y-1">
          <div className="flex items-center gap-2 text-[10px]"><span className="px-2 py-1 rounded-lg bg-[#06b6d4]">▶ 0:42 / 5:42</span></div>
          <div className="h-1.5 rounded-full bg-white/15 overflow-hidden"><div className="h-full w-[18%] bg-[#06b6d4]" /></div>
        </div>
      )}
      <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 mb-1">{sample.title}</div>
      <div className="text-xs font-semibold mb-3">{sample.prompt}</div>
      <div className="grid grid-cols-3 gap-1">
        {sample.answers.map((v, i) => (
          <button
            type="button"
            key={v}
            onClick={() => setPicked(i)}
            className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold text-center transition-all ${picked === i ? "bg-[#fb7185] text-white shadow-[0_2px_0_rgba(0,0,0,.25)]" : "bg-white/15 hover:bg-white/25"}`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="mt-2 text-[10px] opacity-80">
        {picked === null ? sample.context : picked === sample.correct ? "✓ Correct state works" : "Selected state works · answer key differs"}
      </div>
      {showHint && <div className="mt-2 text-[10px] bg-emerald-400/20 rounded-xl p-2">Student interaction visible here. Click answers to test UX quickly.</div>}
    </div>
  );
}
