// CreatePost - composer đăng bài, emoji + upload ảnh thuần Tailwind
import { useRef, useState } from "react";
import { createPostAPI } from "@/services/apiForum";
import { message } from "antd";
import { useAuth } from "@/context/authContext";
import EmojiPicker from "emoji-picker-react";
import Avatar from "@/components/Forum/UI/Avatar";

const toneFromId = (id = "") => {
  const palette = ["#6366f1", "#06b6d4", "#f43f5e", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};

const CreatePost = ({ idForumThreads, onSuccess }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef(null);

  const handlePost = async () => {
    if (!content.trim()) {
      message.error("Vui lòng nhập nội dung");
      return;
    }

    const form = new FormData();
    form.append("idForumThreads", idForumThreads);
    form.append("idUser", user.idUser);
    form.append("content", content);
    if (file) form.append("file", file);

    setLoading(true);
    try {
      const res = await createPostAPI(form);

      const status = res?.data?.moderation?.status;
      const reason = res?.data?.moderation?.explanation;

      if (status === "auto_approved" || status === "approved") {
        message.success("Đăng bài thành công và đã được hiển thị.");
      } else if (status === "needs_review" || status === "pending") {
        message.info("Bài viết đã gửi, đang chờ duyệt thủ công.");
      } else if (status === "auto_rejected") {
        message.warning(
          reason || "Bài viết bị từ chối tự động, vui lòng chỉnh sửa và đăng lại.",
        );
      } else {
        message.success("Đăng bài thành công!");
      }

      setContent("");
      setFile(null);
      // Luôn gọi onSuccess, kể cả khi moderation pending/auto_rejected
      // để parent reload list (sẽ filter ra post không được duyệt).
      onSuccess?.(res?.data);
    } catch {
      message.error("Đăng bài thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div className="bg-white border-2 border-[#e6e6ed] rounded-2xl shadow-[0_2px_0_#e6e6ed] p-5">
      <div className="flex gap-3">
        <Avatar
          name={user?.nameUser}
          tone={toneFromId(user?.idUser || "")}
          size="lg"
        />

        <div className="flex-1 min-w-0">
          <textarea
            rows={3}
            placeholder={`${user?.nameUser || "Bạn"} ơi, chia sẻ điều gì đó với mọi người...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-[15px] resize-none focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white transition-colors"
          />

          {file && (
            <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-lg">
                  🖼️
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center"
                title="Bỏ file"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex mt-3 justify-between items-center">
            <div className="flex gap-1 relative">
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*,video/*"
                onChange={onFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center text-lg"
                title="Thêm ảnh/video"
              >
                🖼️
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center text-lg"
                title="Đính kèm file"
              >
                📎
              </button>
              <button
                type="button"
                onClick={() => setShowEmoji((s) => !s)}
                className="w-9 h-9 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-amber-50 transition-colors flex items-center justify-center text-lg"
                title="Emoji"
              >
                😊
              </button>

              {showEmoji && (
                <div className="absolute top-full left-0 mt-2 z-20 shadow-2xl rounded-2xl overflow-hidden border-2 border-slate-200">
                  <EmojiPicker
                    onEmojiClick={(e) => {
                      setContent((p) => p + e.emoji);
                      setShowEmoji(false);
                    }}
                    width={300}
                    height={360}
                    searchPlaceHolder="Tìm emoji..."
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                    lazyLoadEmojis
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePost}
              disabled={loading || !content.trim()}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-[0_3px_0_#4338ca] active:translate-y-[1px] active:shadow-[0_2px_0_#4338ca] transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
            >
              {loading ? "Đang đăng..." : "Đăng bài"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
