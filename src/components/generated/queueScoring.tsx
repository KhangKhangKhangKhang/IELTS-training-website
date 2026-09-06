import React, { useState } from 'react';
import { Tag, PillButton } from './queueUI';
import { Ticket } from './queueData';
export function ScoringDrawer({
  ticket,
  onClose,
  onSubmit
}: {
  ticket: Ticket;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [band, setBand] = useState<number>(ticket.aiBand);
  const isWriting = ticket.type === 'WRITING';
  const criteria = isWriting ? ['Task Response', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range'] : ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range', 'Pronunciation'];
  return <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full bg-[#f8f8fc] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b-2 border-[#e6e6ed] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-xl">✍️</span>
            <div>
              <h2 className="text-lg font-black text-[#1e1b4b]">Chấm bài</h2>
              <p className="text-xs text-[#64748b] font-medium">
                {ticket.student} · {ticket.test}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-[#f1f1f6] text-[#64748b] font-black">
            
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border-2 border-[#e6e6ed] p-4">
              <p className="text-[11px] font-bold uppercase text-[#64748b]">Đề bài</p>
              <div className="mt-2 text-sm text-[#334155] leading-relaxed max-h-44 overflow-y-auto">
                Some people think that the best way to reduce crime is to give longer prison
                sentences. Others, however, believe there are better alternative ways. Discuss
                both views and give your opinion.
              </div>
            </div>
            <div className="bg-[#eef2ff] rounded-2xl border-2 border-[#c7d2fe] p-4">
              <p className="text-[11px] font-bold uppercase text-[#4338ca]">Bài làm học viên</p>
              <div className="mt-2 text-sm text-[#334155] leading-relaxed max-h-44 overflow-y-auto">
                It is often argued that increasing the length of imprisonment is the most effective
                method to deter crime. While I acknowledge the deterrent value of strict
                punishment, I believe rehabilitation programs offer a more sustainable solution...
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#eef2ff] to-[#f3e8ff] rounded-2xl border-2 border-[#c7d2fe] p-4">
            <p className="font-extrabold text-[#4338ca] flex items-center gap-2 mb-1">
              🤖 Gợi ý từ AI · Band {ticket.aiBand.toFixed(1)}
            </p>
            <p className="text-sm text-[#475569]">
              Bài viết có cấu trúc rõ ràng, lập luận tốt nhưng còn lỗi ngữ pháp ở câu phức và một
              số từ vựng lặp lại.
            </p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-[#e6e6ed] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-extrabold text-[#1e1b4b]">Band Score</span>
              <span className="text-3xl font-black text-[#6366f1]">{band.toFixed(1)}</span>
            </div>
            <input type="range" min={0} max={9} step={0.5} value={band} onChange={e => setBand(Number(e.target.value))} className="w-full accent-[#6366f1]" />
            
            <div className="flex justify-between text-[10px] font-bold text-[#94a3b8] mt-1">
              <span>0</span>
              <span>4.5</span>
              <span>9</span>
            </div>
          </div>

          {criteria.map(c => <div key={c} className="bg-white rounded-2xl border-2 border-[#e6e6ed] p-4">
              <label className="text-sm font-extrabold text-[#1e1b4b] mb-2 block">{c}</label>
              <textarea rows={2} placeholder={`Nhận xét về ${c.toLowerCase()}...`} className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm resize-none focus:border-[#6366f1] outline-none" />
            
            </div>)}

          <div className="bg-white rounded-2xl border-2 border-[#e6e6ed] p-4">
            <label className="text-sm font-extrabold text-[#1e1b4b] mb-2 block">
              Nhận xét tổng quát
            </label>
            <textarea rows={3} placeholder="Nhận xét chung cho học viên..." className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm resize-none focus:border-[#6366f1] outline-none" />
            
          </div>

          <div className="flex items-center justify-between pt-2">
            <Tag tone="completed">💰 +50.000đ</Tag>
            <div className="flex gap-2">
              <PillButton variant="ghost" size="md" onClick={onClose}>
                Hủy
              </PillButton>
              <PillButton variant="green" size="md" onClick={onSubmit}>
                Nộp điểm
              </PillButton>
            </div>
          </div>
        </div>
      </div>
    </div>;
}