import API from "./axios.custom";

const unwrapData = (payload) => payload?.data ?? payload;

export const getNotificationsAPI = async () => {
  const res = await API.get("/notifications");
  const data = unwrapData(res.data) || {};
  return {
    unreadCount: Number(data.unreadCount ?? 0),
    items: Array.isArray(data.items) ? data.items : [],
  };
};
