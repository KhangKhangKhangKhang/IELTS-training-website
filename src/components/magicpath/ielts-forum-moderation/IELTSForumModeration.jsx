import React, { useEffect, useMemo, useState } from "react";
import { Card, StatusTag, ScorePill, ActionBtn } from "./modUI";
import { PreviewModal } from "./modPreview";
import { useAuth } from "@/context/authContext";
import { message, Spin, Modal } from "antd";
import {
  getModerationQueueAPI,
  getModerationHistoryAPI,
  reviewForumPostAPI,
  moderatorDeletePostAPI,
} from "@/services/apiForum";

const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "needs_review", label: "Cần duyệt" },
  { key: "auto_approved", label: "AI duyệt" },
  { key: "auto_rejected", label: "AI từ chối" },
  { key: "changes_requested", label: "Yêu cầu sửa" },
];

// Statuses a moderator can still act on. Anything else (approved/rejected
// manual) is closed — to remove it, use the moderator delete action.
const REVIEWABLE_STATUSES = new Set([
  "pending",
  "needs_review",
  "auto_rejected",
  "changes_requested",
]);

const TONE_PALETTE = [
  "#6366f1", "#06b6d4", "#fb7185", "#a855f7",
  "#f59e0b", "#10b981", "#ec4899", "#3b82f6",
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
  return new Date(iso).toLocaleDateString("vi-VN");
};

