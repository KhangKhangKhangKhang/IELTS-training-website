# Matching form UI/UX redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the four IELTS matching question sub-types so teachers set up a shared pool (headings, paragraphs, features, or endings) once at the group level, then per-question just pick the correct answer from clickable cards, with a student preview at the bottom of each form.

**Architecture:** Two new React components (`MatchingPoolEditor`, `MatchingPreview`) live in the `src/components/magicpath/ielts-test-editor/` tree. `MatchingPoolEditor` mounts inside the existing `GroupEditor` and broadcasts the pool to every question's metadata via a `useEffect`. The existing `MatchingForm.jsx` (in `src/components/test/teacher/Detail/`) gets slimmed down so each sub-type only renders the question-specific fields plus the new `AnswerPicker` and `StudentPreview`. No BE change. On-disk shape unchanged.

**Tech Stack:** React 18, TailwindCSS, Antd `Input`/`Select`, existing `useQuestionDraft` hook. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-09-matching-form-uiux-redesign.md`

---

## File map (locked-in decomposition)

| File | Responsibility |
|---|---|
| `src/components/magicpath/ielts-test-editor/matchingHelpers.js` (NEW) | Pure helpers: `romanize(n)`, `letterize(n)`, `getPoolKey(qType)`, `relabelPool(items, scheme)`, `getDefaultPool(qType)`. No React, easy to unit-test in browser console. |
| `src/components/magicpath/ielts-test-editor/MatchingPoolEditor.jsx` (NEW) | Renders the shared pool editor for the active matching sub-type. Calls `onPoolChange` on every edit. |
| `src/components/magicpath/ielts-test-editor/MatchingPreview.jsx` (NEW) | Pure render-only student preview. Switches by `qType`. |
| `src/components/test/teacher/Detail/MatchingForm.jsx` (MODIFY) | Each inner form (Heading/Info/Features/Endings) is slimmed: only the question-specific fields + a new `AnswerPicker` + the new `StudentPreview`. Pool inputs are removed. |
| `src/components/magicpath/ielts-test-editor/editorReadingListening.jsx` (MODIFY) | Mounts `MatchingPoolEditor` inside `GroupEditor` when `group.questionType` is a matching sub-type. Wires the pool-broadcast `useEffect`. Imports the new `MatchingPreview` and `MatchingPoolEditor`. |

The `AnswerPicker` is small enough to live inline in `MatchingForm.jsx` (3-4 props, 1 component, ~30 lines). The `MatchingPreview` is a separate file because it's referenced from both the question form and could later be referenced from a "Preview all" button.

---

### Task 1: Helpers — `matchingHelpers.js`

**Files:**
- Create: `src/components/magicpath/ielts-test-editor/matchingHelpers.js`

- [ ] **Step 1: Create the helpers file**

Write the file with the following content:

```js
// Pure helpers for the matching-family question forms.
// No React imports. Safe to unit-test in the browser console.

