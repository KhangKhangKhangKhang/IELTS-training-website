import React from "react";
import { parseBlanks } from "./fillInsertHelpers";

// Interactive preview of the shared text used by FILL_BLANK sub-types.
//
// Unlike the static `SharedPreview`, this component parses the text and
// renders each `[N]` (or `___`, or `[Step N]`) placeholder as a
// clickable button. Clicking a blank calls `onSelect(n)` so the parent
// form can focus the answer input for that blank.
//
// When `text` is empty, falls back to a dashed "type the shared X at
// the group level above" prompt — same UX as the old `SharedPreview`.
//
// Props:
//   - label (string, e.g. "Shared summary", "Shared note")
//   - text (string): the shared text from the group level
//   - subType (string): one of SUMMARY_COMPLETION, NOTE_COMPLETION,
//                       FLOW_CHART_COMPLETION, SENTENCE_COMPLETION,
//                       TABLE_COMPLETION
//   - activeIdx (number|null): which blank is currently being edited
//                              (highlighted indigo). null = no highlight.
//   - onSelect (function|null): (n) => void. If null, blanks render as
//                               static chips (no click).
//   - pattern (string, default "blank"): "blank" for [N]/___/Step
//                                        "table" for HTML table cells
//   - grid (string[][]|null, default null): if pattern === "table",
//                                            2D array of cell content.
//
// `text` is split via `parseBlanks(text, subType)` to produce segments
// that we render. The active blank gets an indigo ring + underline;
// others render muted indigo but stay clickable.

const baseClasses =
  "rounded-xl border-2 border-[#cffafe] bg-[#f0f9ff] px-3 py-2";

const InteractiveSharedPreview = ({
  label = "Shared text",
  text = "",
  subType = "SUMMARY_COMPLETION",
  activeIdx = null,
  onSelect = null,
}) => {
  if (!text || text.trim() === "") {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#94a3b8] italic">
        Empty — type the shared {label.toLowerCase().replace(/^shared\s+/, "")} at the group level above.
      </div>
    );
  }

  const segments = parseBlanks(text, subType);
  const hasBlank = segments.some((s) => s.type === "blank");

  return (
    <div className={baseClasses}>
      <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#0e7490] mb-0.5">
        {label} (from group)
      </div>
      {hasBlank ? (
        <div className="text-sm text-[#0c4a6e] font-medium leading-relaxed whitespace-pre-wrap">
          {segments.map((seg, i) => {
            if (seg.type === "text") {
              return <span key={i}>{seg.content}</span>;
            }
            const isActive = activeIdx === seg.n;
            const baseBtn =
              "inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 mx-0.5 rounded-md font-mono font-black text-[11px] align-baseline border-2 transition-all";
            const cls = isActive
              ? `${baseBtn} bg-[#4338ca] text-white border-[#312e81] shadow-[0_1px_0_#312e81]`
              : `${baseBtn} bg-white text-[#0c4a6e] border-[#cffafe] hover:border-[#6366f1] hover:bg-[#eef2ff] hover:text-[#4338ca]`;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelect && onSelect(seg.n)}
                className={cls}
                title={`Focus answer for blank ${seg.n}`}
              >
                {seg.n}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-[#0c4a6e] font-medium leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      )}
      {activeIdx != null && hasBlank && (
        <div className="mt-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#4338ca]">
          ✎ Editing blank {activeIdx}
        </div>
      )}
    </div>
  );
};

export default InteractiveSharedPreview;
