import API from "./axios.custom";

/**
 * PDF Exam Import Service
 * Handles extraction, review, and saving of PDF-based exam content
 */

// POST /pdf-exam/extract - Upload PDF and extract content
export const extractPdfExamAPI = async ({ file, testType, title, level }) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("testType", testType);
  if (title) formData.append("title", title);
  if (level) formData.append("level", level);

  const res = await API.post("/pdf-exam/extract", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// GET /pdf-exam/session/:idSession - Retrieve session data
export const getPdfExamSessionAPI = async (idSession) => {
  const res = await API.get(`/pdf-exam/session/${idSession}`);
  return res.data;
};

// PATCH /pdf-exam/session/:idSession - Update extracted data (for edits)
export const updatePdfExamSessionAPI = async (idSession, payload) => {
  const res = await API.patch(`/pdf-exam/session/${idSession}`, payload);
  return res.data;
};

// POST /pdf-exam/save/:idSession - Save session to DB
export const savePdfExamSessionAPI = async (idSession, idUser) => {
  const res = await API.post(`/pdf-exam/save/${idSession}`, { idUser });
  return res.data;
};

// DELETE /pdf-exam/session/:idSession - Discard session
export const deletePdfExamSessionAPI = async (idSession) => {
  const res = await API.delete(`/pdf-exam/session/${idSession}`);
  return res.data;
};
