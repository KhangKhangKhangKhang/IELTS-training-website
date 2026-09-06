// EditThreadModal - modal sửa thread, style indigo đồng bộ
import { Modal, Input, Button, message } from "antd";
import { useState } from "react";
import { updateThreadAPI } from "@/services/apiForum";
import { useAuth } from "@/context/authContext";

const EditThreadModal = ({ open, onClose, thread, setThreads }) => {
  const [title, setTitle] = useState(thread.title);
  const [content, setContent] = useState(thread.content);
  const { user } = useAuth();
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
      setThreads((prev) =>
        prev.map((t) =>
          t.idForumThreads === thread.idForumThreads ? res.data : t,
        ),
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-lg">
            ✏️
          </div>
          <div>
            <span className="text-slate-900 font-bold text-lg block">
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
      width={520}
    >
      <div className="space-y-4 pt-2">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Tên chủ đề
          </label>
          <Input
            placeholder="Nhập tên chủ đề..."
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
            placeholder="Nhập mô tả..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="!rounded-xl !border-slate-200 hover:!border-indigo-300 focus:!border-indigo-500"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <Button
            onClick={onClose}
            className="!rounded-xl !px-5 !h-10 !border-slate-200 !text-slate-600"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleUpdate}
            loading={loading}
            disabled={!title.trim()}
            className="!rounded-xl !px-5 !h-10 !bg-indigo-600 hover:!bg-indigo-700 !border-0 !font-bold"
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditThreadModal;
