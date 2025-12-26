import React, { useState, useEffect } from "react";
import {
  Card,
  InputNumber,
  Button,
  message,
  Spin,
  Select,
  Input,
  Upload,
  Row,
  Col,
  Tag,
  Form,
  Space,
  Tooltip,
} from "antd";
import {
  SaveOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  FileTextOutlined,
  SoundOutlined,
  EditOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { updateTestInfoAPI } from "@/services/apiTest";
import { useNavigate } from "react-router";
import RichTextEditor from "@/components/ui/RichTextEditor";

const { Option } = Select;

const TestInfoEditor = ({ exam, onUpdate }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  // State lưu trữ File Object thực sự
  const [newAudioFile, setNewAudioFile] = useState(null);

  // --- FIX CACHE: State để lưu phiên bản audio ---
  const [audioVersion, setAudioVersion] = useState(Date.now());

  // Lấy URL gốc
  const rawAudioSrc = exam?.audio || exam?.audioUrl;

  // Reset version khi chuyển sang đề thi khác
  useEffect(() => {
    if (exam) {
      setAudioVersion(Date.now()); // Reset cache buster khi load đề mới
      form.setFieldsValue({
        title: exam.title,
        description: exam.description,
        level: exam.level || "EASY",
        duration: exam.duration,
        numberQuestion: exam.numberQuestion,
      });
    }
  }, [exam, form]);

  // Tạo URL có gắn đuôi timestamp để chống cache
  const audioSrcWithCache = rawAudioSrc
    ? `${rawAudioSrc}?v=${audioVersion}`
    : null;

  const getMaxQuestions = () => {
    if (exam?.testType === "WRITING" || exam?.testType === "SPEAKING") return 2;
    return 40;
  };

  const onBeforeUpload = (file) => {
    setNewAudioFile(file);
    return false;
  };

  const onRemoveFile = () => {
    setNewAudioFile(null);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!exam?.idTest || !exam?.idUser)
        return message.error("Thiếu thông tin");

      setLoading(true);

      const formData = new FormData();
      formData.append("idUser", exam.idUser);
      formData.append("testType", exam.testType);
      formData.append("title", values.title);
      formData.append("description", values.description || "");
      formData.append("level", values.level);
      formData.append("duration", values.duration);
      formData.append("numberQuestion", values.numberQuestion);

      if (newAudioFile) {
        formData.append("audioUrl", newAudioFile);
      }

      const res = await updateTestInfoAPI(exam.idTest, formData);

      if (res?.data) {
        message.success("Cập nhật thành công!");
        setNewAudioFile(null);
        setIsEditing(false);

        // --- FIX CACHE: Cập nhật timestamp ngay lập tức ---
        setAudioVersion(Date.now());

        if (onUpdate) onUpdate(res.data);
      } else {
        message.error("Cập nhật thất bại.");
      }
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu.");
    } finally {
      setLoading(false);
    }
  };

  if (!exam) return <Spin className="block mx-auto my-4" />;

  // --- COMPACT VIEW ---
  if (!isEditing) {
    return (
      <div className="bg-white p-3 border-b shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <Button
            icon={<ArrowLeftOutlined />}
            size="small"
            onClick={() => navigate("/teacher/testManager")}
          />
          <div className="flex flex-col min-w-[200px]">
            <span
              className="font-bold text-lg truncate text-blue-800"
              title={exam.title}
            >
              {exam.title}
            </span>
            <Space size="small" className="text-xs text-gray-500">
              <Tag color="blue">{exam.testType}</Tag>
              <span>
                <ClockCircleOutlined /> {exam.duration}p
              </span>
              <span>
                <QuestionCircleOutlined /> {exam.numberQuestion} câu
              </span>
            </Space>
          </div>

          {/* CHỈ HIỂN THỊ AUDIO PLAYER NẾU LÀ LISTENING */}
          {exam.testType === "LISTENING" && rawAudioSrc && (
            <div className="flex-1 max-w-2xl px-4 border-l border-gray-200 flex items-center gap-2">
              <SoundOutlined className="text-blue-600" />
              <audio
                key={audioVersion}
                controls
                className="h-8 w-full shadow-sm rounded-full bg-gray-50"
                src={audioSrcWithCache}
                controlsList="nodownload"
              />
            </div>
          )}
        </div>

        <div className="shrink-0">
          <Tooltip title="Chỉnh sửa thông tin đề">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setIsEditing(true)}
            >
              Sửa thông tin
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  }

  // --- EDIT FORM ---
  return (
    <Card
      className="m-4 shadow-md border-t-4 border-t-blue-600 animate-fade-in"
      bodyStyle={{ padding: "16px 24px" }}
      title={
        <div className="flex justify-between items-center">
          <span>Chỉnh sửa thông tin đề thi</span>
          <Button
            type="text"
            icon={<CloseOutlined />}
            danger
            onClick={() => setIsEditing(false)}
          >
            Đóng
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ ...exam }}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-8">
            <Form.Item
              name="title"
              label="Tên đề thi"
              rules={[{ required: true }]}
            >
              <Input size="large" prefix={<FileTextOutlined />} />
            </Form.Item>
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            className="mt-8 bg-green-600 hover:bg-green-500 border-green-600"
          >
            Lưu & Đóng
          </Button>
        </div>

        <Row gutter={24}>
          <Col span={14}>
            <Form.Item name="description" label="Mô tả (hỗ trợ định dạng HTML)">
              <Form.Item
                name="description"
                noStyle
                getValueFromEvent={(html) => html}
              >
                <RichTextEditor minHeight="150px" placeholder="Nhập mô tả đề thi..." />
              </Form.Item>
            </Form.Item>

            {/* CHỈ HIỂN THỊ UPLOAD AUDIO NẾU LÀ LISTENING */}
            {exam.testType === "LISTENING" && (
              <div className="p-4 bg-blue-50 rounded border border-blue-100 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-blue-800">
                    <SoundOutlined /> File Audio
                  </span>
                  {newAudioFile && <Tag color="green">Đã chọn file mới</Tag>}
                </div>

                <Upload
                  beforeUpload={onBeforeUpload}
                  onRemove={onRemoveFile}
                  maxCount={1}
                  accept="audio/*"
                  fileList={newAudioFile ? [newAudioFile] : []}
                >
                  <Button icon={<UploadOutlined />}>
                    {newAudioFile
                      ? "Đổi file khác"
                      : rawAudioSrc
                        ? "Thay đổi Audio hiện tại"
                        : "Tải Audio"}
                  </Button>
                </Upload>
              </div>
            )}
          </Col>

          <Col span={10}>
            <Card
              type="inner"
              title="Cấu hình"
              size="small"
              className="bg-gray-50"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="level" label="Độ khó">
                    <Select>
                      <Option value="EASY">Easy</Option>
                      <Option value="MEDIUM">Medium</Option>
                      <Option value="HARD">Hard</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="duration" label="Thời gian (phút)">
                    <InputNumber min={1} className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="numberQuestion" label="Số câu hỏi">
                    <InputNumber
                      min={1}
                      max={getMaxQuestions()}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default TestInfoEditor;
