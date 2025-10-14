import API from "./axios.custom";

export const sendChat = async (data) => {
  const res = await API.post("/chat-bot/send", data);
  return res.data;
};

export const chatHistory = async (userId, token) => {
  const res = await API.get(`/chat-bot/history/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const clearHistory = async (idUser) => {
  const res = await API.delete(`/chat-bot/clear/${idUser}`);
  return res.data;
};
