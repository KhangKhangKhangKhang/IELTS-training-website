import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Progress, Divider, Tag } from "antd";
import {
  PlayCircleOutlined,
  ProfileOutlined,
  ClockCircleOutlined,
  StarOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const StartingPage = () => {
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'IELTS Master',
      subtitle: 'Khám phá trình độ tiếng Anh của bạn và bắt đầu hành trình chinh phục IELTS',
      features: ['Đánh giá 4 kỹ năng toàn diện', 'Lộ trình học tập cá nhân hóa', 'Đề thi bám sát format thật'],
      badge: 'Miễn phí 100%',
      bgGradient: 'from-blue-600 to-cyan-700',
    },
    {
      title: 'Vì sao cần làm bài test?',
      subtitle: 'Hiểu rõ sức mạnh của bạn để lộ trình hiệu quả hơn',
      features: ['Xác định điểm mạnh, điểm cần cải thiện', 'Hệ thống cá nhân hóa lộ trình', 'Tiết kiệm thời gian'],
      badge: 'Nhanh & Chính xác',
      bgGradient: 'from-purple-600 to-pink-700',
    },
    {
      title: 'Làm bài test như thế nào?',
      subtitle: 'Đánh giá năng lực IELTS hiện tại của bạn',
      features: ['60 phút với 4 kỹ năng', 'Câu hỏi bám sát format thật', 'Kết quả ngay sau khi làm xong'],
      badge: 'Đầy đủ 4 kỹ năng',
      bgGradient: 'from-emerald-600 to-teal-700',
    },
    {
      title: 'Sẵn sàng bắt đầu?',
      subtitle: 'Hành trình IELTS của bạn bắt đầu từ đây',
      features: [],
      badge: 'Bắt đầu ngay',
      bgGradient: 'from-orange-600 to-red-600',
      isLast: true,
    },
  ];

  const testInfo = [
    { icon: <ClockCircleOutlined className="text-blue-500" />, title: "Thời lượng", value: "60 phút", color: "blue" },
    { icon: <ProfileOutlined className="text-green-500" />, title: "Định dạng", value: "4 kỹ năng", color: "green" },
    { icon: <StarOutlined className="text-yellow-500" />, title: "Độ khó", value: "Từ cơ bản", color: "orange" },
    { icon: <TrophyOutlined className="text-purple-500" />, title: "Kết quả", value: "Ngay sau khi làm", color: "purple" },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleStartTest = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowPrompt(false);
      navigate('/doTest');
    }, 800);
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowPrompt(false);
      navigate('/homepage');
    }, 800);
  };

  if (!showPrompt) return null;

  const slide = slides[currentSlide];

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-4"
        >
          {/* Progress dots */}
          <div className="fixed top-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-3 rounded-full transition-all duration-500 ${
                  i === currentSlide ? 'bg-blue-500 w-8' : 'bg-gray-300 w-3'
                }`}
              />
            ))}
          </div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="w-full max-w-6xl"
          >
            <Card
              className="w-full shadow-2xl border-0 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm"
              bodyStyle={{ padding: 0 }}
            >
              <div className="lg:flex">
                {/* Left panel */}
                <motion.div
                  key={`left-${currentSlide}`}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className={`lg:w-2/5 bg-gradient-to-br ${slide.bgGradient} p-8 text-white flex flex-col justify-between`}
                >
                  <div>
                    <div className="inline-block p-3 bg-white/20 rounded-2xl mb-6">
                      <TrophyOutlined className="text-3xl" />
                    </div>
                    <h2 className="text-4xl font-bold mb-4">{slide.title}</h2>
                    <p className="text-white/80 text-lg mb-6">{slide.subtitle}</p>

                    <div className="space-y-3">
                      {slide.features.map((f, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8">
                    <Tag color="gold" className="text-base py-1 px-3 mb-2">
                      🎯 {slide.badge}
                    </Tag>
                    <p className="text-white/60 text-sm">Bài kiểm tra đầu vào hoàn toàn miễn phí</p>
                  </div>
                </motion.div>

                {/* Right panel */}
                <motion.div
                  key={`right-${currentSlide}`}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="lg:w-3/5 p-8"
                >
                  {slide.isLast ? (
                    // Slide 4: CTA
                    <div>
                      <h1 className="text-4xl font-bold text-gray-800 mb-3">Chào mừng bạn! 👋</h1>
                      <p className="text-gray-600 text-lg mb-6">
                        Sẵn sàng khám phá trình độ IELTS của bạn?{' '}
                        <span className="font-semibold text-blue-600">Bài kiểm tra đầu vào</span> sẽ giúp chúng tôi thiết kế lộ trình học tập phù hợp nhất.
                      </p>

                      <Divider />

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        {testInfo.map((item, index) => (
                          <div key={index} className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="text-2xl mr-4">{item.icon}</div>
                            <div>
                              <h3 className="font-semibold text-gray-700">{item.title}</h3>
                              <p className="text-gray-600">{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-3">
                        <Button
                          type="primary"
                          size="large"
                          icon={<PlayCircleOutlined />}
                          onClick={handleStartTest}
                          className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 border-0 h-14 text-base font-semibold"
                        >
                          Bắt đầu kiểm tra ngay
                        </Button>
                        <Button size="large" onClick={handleSkip} className="h-14 text-base font-medium border-gray-300">
                          Để sau, vào trang chính
                        </Button>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-start">
                          <div className="text-blue-500 mr-3 text-lg">💡</div>
                          <div>
                            <h4 className="font-semibold text-blue-800 mb-1">Tại sao nên làm bài kiểm tra?</h4>
                            <p className="text-blue-700 text-sm">
                              Bài kiểm tra đầu vào giúp xác định chính xác điểm mạnh, điểm yếu của bạn, từ đó xây dựng lộ trình học tập tối ưu và tiết kiệm thời gian.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Slides 1-3: Content
                    <div>
                      <div className="mb-6">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold mb-3">
                          Trang {currentSlide + 1} / 4
                        </span>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                          {currentSlide === 0 && 'Hệ thống luyện thi IELTS'}
                          {currentSlide === 1 && 'Cá nhân hóa lộ trình học'}
                          {currentSlide === 2 && 'Cấu trúc bài thi'}
                        </h2>
                        <p className="text-gray-500">
                          {currentSlide === 0 && 'Trang bị đầy đủ công cụ để bạn luyện thi IELTS hiệu quả.'}
                          {currentSlide === 1 && 'Kết quả bài test giúp hệ thống cá nhân hóa lộ trình cho bạn.'}
                          {currentSlide === 2 && 'Bài test đầu vào đánh giá toàn diện 4 kỹ năng.'}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-5 mb-6">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Điểm nổi bật</div>
                        <div className="space-y-2">
                          {(currentSlide === 0
                            ? ['4 kỹ năng: Reading, Listening, Writing, Speaking', 'AI Study Planner cá nhân hóa theo trình độ', 'Chatbot hỗ trợ 24/7 mọi lúc', 'Theo dõi tiến độ chi tiết từng ngày']
                            : currentSlide === 1
                            ? ['Cá nhân hóa lộ trình theo trình độ thực tế', 'Biểu đồ trực quan dễ theo dõi tiến độ', 'AI gợi ý bài tập phù hợp với level', 'Học mọi lúc, mọi nơi với lộ trình linh hoạt']
                            : ['Reading: 60 phút - 40 câu hỏi', 'Listening: 30 phút - 40 câu hỏi', 'Writing: 60 phút - 2 tasks', 'Speaking: 11-14 phút với examiner']
                          ).map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-700 py-2 border-b border-gray-200 last:border-0">
                              <span className="w-2 h-2 bg-blue-500 rounded-full" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {currentSlide > 0 && (
                          <Button size="large" onClick={handlePrev} className="flex-1">
                            ← Quay lại
                          </Button>
                        )}
                        <Button type="primary" size="large" onClick={handleNext} className={`flex-1 ${currentSlide === 0 ? '' : ''}`}>
                          Tiếp theo →
                        </Button>
                      </div>

                      {currentSlide === 0 && (
                        <div className="mt-4 text-center">
                          <button onClick={handleSkip} className="text-gray-400 text-sm hover:text-gray-600">
                            Bỏ qua
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartingPage;