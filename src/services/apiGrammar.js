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

export const getGrammarCategoriesAPI = async (idGrammarCategories) => {
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

export const createGrammarAPI = async (data) => {
  const res = await API.create(`/grammar/create-grammar`, data);
  return res.data;
};

export const getAllGrammarAPI = async (idGrammarCategories) => {
  const res = await API.get(`/grammar/get-all-grammar/${idGrammarCategories}`);
  return res.data;
};

export const getGrammarAPI = async (idGrammar) => {
  const res = await API.get(`/grammar/get-grammar/${idGrammar}`);
  return res.data;
};

export const updateGrammarAPI = async (data, idGrammar) => {
  const res = await API.put(`/grammar/update-grammar/${idGrammar}`, data);
  return res.data;
};

export const deleteGrammarAPI = async (idGrammar) => {
  const res = await API.delete(`/grammar/delete-grammar/${idGrammar}`);
  return res.data;
};
