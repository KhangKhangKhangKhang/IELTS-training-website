import React, { useState } from "react";
import { Input, InputNumber, Checkbox } from "antd";
import { PlusOutlined } from "@ant-design/icons";

// NOTE_COMPLETION
// BE metadata: { noteContext, maxWords, correctAnswers[], fullNoteText? }
//
// Group-level FillSharedEditor owns the shared note text. This form is
// answer-only with an optional override.

const defaultValue = () => ({
  noteContext: "",
  maxWords: 1,
  correctAnswers: [""],
  fullNoteText: "",
});

const SharedPreview = ({ label, text }) => {
  if (!text) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#94a3b8] italic">
        Empty — type the shared note at the group level above.
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

const NoteCompletionForm = ({
  value,
  onChange,
  readOnlyText = "",
}) => {
  const v = value || defaultValue();
  const correctAnswers = Array.isArray(v.correctAnswers) ? v.correctAnswers : [""];
  const [override, setOverride] = useState(
    () => !!(v.fullNoteText && v.fullNoteText !== readOnlyText)
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
      update({ fullNoteText: v.fullNoteText || readOnlyText });
    } else {
      update({ fullNoteText: "" });
    }
  };

  return (
    <div className="space-y-3">
      <SharedPreview label="Shared note" text={readOnlyText} />

      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Note context
        </span>
        <Input.TextArea
          value={v.noteContext}
          onChange={(e) => update({ noteContext: e.target.value })}
          rows={2}
        />
      </label>

      <Checkbox checked={override} onChange={toggleOverride}>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b]">
          Override note for this question
        </span>
      </Checkbox>

      {override && (
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Custom note (this question only)
          </span>
          <Input.TextArea
            value={v.fullNoteText}
            onChange={(e) => update({ fullNoteText: e.target.value })}
            rows={3}
          />
        </label>
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

export default NoteCompletionForm;
