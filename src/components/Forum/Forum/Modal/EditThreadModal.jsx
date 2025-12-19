// EditThreadModal - Updated with enhanced UI
import { Modal, Input, Button, message } from "antd";
import { useState } from "react";
import { updateThreadAPI } from "@/services/apiForum";
import { useAuth } from "@/context/authContext";
import { EditOutlined, FileTextOutlined } from "@ant-design/icons";

const EditThreadModal = ({ open, onClose, thread, setThreads }) => {
  const [title, setTitle] = useState(thread.title);
  const { user } = useAuth();
  const [content, setContent] = useState(thread.content);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!title.trim()) return message.error("Nhập tên chủ đề");

    setLoading(true);
    try {
      const res = await updateThreadAPI(thread.idForumThreads, {
        idUser: user.idUser,
        title,
        content,
      });

      const updatedThread = res.data;
      setThreads((prev) =>
        prev.map((t) =>
          t.idForumThreads === thread.idForumThreads ? updatedThread : t
        )
      );
      message.success("Cập nhật thành công!");
      onClose();
    } catch {
      message.error("Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
            <EditOutlined className="text-white text-lg" />
          </div>
          <div>
            <span className="text-slate-900 font-semibold text-lg">
              Chỉnh sửa chủ đề
            </span>
            <p className="text-slate-500 text-xs font-normal">
              Cập nhật thông tin chủ đề
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
            <FileTextOutlined className="text-amber-500" />
            Tên chủ đề
          </label>
          <Input
            placeholder="Nhập tên chủ đề..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border-slate-200 h-11 hover:border-amber-300 focus:border-amber-400"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <FileTextOutlined className="text-orange-500" />
            Mô tả chủ đề
          </label>
          <Input.TextArea
            placeholder="Nhập mô tả..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-xl border-slate-200 hover:border-amber-300 focus:border-amber-400"
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
            onClick={handleUpdate}
            loading={loading}
            disabled={!title.trim()}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 rounded-xl px-6 h-10 font-medium shadow-md shadow-amber-200"
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditThreadModal;
