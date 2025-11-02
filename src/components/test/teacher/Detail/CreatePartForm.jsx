import React, { useState } from "react";
import { Input, Button, message } from "antd";
// import { createPartAPI } from "@/services/apiPart";

const CreatePartForm = ({ idTest, testType, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    try {
      const data = { idTest, title, description, testType };
      const res = await createPartAPI(data);
      message.success("Tạo Part thành công!");
      onSuccess(res.data);
    } catch (err) {
      message.error("Tạo Part thất bại!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Tạo Part mới ({testType})
      </h2>
      <Input
        className="mb-3"
        placeholder="Nhập tiêu đề Part"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input.TextArea
        className="mb-3"
        placeholder="Mô tả Part (nếu có)"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button type="primary" onClick={handleSubmit}>
        Tạo Part
      </Button>
    </div>
  );
};

export default CreatePartForm;
