import React from "react";
import { Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { TextArea } = Input;
import {
  getLabelScheme,
  relabelPool,
  POOL_MAX,
} from "./matchingHelpers";

// Render a single pool item row. `shape` is "objects" (label+text) or
// "strings" (each item is itself the label).
const PoolItemRow = ({ item, idx, shape, onTextChange, onLabelChange, onRemove, canRemove }) => {
  if (shape === "strings") {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono font-extrabold text-[#4338ca] w-6 text-center text-xs">
          {item}
        </span>
        <Input
          value={item}
          onChange={(e) => onLabelChange(idx, e.target.value)}
          size="small"
          className="w-20"
          maxLength={3}
        />
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] flex-none flex items-center justify-center"
            title="Remove"
            aria-label="Remove item"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-xl border-2 border-[#e9d5ff] bg-white p-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="font-mono font-extrabold text-[#4338ca] w-6 text-center text-xs">
          {item.label}
        </span>
        <span className="text-[10px] text-[#94a3b8] italic flex-1">
          Heading text (multi-line)
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] flex-none flex items-center justify-center"
            title="Remove"
            aria-label="Remove item"
          >
            ✕
          </button>
        )}
      </div>
      <TextArea
        value={item.text}
        onChange={(e) => onTextChange(idx, e.target.value)}
        placeholder="Type the heading — can be a full sentence, multiple lines ok"
        autoSize={{ minRows: 2, maxRows: 6 }}
        className="text-xs"
      />
    </div>
  );
};

export default function MatchingPoolEditor({ qType, pool, onPoolChange }) {
  // Scheme: "objects" for headings/features/endings, "strings" for paragraph labels.
  const shape = qType === "MATCHING_INFORMATION" ? "strings" : "objects";
  const labelScheme = getLabelScheme(qType); // "roman" for headings, "alpha" for others

  const items = Array.isArray(pool) ? pool : [];

  const updateAt = (idx, value) => {
    const next = items.slice();
    next[idx] = value;
    onPoolChange(next);
  };

  const removeAt = (idx) => {
    const next = items.slice();
    next.splice(idx, 1);
    if (shape === "strings") {
      onPoolChange(next.map((_, i) => String.fromCharCode(65 + i)));
    } else {
      onPoolChange(relabelPool(next, labelScheme));
    }
  };

  const addOne = () => {
    if (items.length >= POOL_MAX) return;
    const next = items.slice();
    if (shape === "strings") {
      next.push(String.fromCharCode(65 + items.length));
    } else {
      next.push({ _uid: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label: "", text: "" });
    }
    onPoolChange(shape === "strings" ? next : relabelPool(next, labelScheme));
  };

  const titleByQType = {
    MATCHING_HEADING: "Headings pool",
    MATCHING_INFORMATION: "Paragraph labels",
    MATCHING_FEATURES: "Features pool",
    MATCHING_SENTENCE_ENDINGS: "Endings pool",
  };

  const hintByQType = {
    MATCHING_HEADING: "Write the list of headings students will choose from. Auto-labeled i, ii, iii…",
    MATCHING_INFORMATION: "Edit the paragraph labels (A, B, C…). Students match each statement to one.",
    MATCHING_FEATURES: "Write the list of features (people, theories, dates). Students match each to one.",
    MATCHING_SENTENCE_ENDINGS: "Write the list of possible sentence endings. Students match each stem to one.",
  };

  return (
    <div className="rounded-2xl border-2 border-[#a855f7] bg-[#faf5ff] p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#7e22ce]">
            📚 {titleByQType[qType] || "Matching pool"}
          </div>
          <div className="text-[10px] text-[#64748b] mt-0.5 leading-relaxed">
            {hintByQType[qType] || "Set up the shared items once — every question in this group uses the same pool."}
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#7e22ce] bg-white border-2 border-[#e9d5ff] rounded-full px-2 py-0.5 flex-none">
          {items.length}/{POOL_MAX}
        </span>
      </div>

      <div className="space-y-1.5">
        {items.length === 0 && (
          <div className="text-[10px] text-[#94a3b8] italic py-2 text-center">
            Empty pool — click "+ Add" to start
          </div>
        )}
        {items.map((it, idx) => {
          // Stable key: must NOT change as user types, otherwise React remounts
          // the row and focus jumps to the next input on every keystroke.
          const rowKey =
            (it && typeof it === "object" && it._uid) ||
            (typeof it === "string" ? `s-${it}-${idx}` : null) ||
            `idx-${idx}`;
          return (
            <PoolItemRow
              key={rowKey}
              item={it}
              idx={idx}
              shape={shape}
              canRemove={items.length > 1}
              onTextChange={(i, text) => {
                if (shape === "strings") return;
                if (!items[i] || typeof items[i] !== "object") return;
                const updated = { ...items[i], text };
                updateAt(i, updated);
              }}
              onLabelChange={(i, value) => {
                if (shape !== "strings") return;
                const next = items.slice();
                next[i] = value;
                onPoolChange(next);
              }}
              onRemove={removeAt}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={addOne}
        disabled={items.length >= POOL_MAX}
        className={`inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide ${
          items.length >= POOL_MAX
            ? "text-[#cbd5e1] cursor-not-allowed"
            : "text-[#7e22ce] hover:underline"
        }`}
      >
        <PlusOutlined /> Add {shape === "strings" ? "label" : "item"}
      </button>
    </div>
  );
}
