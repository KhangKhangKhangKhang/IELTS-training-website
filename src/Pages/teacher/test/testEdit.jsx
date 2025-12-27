import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router";
import { Spin, message } from "antd";
import CreateReading from "@/components/test/teacher/Reading/CreateReading";
import CreateListening from "@/components/test/teacher/Listening/CreateListening";
import CreateWriting from "@/components/test/teacher/Writing/CreateWriting";
import { getDetailInTestAPI } from "@/services/apiDoTest";
import CreateSpeaking from "@/components/test/teacher/Speaking/CreateSpeaking";

const TestEdit = () => {
  const { idTest } = useParams();
  const locationState = useLocation().state?.exam;

  const [exam, setExam] = useState(locationState || null);
  const [loading, setLoading] = useState(!locationState);

  // Fetch fresh data từ API khi component mount hoặc idTest thay đổi
  useEffect(() => {
    const fetchTestData = async () => {
      if (!idTest) return;

      try {
        setLoading(true);
        const res = await getDetailInTestAPI(idTest);
        if (res?.data) {
          setExam(res.data);
        } else {
          message.error("Không thể tải thông tin đề thi");
        }
      } catch (error) {
        console.error("Error fetching test data:", error);
        // Nếu có navigation state thì dùng fallback, nếu không thì báo lỗi
        if (!locationState) {
          message.error("Không thể tải thông tin đề thi");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [idTest]);

  // Callback để cập nhật exam state khi TestInfoEditor save thành công
  const handleExamUpdate = (updatedExam) => {
    setExam(updatedExam);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (!exam) return <p className="text-center py-12">Không tìm thấy đề thi</p>;

  // Render component tương ứng với loại đề
  const renderTestComponent = () => {
    switch (exam.testType) {
      case "READING":
        return (
          <CreateReading
            idTest={exam.idTest}
            exam={exam}
            onExamUpdate={handleExamUpdate}
          />
        );
      case "LISTENING":
        return (
          <CreateListening
            idTest={exam.idTest}
            exam={exam}
            onExamUpdate={handleExamUpdate}
          />
        );
      case "WRITING":
        return (
          <CreateWriting
            idTest={exam.idTest}
            exam={exam}
            onExamUpdate={handleExamUpdate}
          />
        );
      default:
      case "SPEAKING":
        return (
          <CreateSpeaking
            idTest={exam.idTest}
            exam={exam}
            onExamUpdate={handleExamUpdate}
          />
        );
        return (
          <p className="text-center py-12">
            Loại đề không hợp lệ: {exam.testType}
          </p>
        );
    }
  };

  return renderTestComponent();
};

export default TestEdit;
