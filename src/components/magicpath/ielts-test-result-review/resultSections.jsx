import React, { useState } from 'react';
import { Card } from './resultUI';

export function CriteriaList({ criteria }) {
  const [open, setOpen] = useState(0);
  const list = criteria || [];
  if (list.length === 0) return null;
  return (
    <Card className="p-5">
      <h2 className="text-lg font-extrabold text-[#1e1b4b] mb-4 flex items-center gap-2">📊 Đánh giá chi tiết</h2>
      <div className="space-y-3">
        {list.map((c, i) => (
          <div key={c.name} className="rounded-2xl border-2 border-[#e6e6ed] overflow-hidden">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between p-4 hover:bg-[#f8f8fc] transition-colors">
              <span className="flex items-center gap-2 font-extrabold text-[#1e1b4b] text-sm">
                <span>{c.icon}</span> {c.name}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-black" style={{ color: c.score >= 6 ? '#10b981' : '#f59e0b' }}>{(c.score || 0).toFixed(1)}</span>
                <span className={`text-[#94a3b8] transition-transform ${open === i ? 'rotate-180' : ''}`}>▾</span>
              </span>
            </button>
            {open === i && <div className="px-4 pb-4 text-sm text-[#475569] leading-relaxed">{c.text}</div>}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Corrections({ corrections }) {
  const list = corrections || [];
  if (list.length === 0) return null;
  return (
    <Card className="p-5">
      <h2 className="text-lg font-extrabold text-[#1e1b4b] mb-4 flex items-center gap-2">⚡ Sửa lỗi & cải thiện</h2>
      <div className="space-y-4">
        {list.map((c, i) => (
          <div key={i} className="rounded-2xl border-2 border-[#e6e6ed] p-4">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-3 ${c.type === 'Grammar' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#eef2ff] text-[#4338ca]'}`}>
              {c.type}
            </span>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div className="bg-[#fef2f2] rounded-xl border-2 border-[#fecaca] p-3">
                <p className="text-[11px] font-bold uppercase text-[#b91c1c] mb-1">Lỗi sai</p>
                <p className="text-sm text-[#475569] line-through decoration-[#f87171] decoration-2">{c.mistake}</p>
              </div>
              <div className="bg-[#f0fdf4] rounded-xl border-2 border-[#bbf7d0] p-3">
                <p className="text-[11px] font-bold uppercase text-[#047857] mb-1">Sửa lại</p>
                <p className="text-sm text-[#334155]">{c.correct}</p>
              </div>
            </div>
            <div className="bg-[#eff6ff] rounded-xl border-2 border-[#bfdbfe] p-3 text-sm text-[#475569] italic">
              <span className="font-bold text-[#1d4ed8] not-italic">Giải thích: </span>
              {c.explanation}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
