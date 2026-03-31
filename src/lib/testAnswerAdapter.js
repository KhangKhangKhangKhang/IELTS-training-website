const TEST_ANSWER_CACHE_KEY = "legacy_test_answers_cache_v1";

const LEGACY_TO_BACKEND_TYPE = {
  MCQ: "MULTIPLE_CHOICE",
  TFNG: "TRUE_FALSE_NOT_GIVEN",
  YES_NO_NOTGIVEN: "YES_NO_NOT_GIVEN",
  MATCHING: "MATCHING_INFORMATION",
  FILL_BLANK: "SENTENCE_COMPLETION",
  SHORT_ANSWER: "SHORT_ANSWER",
  LABELING: "DIAGRAM_LABELING",
  OTHER: "SHORT_ANSWER",
};

const BACKEND_TO_LEGACY_TYPE = {
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
  SHORT_ANSWER: "SHORT_ANSWER",
  DIAGRAM_LABELING: "LABELING",
};

export const normalizeLegacyAnswers = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.answers)) {
    return data.answers;
  }

  return [];
};

const keyToIndex = (key) => {
  if (typeof key !== "string" || !key.trim()) {
    return -1;
  }

  const normalized = key.trim().toUpperCase();
  return normalized.charCodeAt(0) - 65;
};

const indexToKey = (index) => {
  if (!Number.isInteger(index) || index < 0) {
    return null;
  }

  return String.fromCharCode(65 + index);
};

const readAnswerCache = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(TEST_ANSWER_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const writeAnswerCache = (cache) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TEST_ANSWER_CACHE_KEY, JSON.stringify(cache));
};

export const saveDraftAnswers = (idTestResult, answers) => {
  if (!idTestResult) {
    return;
  }

  const cache = readAnswerCache();
  cache[idTestResult] = answers;
  writeAnswerCache(cache);
};

export const getDraftAnswers = (idTestResult) => {
  if (!idTestResult) {
    return [];
  }

  const cache = readAnswerCache();
  return Array.isArray(cache[idTestResult]) ? cache[idTestResult] : [];
};

export const clearDraftAnswers = (idTestResult) => {
  if (!idTestResult) {
    return;
  }

  const cache = readAnswerCache();
  if (cache[idTestResult]) {
    delete cache[idTestResult];
    writeAnswerCache(cache);
  }
};

const mapLegacyTypeToBackendType = (legacyType) => {
  return LEGACY_TO_BACKEND_TYPE[legacyType] || "SHORT_ANSWER";
};

const mapQuestionTypeMapFromTest = (test) => {
  const map = {};
  const parts = test?.parts || [];

  parts.forEach((part) => {
    const groups = part?.groupOfQuestions || part?.questionGroups || [];
    groups.forEach((group) => {
      const questions = group?.question || group?.questions || [];
      questions.forEach((question) => {
        if (question?.idQuestion && question?.questionType) {
          map[question.idQuestion] = question.questionType;
        }
      });
    });
  });

  return map;
};

export const getQuestionTypeMap = async (apiClient, idTestResult, legacyAnswers) => {
  const map = {};

  legacyAnswers.forEach((answer) => {
    if (answer?.idQuestion) {
      map[answer.idQuestion] = mapLegacyTypeToBackendType(answer.userAnswerType);
    }
  });

  try {
    const testResultRes = await apiClient.get(
      `/user-test-result/get-test-result/${idTestResult}`
    );
    const idTest =
      testResultRes?.data?.data?.idTest || testResultRes?.data?.idTest;

    if (!idTest) {
      return map;
    }

    const testDetailRes = await apiClient.get(`/test/get-detail-in-test/${idTest}`);
    const testDetail = testDetailRes?.data?.data || testDetailRes?.data;
    const resolved = mapQuestionTypeMapFromTest(testDetail);

    return {
      ...map,
      ...resolved,
    };
  } catch (error) {
    return map;
  }
};

const buildAnswerPayload = (questionType, items) => {
  const first = items[0] || {};

  switch (questionType) {
    case "MULTIPLE_CHOICE": {
      const selectedIndexes = items
        .map((item) => keyToIndex(item?.matching_key))
        .filter((index) => index >= 0);

      return {
        type: questionType,
        selectedIndexes,
      };
    }

    case "TRUE_FALSE_NOT_GIVEN":
    case "YES_NO_NOT_GIVEN":
      return {
        type: questionType,
        answer:
          first?.matching_value ||
          first?.matching_key ||
          first?.answerText ||
          "",
      };

    case "MATCHING_HEADING":
    case "MATCHING_INFORMATION":
    case "MATCHING_FEATURES":
    case "MATCHING_SENTENCE_ENDINGS":
      return {
        type: questionType,
        selectedLabel: first?.matching_key || first?.answerText || "",
      };

    case "SENTENCE_COMPLETION":
    case "SUMMARY_COMPLETION":
    case "NOTE_COMPLETION":
    case "TABLE_COMPLETION":
    case "FLOW_CHART_COMPLETION":
    case "SHORT_ANSWER":
    case "DIAGRAM_LABELING":
    default:
      return {
        type: questionType,
        answerText: first?.answerText || "",
      };
  }
};

export const convertLegacyAnswersToModern = (legacyAnswers, questionTypeMap) => {
  const groupedByQuestion = legacyAnswers.reduce((acc, answer) => {
    if (!answer?.idQuestion) {
      return acc;
    }

    if (!acc[answer.idQuestion]) {
      acc[answer.idQuestion] = [];
    }

    acc[answer.idQuestion].push(answer);
    return acc;
  }, {});

  return Object.entries(groupedByQuestion).map(([idQuestion, items]) => {
    const questionType =
      questionTypeMap[idQuestion] ||
      mapLegacyTypeToBackendType(items[0]?.userAnswerType);

    return {
      idQuestion,
      answerType: questionType,
      answerPayload: buildAnswerPayload(questionType, items),
    };
  });
};

export const withLegacyBandScore = (payload) => {
  const bandScore = payload?.data?.bandScore;

  if (bandScore == null) {
    return payload;
  }

  return {
    ...payload,
    band_score: bandScore,
    data: {
      ...payload.data,
      band_score: bandScore,
    },
  };
};

export const mapModernUserAnswerToLegacy = (answer) => {
  const payload = answer?.answerPayload || {};
  const answerType = answer?.answerType;
  let matching_key = null;
  let matching_value = null;
  let answerText = "";

  if (Array.isArray(payload?.selectedIndexes) && payload.selectedIndexes.length) {
    matching_key = indexToKey(payload.selectedIndexes[0]);
    answerText = matching_key || "";
  } else if (payload?.selectedLabel) {
    matching_key = payload.selectedLabel;
    answerText = payload.selectedLabel;
  } else if (payload?.answer) {
    matching_value = payload.answer;
    answerText = payload.answer;
  } else {
    answerText = payload?.answerText || "";
  }

  return {
    idQuestion: answer?.idQuestion,
    answerText,
    userAnswerType: BACKEND_TO_LEGACY_TYPE[answerType] || "SHORT_ANSWER",
    matching_key,
    matching_value,
    isCorrect: answer?.isCorrect,
  };
};