export const IELTSForumModeration = () => {
  const { user } = useAuth();
  const [view, setView] = useState("queue"); // "queue" | "history"
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [preview, setPreview] = useState(null);
  const [bulkModal, setBulkModal] = useState(null); // { status, note }
  const [deleteModal, setDeleteModal] = useState(null); // { id, author, content }
  const [busy, setBusy] = useState(false);

  // Load queue
  const loadQueue = async () => {
    if (!user?.idUser) return;
    try {
      setLoading(true);
      const res =
        view === "history"
          ? await getModerationHistoryAPI(user.idUser)
          : await getModerationQueueAPI(user.idUser);
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setPosts(list);
    } catch (e) {
      message.error(
        view === "history"
          ? "Không thể tải lịch sử duyệt"
          : "Không thể tải danh sách duyệt"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.idUser, view]);

  // Stats
  const stats = useMemo(() => {
    if (view === "queue") {
      const review = posts.filter(
        (p) => p.moderation?.status === "needs_review" || p.moderation?.status === "pending"
      ).length;
      const autoRejected = posts.filter(
        (p) => p.moderation?.status === "auto_rejected"
      ).length;
      const changes = posts.filter(
        (p) => p.moderation?.status === "changes_requested"
      ).length;
      return { review, autoRejected, changes };
    }
    const approved = posts.filter(
      (p) => p.moderation?.status === "approved"
    ).length;
    const rejected = posts.filter(
      (p) => p.moderation?.status === "rejected"
    ).length;
    return { approved, rejected, total: posts.length };
  }, [posts, view]);

  // Map API post → canvas-shaped post
  const mapPost = (p) => {
    const mod = p.moderation || {};
    const status = mod.status || "pending";
    return {
      id: p.idForumPost,
      author: p.user?.nameUser || "Học viên",
      avatar: p.user?.avatar,
      tone: hashTone(p.user?.idUser || p.user?.nameUser || "u"),
      thread: p.threadTitle || "Chủ đề",
      content: p.content || "",
      file: p.file,
      score: mod.score ?? 0,
      status,
      reason: mod.explanation || "",
      reviewNote: mod.note || "",
      reviewedBy: mod.reviewedBy || "",
      reviewedAt: mod.reviewedAt || null,
      reviewable: REVIEWABLE_STATUSES.has(status),
      time: formatRelative(p.createdAt || p.created_at),
    };
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts
      .map(mapPost)
      .filter((p) => {
        const matchSearch =
          !q ||
          p.author.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q);
        const matchFilter = filter === "all" || p.status === filter;
        return matchSearch && matchFilter;
      });
  }, [posts, filter, search]);

  // Single action via preview
  const act = async (id, status, note) => {
    if (!user?.idUser) return;
    try {
      setBusy(true);
      await reviewForumPostAPI(id, {
        idReviewer: user.idUser,
        status,
        note,
      });
      message.success(
        status === "approved"
          ? "Đã duyệt bài viết"
          : status === "rejected"
          ? "Đã từ chối bài viết"
          : "Đã gửi yêu cầu chỉnh sửa"
      );
      setPreview(null);
      setSelected((s) => s.filter((x) => x !== id));
      await loadQueue();
    } catch (e) {
      message.error("Không thể cập nhật bài viết");
    } finally {
      setBusy(false);
    }
  };

  // Bulk action
  const bulkAct = async (status, note) => {
    if (selected.length === 0) return;
    if (!user?.idUser) return;
    try {
      setBusy(true);
      const results = await Promise.allSettled(
        selected.map((id) =>
          reviewForumPostAPI(id, {
            idReviewer: user.idUser,
            status,
            note,
          })
        )
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      if (ok > 0) message.success(`Đã xử lý ${ok} bài viết`);
      if (fail > 0) message.warning(`${fail} bài viết xử lý thất bại`);
      setSelected([]);
      setBulkModal(null);
      await loadQueue();
    } catch (e) {
      message.error("Không thể xử lý hàng loạt");
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  // Moderator delete: use on closed posts (already approved/rejected) when
  // they turn out to be wrong and need to be removed from the forum entirely.
  const moderatorDelete = async (id, note) => {
    if (!user?.idUser) return;
    try {
      setBusy(true);
      await moderatorDeletePostAPI(id, user.idUser, note);
      message.success("Đã xóa bài viết");
      setDeleteModal(null);
      setSelected((s) => s.filter((x) => x !== id));
      await loadQueue();
    } catch (e) {
      message.error("Không thể xóa bài viết");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f1f1f6] via-[#eef2ff] to-[#f1f1f6] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#fb7185] flex items-center justify-center text-2xl shadow-[0_4px_0_#4338ca]">
              🛡️
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-[#1e1b4b]">
                Kiểm duyệt diễn đàn
              </h1>
              <p className="text-sm text-[#64748b] font-medium">
                Duyệt bài viết với hỗ trợ chấm điểm tự động từ AI
              </p>
            </div>
            {/* Tabs */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { setView("queue"); setSelected([]); }}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                  view === "queue"
                    ? "bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]"
                    : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"
                }`}
              >
                📋 Cần duyệt
              </button>
              <button
                onClick={() => { setView("history"); setSelected([]); }}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                  view === "history"
                    ? "bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]"
                    : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"
                }`}
              >
                🕘 Lịch sử
              </button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        {view === "queue" ? (
          <div className="grid grid-cols-3 gap-4">
            <Stat icon="⏳" label="Cần duyệt" value={stats.review} tone="#f59e0b" />
            <Stat icon="🤖" label="AI từ chối" value={stats.autoRejected} tone="#ef4444" />
            <Stat icon="✎" label="Yêu cầu sửa" value={stats.changes} tone="#a855f7" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <Stat icon="✓" label="Đã duyệt" value={stats.approved} tone="#10b981" />
            <Stat icon="✗" label="Từ chối" value={stats.rejected} tone="#ef4444" />
            <Stat icon="📊" label="Tổng cộng" value={stats.total} tone="#6366f1" />
          </div>
        )}

        {/* Toolbar */}
        <Card className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tác giả hoặc nội dung..."
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl border-2 border-[#e6e6ed] text-sm font-medium focus:border-[#6366f1] outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                    filter === f.key
                      ? "bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]"
                      : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk bar */}
          {selected.length > 0 && view === "queue" && (
            <div className="flex items-center justify-between bg-[#eef2ff] border-2 border-[#c7d2fe] rounded-2xl px-4 py-2.5 mb-4">
              <span className="text-sm font-bold text-[#4338ca]">
                Đã chọn {selected.length} bài
              </span>
              <div className="flex gap-2">
                <ActionBtn
                  variant="approve"
                  onClick={() => setBulkModal({ status: "approved" })}
                >
                  ✓ Duyệt tất cả
                </ActionBtn>
                <ActionBtn
                  variant="reject"
                  onClick={() => setBulkModal({ status: "rejected" })}
                >
                  ✗ Từ chối tất cả
                </ActionBtn>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spin size="large" />
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all ${
                    selected.includes(p.id)
                      ? "border-[#6366f1] bg-[#eef2ff]"
                      : "border-[#e6e6ed] hover:bg-[#f8f8fc]"
                  }`}
                >
                  <button
                    onClick={() => toggle(p.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center text-[11px] font-black shrink-0 transition-all ${
                      selected.includes(p.id)
                        ? "bg-[#6366f1] border-[#6366f1] text-white"
                        : "bg-white border-[#cbd5e1] text-transparent"
                    }`}
                  >
                    ✓
                  </button>
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shrink-0 overflow-hidden"
                    style={{ background: p.tone }}
                  >
                    {p.avatar ? (
                      <img
                        src={p.avatar}
                        alt={p.author}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      p.author.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-[#1e1b4b]">
                        {p.author}
                      </span>
                      <span className="text-xs text-[#94a3b8] font-medium">
                        📌 {p.thread}
                      </span>
                      <span className="text-xs text-[#94a3b8] font-medium">
                        · {p.time}
                      </span>
                    </div>
                    <p className="text-sm text-[#475569] mt-1 line-clamp-2">
                      {p.content}
                    </p>
                    {p.file && (
                      <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                        📎 Có đính kèm
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <ScorePill score={p.score} />
                      <StatusTag status={p.status} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <ActionBtn
                      variant="ghost"
                      onClick={() => setPreview(p)}
                    >
                      👁 Xem
                    </ActionBtn>
                    {p.reviewable && view === "queue" ? (
                      <div className="flex gap-1.5">
                        <ActionBtn
                          variant="approve"
                          onClick={() => act(p.id, "approved")}
                          disabled={busy}
                        >
                          ✓
                        </ActionBtn>
                        <ActionBtn
                          variant="reject"
                          onClick={() => act(p.id, "rejected")}
                          disabled={busy}
                        >
                          ✗
                        </ActionBtn>
                      </div>
                    ) : (
                      <ActionBtn
                        variant="reject"
                        onClick={() =>
                          setDeleteModal({
                            id: p.id,
                            author: p.author,
                            content: p.content,
                          })
                        }
                        disabled={busy}
                      >
                        🗑 Xóa
                      </ActionBtn>
                    )}
                  </div>
                </div>
              ))}
              {rows.length === 0 && (
                <div className="py-12 text-center text-[#94a3b8] font-bold">
                  Không có bài viết nào phù hợp.
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {preview && (
        <PreviewModal
          post={preview}
          onClose={() => setPreview(null)}
          onAction={(id, status, note) => act(id, status, note)}
          onDelete={(p) => {
            setPreview(null);
            setDeleteModal({
              id: p.id,
              author: p.author,
              content: p.content,
            });
          }}
        />
      )}

      {deleteModal && (
        <DeleteConfirmModal
          post={deleteModal}
          onCancel={() => setDeleteModal(null)}
          onConfirm={(note) => moderatorDelete(deleteModal.id, note)}
          busy={busy}
        />
      )}

      {bulkModal && (
        <BulkNoteModal
          status={bulkModal.status}
          count={selected.length}
          onCancel={() => setBulkModal(null)}
          onConfirm={(note) => bulkAct(bulkModal.status, note)}
          busy={busy}
        />
      )}
    </div>
  );
};

function Stat({ icon, label, value, tone }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0"
        style={{ background: `${tone}1a` }}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-[#1e1b4b] leading-none">
          {value}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] mt-1">
          {label}
        </div>
      </div>
    </Card>
  );
}

function BulkNoteModal({ status, count, onCancel, onConfirm, busy }) {
  const [note, setNote] = useState("");
  const isReject = status === "rejected";

  return (
    <Modal
      open
      onCancel={onCancel}
      footer={null}
      width={500}
      centered
      title={
        <div className="flex items-center gap-2.5 py-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg ${
              isReject
                ? "bg-rose-500 shadow-[0_3px_0_#9f1239]"
                : "bg-emerald-500 shadow-[0_3px_0_#047857]"
            }`}
          >
            {isReject ? "✗" : "✓"}
          </div>
          <div>
            <div className="text-base font-extrabold text-[#1e1b4b] leading-tight">
              {isReject ? "Từ chối" : "Duyệt"} {count} bài viết
            </div>
            <div className="text-[11px] text-[#94a3b8] font-medium">
              {isReject
                ? "Thêm ghi chú để tác giả hiểu lý do (khuyến nghị)"
                : "Có thể thêm ghi chú (không bắt buộc)"}
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <div>
          <label className="block text-[12px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
            Ghi chú {isReject ? "(khuyến nghị)" : "(tùy chọn)"}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={
              isReject
                ? "Lý do từ chối sẽ được gửi tới tất cả tác giả..."
                : "Ghi chú chung cho tất cả bài viết được duyệt..."
            }
            className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm resize-none focus:border-[#6366f1] outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-sm font-bold text-[#64748b] hover:bg-slate-100 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(note.trim() || undefined)}
            disabled={busy}
            className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-sm transition disabled:opacity-50 ${
              isReject
                ? "bg-rose-500 shadow-[0_3px_0_#9f1239] hover:brightness-110"
                : "bg-emerald-500 shadow-[0_3px_0_#047857] hover:brightness-110"
            }`}
          >
            {busy
              ? "Đang xử lý..."
              : `${isReject ? "Từ chối" : "Duyệt"} ${count} bài`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default IELTSForumModeration;

function DeleteConfirmModal({ post, onCancel, onConfirm, busy }) {
  const [note, setNote] = useState("");
  return (
    <Modal
      open
      onCancel={onCancel}
      footer={null}
      width={500}
      centered
      title={
        <div className="flex items-center gap-2.5 py-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg bg-rose-500 shadow-[0_3px_0_#9f1239]">
            🗑
          </div>
          <div>
            <div className="text-base font-extrabold text-[#1e1b4b] leading-tight">
              Xóa bài viết
            </div>
            <div className="text-[11px] text-[#94a3b8] font-medium">
              Bài viết sẽ bị xóa vĩnh viễn khỏi diễn đàn
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <div className="bg-slate-50 rounded-xl border-2 border-slate-200 p-3">
          <p className="text-xs font-bold text-slate-600 mb-1">
            Tác giả: {post.author}
          </p>
          <p className="text-sm text-slate-700 line-clamp-3">
            {post.content}
          </p>
        </div>
        <div>
          <label className="block text-[12px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
            Lý do xóa (tùy chọn)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="VD: Bài viết chứa nội dung spam, đã gỡ theo báo cáo..."
            className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm resize-none focus:border-[#6366f1] outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-sm font-bold text-[#64748b] hover:bg-slate-100 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl text-white font-extrabold text-sm transition disabled:opacity-50 bg-rose-500 shadow-[0_3px_0_#9f1239] hover:brightness-110"
          >
            {busy ? "Đang xóa..." : "Xóa vĩnh viễn"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
