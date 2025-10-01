import API from "./axios.custom";
export const userProfileAPI = async (id) => {
  const res = await API.get(`/users/get-one/${id}`, data);
  return res.data;
};
