const QUESTION_TYPE_ALIASES = {
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

const stripHtml = (text = "") =>
  String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isCorrectAnswer = (answer = {}) => {
  const value = String(answer.matching_value || "").toUpperCase();
  return value === "CORRECT" || value === "TRUE" || value === "YES";
};

const getCorrectAnswersText = (answers = []) => {
  const correctText = answers
    .filter(isCorrectAnswer)
    .map((answer) => String(answer.answer_text || "").trim())
    .filter(Boolean);

  if (correctText.length > 0) {
    return correctText;
  }

  const fallbackText = answers
    .map((answer) => String(answer.answer_text || "").trim())
    .filter(Boolean);

  return fallbackText.length > 0 ? [fallbackText[0]] : [];
};

const getAnswerOptions = (answers = []) =>
  answers
    .filter((answer) => String(answer.matching_key || "").trim())
    .map((answer) => ({
      label: String(answer.matching_key).trim(),
      text: String(answer.answer_text || "").trim(),
    }));

const inferFillBlankSubtype = (question, answers) => {
  const content = String(question.content || "").trim();
  const hasWordBankKeys = answers.some((answer) => answer.matching_key);

  if (content.startsWith("<table")) {
    return "TABLE_COMPLETION";
  }

  if (hasWordBankKeys || content.length > 140) {
    return "SUMMARY_COMPLETION";
  }

  return "SENTENCE_COMPLETION";
};

const inferCanonicalType = (question, groupType) => {
  const explicitType = question.questionType || question.typeQuestion;
  const baseType = explicitType || groupType || "SHORT_ANSWER";
  const aliasType = QUESTION_TYPE_ALIASES[baseType] || "SHORT_ANSWER";

  if (aliasType === "SENTENCE_COMPLETION") {
    return inferFillBlankSubtype(question, question.answers || []);
  }

  return aliasType;
};

const ensureNonEmpty = (value, message) => {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    throw new Error(message);
  }
};

