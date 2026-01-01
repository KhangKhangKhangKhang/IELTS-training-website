import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, message, Spin } from "antd";
import {
  getOverallScroreAPI,
  getAvgScoreByDayAPI,
  getTestResultByIdUserAPI,
  getRecomendedTestsAPI,
  getTargetScoresAPI,
  updateTargetScoresAPI,
} from "@/services/apiStatistics";
import { StartTestAPI } from "@/services/apiDoTest";
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
  Filter,
  ChevronLeft, // Import thêm icon cho pagination
} from "lucide-react";
import { useAuth } from "@/context/authContext";

// --- IMPORT COMPONENT REVIEW MỚI ---
import SimpleResultModal from "@/components/test/SimpleResultModal";

// --- Components Con (SkillCard) ---
const SkillCard = ({ type, score, icon: Icon, color }) => (
  <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
        {type}
      </p>
      <h3 className="text-3xl font-bold text-gray-800 dark:text-white">
        {score}
      </h3>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

// --- Helper: Get Default Test Image ---
const getDefaultTestImage = (testType) => {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");

  // Gradient backgrounds based on test type
  const gradients = {
    READING: ["#3b82f6", "#06b6d4"],
    LISTENING: ["#10b981", "#059669"],
    WRITING: ["#8b5cf6", "#ec4899"],
    SPEAKING: ["#f59e0b", "#ef4444"],
  };

  const colors = gradients[testType] || ["#6b7280", "#4b5563"];
  const gradient = ctx.createLinearGradient(0, 0, 400, 400);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 400);

  // Add icon text
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "bold 80px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const icons = {
    READING: "📖",
    LISTENING: "🎧",
    WRITING: "✍️",
    SPEAKING: "🎤",
  };

  ctx.fillText(icons[testType] || "📝", 200, 200);

  return canvas.toDataURL("image/png");
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
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState({});

  // --- START TEST STATES ---
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
  const [selectedExamToStart, setSelectedExamToStart] = useState(null);
  const [startingTest, setStartingTest] = useState(false);

  // --- FILTER CHART STATES ---
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [selectedSkillType, setSelectedSkillType] = useState("ALL");

  // --- FILTER & PAGINATION HISTORY STATES ---
  const [historyPage, setHistoryPage] = useState(1);
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const ITEMS_PER_PAGE = 5;

  // --- API CALLS ---
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

  // --- LOGIC 1: Xử lý Target & Countdown ---
  const targetInfo = useMemo(() => {
    if (!target.targetExamDate) return null;

    const now = new Date();
    const examDate = new Date(target.targetExamDate);

    const formattedDate = examDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const diffTime = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      formattedDate,
      daysLeft: diffDays > 0 ? diffDays : 0,
      isPassed: diffDays < 0,
    };
  }, [target.targetExamDate]);

  const handleUpdateTarget = async () => {
    try {
      await updateTargetScoresAPI(idUser, tempTarget);
      setTarget(tempTarget);
      setIsEditingTarget(false);
    } catch (e) {
      console.error(e);
      message.error("Cập nhật mục tiêu thất bại");
    }
  };

  // --- LOGIC 2: Xử lý Start Test ---
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

  // --- LOGIC 3: Xử lý Filter Chart ---
  const filteredChartData = useMemo(() => {
    if (!chartData) return [];
    if (filterYear === "ALL") return chartData;

    return chartData.filter((item) => {
      const d = new Date(item.date);
      const matchYear = d.getFullYear() === parseInt(filterYear);
      if (filterMonth === "ALL") return matchYear;
      return matchYear && d.getMonth() + 1 === parseInt(filterMonth);
    });
  }, [chartData, filterMonth, filterYear]);

  // --- LOGIC 4: Xử lý Filter & Pagination History ---
  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (historyFilter === "ALL") return history;
    return history.filter((item) => item.test?.testType === historyFilter);
  }, [history, historyFilter]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHistory, historyPage]);

  // Reset page về 1 khi đổi filter
  useEffect(() => {
    setHistoryPage(1);
  }, [historyFilter]);

  const getSkillScore = (type) =>
    overall?.details?.find((d) => d.type === type)?.avg || 0;

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center text-purple-600 dark:bg-slate-900">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300">
      {/* --- HEADER & TARGET INFO BAR --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Tổng quan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Chào mừng trở lại! Cùng theo dõi tiến độ và đếm ngược tới ngày thi.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-purple-100 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center">
          {/* Target Info Blocks */}
          <div className="flex items-center gap-4 px-6 py-4 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-slate-700 min-w-[160px]">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
              <Target
                className="text-purple-600 dark:text-purple-400"
                size={24}
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                Target
              </p>
              <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-400">
                {target.targetBandScore || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6 py-4 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-slate-700 min-w-[180px]">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
              <Calendar
                className="text-blue-600 dark:text-blue-400"
                size={24}
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                Ngày thi
              </p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {targetInfo?.formattedDate || "--/--/----"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6 py-4 min-w-[180px]">
            <div
              className={`${
                targetInfo?.daysLeft <= 30 ? "bg-red-100" : "bg-green-100"
              } p-3 rounded-xl transition-colors`}
            >
              <Clock
                className={`${
                  targetInfo?.daysLeft <= 30 ? "text-red-600" : "text-green-600"
                }`}
                size={24}
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                Còn lại
              </p>
              <div className="flex items-baseline gap-1">
                <p
                  className={`text-2xl font-extrabold ${
                    targetInfo?.daysLeft <= 30
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {targetInfo ? targetInfo.daysLeft : "--"}
                </p>
                <span className="text-xs font-semibold text-gray-500">
                  ngày
                </span>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:pl-0">
            <button
              onClick={() => setIsEditingTarget(true)}
              className="w-full sm:w-auto h-full px-4 py-2 text-sm font-bold text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all border border-transparent hover:border-purple-200"
            >
              Sửa
            </button>
          </div>
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
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              Tiến độ học tập
            </h3>
            <div className="flex gap-2 items-center flex-wrap">
              {/* Filter Skill */}
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-slate-700 rounded-lg border border-purple-100 dark:border-slate-600 mr-2">
                <Filter size={16} className="text-purple-600" />
                <select
                  className="bg-transparent text-sm font-medium text-purple-900 dark:text-white dark:bg-slate-700 focus:outline-none cursor-pointer"
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
              {/* Filter Month */}
              <select
                className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-800 dark:text-white rounded-lg p-2 focus:outline-none disabled:opacity-50"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                disabled={filterYear === "ALL"}
              >
                <option value="ALL">Cả năm</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
              {/* Filter Year */}
              <select
                className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-800 dark:text-white rounded-lg p-2 focus:outline-none"
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  if (e.target.value === "ALL") setFilterMonth("ALL");
                }}
              >
                <option value="ALL">Toàn thời gian</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
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

        {/* Cột Phải: Recommended Tests */}
        <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                <Award className="text-white" size={20} />
              </div>
              Đề xuất cho bạn
            </h3>
            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full font-semibold">
              {recommended.length} đề
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar max-h-[400px]">
            {recommended.map((test, index) => {
              const testIcons = {
                READING: <BookOpen size={20} className="text-white" />,
                LISTENING: <Headphones size={20} className="text-white" />,
                WRITING: <PenTool size={20} className="text-white" />,
                SPEAKING: <Mic size={20} className="text-white" />,
              };

              const testColors = {
                READING: "from-blue-500 to-cyan-500",
                LISTENING: "from-green-500 to-emerald-500",
                WRITING: "from-purple-500 to-pink-500",
                SPEAKING: "from-orange-500 to-red-500",
              };

              const levelColors = {
                Low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                Mid: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                Great:
                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              };

              return (
                <div
                  key={test.idTest}
                  onClick={() => handleRecommendClick(test)}
                  className="group relative bg-white dark:bg-slate-700/50 rounded-xl border-2 border-gray-100 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-xl hover:scale-[1.02] animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${
                      testColors[test.testType] || "from-gray-400 to-gray-600"
                    } opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  ></div>

                  <div className="relative p-4 flex gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={test.img || getDefaultTestImage(test.testType)}
                        alt={test.title}
                        className="w-20 h-20 rounded-lg object-cover ring-2 ring-gray-100 dark:ring-slate-600 group-hover:ring-purple-300 dark:group-hover:ring-purple-500 transition-all duration-300"
                      />
                      <div
                        className={`absolute -top-2 -right-2 bg-gradient-to-r ${
                          testColors[test.testType] ||
                          "from-purple-500 to-blue-500"
                        } rounded-full p-1.5 shadow-lg`}
                      >
                        {testIcons[test.testType] || (
                          <BookOpen size={16} className="text-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white line-clamp-2 mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                        {test.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            levelColors[test.level] || levelColors.Low
                          }`}
                        >
                          {test.level || "Low"}
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-slate-600 px-2.5 py-1 rounded-full text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1">
                          <Clock size={12} />
                          {test.duration}p
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${
                              testColors[test.testType] ||
                              "from-gray-400 to-gray-600"
                            } rounded-full transition-all duration-500`}
                            style={{ width: "0%" }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">
                          Chưa làm
                        </span>
                      </div>
                    </div>

                    <div className="self-center">
                      <div className="p-1.5 rounded-full bg-gray-100 dark:bg-slate-600 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-all duration-300 group-hover:scale-110">
                        <ChevronRight
                          size={18}
                          className="text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {recommended.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  <Award
                    className="text-gray-400 dark:text-gray-500"
                    size={32}
                  />
                </div>
                <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                  Chưa có đề xuất nào mới.
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Hãy hoàn thành thêm bài thi để nhận gợi ý!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- BẢNG LỊCH SỬ (Updated with Pagination & Filter) --- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Lịch sử làm bài
          </h3>
          {/* History Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Lọc theo:
            </span>
            <select
              className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-800 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
            >
              <option value="ALL">Tất cả đề thi</option>
              <option value="READING">Reading</option>
              <option value="LISTENING">Listening</option>
              <option value="WRITING">Writing</option>
              <option value="SPEAKING">Speaking</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 font-semibold uppercase">
              <tr>
                <th className="p-3 rounded-tl-lg">Bài thi</th>
                <th className="p-3">Kỹ năng</th>
                <th className="p-3">Điểm</th>
                <th className="p-3">Ngày</th>
                <th className="p-3 text-right rounded-tr-lg"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedHistory.length > 0 ? (
                paginatedHistory.map((item) => (
                  <tr
                    key={item.idTestResult}
                    className="hover:bg-purple-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="p-3 font-medium max-w-[200px] truncate">
                      <span className="text-gray-800 dark:text-gray-200">
                        {item.test?.title || "Unknown Test"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          item.test?.testType === "READING"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : item.test?.testType === "LISTENING"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : item.test?.testType === "WRITING"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {item.test?.testType}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-gray-800 dark:text-gray-100">
                      {item.band_score}
                    </td>
                    <td className="p-3 text-gray-500 dark:text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedTestDetail(item)}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-bold text-xs flex items-center justify-end gap-1 ml-auto"
                      >
                        Chi tiết <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-gray-400 dark:text-gray-500 italic"
                  >
                    Không tìm thấy lịch sử làm bài nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredHistory.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {(historyPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.min(historyPage * ITEMS_PER_PAGE, filteredHistory.length)}
              </span>{" "}
              trên tổng số{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {filteredHistory.length}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Logic hiển thị nút trang rút gọn (đơn giản)
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= historyPage - 1 && page <= historyPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setHistoryPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                            historyPage === page
                              ? "bg-purple-600 text-white shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === historyPage - 2 ||
                      page === historyPage + 2
                    ) {
                      return (
                        <span key={page} className="text-gray-400 text-xs px-1">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}
              </div>
              <button
                onClick={() =>
                  setHistoryPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={historyPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- CÁC POPUP/MODAL --- */}

      {/* 1. Modal sửa mục tiêu */}
      {isEditingTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-96 shadow-lg border border-transparent dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
              Cập nhật mục tiêu
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">
                  Target Band Score
                </label>
                <input
                  className="w-full border border-gray-200 dark:border-slate-600 p-2 rounded focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  type="number"
                  step="0.5"
                  max="9"
                  placeholder="Band Score (e.g. 7.5)"
                  value={tempTarget.targetBandScore}
                  onChange={(e) =>
                    setTempTarget({
                      ...tempTarget,
                      targetBandScore: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">
                  Ngày thi dự kiến
                </label>
                <input
                  className="w-full border border-gray-200 dark:border-slate-600 p-2 rounded focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
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
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsEditingTarget(false)}
                  className="px-4 py-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
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

      {/* 2. Modal Chi tiết lịch sử MỚI */}
      <SimpleResultModal
        open={!!selectedTestDetail}
        onClose={() => setSelectedTestDetail(null)}
        idTestResult={selectedTestDetail?.idTestResult}
      />

      {/* 3. Modal Xác nhận làm bài (Recommended) */}
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
