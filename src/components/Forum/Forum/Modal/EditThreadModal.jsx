// EditThreadModal - Updated
import { Modal, Input, Button, message } from "antd";
import { useState } from "react";
import { updateThreadAPI } from "@/services/apiForum";
import { useAuth } from "@/context/authContext";

const EditThreadModal = ({ open, onClose, thread, setThreads }) => {
  const [title, setTitle] = useState(thread.title);
  const { user } = useAuth();
  const [content, setContent] = useState(thread.content);

  const handleUpdate = async () => {
    if (!title.trim()) return message.error("Nhập tên chủ đề");

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
    }
  };

  return (
    <Modal
      open={open}
      title={
        <span className="text-slate-900 font-semibold">Chỉnh sửa chủ đề</span>
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
            onClick={handleUpdate}
            className="bg-slate-900 hover:bg-slate-800 border-slate-900 hover:border-slate-800 rounded-lg"
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditThreadModal;
