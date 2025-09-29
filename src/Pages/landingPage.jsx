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
} from "lucide-react";
import { Button, Card } from "antd";
import FloatingWords from "@/components/landingPage/FloatingWords";
import StatsSection from "@/components/landingPage/StatsSection";
import { useNavigate } from "react-router";
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Statistics Section */}
      <StatsSection />

      {/* Vocabulary Section */}
      <VocabularySection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

// Component Navbar cho Landing Page
const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="fixed w-full bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <BookOpen className="h-8 w-8 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-blue-400">AIELTS</span>
              <span className="text-sm text-gray-300">IELTS cho mọi người</span>
            </div>
          </motion.div>

          {/* Auth Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex space-x-4"
          >
            <Button
              ghost
              className="text-white border-slate-600"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
            <Button
              type="primary"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </Button>
          </motion.div>
        </div>
      </div>
    </nav>
  );
};

// Hero Section Component
const HeroSection = () => {
  return (
    <section id="giới-thiệu" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto  text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center items-center mb-7">
            <span className="text-blue-400 text-9xl">AI</span>
            <div className="flex-col text-left justify-between items-start">
              <div className="text-white text-6xl">ELTS</div>
              <div className="text-slate-500 text-4xl">
                cũng có thể học được
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="Large" type="primary">
              Bắt đầu học ngay
              <ArrowRight className="ml-2" />
            </Button>
          </div>
        </motion.div>

        {/* Stats Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto"
        >
          {[
            { icon: Users, value: "10,000+", label: "Học viên" },
            { icon: Star, value: "4.9/5", label: "Đánh giá" },
            { icon: Target, value: "7.0+", label: "Điểm trung bình" },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-slate-800/50 rounded-xl"
            >
              <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-slate-400">{stat.label}</div>
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
      icon: BookOpen,
      title: "Luyện đề toàn diện",
      description:
        "Hệ thống đề thi đa dạng với 3 kỹ năng chính: Listening, Reading, Writing",
      skills: ["Listening", "Reading", "Writing"],
      color: "blue",
    },
    {
      icon: TrendingUp,
      title: "Theo dõi tiến độ",
      description:
        "Phân tích chi tiết quá trình học tập và đưa ra đề xuất cải thiện",
      color: "green",
    },
    {
      icon: BookMarked,
      title: "Kho từ vựng thông minh",
      description: "Hệ thống ghi nhớ và ôn tập từ vựng theo ngữ cảnh IELTS",
      color: "purple",
    },
  ];

  return (
    <section
      id="tính-năng"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Tính năng nổi bật
          </h2>
          <p className="text-xl text-slate-300">
            Mọi thứ bạn cần để chinh phục IELTS
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -5 }}
            >
              <Card
                className="h-full bg-slate-800/50 border-slate-700 hover:border-blue-500 transition-all duration-300"
                style={{ padding: "2rem" }}
              >
                <feature.icon
                  className={`h-12 w-12 text-${feature.color}-400 mb-4`}
                />
                <h3 className="text-xl font-bold text-slate-700 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-500 font-medium mb-4">
                  {feature.description}
                </p>

                {feature.skills && (
                  <div className="flex flex-wrap gap-2">
                    {feature.skills.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
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
    <section
      id="từ-vựng"
      className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <FloatingWords />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <BookMarked className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Hệ thống từ vựng thông minh
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Ghi nhớ từ vựng theo phương pháp khoa học, ôn tập đúng lúc bạn sắp
            quên
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <ul className="space-y-4">
                {[
                  "Học từ vựng theo ngữ cảnh IELTS thực tế",
                  "Nhắc nhở ôn tập theo thuật toán spaced repetition",
                  "Hệ thống flashcard thông minh",
                  "Theo dõi tiến độ ghi nhớ từ vựng",
                ].map((item, index) => (
                  <li key={index} className="flex items-center text-slate-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              className="bg-slate-800/50 p-8 rounded-xl"
            >
              <div className="text-white text-center">
                <div className="text-3xl font-bold mb-2">5,000+</div>
                <div className="text-slate-400">Từ vựng IELTS thông dụng</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <BookOpen className="h-6 w-6 text-blue-400" />
          <span className="text-xl font-bold text-white">AIELTS</span>
        </div>
        <p className="text-slate-400 mb-4">
          AI cũng học được - Chinh phục IELTS cùng công nghệ AI
        </p>
        <div className="text-slate-500 text-sm">
          © 2024 AIELTS. Tất cả các quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
};

export default LandingPage;
