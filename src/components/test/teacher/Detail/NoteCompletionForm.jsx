import React from "react";
import { Input, InputNumber } from "antd";
import { PlusOutlined } from "@ant-design/icons";

// NOTE_COMPLETION
// BE metadata: { noteContext, maxWords, correctAnswers[], fullNoteText? }
const defaultValue = () => ({
  noteContext: "",
  maxWords: 1,
  correctAnswers: [""],
  fullNoteText: "",
});

const NoteCompletionForm = ({ value = defaultValue(), onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });

  const setAnswer = (idx, text) => {
    update({
      correctAnswers: value.correctAnswers.map((a, i) => (i === idx ? text : a)),
    });
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Note context
        </span>
        <Input.TextArea
          value={value.noteContext}
          onChange={(e) => update({ noteContext: e.target.value })}
          rows={2}
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

      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Full note text (optional, with [number] placeholders)
        </span>
        <Input.TextArea
          value={value.fullNoteText}
          onChange={(e) => update({ fullNoteText: e.target.value })}
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

export default NoteCompletionForm;
