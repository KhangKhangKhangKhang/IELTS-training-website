import React, { useState } from "react";
import { Input, Select, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { createTestAPI } from "@/services/apiTest";
import { useAuth } from "@/context/authContext";

const { TextArea } = Input;
const { Option } = Select;

const CreateTestForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    idUser: user?.idUser || "",
    loaiDe: " Loại đề",
    title: "",
    description: "",
    duration: "",
    numberQuestion: "",
    level: "Độ khó",
    img: null,
    audio: null,
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
        onSuccess(res.data); // Gửi dữ liệu test đã tạo ra ngoài
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
          onChange={(value) => handleChange("loaiDe", value)}
          value={formData.loaiDe}
        >
          <Option value="LISTENING">Listening</Option>
          <Option value="READING">Reading</Option>
          <Option value="WRITING">Writing</Option>
        </Select>

        <Input
          placeholder="Tiêu đề đề thi"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
        />

        <TextArea
          placeholder="Mô tả"
          rows={3}
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />

        <Input
          placeholder="Thời lượng (phút)"
          value={formData.duration}
          onChange={(e) => handleChange("duration", e.target.value)}
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

        {formData.loaiDe === "LISTENING" && (
          <Upload
            beforeUpload={(file) => {
              handleFileChange("audio", file);
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
