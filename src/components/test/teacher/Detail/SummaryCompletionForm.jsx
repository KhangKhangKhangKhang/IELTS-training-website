import React, { useState, useRef } from "react";
import { Input, InputNumber, Checkbox } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { resolveActiveIdx } from "./fillInsertHelpers";
import InteractiveSharedPreview from "./InteractiveSharedPreview";

// SUMMARY_COMPLETION
// BE metadata: { blankLabel, maxWords, hasWordBank, wordBank?, correctAnswers[], fullParagraph? }
//
// Group-level FillSharedEditor owns:
//   - fullParagraph (shared summary text with [N] placeholders)
//   - maxWords
//   - hasWordBank + wordBank
// This per-question form is answer-only — but with click-to-jump
// interactivity so the teacher can click `[14]` in the shared
// paragraph to focus the answer for blank 14.

const defaultValue = () => ({
  blankLabel: "",
  maxWords: 1,
  hasWordBank: false,
  wordBank: [],
  correctAnswers: [""],
  fullParagraph: "",
});

const SummaryCompletionForm = ({
  value,
  onChange,
  readOnlyText = "",
  wordBank = [],
  hasWordBank = false,
  questionIndex = 0,
  questionNumber,
}) => {
  const v = value || defaultValue();
  const correctAnswers = Array.isArray(v.correctAnswers) ? v.correctAnswers : [""];

  // Auto-fill blankLabel from questionNumber on first render if it's empty
  // OR if it looks like a stale positional value (1, 2, 3...) that doesn't
  // match the actual questionNumber (e.g. 10, 11, 12, 13). Heuristic: a
  // blankLabel that's a small integer when questionNumber is much larger
  // is treated as stale and replaced.
  React.useEffect(() => {
    const labelNum = Number(v.blankLabel);
    const qNum = Number(questionNumber);
    if (Number.isFinite(qNum) && qNum > 0) {
      // Replace stale positional labels (1, 2, 3...) with the real
      // question number when there's a big mismatch.
      if (!Number.isFinite(labelNum) || (labelNum <= questionIndex + 2 && qNum > questionIndex + 2)) {
        onChange({ ...v, blankLabel: String(qNum) });
        return;
      }
    }
    if (!v.blankLabel?.trim()) {
      const fallback = qNum || (Number.isFinite(questionIndex) ? questionIndex + 1 : 1);
      onChange({ ...v, blankLabel: String(fallback) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [override, setOverride] = useState(
    () => !!(v.fullParagraph && v.fullParagraph !== readOnlyText)
  );
  const update = (patch) => onChange({ ...v, ...patch });
  // Refs to each answer input — used by InteractiveSharedPreview to focus
  // the right input when the teacher clicks a [N] in the shared text.
  const answerRefs = useRef([]);

  const setAnswer = (idx, text) => {
    update({
      correctAnswers: correctAnswers.map((a, i) =>
        i === idx ? text : a
      ),
    });
  };

  const toggleOverride = (e) => {
    const next = e.target.checked;
    setOverride(next);
    if (next) {
      update({ fullParagraph: v.fullParagraph || readOnlyText });
    } else {
      update({ fullParagraph: "" });
    }
  };

  // Click-to-jump: focus the answer input for blank N (1-based).
  // We also update blankLabel to N so the active highlight follows
  // the clicked blank — and scroll the input into view (smooth) so
  // the teacher can see which input just got focused when the shared
  // text is long.
  const focusAnswer = (n) => {
    const idx = n - 1;
    const el = answerRefs.current[idx];
    if (el) {
      el.focus();
      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    // Sync blankLabel → n so the indigo highlight follows. Use string
    // for the input, but keep resolveActiveIdx reading Number(blankLabel).
    if (String(v.blankLabel) !== String(n)) {
      update({ blankLabel: String(n) });
    }
  };

  // Which blank is "active" for this question:
  //   - blankLabel set → use that number
  //   - blankLabel empty → fallback questionIndex + 1 (1-based)
  const activeIdx = resolveActiveIdx(
    v.blankLabel,
    questionIndex,
    "SUMMARY_COMPLETION"
  );

  return (
    <div className="space-y-3">
      <InteractiveSharedPreview
        label="Shared summary"
        text={readOnlyText}
        subType="SUMMARY_COMPLETION"
        activeIdx={activeIdx}
        onSelect={focusAnswer}
      />

      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Blank label (e.g. "14") — what student sees
        </span>
        <Input
          value={v.blankLabel}
          onChange={(e) => update({ blankLabel: e.target.value })}
          placeholder="14"
        />
      </label>

      <Checkbox checked={override} onChange={toggleOverride}>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b]">
          Override summary for this question
        </span>
      </Checkbox>

      {override && (
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Custom summary (this question only)
          </span>
          <Input.TextArea
            value={v.fullParagraph}
            onChange={(e) => update({ fullParagraph: e.target.value })}
            rows={4}
          />
        </label>
      )}

      {hasWordBank && wordBank.length > 0 && (
        <div className="rounded-xl border-2 border-[#cffafe] bg-[#ecfeff] p-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0e7490] mb-1.5">
            Word bank (from group)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {wordBank.map((w, i) => (
              <span
                key={w.id || i}
                className="inline-flex items-center px-2 py-1 rounded-lg bg-white border border-[#cffafe] text-[11px] font-bold text-[#0e7490]"
              >
                <span className="font-mono mr-1">
                  {String.fromCharCode(65 + i)}.
                </span>
                {w.text || <span className="italic text-[#94a3b8]">(empty)</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Acceptable answers
        </span>
        <div className="space-y-1.5">
          {correctAnswers.map((ans, i) => {
            // Primary answer badge: the actual blank number (e.g. "14").
            // Alternative badges: "+1", "+2" — make it visually obvious they
            // belong to the SAME blank, not separate blanks.
            const showBadge = activeIdx != null;
            return (
              <div key={i} className="flex items-center gap-2">
                {showBadge && (
                  <span
                    className={`flex-none inline-flex items-center justify-center min-w-[1.5rem] h-7 px-1.5 rounded-md font-mono font-black text-[10px] ${
                      i === 0
                        ? "bg-[#4338ca] text-white"
                        : "bg-white text-[#4338ca] border border-[#c7d2fe]"
                    }`}
                    title={
                      i === 0
                        ? `Answer for blank ${activeIdx}`
                        : `Extra acceptable answer for blank ${activeIdx}`
                    }
                  >
                    {i === 0 ? activeIdx : `+${i}`}
                  </span>
                )}
                <Input
                  ref={(el) => (answerRefs.current[i] = el)}
                  value={ans}
                  onChange={(e) => setAnswer(i, e.target.value)}
                  size="small"
                  placeholder={i === 0 ? "Type the answer the student types" : "Alternative acceptable answer"}
                />
                {correctAnswers.length > 1 && (
                  <button
                    onClick={() =>
                      update({
                        correctAnswers: correctAnswers.filter((_, j) => j !== i),
                      })
                    }
                    className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] text-xs shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={() => update({ correctAnswers: [...correctAnswers, ""] })}
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
        >
          <PlusOutlined /> Add acceptable answer
        </button>
      </div>
    </div>
  );
};

export default SummaryCompletionForm;
