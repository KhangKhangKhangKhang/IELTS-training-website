import React, { useState } from "react";
import {
  Card,
  Tag,
  Button,
  Collapse,
  Typography,
  Empty,
  Divider,
  Space,
} from "antd";
import {
  SoundOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  EditOutlined,
} from "@ant-design/icons";
import CreatePartForm from "../Detail/CreatePartForm"; // Component bạn đã có

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const CreateListening = ({ idTest, exam }) => {
  const [parts, setParts] = useState([]); // State lưu danh sách các Part
  const [isCreatingPart, setIsCreatingPart] = useState(false);

  // Giả sử API trả về audioUrl là đường dẫn file.
  // Nếu API trả về base64, bạn có thể dùng trực tiếp.
  // Nếu chỉ trả về filename, bạn cần ghép với BASE_URL của server.
  const audioSrc = exam.audioUrl;

  // Hàm xử lý khi tạo Part thành công
  const handlePartSuccess = (newPart) => {
    console.log("New part created:", newPart);
    setParts([...parts, newPart]);
    setIsCreatingPart(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* --- SECTION 1: THÔNG TIN CHUNG & AUDIO PLAYER --- */}
      <Card className="shadow-md border-t-4 border-blue-500">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Cột trái: Thông tin đề */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Tag color="blue" className="text-sm px-3 py-1">
                {exam.testType}
              </Tag>
              <Tag color={exam.level === "Hard" ? "red" : "green"}>
                {exam.level || "Medium"}
              </Tag>
            </div>

            <Title level={2} className="mb-2 !text-blue-800">
              {exam.title}
            </Title>

            <Paragraph type="secondary" className="mb-4">
              {exam.description || "Chưa có mô tả cho đề thi này."}
            </Paragraph>

            <Space size="large" className="text-gray-600">
              <span className="flex items-center gap-2">
                <ClockCircleOutlined /> {exam.duration} phút
              </span>
              <span className="flex items-center gap-2">
                <QuestionCircleOutlined /> {exam.numberQuestion} câu hỏi
              </span>
            </Space>
          </div>

          {/* Cột phải: Audio Player */}
          {audioSrc && (
            <div className="md:w-1/3 bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col justify-center items-center">
              <div className="mb-3 text-blue-600 font-medium flex items-center gap-2">
                <SoundOutlined className="text-xl animate-pulse" />
                <span>File nghe chính</span>
              </div>

              {/* HTML5 Audio Player - Có thể thay bằng thư viện 'react-h5-audio-player' nếu cần đẹp hơn */}
              <audio controls className="w-full shadow-sm rounded-full">
                <source src={audioSrc} type="audio/mpeg" />
                <source src={audioSrc} type="audio/wav" />
                Trình duyệt của bạn không hỗ trợ phát âm thanh.
              </audio>

              <Text type="secondary" className="text-xs mt-2 text-center block">
                Nghe kỹ đoạn audio để chia Part và tạo câu hỏi chính xác.
              </Text>
            </div>
          )}
        </div>
      </Card>

      <Divider orientation="left">
        <span className="text-xl font-semibold text-gray-700">
          Cấu trúc bài thi (Parts)
        </span>
      </Divider>

      {/* --- SECTION 2: DANH SÁCH PARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Form tạo Part hoặc List Parts */}
        <div className="lg:col-span-3">
          {isCreatingPart ? (
            <div className="bg-white p-6 rounded-lg shadow border border-indigo-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-indigo-700">
                  Thêm phần thi mới
                </h3>
                <Button onClick={() => setIsCreatingPart(false)}>Hủy bỏ</Button>
              </div>
              {/* Gọi Component CreatePartForm của bạn */}
              <CreatePartForm
                idTest={idTest}
                testType="LISTENING"
                onSuccess={handlePartSuccess}
              />
            </div>
          ) : (
            <Button
              type="dashed"
              block
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setIsCreatingPart(true)}
              className="mb-6 h-16 text-lg border-blue-400 text-blue-500 hover:text-blue-700 hover:border-blue-600"
            >
              Thêm Part mới (Ví dụ: Part 1 - Mô tả tranh)
            </Button>
          )}

          {/* Danh sách các Part đã tạo */}
          {parts.length > 0 ? (
            <Collapse
              defaultActiveKey={["0"]}
              className="bg-white shadow-sm"
              expandIconPosition="end"
            >
              {parts.map((part, index) => (
                <Panel
                  header={
                    <div className="flex items-center gap-2 font-medium text-lg py-1">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        Part {index + 1}
                      </span>
                      <span>{part.name || `Phần thi số ${index + 1}`}</span>
                    </div>
                  }
                  key={index}
                  extra={
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                >
                  <div className="pl-4 border-l-2 border-gray-200">
                    <p className="text-gray-500 mb-4">{part.description}</p>

                    {/* Placeholder cho danh sách câu hỏi trong Part */}
                    <div className="bg-gray-50 p-4 rounded border border-dashed border-gray-300 text-center">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Chưa có câu hỏi nào trong phần này"
                      />
                      <Button type="primary" size="small" className="mt-2">
                        Thêm câu hỏi
                      </Button>
                    </div>
                  </div>
                </Panel>
              ))}
            </Collapse>
          ) : (
            !isCreatingPart && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Empty description="Chưa có phần thi nào được tạo" />
                <p className="text-gray-400 mt-2">
                  Hãy bắt đầu bằng cách nhấn nút "Thêm Part mới" ở trên
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateListening;