const buildMetadata = (questionType, question) => {
  const answers = Array.isArray(question.answers) ? question.answers : [];
  const options = getAnswerOptions(answers);
  const statement = stripHtml(question.content || "");
  const correctAnswers = getCorrectAnswersText(answers);
  const firstCorrect = answers.find(isCorrectAnswer);

  switch (questionType) {
    case "MULTIPLE_CHOICE": {
      const correctOptionIndexes = options
        .map((_, index) => index)
        .filter((index) => isCorrectAnswer(answers[index] || {}));

      ensureNonEmpty(options, "MCQ requires at least 2 options.");
      if (options.length < 2) {
        throw new Error("MCQ requires at least 2 options.");
      }
      ensureNonEmpty(correctOptionIndexes, "MCQ requires at least 1 correct option.");

      return {
        type: questionType,
        options,
        correctOptionIndexes,
        isMultiSelect: correctOptionIndexes.length > 1,
      };
    }

    case "TRUE_FALSE_NOT_GIVEN": {
      const correctAnswer = String(firstCorrect?.answer_text || "").toUpperCase();
      ensureNonEmpty(statement, "TFNG requires a statement.");
      if (!["TRUE", "FALSE", "NOT_GIVEN"].includes(correctAnswer)) {
        throw new Error("TFNG correct answer must be TRUE, FALSE, or NOT_GIVEN.");
      }

      return {
        type: questionType,
        statement,
        correctAnswer,
      };
    }

    case "YES_NO_NOT_GIVEN": {
      const correctAnswer = String(firstCorrect?.answer_text || "").toUpperCase();
      ensureNonEmpty(statement, "YES/NO/NOT GIVEN requires a statement.");
      if (!["YES", "NO", "NOT_GIVEN"].includes(correctAnswer)) {
        throw new Error("YES/NO/NOT GIVEN correct answer must be YES, NO, or NOT_GIVEN.");
      }

      return {
        type: questionType,
        statement,
        correctAnswer,
      };
    }

    case "MATCHING_HEADING": {
      ensureNonEmpty(options, "Matching Heading requires heading options.");
      const correctKey = String(firstCorrect?.matching_key || "").trim();
      const correctHeadingIndex = options.findIndex((option) => option.label === correctKey);
      if (correctHeadingIndex < 0) {
        throw new Error("Matching Heading requires one correct heading key.");
      }

      return {
        type: questionType,
        headings: options,
        paragraphRef: statement || `Q${question.questionNumber || question.numberQuestion || ""}`,
        correctHeadingIndex,
      };
    }

    case "MATCHING_FEATURES": {
      ensureNonEmpty(options, "Matching Features requires options.");
      const correctFeatureLabel = String(firstCorrect?.matching_key || "").trim();
      ensureNonEmpty(correctFeatureLabel, "Matching Features requires one correct key.");

      return {
        type: questionType,
        statement,
        features: options,
        correctFeatureLabel,
      };
    }

    case "MATCHING_SENTENCE_ENDINGS": {
      ensureNonEmpty(options, "Matching Sentence Endings requires options.");
      const correctEndingLabel = String(firstCorrect?.matching_key || "").trim();
      ensureNonEmpty(correctEndingLabel, "Matching Sentence Endings requires one correct key.");

      return {
        type: questionType,
        sentenceStem: statement,
        endings: options,
        correctEndingLabel,
      };
    }

    case "MATCHING_INFORMATION": {
      const paragraphLabels = options.map((option) => option.label);
      const correctParagraph = String(firstCorrect?.matching_key || "").trim();

      ensureNonEmpty(paragraphLabels, "Matching Information requires paragraph labels.");
      ensureNonEmpty(correctParagraph, "Matching Information requires one correct paragraph key.");

      return {
        type: questionType,
        statement,
        paragraphLabels,
        correctParagraph,
      };
    }

    case "TABLE_COMPLETION": {
      ensureNonEmpty(correctAnswers, "Table Completion requires at least one answer.");
      return {
        type: questionType,
        rowIndex: 0,
        columnIndex: 0,
        maxWords: 2,
        correctAnswers,
      };
    }

    case "SUMMARY_COMPLETION": {
      const wordBank = options.map((option) => ({ id: option.label, text: option.text }));
      ensureNonEmpty(correctAnswers, "Summary Completion requires at least one answer.");
      return {
        type: questionType,
        blankLabel: String(question.questionNumber || question.numberQuestion || "1"),
        maxWords: 2,
        hasWordBank: wordBank.length > 0,
        ...(wordBank.length > 0 ? { wordBank } : {}),
        correctAnswers,
        fullParagraph: String(question.content || ""),
      };
    }

    case "NOTE_COMPLETION": {
      ensureNonEmpty(correctAnswers, "Note Completion requires at least one answer.");
      return {
        type: questionType,
        noteContext: statement || "Notes",
        maxWords: 2,
        correctAnswers,
        fullNoteText: String(question.content || ""),
      };
    }

    case "FLOW_CHART_COMPLETION": {
      const wordBank = options.map((option) => ({ id: option.label, text: option.text }));
      ensureNonEmpty(correctAnswers, "Flow Chart Completion requires at least one answer.");
      return {
        type: questionType,
        stepLabel: `Step ${question.questionNumber || question.numberQuestion || "1"}`,
        maxWords: 2,
        hasWordBank: wordBank.length > 0,
        ...(wordBank.length > 0 ? { wordBank } : {}),
        correctAnswers,
        fullFlowText: String(question.content || ""),
      };
    }

    case "SENTENCE_COMPLETION": {
      ensureNonEmpty(correctAnswers, "Sentence Completion requires at least one answer.");
      return {
        type: questionType,
        sentenceWithBlank: String(question.content || ""),
        maxWords: 2,
        correctAnswers,
      };
    }

    case "DIAGRAM_LABELING": {
      const wordBank = options.map((option) => ({ id: option.label, text: option.text }));
      ensureNonEmpty(correctAnswers, "Diagram Labeling requires at least one answer.");

      const imageUrlCandidate =
        question.imageUrl ||
        question.img ||
        (String(question.content || "").startsWith("http") ? question.content : null);

      const imageUrl = imageUrlCandidate || "https://example.com/diagram-labeling-placeholder.png";

      return {
        type: questionType,
        imageUrl,
        labelCoordinate: {
          x: Number(question?.labelCoordinate?.x ?? 50),
          y: Number(question?.labelCoordinate?.y ?? 50),
        },
        pointLabel:
          String(firstCorrect?.matching_key || "").trim() ||
          String(question.questionNumber || question.numberQuestion || "A"),
        hasWordBank: wordBank.length > 0,
        ...(wordBank.length > 0 ? { wordBank } : {}),
        correctAnswers,
      };
    }

    case "SHORT_ANSWER":
    default: {
      ensureNonEmpty(correctAnswers, "Short Answer requires at least one answer.");
      return {
        type: "SHORT_ANSWER",
        maxWords: 3,
        correctAnswers,
      };
    }
  }
};

