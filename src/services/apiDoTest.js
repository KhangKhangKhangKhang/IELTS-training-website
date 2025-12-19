import API from "./axios.custom";

export const createManyAnswersAPI = async (idUser, idTestResult, data) => {
  const res = await API.post(
    `/user-answer/create-many-user-answers/${idUser}/${idTestResult}`,
    data
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

export const FinistTestAPI = async (idUser, idTestResult, data) => {
  const res = await API.patch(
    `/user-test-result/finish-test/${idUser}/${idTestResult}`,
    data
  );
  return res.data;
};

export const getManyAnswersAPI = async (idTestResult, idUser) => {
  const res = await API.get(
    `/user-answer/get-all-user-answers-by-idUser-and-idTestResult/${idTestResult}/${idUser}`
  );
  return res.data;
};

export const getDetailInTestAPI = async (idTest) => {
  const res = await API.get(`/test/get-detail-in-test/${idTest}`);
  return res.data;
};

export const ResetTestAPI = async (idUser, idTestResult) => {
  const res = await API.delete(
    `/user-test-result/reset-test/${idUser}/${idTestResult}`
  );
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
  return res.data;
};
