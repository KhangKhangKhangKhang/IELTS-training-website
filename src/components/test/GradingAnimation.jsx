import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import {
  BookOutlined,
  CheckCircleOutlined,
  StarOutlined,
  TrophyOutlined,
  RocketOutlined,
  BulbOutlined,
} from "@ant-design/icons";

const GradingAnimation = ({ testType = "WRITING" }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // Customize messages based on test type
  const getMessages = () => {
    switch (testType) {
      case "WRITING":
        return [
          "🤖 AI đang phân tích bài viết của bạn...",
          "📝 Đang đánh giá Task Response...",
          "🔗 Kiểm tra Coherence & Cohesion...",
          "📚 Phân tích Lexical Resource...",
          "✍️ Đánh giá Grammar & Accuracy...",
          "⭐ Tổng hợp kết quả...",
        ];
      case "READING":
        return [
          "📖 Đang kiểm tra câu trả lời...",
          "🔍 Đối chiếu với đáp án chính xác...",
          "📊 Tính toán điểm số...",
          "✅ Phân tích kết quả từng phần...",
          "⭐ Tổng hợp band score...",
        ];
      case "LISTENING":
        return [
          "🎧 Đang kiểm tra câu trả lời...",
          "🔍 Đối chiếu với đáp án...",
          "📊 Tính toán điểm số...",
          "✅ Phân tích accuracy...",
          "⭐ Hoàn tất chấm điểm...",
        ];
      case "SPEAKING":
        return [
          "🎤 Đang tải file ghi âm của bạn...",
          "🤖 AI đang phân tích giọng nói (Fluency)...",
          "🗣️ Kiểm tra phát âm (Pronunciation)...",
          "📚 Đánh giá từ vựng & ngữ pháp...",
          "📊 Tổng hợp Band Score...",
        ];
      default:
        return ["⏳ Đang xử lý..."];
    }
  };

  const getFunFact = () => {
    switch (testType) {
      case "WRITING":
        return "💡 Mẹo: Một bài viết IELTS tốt cần có ít nhất 250 từ (Task 2)!";
      case "READING":
        return "💡 Mẹo: Đọc kỹ câu hỏi trước khi đọc đoạn văn giúp tìm thông tin nhanh hơn!";
      case "LISTENING":
        return "💡 Mẹo: Nghe trước các câu hỏi giúp bạn tập trung vào thông tin quan trọng!";
      case "SPEAKING":
        return "💡 Mẹo: Nói trôi chảy và tự nhiên quan trọng hơn là dùng từ vựng quá phức tạp nhưng bị ngập ngừng!";
      default:
        return "💡 Chúc bạn đạt band điểm cao!";
    }
  };

  const messages = getMessages();

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900 flex items-center justify-center overflow-hidden">
      {/* Floating Background Icons */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="floating-icon absolute top-20 left-10 text-blue-200 dark:text-blue-800">
          <BookOutlined style={{ fontSize: "48px" }} />
        </div>
        <div className="floating-icon animation-delay-2 absolute top-40 right-20 text-purple-200 dark:text-purple-800">
          <StarOutlined style={{ fontSize: "36px" }} />
        </div>
        <div className="floating-icon animation-delay-4 absolute bottom-32 left-1/4 text-indigo-200 dark:text-indigo-800">
          <TrophyOutlined style={{ fontSize: "42px" }} />
        </div>
        <div className="floating-icon animation-delay-1 absolute top-1/3 right-1/3 text-pink-200 dark:text-pink-800">
          <RocketOutlined style={{ fontSize: "40px" }} />
        </div>
        <div className="floating-icon animation-delay-3 absolute bottom-20 right-10 text-yellow-200 dark:text-yellow-800">
          <BulbOutlined style={{ fontSize: "38px" }} />
        </div>
        <div className="floating-icon animation-delay-5 absolute top-1/2 left-20 text-green-200 dark:text-green-800">
          <CheckCircleOutlined style={{ fontSize: "44px" }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4">
        {/* Animated Robot/AI Icon */}
        <div className="mb-8 relative">
          <div className="ai-robot mx-auto w-32 h-32 relative">
            {/* Robot Body */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl animate-bounce-slow shadow-2xl">
              <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white rounded-full animate-blink"></div>
              <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-white rounded-full animate-blink animation-delay-1"></div>
              <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full animate-pulse"></div>
            </div>

            {/* Robot Antenna */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-1 h-6 bg-gradient-to-t from-indigo-600 to-transparent">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            </div>

            {/* Floating Sparkles */}
            <div className="sparkle absolute -top-2 -right-2 w-4 h-4 bg-yellow-300 rounded-full animate-sparkle"></div>
            <div className="sparkle animation-delay-2 absolute -bottom-2 -left-2 w-3 h-3 bg-pink-300 rounded-full animate-sparkle"></div>
            <div className="sparkle animation-delay-4 absolute top-0 -right-4 w-2 h-2 bg-blue-300 rounded-full animate-sparkle"></div>
          </div>

          {/* Circular Progress */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 -z-10">
            <svg className="animate-spin-slow" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="3"
                strokeDasharray="60 40"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4 animate-pulse">
          Đang chấm điểm...
        </h2>

        {/* Rotating Messages */}
        <div className="min-h-[60px] mb-6">
          <p className="text-lg text-gray-700 dark:text-gray-300 font-medium animate-fade-in-up">
            {messages[messageIndex]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
          <div className="progress-bar h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full animate-progress"></div>
        </div>

        {/* Fun Fact */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 italic">
          {getFunFact()}
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
            opacity: 0.8;
          }
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }

        @keyframes sparkle {
          0%,
          100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .floating-icon {
          animation: float 6s ease-in-out infinite;
        }

        .animation-delay-1 {
          animation-delay: 0.5s;
        }
        .animation-delay-2 {
          animation-delay: 1s;
        }
        .animation-delay-3 {
          animation-delay: 1.5s;
        }
        .animation-delay-4 {
          animation-delay: 2s;
        }
        .animation-delay-5 {
          animation-delay: 2.5s;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-blink {
          animation: blink 1.5s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-progress {
          animation: progress 3s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }

        .progress-bar {
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
        }

        .ai-robot {
          filter: drop-shadow(0 10px 30px rgba(79, 70, 229, 0.3));
        }
      `}</style>
    </div>
  );
};

export default GradingAnimation;
