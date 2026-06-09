import API from "./axios.custom";

const unwrapData = (payload) => payload?.data ?? payload;

export const getDashboardOverviewAPI = async () => {
  const res = await API.get("/dashboard/overview");
  const data = unwrapData(res.data) || {};

  return {
    totalStudents: Number(data.totalStudents ?? 0),
    testsThisMonth: Number(data.testsThisMonth ?? 0),
    avgBandScore: Number(data.avgBandScore ?? 0),
    reviewsThisWeek: Number(data.reviewsThisWeek ?? 0),
    reviewsLastWeek: Number(data.reviewsLastWeek ?? 0),
    reviewsToday: Number(data.reviewsToday ?? 0),
  };
};

export const getDashboardSkillPerformanceAPI = async () => {
  const res = await API.get("/dashboard/skills");
  const data = unwrapData(res.data) || {};

  return {
    LISTENING: Number(data.LISTENING ?? 0),
    READING: Number(data.READING ?? 0),
    WRITING: Number(data.WRITING ?? 0),
    SPEAKING: Number(data.SPEAKING ?? 0),
  };
};

export const getDashboardTopStreaksAPI = async () => {
  const res = await API.get("/dashboard/top-streaks");
  const data = unwrapData(res.data);
  return Array.isArray(data) ? data : [];
};

export const getDashboardTopPerformersAPI = async () => {
  const res = await API.get("/dashboard/top-performers");
  const data = unwrapData(res.data);
  return Array.isArray(data) ? data : [];
};

// Submissions queue = pending review tickets (from teacher-review module).
// The endpoint does not support `limit` yet, so we slice client-side.
export const getRecentSubmissionsAPI = async (limit = 5) => {
  const res = await API.get("/teacher-review/pending-tickets?status=PENDING");
  const list = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.slice(0, limit);
};
