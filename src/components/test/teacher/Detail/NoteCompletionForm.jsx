import React, { useState, useRef } from "react";
import { Input, InputNumber, Checkbox } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { resolveActiveIdx } from "./fillInsertHelpers";
import InteractiveSharedPreview from "./InteractiveSharedPreview";

// NOTE_COMPLETION
// BE metadata: { noteContext, maxWords, correctAnswers[], fullNoteText? }
//
// Group-level FillSharedEditor owns the shared note text. This form is
// answer-only with an optional override, plus click-to-jump on each
// [N] in the shared note text.
//
// In IELTS Listening Part 1, NOTE_COMPLETION is also used for "Form"
// (filling name, phone, address). The frontend surfaces that relabel
// at the AddGroupModal level — this per-question form stays generic.

const defaultValue = () => ({
  noteContext: "",
  maxWords: 1,
  correctAnswers: [""],
  fullNoteText: "",
});

const NoteCompletionForm = ({
  value,
  onChange,
  readOnlyText = "",
  questionIndex = 0,
}) => {
  const v = value || defaultValue();
  const correctAnswers = Array.isArray(v.correctAnswers) ? v.correctAnswers : [""];
  const [override, setOverride] = useState(
    () => !!(v.fullNoteText && v.fullNoteText !== readOnlyText)
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
      update({ fullNoteText: v.fullNoteText || readOnlyText });
    } else {
      update({ fullNoteText: "" });
    }
  };

  // Click-to-jump: focus the answer input for blank N + sync blankLabel.
  const focusAnswer = (n) => {
    const idx = n - 1;
    const el = answerRefs.current[idx];
    if (el) {
      el.focus();
      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    if (String(v.blankLabel) !== String(n)) {
      update({ blankLabel: String(n) });
    }
  };

  // Active blank: prefer blankLabel, fallback questionIndex + 1.
  const activeIdx = resolveActiveIdx(
    v.blankLabel,
    questionIndex,
    "NOTE_COMPLETION"
  );

  return (
    <div className="space-y-3">
      <InteractiveSharedPreview
        label="Shared note"
        text={readOnlyText}
        subType="NOTE_COMPLETION"
        activeIdx={activeIdx}
        onSelect={focusAnswer}
      />

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

      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Blank label (e.g. "1") — what student sees
        </span>
        <Input
          value={v.blankLabel}
          onChange={(e) => update({ blankLabel: e.target.value })}
          placeholder="1"
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
          {correctAnswers.map((ans, i) => {
            const blankNum = activeIdx != null ? activeIdx + i : null;
            return (
              <div key={i} className="flex items-center gap-2">
                {blankNum != null && (
                  <span
                    className={`flex-none inline-flex items-center justify-center min-w-[1.5rem] h-7 px-1.5 rounded-md font-mono font-black text-[10px] ${
                      i === 0
                        ? "bg-[#7c3aed] text-white"
                        : "bg-white text-[#7c3aed] border border-[#ddd6fe]"
                    }`}
                    title={
                      i === 0
                        ? `Answer for blank ${activeIdx}`
                        : `Extra acceptable answer for blank ${activeIdx}`
                    }
                  >
                    {blankNum}
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

export default NoteCompletionForm;
