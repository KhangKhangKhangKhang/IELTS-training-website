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

export const createWritingSubmissionAPI = async (data) => {
  const res = await API.post(
    "/user-writing-submission/create-writing-submission",
    data
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
