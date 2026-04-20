const LEGACY_GROUP_TO_BACKEND_TYPE = {
  MCQ: "MULTIPLE_CHOICE",
  TFNG: "TRUE_FALSE_NOT_GIVEN",
  YES_NO_NOTGIVEN: "YES_NO_NOT_GIVEN",
  MATCHING: "MATCHING_FEATURES",
  FILL_BLANK: "SENTENCE_COMPLETION",
  LABELING: "DIAGRAM_LABELING",
  SHORT_ANSWER: "SHORT_ANSWER",
  OTHER: "SHORT_ANSWER",
};

const BACKEND_TO_LEGACY_GROUP_TYPE = {
  MULTIPLE_CHOICE: "MCQ",
  TRUE_FALSE_NOT_GIVEN: "TFNG",
  YES_NO_NOT_GIVEN: "YES_NO_NOTGIVEN",
  MATCHING_HEADING: "MATCHING",
  MATCHING_INFORMATION: "MATCHING",
  MATCHING_FEATURES: "MATCHING",
  MATCHING_SENTENCE_ENDINGS: "MATCHING",
  SENTENCE_COMPLETION: "FILL_BLANK",
  SUMMARY_COMPLETION: "FILL_BLANK",
  NOTE_COMPLETION: "FILL_BLANK",
  TABLE_COMPLETION: "FILL_BLANK",
  FLOW_CHART_COMPLETION: "FILL_BLANK",
  DIAGRAM_LABELING: "LABELING",
  SHORT_ANSWER: "SHORT_ANSWER",
};

const NOT_GIVEN_VARIANTS = ["NOT GIVEN", "NOT_GIVEN", "NOTGIVEN"];
const EMPTY_IMAGE_FALLBACK = "https://example.com/placeholder-diagram.png";
const QTY_MARKER_REGEX = /\[\[QTY:(\d+)\]\]/i;

const toArray = (value) => (Array.isArray(value) ? value : []);

