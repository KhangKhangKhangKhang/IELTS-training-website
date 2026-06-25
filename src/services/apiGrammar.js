import API from "./axios.custom";

export const createGrammarCategoriesAPI = async (data) => {
  const res = await API.post(
    "/grammar-categories/create-grammar-categories",
    data
  );
  return res.data;
};

export const getGrammarCategoriesUserAPI = async (idUser) => {
  const res = await API.get(
    `/grammar-categories/get-user-grammar-categories/${idUser}`
  );
  return res.data;
};

export const getGrammarInCategories = async (idGrammarCategories) => {
  const res = await API.get(
    `/grammar-categories/get-grammar-category/${idGrammarCategories}`
  );
  return res.data;
};

export const updateGrammarCategoriesAPI = async (
  data,
  idGrammarCategories,
  idUser
) => {
  const res = await API.patch(
    `/grammar-categories/update-grammar-category/${idGrammarCategories}/${idUser}`,
    data
  );
  return res.data;
};

export const deleteGrammarCategoriesAPI = async (
  idGrammarCategories,
  idUser
) => {
  const res = await API.delete(
    `/grammar-categories/delete-grammar-category/${idGrammarCategories}/${idUser}`
  );
  return res.data;
};

//grammar
export const createGrammarAPI = async (data, idUser) => {
  const res = await API.post(`/grammar/create-grammar/${idUser}`, data);
  return res.data;
};

export const getAllGrammarAPI = async () => {
  const res = await API.get(`/grammar/all-grammar`);
  return res.data;
};

export const getGrammarByCategoriesUserAPI = async (
  idGrammarCategories,
  idUser
) => {
  const res = await API.get(
    `/grammar/grammar-by-user-category/${idGrammarCategories}/${idUser}`
  );
  return res.data;
};

export const updateGrammarAPI = async (data, idGrammar, idUser) => {
  const res = await API.patch(
    `/grammar/update-grammar/${idGrammar}/${idUser}`,
    data
  );
  return res.data;
};

export const deleteGrammarAPI = async (idGrammar, idUser) => {
  const res = await API.delete(
    `/grammar/delete-grammar/${idGrammar}/${idUser}`
  );
  return res.data;
};

export const addGrammarToCategoryAPI = async (
  idGrammarCategories,
  idGrammar,
  idUser
) => {
  const res = await API.post(
    `/grammar/add-grammar-to-category/${idGrammarCategories}/${idGrammar}/${idUser}`
  );
  return res.data;
};

export const removeGrammarFromCategoryAPI = async (
  idGrammarCategories,
  idGrammar,
  idUser
) => {
  const res = await API.delete(
    `/grammar/remove-grammar-from-category/${idGrammarCategories}/${idGrammar}/${idUser}`
  );
  return res.data;
};

export const createGrammarWithoutCategoryAPI = async (data, idUser) => {
  const res = await API.post(`/grammar/create-grammar-alone/${idUser}`, data);
  return res.data;
};

export const getSystemCategoriesAPI = async () => {
  const res = await API.get('/grammar/categories/system');
  return res.data;
};

// Dashboard - get weak areas + all topics with proficiency
export const getGrammarDashboardAPI = async (idUser) => {
  const res = await API.get(`/grammar/dashboard?idUser=${idUser}`);
  return res.data;
};

// Practice by topic
export const getGrammarPracticeByTopicAPI = async (idGrammar, count = 10) => {
  const res = await API.get(`/grammar/${idGrammar}/practice?count=${count}`);
  return res.data;
};

// Due reviews (spaced repetition)
export const getGrammarDueReviewsAPI = async (idUser, idGrammar) => {
  const res = await API.get(`/grammar/${idGrammar}/due-reviews?idUser=${idUser}`);
  return res.data;
};

// Save violation from writing/speaking
export const saveGrammarViolationAPI = async (data) => {
  const res = await API.post('/grammar/violation', data);
  return res.data;
};

// Submit a single grammar exercise answer. BE grades, updates per-topic
// proficiency, and schedules SM-2 spaced repetition. Returns
// { isCorrect, correctAnswer, explanation, nextReviewAt, srInterval, proficiency }.
export const submitGrammarAnswerAPI = async (
  idGrammar,
  idExercise,
  userAnswer,
) => {
  const res = await API.post(`/grammar/practice/${idGrammar}/answer`, {
    idExercise,
    userAnswer,
  });
  return res?.data?.data ?? res?.data;
};

// List grammar topics (used by grammar dashboard / index page).
// BE has GET /grammar/all-grammar + GET /grammar/dashboard. We map from
// dashboard.allTopics (preferred) so the shape matches what grammar/index.jsx
// expects: [{ idGrammar, title, exerciseCount }].
export const getGrammarTopicsAPI = async () => {
  // Read dashboard from localStorage (set by GrammarStudentView) or return empty.
  // Caller (grammar/index.jsx) wraps in try/catch and degrades gracefully.
  try {
    const cached = localStorage.getItem('grammarDashboard');
    if (cached) {
      const parsed = JSON.parse(cached);
      const topics = parsed?.allTopics ?? [];
      return Array.isArray(topics) ? topics : [];
    }
  } catch {
    // ignore
  }
  return [];
};

// Recommended grammar topics to focus on (weak areas + due reviews).
// Maps from cached dashboard.weakAreas (top 3).
export const getGrammarRecommendationsAPI = async () => {
  try {
    const cached = localStorage.getItem('grammarDashboard');
    if (cached) {
      const parsed = JSON.parse(cached);
      const weak = parsed?.weakAreas ?? [];
      return Array.isArray(weak) ? weak.slice(0, 3) : [];
    }
  } catch {
    // ignore
  }
  return [];
};

// Learning summary for the student Grammar hero card
export const getGrammarLearningSummaryAPI = async (idUser) => {
  const res = await API.get(`/grammar/learning-summary/${idUser}`);
  return res.data;
};

// Topics list for a category with proficiency/accuracy
export const getGrammarLearningTopicsAPI = async (idUser, idGrammarCategory) => {
  const res = await API.get(
    `/grammar/learning-topics/${idUser}/${idGrammarCategory}`
  );
  return res.data;
};
