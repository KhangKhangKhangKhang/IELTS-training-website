// Centralized metadata for all 14 question sub-types:
// - default metadata (template) when creating a new question
// - sub-type groups (which qType picks which sub-type)
// - validation rules (which fields are required)

// Family key matches the canvas `typeMeta` key (FILL_BLANK, MATCHING) so
// `subTypesByFamily[family]` resolves directly in both AddGroupModal and
// QuestionQuickForm without any remapping.
const subTypesByFamily = {
  FILL_BLANK: [
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

const QUESTION_FAMILY_LABELS = {
  FILL_BLANK: "Fill in blanks",
  MATCHING: "Matching",
};

const QUESTION_SUBTYPE_LABELS = {
  SENTENCE_COMPLETION: "Sentence",
  SUMMARY_COMPLETION: "Summary",
  NOTE_COMPLETION: "Note",
  TABLE_COMPLETION: "Table",
  FLOW_CHART_COMPLETION: "Flow Chart",
  MATCHING_HEADING: "Headings",
  MATCHING_INFORMATION: "Information",
  MATCHING_FEATURES: "Features",
  MATCHING_SENTENCE_ENDINGS: "Sentence Endings",
};

const QUESTION_TYPE_LABELS = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE_NOT_GIVEN: "True / False / Not Given",
  YES_NO_NOT_GIVEN: "Yes / No / Not Given",
  SHORT_ANSWER: "Short answer",
  DIAGRAM_LABELING: "Diagram labelling",
  OTHER: "Other",
  ...Object.fromEntries(
    Object.entries(QUESTION_SUBTYPE_LABELS).map(([key, label]) => {
      const family = [
        "SENTENCE_COMPLETION",
        "SUMMARY_COMPLETION",
        "NOTE_COMPLETION",
        "TABLE_COMPLETION",
        "FLOW_CHART_COMPLETION",
      ].includes(key)
        ? QUESTION_FAMILY_LABELS.FILL_BLANK
        : QUESTION_FAMILY_LABELS.MATCHING;
      return [key, `${family} — ${label}`];
    })
  ),
};

const getQuestionTypeDisplay = (type, contextSkill = null) => {
  if (QUESTION_SUBTYPE_LABELS[type]) {
    const isFill = [
      "SENTENCE_COMPLETION",
      "SUMMARY_COMPLETION",
      "NOTE_COMPLETION",
      "TABLE_COMPLETION",
      "FLOW_CHART_COMPLETION",
    ].includes(type);
    const family = isFill ? QUESTION_FAMILY_LABELS.FILL_BLANK : QUESTION_FAMILY_LABELS.MATCHING;
    // In IELTS Listening, "NOTE_COMPLETION" is colloquially the "Form" sub-type
    // (Part 1 is dominated by form-filling: name, phone, address). When the
    // teacher is editing a Listening test, surface "Form" so the badge matches
    // Cambridge conventions.
    const subtype =
      type === "NOTE_COMPLETION" && contextSkill === "LISTENING"
        ? "Form"
        : QUESTION_SUBTYPE_LABELS[type];
    return { family, subtype, full: `${family} — ${subtype}` };
  }
  const full = QUESTION_TYPE_LABELS[type] || type;
  return { family: full, subtype: "", full };
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
    kind: "diagram", // 'diagram' | 'map' | 'plan' (IELTS: map = area map, plan = building layout)
    imageUrl: "",
    // Multi-label: a single image can carry N labels (IELTS Part 2 maps/plans
    // typically have 5-8 fillable points).
    labels: [
      { label: "1", x: 50, y: 50, correctAnswers: [""] },
    ],
    hasWordBank: false,
    wordBank: [],
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
// Single-label lookup (with skill-aware override for NOTE_COMPLETION → "Form"
// in Listening). Use this in places that only need the short label, not the
// full family+subtype display.
const getSubtypeLabel = (key, contextSkill = null) => {
  if (key === "NOTE_COMPLETION" && contextSkill === "LISTENING") return "Form";
  return QUESTION_SUBTYPE_LABELS[key] || null;
};

const resolveSubType = (qType, existing) => {
  if (subTypesByFamily[qType]) {
    if (existing?.questionType && qType === "FILL_BLANK" &&
        subTypesByFamily.FILL_BLANK.find((s) => s.key === existing.questionType)) {
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
    // Paragraph letter (A/B/C...) is derived from the question's position
    // (questionIndex) by MatchingForm, not stored on the metadata — so no
    // paragraphRef field to validate here.
    if (!md.headings?.length) {
      errors.headings = "At least one heading is required";
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
    if (!md.features?.length) {
      errors.features = "At least one feature is required";
    }
    if (!md.correctFeatureLabel) errors.correct = "Pick the correct feature";
  } else if (qType === "MATCHING_SENTENCE_ENDINGS") {
    if (!md.sentenceStem?.trim()) errors.stem = "Sentence stem is required";
    if (!md.endings?.length) {
      errors.endings = "At least one ending is required";
    }
    if (!md.correctEndingLabel) errors.correct = "Pick the correct ending";
  } else if (qType === "DIAGRAM_LABELING") {
    if (!md.imageUrl) errors.image = "Image is required";
    if (!Array.isArray(md.labels) || md.labels.length === 0) {
      errors.labels = "Add at least one label on the image";
    } else {
      md.labels.forEach((l, i) => {
        if (!l?.label?.trim()) errors[`label_${i}_text`] = `Label #${i + 1} needs a name (e.g. "1", "A")`;
        if (!Array.isArray(l?.correctAnswers) || !l.correctAnswers.some((a) => a?.trim())) {
          errors[`label_${i}_answer`] = `Label #${i + 1} needs at least one correct answer`;
        }
      });
    }
  } else if (qType === "OTHER") {
    if (!md.correctAnswers?.some((a) => a?.trim())) {
      errors.answers = "At least one reference answer is required";
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
};

export {
  subTypesByFamily,
  QUESTION_TYPE_LABELS,
  QUESTION_FAMILY_LABELS,
  QUESTION_SUBTYPE_LABELS,
  getQuestionTypeDisplay,
  getSubtypeLabel,
  TEMPLATES,
  resolveSubType,
  validateMetadata,
};
