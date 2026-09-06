import React, { useRef } from "react";
import { Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { insertAtCursor } from "./fillInsertHelpers";

// SENTENCE_COMPLETION
// BE metadata: { sentenceWithBlank, maxWords, correctAnswers[] }
//
// The shared sentence lives in the group-level FillSharedEditor. This
// per-question form is now answer-only: it shows the shared sentence as
// a read-only preview, and lets the teacher optionally override the
// sentence for this question only.

const defaultValue = () => ({
  sentenceWithBlank: "",
  maxWords: 1,
  correctAnswers: [""],
});

const SentenceCompletionForm = ({
  value,
  onChange,
}) => {
  // CRITICAL: `onChange` is invoked from a child <input> `onInput` handler
  // which only gives us the DOM event — NOT the latest `value` prop. If we
  // call `onChange({ ...v, ... })` with a closure-captured `v`, we may
  // overwrite a value the parent just updated via a *different* input.
  // Solution: forward the raw input event up as a *patch function* that the
  // parent can use to merge into its own state. Since we can't change the
  // parent contract, we read the LATEST value via a ref the parent keeps
  // updated.
  //
  // Pragmatic fix: keep an internal `latestValueRef` that mirrors `value`
  // and read from IT when building the patch — so we never lose updates
  // typed into sibling fields or committed by the parent mid-keystroke.
  const v = value || defaultValue();
  const correctAnswers = Array.isArray(v.correctAnswers) ? v.correctAnswers : [""];
  const textareaRef = useRef(null);
  const latestValueRef = useRef(v);
  latestValueRef.current = v;

  const update = (patch) => {
    // Read from the ref so we always spread the freshest parent state.
    const base = latestValueRef.current || defaultValue();
    const merged =
      typeof patch === "function" ? patch(base) : { ...base, ...patch };
    onChange(merged);
  };
  const insertBlank = () => {
    const next = insertAtCursor(textareaRef.current, " ___ ");
    update({ sentenceWithBlank: next });
  };

  const setAnswer = (idx, text) => {
    // Use a functional patch so the parent's existing array is read fresh,
    // not a closure-captured snapshot.
    update((cur) => ({
      ...cur,
      correctAnswers: (Array.isArray(cur.correctAnswers) ? cur.correctAnswers : [""]).map(
        (a, i) => (i === idx ? text : a)
      ),
    }));
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Sentence with blank
        </span>
        <textarea
          ref={textareaRef}
          value={v.sentenceWithBlank}
          onChange={(e) => update({ sentenceWithBlank: e.target.value })}
          rows={2}
          placeholder="e.g. The city was founded in ___."
          className="block w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm leading-relaxed shadow-sm focus:border-[#06b6d4] focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
        />
      </label>
      <button
        type="button"
        onClick={insertBlank}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#06b6d4] text-white border-2 border-[#0891b2] shadow-[0_2px_0_#0e7490] hover:translate-y-[-1px] active:translate-y-[1px]"
      >
        + Insert ___
      </button>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Acceptable answers
        </span>
        <div className="space-y-1.5">
          {correctAnswers.map((ans, i) => (
            // Stable key per slot so AntD Input keeps its identity across
            // re-renders. Without it, AntD v5 + React 19 can swap the input
            // element mid-typing, dropping onChange events. We also pass the
            // latest snapshot of `ans` and a fresh handler via the wrapper
            // `onAnswerChange` so the closure can't go stale.
            <div key={`ans-${i}`} className="flex items-center gap-2">
              <Input
                key={`ans-input-${i}`}
                value={ans ?? ""}
                onChange={(e) => setAnswer(i, e.target.value)}
                placeholder="e.g. 1850"
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
          onClick={() =>
            update({ correctAnswers: [...correctAnswers, ""] })
          }
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
        >
          <PlusOutlined /> Add acceptable answer
        </button>
      </div>
    </div>
  );
};

export default SentenceCompletionForm;
