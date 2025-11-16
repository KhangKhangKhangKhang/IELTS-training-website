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
      title="Chỉnh sửa chủ đề"
      onCancel={onClose}
      footer={false}
    >
      <Input
        placeholder="Tên chủ đề"
        className="mb-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Input.TextArea
        placeholder="Mô tả"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="text-right mt-3">
        <Button type="primary" onClick={handleUpdate}>
          Lưu
        </Button>
      </div>
    </Modal>
  );
};

export default EditThreadModal;
