import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Modal, message, Spin } from "antd"; // Import UI từ Antd
import {
  getOverallScroreAPI,
  getAvgScoreByDayAPI,
  getTestResultByIdUserAPI,
  getRecomendedTestsAPI,
  getTargetScoresAPI,
  updateTargetScoresAPI,
} from "@/services/apiStatistics";
import { StartTestAPI } from "@/services/apiDoTest"; // Import API bắt đầu làm bài
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Calendar,
  Target,
  Award,
  Clock,
  ChevronRight,
  X,
  Filter,
} from "lucide-react";
import { useAuth } from "@/context/authContext";

// --- Components Con (SkillCard, TestDetailModal) ---
// (Giữ nguyên code UI nhỏ này như cũ cho gọn)
const SkillCard = ({ type, score, icon: Icon, color }) => (
  <div className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm text-gray-500 font-medium mb-1">{type}</p>
      <h3 className="text-3xl font-bold text-gray-800">{score}</h3>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

const TestDetailModal = ({ result, onClose }) => {
  if (!result) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-50">
          <div>
            <h3 className="text-xl font-bold text-purple-900">
              {result.test?.title || "Test Detail"}
            </h3>
            <p className="text-sm text-purple-600">
              Ngày làm: {new Date(result.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-100 rounded-full transition-colors"
          >
            <X size={24} className="text-purple-700" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-500">Score</p>
              <p className="text-xl font-bold text-blue-600">{result.score}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-500">Correct</p>
              <p className="text-xl font-bold text-green-600">
                {result.total_correct}/{result.total_questions}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-500">ID</p>
              <p className="text-xs font-mono text-gray-600 truncate px-2">
                {result.idTestResult.slice(0, 8)}...
              </p>
            </div>
          </div>
          {/* Detail Answers */}
          <div className="space-y-2">
            {result.userAnswer?.length > 0 ? (
              result.userAnswer.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border text-sm flex justify-between ${
                    ans.isCorrect
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <span>{ans.answerText}</span>
                  <span className="font-bold">
                    {ans.isCorrect ? "Đúng" : "Sai"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 italic">
                Chưa có dữ liệu chi tiết
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const idUser = user?.idUser;
  // --- Data States ---
  const [overall, setOverall] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [history, setHistory] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [target, setTarget] = useState({
    targetBandScore: 0,
    targetExamDate: null,
  });

  // --- UI States ---
  const [loading, setLoading] = useState(true);
  const [selectedTestDetail, setSelectedTestDetail] = useState(null); // Modal xem lịch sử
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState({});

  // --- START TEST STATES (Mới thêm) ---
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
  const [selectedExamToStart, setSelectedExamToStart] = useState(null);
  const [startingTest, setStartingTest] = useState(false);

  // --- FILTER STATES ---
  const [filterYear, setFilterYear] = useState(new Date().getFullYear()); // Mặc định năm nay
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1); // Mặc định tháng này
  const [selectedSkillType, setSelectedSkillType] = useState("ALL");

  // Call API ban đầu
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resOverall, resChart, resHistory, resRec, resTarget] =
          await Promise.all([
            getOverallScroreAPI(idUser),
            getAvgScoreByDayAPI(idUser),
            getTestResultByIdUserAPI(idUser),
            getRecomendedTestsAPI(idUser),
            getTargetScoresAPI(idUser),
          ]);

        if (resOverall) setOverall(resOverall);
        if (resChart?.data) setChartData(resChart.data);
        if (resHistory?.data) setHistory(resHistory.data);
        if (resRec) setRecommended(resRec);
        if (resTarget?.data) {
          setTarget(resTarget.data);
          setTempTarget(resTarget.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [idUser]);

  // --- LOGIC 1: Xử lý Start Test (Copy từ TestPage) ---
  const handleRecommendClick = (test) => {
    setSelectedExamToStart(test);
    setConfirmStartOpen(true);
  };

  const handleConfirmStart = async () => {
    if (!idUser || !selectedExamToStart) return;

    setStartingTest(true);
    try {
      const res = await StartTestAPI(idUser, selectedExamToStart.idTest, {});
      const testResultData = res?.data;

      if (testResultData?.idTestResult) {
        message.success("Bắt đầu làm bài!");
        setConfirmStartOpen(false);

        // Navigate sang trang làm bài
        navigate("/doTest", {
          state: {
            idTest: selectedExamToStart.idTest,
            testType: selectedExamToStart.testType,
            duration: selectedExamToStart.duration,
            initialTestResult: testResultData,
          },
        });
      } else {
        message.error("Không khởi tạo được bài thi.");
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi bắt đầu bài thi.");
    } finally {
      setStartingTest(false);
    }
  };

  // --- LOGIC 2: Xử lý Target ---
  const handleUpdateTarget = async () => {
    try {
      await updateTargetScoresAPI(idUser, tempTarget);
      setTarget(tempTarget);
      setIsEditingTarget(false);
    } catch (e) {
      console.error(e);
    }
  };

  // --- LOGIC 3: Xử lý Filter Biểu Đồ (Nâng cấp) ---
  const filteredChartData = useMemo(() => {
    if (!chartData) return [];

    // Nếu chọn "ALL" ở filterYear -> Lấy hết (Toàn thời gian)
    if (filterYear === "ALL") return chartData;

    return chartData.filter((item) => {
      const d = new Date(item.date);
      const matchYear = d.getFullYear() === parseInt(filterYear);

      // Nếu chọn "ALL" ở filterMonth -> Lấy cả năm đó
      if (filterMonth === "ALL") {
        return matchYear;
      }
      // Nếu chọn tháng cụ thể -> Lấy đúng tháng năm
      return matchYear && d.getMonth() + 1 === parseInt(filterMonth);
    });
  }, [chartData, filterMonth, filterYear]);

  const getSkillScore = (type) =>
    overall?.details?.find((d) => d.type === type)?.avg || 0;

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center text-purple-600">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      {/* Header & Target Box */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Tổng quan
          </h1>
          <p className="text-gray-500">
            Chào mừng trở lại! Cùng xem tiến độ học tập của bạn.
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Target className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Mục tiêu
              </p>
              <p className="text-xl font-bold text-purple-700">
                {target.targetBandScore || "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditingTarget(true)}
            className="text-purple-600 text-xs underline font-bold"
          >
            Sửa
          </button>
        </div>
      </div>

      {/* 4 Cards Kỹ Năng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SkillCard
          type="READING"
          score={getSkillScore("READING")}
          icon={BookOpen}
          color="bg-blue-500"
        />
        <SkillCard
          type="LISTENING"
          score={getSkillScore("LISTENING")}
          icon={Headphones}
          color="bg-green-500"
        />
        <SkillCard
          type="WRITING"
          score={getSkillScore("WRITING")}
          icon={PenTool}
          color="bg-yellow-500"
        />
        <SkillCard
          type="SPEAKING"
          score={getSkillScore("SPEAKING")}
          icon={Mic}
          color="bg-red-500"
        />
      </div>

      {/* --- PHẦN BIỂU ĐỒ & ĐỀ XUẤT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Cột Trái: Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              Tiến độ học tập
            </h3>

            <div className="flex gap-2 items-center flex-wrap">
              {/* 1. Chọn Kỹ Năng */}
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100 mr-2">
                <Filter size={16} className="text-purple-600" />
                <select
                  className="bg-transparent text-sm font-medium text-purple-900 focus:outline-none cursor-pointer"
                  value={selectedSkillType}
                  onChange={(e) => setSelectedSkillType(e.target.value)}
                >
                  <option value="ALL">Tất cả kỹ năng</option>
                  <option value="OVERALL">Overall Band</option>
                  <option value="READING">Reading</option>
                  <option value="LISTENING">Listening</option>
                  <option value="WRITING">Writing</option>
                  <option value="SPEAKING">Speaking</option>
                </select>
              </div>

              {/* 2. Chọn Tháng (Thêm option ALL) */}
              <select
                className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 focus:outline-none disabled:opacity-50"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                disabled={filterYear === "ALL"} // Nếu chọn Toàn thời gian thì disable tháng
              >
                <option value="ALL">Cả năm</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>

              {/* 3. Chọn Năm (Thêm option ALL) */}
              <select
                className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 focus:outline-none"
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  // Nếu chọn All Time thì reset tháng về All
                  if (e.target.value === "ALL") setFilterMonth("ALL");
                }}
              >
                <option value="ALL">Toàn thời gian</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {filteredChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      // Nếu xem toàn thời gian thì hiện Tháng/Năm cho dễ nhìn
                      return filterYear === "ALL" || filterMonth === "ALL"
                        ? `${d.getDate()}/${d.getMonth() + 1}`
                        : d.getDate();
                    }}
                  />
                  <YAxis domain={[0, 9]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />

                  {/* Render Lines based on selection */}
                  {(selectedSkillType === "ALL" ||
                    selectedSkillType === "OVERALL") && (
                    <Line
                      name="Overall"
                      type="monotone"
                      dataKey="OVERALL"
                      stroke="#8884d8"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  )}
                  {(selectedSkillType === "ALL" ||
                    selectedSkillType === "READING") && (
                    <Line
                      name="Reading"
                      type="monotone"
                      dataKey="READING"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {(selectedSkillType === "ALL" ||
                    selectedSkillType === "LISTENING") && (
                    <Line
                      name="Listening"
                      type="monotone"
                      dataKey="LISTENING"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {(selectedSkillType === "ALL" ||
                    selectedSkillType === "WRITING") && (
                    <Line
                      name="Writing"
                      type="monotone"
                      dataKey="WRITING"
                      stroke="#eab308"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {(selectedSkillType === "ALL" ||
                    selectedSkillType === "SPEAKING") && (
                    <Line
                      name="Speaking"
                      type="monotone"
                      dataKey="SPEAKING"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Chưa có dữ liệu học tập phù hợp
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải: Recommended Tests (ĐÃ CÓ ONCLICK) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" /> Đề xuất cho bạn
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar max-h-[400px]">
            {recommended.map((test) => (
              <div
                key={test.idTest}
                onClick={() => handleRecommendClick(test)} // <--- BẮT SỰ KIỆN CLICK Ở ĐÂY
                className="flex gap-4 p-3 border border-gray-100 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all cursor-pointer group"
              >
                <img
                  src={test.img || "https://placehold.co/100"}
                  alt=""
                  className="w-16 h-16 rounded object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-purple-700">
                    {test.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {test.testType}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> {test.duration}p
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recommended.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-10">
                Chưa có đề xuất nào mới.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bảng Lịch sử */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold mb-4">Lịch sử làm bài</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
              <tr>
                <th className="p-3">Bài thi</th>
                <th className="p-3">Kỹ năng</th>
                <th className="p-3">Điểm</th>
                <th className="p-3">Ngày</th>
                <th className="p-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((item) => (
                <tr key={item.idTestResult} className="hover:bg-purple-50">
                  <td className="p-3 font-medium max-w-[200px] truncate">
                    {item.test?.title}
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {item.test?.testType}
                    </span>
                  </td>
                  <td className="p-3 font-bold">{item.score}</td>
                  <td className="p-3 text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedTestDetail(item)}
                      className="text-purple-600 font-bold text-xs flex items-center justify-end gap-1 ml-auto"
                    >
                      Chi tiết <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CÁC POPUP/MODAL --- */}

      {/* 1. Modal sửa mục tiêu */}
      {isEditingTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-96 shadow-lg">
            <h3 className="font-bold text-lg mb-4">Cập nhật mục tiêu</h3>
            <div className="space-y-4">
              <input
                className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-200 outline-none"
                type="number"
                step="0.5"
                max="9"
                placeholder="Band Score"
                value={tempTarget.targetBandScore}
                onChange={(e) =>
                  setTempTarget({
                    ...tempTarget,
                    targetBandScore: e.target.value,
                  })
                }
              />
              <input
                className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-200 outline-none"
                type="date"
                value={
                  tempTarget.targetExamDate
                    ? tempTarget.targetExamDate.split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setTempTarget({
                    ...tempTarget,
                    targetExamDate: e.target.value,
                  })
                }
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsEditingTarget(false)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateTarget}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Chi tiết lịch sử */}
      <TestDetailModal
        result={selectedTestDetail}
        onClose={() => setSelectedTestDetail(null)}
      />

      {/* 3. Modal Xác nhận làm bài (Recommended) - MỚI */}
      <Modal
        title="Xác nhận làm bài"
        open={confirmStartOpen}
        onOk={handleConfirmStart}
        onCancel={() => setConfirmStartOpen(false)}
        confirmLoading={startingTest}
        okText="Bắt đầu ngay"
        cancelText="Để sau"
        okButtonProps={{ className: "bg-purple-600 hover:bg-purple-700" }}
      >
        <p>
          Bạn có muốn bắt đầu làm đề thi được đề xuất:{" "}
          <strong>{selectedExamToStart?.title}</strong>?
        </p>
        <div className="bg-blue-50 text-blue-700 p-3 rounded mt-3 text-sm">
          <p>
            • Thời gian: <strong>{selectedExamToStart?.duration} phút</strong>
          </p>
          <p>• Kỹ năng: {selectedExamToStart?.testType}</p>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