const ROMAN = ["", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
const ALPHA = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

export const POOL_MAX = 10;

// Map BE matching sub-type → which metadata field holds the shared pool.
export const getPoolKey = (qType) => {
  switch (qType) {
    case "MATCHING_HEADING":
      return "headings";
    case "MATCHING_INFORMATION":
      return "paragraphLabels";
    case "MATCHING_FEATURES":
      return "features";
    case "MATCHING_SENTENCE_ENDINGS":
      return "endings";
    default:
      return null;
  }
};

// Which label scheme does this pool use? Roman for headings, Alpha for the rest.
export const getLabelScheme = (qType) =>
  qType === "MATCHING_HEADING" ? "roman" : "alpha";

export const labelFor = (idx, scheme) =>
  scheme === "roman" ? ROMAN[idx + 1] || `${idx + 1}` : ALPHA[idx + 1] || `${idx + 1}`;

// Re-label every item in a pool top-to-bottom. If the user set a `_custom`
// flag, preserve their override; otherwise overwrite with the auto label.
export const relabelPool = (items, scheme) =>
  (items || []).map((it, i) => {
    const auto = labelFor(i, scheme);
    if (it._custom) return { ...it, label: it.label };
    return { ...it, label: auto };
  });

// What "correct answer" field is used for this sub-type?
export const getAnswerKey = (qType) => {
  switch (qType) {
    case "MATCHING_HEADING":
      return "correctHeadingIndex";
    case "MATCHING_INFORMATION":
      return "correctParagraph";
    case "MATCHING_FEATURES":
      return "correctFeatureLabel";
    case "MATCHING_SENTENCE_ENDINGS":
      return "correctEndingLabel";
    default:
      return null;
  }
};

// Default pool for an empty group. Heading gets 5 i/ii/iii/iv/v with
// placeholder text. Information gets 4 paragraph labels. Features gets
// 3 feature slots. Endings gets 3 ending slots. The teacher can edit /
// add / remove from there.
export const getDefaultPool = (qType) => {
  switch (qType) {
    case "MATCHING_HEADING":
      return [
        { label: "i", text: "" },
        { label: "ii", text: "" },
        { label: "iii", text: "" },
        { label: "iv", text: "" },
        { label: "v", text: "" },
      ];
    case "MATCHING_INFORMATION":
      return ["A", "B", "C", "D"];
    case "MATCHING_FEATURES":
      return [
        { label: "A", text: "" },
        { label: "B", text: "" },
        { label: "C", text: "" },
      ];
    case "MATCHING_SENTENCE_ENDINGS":
      return [
        { label: "A", text: "" },
        { label: "B", text: "" },
        { label: "C", text: "" },
      ];
    default:
      return [];
  }
};

// Is this BE sub-type one of the four matching variants?
export const isMatchingQType = (qType) =>
  qType === "MATCHING_HEADING" ||
  qType === "MATCHING_INFORMATION" ||
  qType === "MATCHING_FEATURES" ||
  qType === "MATCHING_SENTENCE_ENDINGS";
```

- [ ] **Step 2: Smoke-test in browser console**

Open the running dev server (Vite on `:3004`). In DevTools console, paste:

```js
const m = await import("/src/components/magicpath/ielts-test-editor/matchingHelpers.js");
console.log(m.labelFor(0, "roman"));  // expected: "i"
console.log(m.labelFor(2, "alpha"));  // expected: "C"
console.log(m.getPoolKey("MATCHING_HEADING"));  // expected: "headings"
console.log(m.getPoolKey("MATCHING_FEATURES"));  // expected: "features"
console.log(m.isMatchingQType("MATCHING_HEADING"));  // expected: true
console.log(m.isMatchingQType("MCQ"));  // expected: false
console.log(m.relabelPool([{text:"a"},{text:"b"},{text:"c"}], "roman"));
// expected: [{label:"i",text:"a"},{label:"ii",text:"b"},{label:"iii",text:"c"}]
```

Expected: all assertions pass; no thrown errors. If Vite complains about the import path, confirm the file is saved at the correct path. (Vite hot-reloads on save.)

- [ ] **Step 3: Commit**

```bash
git add src/components/magicpath/ielts-test-editor/matchingHelpers.js
git -c user.name="Claude Code" -c user.email="noreply@anthropic.com" commit -m "feat(matching): add pure helpers (label, pool key, default pool)"
```

---

### Task 2: `MatchingPoolEditor.jsx` — group-level shared pool

**Files:**
- Create: `src/components/magicpath/ielts-test-editor/MatchingPoolEditor.jsx`

This component renders the shared pool editor. It does NOT broadcast to questions itself — the parent (`GroupEditor`) owns that wiring. It just calls `onPoolChange(newPool)` whenever the user edits the pool.

- [ ] **Step 1: Create the component**

Write the file with the following content:

```jsx
import React, { useMemo } from "react";
import { Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  getPoolKey,
  getLabelScheme,
  relabelPool,
  POOL_MAX,
} from "./matchingHelpers";

// Render a single pool item row. `shape` is "object" ({label,text}) for
// headings/features/endings, or "string" for paragraph labels.
const PoolItemRow = ({ item, idx, scheme, onTextChange, onLabelChange, onRemove, canRemove }) => {
  if (scheme === "alpha-strings") {
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
            className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] flex-none"
            title="Remove"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono font-extrabold text-[#4338ca] w-6 text-center text-xs">
        {item.label}
      </span>
      <Input
        value={item.text}
        onChange={(e) => onTextChange(idx, e.target.value)}
        placeholder={scheme === "roman" ? `Heading ${idx + 1}` : "Feature text"}
        size="small"
      />
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] flex-none"
          title="Remove"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default function MatchingPoolEditor({ qType, pool, onPoolChange }) {
  const scheme = useMemo(() => {
    if (qType === "MATCHING_HEADING") return "roman";
    if (qType === "MATCHING_INFORMATION") return "alpha-strings";
    if (qType === "MATCHING_FEATURES") return "alpha-objects";
    if (qType === "MATCHING_SENTENCE_ENDINGS") return "alpha-objects";
    return "alpha-objects";
  }, [qType]);

  const isStringShape = scheme === "alpha-strings";

  // Normalize incoming pool to a list. paragraphLabels is an array of
  // strings; headings/features/endings are arrays of {label,text}.
  const items = isStringShape ? (pool || []) : (pool || []);

  const updateAt = (idx, value) => {
    const next = items.slice();
    next[idx] = value;
    onPoolChange(next);
  };

  const removeAt = (idx) => {
    const next = items.slice();
    next.splice(idx, 1);
    // Re-label after removal
    if (isStringShape) {
      // Re-letter A, B, C…
      onPoolChange(next.map((_, i) => String.fromCharCode(65 + i)));
    } else {
      onPoolChange(relabelPool(next, scheme === "roman" ? "roman" : "alpha"));
    }
  };

  const addOne = () => {
    if (items.length >= POOL_MAX) return;
    const next = items.slice();
    if (isStringShape) {
      next.push(String.fromCharCode(65 + items.length));
    } else if (scheme === "roman") {
      next.push({ label: "", text: "" });
    } else {
      next.push({ label: "", text: "" });
    }
    onPoolChange(relabelPool(next, scheme === "roman" ? "roman" : "alpha"));
  };

  const titleByQType = {
    MATCHING_HEADING: "Headings pool",
    MATCHING_INFORMATION: "Paragraph labels",
    MATCHING_FEATURES: "Features pool",
    MATCHING_SENTENCE_ENDINGS: "Endings pool",
  };

  const hintByQType = {
    MATCHING_HEADING: "Write the list of headings students will choose from. Use Roman numerals (auto).",
    MATCHING_INFORMATION: "Edit the paragraph labels (A, B, C…). Students match each statement to one.",
    MATCHING_FEATURES: "Write the list of features (people, theories, dates). Students match each to one.",
    MATCHING_SENTENCE_ENDINGS: "Write the list of possible sentence endings. Students match each stem to one.",
  };

  return (
    <div className="rounded-2xl border-2 border-[#a855f7] bg-[#faf5ff] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#7e22ce]">
            📚 {titleByQType[qType] || "Matching pool"}
          </div>
          <div className="text-[10px] text-[#64748b] mt-0.5">
            {hintByQType[qType] || "Set up the shared items once — every question in this group uses the same pool."}
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#7e22ce] bg-white border-2 border-[#e9d5ff] rounded-full px-2 py-0.5">
          {items.length}/{POOL_MAX}
        </span>
      </div>

      <div className="space-y-1.5">
        {items.length === 0 && (
          <div className="text-[10px] text-[#94a3b8] italic py-2 text-center">
            Empty pool — click "+ Add" to start
          </div>
        )}
        {items.map((it, idx) => (
          <PoolItemRow
            key={idx}
            item={it}
            idx={idx}
            scheme={scheme}
            canRemove={items.length > 1}
            onTextChange={(i, text) => {
              if (isStringShape) return; // string shape: text is the label itself
              const updated = { ...items[i], text };
              updateAt(i, updated);
            }}
            onLabelChange={(i, value) => {
              if (!isStringShape) return;
              const next = items.slice();
              next[i] = value;
              onPoolChange(next);
            }}
            onRemove={removeAt}
          />
        ))}
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
        <PlusOutlined /> Add {isStringShape ? "label" : "item"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Visual smoke-test by mounting it in the page**

This task only needs the file to be import-clean. Full visual verification happens in Task 5 (where we mount it inside the group editor). For now:

Open the running dev server in the browser, navigate to the test editor URL, and confirm there are NO console errors. (Vite will report import errors at HMR time.)

- [ ] **Step 3: Commit**

```bash
git add src/components/magicpath/ielts-test-editor/MatchingPoolEditor.jsx
git -c user.name="Claude Code" -c user.email="noreply@anthropic.com" commit -m "feat(matching): add MatchingPoolEditor (group-level shared pool)"
```

---

### Task 3: `MatchingPreview.jsx` — student-facing preview

**Files:**
- Create: `src/components/magicpath/ielts-test-editor/MatchingPreview.jsx`

- [ ] **Step 1: Create the component**

Write the file with the following content:

```jsx
import React from "react";
import { labelFor, getLabelScheme } from "./matchingHelpers";

// Card style for the student's view. "selected" = the correct answer.
const PreviewCard = ({ label, text, selected, kind = "alpha" }) => (
  <div
    className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-xs transition-all ${
      selected
        ? "border-[#10b981] bg-[#d1fae5] text-[#047857]"
        : "border-[#e6e6ed] bg-white text-[#1e1b4b]"
    }`}
  >
    <span className="font-mono font-extrabold w-6 text-center flex-none">
      {label}
    </span>
    <span className="flex-1 min-w-0">
      {text || <span className="italic text-[#94a3b8]">—</span>}
    </span>
    {selected && <span className="flex-none">✓</span>}
  </div>
);

const HeadingPreview = ({ metadata }) => {
  const headings = metadata?.headings || [];
  const paragraphs = metadata?.paragraphs || [];
  const paraLabel = metadata?.paragraphRef || "?";
  const correctIdx = Number(metadata?.correctHeadingIndex);
  return (
    <div className="space-y-3">
      <div className="text-sm text-[#1e1b4b] font-semibold leading-relaxed">
        Choose the correct heading for <b>Paragraph {paraLabel}</b>.
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {headings.map((h, i) => (
          <PreviewCard
            key={i}
            label={h.label}
            text={h.text}
            selected={i === correctIdx}
            kind="roman"
          />
        ))}
      </div>
    </div>
  );
};

const InformationPreview = ({ metadata, content }) => {
  const labels = metadata?.paragraphLabels || [];
  const correct = metadata?.correctParagraph;
  return (
    <div className="space-y-3">
      <div className="text-sm text-[#1e1b4b] font-semibold leading-relaxed">
        {metadata?.statement || content || "(statement not set)"}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        {labels.map((l) => (
          <PreviewCard
            key={l}
            label={l}
            text=""
            selected={l === correct}
            kind="alpha"
          />
        ))}
      </div>
    </div>
  );
};

const FeaturesPreview = ({ metadata, content }) => {
  const features = metadata?.features || [];
  const correct = metadata?.correctFeatureLabel;
  return (
    <div className="space-y-3">
      <div className="text-sm text-[#1e1b4b] font-semibold leading-relaxed">
        {metadata?.statement || content || "(statement not set)"}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {features.map((f) => (
          <PreviewCard
            key={f.label}
            label={f.label}
            text={f.text}
            selected={f.label === correct}
            kind="alpha"
          />
        ))}
      </div>
    </div>
  );
};

const EndingsPreview = ({ metadata, content }) => {
  const endings = metadata?.endings || [];
  const correct = metadata?.correctEndingLabel;
  return (
    <div className="space-y-3">
      <div className="text-sm text-[#1e1b4b] font-semibold leading-relaxed">
        {metadata?.sentenceStem || content || "(sentence stem not set)"}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {endings.map((e) => (
          <PreviewCard
            key={e.label}
            label={e.label}
            text={e.text}
            selected={e.label === correct}
            kind="alpha"
          />
        ))}
      </div>
    </div>
  );
};

export default function MatchingPreview({ qType, metadata, content }) {
  const renderBody = () => {
    switch (qType) {
      case "MATCHING_HEADING":
        return <HeadingPreview metadata={metadata} />;
      case "MATCHING_INFORMATION":
        return <InformationPreview metadata={metadata} content={content} />;
      case "MATCHING_FEATURES":
        return <FeaturesPreview metadata={metadata} content={content} />;
      case "MATCHING_SENTENCE_ENDINGS":
        return <EndingsPreview metadata={metadata} content={content} />;
      default:
        return (
          <div className="text-xs text-[#94a3b8] italic">
            No preview available for {qType}
          </div>
        );
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-[#6366f1] bg-[#fafafc] p-3">
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4338ca] mb-2">
        👀 Student sees
      </div>
      {renderBody()}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/magicpath/ielts-test-editor/MatchingPreview.jsx
git -c user.name="Claude Code" -c user.email="noreply@anthropic.com" commit -m "feat(matching): add MatchingPreview (student-facing render)"
```

---

### Task 4: Slim `MatchingForm.jsx` — per-question only

**Files:**
- Modify: `src/components/test/teacher/Detail/MatchingForm.jsx` (replace file contents)

The new `MatchingForm.jsx`:
- For each of the 4 sub-types, only renders the question-specific fields (statement/stem/paragraphRef + answer picker + preview).
- Pool inputs are removed — those live in the new `MatchingPoolEditor`.
- Adds a small `AnswerPicker` inline component for clickable cards.

- [ ] **Step 1: Replace the file contents**

Overwrite `src/components/test/teacher/Detail/MatchingForm.jsx` with:

```jsx
import React from "react";
import { Input, Select } from "antd";
import MatchingPreview from "@/components/magicpath/ielts-test-editor/MatchingPreview";
import { getLabelScheme, labelFor, POOL_MAX } from "@/components/magicpath/ielts-test-editor/matchingHelpers";

// Clickable answer card — used for the correct-answer picker.
const AnswerCard = ({ active, label, text, onClick, disabled, hint }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-left text-xs transition-all ${
      disabled
        ? "border-[#e6e6ed] bg-[#fafafc] text-[#94a3b8] cursor-not-allowed"
        : active
          ? "border-[#6366f1] bg-[#eef2ff] text-[#4338ca] shadow-[0_2px_0_#4338ca]"
          : "border-[#e6e6ed] bg-white text-[#1e1b4b] hover:border-[#c7d2fe]"
    }`}
  >
    <span className="font-mono font-extrabold w-6 text-center flex-none">{label}</span>
    <span className="flex-1 min-w-0">
      {text || <span className="italic text-[#94a3b8]">—</span>}
    </span>
    {active && <span className="flex-none text-[#10b981]">✓</span>}
  </button>
);

// MATCHING_HEADING — per-question: content + paragraphRef + correctHeadingIndex
const MatchingHeadingForm = ({ value = {}, onChange, pool = {} }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const headings = pool.headings || [];
  const paragraphs = pool.paragraphs || [];
  const correctIdx = Number.isInteger(value.correctHeadingIndex) ? value.correctHeadingIndex : -1;
  const paraValue = value.paragraphRef || "";
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Which paragraph does this question ask about?
        </span>
        <Select
          className="w-full"
          value={paraValue || undefined}
          onChange={(v) => update({ paragraphRef: v })}
          options={paragraphs.map((p) => ({ value: p.label, label: `${p.label}. ${p.name || ""}` }))}
          placeholder="Pick a paragraph"
        />
      </label>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct heading (click to pick)
        </span>
        {headings.length === 0 ? (
          <div className="text-[10px] text-[#be123c] italic font-bold">
            ⚠ Add headings in the matching pool above first.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {headings.map((h, i) => (
              <AnswerCard
                key={i}
                label={h.label}
                text={h.text}
                active={i === correctIdx}
                onClick={() => update({ correctHeadingIndex: i })}
              />
            ))}
          </div>
        )}
      </div>

      <MatchingPreview
        qType="MATCHING_HEADING"
        metadata={{ ...value, headings, paragraphs }}
        content={value.statement || ""}
      />
    </div>
  );
};

// MATCHING_INFORMATION — per-question: statement + correctParagraph
const MatchingInfoForm = ({ value = {}, onChange, pool = {} }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const labels = pool.paragraphLabels || [];
  const correct = value.correctParagraph;
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Statement (what the student reads)
        </span>
        <Input.TextArea
          value={value.statement}
          onChange={(e) => update({ statement: e.target.value })}
          rows={2}
          placeholder="e.g. The author mentions renewable energy sources in…"
        />
      </label>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct paragraph (click to pick)
        </span>
        {labels.length === 0 ? (
          <div className="text-[10px] text-[#be123c] italic font-bold">
            ⚠ Add paragraph labels in the matching pool above first.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {labels.map((l) => (
              <AnswerCard
                key={l}
                label={l}
                text=""
                active={l === correct}
                onClick={() => update({ correctParagraph: l })}
              />
            ))}
          </div>
        )}
      </div>

      <MatchingPreview
        qType="MATCHING_INFORMATION"
        metadata={{ ...value, paragraphLabels: labels }}
        content={value.statement || ""}
      />
    </div>
  );
};

// MATCHING_FEATURES — per-question: statement + correctFeatureLabel
const MatchingFeaturesForm = ({ value = {}, onChange, pool = {} }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const features = pool.features || [];
  const correct = value.correctFeatureLabel;
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Statement (which feature is being described)
        </span>
        <Input.TextArea
          value={value.statement}
          onChange={(e) => update({ statement: e.target.value })}
          rows={2}
          placeholder="e.g. proposed the theory of evolution"
        />
      </label>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct feature (click to pick)
        </span>
        {features.length === 0 ? (
          <div className="text-[10px] text-[#be123c] italic font-bold">
            ⚠ Add features in the matching pool above first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {features.map((f) => (
              <AnswerCard
                key={f.label}
                label={f.label}
                text={f.text}
                active={f.label === correct}
                onClick={() => update({ correctFeatureLabel: f.label })}
              />
            ))}
          </div>
        )}
      </div>

      <MatchingPreview
        qType="MATCHING_FEATURES"
        metadata={{ ...value, features }}
        content={value.statement || ""}
      />
    </div>
  );
};

// MATCHING_SENTENCE_ENDINGS — per-question: sentenceStem + correctEndingLabel
const MatchingSentenceEndingsForm = ({ value = {}, onChange, pool = {} }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const endings = pool.endings || [];
  const correct = value.correctEndingLabel;
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Sentence stem (incomplete sentence)
        </span>
        <Input.TextArea
          value={value.sentenceStem}
          onChange={(e) => update({ sentenceStem: e.target.value })}
          rows={2}
          placeholder="e.g. The capital of France is…"
        />
      </label>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct ending (click to pick)
        </span>
        {endings.length === 0 ? (
          <div className="text-[10px] text-[#be123c] italic font-bold">
            ⚠ Add endings in the matching pool above first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {endings.map((e) => (
              <AnswerCard
                key={e.label}
                label={e.label}
                text={e.text}
                active={e.label === correct}
                onClick={() => update({ correctEndingLabel: e.label })}
              />
            ))}
          </div>
        )}
      </div>

      <MatchingPreview
        qType="MATCHING_SENTENCE_ENDINGS"
        metadata={{ ...value, endings }}
        content={value.sentenceStem || ""}
      />
    </div>
  );
};

const MatchingForm = (props) => {
  const { qType, pool, ...rest } = props;
  switch (qType) {
    case "MATCHING_HEADING":
      return <MatchingHeadingForm {...rest} pool={pool} />;
    case "MATCHING_INFORMATION":
      return <MatchingInfoForm {...rest} pool={pool} />;
    case "MATCHING_FEATURES":
      return <MatchingFeaturesForm {...rest} pool={pool} />;
    case "MATCHING_SENTENCE_ENDINGS":
      return <MatchingSentenceEndingsForm {...rest} pool={pool} />;
    default:
      return (
        <div className="text-xs text-[#94a3b8] italic">
          Unsupported matching sub-type: {qType}
        </div>
      );
  }
};

export default MatchingForm;
```

- [ ] **Step 2: Visual smoke-test — confirm existing groups still render their forms (with the new picker + preview)**

Open the test editor URL, expand a T6a MatchingHeading group, click ✎ on the question. You should see:
- The "Paragraph reference" Select dropdown (not free-text input).
- A grid of clickable heading cards (the existing 5 default headings from the per-question metadata).
- The "👀 Student sees" preview at the bottom.

If the existing per-question metadata has 5 headings, those should appear. If not, you'll see the "Add headings in the matching pool above first" warning (until Task 5 wires the pool editor in).

The previous paragraphRef was a free-text Input — now it's a Select. Existing data with `paragraphRef = "Paragraph A"` will NOT match any new paragraph label (since the pool is empty). The Select will show no selection. This is expected; the teacher will pick a new one once the pool editor is in.

- [ ] **Step 3: Commit**

```bash
git add src/components/test/teacher/Detail/MatchingForm.jsx
git -c user.name="Claude Code" -c user.email="noreply@anthropic.com" commit -m "feat(matching): slim MatchingForm (per-question only + answer cards + preview)"
```

---

### Task 5: Wire `MatchingPoolEditor` into `GroupEditor` (broadcast)

**Files:**
- Modify: `src/components/magicpath/ielts-test-editor/editorReadingListening.jsx`

This is the integration task. We need to:
1. Import `MatchingPoolEditor` and the helpers.
2. Add a `matchingPool` state inside `GroupEditor` — derived from the first question's metadata, defaults to `getDefaultPool(group.questionType)`.
3. Render `<MatchingPoolEditor>` inside the group editor, between the "Save group info" button and the question list, but ONLY when `group.questionType` is a matching sub-type.
4. Wire a `useEffect` that broadcasts pool changes to all questions (in-memory) and to all `stagedNew`/`stagedEdit` payloads.
5. Pass the pool into the `QuestionQuickForm` as a `pool` prop, which the per-question `MatchingForm` then consumes.
6. Make sure `saveAllQuestions` writes the latest pool into each `toCreate` / `toUpdate` payload.

- [ ] **Step 1: Add the import line at the top of the file**

Find this line in the existing imports (around line 35):
```js
import MatchingForm from "@/components/test/teacher/Detail/MatchingForm";
```

Add these two lines right after it:
```js
import MatchingPoolEditor from "./MatchingPoolEditor";
import MatchingPreview from "./MatchingPreview";
import {
  isMatchingQType,
  getPoolKey,
  getDefaultPool,
} from "./matchingHelpers";
```

- [ ] **Step 2: Add `matchingPool` state inside `GroupEditor`**

Find the line in `GroupEditor` (around line 442) where `stagedEdit` is declared:
```js
  const [stagedNew, setStagedNew] = useState([]);
  const [stagedEdit, setStagedEdit] = useState({});
```

Add the pool state right after those two lines:
```js
  // Shared pool for the four matching sub-types. Derived from the first
  // question's metadata; defaults to the sub-type's template pool.
  const [matchingPool, setMatchingPool] = useState(() => {
    if (!isMatchingQType(group.questionType)) return null;
    const firstQ = (Array.isArray(questions) ? questions : [])[0];
    const md = firstQ?.metadata || {};
    const key = getPoolKey(group.questionType);
    const fromQ = key === "paragraphLabels" ? md.paragraphLabels : md[key];
    if (Array.isArray(fromQ) && fromQ.length > 0) return fromQ;
    return getDefaultPool(group.questionType);
  });
```

- [ ] **Step 3: Add a `useEffect` that broadcasts the pool to all questions**

Find the existing `useEffect` that handles slot syncing (around line 497, the one that watches `[quantity, questions.length, group.idGroupOfQuestions]`). Just BEFORE that `useEffect`, add a new one:

```js
  // Broadcast the shared matching pool to all questions, staged-new slots,
  // and staged-edit payloads. Runs whenever the pool changes.
  useEffect(() => {
    if (!isMatchingQType(group.questionType)) return;
    const key = getPoolKey(group.questionType);
    if (!key) return;
    setQuestions((qs) =>
      qs.map((q) => ({
        ...q,
        metadata: { ...(q.metadata || {}), [key]: matchingPool },
      }))
    );
    setStagedNew((arr) =>
      arr.map((s) => {
        if (!s.payload) return s; // empty placeholder: no payload to update
        return {
          ...s,
          payload: {
            ...s.payload,
            metadata: { ...(s.payload.metadata || {}), [key]: matchingPool },
          },
        };
      })
    );
    setStagedEdit((m) => {
      const next = { ...m };
      Object.keys(next).forEach((id) => {
        if (!next[id]?.payload) return;
        next[id] = {
          ...next[id],
          payload: {
            ...next[id].payload,
            metadata: {
              ...(next[id].payload.metadata || {}),
              [key]: matchingPool,
            },
          },
        };
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingPool, group.questionType]);
```

- [ ] **Step 4: Render the pool editor inside the JSX**

Find the section in `GroupEditor` that ends with the "Save group info" button (around line 886, the line that ends with `</button>` for "💾 Save group info"). The next thing in the JSX is the Questions list section starting with `<div className="pt-3 border-t-2 border-[#e6e6ed] space-y-2">`.

Right BEFORE that Questions list `<div>`, add:

```jsx
      {isMatchingQType(group.questionType) && (
        <div className="pt-3">
          <MatchingPoolEditor
            qType={group.questionType}
            pool={matchingPool || []}
            onPoolChange={setMatchingPool}
          />
        </div>
      )}
```

- [ ] **Step 5: Pass the pool into `QuestionQuickForm`**

Find the two `<QuestionQuickForm ...>` usages inside `GroupEditor`:
- The "edit" form (around line 1014): looks like
  ```jsx
  <QuestionQuickForm
    key={`edit-${q.idQuestion}`}
    qType={group.questionType}
    mode="edit"
    ...
  ```
- The "create" form (around line 1147): looks like
  ```jsx
  <QuestionQuickForm
    key={slot.draftKey}
    qType={group.questionType}
    mode="create"
    ...
  ```

Add `pool={matchingPool || {}}` to BOTH of them, right after `qType={group.questionType}`.

So each becomes:
```jsx
  <QuestionQuickForm
    key={`edit-${q.idQuestion}`}
    qType={group.questionType}
    pool={matchingPool || {}}
    mode="edit"
    ...
```

- [ ] **Step 6: Pass `pool` through `QuestionQuickForm` to `MatchingForm`**

Find the `QuestionQuickForm` function signature (around line 1201). It currently looks like:
```js
function QuestionQuickForm({
  qType,
  mode = "create",
  groupId,
  draftKey,
  existing = null,
  initialPayload = null,
  onAddToGroup,
  onUpdate,
  onCancel,
}) {
```

Add `pool = {}` to the destructured props. Also find the `renderTypeEditor` function (around line 1286) inside the same component. It looks like:
```js
  const renderTypeEditor = () => {
    const common = { value: safeMetadata, onChange: setMetadata };
    switch (effectiveType) {
      ...
      case "MATCHING_HEADING":
      case "MATCHING_INFORMATION":
      case "MATCHING_FEATURES":
      case "MATCHING_SENTENCE_ENDINGS":
        return <MatchingForm {...common} qType={effectiveType} />;
      ...
```

Change the `return` line for matching sub-types to also pass `pool`:
```js
      case "MATCHING_HEADING":
      case "MATCHING_INFORMATION":
      case "MATCHING_FEATURES":
      case "MATCHING_SENTENCE_ENDINGS":
        return <MatchingForm {...common} qType={effectiveType} pool={pool} />;
      ...
```

- [ ] **Step 7: Make `saveAllQuestions` include the latest pool**

Find the `saveAllQuestions` function inside `GroupEditor` (around line 656). At the end of the function, just before the `await Promise.all(ops)` call, we need to make sure each `toCreate` and `toUpdate` carries the latest pool. The `useEffect` in Step 3 already updates the stagedNew payloads, but `toCreate` and `toUpdate` are built from the current stagedNew/stagedEdit maps — and the staged items' metadata is already updated. So nothing to do here. Just confirm by re-reading the function: at the point where `toCreate` and `toUpdate` are built, each `s.payload.metadata` and `payload.metadata` already contains the latest pool (because the broadcast useEffect ran first). So this step is a no-op — just verify.

- [ ] **Step 8: Visual + functional smoke-test**

1. Open the test editor URL in the browser.
2. Expand T6a MatchingHeading (range 9-9).
3. **Verify pool editor appears** at the top of the group's expanded body, between "Save group info" and "Question list". It should show 5 headings (`i, ii, iii, iv, v` with empty text) and a count badge "5/10".
4. **Verify legacy data loads:** since T6a was authored before this redesign, the existing question's `metadata.headings` should populate the pool editor. (If T6a has 5 default headings, those should appear with their existing text.)
5. **Edit a heading text** in the pool (e.g. type "Background" into heading `i`).
6. **Open the question's edit form** (✎). The heading cards should show "i. Background" in the answer picker.
7. **Click a heading card** (e.g. heading `ii`). The card should highlight indigo with a ✓.
8. **Scroll to the bottom** of the question form. The "👀 Student sees" preview should show the question text + the 5 headings as cards, with heading `ii` highlighted green + ✓.
9. **Add a new matching group** via `AddGroupModal`: pick Matching tile → "Matching features" sub-type → Create. The new group should show a "Features pool" with 3 default features (A, B, C) and the same per-question form.
10. **Open console** — should be zero errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/magicpath/ielts-test-editor/editorReadingListening.jsx
git -c user.name="Claude Code" -c user.email="noreply@anthropic.com" commit -m "feat(matching): mount MatchingPoolEditor in GroupEditor with broadcast"
```

---

### Task 6: End-to-end save + persistence verification

**Files:** (no changes; just verification)

- [ ] **Step 1: Add a new matching-features question and save**

1. Open the test editor URL.
2. Expand a matching group (T6c or create a new one).
3. Edit a question: type a statement ("proposed the theory of evolution"), pick feature `B` as the correct answer.
4. Edit the pool: add a 4th feature.
5. Click "💾 Save draft" at the group level.
6. Open DevTools → Network tab. The request to `/question/create-many-questions` (or PATCH) should include the question's `metadata` with `features` matching the pool + `correctFeatureLabel: "B"`.
7. **Verify BE persistence:** reload the page. Re-expand the group. The pool editor should show the 4 features with the texts you typed. The question's form should still show feature `B` as selected.

- [ ] **Step 2: Verify the other 3 sub-types**

Repeat step 1 for a matching-heading group, a matching-information group, and a matching-sentence-endings group (you can use the existing T6a, T6b, T6d groups).

- [ ] **Step 3: Verify no regression on other sub-types**

Open an MCQ group (T1) → expand → click ✎ on a question → form should render exactly as before (MCQForm with options). No "pool" editor, no "Student sees" panel.

Repeat for a TFNG group (T2), a YNNG group (T3), a FILL-family group (T5a/b/c/e), a SHORT_ANSWER group (T4), a LABELING group (T7).

Expected: each of these 7 non-matching sub-types renders its existing form unchanged. The `isMatchingQType(...)` gate in Step 4 prevents the pool editor from rendering.

- [ ] **Step 4: Verify the empty-pool case**

1. In any matching group, click "✕" on every pool item until the pool is empty. (The "Remove" button is hidden when `items.length <= 1`, so to test empty you can also just leave one item with empty text.)
2. Open the question's form. The answer picker should show the "⚠ Add items in the matching pool above first" warning (because the pool is empty).
3. Click "💾 Save draft" with no valid answer. You should see the "Please complete required fields" validation message (from the existing `validateMetadata` check).

- [ ] **Step 5: Final commit**

```bash
git status --short
# If there are any uncommitted fixes from the verification, commit them.
# Otherwise this step is a no-op.
```

---

## Self-review (against spec)

1. **Spec coverage:**
   - Shared pool at group level → Tasks 2 + 5 ✅
   - Auto-label `i, ii, iii` for headings, `A, B, C` for others → Task 1 (helpers) + Task 2 (MatchingPoolEditor) ✅
   - Per-question form: content + per-type field + answer cards → Task 4 ✅
   - Student preview → Task 3 ✅
   - Per sub-type shapes (Heading/Info/Features/Endings) → Task 4 (4 inner forms) ✅
   - Data shape unchanged, broadcast via FE → Task 5 (useEffect) ✅
   - Backward compat with legacy data (read from `questions[0]?.metadata`) → Task 5 (state init) ✅
   - Validation still works → no change to `validateMetadata`; the "Add items in the matching pool above first" hint guides the teacher ✅
   - No regression on other sub-types → gated by `isMatchingQType` in Task 5 ✅

2. **Placeholder scan:** no TBDs, no "implement later". Every step has actual code or actual test commands.

3. **Type consistency:** `matchingPool` is initialized with `useState` (Task 5), set by `MatchingPoolEditor.onPoolChange` (Task 5), broadcast via the `useEffect` (Task 5), passed as `pool` prop to `QuestionQuickForm` (Task 5) and through to `MatchingForm` (Task 6 — but actually Task 5 step 6). The prop is named `pool` consistently throughout.

4. **File name consistency:** `MatchingPoolEditor.jsx` (Task 2), `MatchingPreview.jsx` (Task 3), `MatchingForm.jsx` (Task 4) — all referenced correctly in Task 5.

5. **Note on Task 5 Step 7:** I claimed it's a no-op because the broadcast useEffect updates stagedNew/stagedEdit metadata before saveAllQuestions reads them. Verified by re-reading the code path. The no-op step is intentional and explicit.

No issues found. Plan is complete.
