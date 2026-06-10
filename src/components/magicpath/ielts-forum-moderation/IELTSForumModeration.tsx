import React, { useMemo, useState } from 'react';
import { Card, StatusTag, ScorePill, ActionBtn } from './modUI';
import { SEED, ModPost } from './modData';
import { PreviewModal } from './modPreview';
const FILTERS = [{
  key: 'all',
  label: 'Tất cả'
}, {
  key: 'needs_review',
  label: 'Cần duyệt'
}, {
  key: 'auto_approved',
  label: 'Đã duyệt'
}, {
  key: 'auto_rejected',
  label: 'Từ chối'
}] as const;
export const IELTSForumModeration = () => {
  const [posts, setPosts] = useState<ModPost[]>(SEED);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [preview, setPreview] = useState<ModPost | null>(null);
  const stats = useMemo(() => ({
    review: posts.filter(p => p.status === 'needs_review').length,
    approved: posts.filter(p => p.status === 'auto_approved' || p.status === 'approved').length,
    rejected: posts.filter(p => p.status === 'auto_rejected' || p.status === 'rejected').length
  }), [posts]);
  const rows = posts.filter(p => {
    const matchSearch = p.author.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter || filter === 'auto_approved' && p.status === 'approved' || filter === 'auto_rejected' && p.status === 'rejected';
    return matchSearch && matchFilter;
  });
  const act = (id: number, status: ModPost['status']) => {
    setPosts(prev => prev.map(p => p.id === id ? {
      ...p,
      status
    } : p));
    setPreview(null);
    setSelected(s => s.filter(x => x !== id));
  };
  const bulkAct = (status: ModPost['status']) => {
    setPosts(prev => prev.map(p => selected.includes(p.id) ? {
      ...p,
      status
    } : p));
    setSelected([]);
  };
  const toggle = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return <div className="min-h-screen w-full bg-gradient-to-br from-[#f1f1f6] via-[#eef2ff] to-[#f1f1f6] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#fb7185] flex items-center justify-center text-2xl shadow-[0_4px_0_#4338ca]">
              🛡️
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1e1b4b]">Kiểm duyệt diễn đàn</h1>
              <p className="text-sm text-[#64748b] font-medium">
                Duyệt bài viết với hỗ trợ chấm điểm tự động từ AI
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Stat icon="⏳" label="Cần duyệt" value={stats.review} tone="#f59e0b" />
          <Stat icon="✓" label="Đã duyệt" value={stats.approved} tone="#10b981" />
          <Stat icon="✗" label="Từ chối" value={stats.rejected} tone="#ef4444" />
        </div>

        {/* Toolbar */}
        <Card className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tác giả hoặc nội dung..." className="w-full pl-9 pr-3 py-2.5 rounded-2xl border-2 border-[#e6e6ed] text-sm font-medium focus:border-[#6366f1] outline-none" />
              
            </div>
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map(f => <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${filter === f.key ? 'bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]' : 'bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]'}`}>
                
                  {f.label}
                </button>)}
            </div>
          </div>

          {/* Bulk bar */}
          {selected.length > 0 && <div className="flex items-center justify-between bg-[#eef2ff] border-2 border-[#c7d2fe] rounded-2xl px-4 py-2.5 mb-4">
              <span className="text-sm font-bold text-[#4338ca]">
                Đã chọn {selected.length} bài
              </span>
              <div className="flex gap-2">
                <ActionBtn variant="approve" onClick={() => bulkAct('approved')}>
                  ✓ Duyệt tất cả
                </ActionBtn>
                <ActionBtn variant="reject" onClick={() => bulkAct('rejected')}>
                  ✗ Từ chối tất cả
                </ActionBtn>
              </div>
            </div>}

          {/* List */}
          <div className="space-y-3">
            {rows.map(p => <div key={p.id} className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all ${selected.includes(p.id) ? 'border-[#6366f1] bg-[#eef2ff]' : 'border-[#e6e6ed] hover:bg-[#f8f8fc]'}`}>
              
                <button onClick={() => toggle(p.id)} className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center text-[11px] font-black shrink-0 transition-all ${selected.includes(p.id) ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'bg-white border-[#cbd5e1] text-transparent'}`}>
                
                  ✓
                </button>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shrink-0" style={{
              background: p.tone
            }}>
                
                  {p.author.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-[#1e1b4b]">{p.author}</span>
                    <span className="text-xs text-[#94a3b8] font-medium">📌 {p.thread}</span>
                    <span className="text-xs text-[#94a3b8] font-medium">· {p.time}</span>
                  </div>
                  <p className="text-sm text-[#475569] mt-1 line-clamp-2">{p.content}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <ScorePill score={p.score} />
                    <StatusTag status={p.status} />
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <ActionBtn variant="ghost" onClick={() => setPreview(p)}>
                    👁 Xem
                  </ActionBtn>
                  <div className="flex gap-1.5">
                    <ActionBtn variant="approve" onClick={() => act(p.id, 'approved')}>
                      ✓
                    </ActionBtn>
                    <ActionBtn variant="reject" onClick={() => act(p.id, 'rejected')}>
                      ✗
                    </ActionBtn>
                  </div>
                </div>
              </div>)}
            {rows.length === 0 && <div className="py-12 text-center text-[#94a3b8] font-bold">
                Không có bài viết nào phù hợp.
              </div>}
          </div>
        </Card>
      </div>

      {preview && <PreviewModal post={preview} onClose={() => setPreview(null)} onAction={act} />}
    </div>;
};
function Stat({
  icon,
  label,
  value,
  tone
}: {
  icon: string;
  label: string;
  value: number;
  tone: string;
}) {
  return <Card className="p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0" style={{
      background: `${tone}1a`
    }}>
        
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-[#1e1b4b] leading-none">{value}</div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] mt-1">{label}</div>
      </div>
    </Card>;
}