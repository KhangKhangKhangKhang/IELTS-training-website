import React, { useState } from "react";
import { Input, Checkbox } from "antd";
import { PlusOutlined } from "@ant-design/icons";

// FLOW_CHART_COMPLETION
// BE metadata: { stepLabel, maxWords, hasWordBank, wordBank?, correctAnswers[], fullFlowText? }
//
// Group-level FillSharedEditor owns the shared flow text and word bank.
// This per-question form is answer-only with an optional override.

const defaultValue = () => ({
  stepLabel: "",
  maxWords: 1,
  hasWordBank: false,
  wordBank: [],
  correctAnswers: [""],
  fullFlowText: "",
});

const SharedPreview = ({ label, text }) => {
  if (!text) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#94a3b8] italic">
        Empty — type the shared flow text at the group level above.
      </div>
    );
  }
  return (
    <div className="rounded-xl border-2 border-[#cffafe] bg-[#f0f9ff] px-3 py-2">
      <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#0e7490] mb-0.5">
        {label} (from group)
      </div>
      <div className="text-sm text-[#0c4a6e] font-medium leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
};

const FlowChartCompletionForm = ({
  value,
  onChange,
  readOnlyText = "",
  wordBank = [],
  hasWordBank = false,
}) => {
  const v = value || defaultValue();
  const correctAnswers = Array.isArray(v.correctAnswers) ? v.correctAnswers : [""];
  const [override, setOverride] = useState(
    () => !!(v.fullFlowText && v.fullFlowText !== readOnlyText)
  );
  const update = (patch) => onChange({ ...v, ...patch });

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

  return (
    <div className="space-y-3">
      <SharedPreview label="Shared flow text" text={readOnlyText} />

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
          {correctAnswers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={ans}
                onChange={(e) => setAnswer(i, e.target.value)}
                size="small"
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
          ))}
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
