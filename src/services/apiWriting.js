import API from "./axios.custom";

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
  writingTask: submission?.writingTask
    ? normalizeWritingTask(submission.writingTask)
    : submission?.writingTask,
});

const normalizeEnvelope = (responseData) => {
  if (!responseData || typeof responseData !== "object") return responseData;
  if (responseData.data === undefined) return responseData;

  const data = responseData.data;

  if (Array.isArray(data)) {
    const looksLikeTasks = data.some((item) => item?.idWritingTask || item?.taskType);
    const mapped = looksLikeTasks
      ? data.map((item) => normalizeWritingTask(item))
      : data.map((item) => normalizeWritingSubmission(item));

    return {
      ...responseData,
      data: mapped,
    };
  }

  if (data?.idWritingTask || data?.taskType) {
    return {
      ...responseData,
      data: normalizeWritingTask(data),
    };
  }

  if (data?.idWritingSubmission || data?.submissionText || data?.submission_text) {
    return {
      ...responseData,
      data: normalizeWritingSubmission(data),
    };
  }

  return responseData;
};

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
  const targetTestResult = idTestResult || data?.idTestResult;
  if (!targetTestResult) {
    throw new Error("idTestResult is required for createWritingSubmissionAPI");
  }

  const normalizedData = {
    ...data,
    submissionText: data?.submissionText || data?.submission_text,
  };

  const res = await API.post(
    `/user-writing-submission/create-writing-submission/${targetTestResult}`,
    normalizedData
  );
  return normalizeEnvelope(res.data); // { id, taskId, userId, content, ... }
};

//get
export const getAllWritingTasksAPI = async (idTest) => {
  const res = await API.get(`/writing-task/get-all-writing-task/${idTest}`);
  return normalizeEnvelope(res.data); // [ { id, title, description, ... }, ... ]
};

export const getWritingTaskAPI = async (idWritingTask) => {
  const res = await API.get(`/writing-task/get-writing-task/${idWritingTask}`);
  return normalizeEnvelope(res.data); // { id, title, description, ... }
};

export const getWritingSubmissionsByTaskAPI = async (idUser) => {
  const res = await API.get(
    `/user-writing-submission/get-all-writing-submission-by-id-user/${idUser}`
  );
  return normalizeEnvelope(res.data);
};

export const getWritingSubmissionAPI = async (idWritingSubmission) => {
  const res = await API.get(
    `/user-writing-submission/get-writing-submission/${idWritingSubmission}`
  );
  return normalizeEnvelope(res.data);
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
  return normalizeEnvelope(res.data); // { id, title, description, ... }
};
//delete

export const deleteWritingTaskAPI = async (idWritingTask) => {
  const res = await API.delete(
    `/writing-task/delete-writing-task/${idWritingTask}`
  );
  return res.data; // { message: "Writing task deleted successfully" }
};
