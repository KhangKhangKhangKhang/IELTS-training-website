import { useState } from "react";
import { Modal, Input, Button, message } from "antd";
import { createThreadAPI } from "@/services/apiForum";
import { useAuth } from "@/context/authContext";
const CreateThread = ({ open, onClose, setThreads }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { user } = useAuth();

  const handleCreate = async () => {
    if (!title.trim()) return message.error("Nhập tên chủ đề");

    const res = await createThreadAPI({
      idUser: user.idUser,
      title,
      content,
    });

    const newThread = res.data;
    setThreads((prev) => [newThread, ...prev]);

    message.success("Tạo chủ đề thành công!");
    setTitle("");
    setContent("");
    onClose();
  };

  return (
    <Modal open={open} title="Tạo chủ đề mới" onCancel={onClose} footer={false}>
      <div className="mb-2 text-sm text-gray-500">
        <Input
          placeholder="Tên chủ đề"
          className="mb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <Input.TextArea
        placeholder="Mô tả"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="text-right mt-3">
        <Button type="primary" onClick={handleCreate}>
          Tạo
        </Button>
      </div>
    </Modal>
  );
};

export default CreateThread;
