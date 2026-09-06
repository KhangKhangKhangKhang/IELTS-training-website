import React, { useRef } from "react";
import { Input, InputNumber, Checkbox } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  insertAtCursor,
  resizeTableGrid,
} from "./fillInsertHelpers";

// Small helper: 1 row in the word bank.
const WordBankRow = ({ word, idx, onChange, onRemove }) => (
  <div className="flex items-center gap-2">
    <span className="font-mono font-extrabold text-[#06b6d4] w-6 text-center text-xs">
      {String.fromCharCode(65 + idx)}
    </span>
    <Input
      value={word.text}
      onChange={(e) => onChange(idx, e.target.value)}
      placeholder={`Word ${idx + 1}`}
      size="small"
    />
    <button
      type="button"
      onClick={() => onRemove(idx)}
      className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] flex-none flex items-center justify-center"
      title="Remove"
      aria-label="Remove word"
    >
      ✕
    </button>
  </div>
);

// antd's Input.TextArea wraps a ResizableTextArea and does not forward
// `ref` to the underlying <textarea>. The TextWithPlaceholders + Sentence
// editors below use a plain <textarea> styled to match, so the ref points
// directly to the DOM node and `insertAtCursor` works.

// Per-sub-type title + hint for the shared text area.
const TITLES = {
  SUMMARY_COMPLETION: "Shared summary text",
  NOTE_COMPLETION: "Shared note text",
  FLOW_CHART_COMPLETION: "Shared flow text",
  TABLE_COMPLETION: "Shared table",
};
const HINTS = {
  SUMMARY_COMPLETION:
    "Type the summary. Use the [N] button to drop a placeholder for question N at the cursor.",
  NOTE_COMPLETION:
    "Type the note. Use the [N] button to drop a placeholder for question N at the cursor.",
  FLOW_CHART_COMPLETION:
    "Type the flow chart text. Use the [N] button to drop a placeholder for question N at the cursor.",
  TABLE_COMPLETION:
    "Edit the grid cells. Click an empty cell, then press Insert [N] to place a placeholder for question N.",
};

// =====================================================================
// SUMMARY / NOTE / FLOW_CHART — textarea + Insert [N] buttons
//   questionNumbers: array of numbers, one per question in the group
// =====================================================================
const TextWithPlaceholders = ({
  shared,
  onSharedChange,
  textareaRef,
  questionNumbers,
}) => {
  const insertPlaceholder = (n) => {
    const next = insertAtCursor(textareaRef.current, ` [${n}] `);
    onSharedChange({ ...shared, fullText: next });
  };

  // Detect dots-only placeholders ("..." or "......") that the teacher
  // pasted from a printed IELTS book. Those dots aren't clickable — the
  // [N] buttons below only work when the blank is in [N] format. Show
  // an inline warning so the teacher knows to replace them.
  const dotOnlyPattern = /\.{2,}/g;
  const hasDotOnlyBlanks = dotOnlyPattern.test(shared.fullText || "");

  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        value={shared.fullText}
        onChange={(e) => onSharedChange({ ...shared, fullText: e.target.value })}
        rows={6}
        placeholder="Type the paragraph here. Click 'Insert [N]' to drop a placeholder at the cursor."
        className="block w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm leading-relaxed shadow-sm focus:border-[#06b6d4] focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
          Insert placeholder:
        </span>
        {questionNumbers.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => insertPlaceholder(n)}
            className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black bg-[#06b6d4] text-white border-2 border-[#0891b2] shadow-[0_2px_0_#0e7490] hover:translate-y-[-1px] active:translate-y-[1px]"
            title={`Insert [${n}] at cursor`}
          >
            [{n}]
          </button>
        ))}
        {questionNumbers.length === 0 && (
          <span className="text-[10px] text-[#be123c] italic font-bold">
            ⚠ Add at least 1 question to the group first.
          </span>
        )}
      </div>
      {hasDotOnlyBlanks && (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900 leading-snug">
          <span className="font-extrabold">⚠ Detected "..." placeholders.</span>{" "}
          Replace each with <code className="font-mono bg-white px-1 rounded">[N]</code>{" "}
          (e.g. <code className="font-mono">[14]</code>) using the buttons above so blanks
          are clickable.
        </div>
      )}
    </div>
  );
};

