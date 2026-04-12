import API from "./axios.custom";

const unwrapData = (payload) => payload?.data ?? payload;

export const getDashboardOverviewAPI = async () => {
  const res = await API.get("/dashboard/overview");
  const data = unwrapData(res.data) || {};

  return {
    totalStudents: Number(data.totalStudents ?? 0),
    testsThisMonth: Number(data.testsThisMonth ?? 0),
    avgBandScore: Number(data.avgBandScore ?? 0),
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
