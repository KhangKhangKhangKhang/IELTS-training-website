# Matching form UI/UX redesign

## Problem

The four IELTS matching sub-types (`MATCHING_HEADING`, `MATCHING_INFORMATION`, `MATCHING_FEATURES`, `MATCHING_SENTENCE_ENDINGS`) are currently authored through a single per-question form that conflates the **shared pool** (list of headings, paragraph labels, features, or endings) with the **per-question answer** (which one is correct). This produces a UI that does not match how IELTS reading questions actually work:

- The shared list (e.g. headings i, ii, iii, iv, v) is retype-d inside every question's form.
- Labels use generic tokens (`H1`, `H2`, `F1`, `E1`) instead of the Roman-numeral / uppercase-letter format students see in real tests.
- The teacher cannot preview what the student will see.
- "Add heading" appends an item but does not renumber Roman labels automatically.
- The teacher cannot add or remove paragraphs in a matching-headings question.
- The correct-answer picker is a Select dropdown showing indices, not the actual heading text.

User quote: "cái matching heading này bạn làm nó không UI/UX lắm bạn hãy lên mạng coi thử cách matching của nhiều loại khác nhau rồi về đây fix lại giúp tôi."

## Goal

Make authoring the four matching sub-types feel like authoring real IELTS questions:

- A **shared pool** lives at the top of the group and is set up **once**.
- Per-question form contains only the question prompt and the correct answer.
- Pool items are auto-labeled in the format students see (`i`, `ii`, `iii`… for headings; `A`, `B`, `C`… for paragraphs, features, endings).
- A **student preview** at the bottom of the form shows what the student will see.
- The on-disk metadata shape is unchanged (no BE change required) — the shared pool is broadcast to each question's metadata by the FE.

## Out of scope

- BE schema changes (group has no `metadata` field today; we keep the per-question metadata shape).
- The other 10 sub-types (MCQ, TFNG, YNNG, FILL family, SHORT_ANSWER, LABELING, OTHER).
- Student-side rendering (the existing student renderer is not touched).
- Drag-and-drop matching (the teacher-side pool is just typed text, not a reordering UI).

## Architecture

Three layers inside the expanded `GroupEditor`, top to bottom:

1. **Group info form** (existing): title, instructions, quantity.
2. **🆕 `MatchingPoolEditor`** (new): renders only when `group.questionType` is one of the four matching sub-types. Holds the shared pool. Any change is broadcast to every question's metadata.
3. **Question list** (existing, with tweaks): each question's `QuestionQuickForm` now renders the simplified per-type editor + the new `AnswerPicker` + the new `StudentPreview`.

### Data flow — `MatchingPoolEditor`

- **Read source:** `questions[0]?.metadata` (first existing question). If absent or empty, fall back to the `TEMPLATES[subType]` from `questionTypeMeta.js` (e.g. 5 default headings for `MATCHING_HEADING`).
- **Write target:** every question in `questions`, every staged-new slot, and every staged-edit payload. The pool fields are written into each question's `metadata.{headings|paragraphLabels|features|endings}` (depending on sub-type).
- **Lifecycle:** edits are immediate; the broadcast is a `useEffect` that re-fires whenever the pool changes.
- **Conflict policy:** last-write-wins. If the teacher opens two questions side by side and edits both, the second edit overrides the first. (Cannot happen in current UI — only one inline form is open at a time.)

### Data flow — `AnswerPicker`

- Renders one clickable card per pool item.
- Card shows the auto-label + the item text.
- Clicking a card sets the correct-answer field (`correctHeadingIndex`, `correctParagraph`, `correctFeatureLabel`, or `correctEndingLabel`).
- Highlighted card = currently selected answer.

### Data flow — `StudentPreview`

- Pure render-only component (no state).
- Given `qType`, `content`, `metadata`, renders what the student sees: the question prompt, the pool items as radio cards, and the correct answer marked with ✓ + green tint.
- Sits at the bottom of `QuestionQuickForm`, separated by a "👀 Student sees" header.

## Per sub-type shape

### MATCHING_HEADING

**Group-level pool** (`MatchingPoolEditor`):
- `headings`: array of `{label, text}`. Auto-label: `i, ii, iii, iv, v, vi, vii, viii, ix, x` (max 10, matches real IELTS).
- `paragraphs`: array of `{label, name}`. Auto-label: `A, B, C, D, E, F, G, H, I, J`. `name` is free text (e.g. "Background", "Findings").

**Per-question** (`QuestionQuickForm`):
- `content` (textarea, the question prompt — e.g. "Choose the correct heading for Paragraph B").
- `paragraphRef` (Select dropdown of paragraph labels — no more free text).
- `correctHeadingIndex` (clickable cards of headings).

**Student preview** renders: question text + list of paragraphs (radio) + list of headings (radio), with the correct paragraph + heading marked.

### MATCHING_INFORMATION

**Group-level pool:**
- `paragraphs`: array of `{label, name}` (same as Heading). Auto-label A, B, C…

**Per-question:**
- `content` (textarea).
- `statement` (textarea, the prompt the student reads — e.g. "The author mentions renewable energy sources in…").
- `correctParagraph` (clickable cards of paragraphs).

**Student preview** renders: statement + list of paragraphs (radio), correct one marked.

### MATCHING_FEATURES

**Group-level pool:**
- `features`: array of `{label, text}`. Auto-label A, B, C…J. The "options" the student matches to ARE these features (one-to-one in real IELTS).

**Per-question:**
- `content` (textarea — the question prompt).
- `statement` (textarea — the feature description, e.g. "proposed the theory of evolution").
- `correctFeatureLabel` (clickable cards of features).

**Student preview** renders: statement + list of features (radio), correct one marked.

