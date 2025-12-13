import React, { useState, useEffect } from "react";
import { Input, Select, Row, Col, Spin, Modal, message } from "antd"; // Thêm Modal, message
import { SearchOutlined } from "@ant-design/icons";
import ExamSelector from "@/components/test/examSelector";
import ExamCard from "@/components/test/examCard";
import { getAPITest } from "@/services/apiTest";
import { StartTestAPI } from "@/services/apiDoTest"; // Import API Start
import { useNavigate } from "react-router";
import { useAuth } from "@/context/authContext";

const TestPage = () => {
  const [testType, setTestType] = useState("Tất cả");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // State cho Modal xác nhận
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [startingTest, setStartingTest] = useState(false); // Loading khi đang gọi API Start

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const res = await getAPITest();
        setExams(res.data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [testType]);

  const filteredExams = Array.isArray(exams)
    ? exams
        .filter((exam) => {
          const matchTestType =
            testType === "Tất cả" || exam.testType === testType;
          const matchSearch =
            exam.title.toLowerCase().includes(searchText.toLowerCase()) ||
            exam.description.toLowerCase().includes(searchText.toLowerCase());
          return matchTestType && matchSearch;
        })
        .sort((a, b) => {
          if (sortBy === "newest")
            return new Date(b.createdAt) - new Date(a.createdAt);
          if (sortBy === "level") return b.level - a.level;
          return 0;
        })
    : [];

  // 1. Khi click vào đề -> Mở Modal xác nhận (chưa navigate vội)
  const handleExamClick = (exam) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setSelectedExam(exam);
    setConfirmModalOpen(true);
  };

  // 2. Khi bấm OK ở Modal -> Gọi API Start -> Có data -> Navigate
  const handleConfirmStart = async () => {
    if (!user?.idUser || !selectedExam) return;

    setStartingTest(true);
    try {
      // Gọi API Start Test
      const res = await StartTestAPI(user.idUser, selectedExam.idTest, {});

      // Kiểm tra data trả về
      const testResultData = res?.data;

      if (testResultData?.idTestResult) {
        message.success("Bắt đầu làm bài!");
        setConfirmModalOpen(false);

        // Navigate và truyền idTestResult qua state
        navigate("/doTest", {
          state: {
            idTest: selectedExam.idTest,
            testType: selectedExam.testType,
            duration: selectedExam.duration,
            initialTestResult: testResultData, // Truyền cục data này qua bên kia
          },
        });
      } else {
        throw new Error("Không lấy được ID bài làm (idTestResult)");
      }
    } catch (err) {
      console.error(err);
      message.error("Không thể bắt đầu bài thi. Vui lòng thử lại.");
    } finally {
      setStartingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ... (Giữ nguyên phần Search/Filter UI cũ) ... */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          {/* Code UI Search cũ giữ nguyên */}
          <Row gutter={[16, 16]} align="bottom">
            <Col xs={24} md={8}>
              <label className="block text-sm font-medium mb-2">
                Loại đề thi
              </label>
              <ExamSelector currentType={testType} onTypeChange={setTestType} />
            </Col>
            <Col xs={24} md={10}>
              <label className="block text-sm font-medium mb-2">Tìm kiếm</label>
              <Input
                size="large"
                placeholder="Nhập tên đề hoặc mô tả..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className="block text-sm font-medium mb-2">Sắp xếp</label>
              <Select
                size="large"
                className="w-full"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: "newest", label: "Mới nhất" },
                  { value: "level", label: "Theo cấp độ" },
                ]}
              />
            </Col>
          </Row>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredExams.map((exam) => (
              <Col key={exam.idTest} xs={24} sm={12} lg={8} xl={6}>
                <ExamCard
                  exam={exam}
                  onExamClick={() => handleExamClick(exam)} // Gọi hàm mở modal
                />
              </Col>
            ))}
          </Row>
        )}

        {!loading && filteredExams.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy đề thi phù hợp
          </div>
        )}

        {/* Modal Xác nhận Start Test */}
        <Modal
          title="Xác nhận làm bài"
          open={confirmModalOpen}
          onOk={handleConfirmStart}
          onCancel={() => setConfirmModalOpen(false)}
          confirmLoading={startingTest}
          okText="Bắt đầu ngay"
          cancelText="Hủy"
        >
          <p>
            Bạn có chắc chắn muốn bắt đầu làm đề thi:{" "}
            <strong>{selectedExam?.title}</strong>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Thời gian làm bài sẽ được tính ngay khi bạn nhấn Bắt đầu.
          </p>
        </Modal>
      </div>
    </div>
  );
};

export default TestPage;
