import API from "./axios.custom";
import {
  encodeInstructionsWithQuantity,
  mapBackendQuestionToLegacyQuestion,
  mapLegacyQuestionsPayloadToBackend,
  mapLegacyGroupTypeToBackendQuestionType,
  normalizeGroupForLegacy,
  normalizePartForLegacy,
} from "./contractAdapters";

const normalizeEnvelope = (responseData, normalizer) => {
  if (!responseData || typeof responseData !== "object") return responseData;
  if (responseData.data === undefined) return normalizer(responseData);
  return {
    ...responseData,
    data: normalizer(responseData.data),
  };
};

const buildQuestionGroupFormData = (data = {}) => {
  const formData = new FormData();

  formData.append("idPart", data.idPart);
  formData.append(
    "questionType",
    mapLegacyGroupTypeToBackendQuestionType(
      data.typeQuestion || data.questionType
    )
  );
  formData.append("title", data.title || "");

  const encodedInstructions = encodeInstructionsWithQuantity(
    data.instructions || data.instruction || "",
    data.quantity
  );
  if (encodedInstructions) {
    formData.append("instructions", encodedInstructions);
  }

  if (data.order !== undefined && data.order !== null) {
    formData.append("order", String(data.order));
  }

  const imageFile = data.imageUrl || data.img || data.image;
  if (imageFile !== undefined && imageFile !== null) {
    formData.append("imageUrl", imageFile);
  }

  return formData;
};

const normalizeQuestionGroupResponseAsLegacyArray = (responseData) => {
  const normalized = normalizeGroupForLegacy(responseData?.data || responseData);
  return {
    ...(responseData || {}),
    data: normalized ? [normalized] : [],
  };
};

const stripQuestionIdFromCreatePayload = (question) => {
  const { idQuestion: _idQuestion, ...rest } = question;
  return rest;
};

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

  return normalizeEnvelope(res.data, normalizeGroupForLegacy);
};

export const createQuestion = async (data) => {
  const isLegacyPayload =
    !!data?.idGroupOfQuestions || Array.isArray(data?.answers);

  let payload = data;
  if (isLegacyPayload) {
    const [mappedQuestion] = await mapLegacyQuestionsPayloadToBackend(API, [data]);
    payload = stripQuestionIdFromCreatePayload(mappedQuestion);
  }

  const res = await API.post("/question/create-question", payload);
  return res.data;
};

export const createOption = async (data) => {
  const res = await API.post("/option/create-many-option", data);
  return res.data;
};

export const createAnswer = async (data) => {
  const res = await API.post("/answer/create-answer", data);
  return res.data;
};

export const upsertUserTest = async (data) => {
  const res = await API.post("/user-test/upsert-user-test", data);
  return res.data;
};

export const createUserTestResult = async (idUser, idTest, data) => {
  const res = await API.post(
    `/user-test-result/start-test/${idUser}/${idTest}`,
    data
  );
  return res.data;
};

export const createManyQuestion = async (data) => {
  const sourceQuestions = Array.isArray(data?.questions) ? data.questions : [];
  const mappedQuestions = await mapLegacyQuestionsPayloadToBackend(
    API,
    sourceQuestions
  );
  const payload = {
    questions: mappedQuestions.map((question) =>
      stripQuestionIdFromCreatePayload(question)
    ),
  };

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

  return normalizeEnvelope(res.data, (parts) =>
    (Array.isArray(parts) ? parts : []).map((part) => normalizePartForLegacy(part))
  );
};
export const getQuestionsByIdGroupAPI = async (idGroupOfQuestions) => {
  const res = await API.get(`/question-group/get-by-id/${idGroupOfQuestions}`);
  return normalizeQuestionGroupResponseAsLegacyArray(res.data);
};

export const getAnswersByIdQuestionAPI = async (idQuestion) => {
  const res = await API.get(`/question/find-by-id/${idQuestion}`);
  const question = res?.data?.data;

  if (Array.isArray(question?.answers) && question.answers.length > 0) {
    return {
      ...res.data,
      data: question.answers,
    };
  }

  const mapped = mapBackendQuestionToLegacyQuestion(question || {});
  return {
    ...res.data,
    data: mapped?.answers || [],
  };
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

  return normalizeEnvelope(res.data, normalizeGroupForLegacy);
};

export const updateAnswerAPI = async (idAnswer, data) => {
  const res = await API.patch(`/answer/update-answer/${idAnswer}`, data);
  return res.data;
};
export const updateQuestionAPI = async (idQuestion, data) => {
  const isLegacyPayload =
    !!data?.idGroupOfQuestions || Array.isArray(data?.answers);

  let payload = data;
  if (isLegacyPayload) {
    const [mappedQuestion] = await mapLegacyQuestionsPayloadToBackend(API, [
      {
        ...data,
        idQuestion,
      },
    ]);
    payload = stripQuestionIdFromCreatePayload(mappedQuestion);
  }

  const res = await API.patch(`/question/update-question/${idQuestion}`, payload);
  return res.data;
};

export const updateManyQuestionAPI = async (data) => {
  const sourceQuestions = Array.isArray(data?.questions) ? data.questions : [];
  const mappedQuestions = await mapLegacyQuestionsPayloadToBackend(
    API,
    sourceQuestions
  );

  const toUpdate = mappedQuestions.filter((question) => !!question.idQuestion);
  const toCreate = mappedQuestions
    .filter((question) => !question.idQuestion)
    .map((question) => stripQuestionIdFromCreatePayload(question));

  const updatedRecords = [];

  if (toUpdate.length > 0) {
    const updateResponses = await Promise.all(
      toUpdate.map(async (question) => {
        const { idQuestion, ...payload } = question;
        const res = await API.patch(`/question/update-question/${idQuestion}`, payload);
        return res?.data?.data || res?.data || null;
      })
    );
    updatedRecords.push(...updateResponses.filter(Boolean));
  }

  if (toCreate.length > 0) {
    const createRes = await API.post(`/question/create-many-questions`, {
      questions: toCreate,
    });
    const created = Array.isArray(createRes?.data?.data)
      ? createRes.data.data
      : [];
    updatedRecords.push(...created);
  }

  return {
    message: "Questions updated successfully",
    data: updatedRecords,
    status: 200,
  };
};
