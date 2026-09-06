// CreateComment - composer bình luận gọn, dùng EmojiPicker trong popover thuần Tailwind
import { useRef, useState } from "react";
import { createCommentAPI } from "@/services/apiForum";
import { message } from "antd";
import { useAuth } from "@/context/authContext";
import EmojiPicker from "emoji-picker-react";
import Avatar from "@/components/Forum/UI/Avatar";

// Deterministic tone từ idUser — dùng chung pattern.
const toneFromId = (id = "") => {
  const palette = ["#6366f1", "#06b6d4", "#f43f5e", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};

const CreateComment = ({ idForumPost, onCommentCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef(null);

  const handleComment = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await createCommentAPI({
        idForumPost,
        idUser: user.idUser,
        content,
      });
      setContent("");
      message.success("Đã bình luận");
      onCommentCreated?.(res.data);
    } catch {
      message.error("Lỗi khi bình luận");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleComment();
    }
  };

  return (
    <div className="flex items-center gap-2.5 pt-2">
      <Avatar
        name={user?.nameUser}
        tone={toneFromId(user?.idUser || "")}
        size="sm"
      />

      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Viết bình luận..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKey}
          className="w-full pl-4 pr-10 py-2.5 rounded-2xl border-2 border-slate-200 text-sm focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white transition-colors"
        />

        <button
          type="button"
          onClick={() => setShowEmoji((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors"
          title="Emoji"
        >
          😊
        </button>

        {showEmoji && (
          <div className="absolute bottom-full right-0 mb-2 z-20 shadow-2xl rounded-2xl overflow-hidden border-2 border-slate-200">
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
        onClick={handleComment}
        disabled={loading || !content.trim()}
        className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-[0_2px_0_#4338ca] active:translate-y-[1px] active:shadow-[0_1px_0_#4338ca] transition-all disabled:opacity-50 disabled:shadow-none"
      >
        Gửi
      </button>
    </div>
  );
};

export default CreateComment;
