import { useState } from "react";
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
  const [showPrompt, setShowPrompt] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const testInfo = [
    {
      icon: <ClockCircleOutlined className="text-blue-500" />,
      title: "Thời lượng",
      value: "60 phút",
      color: "blue",
    },
    {
      icon: <ProfileOutlined className="text-green-500" />,
      title: "Định dạng",
      value: "4 kỹ năng",
      color: "green",
    },
    {
      icon: <StarOutlined className="text-yellow-500" />,
      title: "Độ khó",
      value: "Từ cơ bản",
      color: "orange",
    },
    {
      icon: <TrophyOutlined className="text-purple-500" />,
      title: "Kết quả",
      value: "Ngay sau khi làm",
      color: "purple",
    },
  ];

  const handleStartTest = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowPrompt(false);
      // Chuyển hướng đến trang test thực tế
      console.log("Bắt đầu bài kiểm tra");
    }, 800);
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowPrompt(false);
      // Chuyển hướng đến trang chính
      console.log("Bỏ qua kiểm tra");
    }, 800);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 0.6, ease: "easeOut" },
          }}
          exit={{
            opacity: 0,
            scale: 1.1,
            transition: { duration: 0.5, ease: "easeIn" },
          }}
          className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { delay: 0.2, duration: 0.6 },
            }}
            className="w-full max-w-6xl"
          >
            <Card
              className="w-full shadow-2xl border-0 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm"
              bodyStyle={{ padding: 0 }}
            >
              <div className="lg:flex">
                {/* Phần thông tin bên trái */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{
                    x: 0,
                    opacity: 1,
                    transition: { delay: 0.4, duration: 0.6 },
                  }}
                  className="lg:w-2/5 bg-gradient-to-br from-blue-600 to-cyan-700 p-8 text-white flex flex-col justify-between"
                >
                  <div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{
                        scale: 1,
                        transition: {
                          delay: 0.6,
                          duration: 0.5,
                          type: "spring",
                          stiffness: 200,
                        },
                      }}
                      className="inline-block p-3 bg-white/20 rounded-2xl mb-6"
                    >
                      <TrophyOutlined className="text-3xl" />
                    </motion.div>

                    <motion.h2
                      initial={{ y: 20, opacity: 0 }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        transition: { delay: 0.7, duration: 0.5 },
                      }}
                      className="text-4xl font-bold mb-4"
                    >
                      IELTS Master
                    </motion.h2>

                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        transition: { delay: 0.8, duration: 0.5 },
                      }}
                      className="text-blue-100 text-lg mb-6"
                    >
                      Khám phá trình độ tiếng Anh của bạn và bắt đầu hành trình
                      chinh phục IELTS
                    </motion.p>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        transition: { delay: 0.9, duration: 0.5 },
                      }}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Đánh giá 4 kỹ năng toàn diện</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Lộ trình học tập cá nhân hóa</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Đề thi bám sát format thật</span>
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { delay: 1, duration: 0.5 },
                    }}
                    className="mt-8"
                  >
                    <Tag color="gold" className="text-base py-1 px-3 mb-2">
                      🎯 Miễn phí 100%
                    </Tag>
                    <p className="text-blue-200 text-sm">
                      Bài kiểm tra đầu vào hoàn toàn miễn phí
                    </p>
                  </motion.div>
                </motion.div>

                {/* Phần nội dung chính bên phải */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{
                    x: 0,
                    opacity: 1,
                    transition: { delay: 0.4, duration: 0.6 },
                  }}
                  className="lg:w-3/5 p-8"
                >
                  <div className="mb-8">
                    <motion.h1
                      initial={{ y: 20, opacity: 0 }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        transition: { delay: 0.6, duration: 0.5 },
                      }}
                      className="text-4xl font-bold text-gray-800 mb-3"
                    >
                      Chào mừng bạn! 👋
                    </motion.h1>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        transition: { delay: 0.7, duration: 0.5 },
                      }}
                      className="text-gray-600 text-lg"
                    >
                      Sẵn sàng khám phá trình độ IELTS của bạn?
                      <span className="font-semibold text-blue-600">
                        {" "}
                        Bài kiểm tra đầu vào{" "}
                      </span>
                      sẽ giúp chúng tôi thiết kế lộ trình học tập phù hợp nhất.
                    </motion.p>
                  </div>

                  <Divider />

                  {/* Thông tin chi tiết */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { delay: 0.8, duration: 0.5 },
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
                  >
                    {testInfo.map((item, index) => (
                      <motion.div
                        key={index}
                        whileHover={{
                          scale: 1.05,
                          transition: { duration: 0.2 },
                        }}
                        className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="text-2xl mr-4">{item.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-700">
                            {item.title}
                          </h3>
                          <p className="text-gray-600">{item.value}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Tiến trình */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { delay: 0.9, duration: 0.5 },
                    }}
                    className="mb-8"
                  >
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Hoàn thành hồ sơ học tập</span>
                      <span>70%</span>
                    </div>
                    <Progress
                      percent={70}
                      showInfo={false}
                      strokeColor={{
                        "0%": "#10b981",
                        "100%": "#3b82f6",
                      }}
                      className="mb-2"
                    />
                    <p className="text-xs text-gray-500">
                      Bài kiểm tra này sẽ giúp hoàn thành hồ sơ học tập của bạn
                    </p>
                  </motion.div>

                  {/* Nút hành động */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { delay: 1, duration: 0.5 },
                    }}
                    className="flex flex-col sm:flex-row gap-4 mb-6"
                  >
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="primary"
                        size="large"
                        icon={<PlayCircleOutlined />}
                        className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 border-0 h-14 text-base font-semibold flex-1 w-full"
                        onClick={handleStartTest}
                      >
                        🚀 Bắt đầu kiểm tra ngay
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        size="large"
                        className="h-14 text-base font-medium flex-1 w-full border-gray-300"
                        onClick={handleSkip}
                      >
                        Để sau, vào trang chính
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Thông tin bổ sung */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { delay: 1.1, duration: 0.5 },
                    }}
                    className="p-4 bg-blue-50 rounded-xl border border-blue-200"
                  >
                    <div className="flex items-start">
                      <div className="text-blue-500 mr-3 text-lg">💡</div>
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-1">
                          Tại sao nên làm bài kiểm tra?
                        </h4>
                        <p className="text-blue-700 text-sm">
                          Bài kiểm tra đầu vào giúp xác định chính xác điểm
                          mạnh, điểm yếu của bạn, từ đó xây dựng lộ trình học
                          tập tối ưu và tiết kiệm thời gian.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </Card>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { delay: 1.2, duration: 0.5 },
              }}
              className="text-center mt-6 text-gray-500 text-sm"
            >
              <p>IELTS Master - Hệ thống luyện thi IELTS thông minh</p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartingPage;
