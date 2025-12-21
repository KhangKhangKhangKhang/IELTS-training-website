// components/test/ExamCard.jsx
import React from "react";
import { ClockCircleOutlined, FileTextOutlined, TrophyOutlined, PlayCircleOutlined } from "@ant-design/icons";

const ExamCard = ({ exam, onExamClick }) => {
  const getTypeGradient = (type) => {
    // Màu xanh blue chủ đạo giống landing page cho tất cả các đề
    return "from-blue-600 via-indigo-600 to-blue-700";
  };

  const getTypeBg = (type) => {
    switch (type) {
      case "Listening":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "Writing":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
      case "Reading":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
      default:
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
    }
  };

  const getLevelBadge = (level) => {
    const levelLower = level?.toLowerCase();
    if (levelLower === "high" || levelLower === "hard") {
      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
    } else if (levelLower === "mid" || levelLower === "medium") {
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
    }
    return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
  };

  return (
    <div
      onClick={() => onExamClick(exam.idTest)}
      className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image with gradient overlay */}
      <div className="relative h-48 overflow-hidden">
        {exam.img ? (
          <img
            alt={exam.title}
            src={exam.img}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getTypeGradient(exam.testType)} flex items-center justify-center`}>
            <span className="text-white text-5xl font-bold opacity-30">{exam.testType?.[0]}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Type badge on image */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${getTypeBg(exam.testType)} backdrop-blur-sm`}>
            {exam.testType}
          </span>
        </div>

        {/* Level badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getLevelBadge(exam.level)} backdrop-blur-sm`}>
            <TrophyOutlined className="mr-1" />
            {exam.level}
          </span>
        </div>

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTypeGradient(exam.testType)} flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300`}>
            <PlayCircleOutlined className="text-white text-3xl" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {exam.title}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 min-h-[40px]">
          {exam.description || "Làm đề thi để kiểm tra kiến thức của bạn"}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
            <ClockCircleOutlined className="text-blue-500" />
            <span className="font-medium">{exam.duration}p</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
            <FileTextOutlined className="text-emerald-500" />
            <span className="font-medium">{exam.numberQuestion} câu</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamCard;
