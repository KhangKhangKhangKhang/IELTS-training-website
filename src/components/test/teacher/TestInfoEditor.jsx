import React, { useState, useEffect } from "react";
import {
  Card,
  InputNumber,
  Button,
  message,
  Spin,
  Divider,
  Typography,
  Space,
  Tag,
} from "antd";
import {
  SaveOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { updateTestInfoAPI } from "@/services/apiTest";
import { useNavigate } from "react-router";

const { Title, Text } = Typography;

const TestInfoEditor = ({ exam, onUpdate }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [numberQuestion, setNumberQuestion] = useState(
    exam?.numberQuestion || 0
  );
  const [duration, setDuration] = useState(exam?.duration || 0);
  const [hasChanges, setHasChanges] = useState(false);

  // Cập nhật state khi exam thay đổi
  useEffect(() => {
    if (exam) {
      setNumberQuestion(exam.numberQuestion || 0);
      setDuration(exam.duration || 0);
      setHasChanges(false);
    }
  }, [exam]);

  // Kiểm tra thay đổi
  useEffect(() => {
    const changed =
      numberQuestion !== (exam?.numberQuestion || 0) ||
      duration !== (exam?.duration || 0);
    setHasChanges(changed);
  }, [numberQuestion, duration, exam]);

  // Xác định max câu hỏi dựa vào loại test
  const getMaxQuestions = () => {
    if (exam?.testType === "WRITING" || exam?.testType === "SPEAKING") {
      return 2;
    }
    return 40;
  };

  const getTypeColor = (type) => {
    const colors = {
      LISTENING: "blue",
      READING: "green",
      WRITING: "orange",
      SPEAKING: "purple",
    };
    return colors[type] || "gray";
  };

  const handleSave = async () => {
    if (!exam?.idTest || !exam?.idUser) {
      message.error("Thiếu thông tin đề thi");
      return;
    }

    // Validation
    const maxQ = getMaxQuestions();
    if (numberQuestion > maxQ) {
      message.error(`Số câu hỏi tối đa cho ${exam.testType} là ${maxQ}`);
      return;
    }

    if (numberQuestion < 1) {
      message.error("Số câu hỏi phải lớn hơn 0");
      return;
    }

    if (duration < 1) {
      message.error("Thời gian phải lớn hơn 0");
      return;
    }

    try {
      setLoading(true);
      const res = await updateTestInfoAPI(exam.idTest, {
        idUser: exam.idUser,
        testType: exam.testType,
        title: exam.title,
        description: exam.description,
        level: exam.level,
        numberQuestion: numberQuestion,
        duration: duration,
      });

      if (res?.data) {
        message.success("Cập nhật thông tin đề thi thành công!");
        if (onUpdate) {
          onUpdate({
            ...exam,
            numberQuestion,
            duration,
          });
        }
        setHasChanges(false);
      } else {
        message.error("Cập nhật thất bại, vui lòng thử lại");
      }
    } catch (error) {
      console.error("Update test info error:", error);
      message.error("Có lỗi xảy ra khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  if (!exam) {
    return <Spin />;
  }

  return (
    <Card
      className="mb-4"
      size="small"
      styles={{ header: { background: "#f5f5f5" } }}
      title={
        <Space>
          <InfoCircleOutlined />
          <span>Thông tin đề thi</span>
          <Tag color={getTypeColor(exam.testType)}>{exam.testType}</Tag>
        </Space>
      }
    >
      <div className="flex flex-wrap items-center gap-6">
        {/* Tên đề */}
        <div className="flex items-center gap-2">
          <Text strong>Đề thi:</Text>
          <Text className="text-blue-600">{exam.title}</Text>
        </div>

        <Divider type="vertical" className="h-8" />

        {/* Số câu hỏi */}
        <div className="flex items-center gap-2">
          <QuestionCircleOutlined className="text-green-600" />
          <Text>Số câu:</Text>
          <InputNumber
            size="small"
            min={1}
            max={getMaxQuestions()}
            value={numberQuestion}
            onChange={(val) => setNumberQuestion(val || 0)}
            className="w-20"
          />
          <Text type="secondary">(max: {getMaxQuestions()})</Text>
        </div>

        <Divider type="vertical" className="h-8" />

        {/* Thời gian */}
        <div className="flex items-center gap-2">
          <ClockCircleOutlined className="text-orange-500" />
          <Text>Thời gian:</Text>
          <InputNumber
            size="small"
            min={1}
            max={180}
            value={duration}
            onChange={(val) => setDuration(val || 0)}
            className="min-w-fit"
            addonAfter="phút"
          />
        </div>

        <Divider type="vertical" className="h-8" />

        {/* Nút lưu */}
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={loading}
          disabled={!hasChanges}
          size="small"
        >
          Lưu thay đổi
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Nút quay lại và hoàn thành */}
        <div className="flex gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            size="small"
            onClick={() => navigate("/teacher/testManager")}
          >
            Quay lại
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            size="small"
            className="bg-green-600 hover:bg-green-700 border-green-600"
            onClick={() => {
              message.success("Hoàn thành chỉnh sửa đề thi!");
              navigate("/teacher/testManager");
            }}
          >
            Hoàn thành
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TestInfoEditor;
