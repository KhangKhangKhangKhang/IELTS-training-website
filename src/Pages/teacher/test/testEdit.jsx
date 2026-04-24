import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router";
import { Spin, message, Button } from "antd";
import { UploadOutlined, FilePdfOutlined } from "@ant-design/icons";
import CreateReading from "@/components/test/teacher/Reading/CreateReading";
import CreateListening from "@/components/test/teacher/Listening/CreateListening";
import CreateWriting from "@/components/test/teacher/Writing/CreateWriting";
import { getDetailInTestAPI } from "@/services/apiDoTest";
import CreateSpeaking from "@/components/test/teacher/Speaking/CreateSpeaking";
import PdfImportModal from "@/components/test/teacher/PdfImportModal";

const TestEdit = () => {
  const { idTest, id } = useParams();
  const resolvedTestId = idTest || id;
  const locationState = useLocation().state?.exam;

  const [exam, setExam] = useState(locationState || null);
  const [loading, setLoading] = useState(!locationState);
  const [showPdfImportModal, setShowPdfImportModal] = useState(false);

  // Fetch fresh data từ API khi component mount hoặc idTest thay đổi
  useEffect(() => {
    const fetchTestData = async () => {
      if (!resolvedTestId) return;

      try {
        setLoading(true);
        const res = await getDetailInTestAPI(resolvedTestId);
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
  }, [locationState, resolvedTestId]);

  // Callback để cập nhật exam state khi TestInfoEditor save thành công
  const handleExamUpdate = (updatedExam) => {
    setExam(updatedExam);
  };

  // Callback khi import PDF thành công - refresh lại dữ liệu
  const handlePdfImportSuccess = async (importedIdTest) => {
    try {
      setLoading(true);
      const res = await getDetailInTestAPI(resolvedTestId);
      if (res?.data) {
        setExam(res.data);
        message.success("Import PDF thành công! Đã thêm nội dung vào đề thi.");
      }
    } catch (error) {
      console.error("Error refreshing after import:", error);
      message.warning("Import thành công nhưng cần tải lại trang để xem nội dung mới.");
    } finally {
      setLoading(false);
    }
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
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <Button
          type="default"
          icon={<UploadOutlined />}
          onClick={() => setShowPdfImportModal(true)}
          className="flex items-center gap-2 shadow-md"
        >
          <FilePdfOutlined />
          Import PDF
        </Button>
      </div>
      {renderTestComponent()}
      <PdfImportModal
        visible={showPdfImportModal}
        onClose={() => setShowPdfImportModal(false)}
        idTest={resolvedTestId}
        testType={exam?.testType}
        exam={exam}
        onImportSuccess={handlePdfImportSuccess}
      />
    </div>
  );
};

export default TestEdit;
