// EditPostModal - Updated with enhanced UI
import { Modal, Input, Upload, Button, message } from "antd";
import { useState } from "react";
import { updatePostAPI } from "@/services/apiForum";
import { UploadOutlined, EditOutlined, PictureOutlined } from "@ant-design/icons";
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-500 flex items-center justify-center">
            <EditOutlined className="text-white text-lg" />
          </div>
          <div>
            <span className="text-slate-900 font-semibold text-lg">
              Chỉnh sửa bài viết
            </span>
            <p className="text-slate-500 text-xs font-normal">
              Cập nhật nội dung bài viết của bạn
            </p>
          </div>
        </div>
      }
      onCancel={onClose}
      footer={
        <div className="flex gap-3 justify-end pt-2">
          <Button
            onClick={onClose}
            className="border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 rounded-xl px-6 h-10"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-purple-700 border-0 rounded-xl px-6 h-10 font-medium shadow-md shadow-blue-200"
          >
            Lưu thay đổi
          </Button>
        </div>
      }
      className="rounded-2xl"
      width={560}
    >
      <div className="flex flex-col gap-5 pt-4">
        <Input.TextArea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung mới..."
          className="rounded-xl border-slate-200 hover:border-blue-300 focus:border-blue-400"
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
            icon={<PictureOutlined />}
            className="w-full border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 rounded-xl h-10"
          >
            Chọn ảnh/video mới
          </Button>
        </Upload>

        {/* Nếu đã chọn file mới → hiện preview */}
        {file && (
          <div className="border-2 border-blue-100 rounded-xl p-4 bg-gradient-to-r from-blue-50 to-blue-50">
            <p className="text-sm font-medium text-blue-600 mb-3 flex items-center gap-2">
              <PictureOutlined />
              Ảnh mới:
            </p>
            <img
              src={URL.createObjectURL(file)}
              alt="new"
              className="rounded-xl max-h-48 object-cover w-full"
            />
          </div>
        )}

        {/* Nếu chưa chọn file → hiện ảnh cũ */}
        {!file && post.file && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <p className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
              <PictureOutlined />
              Ảnh hiện tại:
            </p>
            <img
              src={post.file}
              alt="current"
              className="rounded-xl max-h-48 object-cover w-full"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EditPostModal;
