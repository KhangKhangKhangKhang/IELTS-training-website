import API from "./axios.custom";
import axios from "axios";

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

export const updateAPITest = async (idTest, data) => {
  const res = await API.patch(`/test/update-test/${idTest}`, data);
  return res.data;
};

// Cập nhật thông tin cơ bản của test (duration, numberQuestion, etc.)
export const updateTestInfoAPI = async (idTest, data) => {
  const bodyFormData = new FormData();
  for (const key in data) {
    if (data[key] != null) bodyFormData.append(key, data[key]);
  }

  const res = await API.patch(`/test/update-test/${idTest}`, bodyFormData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};
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
  const formData = new FormData();

  // Thêm các fields vào FormData
  for (const key in data) {
    if (data[key] != null) {
      formData.append(key, data[key]);
    }
  }

  const res = await API.post(
    "/group-of-questions/create-group-question",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

export const createQuestion = async (data) => {
  const res = await API.post("/question/create-question", data);
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
  const res = await API.post(`/question/create-many-questions`, data);
  return res.data;
};

//delete
export const deletePartAPI = async (idPart) => {
  const res = await API.delete(`/part/delete/${idPart}`);
  return res.data;
};

export const deleteGroupOfQuestionsAPI = async (idGroupOfQuestions) => {
  const res = await API.delete(
    `/group-of-questions/delete-group-of-questions/${idGroupOfQuestions}`
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
  return res.data;
};
export const getQuestionsByIdGroupAPI = async (idGroupOfQuestions) => {
  const res = await API.get(
    `/group-of-questions/get-by-id/${idGroupOfQuestions}`
  );
  return res.data;
};

export const getAnswersByIdQuestionAPI = async (idQuestion) => {
  const res = await API.get(`/answer/get-by-id-question/${idQuestion}`);
  return res.data;
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
  const res = await API.patch(
    `/group-of-questions/update-group-of-questions/${idGroupOfQuestions}`,
    data
  );
  return res.data;
};

export const updateAnswerAPI = async (idAnswer, data) => {
  const res = await API.patch(`/answer/update-answer/${idAnswer}`, data);
  return res.data;
};
export const updateQuestionAPI = async (idQuestion, data) => {
  const res = await API.patch(`/question/update-question/${idQuestion}`, data);
  return res.data;
};

export const updateManyQuestionAPI = async (data) => {
  const res = await API.patch(`/question/update-many-questions`, data);
  return res.data;
};