// =====================================================================
// TABLE — editable grid + Insert [N] (clicks into focused cell)
// =====================================================================
const TableEditor = ({ shared, onSharedChange, questionNumbers }) => {
  const setRows = (newRows) => {
    const r = Math.max(1, Math.min(20, Number(newRows) || 1));
    const grid = resizeTableGrid(shared.tableGrid, r, shared.tableCols);
    onSharedChange({ ...shared, tableRows: r, tableGrid: grid });
  };
  const setCols = (newCols) => {
    const c = Math.max(1, Math.min(10, Number(newCols) || 1));
    const grid = resizeTableGrid(shared.tableGrid, shared.tableRows, c);
    onSharedChange({ ...shared, tableCols: c, tableGrid: grid });
  };
  const setCell = (r, c, val) => {
    const next = shared.tableGrid.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? val : cell))
    );
    onSharedChange({ ...shared, tableGrid: next });
  };
  const setFocus = (r, c) =>
    onSharedChange({ ...shared, focusedCell: { r, c } });
  const insertIntoFocused = (n) => {
    const { r, c } = shared.focusedCell;
    const current = shared.tableGrid?.[r]?.[c] ?? "";
    setCell(r, c, current + ` [${n}] `);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase text-[#64748b]">
            Rows
          </span>
          <InputNumber
            min={1}
            max={20}
            value={shared.tableRows}
            onChange={setRows}
            size="small"
            className="w-16"
          />
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase text-[#64748b]">
            Cols
          </span>
          <InputNumber
            min={1}
            max={10}
            value={shared.tableCols}
            onChange={setCols}
            size="small"
            className="w-16"
          />
        </label>
        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
            Into focused cell:
          </span>
          {questionNumbers.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => insertIntoFocused(n)}
              className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black bg-[#06b6d4] text-white border-2 border-[#0891b2] shadow-[0_2px_0_#0e7490] hover:translate-y-[-1px] active:translate-y-[1px]"
              title={`Insert [${n}] into (${shared.focusedCell.r + 1},${shared.focusedCell.c + 1})`}
            >
              [{n}]
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border-2 border-[#cffafe] bg-white">
        <table className="w-full border-collapse">
          <tbody>
            {shared.tableGrid.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cellVal, cIdx) => {
                  const focused =
                    shared.focusedCell.r === rIdx &&
                    shared.focusedCell.c === cIdx;
                  return (
                    <td
                      key={`${rIdx}-${cIdx}`}
                      className={`p-1 min-w-[140px] border ${
                        focused
                          ? "border-[#06b6d4] bg-[#ecfeff]"
                          : "border-[#e6e6ed]"
                      }`}
                      onClick={() => setFocus(rIdx, cIdx)}
                    >
                      <Input.TextArea
                        value={cellVal}
                        onChange={(e) => setCell(rIdx, cIdx, e.target.value)}
                        onFocus={() => setFocus(rIdx, cIdx)}
                        rows={2}
                        className="text-xs"
                        placeholder={`R${rIdx + 1} C${cIdx + 1}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-[#94a3b8] italic">
        Tip: click an empty cell, then press [N] to drop a placeholder there.
      </div>
    </div>
  );
};

// =====================================================================
// Word bank — shared across all questions
// =====================================================================
const WordBank = ({ shared, onSharedChange }) => {
  const addWord = () =>
    onSharedChange({
      ...shared,
      wordBank: [
        ...(shared.wordBank || []),
        { id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: "" },
      ],
    });
  const updateWord = (idx, text) =>
    onSharedChange({
      ...shared,
      wordBank: shared.wordBank.map((w, i) => (i === idx ? { ...w, text } : w)),
    });
  const removeWord = (idx) =>
    onSharedChange({
      ...shared,
      wordBank: shared.wordBank.filter((_, i) => i !== idx),
    });
  return (
    <div className="rounded-xl border-2 border-[#cffafe] bg-[#ecfeff] p-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={!!shared.hasWordBank}
          onChange={(e) =>
            onSharedChange({
              ...shared,
              hasWordBank: e.target.checked,
              wordBank:
                e.target.checked && !(shared.wordBank || []).length
                  ? [{ id: "w1", text: "" }]
                  : shared.wordBank,
            })
          }
        >
          <span
            className="text-[10px] font-extrabold uppercase tracking-wider text-[#0e7490]"
            title="Enable when students pick answers from a list of words you provide. Leave OFF if students write answers from the passage."
          >
            Use word bank
          </span>
        </Checkbox>
        <span className="text-[10px] text-[#64748b] italic">
          {shared.hasWordBank
            ? "Students pick from your word list."
            : "Students write answers from the passage."}
        </span>
      </div>
      {shared.hasWordBank && (
        <div className="space-y-1.5">
          {(shared.wordBank || []).map((w, i) => (
            <WordBankRow
              key={w.id || i}
              word={w}
              idx={i}
              onChange={updateWord}
              onRemove={removeWord}
            />
          ))}
          <button
            type="button"
            onClick={addWord}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#06b6d4] uppercase tracking-wide hover:underline"
          >
            <PlusOutlined /> Add word
          </button>
        </div>
      )}
    </div>
  );
};

// =====================================================================
// Main
// =====================================================================
export default function FillSharedEditor({
  qType,
  shared,
  onSharedChange,
  questionNumbers = [],
}) {
  const textareaRef = useRef(null);

  if (!shared) return null;

  return (
    <div className="rounded-2xl border-2 border-[#06b6d4] bg-[#ecfeff] p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0e7490]">
            📝 {TITLES[qType] || "Shared content"} (all questions in this group)
          </div>
          <div className="text-[10px] text-[#64748b] mt-0.5 leading-relaxed">
            {HINTS[qType]}
          </div>
        </div>
        <label className="flex items-center gap-1.5 flex-none">
          <span className="text-[10px] font-extrabold uppercase text-[#64748b]">
            Max words
          </span>
          <InputNumber
            min={1}
            max={5}
            value={shared.maxWords}
            onChange={(v) => onSharedChange({ ...shared, maxWords: Number(v) || 1 })}
            size="small"
            className="w-14"
          />
        </label>
      </div>

      {(qType === "SUMMARY_COMPLETION" ||
        qType === "NOTE_COMPLETION" ||
        qType === "FLOW_CHART_COMPLETION") && (
        <TextWithPlaceholders
          shared={shared}
          onSharedChange={onSharedChange}
          textareaRef={textareaRef}
          questionNumbers={questionNumbers}
        />
      )}
      {qType === "TABLE_COMPLETION" && (
        <TableEditor
          shared={shared}
          onSharedChange={onSharedChange}
          questionNumbers={questionNumbers}
        />
      )}

      {(qType === "SUMMARY_COMPLETION" ||
        qType === "FLOW_CHART_COMPLETION") && (
        <WordBank shared={shared} onSharedChange={onSharedChange} />
      )}
    </div>
  );
}
