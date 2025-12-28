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
  UploadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { updateTestInfoAPI } from "@/services/apiTest";
import { useNavigate } from "react-router";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  Edit3,
  FileText,
  Volume2,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
} from "lucide-react";

const { Option } = Select;

// Helper: Get test type icon
const getTestTypeIcon = (type) => {
  const icons = {
    READING: BookOpen,
    LISTENING: Headphones,
    WRITING: PenTool,
    SPEAKING: Mic,
  };
  return icons[type] || FileText;
};

const getTestTypeGradient = (type) => {
  const gradients = {
    READING: "from-blue-500 to-cyan-500",
    LISTENING: "from-green-500 to-emerald-500",
    WRITING: "from-purple-500 to-pink-500",
    SPEAKING: "from-orange-500 to-red-500",
  };
  return gradients[type] || "from-gray-500 to-gray-600";
};

const TestInfoEditor = ({ exam, onUpdate }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  const [newAudioFile, setNewAudioFile] = useState(null);
  const [audioVersion, setAudioVersion] = useState(Date.now());

  const rawAudioSrc = exam?.audio || exam?.audioUrl;

  useEffect(() => {
    if (exam) {
      setAudioVersion(Date.now());
      form.setFieldsValue({
        title: exam.title,
        description: exam.description,
        level: exam.level || "EASY",
        duration: exam.duration,
        numberQuestion: exam.numberQuestion,
      });
    }
  }, [exam, form]);

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

  const IconComponent = getTestTypeIcon(exam.testType);
  const gradient = getTestTypeGradient(exam.testType);

  // --- COMPACT VIEW ---
  if (!isEditing) {
    return (
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between p-4 gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-1 overflow-hidden">
            <button
              onClick={() => navigate("/teacher/testManager")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
            >
              <ArrowLeft size={20} />
            </button>
            
            {/* Type Badge */}
            <div className={`p-2.5 bg-gradient-to-r ${gradient} rounded-xl shadow-lg shadow-${exam.testType === 'READING' ? 'blue' : exam.testType === 'LISTENING' ? 'green' : exam.testType === 'WRITING' ? 'purple' : 'orange'}-500/25`}>
              <IconComponent size={22} className="text-white" />
            </div>

            {/* Test Info */}
            <div className="flex flex-col min-w-[200px]">
              <h1 className="font-bold text-lg text-gray-800 dark:text-white truncate" title={exam.title}>
                {exam.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${gradient} text-white`}>
                  {exam.testType}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {exam.duration}p
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle size={14} />
                  {exam.numberQuestion} câu
                </span>
              </div>
            </div>

            {/* Audio Player for Listening */}
            {exam.testType === "LISTENING" && rawAudioSrc && (
              <div className="flex-1 max-w-xl px-4 border-l border-gray-200 dark:border-slate-600 flex items-center gap-2">
                <Volume2 className="text-green-500" size={20} />
                <audio
                  key={audioVersion}
                  controls
                  className="h-8 w-full rounded-full"
                  src={audioSrcWithCache}
                  controlsList="nodownload"
                />
              </div>
            )}
          </div>

          {/* Right Section */}
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Edit3 size={16} />
            Sửa thông tin
          </button>
        </div>
      </div>
    );
  }

  // --- EDIT FORM ---
  return (
    <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-md">
      <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Edit3 size={20} className="text-blue-600 dark:text-blue-400" />
          Chỉnh sửa thông tin đề thi
        </h2>
        <button
          onClick={() => setIsEditing(false)}
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <CloseOutlined />
        </button>
      </div>
      
      <div className="p-6">
        <Form form={form} layout="vertical" initialValues={{ ...exam }}>
          <div className="flex justify-between items-start mb-4 gap-4">
            <div className="flex-1">
              <Form.Item
                name="title"
                label={<span className="text-gray-700 dark:text-gray-300">Tên đề thi</span>}
                rules={[{ required: true }]}
              >
                <Input size="large" prefix={<FileText size={16} className="text-gray-400" />} className="dark:bg-slate-700 dark:border-slate-600" />
              </Form.Item>
            </div>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}
              className="mt-8 bg-green-600 hover:bg-green-500 border-green-600"
              size="large"
            >
              Lưu & Đóng
            </Button>
          </div>

          <Row gutter={24}>
            <Col span={14}>
              <Form.Item name="description" label={<span className="text-gray-700 dark:text-gray-300">Mô tả (hỗ trợ định dạng HTML)</span>}>
                <Form.Item
                  name="description"
                  noStyle
                  getValueFromEvent={(html) => html}
                >
                  <RichTextEditor minHeight="150px" placeholder="Nhập mô tả đề thi..." />
                </Form.Item>
              </Form.Item>

              {/* Audio Upload for Listening */}
              {exam.testType === "LISTENING" && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-green-800 dark:text-green-400 flex items-center gap-2">
                      <Volume2 size={18} />
                      File Audio
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
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-100 dark:border-slate-600">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Cấu hình</h3>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="level" label={<span className="text-gray-600 dark:text-gray-400">Độ khó</span>}>
                      <Select className="w-full">
                        <Option value="EASY">Easy</Option>
                        <Option value="MEDIUM">Medium</Option>
                        <Option value="HARD">Hard</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="duration" label={<span className="text-gray-600 dark:text-gray-400">Thời gian (phút)</span>}>
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="numberQuestion" label={<span className="text-gray-600 dark:text-gray-400">Số câu hỏi</span>}>
                      <InputNumber
                        min={1}
                        max={getMaxQuestions()}
                        className="w-full"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default TestInfoEditor;
