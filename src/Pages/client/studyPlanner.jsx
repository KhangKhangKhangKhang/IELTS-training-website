import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/authContext";
import { getStudyPlanAPI, completeTaskAPI } from "@/services/apiStudyPlanner";
import { Target, CheckCircle, BookOpen, Headphones, PenTool, Mic, Clock, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { Select, Progress } from "antd";

const HISTORY_MONTHS_OPTIONS = [
  { value: 3, label: '3 tháng' },
  { value: 6, label: '6 tháng' },
  { value: 12, label: '12 tháng' },
];

const SKILLS = [
  { key: 'READING', label: 'Đọc', icon: BookOpen, color: '#3b82f6' },
  { key: 'LISTENING', label: 'Nghe', icon: Headphones, color: '#22c55e' },
  { key: 'WRITING', label: 'Viết', icon: PenTool, color: '#f97316' },
  { key: 'SPEAKING', label: 'Nói', icon: Mic, color: '#a855f7' },
];

const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-slate-400" />
    </div>
    <p className="text-slate-600 font-medium">{title}</p>
    {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
  </div>
);

const StatCard = ({ label, value, highlight }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <p className={`text-xl font-bold ${highlight ? 'text-blue-600' : 'text-slate-900'}`}>{value ?? '-'}</p>
  </div>
);

const SkillCard = ({ skill, minutes, color }) => {
  const Icon = skill.icon;
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800">{skill.label}</p>
        <p className="text-xs text-slate-500">{minutes > 0 ? `${minutes} phút` : 'Chưa có'}</p>
      </div>
    </div>
  );
};

const StudyPlanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [historyMonths, setHistoryMonths] = useState(6);

  useEffect(() => {
    if (user?.idUser) fetchStudyPlan();
  }, [user?.idUser, historyMonths]);

  useEffect(() => {
    if (plan?.dailyTasks) setDailyTasks(plan.dailyTasks);
  }, [plan?.dailyTasks]);

  const fetchStudyPlan = async () => {
    setLoading(true);
    try {
      const data = await getStudyPlanAPI(user.idUser, historyMonths);
      setPlan(data);
    } catch (error) {
      console.error("Failed to fetch study plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task) return;
    try {
      await completeTaskAPI(taskId, !task.completed);
      const updated = dailyTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      setDailyTasks(updated);
      if (updated.every(t => t.completed)) setShowCelebration(true);
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleTaskClick = (task) => {
    if (task.route) navigate(task.route, { state: task.routeParams });
  };

  // Group tasks by skill
  const tasksBySkill = {};
  dailyTasks.forEach(task => {
    const skill = task.type || 'OTHER';
    if (!tasksBySkill[skill]) tasksBySkill[skill] = [];
    tasksBySkill[skill].push(task);
  });

  const completedCount = dailyTasks.filter(t => t.completed).length;
  const progressPercent = dailyTasks.length ? Math.round((completedCount / dailyTasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Lộ trình học</h1>
              <p className="text-sm text-slate-500">Cá nhân hóa theo mục tiêu của bạn</p>
            </div>
          </div>
          <Select
            value={historyMonths}
            onChange={setHistoryMonths}
            options={HISTORY_MONTHS_OPTIONS}
            style={{ width: 110 }}
            size="middle"
          />
        </div>

        {/* Missing Skills Alert */}
        {plan?.missingSkills?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-800 text-sm">Kỹ năng chưa đánh giá</span>
            </div>
            <div className="flex gap-2">
              {plan.missingSkills.map(skill => {
                const s = SKILLS.find(x => x.key === skill);
                return (
                  <span key={skill} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-600 border border-slate-200">
                    {s?.label || skill}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <div className="space-y-4">
            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Tiến độ hôm nay</h2>
                  <p className="text-sm text-slate-500">{completedCount}/{dailyTasks.length || '0'} hoàn thành</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{progressPercent}%</span>
                </div>
              </div>
              <Progress percent={progressPercent} showInfo={false} strokeColor="#3b82f6" trailColor="#e2e8f0" />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Band hiện tại" value={plan?.currentBand} />
              <StatCard label="Mục tiêu" value={plan?.targetBand} highlight />
              <StatCard label="Ngày còn lại" value={plan?.daysUntilExam} />
            </div>

            {/* Skills Breakdown */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-4">Phân bổ theo kỹ năng</h3>
              <div className="grid grid-cols-2 gap-3">
                {SKILLS.map(skill => {
                  const tasks = tasksBySkill[skill.key] || [];
                  const mins = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
                  return (
                    <SkillCard
                      key={skill.key}
                      skill={skill}
                      minutes={mins}
                      color={skill.color}
                    />
                  );
                })}
              </div>
            </div>

            {/* Task List */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-4">Danh sách công việc</h3>
              {dailyTasks.length > 0 ? (
                <div className="space-y-2">
                  {dailyTasks.map(task => {
                    const skill = SKILLS.find(s => s.key === task.type);
                    const Icon = skill?.icon || CheckCircle;
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          task.completed
                            ? 'bg-green-50/50 border-green-100'
                            : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'
                        }`}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCompleteTask(task.id); }}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            task.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-slate-300 hover:border-blue-400'
                          }`}
                        >
                          {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>
                        <Icon className={`w-4 h-4 ${task.completed ? 'text-slate-400' : 'text-slate-500'}`} />
                        <span className={`flex-1 text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {task.name}
                        </span>
                        <span className="text-xs text-slate-400">{task.estimatedMinutes}p</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="Chưa có kế hoạch hôm nay"
                  subtitle="Hoàn thành bài đánh giá để nhận lộ trình cá nhân"
                />
              )}
            </div>

            {/* Stage Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Giai đoạn hiện tại</h3>
              {plan?.currentStage ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-slate-800">
                      {plan.currentStage === 'FOUNDATION' ? 'Nền tảng' :
                       plan.currentStage === 'SKILL_BUILDING' ? 'Rèn luyện' :
                       plan.currentStage === 'INTEGRATION' ? 'Tích hợp' : 'Luyện thi'}
                    </span>
                  </div>
                  {plan.stageProgress?.stageProgressPercent > 0 && (
                    <span className="text-sm font-medium text-blue-600">{plan.stageProgress.stageProgressPercent}%</span>
                  )}
                </div>
              ) : (
                <EmptyState icon={TrendingUp} title="Chưa xác định" subtitle="Hoàn thành bài đánh giá để biết giai đoạn" />
              )}
            </div>

            {/* 4-Strand Balance */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Phân bổ thời gian</h3>
              {plan?.fourStrandBalance ? (
                <div className="space-y-3">
                  {[
                    { name: 'Đọc & Nghe', minutes: plan.fourStrandBalance.input },
                    { name: 'Viết & Nói', minutes: plan.fourStrandBalance.output },
                    { name: 'Từ vựng & Ngữ pháp', minutes: plan.fourStrandBalance.language },
                    { name: 'Luyện tốc độ', minutes: plan.fourStrandBalance.fluency },
                  ].map(strand => (
                    <div key={strand.name} className="flex items-center gap-3">
                      <span className="w-28 text-sm text-slate-600">{strand.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${plan.dailyMinutes ? (strand.minutes / plan.dailyMinutes) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-12 text-sm text-slate-500 text-right">{strand.minutes}p</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Clock} title="Chưa có dữ liệu" />
              )}
            </div>
          </div>
        )}

        {/* Initial Loading State */}
        {!loading && !plan && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-8 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCelebration(false)}>
          <div className="bg-white rounded-3xl p-10 max-w-sm mx-4 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Hoàn thành!</h2>
            <p className="text-slate-500 mb-6">Bạn đã hoàn thành kế hoạch hôm nay</p>
            <button
              onClick={() => setShowCelebration(false)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;