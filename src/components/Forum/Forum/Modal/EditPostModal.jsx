import { Modal, Input, Upload, Button, message } from "antd";
import { useState } from "react";
import { updatePostAPI } from "@/services/apiForum";
import { UploadOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/authContext";

const EditPostModal = ({ post, open, onClose, onUpdated }) => {
  const { user } = useAuth();

  const [content, setContent] = useState(post.content);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      return message.warning("Nội dung không được để trống");
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("idUser", post.idUser);
      form.append("idForumThreads", post.idForumThreads);
      form.append("content", content);

      if (file) {
        form.append("file", file);
      }

      const res = await updatePostAPI(post.idForumPost, form);

      message.success("Cập nhật thành công");
      onUpdated(res.data); // ✅ update realtime UI
      onClose();
    } catch (err) {
      console.log(err);
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Chỉnh sửa bài viết"
      onCancel={onClose}
      okText="Lưu"
      confirmLoading={loading}
      onOk={handleSave}
    >
      <Input.TextArea
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Nhập nội dung mới..."
      />

      <Upload
        beforeUpload={(file) => {
          setFile(file);
          return false;
        }}
        maxCount={1}
        className="mt-3"
      >
        <Button icon={<UploadOutlined />}>Chọn ảnh/video mới</Button>
      </Upload>

      {post.file && (
        <img
          src={post.file}
          alt="current"
          className="rounded-md mt-3 max-h-48 object-cover"
        />
      )}
    </Modal>
  );
};

export default EditPostModal;
