import React, { useState, useEffect } from "react";
import {
  Input,
  Select,
  Row,
  Col,
  Space,
  Spin,
  Button,
  Modal,
  message,
  Tag,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { getAPITest, deleteAPITest } from "@/services/apiTest";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/authContext";

const TestManager = () => {
  const [loaiDe, setLoaiDe] = useState("ALL");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch exams từ API
  useEffect(() => {
    fetchExams();
  }, [loaiDe]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await getAPITest();
      setExams(res.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      message.error("Lỗi khi tải danh sách đề thi");
    } finally {
      setLoading(false);
    }
  };

  // Lọc và sắp xếp exams
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
          const levelValue = { Low: 1, Mid: 2, High: 3 };
          if (sortBy === "newest")
            return new Date(b.createdAt) - new Date(a.createdAt);
          if (sortBy === "level-asc")
            return levelValue[a.level] - levelValue[b.level];
          if (sortBy === "level-desc")
            return levelValue[b.level] - levelValue[a.level];
          return 0;
        })
    : [];

  // Xử lý các action
  const handleViewExam = (exam) => {
    navigate(`./testEdit/${exam.idDe}`, { state: { exam } });
  };

  const handleEditExam = (exam) => {
    navigate(`./testEdit/${exam.idDe}`, { state: { exam } });
  };

  const handleCreateExam = () => {
    navigate("./testCreate");
  };

  const handleDeleteClick = (exam) => {
    setSelectedExam(exam);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteAPITest(selectedExam.idDe);
      message.success("Xóa đề thi thành công");
      fetchExams(); // Refresh list
    } catch (error) {
      console.error("Lỗi xóa đề thi:", error);
      message.error("Lỗi khi xóa đề thi");
    } finally {
      setDeleteModalVisible(false);
      setSelectedExam(null);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header với tiêu đề và nút tạo mới */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý đề thi</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateExam}
            size="large"
          >
            Tạo đề thi mới
          </Button>
        </div>

        {/* Search và Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <Row gutter={[16, 16]} align="bottom">
            <Col xs={24} md={8}>
              <label className="block text-sm font-medium mb-2">
                Loại đề thi
              </label>
              <Select
                size="large"
                className="w-full"
                value={loaiDe}
                onChange={setLoaiDe}
                options={[
                  { value: "ALL", label: "Tất cả loại đề" },
                  { value: "LISTENING", label: "Listening" },
                  { value: "READING", label: "Reading" },
                  { value: "WRITING", label: "Writing" },
                  { value: "SPEAKING", label: "Speaking" },
                ]}
              />
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
                  { value: "level-asc", label: "Dễ -> Khó" },
                  { value: "level-desc", label: "Khó -> Dễ" },
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
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                  {/* Header với badge loại đề */}
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <Tag color={getTypeColor(exam.loaiDe)} className="mb-2">
                        {exam.loaiDe}
                      </Tag>
                      <span className="text-sm text-gray-500">
                        Độ khó: <b>{exam.level || "N/A"}</b>
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">
                      {exam.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {exam.description}
                    </p>
                  </div>

                  {/* Thông tin đề thi */}
                  <div className="p-4 flex-grow">
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Số câu:</span>
                        <span className="font-medium">
                          {exam.numberQuestion || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thời gian:</span>
                        <span className="font-medium">
                          {exam.duration || "N/A"} phút
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ngày tạo:</span>
                        <span className="font-medium">
                          {exam.createdAt
                            ? new Date(exam.createdAt).toLocaleDateString(
                                "vi-VN"
                              )
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="p-4 border-t">
                    <Space size="small" className="w-full flex justify-between">
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleViewExam(exam)}
                        size="small"
                      >
                        Xem
                      </Button>
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEditExam(exam)}
                        size="small"
                        type="primary"
                      >
                        Sửa
                      </Button>
                      <Button
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteClick(exam)}
                        size="small"
                        danger
                      >
                        Xóa
                      </Button>
                    </Space>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}

        {!loading && filteredExams.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
            Không tìm thấy đề thi phù hợp
          </div>
        )}

        {/* Modal xác nhận xóa */}
        <Modal
          title="Xác nhận xóa"
          open={deleteModalVisible}
          onOk={handleConfirmDelete}
          onCancel={() => setDeleteModalVisible(false)}
          okText="Xóa"
          cancelText="Hủy"
          okType="danger"
        >
          <p>
            Bạn có chắc chắn muốn xóa đề thi{" "}
            <strong>"{selectedExam?.title}"</strong> không?
          </p>
          <p className="text-red-500">Hành động này không thể hoàn tác.</p>
        </Modal>
      </div>
    </div>
  );
};

export default TestManager;
