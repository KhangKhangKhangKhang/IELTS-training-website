import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOutlined, StarOutlined, RocketOutlined } from '@ant-design/icons';

const ONBOARDING_KEY = 'hasSeenOnboarding';

const slides = [
  {
    id: 1,
    icon: <BookOutlined />,
    title: 'Khám phá hệ thống',
    features: ['4 kỹ năng: Reading, Listening, Writing, Speaking', 'AI Study Planner cá nhân hóa', 'Chatbot hỗ trợ 24/7', 'Theo dõi tiến độ'],
  },
  {
    id: 2,
    icon: <StarOutlined />,
    title: 'Vì sao chọn chúng tôi?',
    features: ['Cá nhân hóa lộ trình theo trình độ', 'Biểu đồ trực quan', 'AI gợi ý bài tập phù hợp', 'Học mọi lúc, mọi nơi'],
  },
  {
    id: 3,
    icon: <RocketOutlined />,
    title: 'Bắt đầu như thế nào?',
    features: ['Làm bài test xác định trình độ', 'Thiết lập mục tiêu band đích', 'Theo lộ trình học hàng ngày'],
    isLast: true,
  },
];

const OnboardingGuide = ({ visible, onClose }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = () => setCurrentPage(prev => prev + 1);
  const handlePrev = () => setCurrentPage(prev => prev - 1);

  const handleStartTest = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
    navigate('/startingPage');
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
    navigate('/homepage');
  };

  const slide = slides[currentPage];
  const isLastPage = currentPage === slides.length - 1;

  return (
    <Modal
      open={visible}
      onCancel={handleSkip}
      footer={null}
      width={450}
      centered
      closable={false}
      maskClosable={false}
    >
      <div className="py-4 px-2">
        {/* Progress */}
        <div className="flex justify-center gap-2 mb-4">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-200 ${
                index === currentPage ? 'bg-blue-500 w-6' : 'bg-gray-200 w-2'
              }`}
            />
          ))}
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Icon */}
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl">
                <span className="text-2xl text-white">{slide.icon}</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-gray-800 text-center mb-3">
              {slide.title}
            </h2>

            {/* Features */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              {slide.features.map((f, i) => (
                <div key={i} className="text-sm text-gray-700 py-1.5">
                  ✓ {f}
                </div>
              ))}
            </div>

            {/* Last page CTA */}
            {isLastPage && (
              <div className="flex gap-2">
                <Button onClick={handleSkip} className="flex-1">Để sau</Button>
                <Button type="primary" onClick={handleStartTest} className="flex-1 bg-blue-500 border-0">
                  Bắt đầu test
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {!isLastPage && (
          <div className="flex justify-between mt-3">
            {currentPage === 0 ? (
              <button onClick={handleSkip} className="text-gray-400 text-sm">Bỏ qua</button>
            ) : (
              <Button onClick={handlePrev} size="small">Quay lại</Button>
            )}
            <Button type="primary" onClick={handleNext} size="small" className="bg-blue-500 border-0">
              Tiếp theo
            </Button>
          </div>
        )}

        <div className="text-center mt-3 text-gray-300 text-xs">
          {currentPage + 1} / {slides.length}
        </div>
      </div>
    </Modal>
  );
};

export default OnboardingGuide;