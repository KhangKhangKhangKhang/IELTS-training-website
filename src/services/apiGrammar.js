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
