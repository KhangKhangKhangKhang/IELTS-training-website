// EditPostModal - Updated
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
      if (file) form.append("file", file);

      const res = await updatePostAPI(post.idForumPost, form);
      message.success("Cập nhật thành công");
      onUpdated(res.data);
      onClose();
    } catch (err) {
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <span className="text-slate-900 font-semibold">Chỉnh sửa bài viết</span>
      }
      onCancel={onClose}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      confirmLoading={loading}
      onOk={handleSave}
      className="rounded-lg"
    >
      <div className="flex flex-col gap-4">
        <Input.TextArea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung mới..."
          className="rounded-lg border-slate-300 hover:border-slate-400"
        />

        <Upload
          beforeUpload={(file) => {
            setFile(file);
            return false;
          }}
          maxCount={1}
          className="w-full"
        >
          <Button
            icon={<UploadOutlined />}
            className="w-full border-slate-300 text-slate-700 rounded-lg"
          >
            Chọn ảnh/video mới
          </Button>
        </Upload>

        {/* Nếu đã chọn file mới → hiện preview */}
        {file && (
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-sm text-slate-600 mb-2">Ảnh mới:</p>
            <img
              src={URL.createObjectURL(file)}
              alt="new"
              className="rounded-lg max-h-48 object-cover w-full"
            />
          </div>
        )}

        {/* Nếu chưa chọn file → hiện ảnh cũ */}
        {!file && post.file && (
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-sm text-slate-600 mb-2">Ảnh hiện tại:</p>
            <img
              src={post.file}
              alt="current"
              className="rounded-lg max-h-48 object-cover w-full"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EditPostModal;
