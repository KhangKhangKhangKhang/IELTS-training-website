import React, { useState, useRef } from "react";
import { Input, Checkbox } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { resolveActiveIdx } from "./fillInsertHelpers";
import InteractiveSharedPreview from "./InteractiveSharedPreview";

// FLOW_CHART_COMPLETION
// BE metadata: { stepLabel, maxWords, hasWordBank, wordBank?, correctAnswers[], fullFlowText? }
//
// Group-level FillSharedEditor owns the shared flow text and word bank.
// This per-question form is answer-only with an optional override,
// plus click-to-jump on each [Step N] in the shared text.

const defaultValue = () => ({
  stepLabel: "",
  maxWords: 1,
  hasWordBank: false,
  wordBank: [],
  correctAnswers: [""],
  fullFlowText: "",
});

const FlowChartCompletionForm = ({
  value,
  onChange,
  readOnlyText = "",
  wordBank = [],
  hasWordBank = false,
  questionIndex = 0,
}) => {
  const v = value || defaultValue();
  const correctAnswers = Array.isArray(v.correctAnswers) ? v.correctAnswers : [""];
  const [override, setOverride] = useState(
    () => !!(v.fullFlowText && v.fullFlowText !== readOnlyText)
  );
  const update = (patch) => onChange({ ...v, ...patch });
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
      update({ fullFlowText: v.fullFlowText || readOnlyText });
    } else {
      update({ fullFlowText: "" });
    }
  };

  // Click-to-jump: focus the answer input for step N + sync stepLabel.
  // Note: FLOW_CHART regex accepts both [N] and [Step N] — when the
  // teacher clicks a button we always write the bare number to stepLabel
  // (consistent with how blanks are numbered in the BE).
  const focusAnswer = (n) => {
    const idx = n - 1;
    const el = answerRefs.current[idx];
    if (el) {
      el.focus();
      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    if (String(v.stepLabel) !== String(n)) {
      update({ stepLabel: String(n) });
    }
  };

  // Active step: prefer stepLabel, fallback questionIndex + 1.
  const activeIdx = resolveActiveIdx(
    v.stepLabel,
    questionIndex,
    "FLOW_CHART_COMPLETION"
  );

  return (
    <div className="space-y-3">
      <InteractiveSharedPreview
        label="Shared flow text"
        text={readOnlyText}
        subType="FLOW_CHART_COMPLETION"
        activeIdx={activeIdx}
        onSelect={focusAnswer}
      />

      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Step label (e.g. "Step 3")
        </span>
        <Input
          value={v.stepLabel}
          onChange={(e) => update({ stepLabel: e.target.value })}
        />
      </label>

      <Checkbox checked={override} onChange={toggleOverride}>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b]">
          Override flow text for this question
        </span>
      </Checkbox>

      {override && (
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Custom flow text (this question only)
          </span>
          <Input.TextArea
            value={v.fullFlowText}
            onChange={(e) => update({ fullFlowText: e.target.value })}
            rows={3}
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
            const stepNum = activeIdx != null ? activeIdx + i : null;
            return (
              <div key={i} className="flex items-center gap-2">
                {stepNum != null && (
                  <span
                    className={`flex-none inline-flex items-center justify-center min-w-[1.5rem] h-7 px-1.5 rounded-md font-mono font-black text-[10px] ${
                      i === 0
                        ? "bg-[#f59e0b] text-white"
                        : "bg-white text-[#b45309] border border-[#fde68a]"
                    }`}
                    title={
                      i === 0
                        ? `Answer for step ${activeIdx}`
                        : `Extra acceptable answer for step ${activeIdx}`
                    }
                  >
                    {stepNum}
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

export default FlowChartCompletionForm;
