import React, { useState } from 'react';
import { Card, Badge, PillButton } from './adminUI';
type AuditLogIn = {
  createdAt?: string;
  actorName?: string;
  actorRole?: 'ADMIN' | 'GIAOVIEN' | 'SYSTEM' | 'USER' | string;
  action?: string;
  targetType?: string;
  targetId?: string;
};
type Log = {
  time: string;
  actor: string;
  role: 'ADMIN' | 'GIAOVIEN' | 'SYSTEM';
  action: string;
  target: string;
  kind: 'create' | 'update' | 'delete';
};
const FILTERS = ['Tất cả', 'Chính sách', 'Hoa hồng', 'Forum', 'Người dùng'];
const kindFromAction = (a: string): Log['kind'] => {
  const x = a.toUpperCase();
  if (x.includes('DELETE') || x.includes('REMOVE')) return 'delete';
  if (x.includes('CREATE') || x.includes('GRANT') || x.includes('ADJUST')) return 'create';
  return 'update';
};
const formatTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
const normalizeRole = (r: string | undefined): Log['role'] => {
  if (r === 'ADMIN' || r === 'GIAOVIEN' || r === 'SYSTEM') return r;
  return 'SYSTEM';
};
export function AuditTrail({ logs = [] }: { logs?: AuditLogIn[] }) {
  const [filter, setFilter] = useState('Tất cả');
  const data: Log[] = logs.map(l => ({
    time: formatTime(l.createdAt),
    actor: l.actorName ?? '—',
    role: normalizeRole(l.actorRole),
    action: l.action ?? '—',
    target: l.targetType ? `${l.targetType}${l.targetId ? ` #${String(l.targetId).slice(0, 6)}` : ''}` : '—',
    kind: kindFromAction(l.action ?? ''),
  }));
  const rows = data.filter(l => {
    if (filter === 'Tất cả') return true;
    if (filter === 'Chính sách') return l.action.includes('POLICY');
    if (filter === 'Hoa hồng') return l.action.includes('COMMISSION');
    if (filter === 'Forum') return l.action.includes('FORUM');
    if (filter === 'Người dùng') return l.action.includes('USER');
    return true;
  });
  const empty = data.length === 0;
  return <Card>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="text-lg font-extrabold text-[#1e1b4b]">Nhật ký kiểm toán</h2>
          </div>
          <p className="text-xs text-[#64748b] font-medium">Ghi lại mọi hành động nhạy cảm của admin</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f ? 'bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]' : 'bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]'}`}>
              {f}
            </button>)}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-wide text-[#64748b] border-b-2 border-[#e6e6ed]">
              <th className="py-2 pr-3">Thời gian</th>
              <th className="py-2 pr-3">Người thực hiện</th>
              <th className="py-2 pr-3">Hành động</th>
              <th className="py-2 pr-3">Đối tượng</th>
              <th className="py-2">Loại</th>
            </tr>
          </thead>
          <tbody>
            {empty ? <tr>
                <td colSpan={5} className="py-12 text-center text-[#94a3b8] font-bold">
                  Chưa có nhật ký nào.
                </td>
              </tr> : rows.map((l, i) => <tr key={i} className="border-b border-[#f1f1f6] hover:bg-[#f8f8fc] transition-colors">
                <td className="py-2.5 pr-3 text-sm font-bold text-[#64748b] whitespace-nowrap">{l.time}</td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#1e1b4b]">{l.actor}</span>
                    <Badge tone={l.role === 'ADMIN' ? 'coral' : l.role === 'GIAOVIEN' ? 'cyan' : 'slate'}>
                      {l.role}
                    </Badge>
                  </div>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="font-mono text-[11px] font-bold text-[#6366f1] bg-[#eef2ff] px-2 py-0.5 rounded-md">
                    {l.action}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-sm text-[#64748b] font-medium whitespace-nowrap">{l.target}</td>
                <td className="py-2.5">
                  <Badge tone={l.kind === 'create' ? 'green' : l.kind === 'delete' ? 'red' : 'amber'}>
                    {l.kind === 'create' ? 'Tạo' : l.kind === 'delete' ? 'Xóa' : 'Sửa'}
                  </Badge>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium text-[#64748b]">
          Hiển thị {rows.length} / {data.length} mục
        </span>
        <PillButton variant="ghost" size="sm">
          Xem tất cả →
        </PillButton>
      </div>
    </Card>;
}