// CreateThread - Updated
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

    try {
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
    } catch (error) {
      message.error("Tạo chủ đề thất bại!");
    }
  };

  return (
    <Modal
      open={open}
      title={
        <span className="text-slate-900 font-semibold">Tạo chủ đề mới</span>
      }
      onCancel={onClose}
      footer={false}
      className="rounded-lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tên chủ đề
          </label>
          <Input
            placeholder="Nhập tên chủ đề..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border-slate-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mô tả
          </label>
          <Input.TextArea
            placeholder="Nhập mô tả..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-lg border-slate-300"
          />
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            onClick={onClose}
            className="border-slate-300 text-slate-700 rounded-lg"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleCreate}
            className="bg-slate-900 hover:bg-slate-800 border-slate-900 hover:border-slate-800 rounded-lg"
          >
            Tạo chủ đề
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateThread;
