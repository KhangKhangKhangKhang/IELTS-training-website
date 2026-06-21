import React, { useState } from 'react';
import { Card, Badge, PillButton } from './adminUI';
type Policy = {
  autoApproveThreshold: number;
  autoRejectThreshold: number;
  blockedWords: string[];
  reviewSlaHours: number;
};
type PolicyProps = {
  initial?: Policy;
  onSave?: (next: Policy) => void | Promise<void>;
};
export function ModerationPolicy({ initial, onSave }: PolicyProps = {}) {
  const [approve, setApprove] = useState(initial?.autoApproveThreshold ?? 80);
  const [reject, setReject] = useState(initial?.autoRejectThreshold ?? 20);
  const [sla, setSla] = useState(initial?.reviewSlaHours ?? 24);
  const [words, setWords] = useState<string[]>(initial?.blockedWords ?? []);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const addWord = () => {
    const v = draft.trim().toLowerCase();
    if (v && !words.includes(v)) setWords([...words, v]);
    setDraft('');
  };
  const handleSave = async () => {
    if (!onSave) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      return;
    }
    try {
      setSaving(true);
      await onSave({
        autoApproveThreshold: approve,
        autoRejectThreshold: reject,
        reviewSlaHours: sla,
        blockedWords: words,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };
  return <Card>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🛡️</span>
        <h2 className="text-lg font-extrabold text-[#1e1b4b]">Chính sách kiểm duyệt</h2>
      </div>
      <p className="text-xs text-[#64748b] font-medium mb-4">
        Ngưỡng tự động duyệt và từ khóa bị chặn
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="Tự duyệt (≥)">
          <input type="number" value={approve} onChange={e => setApprove(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] font-bold text-[#1e1b4b] focus:border-[#6366f1] outline-none" />
        </Field>
        <Field label="Tự từ chối (≤)">
          <input type="number" value={reject} onChange={e => setReject(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] font-bold text-[#1e1b4b] focus:border-[#6366f1] outline-none" />
        </Field>
      </div>

      <Field label="SLA review (giờ)">
        <input type="number" value={sla} onChange={e => setSla(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] font-bold text-[#1e1b4b] focus:border-[#6366f1] outline-none" />
      </Field>

      <div className="mt-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] mb-2">
          Từ khóa bị chặn
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {words.map(w => <span key={w} className="inline-flex items-center gap-1.5 bg-[#fee2e2] text-[#b91c1c] px-2.5 py-1 rounded-full text-xs font-bold">
              {w}
              <button onClick={() => setWords(words.filter(x => x !== w))} className="hover:scale-125 transition-transform">
                ×
              </button>
            </span>)}
        </div>
        <div className="flex gap-2">
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addWord()} placeholder="Thêm từ rồi nhấn Enter" className="flex-1 px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm focus:border-[#6366f1] outline-none" />
          <PillButton variant="ghost" size="sm" onClick={addWord}>
            + Thêm
          </PillButton>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <PillButton onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu chính sách'}
        </PillButton>
        {saved && <Badge tone="green">✓ Đã lưu</Badge>}
      </div>
    </Card>;
}
type CommissionProps = {
  initial?: { writing: number; speaking: number };
  onSave?: (writing: number, speaking: number) => void | Promise<void>;
};
export function CommissionConfig({ initial, onSave }: CommissionProps = {}) {
  const [writing, setWriting] = useState(initial?.writing ?? 50000);
  const [speaking, setSpeaking] = useState(initial?.speaking ?? 40000);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const fmt = (n: number) => n.toLocaleString('vi-VN');
  const handleSave = async () => {
    if (!onSave) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      return;
    }
    try {
      setSaving(true);
      await onSave(writing, speaking);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };
  return <Card>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">💰</span>
        <h2 className="text-lg font-extrabold text-[#1e1b4b]">Cấu hình hoa hồng</h2>
      </div>
      <p className="text-xs text-[#64748b] font-medium mb-4">
        Mức trả cố định cho mỗi bài giáo viên chấm
      </p>

      <div className="space-y-3">
        <MoneyRow icon="✍️" label="Writing" value={writing} fmt={fmt} onStep={d => setWriting(v => Math.max(0, v + d))} />
        <MoneyRow icon="🗣️" label="Speaking" value={speaking} fmt={fmt} onStep={d => setSpeaking(v => Math.max(0, v + d))} />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <PillButton variant="cyan" onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu hoa hồng'}
        </PillButton>
        {saved && <Badge tone="green">✓ Đã lưu</Badge>}
      </div>
    </Card>;
}
function MoneyRow({
  icon,
  label,
  value,
  fmt,
  onStep
}: {
  icon: string;
  label: string;
  value: number;
  fmt: (n: number) => string;
  onStep: (d: number) => void;
}) {
  return <div className="flex items-center justify-between bg-[#f8f8fc] rounded-2xl border-2 border-[#e6e6ed] p-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="font-extrabold text-[#1e1b4b] text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onStep(-10000)} className="w-8 h-8 rounded-xl bg-white border-2 border-[#e6e6ed] font-black text-[#64748b] hover:border-[#6366f1] active:translate-y-[1px]">
          
          −
        </button>
        <span className="w-24 text-center font-black text-[#1e1b4b]">{fmt(value)}đ</span>
        <button onClick={() => onStep(10000)} className="w-8 h-8 rounded-xl bg-white border-2 border-[#e6e6ed] font-black text-[#64748b] hover:border-[#6366f1] active:translate-y-[1px]">
          
          +
        </button>
      </div>
    </div>;
}
function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] mb-1.5 block">
        {label}
      </span>
      {children}
    </label>;
}