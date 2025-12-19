// CreateThread - Updated with enhanced UI
import { useState } from "react";
import { Modal, Input, Button, message } from "antd";
import { createThreadAPI } from "@/services/apiForum";
import { useAuth } from "@/context/authContext";
import { PlusCircleOutlined, FileTextOutlined } from "@ant-design/icons";

const CreateThread = ({ open, onClose, setThreads }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return message.error("Nhập tên chủ đề");

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-500 flex items-center justify-center">
            <PlusCircleOutlined className="text-white text-lg" />
          </div>
          <div>
            <span className="text-slate-900 font-semibold text-lg">
              Tạo chủ đề mới
            </span>
            <p className="text-slate-500 text-xs font-normal">
              Bắt đầu một cuộc thảo luận mới
            </p>
          </div>
        </div>
      }
      onCancel={onClose}
      footer={false}
      className="rounded-2xl"
      width={520}
    >
      <div className="space-y-5 pt-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <FileTextOutlined className="text-blue-500" />
            Tên chủ đề
          </label>
          <Input
            placeholder="VD: Chia sẻ tips học IELTS Writing Task 2..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border-slate-200 h-11 hover:border-blue-300 focus:border-blue-400"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <FileTextOutlined className="text-blue-500" />
            Mô tả chủ đề
          </label>
          <Input.TextArea
            placeholder="Mô tả chi tiết về chủ đề bạn muốn thảo luận..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-xl border-slate-200 hover:border-blue-300 focus:border-blue-400"
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <Button
            onClick={onClose}
            className="border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 rounded-xl px-6 h-10"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleCreate}
            loading={loading}
            disabled={!title.trim()}
            className="bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-purple-700 border-0 rounded-xl px-6 h-10 font-medium shadow-md shadow-blue-200"
          >
            Tạo chủ đề
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateThread;
