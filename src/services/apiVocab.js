import API from "./axios.custom";

export const createTopicAPI = async (data) => {
  // data = { nameTopic, idUser }
  const res = await API.post("/topic/create-topic", data);
  return res.data; // { message, data, status }
};

export const getTopicsByUserAPI = (idUser) => {
  return API.get(`/topic/get-all-by-idUser/${idUser}`);
};

// export const updateTopicAPI = (idTopic, payload) =>
//   API.patch(`/topic/update/${idTopic}`, payload).then((res) => res.data);

export const updateTopicAPI = async (idTopic, payload) =>{
  const res = await API.patch(`/topic/update/${idTopic}`,payload);
  return res.data;
}