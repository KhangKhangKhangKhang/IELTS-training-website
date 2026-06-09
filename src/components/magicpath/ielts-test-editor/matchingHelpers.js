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