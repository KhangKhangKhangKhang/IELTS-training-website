import API from './axios.custom';

// =============================================================================
// STUDENT SIDE - Request & Track Teacher Review
// =============================================================================

/**
 * Check if student already has a pending/claimed ticket for this test result
 */
export const checkStudentTicketAPI = async (idTestResult) => {
  const res = await API.get(`/teacher-review/student/check/${idTestResult}`);
  return res.data;
};

/**
 * Get all tickets for a student
 */
export const getStudentTicketsAPI = async (idUser, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const queryString = params.toString();
  const endpoint = queryString
    ? `/teacher-review/student/${idUser}/tickets?${queryString}`
    : `/teacher-review/student/${idUser}/tickets`;

  const res = await API.get(endpoint);
  return res.data;
};

/**
 * Cancel a pending ticket
 */
export const cancelTicketAPI = async (idTicket) => {
  const res = await API.patch(`/teacher-review/${idTicket}/cancel`);
  return res.data;
};

/**
 * Request teacher review for a test result (Student)
 */
export const requestTeacherReviewAPI = async (idTestResult, idUser) => {
  const res = await API.post(`/teacher-review/request-review/${idTestResult}/${idUser}`);
  return res.data;
};

// =============================================================================
// TEACHER SIDE - Queue & Ticket Management (Additional endpoints)
// =============================================================================

/**
 * Get teacher's completed tickets (history)
 */
export const getTeacherCompletedTicketsAPI = async (idTeacher) => {
  const res = await API.get(`/teacher-review/completed/${idTeacher}`);
  return res.data;
};

/**
 * Get teacher earnings
 */
export const getTeacherEarningsAPI = async (idTeacher) => {
  const res = await API.get(`/teacher-review/earnings/${idTeacher}`);
  return res.data;
};

// =============================================================================
// ADMIN SIDE - Management & Configuration
// =============================================================================

/**
 * Get all tickets (admin) with filters and pagination
 */
export const getAllTicketsAdminAPI = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.type) params.append('type', filters.type);
  if (filters.teacherId) params.append('teacherId', filters.teacherId);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const queryString = params.toString();
  const endpoint = queryString
    ? `/teacher-review/all?${queryString}`
    : '/teacher-review/all';

  const res = await API.get(endpoint);
  return res.data;
};

/**
 * Get ticket statistics (admin dashboard)
 */
export const getTicketStatsAPI = async () => {
  const res = await API.get('/teacher-review/stats');
  return res.data;
};

/**
 * Get teachers with their current workload
 */
export const getTeachersLoadAPI = async () => {
  const res = await API.get('/teacher-review/teachers/load');
  return res.data;
};

/**
 * Get ticket detail (for viewing)
 */
export const getTicketDetailAPI = async (idTicket) => {
  const res = await API.get(`/teacher-review/ticket/${idTicket}`);
  return res.data;
};

// =============================================================================
// SYSTEM CONFIG - Commission & Assign Mode
// =============================================================================

/**
 * Get commission config
 */
export const getCommissionConfigAPI = async () => {
  const res = await API.get('/system-config/teacher-review/commission');
  return res.data;
};

/**
 * Update commission config
 */
export const updateCommissionConfigAPI = async (data) => {
  const res = await API.put('/system-config/teacher-review/commission', data);
  return res.data;
};

/**
 * Get assign mode
 */
export const getAssignModeAPI = async () => {
  const res = await API.get('/system-config/teacher-review/assign-mode');
  return res.data;
};

/**
 * Update assign mode
 */
export const updateAssignModeAPI = async (mode) => {
  const res = await API.put('/system-config/teacher-review/assign-mode', { mode });
  return res.data;
};
