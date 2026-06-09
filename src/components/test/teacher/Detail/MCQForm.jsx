import React from "react";
import { Input, Checkbox } from "antd";
import { inputCls } from "@/components/magicpath/ielts-test-editor/editorUI";

// MCQ (MULTIPLE_CHOICE)
// BE metadata: { options: [{label, text}], correctOptionIndexes: number[], isMultiSelect: boolean }
const LABELS = ["A", "B", "C", "D", "E", "F"];

const defaultValue = () => ({
  type: "MULTIPLE_CHOICE",
  options: LABELS.slice(0, 4).map((l) => ({ label: l, text: "" })),
  correctOptionIndexes: [0],
  isMultiSelect: false,
});

const MCQForm = ({ value = defaultValue(), onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });

  const setOptionText = (idx, text) => {
    const options = value.options.map((o, i) =>
      i === idx ? { ...o, text } : o
    );
    update({ options });
  };

  const addOption = () => {
    if (value.options.length >= 6) return;
    const next = LABELS[value.options.length];
    update({
      options: [...value.options, { label: next, text: "" }],
    });
  };

  const removeOption = (idx) => {
    if (value.options.length <= 2) return;
    const options = value.options
      .filter((_, i) => i !== idx)
      .map((o, i) => ({ ...o, label: LABELS[i] }));
    const correctOptionIndexes = value.correctOptionIndexes
      .filter((i) => i !== idx)
      .map((i) => (i > idx ? i - 1 : i));
    update({ options, correctOptionIndexes });
  };

  const toggleCorrect = (idx) => {
    let next;
    if (value.isMultiSelect) {
      next = value.correctOptionIndexes.includes(idx)
        ? value.correctOptionIndexes.filter((i) => i !== idx)
        : [...value.correctOptionIndexes, idx].sort((a, b) => a - b);
    } else {
      next = [idx];
    }
    update({ correctOptionIndexes: next });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <Checkbox
          checked={value.isMultiSelect}
          onChange={(e) =>
            update({
              isMultiSelect: e.target.checked,
              // When switching to single, keep only the first correct
              correctOptionIndexes: e.target.checked
                ? value.correctOptionIndexes
                : value.correctOptionIndexes.slice(0, 1),
            })
          }
        >
          Allow multiple correct answers
        </Checkbox>
      </div>

      <div className="space-y-1.5">
        {value.options.map((opt, i) => {
          const isCorrect = value.correctOptionIndexes.includes(i);
          return (
            <div key={i} className="flex items-center gap-2">
              <Checkbox
                checked={isCorrect}
                onChange={() => toggleCorrect(i)}
                className="shrink-0"
              />
              <span className="font-extrabold text-[#1e1b4b] w-5 text-center text-xs">
                {opt.label}
              </span>
              <Input
                value={opt.text}
                onChange={(e) => setOptionText(i, e.target.value)}
                className="flex-1"
                placeholder={`Option ${opt.label}`}
                size="small"
              />
              {value.options.length > 2 && (
                <button
                  onClick={() => removeOption(i)}
                  className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] text-xs shrink-0"
                  title="Remove option"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {value.options.length < 6 && (
        <button
          onClick={addOption}
          className="text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
        >
          + Add option
        </button>
      )}
    </div>
  );
};

export default MCQForm;
