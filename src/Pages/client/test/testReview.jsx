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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl mr-4 shadow-lg shadow-blue-500/25">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Làm Đề Thi IELTS
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Chọn đề thi phù hợp và bắt đầu luyện tập ngay
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg dark:shadow-slate-900/50 mb-8 border border-slate-200 dark:border-slate-700">
          <Row gutter={[16, 16]} align="bottom">
            <Col xs={24} md={8}>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Loại đề thi
              </label>
              <ExamSelector className="dark:text-slate-300" currentType={testType} onTypeChange={setTestType} />
            </Col>
            <Col xs={24} md={10}>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Tìm kiếm</label>
              <Input
                size="large"
                placeholder="Nhập tên đề hoặc mô tả..."
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="rounded-xl"
              />
            </Col>
            <Col xs={24} md={6}>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Sắp xếp</label>
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

        {/* Results count */}
        {!loading && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-slate-600 dark:text-slate-400">
              Tìm thấy <span className="font-bold text-blue-600 dark:text-blue-400">{filteredExams.length}</span> đề thi
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <Spin size="large" />
            <p className="mt-4 text-slate-500 dark:text-slate-400">Đang tải đề thi...</p>
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
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="bg-slate-100 dark:bg-slate-700 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Không tìm thấy đề thi</h3>
            <p className="text-slate-500 dark:text-slate-400">Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc</p>
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
