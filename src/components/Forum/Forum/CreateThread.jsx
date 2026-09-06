// CreateThread - modal tạo thread, style indigo đồng bộ với mockup
import { useState } from "react";
import { Modal, Input, Button, message } from "antd";
import { createThreadAPI } from "@/services/apiForum";
import { useAuth } from "@/context/authContext";

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
      setThreads((prev) => [res.data, ...prev]);
      message.success("Tạo chủ đề thành công!");
      setTitle("");
      setContent("");
      onClose();
    } catch {
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-lg">
            💬
          </div>
          <div>
            <span className="text-slate-900 font-bold text-lg block">
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
      width={520}
    >
      <div className="space-y-4 pt-2">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Tên chủ đề
          </label>
          <Input
            placeholder="VD: Chia sẻ tips học IELTS Writing Task 2..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="!rounded-xl !border-slate-200 hover:!border-indigo-300 focus:!border-indigo-500"
            size="large"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Mô tả chủ đề
          </label>
          <Input.TextArea
            placeholder="Mô tả chi tiết về chủ đề bạn muốn thảo luận..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="!rounded-xl !border-slate-200 hover:!border-indigo-300 focus:!border-indigo-500"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <Button
            onClick={onClose}
            className="!rounded-xl !px-5 !h-10 !border-slate-200 !text-slate-600 hover:!text-slate-900"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleCreate}
            loading={loading}
            disabled={!title.trim()}
            className="!rounded-xl !px-5 !h-10 !bg-indigo-600 hover:!bg-indigo-700 !border-0 !font-bold"
          >
            Tạo chủ đề
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateThread;
