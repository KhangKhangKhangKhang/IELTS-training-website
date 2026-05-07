import API from "./axios.custom";

// =============================================================================
// USER SIDE - Request teacher review
// =============================================================================

export const requestTeacherReviewAPI = async (idTestResult, idUser, data = {}) => {
  const res = await API.post(
    `/teacher-review/request-review/${idTestResult}/${idUser}`,
    data
  );
  return res.data;
};

// =============================================================================
// TEACHER SIDE - Queue and ticket management
// =============================================================================

export const getTeacherQueueAPI = async (idTeacher) => {
  const res = await API.get(`/teacher-review/queue/${idTeacher}`);
  return res.data;
};

export const getAllPendingTicketsAPI = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.type) params.append("type", filters.type);
  if (filters.status) params.append("status", filters.status);

  const queryString = params.toString();
  const endpoint = queryString
    ? `/teacher-review/pending-tickets?${queryString}`
    : "/teacher-review/pending-tickets";

  const res = await API.get(endpoint);
  return res.data;
};

export const claimTicketAPI = async (idTeacher, idTicket) => {
  const res = await API.post(
    `/teacher-review/claim-ticket/${idTeacher}/${idTicket}`
  );
  return res.data;
};

export const unclaimTicketAPI = async (idTeacher, idTicket) => {
  const res = await API.post(
    `/teacher-review/unclaim-ticket/${idTeacher}/${idTicket}`
  );
  return res.data;
};

export const submitTeacherScoreAPI = async (idTeacher, idTicket, data) => {
  const res = await API.patch(
    `/teacher-review/submit-score/${idTeacher}/${idTicket}`,
    data
  );
  return res.data;
};

export const getTicketDetailAPI = async (idTicket) => {
  const res = await API.get(`/teacher-review/ticket/${idTicket}`);
  return res.data;
};

export const getTeacherEarningsAPI = async (idTeacher) => {
  const res = await API.get(`/teacher-review/earnings/${idTeacher}`);
  return res.data;
};

export const getTeacherCompletedTicketsAPI = async (idTeacher) => {
  const res = await API.get(`/teacher-review/completed/${idTeacher}`);
  return res.data;
};