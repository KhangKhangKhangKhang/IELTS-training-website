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

export const updateTopicAPI = async (idTopic, payload) => {
  const res = await API.patch(`/topic/update/${idTopic}`, payload);
  return res.data;
};

export const deleteTopicAPI = async (idTopic) => {
  const res = await API.delete(`/topic/delete/${idTopic}`);
  return res.data;
};

export const getVocabAPI = async (idTopic) => {
  return API.get(`/topic/get-vocabularies-in-topic/${idTopic}`);
};

export const createVocabAPI = async (data) => {
  const res = await API.post(`/vocabulary/create-vocabulary`);
  return res.data;
};

export const updateVocabAPI = async (idTuVung) => {
  const res = await API.patch(`/vocabulary/${idTuVung}`);
  return res.data;
};

export const addVocabToTopic = async (data) => {
  const res = await API.post(`/vocabulary/add-vocabulary-to-topic`);
  return res.data;
};

export const deleteVocabAPI = async (id, idUser) => {
  const res = await API.delete(`/vocabulary/${id}/${idUser}`);
  return res.data;
};
