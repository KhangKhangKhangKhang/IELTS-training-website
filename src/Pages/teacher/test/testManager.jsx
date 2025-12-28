import React, { useState, useEffect } from "react";
import {
  Input,
  Select,
  Spin,
  Button,
  Modal,
  message,
} from "antd";
import { getAPITest, deleteAPITest } from "@/services/apiTest";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/authContext";
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Clock,
  Plus,
  Search,
  Trash2,
  Edit3,
  Eye,
  FileText,
  Filter,
  AlertTriangle,
  Layers,
} from "lucide-react";

// Helper: Get test type icon and colors
const getTestTypeConfig = (type) => {
  const configs = {
    LISTENING: {
      icon: Headphones,
      gradient: "from-green-500 to-emerald-600",
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
      border: "border-green-200 dark:border-green-800",
    },
    READING: {
      icon: BookOpen,
      gradient: "from-blue-500 to-cyan-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
    },
    WRITING: {
      icon: PenTool,
      gradient: "from-purple-500 to-pink-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-700 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-800",
    },
    SPEAKING: {
      icon: Mic,
      gradient: "from-orange-500 to-red-600",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-700 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-800",
    },
  };
  return configs[type] || configs.READING;
};

// Helper: Get level badge colors
const getLevelConfig = (level) => {
  const configs = {
    Low: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
    },
    Mid: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-400",
    },
    High: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
    },
  };
  return configs[level] || configs.Low;
};

// Stats Card Component
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <p className="text-lg font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
  </div>
);