const toStringSafe = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const stripHtml = (html) =>
  toStringSafe(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeNotGiven = (value) => {
  const raw = toStringSafe(value).trim().toUpperCase();
  if (NOT_GIVEN_VARIANTS.includes(raw)) return "NOT_GIVEN";
  return raw;
};

const denormalizeNotGiven = (value) => {
  if (normalizeNotGiven(value) === "NOT_GIVEN") return "NOT GIVEN";
  return toStringSafe(value).trim().toUpperCase();
};

const keyToIndex = (matchingKey) => {
  if (matchingKey === null || matchingKey === undefined) return -1;
  const raw = toStringSafe(matchingKey).trim();
  if (!raw) return -1;
  if (/^\d+$/.test(raw)) return Number(raw);
  const upper = raw.toUpperCase();
  const code = upper.charCodeAt(0);
  if (code >= 65 && code <= 90) return code - 65;
  return -1;
};

const indexToKey = (index) => {
  if (typeof index !== "number" || Number.isNaN(index) || index < 0) {
    return null;
  }
  return String.fromCharCode(65 + index);
};

const uniqueBy = (items, keyGetter) => {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const key = keyGetter(item);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
};

const parseQuantityFromTitle = (title) => {
  const text = toStringSafe(title);
  const match = text.match(/questions?\s*(\d+)\s*[-–]\s*(\d+)/i);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return end - start + 1;
};

export const mapLegacyGroupTypeToBackendQuestionType = (legacyType) => {
  return LEGACY_GROUP_TO_BACKEND_TYPE[toStringSafe(legacyType).trim()] || "SHORT_ANSWER";
};

export const mapBackendQuestionTypeToLegacyGroupType = (backendType) => {
  return BACKEND_TO_LEGACY_GROUP_TYPE[toStringSafe(backendType).trim()] || "OTHER";
};

export const encodeInstructionsWithQuantity = (instructions, quantity) => {
  const cleaned = toStringSafe(instructions).replace(QTY_MARKER_REGEX, "").trim();
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return cleaned;
  if (!cleaned) return `[[QTY:${qty}]]`;
  return `${cleaned}\n[[QTY:${qty}]]`;
};

export const decodeInstructionsAndQuantity = (instructions, fallbackQuantity) => {
  const raw = toStringSafe(instructions);
  const match = raw.match(QTY_MARKER_REGEX);
  const parsedQuantity = match ? Number(match[1]) : null;
  const cleanedInstructions = raw.replace(QTY_MARKER_REGEX, "").replace(/\n{3,}/g, "\n\n").trim();

  if (Number.isFinite(parsedQuantity) && parsedQuantity > 0) {
    return { instructions: cleanedInstructions, quantity: parsedQuantity };
  }

  const fallback = Number(fallbackQuantity);
  return {
    instructions: cleanedInstructions,
    quantity: Number.isFinite(fallback) && fallback > 0 ? fallback : null,
  };
};

const mapMetadataToLegacyAnswers = (metadata, backendQuestionType) => {
  const type = toStringSafe(metadata?.type || backendQuestionType).trim();

  if (type === "MULTIPLE_CHOICE") {
    const options = toArray(metadata?.options);
    const correct = new Set(toArray(metadata?.correctOptionIndexes));
    const answers = options.map((opt, index) => ({
      answer_id: `${toStringSafe(opt?.label || index)}-${index}`,
      answer_text: toStringSafe(opt?.text),
      matching_key: toStringSafe(opt?.label || indexToKey(index) || index),
      matching_value: correct.has(index) ? "CORRECT" : "INCORRECT",
    }));

    return {
      answers,
      correct_answers: answers.filter((ans) => ans.matching_value === "CORRECT"),
    };
  }

  if (type === "TRUE_FALSE_NOT_GIVEN") {
    const answerText = denormalizeNotGiven(metadata?.correctAnswer);
    const answer = {
      answer_id: "tfng",
      answer_text: answerText,
      matching_key: "TFNG",
      matching_value: answerText,
    };
    return { answers: [answer], correct_answers: [answer] };
  }

  if (type === "YES_NO_NOT_GIVEN") {
    const answerText = denormalizeNotGiven(metadata?.correctAnswer);
    const answer = {
      answer_id: "ynng",
      answer_text: answerText,
      matching_key: "YES_NO_NOT_GIVEN",
      matching_value: answerText,
    };
    return { answers: [answer], correct_answers: [answer] };
  }

  if (type.startsWith("MATCHING_")) {
    let options = [];
    let correctKey = null;

    if (type === "MATCHING_HEADING") {
      options = toArray(metadata?.headings).map((item, index) => ({
        key: toStringSafe(item?.label || indexToKey(index) || index),
        text: toStringSafe(item?.text),
      }));
      const idx = Number(metadata?.correctHeadingIndex);
      correctKey = Number.isFinite(idx) ? toStringSafe(options[idx]?.key) : null;
    } else if (type === "MATCHING_INFORMATION") {
      options = toArray(metadata?.paragraphLabels).map((label) => ({
        key: toStringSafe(label),
        text: toStringSafe(label),
      }));
      correctKey = toStringSafe(metadata?.correctParagraph);
    } else if (type === "MATCHING_FEATURES") {
      options = toArray(metadata?.features).map((item, index) => ({
        key: toStringSafe(item?.label || indexToKey(index) || index),
        text: toStringSafe(item?.text),
      }));
      correctKey = toStringSafe(metadata?.correctFeatureLabel);
    } else {
      options = toArray(metadata?.endings).map((item, index) => ({
        key: toStringSafe(item?.label || indexToKey(index) || index),
        text: toStringSafe(item?.text),
      }));
      correctKey = toStringSafe(metadata?.correctEndingLabel);
    }

    const answers = options.map((opt) => ({
      answer_id: `${opt.key}`,
      answer_text: opt.text,
      matching_key: opt.key,
      matching_value: opt.key === correctKey ? "CORRECT" : null,
    }));

    return {
      answers,
      correct_answers: answers.filter((ans) => ans.matching_value === "CORRECT"),
    };
  }

  if (type === "DIAGRAM_LABELING") {
    const wordBank = toArray(metadata?.wordBank);
    const correctSet = new Set(toArray(metadata?.correctAnswers).map((ans) => ans.toLowerCase().trim()));

    const answers = wordBank.map((item, index) => {
      const key = indexToKey(index) || toStringSafe(item?.id || index + 1);
      const text = toStringSafe(item?.text || item?.id);
      return {
        answer_id: `${key}`,
        answer_text: text,
        matching_key: key,
        matching_value: correctSet.has(text.toLowerCase().trim()) ? "CORRECT" : null,
      };
    });

    const fallbackText = toArray(metadata?.correctAnswers)[0];
    if (answers.length === 0 && fallbackText) {
      const answer = {
        answer_id: "diagram",
        answer_text: toStringSafe(fallbackText),
        matching_key: "A",
        matching_value: "CORRECT",
      };
      return { answers: [answer], correct_answers: [answer] };
    }

    return {
      answers,
      correct_answers: answers.filter((ans) => ans.matching_value === "CORRECT"),
    };
  }

  const correctAnswers = toArray(metadata?.correctAnswers)
    .map((item) => toStringSafe(item).trim())
    .filter(Boolean);

  const wordBank = toArray(metadata?.wordBank);
  if (wordBank.length > 0) {
    const lowerCorrect = new Set(correctAnswers.map((ans) => ans.toLowerCase()));
    const answers = wordBank.map((item, index) => {
      const key = indexToKey(index) || toStringSafe(item?.id || index + 1);
      const text = toStringSafe(item?.text || item?.id);
      return {
        answer_id: `${key}`,
        answer_text: text,
        matching_key: key,
        matching_value: lowerCorrect.has(text.toLowerCase()) ? "CORRECT" : null,
      };
    });

    return {
      answers,
      correct_answers: answers.filter((ans) => ans.matching_value === "CORRECT"),
    };
  }

  const fallbackText = correctAnswers[0] || "N/A";
  const singleAnswer = {
    answer_id: "text",
    answer_text: fallbackText,
    matching_key: null,
    matching_value: null,
  };

  return {
    answers: [singleAnswer],
    correct_answers: [singleAnswer],
  };
};

export const mapBackendQuestionToLegacyQuestion = (question, groupContext = {}) => {
  const backendQuestionType =
    question?.questionType || groupContext?.questionType || mapLegacyGroupTypeToBackendQuestionType(groupContext?.typeQuestion);

  const metadata = question?.metadata || {};
  const mapped = mapMetadataToLegacyAnswers(metadata, backendQuestionType);

  const questionText =
    question?.content ||
    metadata?.statement ||
    metadata?.sentenceWithBlank ||
    metadata?.fullParagraph ||
    metadata?.fullFlowText ||
    metadata?.fullNoteText ||
    "";

  return {
    ...question,
    idQuestion: question?.idQuestion,
    numberQuestion: question?.questionNumber || question?.numberQuestion,
    content: questionText,
    questionType: backendQuestionType,
    answers: mapped.answers,
    correct_answers: mapped.correct_answers,
  };
};

export const normalizeGroupForLegacy = (group) => {
  const groupId = group?.idGroupOfQuestions || group?.idQuestionGroup;
  const backendQuestionType =
    group?.questionType || mapLegacyGroupTypeToBackendQuestionType(group?.typeQuestion);

  const sourceQuestions = toArray(group?.question || group?.questions);
  const questions = sourceQuestions.map((question) =>
    mapBackendQuestionToLegacyQuestion(question, {
      questionType: backendQuestionType,
      typeQuestion: group?.typeQuestion,
    })
  );

  const decoded = decodeInstructionsAndQuantity(group?.instructions || group?.instruction, group?.quantity);
  const titleQuantity = parseQuantityFromTitle(group?.title);
  const quantity =
    decoded.quantity ||
    group?.quantity ||
    questions.length ||
    titleQuantity ||
    1;

  const legacyType = group?.typeQuestion || mapBackendQuestionTypeToLegacyGroupType(backendQuestionType);

  return {
    ...group,
    idGroupOfQuestions: groupId,
    idQuestionGroup: groupId,
    typeQuestion: legacyType,
    questionType: backendQuestionType,
    quantity,
    img: group?.img || group?.imageUrl || null,
    imageUrl: group?.imageUrl || group?.img || null,
    instruction: decoded.instructions,
    instructions: decoded.instructions,
    question: questions,
    questions,
  };
};

export const normalizePartForLegacy = (part) => {
  const sourceGroups = toArray(part?.groupOfQuestions || part?.questionGroups);
  const groups = sourceGroups.map((group) => normalizeGroupForLegacy(group));

  return {
    ...part,
    groupOfQuestions: groups,
    questionGroups: groups,
  };
};

const normalizeWritingTask = (task) => ({
  ...task,
  task_type: task?.task_type || task?.taskType,
  taskType: task?.taskType || task?.task_type,
  time_limit: task?.time_limit || task?.timeLimit,
  timeLimit: task?.timeLimit || task?.time_limit,
});

const normalizeWritingSubmission = (submission) => ({
  ...submission,
  submission_text: submission?.submission_text || submission?.submissionText,
  submissionText: submission?.submissionText || submission?.submission_text,
  band_score: submission?.band_score || submission?.score || submission?.aiOverallScore,
  writingTask: submission?.writingTask
    ? normalizeWritingTask(submission.writingTask)
    : submission?.writingTask,
});

const normalizeSpeakingSubmission = (submission) => ({
  ...submission,
  band_score: submission?.band_score || submission?.overallScore || submission?.aiOverallScore,
});

export const normalizeTestDataForLegacy = (testData) => {
  if (!testData || typeof testData !== "object") return testData;

  const parts = toArray(testData?.parts).map((part) => normalizePartForLegacy(part));
  const writingTasks = toArray(testData?.writingTasks).map((task) => normalizeWritingTask(task));

  return {
    ...testData,
    parts,
    writingTasks,
    speakingTasks: toArray(testData?.speakingTasks),
  };
};

const payloadToLegacyUserAnswer = (userAnswer) => {
  const payload = userAnswer?.answerPayload || {};
  const answerType = toStringSafe(userAnswer?.answerType);
  const legacyType = mapBackendQuestionTypeToLegacyGroupType(answerType);

  let answerText = payload?.answerText || payload?.answer || "";
  let matchingKey = null;
  let matchingValue = null;

  if (answerType === "MULTIPLE_CHOICE") {
    const index = toArray(payload?.selectedIndexes)[0];
    matchingKey = indexToKey(index);
    answerText = answerText || matchingKey || "";
  } else if (answerType === "TRUE_FALSE_NOT_GIVEN" || answerType === "YES_NO_NOT_GIVEN") {
    matchingValue = denormalizeNotGiven(payload?.answer || answerText);
    answerText = matchingValue;
  } else if (answerType.startsWith("MATCHING_")) {
    matchingKey = toStringSafe(payload?.selectedLabel || answerText);
    answerText = answerText || matchingKey;
  } else if (answerType === "DIAGRAM_LABELING") {
    answerText = payload?.answerText || answerText;
  } else {
    answerText = payload?.answerText || answerText;
  }

  return {
    ...userAnswer,
    answerText,
    userAnswerType: legacyType,
    matching_key: matchingKey,
    matching_value: matchingValue,
  };
};

export const normalizeTestResultDataForLegacy = (rawData) => {
  if (!rawData || typeof rawData !== "object") return rawData;

  const test = rawData?.test ? normalizeTestDataForLegacy(rawData.test) : rawData?.test;
  const userAnswersSource = toArray(rawData?.userAnswers || rawData?.userAnswer);
  const userAnswers = userAnswersSource.map((item) =>
    item?.answerPayload ? payloadToLegacyUserAnswer(item) : item
  );

  const writingSubmissions = toArray(rawData?.writingSubmissions || rawData?.writingSubmission).map((item) =>
    normalizeWritingSubmission(item)
  );
  const speakingSubmissions = toArray(rawData?.speakingSubmissions || rawData?.speakingSubmission).map((item) =>
    normalizeSpeakingSubmission(item)
  );

  const bandScore = rawData?.bandScore ?? rawData?.band_score ?? rawData?.data?.bandScore ?? rawData?.data?.band_score;
  const totalCorrect = rawData?.totalCorrect ?? rawData?.total_correct;
  const totalQuestions = rawData?.totalQuestions ?? rawData?.total_questions;

  return {
    ...rawData,
    test,
    userAnswers,
    userAnswer: userAnswers,
    writingSubmissions,
    writingSubmission: writingSubmissions,
    speakingSubmissions,
    speakingSubmission: speakingSubmissions,
    bandScore,
    band_score: bandScore,
    totalCorrect,
    total_correct: totalCorrect,
    totalQuestions,
    total_questions: totalQuestions,
  };
};

const inferLegacyTypeFromQuestion = (question, groupContext) => {
  if (groupContext?.typeQuestion) return groupContext.typeQuestion;
  if (groupContext?.questionType) {
    return mapBackendQuestionTypeToLegacyGroupType(groupContext.questionType);
  }
  if (question?.typeQuestion) return question.typeQuestion;

  const answers = toArray(question?.answers);
  if (answers.length > 1 && answers.some((ans) => ans?.matching_key)) return "MATCHING";
  if (answers.length > 1) return "MCQ";
  return "SHORT_ANSWER";
};

const ensureCorrectAnswers = (values, fallback = "N/A") => {
  const normalized = toArray(values)
    .map((item) => toStringSafe(item).trim())
    .filter(Boolean);

  if (normalized.length > 0) return normalized;
  return [fallback];
};

const buildWordBankFromLegacyAnswers = (answers) => {
  const withKey = toArray(answers).filter((item) => item?.matching_key);
  const unique = uniqueBy(withKey, (item) => toStringSafe(item.matching_key));

  return unique.map((item, index) => ({
    id: toStringSafe(item.matching_key || indexToKey(index) || index + 1),
    text: toStringSafe(item.answer_text || item.answerText || item.matching_key || "Option"),
  }));
};

const pickCorrectMatchingKey = (answers) => {
  const match = toArray(answers).find(
    (item) => toStringSafe(item?.matching_value).toUpperCase() === "CORRECT"
  );
  if (match?.matching_key) return toStringSafe(match.matching_key);
  if (toArray(answers)[0]?.matching_key) return toStringSafe(toArray(answers)[0].matching_key);
  return null;
};

const buildMetadataFromLegacy = (question, legacyType, groupContext = {}) => {
  const answers = toArray(question?.answers);
  const contentHtml = toStringSafe(question?.content);
  const contentText = stripHtml(contentHtml) || "Question";

  if (legacyType === "MCQ") {
    let options = answers.map((ans, index) => ({
      label: toStringSafe(ans?.matching_key || indexToKey(index) || index),
      text: toStringSafe(ans?.answer_text || ans?.answerText),
    }));

    if (options.length < 2) {
      options = [
        ...options,
        ...Array.from({ length: 2 - options.length }, (_, idx) => ({
          label: indexToKey(options.length + idx) || String(options.length + idx + 1),
          text: `Option ${options.length + idx + 1}`,
        })),
      ];
    }

    const correctOptionIndexes = answers
      .map((ans, index) =>
        toStringSafe(ans?.matching_value).toUpperCase() === "CORRECT" ? index : -1
      )
      .filter((index) => index >= 0);

    return {
      questionType: "MULTIPLE_CHOICE",
      metadata: {
        type: "MULTIPLE_CHOICE",
        options,
        correctOptionIndexes,
        isMultiSelect: correctOptionIndexes.length > 1,
      },
    };
  }

  if (legacyType === "TFNG") {
    const rawAnswer =
      answers[0]?.answer_text || answers[0]?.matching_value || question?.answer_text || "NOT GIVEN";

    return {
      questionType: "TRUE_FALSE_NOT_GIVEN",
      metadata: {
        type: "TRUE_FALSE_NOT_GIVEN",
        statement: contentText,
        correctAnswer: normalizeNotGiven(rawAnswer),
      },
    };
  }

  if (legacyType === "YES_NO_NOTGIVEN") {
    const rawAnswer =
      answers[0]?.answer_text || answers[0]?.matching_value || question?.answer_text || "NOT GIVEN";

    return {
      questionType: "YES_NO_NOT_GIVEN",
      metadata: {
        type: "YES_NO_NOT_GIVEN",
        statement: contentText,
        correctAnswer: normalizeNotGiven(rawAnswer),
      },
    };
  }

  if (legacyType === "MATCHING") {
    const options = uniqueBy(
      answers.map((ans, index) => ({
        label: toStringSafe(ans?.matching_key || indexToKey(index) || index),
        text: toStringSafe(ans?.answer_text || ans?.answerText || ans?.matching_key),
      })),
      (item) => item.label
    );

    return {
      questionType: "MATCHING_FEATURES",
      metadata: {
        type: "MATCHING_FEATURES",
        statement: contentText,
        features: options.length > 0 ? options : [{ label: "A", text: "Option A" }],
        correctFeatureLabel: pickCorrectMatchingKey(answers) || "A",
      },
    };
  }

  if (legacyType === "LABELING") {
    const wordBank = buildWordBankFromLegacyAnswers(answers);
    const correctKey = pickCorrectMatchingKey(answers);
    const correctText =
      answers.find((ans) => toStringSafe(ans?.matching_key) === correctKey)?.answer_text ||
      answers[0]?.answer_text ||
      correctKey ||
      "N/A";

    const imageUrl =
      groupContext?.imageUrl || groupContext?.img || groupContext?.groupImage || EMPTY_IMAGE_FALLBACK;

    return {
      questionType: "DIAGRAM_LABELING",
      metadata: {
        type: "DIAGRAM_LABELING",
        imageUrl,
        labelCoordinate: { x: 0, y: 0 },
        pointLabel: toStringSafe(question?.numberQuestion || question?.questionNumber || "1"),
        hasWordBank: wordBank.length > 0,
        wordBank,
        correctAnswers: ensureCorrectAnswers([correctText]),
      },
    };
  }

  if (legacyType === "FILL_BLANK") {
    const hasMatchingKey = answers.some((ans) => !!ans?.matching_key);
    const tableMode = toStringSafe(contentHtml).trim().startsWith("<table");

    const correctTexts = ensureCorrectAnswers(
      hasMatchingKey
        ? answers
            .filter((ans) => toStringSafe(ans?.matching_value).toUpperCase() === "CORRECT")
            .map((ans) => ans?.answer_text)
        : answers.map((ans) => ans?.answer_text)
    );

    if (tableMode) {
      return {
        questionType: "TABLE_COMPLETION",
        metadata: {
          type: "TABLE_COMPLETION",
          rowIndex: 0,
          columnIndex: 0,
          maxWords: 5,
          correctAnswers: correctTexts,
        },
      };
    }

    if (hasMatchingKey || toStringSafe(contentHtml).includes("[")) {
      const wordBank = buildWordBankFromLegacyAnswers(answers);
      return {
        questionType: "SUMMARY_COMPLETION",
        metadata: {
          type: "SUMMARY_COMPLETION",
          blankLabel: toStringSafe(question?.numberQuestion || question?.questionNumber || "1"),
          maxWords: 5,
          hasWordBank: wordBank.length > 0,
          wordBank: wordBank.length > 0 ? wordBank : undefined,
          correctAnswers: correctTexts,
          fullParagraph: contentHtml,
        },
      };
    }

    return {
      questionType: "SENTENCE_COMPLETION",
      metadata: {
        type: "SENTENCE_COMPLETION",
        sentenceWithBlank: contentText,
        maxWords: 5,
        correctAnswers: correctTexts,
      },
    };
  }

  const fallbackCorrect =
    answers[0]?.answer_text ||
    question?.answer_text ||
    stripHtml(contentHtml) ||
    "N/A";

  return {
    questionType: "SHORT_ANSWER",
    metadata: {
      type: "SHORT_ANSWER",
      maxWords: 20,
      correctAnswers: ensureCorrectAnswers([fallbackCorrect]),
    },
  };
};

export const mapLegacyQuestionPayloadToBackend = (question, groupContext = {}) => {
  const legacyType = inferLegacyTypeFromQuestion(question, groupContext);
  const mapped = buildMetadataFromLegacy(question, legacyType, groupContext);

  return {
    idQuestionGroup: question?.idGroupOfQuestions || question?.idQuestionGroup,
    idPart: question?.idPart,
    questionNumber: Number(question?.numberQuestion || question?.questionNumber || 1),
    content: toStringSafe(question?.content || stripHtml(question?.content) || "Question"),
    questionType: mapped.questionType,
    metadata: mapped.metadata,
    ...(question?.idQuestion ? { idQuestion: question.idQuestion } : {}),
  };
};

export const mapLegacyQuestionsPayloadToBackend = async (apiClient, questions) => {
  const sourceQuestions = toArray(questions);
  const groupIds = uniqueBy(
    sourceQuestions
      .map((question) => question?.idGroupOfQuestions || question?.idQuestionGroup)
      .filter(Boolean),
    (id) => id
  );

  const groupContextMap = {};

  await Promise.all(
    groupIds.map(async (groupId) => {
      try {
        const res = await apiClient.get(`/question-group/get-by-id/${groupId}`);
        const group = res?.data?.data;
        if (group) {
          const decoded = decodeInstructionsAndQuantity(group.instructions, group.quantity);
          groupContextMap[groupId] = {
            ...group,
            typeQuestion: mapBackendQuestionTypeToLegacyGroupType(group.questionType),
            instructions: decoded.instructions,
            quantity: decoded.quantity,
            imageUrl: group.imageUrl,
            img: group.imageUrl,
          };
        }
      } catch {
        groupContextMap[groupId] = {};
      }
    })
  );

  return sourceQuestions.map((question) => {
    const groupId = question?.idGroupOfQuestions || question?.idQuestionGroup;
    const groupContext = groupContextMap[groupId] || {};
    return mapLegacyQuestionPayloadToBackend(question, groupContext);
  });
};

const mapLegacyTypeToSubmitType = (legacyType) => {
  const normalized = toStringSafe(legacyType).trim();
  if (normalized === "MATCHING") return "MATCHING_FEATURES";
  if (normalized === "FILL_BLANK") return "SENTENCE_COMPLETION";
  if (normalized === "LABELING") return "DIAGRAM_LABELING";
  return mapLegacyGroupTypeToBackendQuestionType(normalized);
};

export const mapLegacyAnswerToSubmitItem = (answer, fallbackLegacyType = null) => {
  if (answer?.answerType && answer?.answerPayload) {
    return {
      idQuestion: toStringSafe(answer.idQuestion),
      answerType: answer.answerType,
      answerPayload: answer.answerPayload,
    };
  }

  const rawLegacyType = answer?.userAnswerType || fallbackLegacyType || "SHORT_ANSWER";
  const answerType = mapLegacyTypeToSubmitType(rawLegacyType);

  const answerText = toStringSafe(
    answer?.answerText || answer?.answer_text || answer?.text || ""
  );
  const matchingKey = answer?.matching_key ?? null;
  const matchingValue = answer?.matching_value ?? null;

  let answerPayload = { type: answerType, answerText };

  if (answerType === "MULTIPLE_CHOICE") {
    const singleIndex = keyToIndex(matchingKey);
    answerPayload = {
      type: "MULTIPLE_CHOICE",
      selectedIndexes: singleIndex >= 0 ? [singleIndex] : [],
    };
  } else if (answerType === "TRUE_FALSE_NOT_GIVEN") {
    answerPayload = {
      type: "TRUE_FALSE_NOT_GIVEN",
      answer: normalizeNotGiven(matchingValue || answerText || "NOT GIVEN"),
    };
  } else if (answerType === "YES_NO_NOT_GIVEN") {
    answerPayload = {
      type: "YES_NO_NOT_GIVEN",
      answer: normalizeNotGiven(matchingValue || answerText || "NOT GIVEN"),
    };
  } else if (answerType.startsWith("MATCHING_")) {
    answerPayload = {
      type: answerType,
      selectedLabel: toStringSafe(matchingKey || answerText),
    };
  } else if (answerType === "DIAGRAM_LABELING") {
    answerPayload = {
      type: "DIAGRAM_LABELING",
      answerText: answerText || toStringSafe(matchingKey),
    };
  } else {
    answerPayload = {
      type: answerType,
      answerText: answerText || toStringSafe(matchingValue),
    };
  }

  return {
    idQuestion: toStringSafe(answer?.idQuestion),
    answerType,
    answerPayload,
  };
};

export const mapLegacyAnswersToSubmitItems = (answers, fallbackTypeMap = {}) => {
  const grouped = new Map();

  toArray(answers).forEach((answer) => {
    const idQuestion = toStringSafe(answer?.idQuestion);
    if (!idQuestion) return;

    const fallbackType = fallbackTypeMap[idQuestion] || null;
    const mapped = mapLegacyAnswerToSubmitItem(answer, fallbackType);
    const existing = grouped.get(idQuestion);

    if (!existing) {
      grouped.set(idQuestion, mapped);
      return;
    }

    if (mapped.answerType === "MULTIPLE_CHOICE") {
      const mergedIndexes = uniqueBy(
        [...toArray(existing.answerPayload?.selectedIndexes), ...toArray(mapped.answerPayload?.selectedIndexes)].map((idx) => Number(idx)),
        (idx) => idx
      ).filter((idx) => Number.isFinite(idx) && idx >= 0);

      grouped.set(idQuestion, {
        ...existing,
        answerType: "MULTIPLE_CHOICE",
        answerPayload: {
          type: "MULTIPLE_CHOICE",
          selectedIndexes: mergedIndexes,
        },
      });
      return;
    }

    if (mapped.answerType.startsWith("MATCHING_")) {
      const selectedLabel =
        toStringSafe(mapped.answerPayload?.selectedLabel) ||
        toStringSafe(existing.answerPayload?.selectedLabel);

      grouped.set(idQuestion, {
        ...existing,
        answerType: mapped.answerType,
        answerPayload: {
          type: mapped.answerType,
          selectedLabel,
        },
      });
      return;
    }

    grouped.set(idQuestion, mapped);
  });

  return Array.from(grouped.values());
};
