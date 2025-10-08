import API from "./axios.custom";

export const getAPITest = async () => {
  const res = await API.get("/test/get-all-test");
  return res.data;
};

export const createNewTest = async (data) => {
  const res = await API.post("/test/create-test", data);
  return res.data;
};

export const deleteAPITest = async (id) => {
  const res = await API.delete(`/test/delete-test/${id}`);
  return res.data;
};

export const updateAPITest = async (id, data) => {
  const res = await API.put(`/test/update-test/${id}`, data);
  return res.data;
};