const mapQuestionFields = (question, questionType, metadata) => {
  const idQuestionGroup = question.idQuestionGroup || question.idGroupOfQuestions;
  const questionNumber =
    Number(question.questionNumber ?? question.numberQuestion ?? 0) || undefined;

  return {
    ...(question.idQuestion ? { idQuestion: question.idQuestion } : {}),
    ...(idQuestionGroup ? { idQuestionGroup } : {}),
    ...(question.idPart ? { idPart: question.idPart } : {}),
    ...(questionNumber ? { questionNumber } : {}),
    ...(question.order != null ? { order: question.order } : {}),
    content: String(question.content || ""),
    questionType,
    metadata,
  };
};

const getGroupTypeFromApi = async (apiClient, idGroup, cache) => {
  if (!idGroup) {
    return null;
  }

  if (cache.has(idGroup)) {
    return cache.get(idGroup);
  }

  try {
    const response = await apiClient.get(`/group-of-questions/get-by-id/${idGroup}`);
    const typeQuestion =
      response?.data?.data?.[0]?.typeQuestion ||
      response?.data?.data?.typeQuestion ||
      response?.data?.[0]?.typeQuestion ||
      response?.data?.typeQuestion ||
      null;

    cache.set(idGroup, typeQuestion);
    return typeQuestion;
  } catch (error) {
    cache.set(idGroup, null);
    return null;
  }
};

export const adaptQuestionsToMetadataPayload = async (apiClient, payload = {}) => {
  const rawQuestions = Array.isArray(payload?.questions) ? payload.questions : [];
  const cache = new Map();

  const mappedQuestions = await Promise.all(
    rawQuestions.map(async (question, index) => {
      const idGroup = question.idQuestionGroup || question.idGroupOfQuestions;
      const groupType = await getGroupTypeFromApi(apiClient, idGroup, cache);
      const questionType = inferCanonicalType(question, groupType);
      const metadata = buildMetadata(questionType, question);
      const mapped = mapQuestionFields(question, questionType, metadata);

      if (!mapped.idQuestionGroup) {
        throw new Error(`Question ${index + 1}: missing idQuestionGroup.`);
      }
      if (!mapped.idPart) {
        throw new Error(`Question ${index + 1}: missing idPart.`);
      }
      if (!mapped.questionNumber) {
        throw new Error(`Question ${index + 1}: missing questionNumber.`);
      }
      if (!mapped.content?.trim()) {
        throw new Error(`Question ${index + 1}: missing content.`);
      }

      return mapped;
    })
  );

  return {
    ...payload,
    questions: mappedQuestions,
  };
};

export const adaptSingleQuestionToMetadataPayload = async (apiClient, question = {}) => {
  const idGroup = question.idQuestionGroup || question.idGroupOfQuestions;
  const groupType = await getGroupTypeFromApi(apiClient, idGroup, new Map());
  const questionType = inferCanonicalType(question, groupType);
  const metadata = buildMetadata(questionType, question);

  return mapQuestionFields(question, questionType, metadata);
};
