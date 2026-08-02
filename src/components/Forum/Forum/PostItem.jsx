// PostItem - card 1 post theo MagicPath mockup, dùng UI Kit + thuần Tailwind
import { useState, memo } from "react";
import { Modal, message } from "antd";
import { togglePostLikeAPI, deletePostAPI } from "@/services/apiForum";
import CreateComment from "./CreateComment";
import CommentList from "./CommentList";
import { useAuth } from "@/context/authContext";
import EditPostModal from "./Modal/EditPostModal";
import Card from "@/components/Forum/UI/Card";
import Avatar from "@/components/Forum/UI/Avatar";
import Badge from "@/components/Forum/UI/Badge";

const TONE_POOL = [
  "#6366f1", "#06b6d4", "#f43f5e", "#f59e0b",
  "#8b5cf6", "#10b981", "#ec4899",
];
const toneFromId = (id = "") => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return TONE_POOL[Math.abs(h) % TONE_POOL.length];
};

// Map moderation status (lowercase) sang label + tone để render Badge.
const MODERATION_META = {
  auto_approved: { label: "Tự duyệt (AI)", tone: "green" },
  approved: { label: "Đã duyệt", tone: "green" },
  pending: { label: "Đang chờ AI", tone: "amber" },
  needs_review: { label: "Cần duyệt tay", tone: "coral" },
  auto_rejected: { label: "Tự từ chối (AI)", tone: "coral" },
  rejected: { label: "Đã từ chối", tone: "coral" },
  changes_requested: { label: "Yêu cầu chỉnh sửa", tone: "amber" },
};

const formatTimeAgo = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(date).toLocaleDateString("vi-VN");
};

const PostItem = ({ post, onPostUpdated, onPostDeleted }) => {
  const { user } = useAuth();
  const isOwner =
    user?.role === "ADMIN" ||
    user?.role === "GIAOVIEN" ||
    user?.role === "TEACHER" ||
    (user && post?.idUser === user.idUser);

  const moderation = post?.moderation || null;
  const moderationStatus = moderation?.status || "pending";
  const moderationMeta = MODERATION_META[moderationStatus] || MODERATION_META.pending;
  // Hiển thị moderation badge cho tất cả user (giúp user thấy trạng thái bài mình đăng).
  const showModerationInfo = !!moderation;

  const [liked, setLiked] = useState(!!post.isLikedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.forumComment || []);
  const [openEdit, setOpenEdit] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLike = async () => {
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    try {
      await togglePostLikeAPI({
        idForumPost: post.idForumPost,
        idUser: user.idUser,
      });
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      message.error("Lỗi khi thích bài viết");
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Xóa bài viết",
      content: "Bạn chắc chắn muốn xóa bài viết này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deletePostAPI(post.idForumPost);
          message.success("Đã xóa bài viết");
          onPostDeleted?.(post.idForumPost);
        } catch {
          message.error("Xóa thất bại");
        }
      },
    });
  };

  const handleCommentDeleted = (idForumComment) =>
    setComments((prev) => prev.filter((c) => c.idForumComment !== idForumComment));

  const handleCommentUpdated = (idForumComment, newContent) =>
    setComments((prev) =>
      prev.map((c) => (c.idForumComment === idForumComment ? { ...c, content: newContent } : c)),
    );

  return (
    <>
      <Card as="article" className="p-6 mb-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar
              name={post.user?.nameUser || "?"}
              tone={toneFromId(post.user?.idUser || "")}
              size="md"
            />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                {post.user?.nameUser || "Người dùng"}
              </h4>
              <p className="text-xs text-slate-500" title={new Date(post.created_at).toLocaleString("vi-VN")}>
                {formatTimeAgo(post.created_at)}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center text-lg"
                aria-label="Mở menu"
              >
                ⋯
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border-2 border-slate-200 rounded-2xl shadow-lg overflow-hidden min-w-[140px]">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setOpenEdit(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleDelete();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <p className="text-[15px] text-slate-800 leading-relaxed whitespace-pre-line mb-3">
          {post.content}
        </p>

        {showModerationInfo && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Badge tone={moderationMeta.tone}>{moderationMeta.label}</Badge>
            {typeof moderation.score === "number" && (
              <Badge tone={moderationMeta.tone}>AI {moderation.score}/100</Badge>
            )}
          </div>
        )}

        {showModerationInfo &&
          moderationStatus === "changes_requested" &&
          moderation?.note && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Góp ý từ người duyệt: {moderation.note}
            </div>
          )}

        {/* Media */}
        {post.file && (
          <div className="mb-3 rounded-2xl overflow-hidden">
            <img
              src={post.file}
              alt="post"
              loading="lazy"
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* Stats + Action bar */}
        <div className="flex items-center gap-5 text-sm text-slate-500 font-bold py-2 border-t-2 border-slate-100">
          <span className="flex items-center gap-1.5">
            <span>❤️</span> {likeCount} lượt thích
          </span>
          <button
            onClick={() => setShowComments((v) => !v)}
            className="hover:text-indigo-600 transition-colors"
          >
            💬 {comments.length} bình luận
          </button>
        </div>

        <div className="flex border-t-2 border-slate-100">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              liked
                ? "text-rose-500 bg-rose-50"
                : "text-slate-600 hover:bg-slate-50 hover:text-rose-500"
            }`}
          >
            {liked ? "👍" : "👍🏻"} Thích
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              showComments
                ? "text-indigo-600 bg-indigo-50"
                : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
            }`}
          >
            💬 Bình luận
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-4 pt-3 border-t-2 border-slate-100 space-y-3">
            <CommentList
              comments={comments}
              onCommentDeleted={handleCommentDeleted}
              onCommentUpdated={handleCommentUpdated}
            />
            <CreateComment
              idForumPost={post.idForumPost}
              onCommentCreated={(newCmt) => setComments((prev) => [...prev, newCmt])}
            />
          </div>
        )}
      </Card>

      <EditPostModal
        post={post}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onUpdated={onPostUpdated}
      />
    </>
  );
};

export default memo(PostItem);
