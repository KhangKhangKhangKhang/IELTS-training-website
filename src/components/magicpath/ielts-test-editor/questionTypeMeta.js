// Centralized metadata for all 14 question sub-types:
// - default metadata (template) when creating a new question
// - sub-type groups (which qType picks which sub-type)
// - validation rules (which fields are required)

const subTypesByFamily = {
  FILL_IN_THE_BLANK: [
    { key: "SENTENCE_COMPLETION", label: "Sentence completion" },
    { key: "SUMMARY_COMPLETION", label: "Summary completion" },
    { key: "NOTE_COMPLETION", label: "Note completion" },
    { key: "TABLE_COMPLETION", label: "Table completion" },
    { key: "FLOW_CHART_COMPLETION", label: "Flow chart completion" },
  ],
  MATCHING: [
    { key: "MATCHING_HEADING", label: "Matching headings" },
    { key: "MATCHING_INFORMATION", label: "Matching information" },
    { key: "MATCHING_FEATURES", label: "Matching features" },
    { key: "MATCHING_SENTENCE_ENDINGS", label: "Sentence endings" },
  ],
};

const TEMPLATES = {
  MULTIPLE_CHOICE: {
    type: "MULTIPLE_CHOICE",
    options: [
      { label: "A", text: "" },
      { label: "B", text: "" },
      { label: "C", text: "" },
      { label: "D", text: "" },
    ],
    correctOptionIndexes: [],
    isMultiSelect: false,
  },
  TRUE_FALSE_NOT_GIVEN: {
    type: "TRUE_FALSE_NOT_GIVEN",
    statement: "",
    correctAnswer: "TRUE",
  },
  YES_NO_NOT_GIVEN: {
    type: "YES_NO_NOT_GIVEN",
    statement: "",
    correctAnswer: "YES",
  },
  SHORT_ANSWER: {
    type: "SHORT_ANSWER",
    maxWords: 1,
    correctAnswers: [""],
  },
  SENTENCE_COMPLETION: {
    type: "SENTENCE_COMPLETION",
    sentenceWithBlank: "",
    maxWords: 1,
    correctAnswers: [""],
  },
  SUMMARY_COMPLETION: {
    type: "SUMMARY_COMPLETION",
    blankLabel: "",
    maxWords: 1,
    hasWordBank: false,
    wordBank: [],
    correctAnswers: [""],
    fullParagraph: "",
  },
  NOTE_COMPLETION: {
    type: "NOTE_COMPLETION",
    noteContext: "",
    maxWords: 1,
    correctAnswers: [""],
    fullNoteText: "",
  },
  TABLE_COMPLETION: {
    type: "TABLE_COMPLETION",
    rowIndex: 0,
    columnIndex: 0,
    maxWords: 1,
    correctAnswers: [""],
  },
  FLOW_CHART_COMPLETION: {
    type: "FLOW_CHART_COMPLETION",
    stepLabel: "",
    maxWords: 1,
    hasWordBank: false,
    wordBank: [],
    correctAnswers: [""],
    fullFlowText: "",
  },
  MATCHING_HEADING: {
    type: "MATCHING_HEADING",
    headings: [
      { label: "i", text: "" },
      { label: "ii", text: "" },
      { label: "iii", text: "" },
      { label: "iv", text: "" },
      { label: "v", text: "" },
    ],
    paragraphRef: "",
    correctHeadingIndex: 0,
  },
  MATCHING_INFORMATION: {
    type: "MATCHING_INFORMATION",
    statement: "",
    paragraphLabels: ["A", "B", "C", "D"],
    correctParagraph: "A",
  },
  MATCHING_FEATURES: {
    type: "MATCHING_FEATURES",
    statement: "",
    features: [
      { label: "A", text: "" },
      { label: "B", text: "" },
      { label: "C", text: "" },
    ],
    correctFeatureLabel: "A",
  },
  MATCHING_SENTENCE_ENDINGS: {
    type: "MATCHING_SENTENCE_ENDINGS",
    sentenceStem: "",
    endings: [
      { label: "A", text: "" },
      { label: "B", text: "" },
      { label: "C", text: "" },
    ],
    correctEndingLabel: "A",
  },
  DIAGRAM_LABELING: {
    type: "DIAGRAM_LABELING",
    imageUrl: "",
    labelCoordinate: { x: 50, y: 50 },
    pointLabel: "",
    hasWordBank: false,
    wordBank: [],
    correctAnswers: [""],
  },
  OTHER: {
    type: "OTHER",
    maxWords: 50,
    correctAnswers: [""],
    notes: "",
  },
};

