import API from "./axios.custom";

// =============================================================================
// SPEAKING TASK APIS (FORM DATA)
// =============================================================================

// Tạo mới Speaking Task (Có gửi file -> Dùng FormData)
export const createSpeakingTask = async (data) => {
  const res = await API.post("/speaking-task/create-speaking-task", data);
  return res.data;
};

// Cập nhật Speaking Task (Có gửi file -> Dùng FormData)
export const updateSpeakingTask = async (idSpeakingTask, data) => {
  const res = await API.patch(
    `/speaking-task/update-speaking-task/${idSpeakingTask}`,
    data
  );
  return res.data;
};

export const getAllSpeakingTasks = async (idTest) => {
  const res = await API.get(`/speaking-task/find-all-speaking-tasks/${idTest}`);
  return res.data;
};

export const getSpeakingTask = async (idSpeakingTask) => {
  const res = await API.get(
    `/speaking-task/find-speaking-task/${idSpeakingTask}`
  );
};

export const deleteSpeakingTask = async (idSpeakingTask) => {
  const res = await API.delete(
    `/speaking-task/remove-speaking-task/${idSpeakingTask}`
  );
  return res.data;
};

// =============================================================================
// SPEAKING QUESTION APIS (JSON)
// =============================================================================
// Lưu ý: Nếu Question cũng cần upload file (ví dụ file âm thanh cho câu hỏi),
// bạn báo tôi để tôi đổi sang FormData giống phần Task nhé.

export const createSpeakingQuestion = async (data) => {
  const res = await API.post(
    "/speaking-question/create-speaking-question",
    data
  );
  return res.data;
};

export const getSpeakingQuestionsByTaskId = async (idSpeakingTask) => {
  const res = await API.get(
    `/speaking-question/find-all-speaking-questions-by-id-speaking-task/${idSpeakingTask}`
  );
  return res.data;
};

export const updateSpeakingQuestion = async (idSpeakingQuestion, data) => {
  const res = await API.patch(
    `/speaking-question/update-speaking-question/${idSpeakingQuestion}`,
    data
  );
  return res.data;
};

export const deleteSpeakingQuestion = async (idSpeakingQuestion) => {
  const res = await API.delete(
    `/speaking-question/remove-speaking-question/${idSpeakingQuestion}`
  );
  return res.data;
};

//SPEAKING SUBMISSION

export const userSpeakingSubmission = async (formData) => {
  const res = await API.post(
    `/user-speaking-submission/create-speaking-submission`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};
