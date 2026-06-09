import React from "react";
import { Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";

// TABLE_COMPLETION
// BE metadata: { rowIndex, columnIndex, maxWords, correctAnswers[] }
//
// Group-level FillSharedEditor owns the editable table grid and the
// [N] placeholders inside each cell. This per-question form is now
// answer-only — the cell the question refers to is identified by the
// shared grid (the placeholder [N] in the cell). rowIndex/columnIndex
// are derived from the grid at save time.

const defaultValue = () => ({
  rowIndex: 0,
  columnIndex: 0,
  maxWords: 1,
  correctAnswers: [""],
});

const SharedPreview = ({ text }) => {
  if (!text || !text.includes("<table")) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#94a3b8] italic">
        Empty — fill the table at the group level above.
      </div>
    );
  }
  return (
    <div className="rounded-xl border-2 border-[#cffafe] bg-[#f0f9ff] px-3 py-2">
      <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#0e7490] mb-1">
        Shared table (from group)
      </div>
      <div
        className="text-sm text-[#0c4a6e] leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_td]:p-2 [&_td]:border [&_td]:border-[#cffafe]"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  );
};

const TableCompletionForm = ({
  value,
  onChange,
  readOnlyText = "",
}) => {
  const v = value || defaultValue();
  const correctAnswers = Array.isArray(v.correctAnswers) ? v.correctAnswers : [""];
  const update = (patch) => onChange({ ...v, ...patch });

  const setAnswer = (idx, text) => {
    update({
      correctAnswers: correctAnswers.map((a, i) =>
        i === idx ? text : a
      ),
    });
  };

  return (
    <div className="space-y-3">
      <SharedPreview text={readOnlyText} />

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

export default TableCompletionForm;