// Resolve which sub-type to use:
// - If qType is a family (FILL_IN_THE_BLANK / MATCHING), pick the first
//   sub-type by default (or the existing.questionType if editing).
// - Otherwise qType is already a specific sub-type.
const resolveSubType = (qType, existing) => {
  if (subTypesByFamily[qType]) {
    if (existing?.questionType && qType === "FILL_IN_THE_BLANK" &&
        subTypesByFamily.FILL_IN_THE_BLANK.find((s) => s.key === existing.questionType)) {
      return existing.questionType;
    }
    if (existing?.questionType && qType === "MATCHING" &&
        subTypesByFamily.MATCHING.find((s) => s.key === existing.questionType)) {
      return existing.questionType;
    }
    return subTypesByFamily[qType][0].key;
  }
  return qType;
};

// Validation: returns { ok: boolean, errors: { fieldName: 'message' } }
const validateMetadata = (qType, metadata) => {
  const errors = {};
  const md = metadata || {};
  if (qType === "MULTIPLE_CHOICE") {
    if (!md.options || md.options.length < 2) {
      errors.options = "Need at least 2 options";
    } else if (md.options.some((o) => !o.text?.trim())) {
      errors.options = "All options need text";
    }
    if (!md.correctOptionIndexes?.length) {
      errors.correct = "Mark at least one correct answer";
    }
  } else if (qType === "TRUE_FALSE_NOT_GIVEN") {
    if (!md.statement?.trim()) errors.statement = "Statement is required";
    if (!md.correctAnswer) errors.correct = "Pick the correct answer";
  } else if (qType === "YES_NO_NOT_GIVEN") {
    if (!md.statement?.trim()) errors.statement = "Statement is required";
    if (!md.correctAnswer) errors.correct = "Pick the correct answer";
  } else if (qType === "SHORT_ANSWER") {
    if (!md.correctAnswers?.some((a) => a?.trim())) {
      errors.answers = "At least one acceptable answer is required";
    }
  } else if (qType === "SENTENCE_COMPLETION") {
    if (!md.sentenceWithBlank?.trim()) errors.sentence = "Sentence with ___ is required";
    if (!md.correctAnswers?.some((a) => a?.trim())) errors.answers = "At least one answer is required";
  } else if (qType === "SUMMARY_COMPLETION") {
    if (!md.blankLabel?.trim()) errors.blankLabel = "Blank label required";
    if (!md.correctAnswers?.some((a) => a?.trim())) errors.answers = "At least one answer is required";
  } else if (qType === "NOTE_COMPLETION") {
    if (!md.noteContext?.trim()) errors.noteContext = "Note context is required";
    if (!md.correctAnswers?.some((a) => a?.trim())) errors.answers = "At least one answer is required";
  } else if (qType === "TABLE_COMPLETION") {
    if (!md.correctAnswers?.some((a) => a?.trim())) errors.answers = "At least one answer is required";
  } else if (qType === "FLOW_CHART_COMPLETION") {
    if (!md.stepLabel?.trim()) errors.stepLabel = "Step label is required";
    if (!md.correctAnswers?.some((a) => a?.trim())) errors.answers = "At least one answer is required";
  } else if (qType === "MATCHING_HEADING") {
    if (!md.paragraphRef?.trim()) errors.paragraph = "Paragraph reference required";
    if (!md.headings?.length || md.headings.some((h) => !h.text?.trim())) {
      errors.headings = "All headings need text";
    }
    if (md.correctHeadingIndex == null || md.correctHeadingIndex < 0) {
      errors.correct = "Pick the correct heading";
    }
  } else if (qType === "MATCHING_INFORMATION") {
    if (!md.statement?.trim()) errors.statement = "Statement is required";
    if (!md.paragraphLabels?.length) errors.labels = "At least one paragraph label required";
    if (!md.correctParagraph) errors.correct = "Pick the correct paragraph";
  } else if (qType === "MATCHING_FEATURES") {
    if (!md.statement?.trim()) errors.statement = "Statement is required";
    if (!md.features?.length || md.features.some((f) => !f.text?.trim())) {
      errors.features = "All features need text";
    }
    if (!md.correctFeatureLabel) errors.correct = "Pick the correct feature";
  } else if (qType === "MATCHING_SENTENCE_ENDINGS") {
    if (!md.sentenceStem?.trim()) errors.stem = "Sentence stem is required";
    if (!md.endings?.length || md.endings.some((e) => !e.text?.trim())) {
      errors.endings = "All endings need text";
    }
    if (!md.correctEndingLabel) errors.correct = "Pick the correct ending";
  } else if (qType === "DIAGRAM_LABELING") {
    if (!md.imageUrl) errors.image = "Image is required";
    if (!md.pointLabel?.trim()) errors.pointLabel = "Point label is required";
    if (!md.correctAnswers?.some((a) => a?.trim())) {
      errors.answers = "At least one answer is required";
    }
  } else if (qType === "OTHER") {
    if (!md.correctAnswers?.some((a) => a?.trim())) {
      errors.answers = "At least one reference answer is required";
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
};

export { subTypesByFamily, TEMPLATES, resolveSubType, validateMetadata };
