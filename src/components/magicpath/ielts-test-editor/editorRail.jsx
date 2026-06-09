import React from "react";

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

export function EditorRail({ skill }) {
  const items = VALIDATIONS[skill] || [];
  return (
    <aside className="hidden xl:block w-[340px] shrink-0 border-l-2 border-[#e6e6ed] bg-white">
      <div className="sticky top-[120px] p-4 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
        <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white rounded-3xl shadow-[0_3px_0_#0b0a1f] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                Student preview
              </div>
              <div className="text-[11px] opacity-70 font-semibold">Approximate learner view</div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-white/15 text-[10px] font-black">Live</span>
          </div>
          <PreviewBlock skill={skill} />
        </div>

        <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#fb7185]">
              Validation
            </div>
            <span className="text-[10px] font-black text-[#4338ca] bg-[#eef2ff] px-2 py-0.5 rounded-full">
              {items.filter((i) => i.ok).length}/{items.length}
            </span>
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
          <button className="w-full px-3 py-2 rounded-xl bg-[#eef2ff] text-[#4338ca] text-xs font-black text-left hover:bg-[#e0e7ff] transition-colors">
            Review incomplete fields
          </button>
          <button className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] text-[#475569] border border-[#e2e8f0] text-xs font-black text-left hover:border-[#6366f1] transition-colors">
            Check student preview
          </button>
        </div>
      </div>
    </aside>
  );
}

function PreviewBlock({ skill }) {
  if (skill === "WRITING") {
    return (
      <div className="bg-white/10 rounded-2xl p-3 backdrop-blur">
        <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 mb-1">
          Task 1
        </div>
        <div className="text-xs font-semibold mb-2">
          The chart below shows the percentage of households...
        </div>
        <div className="h-16 rounded-lg bg-white/15 flex items-center justify-center text-2xl">
          📊
        </div>
      </div>
    );
  }
  if (skill === "SPEAKING") {
    return (
      <div className="bg-white/10 rounded-2xl p-3 backdrop-blur">
        <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 mb-1">
          Part 1 · Hometown
        </div>
        <div className="text-xs font-semibold mb-2">
          Where is your hometown?
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="px-2 py-1 rounded-lg bg-white/15">🎙️ 45s speak</span>
          <span className="px-2 py-1 rounded-lg bg-[#a855f7]">● Recording</span>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white/10 rounded-2xl p-3 backdrop-blur">
      {skill === "LISTENING" && (
        <div className="mb-2 flex items-center gap-2 text-[10px]">
          <span className="px-2 py-1 rounded-lg bg-[#06b6d4]">▶ 0:42 / 5:42</span>
        </div>
      )}
      <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 mb-1">
        Question 6
      </div>
      <div className="text-xs font-semibold mb-3">
        Camellia sinensis produces tea with bolder flavours.
      </div>
      <div className="grid grid-cols-3 gap-1">
        {["TRUE", "FALSE", "NOT GIVEN"].map((v, i) => (
          <div
            key={v}
            className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold text-center ${
              i === 1 ? "bg-[#fb7185] text-white" : "bg-white/15"
            }`}
          >
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}
