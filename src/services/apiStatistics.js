// src/services/apiStatistics.js
import API from "./axios.custom";

// 1. Lấy điểm tổng quan (4 kỹ năng)
export const getOverallScroreAPI = async (idUser) => {
  const res = await API.get(`/statistics/overall-score/${idUser}`);
  return res.data;
};

// 2. Lấy dữ liệu biểu đồ theo ngày
export const getAvgScoreByDayAPI = async (idUser) => {
  const res = await API.get(`/statistics/get-avg-score-by-day/${idUser}`);
  return res.data;
};

// 3. Lấy lịch sử làm bài thi (Test Result)
export const getTestResultByIdUserAPI = async (idUser) => {
  const res = await API.get(
    `/user-test-result/get-all-test-result-by-id-user/${idUser}`
  );
  return res.data;
};

// 4. Lấy danh sách đề thi đề xuất (Recommended)
export const getRecomendedTestsAPI = async (idUser) => {
  // Lưu ý: Đường dẫn API của bạn trong prompt là {idUser}, cần truyền đúng value
  const res = await API.get(`/recommend-test/get-recommend-test/${idUser}`);
  return res.data;
};

// 5. Lấy mục tiêu (Target)
export const getTargetScoresAPI = async (idUser) => {
  const res = await API.get(`/statistics/get-target/${idUser}`);
  return res.data;
};

// 6. Cập nhật mục tiêu
export const updateTargetScoresAPI = async (idUser, data) => {
  // data format: { targetBandScore: number, targetExamDate: string (YYYY-MM-DD) }
  const res = await API.patch(`/statistics/target/${idUser}`, data);
  return res.data;
};
