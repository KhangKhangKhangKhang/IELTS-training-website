import API from "./axios.custom";
import {
  clearDraftAnswers,
  convertLegacyAnswersToModern,
  getDraftAnswers,
  getQuestionTypeMap,
  mapModernUserAnswerToLegacy,
  normalizeLegacyAnswers,
  saveDraftAnswers,
  withLegacyBandScore,
} from "@/lib/testAnswerAdapter";

export const createManyAnswersAPI = async (idUser, idTestResult, data) => {
  const legacyAnswers = normalizeLegacyAnswers(data);
  const questionTypeMap = await getQuestionTypeMap(
    API,
    idTestResult,
    legacyAnswers
  );
  const modernAnswers = convertLegacyAnswersToModern(legacyAnswers, questionTypeMap);

  saveDraftAnswers(idTestResult, legacyAnswers);

  const res = await API.post(
    `/user-answer/save-progress/${idUser}/${idTestResult}`,
    { answers: modernAnswers }
  );
  return res.data;
};
export const StartTestAPI = async (idUser, idTest, data) => {
  const res = await API.post(
    `/user-test-result/start-test/${idUser}/${idTest}`,
    data
  );
  return res.data;
};

export const FinistTestAPI = async (idTestResult, idUser, data = {}) => {
  const legacyAnswers =
    normalizeLegacyAnswers(data).length > 0
      ? normalizeLegacyAnswers(data)
      : getDraftAnswers(idTestResult);
  const questionTypeMap = await getQuestionTypeMap(
    API,
    idTestResult,
    legacyAnswers
  );
  const modernAnswers = convertLegacyAnswersToModern(legacyAnswers, questionTypeMap);

  const payload = {
    idTestResult,
    answers: modernAnswers,
  };

  if (typeof data?.duration === "number") {
    payload.duration = data.duration;
  }

  const res = await API.post(
    `/user-test-result/submit-reading-listening/${idUser}`,
    payload
  );

  clearDraftAnswers(idTestResult);

  return withLegacyBandScore(res.data);
};

export const FinishTestWritingAPI = async (idTestResult, idUser, data) => {
  const res = await API.patch(
    `/user-test-result/finish-test-writing/${idTestResult}/${idUser}`,
    data
  );
  return res.data;
};

export const getManyAnswersAPI = async (idTestResult, _idUser) => {
  const res = await API.get(
    `/user-test-result/get-test-result-and-answers/${idTestResult}`
  );
  return res.data;
};

export const getDetailInTestAPI = async (idTest) => {
  const res = await API.get(`/test/get-detail-in-test/${idTest}`);
  return res.data;
};

export const ResetTestAPI = async (_idUser, idTestResult) => {
  const res = await API.delete(`/user-test-result/reset-test/${idTestResult}`);
  clearDraftAnswers(idTestResult);
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
  return res.data;
};

export const getTestAnswerAPI = async (idTest) => {
  const res = await API.get(`/test/get-answers-in-test/${idTest}`);
  return res.data;
};

export const getTestResultAndAnswersAPI = async (idTestResult) => {
  const res = await API.get(
    `/user-test-result/get-test-result-and-answers/${idTestResult}`
  );

  const payload = res.data;

  if (Array.isArray(payload?.data?.userAnswers) && !payload?.data?.userAnswer) {
    payload.data.userAnswer = payload.data.userAnswers.map(
      mapModernUserAnswerToLegacy
    );
  }

  return payload;
};