// Exam Card Component
const ExamCard = ({ exam, onView, onEdit, onDelete }) => {
  const typeConfig = getTestTypeConfig(exam.testType);
  const levelConfig = getLevelConfig(exam.level);
  const IconComponent = typeConfig.icon;

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300">
      {/* Header with gradient */}
      <div className={`relative h-32 bg-gradient-to-br ${typeConfig.gradient} p-4`}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-20 h-20 border-4 border-white rounded-full" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-4 border-white rounded-full" />
        </div>
        
        {/* Type badge */}
        <div className="relative flex justify-between items-start">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-bold uppercase tracking-wide">
            <IconComponent size={14} />
            {exam.testType}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${levelConfig.bg} ${levelConfig.text}`}>
            {exam.level || "N/A"}
          </span>
        </div>
        
        {/* Icon watermark */}
        <div className="absolute bottom-3 right-3 opacity-30">
          <IconComponent size={48} className="text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {exam.title}
        </h3>
        
        <div
          className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 min-h-[40px] prose prose-sm dark:prose-invert max-w-none [&>*]:my-0"
          dangerouslySetInnerHTML={{
            __html: exam.description || "Không có mô tả"
          }}
        />
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            <FileText size={14} className="text-blue-500" />
            <span className="font-medium">{exam.numberQuestion || 0} câu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-green-500" />
            <span className="font-medium">{exam.duration || 0} phút</span>
          </div>
        </div>
        
        {/* Date */}
        <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Tạo ngày: {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString("vi-VN") : "N/A"}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onView(exam)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Eye size={14} />
            Xem
          </button>
          <button
            onClick={() => onEdit(exam)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Edit3 size={14} />
            Sửa
          </button>
          <button
            onClick={() => onDelete(exam)}
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const TestManager = () => {
  const [testType, setTestType] = useState("ALL");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch exams từ API
  useEffect(() => {
    fetchExams();
  }, [testType]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await getAPITest();
      setExams(res.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      message.error("Lỗi khi tải danh sách đề thi");
    } finally {
      setLoading(false);
    }
  };

  // Lọc và sắp xếp exams
  const filteredExams = Array.isArray(exams)
    ? exams
      .filter((exam) => {
        const matchTestType =
          testType === "ALL" || exam.testType === testType;
        // Strip HTML tags for search
        const plainDescription = (exam.description || "").replace(/<[^>]*>/g, "");
        const matchSearch =
          exam.title.toLowerCase().includes(searchText.toLowerCase()) ||
          plainDescription.toLowerCase().includes(searchText.toLowerCase());
        return matchTestType && matchSearch;
      })
      .sort((a, b) => {
        const levelValue = { Low: 1, Mid: 2, High: 3 };
        if (sortBy === "newest")
          return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === "level-asc")
          return levelValue[a.level] - levelValue[b.level];
        if (sortBy === "level-desc")
          return levelValue[b.level] - levelValue[a.level];
        return 0;
      })
    : [];

  // Calculate stats
  const stats = {
    total: exams.length,
    reading: exams.filter(e => e.testType === "READING").length,
    listening: exams.filter(e => e.testType === "LISTENING").length,
    writing: exams.filter(e => e.testType === "WRITING").length,
    speaking: exams.filter(e => e.testType === "SPEAKING").length,
  };

  // Xử lý các action
  const handleViewExam = (exam) => {
    navigate(`./testEdit/${exam.idTest}`, { state: { exam } });
  };

  const handleEditExam = (exam) => {
    navigate(`./testEdit/${exam.idTest}`, { state: { exam } });
  };

  const handleCreateExam = () => {
    navigate("./testCreate");
  };

  const handleDeleteClick = (exam) => {
    setSelectedExam(exam);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteAPITest(selectedExam.idTest);
      message.success("Xóa đề thi thành công");
      fetchExams(); // Refresh list
    } catch (error) {
      console.error("Lỗi xóa đề thi:", error);
      message.error("Lỗi khi xóa đề thi");
    } finally {
      setDeleteModalVisible(false);
      setSelectedExam(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Quản Lý Đề Thi
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Tạo và quản lý các đề thi IELTS của bạn
            </p>
          </div>
          <button
            onClick={handleCreateExam}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Tạo đề thi mới
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard icon={Layers} label="Tổng số đề" value={stats.total} color="bg-gradient-to-r from-blue-500 to-purple-500" />
          <StatCard icon={BookOpen} label="Reading" value={stats.reading} color="bg-blue-500" />
          <StatCard icon={Headphones} label="Listening" value={stats.listening} color="bg-green-500" />
          <StatCard icon={PenTool} label="Writing" value={stats.writing} color="bg-purple-500" />
          <StatCard icon={Mic} label="Speaking" value={stats.speaking} color="bg-orange-500" />
        </div>

        {/* Filter Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 dark:border-slate-700 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Bộ lọc</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Test Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                Loại đề thi
              </label>
              <Select
                size="large"
                className="w-full"
                value={testType}
                onChange={setTestType}
                options={[
                  { value: "ALL", label: "Tất cả loại đề" },
                  { value: "LISTENING", label: "🎧 Listening" },
                  { value: "READING", label: "📖 Reading" },
                  { value: "WRITING", label: "✍️ Writing" },
                  { value: "SPEAKING", label: "🎤 Speaking" },
                ]}
              />
            </div>
            
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                Tìm kiếm
              </label>
              <Input
                size="large"
                placeholder="Nhập tên đề hoặc mô tả..."
                prefix={<Search size={16} className="text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            
            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                Sắp xếp
              </label>
              <Select
                size="large"
                className="w-full"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: "newest", label: "Mới nhất" },
                  { value: "level-asc", label: "Dễ → Khó" },
                  { value: "level-desc", label: "Khó → Dễ" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Exam Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spin size="large" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Đang tải danh sách đề thi...</p>
          </div>
        ) : filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExams.map((exam) => (
              <ExamCard
                key={exam.idTest}
                exam={exam}
                onView={handleViewExam}
                onEdit={handleEditExam}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Không tìm thấy đề thi
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
              {searchText 
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
                : "Bắt đầu tạo đề thi đầu tiên của bạn"}
            </p>
            {!searchText && (
              <button
                onClick={handleCreateExam}
                className="mt-6 flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Plus size={18} />
                Tạo đề thi mới
              </button>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              <span>Xác nhận xóa</span>
            </div>
          }
          open={deleteModalVisible}
          onOk={handleConfirmDelete}
          onCancel={() => setDeleteModalVisible(false)}
          okText="Xóa"
          cancelText="Hủy"
          okType="danger"
          okButtonProps={{ danger: true }}
        >
          <p className="text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa đề thi{" "}
            <strong className="text-gray-800 dark:text-white">"{selectedExam?.title}"</strong> không?
          </p>
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle size={14} />
              Hành động này không thể hoàn tác
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default TestManager;
