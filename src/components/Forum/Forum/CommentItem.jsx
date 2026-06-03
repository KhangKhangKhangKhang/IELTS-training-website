// CommentItem - 1 bình luận, dùng UI Kit + inline edit
import { useState } from "react";
import { Modal, message } from "antd";
import {
  toggleCommentLikeAPI,
  updateCommentAPI,
  deleteCommentAPI,
} from "@/services/apiForum";
import { useAuth } from "@/context/authContext";
import Avatar from "@/components/Forum/UI/Avatar";

const toneFromId = (id = "") => {
  const palette = ["#6366f1", "#06b6d4", "#f43f5e", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};

const formatTimeAgo = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins}p`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(date).toLocaleDateString("vi-VN");
};

const CommentItem = ({ comment, onUpdated, onDeleted }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(!!comment.isCommentLikedByCurrentUser);
  const [count, setCount] = useState(comment.commentLikeCount || 0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

  const canEdit = user?.idUser === comment.idUser;
  const canDelete = user?.role === "ADMIN" || canEdit;

  const handleLike = async () => {
    setLiked((v) => !v);
    setCount((c) => (liked ? c - 1 : c + 1));
    try {
      await toggleCommentLikeAPI({
        idForumComment: comment.idForumComment,
        idUser: user.idUser,
      });
    } catch {
      // rollback
      setLiked(liked);
      setCount(count);
    }
  };

  const handleSave = async () => {
    if (!draft.trim()) return;
    try {
      const body = {
        idForumPost: comment.idForumPost,
        idUser: user.idUser,
        content: draft,
      };
      await updateCommentAPI(comment.idForumComment, body);
      message.success("Đã cập nhật bình luận");
      onUpdated?.(comment.idForumComment, draft);
      setEditing(false);
    } catch {
      message.error("Cập nhật thất bại");
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Xóa bình luận",
      content: "Bạn có chắc chắn muốn xóa bình luận này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteCommentAPI(comment.idForumComment);
          message.success("Đã xóa bình luận");
          onDeleted?.(comment.idForumComment);
        } catch {
          message.error("Xóa thất bại");
        }
      },
    });
  };

  return (
    <div className="group flex items-start gap-2.5 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
      <Avatar
        name={comment.user?.nameUser || "?"}
        tone={toneFromId(comment.user?.idUser || "")}
        size="sm"
      />

      <div className="flex-1 min-w-0">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm text-slate-900">
              {comment.user?.nameUser || "Người dùng"}
            </span>
            <span className="text-[11px] text-slate-400">
              {formatTimeAgo(comment.created_at)}
            </span>
          </div>
          {editing ? (
            <div className="mt-1.5 space-y-2">
              <textarea
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditing(false);
                    setDraft(comment.content);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed">
              {comment.content}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 ml-1">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs font-bold transition-colors ${
              liked ? "text-rose-500" : "text-slate-500 hover:text-rose-500"
            }`}
          >
            {liked ? "❤️" : "🤍"}
            {count > 0 && <span>{count}</span>}
          </button>

          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Sửa
            </button>
          )}
          {canDelete && !editing && (
            <button
              onClick={handleDelete}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
            >
              Xóa
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
