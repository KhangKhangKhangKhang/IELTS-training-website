import React, { useState } from 'react';
import { Card, Avatar, Badge } from './forumUI';
export type Comment = {
  author: string;
  tone: string;
  text: string;
  time: string;
};
export type Post = {
  id: number;
  author: string;
  tone: string;
  time: string;
  content: string;
  likes: number;
  liked?: boolean;
  moderation?: {
    label: string;
    tone: 'green' | 'amber' | 'coral';
    score: number;
  };
  comments: Comment[];
};
export function PostCard({
  post
}: {
  post: Post;
}) {
  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [draft, setDraft] = useState('');
  const toggleLike = () => {
    setLiked(!liked);
    setLikes(n => liked ? n - 1 : n + 1);
  };
  const addComment = () => {
    const v = draft.trim();
    if (!v) return;
    setComments([...comments, {
      author: 'Bạn',
      tone: '#06b6d4',
      text: v,
      time: 'Vừa xong'
    }]);
    setDraft('');
    setOpen(true);
  };
  return <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={post.author} tone={post.tone} size={52} online />
          <div>
            <h4 className="font-extrabold text-[#1e1b4b]">{post.author}</h4>
            <p className="text-xs text-[#64748b] font-medium">{post.time}</p>
          </div>
        </div>
        <button className="w-9 h-9 rounded-xl hover:bg-[#f1f1f6] text-[#94a3b8] font-black transition-colors">
          ⋯
        </button>
      </div>

      <p className="text-[#334155] leading-relaxed whitespace-pre-line mb-3">{post.content}</p>

      {post.moderation && <div className="flex flex-wrap gap-2 mb-4">
          <Badge tone={post.moderation.tone}>{post.moderation.label}</Badge>
          <Badge tone={post.moderation.tone}>AI: {post.moderation.score}/100</Badge>
        </div>}

      <div className="flex items-center gap-5 text-sm text-[#64748b] font-bold py-2 border-b-2 border-[#f1f1f6]">
        <span className="flex items-center gap-1.5">
          <span className="text-base">❤️</span> {likes} lượt thích
        </span>
        <button onClick={() => setOpen(!open)} className="hover:text-[#6366f1] transition-colors">
          {comments.length} bình luận
        </button>
      </div>

      <div className="flex pt-1">
        <button onClick={toggleLike} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${liked ? 'text-[#6366f1] bg-[#eef2ff]' : 'text-[#64748b] hover:bg-[#f8f8fc] hover:text-[#6366f1]'}`}>
          
          <span>{liked ? '👍' : '👍🏻'}</span> Thích
        </button>
        <button onClick={() => setOpen(!open)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${open ? 'text-[#6366f1] bg-[#eef2ff]' : 'text-[#64748b] hover:bg-[#f8f8fc] hover:text-[#6366f1]'}`}>
          
          <span>💬</span> Bình luận
        </button>
      </div>

      {open && <div className="mt-4 space-y-3">
          {comments.map((c, i) => <div key={i} className="flex items-start gap-2.5">
              <Avatar name={c.author} tone={c.tone} size={36} />
              <div className="flex-1 bg-[#f8f8fc] rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#1e1b4b]">{c.author}</span>
                  <span className="text-[11px] text-[#94a3b8] font-medium">{c.time}</span>
                </div>
                <p className="text-sm text-[#334155] mt-0.5">{c.text}</p>
              </div>
            </div>)}
          <div className="flex items-center gap-2.5">
            <Avatar name="Bạn" tone="#06b6d4" size={36} />
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Viết bình luận..." className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-[#e6e6ed] text-sm focus:border-[#6366f1] outline-none" />
          
            <button onClick={addComment} className="px-4 py-2.5 rounded-2xl bg-[#6366f1] text-white font-extrabold text-sm shadow-[0_2px_0_#4338ca] hover:brightness-110 active:translate-y-[1px]">
            
              Gửi
            </button>
          </div>
        </div>}
    </Card>;
}