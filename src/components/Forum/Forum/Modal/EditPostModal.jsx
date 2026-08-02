// EditPostModal - modal sửa post, style indigo đồng bộ
import { Modal, Input, Button, message } from "antd";
import { useRef, useState } from "react";
import { updatePostAPI } from "@/services/apiForum";

const EditPostModal = ({ post, open, onClose, onUpdated }) => {
  const [content, setContent] = useState(post.content);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = async () => {
    if (!content.trim()) {
      return message.warning("Nội dung không được để trống");
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("idUser", post.idUser);
      form.append("idForumThreads", post.idForumThreads);
      form.append("content", content);
      if (file) form.append("file", file);

      const res = await updatePostAPI(post.idForumPost, form);
      message.success("Cập nhật thành công");
      onUpdated(res.data);
      onClose();
    } catch {
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-lg">
            ✏️
          </div>
          <div>
            <span className="text-slate-900 font-bold text-lg block">
              Chỉnh sửa bài viết
            </span>
            <p className="text-slate-500 text-xs font-normal">
              Cập nhật nội dung bài viết của bạn
            </p>
          </div>
        </div>
      }
      onCancel={onClose}
      width={560}
      footer={
        <div className="flex gap-3 justify-end pt-2">
          <Button
            onClick={onClose}
            className="!rounded-xl !px-5 !h-10 !border-slate-200 !text-slate-600"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSave}
            className="!rounded-xl !px-5 !h-10 !bg-indigo-600 hover:!bg-indigo-700 !border-0 !font-bold"
          >
            Lưu thay đổi
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-2">
        <Input.TextArea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung mới..."
          className="!rounded-xl !border-slate-200 hover:!border-indigo-300 focus:!border-indigo-500"
        />

        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-10 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors text-sm font-bold flex items-center justify-center gap-2"
        >
          🖼️ Chọn ảnh/video mới
        </button>

        {file && (
          <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-3">
            <p className="text-sm font-bold text-indigo-700 mb-2">Ảnh mới:</p>
            <img
              src={URL.createObjectURL(file)}
              alt="new"
              loading="lazy"
              className="rounded-xl max-h-48 object-cover w-full"
            />
          </div>
        )}

        {!file && post.file && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-bold text-slate-600 mb-2">
              Ảnh hiện tại:
            </p>
            <img
              src={post.file}
              alt="current"
              loading="lazy"
              className="rounded-xl max-h-48 object-cover w-full"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EditPostModal;
