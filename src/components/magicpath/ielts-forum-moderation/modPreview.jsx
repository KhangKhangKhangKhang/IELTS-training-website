import React, { useState } from "react";
import { StatusTag, ScorePill, ActionBtn } from "./modUI";

export function PreviewModal({ post, onClose, onAction, onDelete }) {
  const [note, setNote] = useState("");
  const [showNoteFor, setShowNoteFor] = useState(null);

  const handleAction = (status) => {
    const trimmed = note.trim();
    onAction(post.id, status, trimmed || undefined);
    setNote("");
    setShowNoteFor(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#1e1b4b]">Xem chi tiết bài viết</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-[#f1f1f6] text-[#64748b] font-black"
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black overflow-hidden shrink-0"
            style={{ background: post.tone }}
          >
            {post.avatar ? (
              <img
                src={post.avatar}
                alt={post.author}
                className="w-full h-full object-cover"
              />
            ) : (
              post.author.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-[#1e1b4b] truncate">
              {post.author}
            </p>
            <p className="text-xs text-[#64748b] font-medium">
              📌 {post.thread} · {post.time}
            </p>
          </div>
        </div>

        {post.file && (
          <img
            src={post.file}
            alt=""
            className="w-full max-h-64 object-contain rounded-2xl border border-slate-100 bg-slate-50 mb-4"
          />
        )}

        <div className="bg-[#f8f8fc] rounded-2xl border-2 border-[#e6e6ed] p-4 text-sm text-[#334155] leading-relaxed mb-4 whitespace-pre-line">
          {post.content}
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <ScorePill score={post.score} />
          <StatusTag status={post.status} />
        </div>

        {post.reviewedBy && (
          <div className="bg-[#f5f3ff] rounded-2xl border-2 border-[#ddd6fe] p-3 text-sm text-[#475569] mb-3">
            <span className="font-bold text-[#6d28d9]">Người duyệt: </span>
            {post.reviewedBy}
            {post.reviewedAt &&
              ` · ${new Date(post.reviewedAt).toLocaleString("vi-VN")}`}
          </div>
        )}

        {post.reason && (
          <div className="bg-[#eff6ff] rounded-2xl border-2 border-[#bfdbfe] p-3 text-sm text-[#475569] mb-3">
            <span className="font-bold text-[#1d4ed8]">Lý do từ AI: </span>
            {post.reason}
          </div>
        )}

        {post.reviewNote && (
          <div className="bg-[#fff7ed] rounded-2xl border-2 border-[#fed7aa] p-3 text-sm text-[#475569] mb-3">
            <span className="font-bold text-[#c2410c]">Ghi chú của người duyệt: </span>
            {post.reviewNote}
          </div>
        )}

        {/* Note input — show when picking reject/changes_requested */}
        {showNoteFor && showNoteFor !== "approved" && (
          <div className="mb-4">
            <label className="block text-[12px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
              Ghi chú cho tác giả {showNoteFor === "rejected" ? "(lý do từ chối)" : "(yêu cầu chỉnh sửa)"}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={
                showNoteFor === "rejected"
                  ? "VD: Nội dung có dấu hiệu spam, vui lòng đăng bài liên quan đến học tập..."
                  : "VD: Bổ sung nguồn tham khảo và làm rõ luận điểm ở đoạn 2..."
              }
              className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm resize-none focus:border-[#6366f1] outline-none"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {post.reviewable ? (
            <>
              <ActionBtn
                variant="approve"
                onClick={() => handleAction("approved")}
              >
                ✓ Duyệt
              </ActionBtn>
              <ActionBtn
                variant="reject"
                onClick={() => {
                  if (showNoteFor === "rejected") handleAction("rejected");
                  else setShowNoteFor("rejected");
                }}
              >
                ✗ Từ chối
              </ActionBtn>
              <ActionBtn
                variant="changes"
                onClick={() => {
                  if (showNoteFor === "changes_requested") handleAction("changes_requested");
                  else setShowNoteFor("changes_requested");
                }}
              >
                ✎ Yêu cầu sửa
              </ActionBtn>
            </>
          ) : (
            <div className="w-full p-2.5 rounded-xl bg-slate-100 border-2 border-slate-200 text-xs font-bold text-slate-600">
              Bài viết đã được duyệt trước đó, không thể duyệt lại.
            </div>
          )}
          {onDelete && (
            <ActionBtn
              variant="reject"
              onClick={() => onDelete(post)}
            >
              🗑 Xóa bài
            </ActionBtn>
          )}
          <ActionBtn variant="ghost" onClick={onClose}>
            Đóng
          </ActionBtn>
        </div>
      </div>
    </div>
  );
}
