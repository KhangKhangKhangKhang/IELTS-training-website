// ThreadItem - refactor theo MagicPath mockup (thuần Tailwind + UI Kit)
// Tone màu avatar lấy từ idForumThreads hash qua TONE_POOL.
import { Modal, message } from "antd";
import { useAuth } from "@/context/authContext";
import { deleteThreadAPI } from "@/services/apiForum";
import { useState } from "react";
import EditThreadModal from "@/components/Forum/Forum/Modal/EditThreadModal";
import Avatar from "@/components/Forum/UI/Avatar";
import Badge from "@/components/Forum/UI/Badge";

const TONE_POOL = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#f43f5e", // rose
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#ec4899", // pink
];

// Deterministic tone từ idForumThreads — cùng thread luôn cùng màu.
const toneFromId = (id = "") => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return TONE_POOL[Math.abs(hash) % TONE_POOL.length];
};

const ThreadItem = ({ thread, onClick, setThreads, isFirst, isSelected }) => {
  const { user } = useAuth();
  const [openEdit, setOpenEdit] = useState(false);

  const tone = toneFromId(thread.idForumThreads);
  const isOwner = user?.role === "ADMIN" || user?.role === "GIAOVIEN";
  // Hot nếu là thread đầu tiên trong list (proxy cho "nhiều post nhất" vì backend sort).
  const isHot = !!isFirst;

  const handleDelete = () => {
    Modal.confirm({
      title: "Xóa chủ đề",
      content: "Bạn chắc chắn muốn xóa chủ đề này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteThreadAPI(thread.idForumThreads);
          message.success("Đã xóa chủ đề");
          setThreads((prev) =>
            prev.filter((t) => t.idForumThreads !== thread.idForumThreads),
          );
        } catch (err) {
          message.error("Xóa thất bại");
        }
      },
    });
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
        isSelected
          ? "border-indigo-500 bg-indigo-50"
          : "border-transparent hover:border-indigo-200 hover:bg-indigo-50/30"
      }`}
    >
      <Avatar name={thread.title} tone={tone} size="md" />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900 leading-snug line-clamp-2">
          {thread.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <Badge tone="slate">Thảo luận</Badge>
          {isHot && <Badge tone="coral">🔥 Hot</Badge>}
        </div>
      </div>

      {isOwner && (
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenEdit(true);
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Sửa"
            aria-label="Sửa chủ đề"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Xóa"
            aria-label="Xóa chủ đề"
          >
            🗑️
          </button>
        </div>
      )}

      <EditThreadModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        thread={thread}
        setThreads={setThreads}
      />
    </div>
  );
};

export default ThreadItem;
