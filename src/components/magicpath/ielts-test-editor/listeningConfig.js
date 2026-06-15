// Listening-specific configuration
// Source: Cambridge IELTS — 4 sections, 10 questions each, 40 total.
//
// Section 1 — Social / survival context (e.g. booking, enquiry, registration).
//   Typical types: form / note / table / flow-chart / summary completion
//                  + short answer + multiple choice.
//   Speaker: 2 speakers.
//
// Section 2 — Social / survival context (e.g. tour, orientation, facilities).
//   Typical types: multiple choice (single + multi), matching, map / plan labelling,
//                  sentence completion, short answer.
//   Speaker: 1 speaker (monologue).
//
// Section 3 — Educational / training context (e.g. discussion, tutorial, project).
//   Typical types: multiple choice (single + multi), matching (features / sentence endings),
//                  note / flow-chart completion.
//   Speaker: 2–4 speakers.
//
// Section 4 — Academic lecture / talk.
//   Typical types: note / summary / table / flow-chart / sentence completion
//                  + short answer.
//   Speaker: 1 speaker (monologue).
//
// We expose:
//   - LISTENING_SECTIONS: array of section metadata (name, targetQty, allowed BE qTypes)
//   - getSectionForPartIdx: map BE part index (0-based) → section meta
//   - getAllowedTypesForSection(sectionIdx): BE sub-type keys allowed
//   - validatePartQuantity(sectionIdx, qty): throw if qty out of band

const LISTENING_SECTIONS = [
  {
    idx: 0,
    name: "Section 1",
    short: "S1",
    context: "Social / survival",
    speakerHint: "2 speakers",
    targetQty: 10,
    tone: "from-[#06b6d4] to-[#0e7490]",
    accent: "bg-[#06b6d4]",
    accentShadow: "shadow-[0_3px_0_#0891b2]",
    textAccent: "text-[#0e7490]",
    bgAccent: "bg-[#ecfeff]",
    allowedTypes: [
      "SENTENCE_COMPLETION",
      "SUMMARY_COMPLETION",
      "NOTE_COMPLETION",
      "TABLE_COMPLETION",
      "FLOW_CHART_COMPLETION",
      "SHORT_ANSWER",
      "MULTIPLE_CHOICE",
    ],
  },
  {
    idx: 1,
    name: "Section 2",
    short: "S2",
    context: "Social / survival (monologue)",
    speakerHint: "1 speaker",
    targetQty: 10,
    tone: "from-[#0ea5e9] to-[#0369a1]",
    accent: "bg-[#0ea5e9]",
    accentShadow: "shadow-[0_3px_0_#0369a1]",
    textAccent: "text-[#0369a1]",
    bgAccent: "bg-[#e0f2fe]",
    allowedTypes: [
      "MULTIPLE_CHOICE",
      "MATCHING_FEATURES",
      "MATCHING_INFORMATION",
      "DIAGRAM_LABELING",
      "SENTENCE_COMPLETION",
      "SHORT_ANSWER",
    ],
  },
  {
    idx: 2,
    name: "Section 3",
    short: "S3",
    context: "Educational / training",
    speakerHint: "2–4 speakers",
    targetQty: 10,
    tone: "from-[#8b5cf6] to-[#5b21b6]",
    accent: "bg-[#8b5cf6]",
    accentShadow: "shadow-[0_3px_0_#5b21b6]",
    textAccent: "text-[#5b21b6]",
    bgAccent: "bg-[#f5f3ff]",
    allowedTypes: [
      "MULTIPLE_CHOICE",
      "MATCHING_FEATURES",
      "MATCHING_INFORMATION",
      "MATCHING_SENTENCE_ENDINGS",
      "NOTE_COMPLETION",
      "FLOW_CHART_COMPLETION",
      "SHORT_ANSWER",
    ],
  },
  {
    idx: 3,
    name: "Section 4",
    short: "S4",
    context: "Academic lecture (monologue)",
    speakerHint: "1 speaker",
    targetQty: 10,
    tone: "from-[#f59e0b] to-[#b45309]",
    accent: "bg-[#f59e0b]",
    accentShadow: "shadow-[0_3px_0_#b45309]",
    textAccent: "text-[#b45309]",
    bgAccent: "bg-[#fffbeb]",
    allowedTypes: [
      "SENTENCE_COMPLETION",
      "SUMMARY_COMPLETION",
      "NOTE_COMPLETION",
      "TABLE_COMPLETION",
      "FLOW_CHART_COMPLETION",
      "SHORT_ANSWER",
    ],
  },
];

const getSectionForPartIdx = (partIdx) =>
  LISTENING_SECTIONS[partIdx] || LISTENING_SECTIONS[LISTENING_SECTIONS.length - 1];

const getAllowedTypesForSection = (partIdx) => {
  const sec = getSectionForPartIdx(partIdx);
  return sec ? sec.allowedTypes : [];
};

const validatePartQuantity = (partIdx, qty) => {
  const sec = getSectionForPartIdx(partIdx);
  if (!sec) return { ok: true, errors: {} };
  const errors = {};
  if (qty < 0) errors.qty = "Quantity cannot be negative";
  if (qty > 50) errors.qty = "Section capped at 50 questions";
  return { ok: Object.keys(errors).length === 0, errors, section: sec };
};

// Human-readable list of types allowed in a section (for the AddGroupModal
// hint text). We show sub-type display labels. When the editor is in
// Listening context, NOTE_COMPLETION is rendered as "Form completion"
// (Cambridge convention for Part 1).
import { getQuestionTypeDisplay } from "./questionTypeMeta";
const getAllowedTypesLabels = (partIdx) => {
  const types = getAllowedTypesForSection(partIdx);
  return types.map((t) => getQuestionTypeDisplay(t, "LISTENING").full);
};

export {
  LISTENING_SECTIONS,
  getSectionForPartIdx,
  getAllowedTypesForSection,
  validatePartQuantity,
  getAllowedTypesLabels,
};
