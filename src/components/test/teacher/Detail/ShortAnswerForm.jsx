import React from "react";
import { Input, InputNumber, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";

// SHORT_ANSWER
// BE metadata: { maxWords: number, correctAnswers: string[] }
const defaultValue = () => ({
  maxWords: 1,
  correctAnswers: [""],    type: "SHORT_ANSWER",
  });

const ShortAnswerForm = ({ value = defaultValue(), onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });

  const setAnswer = (idx, text) => {
    const correctAnswers = value.correctAnswers.map((a, i) =>
      i === idx ? text : a
    );
    update({ correctAnswers });
  };

  const addAnswer = () => {
    update({ correctAnswers: [...value.correctAnswers, ""] });
  };

  const removeAnswer = (idx) => {
    if (value.correctAnswers.length <= 1) return;
    update({
      correctAnswers: value.correctAnswers.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Max words
        </span>
        <InputNumber
          min={1}
          max={20}
          value={value.maxWords}
          onChange={(v) => update({ maxWords: Number(v) || 1 })}
          className="w-32"
        />
      </div>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Acceptable answers (case-insensitive)
        </span>
        <div className="space-y-1.5">
          {value.correctAnswers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <Tag color="green" className="shrink-0">
                {i + 1}
              </Tag>
              <Input
                value={ans}
                onChange={(e) => setAnswer(i, e.target.value)}
                placeholder="Type an acceptable answer..."
                size="small"
              />
              {value.correctAnswers.length > 1 && (
                <button
                  onClick={() => removeAnswer(i)}
                  className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] text-xs shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addAnswer}
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
        >
          <PlusOutlined /> Add acceptable answer
        </button>
      </div>
    </div>
  );
};

export default ShortAnswerForm;
