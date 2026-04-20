import API from "./axios.custom";
import {
  mapLegacyAnswersToSubmitItems,
  normalizeTestDataForLegacy,
  normalizeTestResultDataForLegacy,
} from "./contractAdapters";

const pendingSubmitAnswers = new Map();

const normalizeEnvelope = (responseData, normalizer) => {
  if (!responseData || typeof responseData !== "object") return responseData;
  if (responseData.data === undefined) return normalizer(responseData);
  return {
    ...responseData,
    data: normalizer(responseData.data),
  };
};

const withTopLevelAliases = (responseData) => {
  const normalized = normalizeEnvelope(responseData, normalizeTestResultDataForLegacy);
  if (!normalized?.data) return normalized;
  return {
    ...normalized,
    band_score: normalized.data.band_score,
    total_correct: normalized.data.total_correct,
    total_questions: normalized.data.total_questions,
  };
};

export const createManyAnswersAPI = async (idUser, idTestResult, data) => {
  const legacyAnswers = Array.isArray(data?.answers) ? data.answers : [];
  const mappedAnswers = mapLegacyAnswersToSubmitItems(legacyAnswers);

  pendingSubmitAnswers.set(String(idTestResult), mappedAnswers);

  if (mappedAnswers.length === 0) {
    return {
      message: "No answers to save",
      data: { count: 0 },
      status: 200,
    };
  }

  const res = await API.post(
    `/user-answer/save-progress/${idUser}/${idTestResult}`,
    { answers: mappedAnswers }
  );

  return res.data;
};

export const StartTestAPI = async (idUser, idTest, data) => {
  const res = await API.post(
    `/user-test-result/start-test/${idUser}/${idTest}`,
    data
  );

  return withTopLevelAliases(res.data);
};

export const FinistTestAPI = async (idTestResult, idUser, data = {}) => {
  const cachedAnswers = pendingSubmitAnswers.get(String(idTestResult)) || [];
  const payloadAnswers = Array.isArray(data?.answers)
    ? mapLegacyAnswersToSubmitItems(data.answers)
    : cachedAnswers;

  const payload = {
    idTestResult,
    answers: payloadAnswers,
  };

  if (typeof data?.duration === "number") {
    payload.duration = data.duration;
  }

  const res = await API.post(
    `/user-test-result/submit-reading-listening/${idUser}`,
    payload
  );

  pendingSubmitAnswers.delete(String(idTestResult));
  return withTopLevelAliases(res.data);
};

export const FinishTestWritingAPI = async (idTestResult, idUser, data) => {
  const writingSubmissions = Array.isArray(data?.writingSubmissions)
    ? data.writingSubmissions.map((item) => ({
        ...item,
        submissionText: item?.submissionText || item?.submission_text || "",
      }))
    : [];

  const res = await API.patch(
    `/user-test-result/finish-test-writing/${idTestResult}/${idUser}`,
    {
      ...data,
      writingSubmissions,
    }
  );

  const normalized = normalizeEnvelope(res.data, normalizeTestResultDataForLegacy);
  if (Array.isArray(normalized?.data?.submissions)) {
    normalized.data.submissions = normalized.data.submissions.map((submission) => ({
      ...submission,
      task_type: submission?.task_type || submission?.taskType,
      submission_text: submission?.submission_text || submission?.submissionText,
      band_score: submission?.band_score || submission?.score,
    }));
  }

  return normalized;
};

export const getManyAnswersAPI = async (idTestResult, idUser) => {
  const _unusedUserId = idUser;
  const res = await API.get(
    `/user-test-result/get-test-result-and-answers/${idTestResult}`
  );
  const normalized = normalizeEnvelope(res.data, normalizeTestResultDataForLegacy);

  return {
    ...normalized,
    data: normalized?.data?.userAnswer || [],
  };
};

export const getDetailInTestAPI = async (idTest) => {
  const res = await API.get(`/test/get-detail-in-test/${idTest}`);

  return normalizeEnvelope(res.data, normalizeTestDataForLegacy);
};

export const ResetTestAPI = async (idUser, idTestResult) => {
  const targetTestResultId = idTestResult || idUser;
  const res = await API.delete(`/user-test-result/reset-test/${targetTestResultId}`);

  pendingSubmitAnswers.delete(String(targetTestResultId));
  return res.data;
};

export const DeleteTestResultAPI = async (idTestResult) => {
  const res = await API.delete(
    `/user-test-result/delete-test-result/${idTestResult}`
  );
  return res.data;
};

export const getTestResultByIdAPI = async (idTestResult) => {
  const res = await API.get(
    `/user-test-result/get-test-result/${idTestResult}`
  );

  return withTopLevelAliases(res.data);
};

export const getTestAnswerAPI = async (idTest) => {
  const res = await API.get(`/test/get-answers-in-test/${idTest}`);

  return normalizeEnvelope(res.data, normalizeTestDataForLegacy);
};

export const getTestResultAndAnswersAPI = async (idTestResult) => {
  const res = await API.get(
    `/user-test-result/get-test-result-and-answers/${idTestResult}`
  );

  return withTopLevelAliases(res.data);
};
