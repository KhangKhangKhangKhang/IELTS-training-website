import React, { useState, useEffect } from "react";
import { Input, Select, Row, Col, Space, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { mockExamsAPI } from "@/lib/mockExamsAPI";
import ExamSelector from "@/components/test/examSelector";
import ExamCard from "@/components/test/examCard";
import { getAPITest } from "@/services/apiTest";
import { useNavigate } from "react-router";

const TestPage = () => {
  const [loaiDe, setLoaiDe] = useState("LISTENING");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const navigate = useNavigate();

  // Giả lập API call
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
  }, [loaiDe]);

  const filteredExams = Array.isArray(exams)
    ? exams
        .filter((exam) => {
          const matchLoaiDe = loaiDe === "ALL" || exam.loaiDe === loaiDe;
          const matchSearch =
            exam.title.toLowerCase().includes(searchText.toLowerCase()) ||
            exam.description.toLowerCase().includes(searchText.toLowerCase());
          return matchLoaiDe && matchSearch;
        })
        .sort((a, b) => {
          if (sortBy === "newest")
            return new Date(b.createdAt) - new Date(a.createdAt);
          if (sortBy === "mostAttempts") return b.attempts - a.attempts;
          return 0;
        })
    : [];

  const handleExamClick = () => {
    console.log(loaiDe);
    navigate(`/test/${loaiDe}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Search và Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <Row gutter={[16, 16]} align="bottom">
            <Col xs={24} md={8}>
              <label className="block text-sm font-medium mb-2">
                Loại đề thi
              </label>
              <ExamSelector currentType={loaiDe} onTypeChange={setLoaiDe} />
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
                  { value: "mostAttempts", label: "Lượt làm nhiều" },
                ]}
              />
            </Col>
          </Row>
        </div>

        {/* Danh sách đề thi */}
        {loading ? (
          <div className="text-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredExams.map((exam) => (
              <Col key={exam.idDe} xs={24} sm={12} lg={8} xl={6}>
                <ExamCard exam={exam} onExamClick={handleExamClick} />
              </Col>
            ))}
          </Row>
        )}

        {!loading && filteredExams.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy đề thi phù hợp
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPage;
