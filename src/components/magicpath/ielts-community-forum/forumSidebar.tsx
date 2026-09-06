import React from 'react';
import { Card, Avatar, Badge } from './forumUI';
export type Thread = {
  id: number;
  title: string;
  posts: number;
  hot?: boolean;
  tone: string;
};
export function ThreadSidebar({
  threads,
  selected,
  onSelect,
  search,
  setSearch
}: {
  threads: Thread[];
  selected: number;
  onSelect: (id: number) => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  return <Card className="overflow-hidden flex flex-col">
      <div className="bg-gradient-to-br from-[#6366f1] to-[#4338ca] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
            💬
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base leading-tight">Chủ đề thảo luận</h2>
            <p className="text-white/70 text-xs font-medium">{threads.length} chủ đề</p>
          </div>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm chủ đề..." className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-sm font-medium bg-white outline-none" />
          
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fffbeb] to-[#fff7ed] border-b-2 border-[#fef3c7]">
        <span>🔥</span>
        <span className="text-xs font-bold text-[#b45309]">Thảo luận nổi bật</span>
      </div>

      <div className="p-3 space-y-2 overflow-y-auto" style={{
      maxHeight: 560
    }}>
        {threads.map(t => <button key={t.id} onClick={() => onSelect(t.id)} className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl border-2 transition-all ${selected === t.id ? 'border-[#6366f1] bg-[#eef2ff]' : 'border-transparent hover:bg-[#f8f8fc]'}`}>
          
            <Avatar name={t.title} tone={t.tone} size={40} />
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-sm text-[#1e1b4b] leading-snug line-clamp-2">
                {t.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge tone="slate">{t.posts} bài</Badge>
                {t.hot && <Badge tone="amber">🔥 Hot</Badge>}
              </div>
            </div>
          </button>)}
      </div>
    </Card>;
}