import API from "./axios.custom";

export const getAPITest = async () => {
  const res = await API.get("/test/get-all-test");
  return res.data;
};
