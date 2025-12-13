import API from "./axios.custom";
export const userProfileAPI = async (id) => {
  const res = await API.get(`/users/get-one/${id}`);
  return res.data;
};

export const getAllUserAPI = async (params = {}) => {
  const res = await API.get(`/users/get-all`, params);
  return res.data;
};

export const createUserAPI = async (data) => {
  const res = await API.post(`/users/create-user`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateUserAPI = async (id, data) => {
  const res = await API.patch(`/users/update-user/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteUserAPI = async (id) => {
  const res = await API.delete(`/users/${id}`);
  return res.data;
};

export const getStreakAPI = async (idUser) => {
  const res = await API.get(`/review-streak/get-streak-by-id-user/${idUser}`);
  return res.data;
};

export const postVocabStreakAPI = async (data) => {
  const res = await API.post(`/review-streak/vocabulary/submit`, data);
  return res.data;
};
