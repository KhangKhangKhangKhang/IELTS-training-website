// components/StatsSection.jsx
import React from "react";
import { motion } from "framer-motion";
import { BarChart, TrendingUp, Clock, Target } from "lucide-react";

const StatsSection = () => {
  const stats = [
    {
      icon: BarChart,
      value: "30%",
      label: "Cải thiện điểm số",
      description: "Chỉ sau 2 tháng sử dụng",
    },
    {
      icon: TrendingUp,
      value: "2.5x",
      label: "Tốc độ học tập",
      description: "Tiến bộ nhanh hơn phương pháp truyền thống",
    },
    {
      icon: Clock,
      value: "24/7",
      label: "Hỗ trợ AI",
      description: "Học mọi lúc, mọi nơi",
    },
    {
      icon: Target,
      value: "95%",
      label: "Hài lòng",
      description: "Người dùng đánh giá tích cực",
    },
  ];

  return (
    <section id="thống-kê" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Thống kê ấn tượng
          </h2>
          <p className="text-xl text-slate-300">
            Kết quả học tập được cải thiện rõ rệt
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700"
            >
              <stat.icon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-slate-200 mb-2">
                {stat.label}
              </div>
              <div className="text-slate-400 text-sm">{stat.description}</div>
            </motion.div>
          ))}
        </div>

        {/* Progress Chart Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-16 p-8 bg-slate-800/50 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              Tiến bộ học tập điển hình
            </h3>
            <span className="text-blue-400">8 tuần</span>
          </div>
          <div className="flex items-end space-x-2 h-32">
            {[4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5].map((score, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                whileInView={{ height: `${(score / 7.5) * 100}%` }}
                transition={{ delay: index * 0.1 }}
                className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-300"
              />
            ))}
          </div>
          <div className="flex justify-between text-slate-400 text-sm mt-2">
            <span>Tuần 1</span>
            <span>Tuần 8</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
