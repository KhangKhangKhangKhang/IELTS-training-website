import React from 'react';
import { StatusTag, ScorePill, ActionBtn } from './modUI';
import { ModPost } from './modData';
export function PreviewModal({
  post,
  onClose,
  onAction
}: {
  post: ModPost;
  onClose: () => void;
  onAction: (id: number, status: 'approved' | 'rejected' | 'changes_requested') => void;
}) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#1e1b4b]">Xem chi tiết bài viết</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-[#f1f1f6] text-[#64748b] font-black">
            ×
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black" style={{
          background: post.tone
        }}>
            
            {post.author.charAt(0)}
          </div>
          <div>
            <p className="font-extrabold text-[#1e1b4b]">{post.author}</p>
            <p className="text-xs text-[#64748b] font-medium">
              📌 {post.thread} · {post.time}
            </p>
          </div>
        </div>

        <div className="bg-[#f8f8fc] rounded-2xl border-2 border-[#e6e6ed] p-4 text-sm text-[#334155] leading-relaxed mb-4">
          {post.content}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <ScorePill score={post.score} />
          <StatusTag status={post.status} />
        </div>

        <div className="bg-[#eff6ff] rounded-2xl border-2 border-[#bfdbfe] p-3 text-sm text-[#475569] mb-5">
          <span className="font-bold text-[#1d4ed8]">Lý do từ AI: </span>
          {post.reason}
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionBtn variant="approve" onClick={() => onAction(post.id, 'approved')}>
            ✓ Duyệt
          </ActionBtn>
          <ActionBtn variant="reject" onClick={() => onAction(post.id, 'rejected')}>
            ✗ Từ chối
          </ActionBtn>
          <ActionBtn variant="changes" onClick={() => onAction(post.id, 'changes_requested')}>
            ✎ Yêu cầu sửa
          </ActionBtn>
          <ActionBtn variant="ghost" onClick={onClose}>
            Đóng
          </ActionBtn>
        </div>
      </div>
    </div>;
}