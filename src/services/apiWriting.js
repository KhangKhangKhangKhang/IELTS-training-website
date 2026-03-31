import API from "./axios.custom";

//post
export const createWritingTaskAPI = async (formdata) => {
  const res = await API.post("/writing-task/create-writing-task", formdata, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data; // { id, title, description, ... }
};

export const createWritingSubmissionAPI = async (data, idTestResult) => {
  const resolvedTestResultId =
    idTestResult || data?.idTestResult || data?.id_test_result;

  if (!resolvedTestResultId) {
    throw new Error(
      "createWritingSubmissionAPI requires idTestResult as argument or in payload"
    );
  }

  const payload = { ...(data || {}) };
  delete payload.idTestResult;
  delete payload.id_test_result;

  const res = await API.post(
    `/user-writing-submission/create-writing-submission/${resolvedTestResultId}`,
    payload
  );
  return res.data; // { id, taskId, userId, content, ... }
};

//get
export const getAllWritingTasksAPI = async (idTest) => {
  const res = await API.get(`/writing-task/get-all-writing-task/${idTest}`);
  return res.data; // [ { id, title, description, ... }, ... ]
};

export const getWritingTaskAPI = async (idWritingTask) => {
  const res = await API.get(`/writing-task/get-writing-task/${idWritingTask}`);
  return res.data; // { id, title, description, ... }
};

export const getWritingSubmissionsByTaskAPI = async (idUser) => {
  const res = await API.get(
    `/user-writing-submission/get-all-writing-submission-by-id-user/${idUser}`
  );
  return res.data;
};

export const getWritingSubmissionAPI = async (idWritingSubmission) => {
  const res = await API.get(
    `/user-writing-submission/get-writing-submission/${idWritingSubmission}`
  );
  return res.data;
};
//patch
export const updateWritingTaskAPI = async (idWritingTask, formdata) => {
  const res = await API.patch(
    `/writing-task/update-writing-task/${idWritingTask}`,
    formdata,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data; // { id, title, description, ... }
};
//delete

export const deleteWritingTaskAPI = async (idWritingTask) => {
  const res = await API.delete(
    `/writing-task/delete-writing-task/${idWritingTask}`
  );
  return res.data; // { message: "Writing task deleted successfully" }
};
