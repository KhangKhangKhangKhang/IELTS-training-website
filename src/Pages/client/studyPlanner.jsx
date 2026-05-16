import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/authContext";
import { getStudyPlanAPI, calculateStudyPlanAPI, completeTaskAPI } from "@/services/apiStudyPlanner";
import { Calculator, Target, Calendar, AlertTriangle, CheckCircle, Clock, Trophy } from "lucide-react";

const HOUR_OPTIONS = [
  { value: 60, label: '1h' },
  { value: 90, label: '1.5h' },
  { value: 120, label: '2h' },
  { value: 150, label: '2.5h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
];

const StudyPlanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [manualInput, setManualInput] = useState({
    currentBand: 5.0,
    targetBand: 6.5,
    daysUntilExam: 60,
    studyMinutesPerDay: 120,
  });
  const [mode, setMode] = useState("auto"); // "auto" or "manual"
  const [viewMode, setViewMode] = useState('today'); // 'today' | 'week'
  const [dailyTasks, setDailyTasks] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch auto plan from backend
  useEffect(() => {
    if (user?.idUser && mode === "auto") {
      fetchStudyPlan();
    }
  }, [user?.idUser, mode]);

  // Update dailyTasks when plan changes
  useEffect(() => {
    if (plan?.dailyTasks) {
      setDailyTasks(plan.dailyTasks);
    }
  }, [plan?.dailyTasks]);

  const fetchStudyPlan = async () => {
    setLoading(true);
    try {
      const data = await getStudyPlanAPI(user.idUser);
      setPlan(data);
    } catch (error) {
      console.error("Failed to fetch study plan:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate manual plan
  const handleCalculateManual = async () => {
    setLoading(true);
    try {
      const data = await calculateStudyPlanAPI(manualInput);
      setPlan(data);
    } catch (error) {
      console.error("Failed to calculate plan:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle task completion
  const handleCompleteTask = async (taskId) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await completeTaskAPI(taskId, !task.completed);
      const updatedTasks = dailyTasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      setDailyTasks(updatedTasks);

      // Check if all done for celebration
      if (updatedTasks.every(t => t.completed)) {
        setShowCelebration(true);
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  // Handle task click navigation
  const handleTaskClick = (task) => {
    if (task.route && task.routeParams) {
      navigate(task.route, { state: task.routeParams });
    } else if (task.route) {
      navigate(task.route);
    }
  };

  // Render time validation warning
  const renderTimeValidation = () => {
    if (!plan?.timeValidation) return null;

    const { severity, message } = plan.timeValidation;

    const styles = {
      critical: 'bg-red-50 border-red-200 text-red-700',
      high: 'bg-orange-50 border-orange-200 text-orange-700',
      medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      ok: 'bg-green-50 border-green-200 text-green-700',
    };

    return (
      <div className={`rounded-xl p-4 mb-6 border ${styles[severity]}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="font-medium">{message}</p>
        </div>
      </div>
    );
  };

  // Render daily tasks with checkboxes
  const renderDailyTasks = () => {
    if (!dailyTasks.length) return null;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Kế hoạch hôm nay
          <span className="text-sm text-slate-500 font-normal ml-2">
            ({dailyTasks.filter(t => t.completed).length}/{dailyTasks.length} hoàn thành)
          </span>
        </h3>
        <div className="space-y-3">
          {dailyTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                task.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  handleCompleteTask(task.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <p className={`font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {task.name}
                </p>
                <p className="text-sm text-slate-500">{task.description}</p>
              </div>
              {task.completed && (
                <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Done
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render 4-strand balance
  const renderFourStrandBalance = () => {
    if (!plan?.fourStrandBalance) return null;

    const { input, output, language, fluency } = plan.fourStrandBalance;

    const strands = [
      { name: "Đọc & Nghe", minutes: input, color: "bg-blue-500", percent: Math.round(input / plan.dailyMinutes * 100) || 35 },
      { name: "Viết & Nói", minutes: output, color: "bg-green-500", percent: Math.round(output / plan.dailyMinutes * 100) || 35 },
      { name: "Từ vựng & Ngữ pháp", minutes: language, color: "bg-yellow-500", percent: Math.round(language / plan.dailyMinutes * 100) || 20 },
      { name: "Luyện tốc độ", minutes: fluency, color: "bg-purple-500", percent: Math.round(fluency / plan.dailyMinutes * 100) || 10 },
    ];

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Phân bổ thời gian mỗi ngày
        </h3>
        <div className="space-y-3">
          {strands.map((strand) => (
            <div key={strand.name} className="flex items-center gap-4">
              <div className="w-48 text-sm text-slate-600">{strand.name}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`${strand.color} h-full rounded-full flex items-center justify-center text-white text-xs font-medium`}
                  style={{ width: `${strand.percent}%` }}
                >
                  {strand.minutes} phút
                </div>
              </div>
              <div className="w-12 text-right text-sm text-slate-500">{strand.percent}%</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          * Mỗi người có cách học khác nhau, bạn có thể điều chỉnh theo mục tiêu của mình
        </p>
      </div>
    );
  };

  // Render weekly plan
  const renderWeeklyPlan = () => {
    if (!plan?.weeklyPlan?.length) return null;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4">Lộ trình từng tuần</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plan.weeklyPlan.map((week) => (
            <div
              key={week.week}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-600">Tuần {week.week}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  week.theme === 'Foundation' ? 'bg-green-100 text-green-700' :
                  week.theme === 'Skill Building' ? 'bg-blue-100 text-blue-700' :
                  week.theme === 'Integration' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {week.theme === 'Foundation' ? 'Nền tảng' :
                   week.theme === 'Skill Building' ? 'Rèn kỹ năng' :
                   week.theme === 'Integration' ? 'Tích hợp' : 'Sát ngày thi'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{week.focus}</p>
              <div className="text-xs text-slate-400">
                Mỗi ngày: {week.dailyMinutes} phút
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render warning for unrealistic targets
  const renderWarning = () => {
    if (!plan?.warning) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-red-700">Mục tiêu hơi cao</h4>
          <p className="text-sm text-red-600 mt-1">{plan.warning}</p>
          {plan.adjustedTarget && (
            <p className="text-sm text-red-600 mt-1">
              Gợi ý: Thử đặt mục tiêu band <span className="font-bold">{plan.adjustedTarget.toFixed(1)}</span> thay vì {plan.targetBand}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render motivation tips
  const renderMotivationTips = () => {
    if (!plan?.motivationTips?.length) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h4 className="font-medium text-blue-700 flex items-center gap-2">
          💡 Mẹo nhỏ để giữ vững động lực
        </h4>
        <ul className="mt-2 space-y-1">
          {plan.motivationTips.map((tip, idx) => (
            <li key={idx} className="text-sm text-blue-600">• {tip}</li>
          ))}
        </ul>
      </div>
    );
  };

  // Render manual input form with hour selector
  const renderManualForm = () => {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-500" />
          Tính lộ trình phù hợp với bạn
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Band hiện tại
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="9"
              value={manualInput.currentBand}
              onChange={(e) => setManualInput({ ...manualInput, currentBand: parseFloat(e.target.value) || 0 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Band mục tiêu
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="9"
              value={manualInput.targetBand}
              onChange={(e) => setManualInput({ ...manualInput, targetBand: parseFloat(e.target.value) || 0 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Ngày thi
            </label>
            <input
              type="number"
              min="1"
              value={manualInput.daysUntilExam}
              onChange={(e) => setManualInput({ ...manualInput, daysUntilExam: parseInt(e.target.value) || 60 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Mỗi ngày bạn có thể học
            </label>
            <div className="flex gap-2 flex-wrap">
              {HOUR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setManualInput({ ...manualInput, studyMinutesPerDay: opt.value })}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    manualInput.studyMinutesPerDay === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={handleCalculateManual}
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang tính..." : "Tính lộ trình của tôi"}
        </button>
      </div>
    );
  };

  // Render confetti celebration
  const renderCelebration = () => {
    if (!showCelebration) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center animate-bounce">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Chúc mừng bạn!
          </h2>
          <p className="text-slate-600 mb-6">
            Bạn đã hoàn thành tất cả kế hoạch hôm nay!
          </p>
          <div className="space-y-1 text-slate-500 text-sm mb-6">
            <p>Đã hoàn thành: {dailyTasks.length} hoạt động</p>
            <p>Streak: {user?.currentStreak || 0} ngày</p>
          </div>
          <button
            onClick={() => setShowCelebration(false)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Tiếp tục →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Target className="w-7 h-7 text-blue-600" />
            Lộ trình học của tôi
          </h1>
          <p className="text-slate-600 mt-1">
            Tính toán dựa trên mục tiêu và thời gian của bạn
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("auto")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === "auto"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Dùng dữ liệu của tôi
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === "manual"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Nhập thủ công
          </button>
        </div>

        {/* View Mode Toggle */}
        {plan && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setViewMode('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'today'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tuần này
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {mode === "manual" && renderManualForm()}

            {plan && (
              <>
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Band hiện tại</p>
                      <p className="text-4xl font-bold">{plan.currentBand}</p>
                    </div>
                    <div className="text-3xl">→</div>
                    <div>
                      <p className="text-blue-100 text-sm">Band mục tiêu</p>
                      <p className="text-4xl font-bold">{plan.targetBand}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-100 text-sm">Ngày còn lại</p>
                      <p className="text-3xl font-bold">{plan.daysUntilExam}</p>
                    </div>
                  </div>

                  {plan.isRealistic && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-blue-500">
                      <CheckCircle className="w-5 h-5 text-green-300" />
                      <span className="text-blue-100">Mục tiêu khả thi - Có thể tăng được {plan.maxPossibleGain.toFixed(1)} band</span>
                    </div>
                  )}
                </div>

                {renderTimeValidation()}
                {renderWarning()}
                {renderMotivationTips()}

                {/* Today View - Show daily tasks */}
                {viewMode === 'today' && renderDailyTasks()}

                {renderFourStrandBalance()}
                {renderWeeklyPlan()}

                {/* Metacognitive Prompts */}
                {plan.metacognitivePrompts && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-500" />
                      Ghi chú nhỏ mỗi ngày
                    </h3>
                    <ul className="space-y-2">
                      {plan.metacognitivePrompts.map((prompt, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-600">
                          <span className="text-purple-500 font-bold">•</span>
                          {prompt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {!plan && mode === "auto" && (
              <div className="bg-white rounded-xl p-8 text-center">
                <p className="text-slate-500">Đang tải lộ trình của bạn...</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Celebration Modal */}
      {renderCelebration()}
    </div>
  );
};

export default StudyPlanner;