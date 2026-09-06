import React, { useRef } from "react";
import { Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { parseTableHTML, parseBlanks } from "./fillInsertHelpers";

// TABLE_COMPLETION
// BE metadata: { rowIndex, columnIndex, maxWords, correctAnswers[] }
//
// Group-level FillSharedEditor owns the editable table grid and the
// [N] placeholders inside each cell. This per-question form is
// answer-only — the cell the question refers to is identified by the
// shared grid (the placeholder [N] in the cell). rowIndex/columnIndex
// are derived from the grid at save time.
//
// We parse the rendered HTML back into a 2D grid, then for each cell
// run the [N] placeholder through parseBlanks to produce clickable
// buttons. Click → focus the answer input for that blank.

const defaultValue = () => ({
  rowIndex: 0,
  columnIndex: 0,
  maxWords: 1,
  correctAnswers: [""],
});

const InteractiveTablePreview = ({
  html = "",
  activeIdx = null,
  onSelect = null,
}) => {
  if (!html || !html.includes("<table")) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#94a3b8] italic">
        Empty — fill the table at the group level above.
      </div>
    );
  }
  const parsed = parseTableHTML(html);
  if (!parsed) {
    // Fallback to old dashed if parse fails
    return (
      <div
        className="text-sm text-[#0c4a6e] leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_td]:p-2 [&_td]:border [&_td]:border-[#cffafe]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  const { grid, rows, cols } = parsed;
  // Strip any pre-existing inline styles from parseTableHTML output
  // (we're rebuilding with our own Tailwind classes).
  return (
    <div className="rounded-xl border-2 border-[#cffafe] bg-[#f0f9ff] px-3 py-2">
      <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#0e7490] mb-1">
        Shared table (from group) · click [N] to focus
      </div>
      <table className="w-full border-collapse text-sm text-[#0c4a6e]">
        <tbody>
          {grid.map((row, rIdx) => (
            <tr key={rIdx}>
              {(row || []).map((cellHtml, cIdx) => {
                const cellText = String(cellHtml ?? "");
                const segments = parseBlanks(cellText, "TABLE_COMPLETION");
                const hasBlank = segments.some((s) => s.type === "blank");
                return (
                  <td
                    key={cIdx}
                    className="border border-[#cffafe] p-2 align-top"
                  >
                    {hasBlank ? (
                      <span className="leading-relaxed">
                        {segments.map((seg, si) => {
                          if (seg.type === "text") {
                            return <span key={si}>{seg.content}</span>;
                          }
                          const isActive = activeIdx === seg.n;
                          const baseBtn =
                            "inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 mx-0.5 rounded-md font-mono font-black text-[11px] align-baseline border-2 transition-all";
                          const cls = isActive
                            ? `${baseBtn} bg-[#0e7490] text-white border-[#155e75] shadow-[0_1px_0_#155e75]`
                            : `${baseBtn} bg-white text-[#0c4a6e] border-[#cffafe] hover:border-[#0e7490] hover:bg-[#ecfeff] hover:text-[#0e7490]`;
                          return (
                            <button
                              key={si}
                              type="button"
                              onClick={() => onSelect && onSelect(seg.n)}
                              className={cls}
                              title={`Focus answer for blank ${seg.n}`}
                            >
                              {seg.n}
                            </button>
                          );
                        })}
                      </span>
                    ) : (
                      <span
                        // Use dangerouslySetInnerHTML because teacher may
                        // include small HTML markup (e.g. <strong>) in cells.
                        dangerouslySetInnerHTML={{ __html: cellText || "&nbsp;" }}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {activeIdx != null && (
        <div className="mt-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0e7490]">
          ✎ Editing blank {activeIdx}
        </div>
      )}
    </div>
  );
};

const TableCompletionForm = ({
  value,
  onChange,
  readOnlyText = "",
  questionIndex = 0,
}) => {
  const v = value || defaultValue();
  const correctAnswers = Array.isArray(v.correctAnswers) ? v.correctAnswers : [""];
  const update = (patch) => onChange({ ...v, ...patch });
  const answerRefs = useRef([]);

  const setAnswer = (idx, text) => {
    update({
      correctAnswers: correctAnswers.map((a, i) =>
        i === idx ? text : a
      ),
    });
  };

  // Click-to-jump: focus the answer input for blank N. Table doesn't
  // have a per-question blankLabel field; we just focus the input.
  // (Each question in a Table group still maps to one [N] in the grid,
  // and correctAnswers[] is the list of acceptable answers for THAT
  // cell. We track activeIdx in local state to show the indigo ring
  // on the right cell.)
  const focusAnswer = (n) => {
    const idx = n - 1;
    const el = answerRefs.current[idx];
    if (el) {
      el.focus();
      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    setActiveIdx(n);
  };

  // Track which blank the teacher is currently editing. For Table, we
  // start with fallback questionIndex+1 (1-based) so the form feels
  // "self-aware" of which cell it owns.
  const [activeIdx, setActiveIdx] = React.useState(
    () => (Number.isFinite(questionIndex) ? questionIndex + 1 : 1)
  );
  // Re-sync when question changes (e.g. teacher switches between
  // question slots).
  React.useEffect(() => {
    setActiveIdx(Number.isFinite(questionIndex) ? questionIndex + 1 : 1);
  }, [questionIndex]);

  return (
    <div className="space-y-3">
      <InteractiveTablePreview
        html={readOnlyText}
        activeIdx={activeIdx}
        onSelect={focusAnswer}
      />

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Acceptable answers {activeIdx != null ? `for blank ${activeIdx}` : ""}
        </span>
        <div className="space-y-1.5">
          {correctAnswers.map((ans, i) => {
            return (
              <div key={i} className="flex items-center gap-2">
                {activeIdx != null && (
                  <span
                    className={`flex-none inline-flex items-center justify-center min-w-[1.5rem] h-7 px-1.5 rounded-md font-mono font-black text-[10px] ${
                      i === 0
                        ? "bg-[#0e7490] text-white"
                        : "bg-white text-[#0e7490] border border-[#cffafe]"
                    }`}
                    title={
                      i === 0
                        ? `Answer for blank ${activeIdx}`
                        : `Alternative acceptable answer for blank ${activeIdx}`
                    }
                  >
                    {activeIdx}
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

export default TableCompletionForm;
