import { mapBackendTypeToRendererType } from "@/lib/questionTypeMapper";

export const LEGACY_TO_BACKEND_QUESTION_TYPE = {
  MCQ: "MULTIPLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TFNG: "TRUE_FALSE_NOT_GIVEN",
  TRUE_FALSE_NOT_GIVEN: "TRUE_FALSE_NOT_GIVEN",
  YES_NO_NOTGIVEN: "YES_NO_NOT_GIVEN",
  YES_NO_NOT_GIVEN: "YES_NO_NOT_GIVEN",
  MATCHING: "MATCHING_INFORMATION",
  MATCHING_HEADING: "MATCHING_HEADING",
  MATCHING_INFORMATION: "MATCHING_INFORMATION",
  MATCHING_FEATURES: "MATCHING_FEATURES",
  MATCHING_SENTENCE_ENDINGS: "MATCHING_SENTENCE_ENDINGS",
  FILL_BLANK: "SENTENCE_COMPLETION",
  SENTENCE_COMPLETION: "SENTENCE_COMPLETION",
  SUMMARY_COMPLETION: "SUMMARY_COMPLETION",
  NOTE_COMPLETION: "NOTE_COMPLETION",
  TABLE_COMPLETION: "TABLE_COMPLETION",
  FLOW_CHART_COMPLETION: "FLOW_CHART_COMPLETION",
  LABELING: "DIAGRAM_LABELING",
  DIAGRAM_LABELING: "DIAGRAM_LABELING",
  SHORT_ANSWER: "SHORT_ANSWER",
  OTHER: "SHORT_ANSWER",
};

export const normalizeQuestionTypeForBackend = (rawType) => {
  if (!rawType) {
    return "SHORT_ANSWER";
  }

  const normalized = String(rawType).trim().toUpperCase();
  return LEGACY_TO_BACKEND_QUESTION_TYPE[normalized] || normalized;
};

const stripHtml = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const QUANTITY_MARKER_REGEX = /\[\[qty:(\d+)\]\]/i;

const splitInstructionsAndQuantity = (rawInstructions = "") => {
  const text = String(rawInstructions || "");
  const markerMatch = text.match(QUANTITY_MARKER_REGEX);
  const quantity = markerMatch ? Number(markerMatch[1]) : null;
  const cleanedText = text.replace(QUANTITY_MARKER_REGEX, "").trim();

  return {
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : null,
    text: cleanedText,
  };
};

const withQuantityMarker = (rawInstructions = "", quantity) => {
  const cleanedInstructions = String(rawInstructions || "")
    .replace(QUANTITY_MARKER_REGEX, "")
    .trim();
  const numericQuantity = Number(quantity);

  if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
    return cleanedInstructions;
  }

  if (!cleanedInstructions) {
    return `[[qty:${Math.floor(numericQuantity)}]]`;
  }

  return `${cleanedInstructions}\n[[qty:${Math.floor(numericQuantity)}]]`;
};

