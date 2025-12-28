import React, { useState } from "react";
import { Input, Select, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { createTestAPI } from "@/services/apiTest";
import { useAuth } from "@/context/authContext";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Clock,
  FileText,
  Image,
  HelpCircle,
  Plus,
} from "lucide-react";

const { Option } = Select;

const CreateTestForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    idUser: user?.idUser || "",
    testType: "",
    title: "",
    description: "",
    duration: "",
    numberQuestion: "",
    level: "",
    img: null,
    audioUrl: null,
  });

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (key, file) => {
    setFormData((prev) => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await createTestAPI(formData);
      if (res?.data) {
        message.success("Tạo đề thành công!");
        onSuccess(res.data);
      } else {
        message.error("Tạo đề thất bại, vui lòng thử lại.");
        console.log("Response data:", res?.data);
      }
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra khi tạo đề.");
    } finally {
      setLoading(false);
    }
  };

  const testTypes = [
    { value: "LISTENING", label: "Listening", icon: Headphones, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
    { value: "READING", label: "Reading", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { value: "WRITING", label: "Writing", icon: PenTool, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
    { value: "SPEAKING", label: "Speaking", icon: Mic, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
          <Plus size={32} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Tạo đề IELTS mới
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Điền thông tin để tạo đề thi mới
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 border border-gray-100 dark:border-slate-700">
        <div className="flex flex-col gap-6">
          {/* Test Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Loại đề thi
            </label>
            <div className="grid grid-cols-4 gap-3">
              {testTypes.map(({ value, label, icon: Icon, color, bg }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange("testType", value)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.testType === value
                      ? `${bg} border-current ${color} shadow-md`
                      : "bg-gray-50 dark:bg-slate-700 border-transparent hover:border-gray-200 dark:hover:border-slate-600"
                  }`}
                >
                  <Icon size={24} className={formData.testType === value ? color : "text-gray-400"} />
                  <span className={`mt-2 text-sm font-medium ${formData.testType === value ? color : "text-gray-600 dark:text-gray-300"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FileText size={16} className="inline mr-2" />
              Tiêu đề đề thi
            </label>
            <Input
              size="large"
              placeholder="VD: Cambridge IELTS 18 - Test 1"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="dark:bg-slate-700 dark:border-slate-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Mô tả (có thể định dạng text)
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(html) => handleChange("description", html)}
              placeholder="Nhập mô tả đề thi..."
              minHeight="150px"
            />
          </div>

          {/* Duration & Questions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Clock size={16} className="inline mr-2" />
                Thời lượng (phút)
              </label>
              <Input
                size="large"
                type="number"
                placeholder="60"
                value={formData.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                className="dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <HelpCircle size={16} className="inline mr-2" />
                Số lượng câu hỏi
              </label>
              <Input
                size="large"
                type="number"
                placeholder="40"
                value={formData.numberQuestion}
                onChange={(e) => handleChange("numberQuestion", e.target.value)}
                className="dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Độ khó
            </label>
            <Select
              size="large"
              placeholder="Chọn độ khó"
              onChange={(value) => handleChange("level", value)}
              value={formData.level || undefined}
              className="w-full"
            >
              <Option value="Low">🟢 Dễ</Option>
              <Option value="Mid">🟡 Trung bình</Option>
              <Option value="High">🔴 Khó</Option>
            </Select>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Image size={16} className="inline mr-2" />
                Ảnh minh hoạ
              </label>
              <Upload
                beforeUpload={(file) => {
                  handleFileChange("img", file);
                  return false;
                }}
                maxCount={1}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Tải ảnh</Button>
              </Upload>
            </div>

            {formData.testType === "LISTENING" && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                <label className="block text-sm font-semibold text-green-700 dark:text-green-400 mb-3">
                  <Headphones size={16} className="inline mr-2" />
                  File Audio
                </label>
                <Upload
                  beforeUpload={(file) => {
                    handleFileChange("audioUrl", file);
                    return false;
                  }}
                  maxCount={1}
                  accept="audio/*"
                >
                  <Button icon={<UploadOutlined />}>Tải audio</Button>
                </Upload>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.testType || !formData.title}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang tạo..." : "Tạo đề thi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTestForm;
