import React from "react";
import { Input, InputNumber } from "antd";
import { PlusOutlined } from "@ant-design/icons";

// TABLE_COMPLETION
// BE metadata: { rowIndex, columnIndex, maxWords, correctAnswers[] }
const defaultValue = () => ({
  rowIndex: 0,
  columnIndex: 0,
  maxWords: 1,
  correctAnswers: [""],
});

const TableCompletionForm = ({ value = defaultValue(), onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });

  const setAnswer = (idx, text) => {
    update({
      correctAnswers: value.correctAnswers.map((a, i) => (i === idx ? text : a)),
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Row (0-based)
          </span>
          <InputNumber
            min={0}
            max={50}
            value={value.rowIndex}
            onChange={(v) => update({ rowIndex: Number(v) || 0 })}
            className="w-full"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Column (0-based)
          </span>
          <InputNumber
            min={0}
            max={20}
            value={value.columnIndex}
            onChange={(v) => update({ columnIndex: Number(v) || 0 })}
            className="w-full"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Max words
          </span>
          <InputNumber
            min={1}
            max={5}
            value={value.maxWords}
            onChange={(v) => update({ maxWords: Number(v) || 1 })}
            className="w-full"
          />
        </label>
      </div>

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

export default TableCompletionForm;
