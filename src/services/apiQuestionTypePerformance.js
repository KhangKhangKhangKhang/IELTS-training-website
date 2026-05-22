// src/services/apiQuestionTypePerformance.js
import API from "./axios.custom";

// Get all question type performance for a user
export const getAllQuestionTypePerformanceAPI = async (idUser) => {
  const res = await API.get(`/question-type-performance/all/${idUser}`);
  return res.data;
};

// Get weak question types (errorRate >= 40%, attempts >= 3)
export const getWeakQuestionTypesAPI = async (idUser) => {
  const res = await API.get(`/question-type-performance/weak/${idUser}`);
  return res.data;
};