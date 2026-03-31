import API from "./axios.custom";
import {
  adaptQuestionsToMetadataPayload,
  adaptSingleQuestionToMetadataPayload,
} from "@/lib/questionMetadataAdapter";
import {
  buildQuestionGroupFormData,
  getLegacyAnswersByQuestionId,
  mapGroupToLegacyShape,
  mapPartToLegacyShape,
  upsertQuestionsIndividually,
} from "@/lib/testApiContractAdapter";

export const getAPITest = async () => {
  const res = await API.get("/test/get-all-test");
  return res.data;
};

export const createNewTest = async (data) => {
  const res = await API.post("/test/create-test", data);
  return res.data;
};

export const deleteAPITest = async (idTest) => {
  const res = await API.delete(`/test/delete-test/${idTest}`);
  return res.data;
};

export const updateTestInfoAPI = async (idTest, formData) => {
  const res = await API.patch(`/test/update-test/${idTest}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Cập nhật thông tin cơ bản của test (duration, numberQuestion, etc.)
//===============================================================================================
//PHÂN CHIA GIỮA TEACHER VÀ USER
//===============================================================================================

// Create new test
//=================================================================================================
export const createTestAPI = async (formData) => {
  const bodyFormData = new FormData();
  for (const key in formData) {
    if (formData[key] != null) bodyFormData.append(key, formData[key]);
  }

  const res = await API.post("/test/create-test", bodyFormData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

// Create by ID
export const createPartAPI = async (data) => {
  const res = await API.post("/part/create-part", data);
  return res.data;
};

export const createPassageAPI = async (formData) => {
  const res = await API.post("/passage/create-passage", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const createGroupOfQuestionsAPI = async (data) => {
  const formData = buildQuestionGroupFormData(data);
  const res = await API.post("/question-group/create-question-group", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return {
    ...res.data,
    data: mapGroupToLegacyShape(res?.data?.data || {}),
  };
};

export const createQuestion = async (data) => {
  const payload = await adaptSingleQuestionToMetadataPayload(API, data);
  const res = await API.post("/question/create-question", payload);
  return res.data;
};

export const createOption = async () => {
  throw new Error(
    "createOption API is deprecated. Options must be saved inside question metadata."
  );
};

export const createAnswer = async () => {
  throw new Error(
    "createAnswer API is deprecated. Answers must be saved inside question metadata."
  );
};

export const upsertUserTest = async () => {
  throw new Error(
    "upsertUserTest API is deprecated. Use user-test-result endpoints instead."
  );
};

export const createUserTestResult = async (idUser, idTest, data) => {
  const res = await API.post(
    `/user-test-result/start-test/${idUser}/${idTest}`,
    data
  );
  return res.data;
};

export const createManyQuestion = async (data) => {
  const payload = await adaptQuestionsToMetadataPayload(API, data);
  const res = await API.post(`/question/create-many-questions`, payload);
  return res.data;
};

//delete
export const deletePartAPI = async (idPart) => {
  const res = await API.delete(`/part/delete/${idPart}`);
  return res.data;
};

export const deleteGroupOfQuestionsAPI = async (idGroupOfQuestions) => {
  const res = await API.delete(
    `/question-group/delete-question-group/${idGroupOfQuestions}`
  );
  return res.data;
};

//get
export const getAllPartByIdAPI = async (idTest) => {
  const res = await API.get(`/part/get-all-part-by-idTest/${idTest}`);
  return res.data;
};

export const getPartByIdAPI = async (idPart) => {
  const res = await API.get(`/part/get-one/${idPart}`);
  const mappedData = Array.isArray(res?.data?.data)
    ? res.data.data.map(mapPartToLegacyShape)
    : [];

  return {
    ...res.data,
    data: mappedData,
  };
};
export const getQuestionsByIdGroupAPI = async (idGroupOfQuestions) => {
  const res = await API.get(`/question-group/get-by-id/${idGroupOfQuestions}`);
  const rawGroup = Array.isArray(res?.data?.data)
    ? res.data.data[0]
    : res?.data?.data;

  return {
    ...res.data,
    data: rawGroup ? [mapGroupToLegacyShape(rawGroup)] : [],
  };
};

export const getAnswersByIdQuestionAPI = async (idQuestion) => {
  return getLegacyAnswersByQuestionId(API, idQuestion);
};

//patch
export const updatePartAPI = async (idPart, data) => {
  const res = await API.patch(`/part/update/${idPart}`, data);
  return res.data;
};

export const updatePassageAPI = async (idPassage, data) => {
  const res = await API.patch(`/passage/update-passage/${idPassage}`, data);
  return res.data;
};

export const updateGroupOfQuestionsAPI = async (idGroupOfQuestions, data) => {
  const formData = buildQuestionGroupFormData(data);
  const res = await API.patch(
    `/question-group/update-question-group/${idGroupOfQuestions}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return {
    ...res.data,
    data: mapGroupToLegacyShape(res?.data?.data || {}),
  };
};

export const updateAnswerAPI = async () => {
  throw new Error(
    "updateAnswerAPI is deprecated. Answers must be updated through question metadata."
  );
};
export const updateQuestionAPI = async (idQuestion, data) => {
  const payload = await adaptSingleQuestionToMetadataPayload(API, data);
  const res = await API.patch(`/question/update-question/${idQuestion}`, payload);
  return res.data;
};

export const updateManyQuestionAPI = async (data) => {
  const payload = await adaptQuestionsToMetadataPayload(API, data);
  return upsertQuestionsIndividually(API, payload?.questions || []);
};
