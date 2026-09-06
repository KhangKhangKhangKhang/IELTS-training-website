import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Avatar, Badge } from "@/components/magicpath/ielts-community-forum/forumUI";
import { useAuth } from "@/context/authContext";
import { message, Spin } from "antd";
import {
  getAllThreadAPI,
  getPostByThreadAPI,
  getPostsByUserAPI,
  getAllCommentsByPostAPI,
  createPostAPI,
  createCommentAPI,
  createThreadAPI,
  updatePostAPI,
  deletePostAPI,
  togglePostLikeAPI,
} from "@/services/apiForum";
import { Modal } from "antd";

/* ------------------------------------------------------------------------- */
/*  Tone palette — deterministic from string                                  */
/* ------------------------------------------------------------------------- */

const TONE_PALETTE = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#fb7185", // coral
  "#a855f7", // purple
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ec4899", // pink
  "#3b82f6", // blue
];

const hashTone = (s = "") => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return TONE_PALETTE[Math.abs(h) % TONE_PALETTE.length];
};

const formatRelative = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "Vừa xong";
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Vừa xong";
  if (min < 60) return `${min} phút trước`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  if (d < 30) return `${Math.floor(d / 7)} tuần trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
};

/* ------------------------------------------------------------------------- */
/*  Moderation status → label + tone                                          */
/* ------------------------------------------------------------------------- */

const MODERATION_VIEW = {
  auto_approved: { label: "Tự duyệt (AI)", tone: "green" },
  approved: { label: "Đã duyệt", tone: "green" },
  pending: { label: "Chờ duyệt", tone: "amber" },
  needs_review: { label: "Cần duyệt tay", tone: "amber" },
  auto_rejected: { label: "Bị từ chối (AI)", tone: "coral" },
  rejected: { label: "Bị từ chối", tone: "coral" },
  changes_requested: { label: "Yêu cầu chỉnh sửa", tone: "amber" },
};

const moderationFor = (m) => {
  if (!m) return null;
  const view = MODERATION_VIEW[m.status] || MODERATION_VIEW.pending;
  return { ...view, score: m.score ?? 0 };
};

/* ------------------------------------------------------------------------- */
/*  Thread Sidebar (canvas)                                                   */
/* ------------------------------------------------------------------------- */

function ThreadSidebar({ threads, selected, onSelect, search, setSearch, onCreateClick, canCreate }) {
  return (
    <Card className="overflow-hidden flex flex-col h-[640px]">
      <div className="bg-gradient-to-br from-[#6366f1] to-[#4338ca] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
            💬
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-white text-base leading-tight">
              Chủ đề thảo luận
            </h2>
            <p className="text-white/70 text-xs font-medium">
              {threads.length} chủ đề
            </p>
          </div>
          {canCreate && onCreateClick && (
            <button
              onClick={onCreateClick}
              title="Tạo chủ đề mới"
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xl font-bold flex items-center justify-center transition"
            >
              +
            </button>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm chủ đề..."
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-sm font-medium bg-white outline-none border-2 border-transparent focus:border-white/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fffbeb] to-[#fff7ed] border-b-2 border-[#fef3c7]">
        <span>🔥</span>
        <span className="text-xs font-bold text-[#b45309]">
          Thảo luận nổi bật
        </span>
      </div>

      <div className="p-3 space-y-2 overflow-y-auto flex-1">
        {threads.length === 0 ? (
          <div className="p-6 text-center text-[#94a3b8] text-sm">
            Chưa có chủ đề
          </div>
        ) : (
          threads.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl border-2 transition-all ${
                selected === t.id
                  ? "border-[#6366f1] bg-[#eef2ff]"
                  : "border-transparent hover:bg-[#f8f8fc]"
              }`}
            >
              <Avatar
                name={t.title}
                tone={t.tone}
                size={40}
                src={t.author?.avatar}
              />
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm text-[#1e1b4b] leading-snug line-clamp-2">
                  {t.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge tone="slate">{t.postCount} bài</Badge>
                  {t.hot && <Badge tone="amber">🔥 Hot</Badge>}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------------- */
/*  Post Card (canvas)                                                        */
/* ------------------------------------------------------------------------- */

function PostCard({ post, currentUserId, onReload, isModerator, moderationPath }) {
  const [liked, setLiked] = useState(!!post.isLikedByCurrentUser);
  const [likes, setLikes] = useState(post.likeCount ?? 0);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState(post.forumComment ?? []);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const menuRef = React.useRef(null);
  const mod = moderationFor(post.moderation);
  const authorTone = hashTone(post.user?.idUser || post.user?.nameUser || "user");
  const navigate = useNavigate();
  const isAuthor =
    !!currentUserId && post.user?.idUser === currentUserId;
  const canEditDelete = isAuthor || isModerator;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleDelete = async () => {
    if (!currentUserId) return;
    const confirmMsg = isAuthor
      ? "Xóa bài viết này? Hành động không thể hoàn tác."
      : "Bạn đang xóa bài viết của học viên với quyền quản trị. Hành động không thể hoàn tác.";
    const ok = window.confirm(confirmMsg);
    if (!ok) return;
    try {
      await deletePostAPI(post.idForumPost, currentUserId);
      message.success("Đã xóa bài viết");
      onReload?.();
    } catch (e) {
      message.error("Không thể xóa bài viết");
    }
  };

  const toggleLike = async () => {
    if (!currentUserId) {
      message.warning("Vui lòng đăng nhập để thích bài viết");
      return;
    }
    // optimistic update
    setLiked((v) => !v);
    setLikes((n) => (liked ? n - 1 : n + 1));
    try {
      await togglePostLikeAPI({
        idUser: currentUserId,
        idForumPost: post.idForumPost,
      });
    } catch (e) {
      // revert
      setLiked((v) => !v);
      setLikes((n) => (liked ? n + 1 : n - 1));
      message.error("Không thể thích bài viết");
    }
  };

  const loadComments = async () => {
    try {
      const res = await getAllCommentsByPostAPI(
        post.idForumPost,
        currentUserId
      );
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setComments(list);
    } catch (e) {
      message.error("Không thể tải bình luận");
    }
  };

  const handleOpenComments = () => {
    if (!open && comments.length === 0) {
      loadComments();
    }
    setOpen((v) => !v);
  };

  const submitComment = async () => {
    const v = draft.trim();
    if (!v) return;
    if (!currentUserId) {
      message.warning("Vui lòng đăng nhập để bình luận");
      return;
    }
    try {
      setSubmitting(true);
      await createCommentAPI({
        idForumPost: post.idForumPost,
        idUser: currentUserId,
        content: v,
      });
      setDraft("");
      await loadComments();
      setOpen(true);
    } catch (e) {
      message.error("Không thể gửi bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const showModeration =
    mod && (mod.tone === "amber" || mod.tone === "coral");

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={post.user?.nameUser}
            tone={authorTone}
            size={52}
            online
            src={post.user?.avatar}
          />
          <div>
            <h4 className="font-extrabold text-[#1e1b4b]">
              {post.user?.nameUser || "Học viên"}
            </h4>
            <p className="text-xs text-[#64748b] font-medium">
              {formatRelative(post.createdAt || post.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`w-9 h-9 rounded-xl transition-colors ${
                menuOpen
                  ? "bg-slate-100 text-slate-700"
                  : "hover:bg-[#f1f1f6] text-[#94a3b8]"
              } font-black`}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 z-30 w-48 rounded-xl bg-white border-2 border-[#e6e6ed] shadow-[0_4px_0_#e6e6ed] py-1.5 animate-in fade-in slide-in-from-top-2">
                {canEditDelete && (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setEditing(true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                    >
                      <span>✏️</span> {isAuthor ? "Sửa bài viết" : "Sửa (quản trị)"}
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleDelete();
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition flex items-center gap-2"
                    >
                      <span>🗑️</span> {isAuthor ? "Xóa bài viết" : "Xóa (quản trị)"}
                    </button>
                  </>
                )}
                {!canEditDelete && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      message.info("Đã gửi báo cáo. Cảm ơn bạn!");
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                  >
                    <span>🚩</span> Báo cáo bài viết
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-[#334155] leading-relaxed whitespace-pre-line mb-3">
        {post.content}
      </p>

      {post.file && (
        <button
          onClick={() => setLightboxSrc(post.file)}
          className="block w-full mb-3 rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 cursor-zoom-in hover:border-slate-300 transition"
          title="Click để xem ảnh lớn"
        >
          <img
            src={post.file}
            alt=""
            loading="lazy"
            className="w-full max-h-[480px] object-contain mx-auto"
          />
        </button>
      )}

      {mod && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge tone={mod.tone}>{mod.label}</Badge>
          {typeof mod.score === "number" && (
            <Badge tone={mod.tone}>AI: {mod.score}/100</Badge>
          )}
        </div>
      )}

      <div className="flex items-center gap-5 text-sm text-[#64748b] font-bold py-2 border-b-2 border-[#f1f1f6]">
        <span className="flex items-center gap-1.5">
          <span className="text-base">❤️</span> {likes} lượt thích
        </span>
        <button
          onClick={handleOpenComments}
          className="hover:text-[#6366f1] transition-colors"
        >
          {(post.commentCount ?? comments.length)} bình luận
        </button>
        {showModeration && (
          <span className="ml-auto text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            ⏳ Đang chờ duyệt
          </span>
        )}
      </div>

      <div className="flex pt-1">
        <button
          onClick={toggleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
            liked
              ? "text-[#6366f1] bg-[#eef2ff]"
              : "text-[#64748b] hover:bg-[#f8f8fc] hover:text-[#6366f1]"
          }`}
        >
          <span>{liked ? "👍" : "👍🏻"}</span> Thích
        </button>
        <button
          onClick={handleOpenComments}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
            open
              ? "text-[#6366f1] bg-[#eef2ff]"
              : "text-[#64748b] hover:bg-[#f8f8fc] hover:text-[#6366f1]"
          }`}
        >
          <span>💬</span> Bình luận
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          {comments.map((c) => {
            const cTone = hashTone(c.author?.idUser || c.author?.nameUser || "u");
            return (
              <div key={c.idForumComment} className="flex items-start gap-2.5">
                <Avatar
                  name={c.author?.nameUser}
                  tone={cTone}
                  size={36}
                  src={c.author?.avatar}
                />
                <div className="flex-1 bg-[#f8f8fc] rounded-2xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#1e1b4b]">
                      {c.author?.nameUser || "Học viên"}
                    </span>
                    <span className="text-[11px] text-[#94a3b8] font-medium">
                      {formatRelative(c.createdAt || c.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[#334155] mt-0.5">{c.content}</p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2.5">
            <Avatar name="Bạn" tone="#06b6d4" size={36} />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitComment();
                }
              }}
              placeholder="Viết bình luận..."
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-[#e6e6ed] text-sm focus:border-[#6366f1] outline-none disabled:opacity-50"
            />
            <button
              onClick={submitComment}
              disabled={submitting || !draft.trim()}
              className="px-4 py-2.5 rounded-2xl bg-[#6366f1] text-white font-extrabold text-sm shadow-[0_2px_0_#4338ca] hover:brightness-110 active:translate-y-[1px] disabled:opacity-50"
            >
              {submitting ? "..." : "Gửi"}
            </button>
          </div>
        </div>
      )}

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={post.user?.nameUser || "image"}
          onClose={() => setLightboxSrc(null)}
        />
      )}

      {editing && (
        <EditPostModal
          post={post}
          currentUserId={currentUserId}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onReload?.();
          }}
        />
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------------- */
/*  Image Lightbox (full-size viewer)                                         */
/* ------------------------------------------------------------------------- */

function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    // lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-in fade-in"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl font-bold flex items-center justify-center transition"
        title="Đóng (Esc)"
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt || ""}
        loading="lazy"
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl cursor-default"
      />
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Compose box (canvas)                                                      */
/* ------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------- */
/*  Emoji picker (canvas-style grid)                                           */
/* ------------------------------------------------------------------------- */

const EMOJI_LIST = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡",
  "👍", "👎", "👏", "🙌", "🙏", "💪", "✌️", "🤝",
  "❤️", "💔", "🔥", "⭐", "✨", "💡", "💯", "🎉",
  "📚", "✍️", "🎓", "🏆", "🎯", "💼", "📈", "✅",
];

function EmojiPicker({ onPick, onClose }) {
  const ref = React.useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-12 left-0 z-30 w-72 p-3 bg-white rounded-2xl border-2 border-[#e6e6ed] shadow-[0_4px_0_#e6e6ed]"
    >
      <div className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wide mb-2">
        Chọn emoji
      </div>
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_LIST.map((e, i) => (
          <button
            key={i}
            onClick={() => {
              onPick?.(e);
              onClose?.();
            }}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 text-lg flex items-center justify-center transition"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Edit Post Modal                                                            */
/* ------------------------------------------------------------------------- */

function EditPostModal({ post, currentUserId, onCancel, onSaved }) {
  const [content, setContent] = useState(post.content || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(post.file || null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = React.useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.match(/\/(jpg|jpeg|png|gif)$/)) {
      message.error("Chỉ chấp nhận ảnh JPG, PNG, GIF");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      message.error("Ảnh tối đa 5MB");
      return;
    }
    setFile(f);
    setRemoveExisting(false);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const removeImage = () => {
    setFile(null);
    setPreview(null);
    setRemoveExisting(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    const v = content.trim();
    if (!v && !preview && !post.file) {
      message.warning("Vui lòng nhập nội dung");
      return;
    }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("idForumThreads", post.idForumThreads);
      fd.append("idUser", currentUserId);
      fd.append("content", v || "(đính kèm ảnh)");
      if (file) {
        fd.append("file", file);
      } else if (removeExisting) {
        fd.append("file", "");
      } else if (post.file) {
        fd.append("file", post.file);
      }
      await updatePostAPI(post.idForumPost, fd);
      message.success("Đã cập nhật bài viết");
      onSaved?.();
    } catch (e) {
      message.error("Không thể cập nhật bài viết");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onCancel={onCancel}
      footer={null}
      width={560}
      centered
      title={
        <div className="flex items-center gap-2.5 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4338ca] flex items-center justify-center text-white text-lg">
            ✏️
          </div>
          <div>
            <div className="text-base font-extrabold text-[#1e1b4b] leading-tight">
              Sửa bài viết
            </div>
            <div className="text-[11px] text-[#94a3b8] font-medium">
              Cập nhật nội dung hoặc hình ảnh
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <div>
          <label className="block text-[12px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
            Nội dung
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#e6e6ed] text-sm resize-none focus:border-[#6366f1] outline-none"
          />
        </div>

        <div>
          <label className="block text-[12px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
            Hình ảnh
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif"
            onChange={handleFile}
            className="hidden"
          />
          {preview ? (
            <div className="relative inline-block">
              <img
                src={preview}
                alt="preview"
                loading="lazy"
                className="h-32 rounded-xl border border-slate-200 object-contain bg-slate-50"
              />
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold shadow hover:bg-rose-600"
                title="Xóa ảnh"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="h-32 w-32 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 text-sm font-bold hover:border-[#6366f1] hover:text-[#6366f1] transition flex flex-col items-center justify-center gap-1"
            >
              <span className="text-2xl">🖼️</span>
              <span>Chọn ảnh</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-bold text-[#64748b] hover:bg-slate-100 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={submitting || !content.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#6366f1] text-white font-extrabold text-sm shadow-[0_3px_0_#4338ca] hover:brightness-110 active:translate-y-[1px] disabled:opacity-50 transition"
          >
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- */
/*  Compose box (canvas)                                                      */
/* ------------------------------------------------------------------------- */

function ComposeBox({ threadId, currentUserId, onPosted }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.match(/\/(jpg|jpeg|png|gif)$/)) {
      message.error("Chỉ chấp nhận ảnh JPG, PNG, GIF");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      message.error("Ảnh tối đa 5MB");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const insertEmoji = (emoji) => {
    const ta = textareaRef.current;
    if (!ta) {
      setContent((c) => c + emoji);
      return;
    }
    const start = ta.selectionStart ?? content.length;
    const end = ta.selectionEnd ?? content.length;
    const newVal = content.slice(0, start) + emoji + content.slice(end);
    setContent(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const submit = async () => {
    const v = content.trim();
    if (!v && !file) {
      message.warning("Vui lòng nhập nội dung hoặc đính kèm ảnh");
      return;
    }
    if (!currentUserId) {
      message.warning("Vui lòng đăng nhập để đăng bài");
      return;
    }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("idForumThreads", threadId);
      fd.append("idUser", currentUserId);
      fd.append("content", v || "(đính kèm ảnh)");
      if (file) fd.append("file", file);
      await createPostAPI(fd);
      setContent("");
      removeFile();
      setShowEmoji(false);
      message.success("Đã đăng bài, đang chờ duyệt");
      onPosted?.();
    } catch (e) {
      message.error("Không thể đăng bài");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Avatar name="Bạn" tone="#06b6d4" size={44} />
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ kinh nghiệm, đặt câu hỏi..."
            className="w-full px-4 py-3 rounded-2xl border-2 border-[#e6e6ed] text-sm resize-none focus:border-[#6366f1] outline-none"
          />

          {filePreview && (
            <div className="mt-2 relative inline-block">
              <img
                src={filePreview}
                alt="preview"
                loading="lazy"
                className="h-24 rounded-xl border border-slate-200 object-cover"
              />
              <button
                onClick={removeFile}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold shadow hover:bg-rose-600"
                title="Xóa ảnh"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2 text-[#94a3b8] relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-xl hover:bg-[#f1f1f6] hover:text-[#6366f1] transition"
                title="Đính kèm ảnh"
                disabled={submitting}
              >
                🖼️
              </button>
              <button
                onClick={() => setShowEmoji((v) => !v)}
                className={`w-9 h-9 rounded-xl transition ${
                  showEmoji
                    ? "bg-[#eef2ff] text-[#6366f1]"
                    : "hover:bg-[#f1f1f6] hover:text-[#6366f1]"
                }`}
                title="Emoji"
                disabled={submitting}
              >
                😊
              </button>
              {showEmoji && (
                <EmojiPicker
                  onPick={insertEmoji}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </div>
            <button
              onClick={submit}
              disabled={submitting || (!content.trim() && !file)}
              className="px-5 py-2 rounded-2xl bg-[#06b6d4] text-white font-extrabold text-sm uppercase shadow-[0_3px_0_#0891b2] hover:brightness-110 active:translate-y-[1px] disabled:opacity-50"
            >
              {submitting ? "Đang đăng..." : "Đăng bài"}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------------- */
/*  Create Thread Modal                                                        */
/* ------------------------------------------------------------------------- */

function CreateThreadModal({ open, onCancel, onCreated, currentUserId }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
    }
  }, [open]);

  const submit = async () => {
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) {
      message.warning("Vui lòng nhập tiêu đề và mô tả");
      return;
    }
    if (!currentUserId) {
      message.warning("Vui lòng đăng nhập");
      return;
    }
    try {
      setSubmitting(true);
      const res = await createThreadAPI({
        idUser: currentUserId,
        title: t,
        content: c,
      });
      const newId = res?.data?.idForumThreads;
      message.success("Đã tạo chủ đề mới");
      onCreated?.(newId);
      onCancel?.();
    } catch (e) {
      message.error("Không thể tạo chủ đề");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={560}
      centered
      destroyOnClose
      title={
        <div className="flex items-center gap-2.5 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4338ca] flex items-center justify-center text-white text-lg">
            💬
          </div>
          <div>
            <div className="text-base font-extrabold text-[#1e1b4b] leading-tight">
              Tạo chủ đề thảo luận
            </div>
            <div className="text-[11px] text-[#94a3b8] font-medium">
              Mở một chủ đề mới để mọi người cùng thảo luận
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <div>
          <label className="block text-[12px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
            Tiêu đề
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Mẹo đạt band 7.0 Writing Task 2"
            maxLength={120}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-[#e6e6ed] text-sm font-bold focus:border-[#6366f1] outline-none"
          />
          <div className="text-[10px] text-[#94a3b8] mt-1 text-right">
            {title.length}/120
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
            Mô tả
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Mô tả ngắn về nội dung thảo luận..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-[#e6e6ed] text-sm resize-none focus:border-[#6366f1] outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-bold text-[#64748b] hover:bg-slate-100 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={submitting || !title.trim() || !content.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#6366f1] text-white font-extrabold text-sm shadow-[0_3px_0_#4338ca] hover:brightness-110 active:translate-y-[1px] disabled:opacity-50 transition"
          >
            {submitting ? "Đang tạo..." : "Tạo chủ đề"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- */
/*  Main Forum page                                                           */
/* ------------------------------------------------------------------------- */

const Forum = () => {
  const { user } = useAuth();
  const currentUserId = user?.idUser;
  const isModerator = user?.role === "ADMIN" || user?.role === "GIAOVIEN";

  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [reloadThreadsTick, setReloadThreadsTick] = useState(0);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const [activeTab, setActiveTab] = useState("thread"); // "thread" | "mine"
  const [myPosts, setMyPosts] = useState([]);
  const [loadingMyPosts, setLoadingMyPosts] = useState(false);

  // Load threads
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingThreads(true);
        const res = await getAllThreadAPI();
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const mapped = list.map((t) => ({
          id: t.idForumThreads,
          title: t.title,
          content: t.content,
          postCount: t.postCount ?? 0,
          hot: !!t.isHot,
          tone: hashTone(t.idForumThreads),
          author: t.author,
          lastPostAt: t.lastPostAt,
        }));
        setThreads(mapped);
        if (mapped.length > 0 && !selectedId) {
          setSelectedId(mapped[0].id);
        }
      } catch (e) {
        message.error("Không thể tải danh sách chủ đề");
      } finally {
        if (!cancelled) setLoadingThreads(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadThreadsTick]);

  // Load posts when thread changes
  useEffect(() => {
    if (!selectedId || !currentUserId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingPosts(true);
        const res = await getPostByThreadAPI(selectedId, currentUserId);
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setPosts(list);
      } catch (e) {
        message.error("Không thể tải bài viết");
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, currentUserId, reloadTick]);

  // Load "Bài viết của bạn" when tab opens or post changes
  useEffect(() => {
    if (activeTab !== "mine" || !currentUserId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingMyPosts(true);
        const res = await getPostsByUserAPI(currentUserId);
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setMyPosts(list);
      } catch (e) {
        message.error("Không thể tải bài viết của bạn");
      } finally {
        if (!cancelled) setLoadingMyPosts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, currentUserId, reloadTick]);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.content || "").toLowerCase().includes(q)
    );
  }, [threads, search]);

  const current = threads.find((t) => t.id === selectedId);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#eff6ff] to-[#eef2ff] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Sidebar */}
          {loadingThreads ? (
            <div className="flex items-center justify-center h-[640px] bg-white rounded-3xl border-2 border-[#e6e6ed]">
              <Spin />
            </div>
          ) : (
            <ThreadSidebar
              threads={filteredThreads}
              selected={selectedId}
              onSelect={setSelectedId}
              search={search}
              setSearch={setSearch}
              canCreate={isModerator}
              onCreateClick={() => setShowCreateThread(true)}
            />
          )}

          {/* Board */}
          <div className="space-y-5 min-w-0">
            <Card className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-black text-[#1e1b4b]">
                    IELTS Forum
                  </h1>
                  <p className="text-sm text-[#64748b] font-medium">
                    Thảo luận và chia sẻ kinh nghiệm học tập
                  </p>
                </div>
                {activeTab === "thread" && (
                  <button
                    onClick={() => setShowCompose((v) => !v)}
                    className="px-5 py-2.5 rounded-2xl bg-[#6366f1] text-white font-extrabold text-sm uppercase tracking-wide shadow-[0_4px_0_#4338ca] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#4338ca] transition-all"
                  >
                    + Tạo bài viết
                  </button>
                )}
              </div>

              {/* Tab switcher */}
              <div className="mt-5 flex items-center gap-2 p-1 bg-[#f1f1f6] rounded-2xl w-full sm:w-fit">
                <button
                  onClick={() => setActiveTab("thread")}
                  className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-extrabold transition-all ${
                    activeTab === "thread"
                      ? "bg-white text-[#6366f1] shadow-[0_2px_0_#e6e6ed]"
                      : "text-[#64748b] hover:text-[#1e1b4b]"
                  }`}
                >
                  💬 Thảo luận
                </button>
                <button
                  onClick={() => setActiveTab("mine")}
                  className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-extrabold transition-all ${
                    activeTab === "mine"
                      ? "bg-white text-[#6366f1] shadow-[0_2px_0_#e6e6ed]"
                      : "text-[#64748b] hover:text-[#1e1b4b]"
                  }`}
                >
                  📝 Bài viết của bạn
                </button>
              </div>

              {activeTab === "thread" && current && (
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-[#6366f1] bg-[#eef2ff] rounded-2xl px-4 py-2.5 w-fit">
                  <span>📌</span> {current.title}
                </div>
              )}
              {activeTab === "mine" && (
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-[#b45309] bg-[#fff7ed] border border-[#fed7aa] rounded-2xl px-4 py-2.5 w-fit">
                  <span>ℹ️</span> Hiển thị tất cả bài viết của bạn, bao gồm bài chờ duyệt và bài bị AI từ chối.
                </div>
              )}
            </Card>

            {activeTab === "thread" && showCompose && current && currentUserId && (
              <ComposeBox
                threadId={current.id}
                currentUserId={currentUserId}
                onPosted={() => setReloadTick((n) => n + 1)}
              />
            )}

            {activeTab === "thread" ? (
              loadingPosts ? (
                <div className="flex items-center justify-center py-12">
                  <Spin size="large" />
                </div>
              ) : posts.length > 0 ? (
                posts.map((p) => (
                  <PostCard
                    key={p.idForumPost}
                    post={p}
                    currentUserId={currentUserId}
                    isModerator={isModerator}
                    moderationPath={
                      user?.role === "ADMIN"
                        ? "/admin/moderation"
                        : "/teacher/moderation"
                    }
                    onReload={() => setReloadTick((n) => n + 1)}
                  />
                ))
              ) : (
                <Card className="p-12 text-center">
                  <div className="text-5xl mb-3">💭</div>
                  <h3 className="font-extrabold text-[#1e1b4b] mb-1">
                    Chưa có bài viết
                  </h3>
                  <p className="text-sm text-[#64748b] font-medium">
                    Hãy là người đầu tiên chia sẻ trong chủ đề này!
                  </p>
                </Card>
              )
            ) : loadingMyPosts ? (
              <div className="flex items-center justify-center py-12">
                <Spin size="large" />
              </div>
            ) : myPosts.length > 0 ? (
              myPosts.map((p) => (
                <PostCard
                  key={p.idForumPost}
                  post={p}
                  currentUserId={currentUserId}
                  isModerator={isModerator}
                  moderationPath={
                    user?.role === "ADMIN"
                      ? "/admin/moderation"
                      : "/teacher/moderation"
                  }
                  onReload={() => setReloadTick((n) => n + 1)}
                />
              ))
            ) : (
              <Card className="p-12 text-center">
                <div className="text-5xl mb-3">📝</div>
                <h3 className="font-extrabold text-[#1e1b4b] mb-1">
                  Bạn chưa đăng bài viết nào
                </h3>
                <p className="text-sm text-[#64748b] font-medium">
                  Chuyển sang tab "Thảo luận" để chia sẻ bài viết đầu tiên.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      <CreateThreadModal
        open={showCreateThread}
        onCancel={() => setShowCreateThread(false)}
        onCreated={(newId) => {
          setReloadThreadsTick((n) => n + 1);
          if (newId) setSelectedId(newId);
        }}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default Forum;
