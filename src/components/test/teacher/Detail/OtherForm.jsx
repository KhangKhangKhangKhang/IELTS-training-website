import React from "react";
import { Input, InputNumber } from "antd";
import { PlusOutlined } from "@ant-design/icons";

// OTHER (free-form, no validation)
// BE metadata: { maxWords, correctAnswers[] } — same shape as SHORT_ANSWER
// But "OTHER" is meant for question types that don't fit any standard
// (e.g. custom essay-style). Teacher can put expected answer(s) for
// manual grading, plus an optional max word count.
const defaultValue = () => ({
  maxWords: 50,
  correctAnswers: [""],
  notes: "",    type: "OTHER",
  });

const OtherForm = ({ value = defaultValue(), onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });

  const setAnswer = (idx, text) => {
    update({
      correctAnswers: value.correctAnswers.map((a, i) => (i === idx ? text : a)),
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Max words (recommended)
        </span>
        <InputNumber
          min={1}
          max={500}
          value={value.maxWords}
          onChange={(v) => update({ maxWords: Number(v) || 1 })}
          className="w-32"
        />
      </div>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Expected / reference answer(s) (for manual grading)
        </span>
        <div className="space-y-1.5">
          {value.correctAnswers.map((ans, i) => (
            <div key={i} className="flex items-start gap-2">
              <Input.TextArea
                value={ans}
                onChange={(e) => setAnswer(i, e.target.value)}
                rows={2}
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
          <PlusOutlined /> Add reference answer
        </button>
      </div>

      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Grading notes (internal, not shown to students)
        </span>
        <Input.TextArea
          value={value.notes}
          onChange={(e) => update({ notes: e.target.value })}
          rows={2}
          placeholder="Optional guidance for manual grading"
        />
      </label>
    </div>
  );
};

export default OtherForm;
