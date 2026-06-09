import React, { useState } from "react";
import { Input, Select, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { createTestAPI } from "@/services/apiTest";
import { useAuth } from "@/context/authContext";
import RichTextEditor from "@/components/ui/RichTextEditor";

const { Option } = Select;

const CreateTestForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    idUser: user?.idUser || "",
    testType: " Loại đề",
    title: "",
    description: "",
    duration: "",
    numberQuestion: "",
    level: "Độ khó",
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
    // Validate duration client-side: teacher enters minutes, backend
    // stores seconds. Convert to seconds before sending.
    const minutes = Number(formData.duration);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      message.error("Vui lòng nhập thời lượng hợp lệ (phút).");
      return;
    }
    if (minutes > 60) {
      message.error("Thời lượng tối đa là 60 phút.");
      return;
    }
    const seconds = Math.round(minutes * 60);

    try {
      setLoading(true);
      const payload = { ...formData, duration: seconds };
      const res = await createTestAPI(payload);
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

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md p-6 rounded-2xl">
      <h2 className="text-2xl font-semibold mb-4">Tạo đề IELTS mới</h2>

      <div className="flex flex-col gap-4">
        <Select
          placeholder="Chọn loại đề"
          onChange={(value) => handleChange("testType", value)}
          value={formData.testType}
        >
          <Option value="LISTENING">Listening</Option>
          <Option value="READING">Reading</Option>
          <Option value="WRITING">Writing</Option>
          <Option value="SPEAKING">Speaking</Option>
        </Select>

        <Input
          placeholder="Tiêu đề đề thi"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
        />

        <RichTextEditor
          value={formData.description}
          onChange={(html) => handleChange("description", html)}
          placeholder="Nhập mô tả đề thi (có thể định dạng text)"
          minHeight="180px"
        />

        <Input
          placeholder="Thời lượng (phút, tối đa 60)"
          value={formData.duration}
          onChange={(e) => handleChange("duration", e.target.value)}
          type="number"
          min={1}
          max={60}
        />

        <Input
          placeholder="Số lượng câu hỏi"
          value={formData.numberQuestion}
          onChange={(e) => handleChange("numberQuestion", e.target.value)}
        />

        <Select
          placeholder="Chọn độ khó"
          onChange={(value) => handleChange("level", value)}
          value={formData.level}
        >
          <Option value="Low">Dễ</Option>
          <Option value="Mid">Trung bình</Option>
          <Option value="High">Khó</Option>
        </Select>

        <Upload
          beforeUpload={(file) => {
            handleFileChange("img", file);
            return false; // chặn auto upload
          }}
        >
          <Button icon={<UploadOutlined />}>Tải ảnh minh hoạ</Button>
        </Upload>

        {formData.testType === "LISTENING" && (
          <Upload
            beforeUpload={(file) => {
              handleFileChange("audioUrl", file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>Tải file audio</Button>
          </Upload>
        )}

        <Button
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          className="w-full"
        >
          Tạo đề
        </Button>
      </div>
    </div>
  );
};

export default CreateTestForm;