### MATCHING_SENTENCE_ENDINGS

**Group-level pool:**
- `endings`: array of `{label, text}`. Auto-label A, B, C…J.

**Per-question:**
- `content` (textarea).
- `sentenceStem` (textarea, the incomplete sentence — e.g. "The capital of France is…").
- `correctEndingLabel` (clickable cards of endings).

**Student preview** renders: sentence stem + list of endings (radio), correct one marked.

## Auto-labeling rules

- Headings: Roman lowercase `i, ii, iii, iv, v, vi, vii, viii, ix, x`. Max 10.
- Paragraphs / Features / Endings: uppercase `A, B, C, D, E, F, G, H, I, J`. Max 10.
- On add/remove/reorder, labels re-flow top-to-bottom.
- User CAN override a single item's label via a small ✎ button (sets a custom label; clears back to auto on next re-flow).

## Visual language

- Pool editor: rounded-2xl card, slate-50 background, indigo accents, sticky-feel header with "📚 Matching pool" + an "Expand all / Collapse all" toggle (default expanded).
- Pool item row: drag-handle dots (visual only, no drag yet) + label chip (mono font, indigo) + text input + ✕ remove button.
- Answer cards: 2- or 3-column grid, indigo border on hover, indigo fill on selected, transition 150ms.
- Student preview: 2-px dashed indigo border, "👀 Student sees" header, muted background (`#fafafc`), radio-style cards with the correct one bordered green and marked ✓.

## Validation

`validateMetadata` in `questionTypeMeta.js` is unchanged:
- `MATCHING_HEADING`: needs `headings.length > 0`, every heading has non-empty text, `correctHeadingIndex` is in range.
- `MATCHING_INFORMATION`: needs `paragraphLabels.length > 0`, `correctParagraph` in list.
- `MATCHING_FEATURES`: needs `features.length > 0`, every feature has non-empty text, `correctFeatureLabel` in list.
- `MATCHING_SENTENCE_ENDINGS`: needs `endings.length > 0`, every ending has non-empty text, `correctEndingLabel` in list.

The new pool editor and the simplified per-question form both call into the same `validateMetadata`. When the pool is empty, the per-question answer picker is disabled with a "Add items in the matching pool above first" hint.

## Backward compatibility

- Existing groups in the DB have `metadata.headings` etc. on each question. The new `MatchingPoolEditor` reads from `questions[0]?.metadata` on mount and broadcasts to all questions on any change. Old per-question edits become impossible in the new UI (the per-question form no longer shows pool fields), but the data shape is preserved.
- If `questions[0]?.metadata` is empty, the pool editor falls back to `TEMPLATES[subType]` (5 default headings, 4 default paragraph labels, etc.).
- The `Save draft` button keeps the same per-question payload shape. No `group.metadata` field is added to the wire format.

## Files

| File | Change |
|---|---|
| `src/components/magicpath/ielts-test-editor/editorReadingListening.jsx` | Add `MatchingPoolEditor` component. Render it inside `GroupEditor` when `group.questionType` is a matching sub-type. Add `AnswerPicker` + `StudentPreview` imports. Wire pool-broadcast `useEffect`. |
| `src/components/magicpath/ielts-test-editor/MatchingPreview.jsx` (new) | `StudentPreview` component: switches by `qType` and renders the 4 previews. |
| `src/components/test/teacher/Detail/MatchingForm.jsx` | Replace the 4 inner forms with simplified versions: each only renders the question-specific fields (statement/stem + answer picker + preview). Remove the pool-input UI; that moved to `MatchingPoolEditor`. |
| `src/components/magicpath/ielts-test-editor/questionTypeMeta.js` | (No change expected — templates already have correct shapes.) |
| `src/components/magicpath/ielts-test-editor/editorUI.jsx` | (Possibly add a `ClickableCard` helper; otherwise inline.) |

## Verification

1. **Create + populate:** open the editor, add a group with sub-type `MATCHING_HEADING`, quantity 4. Expand. The new `MatchingPoolEditor` appears at the top with 5 default headings and 4 default paragraphs. Edit a heading text — it propagates to the question form's preview.
2. **Answer picker:** open question 1, see the paragraphRef Select, then the heading cards. Click "iii. Some heading" — card highlights indigo.
3. **Student preview:** scroll to bottom of question 1, see "👀 Student sees" with the rendered question, the selected paragraph, and the chosen heading marked ✓ green.
4. **Add/remove:** click "+ Add heading" in the pool → new row with label `vi` appears. Click ✕ on a row → row removed and labels re-flow.
5. **Cross-form propagation:** in question 1, see the same 5 headings in the picker. Edit a heading in the pool → both question 1 and question 2's pickers reflect the new text on next render.
6. **Save draft:** click "Save draft" → BE gets the same per-question payload shape as before, with `metadata.headings` and `metadata.correctHeadingIndex` populated. Group header still shows the family label "🔗 Matching".
7. **Other sub-types:** repeat for `MATCHING_INFORMATION`, `MATCHING_FEATURES`, `MATCHING_SENTENCE_ENDINGS`. Each renders its own pool shape and answer picker.
8. **Legacy data:** an old group with `metadata.headings = [{label: "H1", text: "old"}]` opens → pool editor shows the old text with auto-relabeled `i` (label `H1` replaced by `i` on first render, since the spec says all pool labels are auto-flowed). The text content is preserved. This is a one-time relabel; subsequent saves use the new labels.
9. **Empty state:** clear all headings → answer picker disabled with a hint. Validation error appears in the same "Please complete required fields" block.
10. **No regression:** MCQ / TFNG / YNNG / FILL family / SHORT_ANSWER / LABELING / OTHER groups render their existing forms unchanged (the new editor is gated to the four matching sub-types).