const inferQuantityFromTitle = (title = "") => {
  const text = stripHtml(title);
  const rangeMatch = text.match(/(\d+)\s*-\s*(\d+)/);
  if (!rangeMatch) {
    return null;
  }

  const start = Number(rangeMatch[1]);
  const end = Number(rangeMatch[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return end - start + 1;
};

export const mapQuestionToLegacyShape = (question = {}) => {
  const rawNumber = question.numberQuestion ?? question.questionNumber;
  const numericNumber = Number(rawNumber);
  const normalizedNumber = Number.isFinite(numericNumber)
    ? numericNumber
    : rawNumber;

  return {
    ...question,
    idGroupOfQuestions:
      question.idGroupOfQuestions ?? question.idQuestionGroup ?? null,
    idQuestionGroup:
      question.idQuestionGroup ?? question.idGroupOfQuestions ?? null,
    numberQuestion: normalizedNumber,
    questionNumber: normalizedNumber,
    answers: Array.isArray(question.answers) ? question.answers : [],
  };
};

export const mapGroupToLegacyShape = (group = {}) => {
  const instructionState = splitInstructionsAndQuantity(
    group.instruction ?? group.instructions ?? ""
  );
  const canonicalType = normalizeQuestionTypeForBackend(
    group.questionType || group.typeQuestion
  );
  const rendererType = mapBackendTypeToRendererType(canonicalType);

  const rawQuestions = Array.isArray(group.question)
    ? group.question
    : Array.isArray(group.questions)
      ? group.questions
      : [];
  const questions = rawQuestions.map(mapQuestionToLegacyShape);

  const fromCount = Number(group?._count?.questions);
  const fromTitle = inferQuantityFromTitle(group.title || "");
  const fromInstruction = instructionState.quantity;
  const quantityCandidate =
    group.quantity ??
    fromInstruction ??
    (Number.isFinite(fromCount) ? fromCount : null) ??
    (questions.length > 0 ? questions.length : null) ??
    fromTitle ??
    1;
  const quantity = Number(quantityCandidate);

  return {
    ...group,
    idGroupOfQuestions: group.idGroupOfQuestions ?? group.idQuestionGroup,
    idQuestionGroup: group.idQuestionGroup ?? group.idGroupOfQuestions,
    typeQuestion: rendererType,
    questionType: canonicalType,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    img: group.img ?? group.imageUrl ?? null,
    imageUrl: group.imageUrl ?? group.img ?? null,
    instruction: instructionState.text,
    instructions: instructionState.text,
    question: questions,
    questions,
  };
};

export const mapPartToLegacyShape = (part = {}) => {
  const rawGroups = Array.isArray(part.groupOfQuestions)
    ? part.groupOfQuestions
    : Array.isArray(part.questionGroups)
      ? part.questionGroups
      : [];
  const mappedGroups = rawGroups.map(mapGroupToLegacyShape);

  return {
    ...part,
    groupOfQuestions: mappedGroups,
    questionGroups: mappedGroups,
  };
};

export const mapTestToLegacyShape = (test = {}) => ({
  ...test,
  parts: Array.isArray(test?.parts) ? test.parts.map(mapPartToLegacyShape) : [],
});

const appendIfPresent = (formData, key, value) => {
  if (value !== undefined && value !== null && value !== "") {
    formData.append(key, value);
  }
};

export const buildQuestionGroupFormData = (data = {}) => {
  const formData = new FormData();
  const rawQuestionType = data.questionType || data.typeQuestion;
  const mergedInstructions = withQuantityMarker(
    data.instructions ?? data.instruction,
    data.quantity
  );

  appendIfPresent(formData, "idPart", data.idPart);
  appendIfPresent(formData, "title", data.title);
  appendIfPresent(formData, "instructions", mergedInstructions);
  if (rawQuestionType) {
    appendIfPresent(
      formData,
      "questionType",
      normalizeQuestionTypeForBackend(rawQuestionType)
    );
  }
  appendIfPresent(formData, "order", data.order);

  const image = data.imageUrl ?? data.img;
  if (image !== undefined && image !== null) {
    formData.append("imageUrl", image);
  }

  return formData;
};

const toUpperToken = (value = "") =>
  String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const toDisplayToken = (value = "") => String(value).replace(/_/g, " ");

const toWordBankLegacyAnswers = (wordBank = [], correctAnswers = [], base = {}) => {
  const normalizedCorrect = new Set(
    correctAnswers.map((item) => String(item).trim().toLowerCase())
  );

  return wordBank.map((entry, index) => {
    const matchingKey = String(
      entry?.id ?? entry?.label ?? String.fromCharCode(65 + index)
    );
    const answerText = String(entry?.text ?? "");
    const isCorrect =
      normalizedCorrect.has(answerText.trim().toLowerCase()) ||
      normalizedCorrect.has(matchingKey.trim().toLowerCase());

    return {
      ...base,
      answer_text: answerText,
      matching_key: matchingKey,
      matching_value: isCorrect ? "CORRECT" : null,
    };
  });
};

export const buildLegacyAnswersFromQuestion = (question = {}) => {
  const metadata = question?.metadata || {};
  const questionType = normalizeQuestionTypeForBackend(
    question?.questionType || metadata?.type
  );
  const base = { idQuestion: question?.idQuestion ?? null };

  if (questionType === "MULTIPLE_CHOICE") {
    const options = Array.isArray(metadata.options) ? metadata.options : [];
    const correctIndexes = new Set(
      Array.isArray(metadata.correctOptionIndexes)
        ? metadata.correctOptionIndexes
        : []
    );

    return options.map((option, index) => ({
      ...base,
      answer_text: String(option?.text ?? ""),
      matching_key: String(option?.label ?? String.fromCharCode(65 + index)),
      matching_value: correctIndexes.has(index) ? "CORRECT" : "INCORRECT",
    }));
  }

  if (
    questionType === "TRUE_FALSE_NOT_GIVEN" ||
    questionType === "YES_NO_NOT_GIVEN"
  ) {
    const correctAnswer = toUpperToken(metadata.correctAnswer || "");
    if (!correctAnswer) {
      return [];
    }

    return [
      {
        ...base,
        answer_text: toDisplayToken(correctAnswer),
        matching_key: null,
        matching_value: "CORRECT",
      },
    ];
  }

  if (questionType === "MATCHING_HEADING") {
    const headings = Array.isArray(metadata.headings) ? metadata.headings : [];
    const correctHeadingIndex = Number(metadata.correctHeadingIndex);

    return headings.map((heading, index) => ({
      ...base,
      answer_text: String(heading?.text ?? heading?.label ?? ""),
      matching_key: String(heading?.label ?? String.fromCharCode(65 + index)),
      matching_value: index === correctHeadingIndex ? "CORRECT" : null,
    }));
  }

  if (questionType === "MATCHING_INFORMATION") {
    const labels = Array.isArray(metadata.paragraphLabels)
      ? metadata.paragraphLabels
      : [];
    const correctParagraph = String(metadata.correctParagraph ?? "")
      .trim()
      .toUpperCase();

    return labels.map((label) => {
      const normalizedLabel = String(label).trim().toUpperCase();
      return {
        ...base,
        answer_text: String(label ?? ""),
        matching_key: String(label ?? ""),
        matching_value:
          normalizedLabel && normalizedLabel === correctParagraph
            ? "CORRECT"
            : null,
      };
    });
  }

  if (questionType === "MATCHING_FEATURES") {
    const features = Array.isArray(metadata.features) ? metadata.features : [];
    const correctFeatureLabel = String(metadata.correctFeatureLabel ?? "")
      .trim()
      .toUpperCase();

    return features.map((feature, index) => {
      const matchingKey = String(
        feature?.label ?? String.fromCharCode(65 + index)
      );
      const normalizedKey = matchingKey.trim().toUpperCase();

      return {
        ...base,
        answer_text: String(feature?.text ?? ""),
        matching_key: matchingKey,
        matching_value:
          normalizedKey && normalizedKey === correctFeatureLabel
            ? "CORRECT"
            : null,
      };
    });
  }

  if (questionType === "MATCHING_SENTENCE_ENDINGS") {
    const endings = Array.isArray(metadata.endings) ? metadata.endings : [];
    const correctEndingLabel = String(metadata.correctEndingLabel ?? "")
      .trim()
      .toUpperCase();

    return endings.map((ending, index) => {
      const matchingKey = String(
        ending?.label ?? String.fromCharCode(65 + index)
      );
      const normalizedKey = matchingKey.trim().toUpperCase();

      return {
        ...base,
        answer_text: String(ending?.text ?? ""),
        matching_key: matchingKey,
        matching_value:
          normalizedKey && normalizedKey === correctEndingLabel
            ? "CORRECT"
            : null,
      };
    });
  }

  if (
    questionType === "SUMMARY_COMPLETION" ||
    questionType === "FLOW_CHART_COMPLETION" ||
    questionType === "DIAGRAM_LABELING"
  ) {
    const wordBank = Array.isArray(metadata.wordBank) ? metadata.wordBank : [];
    const correctAnswers = Array.isArray(metadata.correctAnswers)
      ? metadata.correctAnswers
      : [];

    if (wordBank.length > 0) {
      return toWordBankLegacyAnswers(wordBank, correctAnswers, base);
    }

    if (correctAnswers.length === 0) {
      return [];
    }

    return [
      {
        ...base,
        answer_text: String(correctAnswers[0]),
        matching_key: null,
        matching_value: null,
      },
    ];
  }

  const correctAnswers = Array.isArray(metadata.correctAnswers)
    ? metadata.correctAnswers
    : [];
  if (correctAnswers.length === 0) {
    return [];
  }

  return [
    {
      ...base,
      answer_text: String(correctAnswers[0]),
      matching_key: null,
      matching_value: null,
    },
  ];
};

export const getLegacyAnswersByQuestionId = async (apiClient, idQuestion) => {
  const questionRes = await apiClient.get(`/question/find-by-id/${idQuestion}`);
  const question = questionRes?.data?.data || null;
  const answers = buildLegacyAnswersFromQuestion(question);

  return {
    statusCode: 200,
    message: "Answers retrieved successfully",
    data: answers,
  };
};

export const upsertQuestionsIndividually = async (apiClient, questions = []) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return {
      statusCode: 200,
      message: "No questions to update",
      data: [],
    };
  }

  const requests = questions.map((question) => {
    if (question.idQuestion) {
      const { idQuestion, ...rest } = question;
      return apiClient.patch(`/question/update-question/${idQuestion}`, rest);
    }

    return apiClient.post(`/question/create-question`, question);
  });

  const responses = await Promise.all(requests);

  return {
    statusCode: 200,
    message: "Questions updated successfully",
    data: responses.map((response) => response?.data?.data ?? response?.data),
  };
};
