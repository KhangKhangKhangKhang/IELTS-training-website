import API from "./axios.custom";

export const getPackagesAPI = async () => {
  const res = await API.get("/subscriptions/packages");
  return res.data;
};

export const getCurrentSubscriptionAPI = async () => {
  const res = await API.get("/subscriptions/current");
  return res.data;
};

export const subscribeAPI = async ({ idPackage, bankCode }) => {
  const res = await API.post("/subscriptions/subscribe", { idPackage, bankCode });
  return res.data;
};

export const cancelSubscriptionAPI = async () => {
  const res = await API.put("/subscriptions/cancel");
  return res.data;
};
