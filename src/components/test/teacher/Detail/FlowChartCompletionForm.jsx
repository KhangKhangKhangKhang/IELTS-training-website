import React from "react";
import { Input, InputNumber, Checkbox } from "antd";
import { PlusOutlined } from "@ant-design/icons";

// FLOW_CHART_COMPLETION
// BE metadata: { stepLabel, maxWords, hasWordBank, wordBank?, correctAnswers[], fullFlowText? }
const defaultValue = () => ({
  stepLabel: "",
  maxWords: 1,
  hasWordBank: false,
  wordBank: [],
  correctAnswers: [""],
  fullFlowText: "",
});

const FlowChartCompletionForm = ({ value = defaultValue(), onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });

  const setAnswer = (idx, text) => {
    update({
      correctAnswers: value.correctAnswers.map((a, i) => (i === idx ? text : a)),
    });
  };

  const addWord = () => {
    update({
      wordBank: [...(value.wordBank || []), { id: `w${Date.now()}`, text: "" }],
    });
  };

  const updateWord = (idx, text) => {
    update({
      wordBank: value.wordBank.map((w, i) => (i === idx ? { ...w, text } : w)),
    });
  };

  const removeWord = (idx) => {
    update({ wordBank: value.wordBank.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Step label (e.g. "Step 3")
        </span>
        <Input
          value={value.stepLabel}
          onChange={(e) => update({ stepLabel: e.target.value })}
        />
      </label>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Max words
        </span>
        <InputNumber
          min={1}
          max={5}
          value={value.maxWords}
          onChange={(v) => update({ maxWords: Number(v) || 1 })}
          className="w-32"
        />
      </div>

      <Checkbox
        checked={value.hasWordBank}
        onChange={(e) =>
          update({
            hasWordBank: e.target.checked,
            wordBank: e.target.checked && !value.wordBank?.length
              ? [{ id: "w1", text: "" }]
              : value.wordBank,
          })
        }
      >
        Use word bank
      </Checkbox>

      {value.hasWordBank && (
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Word bank
          </span>
          <div className="space-y-1.5">
            {value.wordBank.map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={w.text}
                  onChange={(e) => updateWord(i, e.target.value)}
                  size="small"
                />
                <button
                  onClick={() => removeWord(i)}
                  className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addWord}
            className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
          >
            <PlusOutlined /> Add word
          </button>
        </div>
      )}

      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Full flow text (optional, with [number] placeholders)
        </span>
        <Input.TextArea
          value={value.fullFlowText}
          onChange={(e) => update({ fullFlowText: e.target.value })}
          rows={3}
        />
      </label>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Acceptable answers
        </span>
        <div className="space-y-1.5">
          {value.correctAnswers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={ans}
                onChange={(e) => setAnswer(i, e.target.value)}
                size="small"
              />
              {value.correctAnswers.length > 1 && (
                <button
                  onClick={() =>
                    update({
                      correctAnswers: value.correctAnswers.filter((_, j) => j !== i),
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
          onClick={() => update({ correctAnswers: [...value.correctAnswers, ""] })}
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
        >
          <PlusOutlined /> Add acceptable answer
        </button>
      </div>
    </div>
  );
};

export default FlowChartCompletionForm;
