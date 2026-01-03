// components/LandingPage.jsx
import React from "react";
import { motion } from "framer-motion";
import "@ant-design/v5-patch-for-react-19";
import {
  BookOpen,
  TrendingUp,
  BookMarked,
  ArrowRight,
  Star,
  Users,
  Target,
  Zap,
  BrainCircuit,
  Award,
} from "lucide-react";
import { Button, Card } from "antd";
import FloatingWords from "@/components/landingPage/FloatingWords";
import { useNavigate } from "react-router";

// Lưu ý: Đã bỏ StatsSection import vì mình sẽ tích hợp các chỉ số chung vào Hero để mạch lạc hơn
// Nếu bạn muốn tách riêng thì có thể giữ lại component đó.

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 overflow-x-hidden">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Vocabulary Section */}
      <VocabularySection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

// Component Navbar
const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="fixed w-full bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 "
          >
            <div className="relative">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                AIELTS
              </span>
              <span className="text-xs text-slate-400 tracking-wider uppercase">
                Future of Learning
              </span>
            </div>
          </motion.div>

          {/* Auth Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex space-x-3"
          >
            <Button
              ghost
              className="!text-slate-300 !border-slate-600 hover:!text-white hover:!border-white hidden sm:block"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </Button>
            <Button
              type="primary"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border-none shadow-lg shadow-blue-900/20"
              onClick={() => navigate("/signup")}
            >
              Đăng ký ngay
            </Button>
          </motion.div>
        </div>
      </div>
    </nav>
  );
};

// Hero Section Component
const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-col md:flex-row justify-center items-center mb-8 gap-4">
            <span className="text-8xl md:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-300 leading-none tracking-tighter">
              AI
            </span>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                ELTS
              </div>
              <div className="text-slate-400 text-xl md:text-2xl mt-2 font-light">
                Cũng có thể học được
              </div>
            </div>
          </div>

          <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-10 leading-relaxed">
            Hệ thống tối ưu hóa lộ trình học tập dựa trên năng lực cá nhân.
            Không chỉ là luyện thi, chúng tôi giúp bạn nhìn thấy sự
            <span className="text-blue-400 font-semibold">
              {" "}
              tăng trưởng kỹ năng{" "}
            </span>
            rõ rệt qua từng bài học.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="large"
              onClick={() => navigate("/signup")}
              className="!h-14 !px-8 !text-lg !rounded-full bg-blue-600 hover:bg-blue-500 border-none shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-300"
              type="primary"
            >
              Khám phá năng lực ngay
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Generic Stats Preview - Thay số cụ thể bằng giá trị định tính */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto"
        >
          {[
            {
              icon: TrendingUp,
              title: "Tiến bộ liên tục",
              desc: "Cải thiện điểm số qua từng bài test",
              color: "text-green-400",
            },
            {
              icon: BrainCircuit,
              title: "Lộ trình thông minh",
              desc: "Cá nhân hóa theo điểm mạnh & yếu",
              color: "text-blue-400",
            },
            {
              icon: Award,
              title: "Kết quả thực tế",
              desc: "Hàng ngàn học viên đạt mục tiêu",
              color: "text-yellow-400",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-all duration-300 group"
            >
              <div className="flex justify-center mb-4">
                <div
                  className={`p-3 rounded-full bg-slate-900 group-hover:scale-110 transition-transform duration-300 ${stat.color}`}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="text-xl font-bold text-white mb-2">
                {stat.title}
              </div>
              <div className="text-slate-400 text-sm">{stat.desc}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// Features Section Component
const FeaturesSection = () => {
  const features = [
    {
      icon: Target,
      title: "Luyện tập đúng trọng tâm",
      description:
        "Hệ thống tự động phân tích và đề xuất các bài tập tập trung vào kỹ năng bạn còn yếu, giúp tối ưu thời gian học.",
      tags: ["Tối ưu thời gian", "Đúng trình độ"],
      color: "blue",
    },
    {
      icon: Zap,
      title: "Phản hồi tức thì",
      description:
        "Nhận kết quả và phân tích chi tiết ngay sau khi nộp bài. Hiểu rõ lỗi sai để khắc phục ngay lập tức.",
      tags: ["Chấm điểm AI", "Giải thích chi tiết"],
      color: "yellow",
    },
    {
      icon: BookMarked,
      title: "Kho tài liệu không giới hạn",
      description:
        "Tiếp cận nguồn đề thi phong phú và cập nhật liên tục, sát với xu hướng ra đề mới nhất.",
      tags: ["Đa dạng", "Cập nhật"],
      color: "purple",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 relative">
      {/* Decorative divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-blue-400 font-semibold tracking-wide uppercase text-sm">
            Tại sao chọn chúng tôi?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
            Công nghệ kiến tạo tri thức
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Chúng tôi không chỉ cung cấp đề thi, chúng tôi cung cấp giải pháp để
            bạn học tập hiệu quả hơn mỗi ngày.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -8 }}
            >
              {/* SỬA LỖI Ở ĐÂY: Thêm !bg-slate-800 và !border-slate-700 để ép màu nền tối */}
              <Card
                bordered={false}
                className="h-full !bg-slate-800 !border !border-slate-700 hover:!border-blue-500/50 hover:!shadow-2xl hover:!shadow-blue-900/20 transition-all duration-300"
                styles={{
                  body: {
                    padding: "2.5rem",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  },
                }}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center mb-6 text-${feature.color}-400 shadow-inner ring-1 ring-slate-700`}
                >
                  <feature.icon className="h-7 w-7" />
                </div>

                {/* Tiêu đề chắc chắn hiển thị màu trắng */}
                <h3 className="text-xl font-bold !text-white mb-3">
                  {feature.title}
                </h3>

                {/* Nội dung màu xám sáng để dễ đọc trên nền tối */}
                <p className="!text-slate-400 leading-relaxed mb-6 flex-grow text-base">
                  {feature.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {feature.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Vocabulary Section Component
const VocabularySection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800/30 to-slate-900"></div>

      {/* Component này giữ nguyên vì hiệu ứng đẹp */}
      <FloatingWords />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-left"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
              <BookOpen className="w-4 h-4" />
              <span>Phương pháp học tập mới</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Mở rộng vốn từ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Tự nhiên & Bền vững
              </span>
            </h2>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Quên đi cách học vẹt truyền thống. Hệ thống giúp bạn nạp từ vựng
              thông qua ngữ cảnh bài học, giúp nhớ lâu hơn và vận dụng linh hoạt
              hơn.
            </p>

            <ul className="space-y-5">
              {[
                "Học từ vựng qua ngữ cảnh IELTS thực tế",
                "Thuật toán nhắc lại ngắt quãng (Spaced Repetition)",
                "Theo dõi biểu đồ tăng trưởng vốn từ",
                "Gợi ý từ vựng theo chủ đề bạn quan tâm",
              ].map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center text-slate-300 group"
                >
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center mr-4 group-hover:bg-green-500/20 transition-colors">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>

            <div className="mt-10">
              <Button className="!bg-slate-800 !border-slate-600 !text-white hover:!bg-slate-700 hover:!border-slate-500 !px-6 !h-12 !rounded-lg">
                Trải nghiệm học từ vựng
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>
            <div className="relative bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-700 shadow-2xl">
              <div className="text-white text-center py-10">
                <BookMarked className="h-16 w-16 text-blue-400 mx-auto mb-6 opacity-80" />
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                  Không giới hạn
                </div>
                <div className="text-slate-400 font-medium text-lg">
                  Khả năng tiếp thu của bạn
                </div>
                <div className="mt-6 pt-6 border-t border-slate-700/50 flex justify-center space-x-8 text-sm text-slate-500">
                  <div className="flex flex-col items-center">
                    <span className="text-white font-bold text-lg">∞</span>
                    <span>Từ vựng</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-white font-bold text-lg">24/7</span>
                    <span>Truy cập</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/50 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="flex items-center space-x-2 mb-6">
          <BookOpen className="h-8 w-8 text-blue-500" />
          <span className="text-2xl font-bold text-white tracking-tight">
            AIELTS
          </span>
        </div>

        <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
          Nền tảng luyện thi IELTS thông minh, giúp bạn bứt phá giới hạn và chạm
          tới ước mơ du học.
        </p>

        <div className="flex space-x-6 mb-8">
          {/* Social placeholders */}
          {["Facebook", "Twitter", "Instagram", "LinkedIn"].map((social) => (
            <a
              key={social}
              href="#"
              className="text-slate-500 hover:text-blue-400 transition-colors"
            >
              {social}
            </a>
          ))}
        </div>

        <div className="w-full h-px bg-slate-800/50 mb-8"></div>

        <div className="text-slate-600 text-sm">
          © {new Date().getFullYear()} AIELTS. Kiến tạo tương lai cùng AI.
        </div>
      </div>
    </footer>
  );
};

export default LandingPage;
