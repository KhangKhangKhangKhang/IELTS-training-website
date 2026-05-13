import API from "./axios.custom";

export const createTopicAPI = async (data) => {
  // data = { nameTopic, idUser }
  const res = await API.post("/topic/create-topic", data);
  return res.data; // { message, data, status }
};

export const getTopicsByUserAPI = async (idUser) => {
  const res = await API.get(`/topic/get-all-by-idUser/${idUser}`);
  return res.data;
};

//topic

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
  const res = await API.post(`/vocabulary/create-vocabulary`, data);
  return res.data; // => { message, data }
};

export const updateVocabAPI = async (idVocab, payload) => {
  const res = await API.patch(
    `/vocabulary/update-vocabulary/${idVocab}`,
    payload
  );
  return res.data;
};

export const addVocabToTopic = async (data) => {
  const res = await API.post(`/vocabulary/add-vocabulary-to-topic`, data);
  return res.data;
};

export const deleteVocabAPI = async (idVocab, idUser) => {
  const res = await API.delete(
    `/vocabulary/delete-vocabulary-by-id-user/${idVocab}/${idUser}`
  );
  return res.data;
};

// suggest vocab
export const suggestVocabAPI = async (word) => {
  try {
    const response = await API.get(
      `/vocabulary/suggest/${encodeURIComponent(word)}`
    );
    return response.data;
  } catch (error) {
    console.error("Error suggesting vocabulary:", error);
    throw error;
  }
};

// SM-2 Spaced Repetition APIs
export const getDueReviewAPI = async (idUser, limit = 20) => {
  try {
    const response = await API.get("/vocabulary/due-review", {
      params: { idUser, limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching due review:", error);
    throw error;
  }
};

export const submitReviewAPI = async (idVocab, idUser, quality) => {
  try {
    const response = await API.post("/vocabulary/review", {
      idVocab,
      idUser,
      quality,
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
};

export const getTierRecommendationAPI = async (idUser) => {
  try {
    const response = await API.get("/vocabulary/tier-recommendation", {
      params: { idUser },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tier recommendation:", error);
    throw error;
  }
};
