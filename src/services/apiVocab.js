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

// Flat list of ALL vocab for a user across every topic.
// Prefer this over looping getVocabAPI per topic (N+1).
// BE: GET /vocabulary/get-all-vocabulary-by-id-user/:idUser
export const getAllVocabByUserAPI = async (idUser) => {
  try {
    const response = await API.get(
      `/vocabulary/get-all-vocabulary-by-id-user/${idUser}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching all vocabulary by user:", error);
    throw error;
  }
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
    // SM-2 (Wozniak 1987): quality < 3 resets repetitions=0, interval=1.
    // Allow full 0-5 range so wrong answers can reset progress (previously
    // clamped to max(3,...) which made the reset branch unreachable).
    const safeQuality = Math.min(5, Math.max(0, Math.round(quality)));
    const response = await API.post("/vocabulary/review", {
      idVocab,
      idUser,
      quality: safeQuality,
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

// Vocab Daily Exercise APIs
export const getDailyVocabAPI = async (idUser, limit = 10) => {
  try {
    const response = await API.get("/vocabulary/daily", {
      params: { idUser, limit: limit || 10 },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching daily vocab:", error);
    throw error;
  }
};

export const completeDailyVocabAPI = async (idUser, answers) => {
  try {
    const response = await API.post("/vocabulary/daily/complete", {
      idUser,
      answers,
    });
    return response.data;
  } catch (error) {
    console.error("Error completing daily vocab:", error);
    throw error;
  }
};

export const getVocabStatsAPI = async (idUser) => {
  try {
    const response = await API.get(`/vocabulary/stats/${idUser}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching vocab stats:", error);
    throw error;
  }
};

export const getDailySessionAPI = async (idUser, quota = 15) => {
  try {
    const response = await API.get('/vocabulary/daily-session', {
      params: { idUser, quota },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily session:', error);
    throw error;
  }
};

export const saveToCollectionAPI = async (idUser, vocabId, topicId) => {
  try {
    const response = await API.post('/vocabulary/save-to-collection', {
      idUser,
      vocabId,
      topicId,
    });
    return response.data;
  } catch (error) {
    console.error('Error saving word to collection:', error);
    throw error;
  }
};

// Practice APIs
export const getRandomWordsAPI = async (idUser, count = 20, mode = 'flashcard') => {
  try {
    const response = await API.get('/vocabulary/practice/random', {
      params: { idUser, count, mode },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching random words:', error);
    throw error;
  }
};

export const submitPracticeAPI = async (idUser, mode, answers) => {
  try {
    const response = await API.post('/vocabulary/practice/submit', {
      idUser,
      mode,
      answers,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting practice:', error);
    throw error;
  }
};
