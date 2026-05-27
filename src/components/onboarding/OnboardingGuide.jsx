import React from 'react';
import { Modal, Collapse, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const { Panel } = Collapse;

const ONBOARDING_KEY = 'hasSeenOnboarding';

const OnboardingGuide = ({ visible, onClose }) => {
  const navigate = useNavigate();

  const handleStartTest = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
    navigate('/startingPage');
  };

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
      centered
      closable={true}
      maskClosable={true}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-center mb-6">
          Chào mừng bạn mới! Cùng khám phá hệ thống IELTS
        </h2>

        <Collapse accordion defaultActiveKey={['1']}>
          <Panel header="Hệ thống có gì?" key="1">
            <ul>
              <li>4 kỹ năng: Reading, Listening, Writing, Speaking</li>
              <li>AI Study Planner cá nhân hóa</li>
              <li>Chatbot hỗ trợ 24/7</li>
            </ul>
          </Panel>
          <Panel header="Tại sao hệ thống giúp ích cho bạn?" key="2">
            <ul>
              <li>Cá nhân hóa lộ trình học theo trình độ thực tế</li>
              <li>Theo dõi tiến độ chi tiết từng ngày</li>
              <li>AI gợi ý bài tập phù hợp với level</li>
            </ul>
          </Panel>
          <Panel header="Bắt đầu như thế nào?" key="3">
            <ul>
              <li>Làm bài test xác định trình độ đầu vào</li>
              <li>Thiết lập mục tiêu band đích</li>
              <li>Theo lộ trình học hàng ngày</li>
            </ul>
            <Button type="primary" onClick={handleStartTest} className="mt-4">
              Làm bài test ngay →
            </Button>
          </Panel>
        </Collapse>
      </motion.div>
    </Modal>
  );
};

export default OnboardingGuide;