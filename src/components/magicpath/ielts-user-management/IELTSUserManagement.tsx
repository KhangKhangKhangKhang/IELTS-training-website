import React, { useMemo, useState } from 'react';
import { Card, RoleBadge, Avatar, PillButton } from './userUI';
import { UserModal, UserRow, UserFormData } from './userModal';
const TONES = ['#6366f1', '#06b6d4', '#fb7185', '#a855f7', '#f59e0b', '#10b981'];
const FILTERS = [{
  key: 'all',
  label: 'Tất cả'
}, {
  key: 'ADMIN',
  label: 'Admin'
}, {
  key: 'GIAOVIEN',
  label: 'Giáo viên'
}, {
  key: 'USER',
  label: 'Học viên'
}] as const;
type Props = {
  users?: UserRow[];
  loading?: boolean;
  onAddUser?: (data: UserFormData) => void | Promise<void>;
  onUpdateUser?: (id: number, data: UserFormData) => void | Promise<void>;
  onDeleteUser?: (id: number) => void | Promise<void>;
  onToggleActive?: (id: number, next: boolean) => void | Promise<void>;
};
const toneFor = (id: number) => TONES[Math.abs(id) % TONES.length];
export const IELTSUserManagement = ({
  users: usersProp = [],
  loading = false,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleActive,
}: Props) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [modal, setModal] = useState<{
    open: boolean;
    row: UserRow | null;
  }>({
    open: false,
    row: null
  });
  const stats = useMemo(() => ({
    total: usersProp.length,
    admin: usersProp.filter(u => u.role === 'ADMIN').length,
    teacher: usersProp.filter(u => u.role === 'GIAOVIEN').length,
    student: usersProp.filter(u => u.role === 'USER').length
  }), [usersProp]);
  const rows = usersProp.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(search);
    const matchRole = filter === 'all' || u.role === filter;
    return matchSearch && matchRole;
  });
  const handleSave = async (data: UserFormData) => {
    try {
      if (modal.row && onUpdateUser) {
        await onUpdateUser(modal.row.id, data);
      } else if (!modal.row && onAddUser) {
        await onAddUser(data);
      }
      setModal({ open: false, row: null });
    } catch (e) {
      console.error('UserModal save failed', e);
    }
  };
  const handleDelete = async (id: number) => {
    if (!onDeleteUser) return;
    if (typeof window !== 'undefined' && !window.confirm('Xóa người dùng này?')) return;
    try {
      await onDeleteUser(id);
    } catch (e) {
      console.error('Delete failed', e);
    }
  };
  const handleToggle = async (u: UserRow) => {
    if (!onToggleActive) return;
    try {
      await onToggleActive(u.id, !u.active);
    } catch (e) {
      console.error('Toggle failed', e);
    }
  };
  return <div className="min-h-screen w-full bg-gradient-to-br from-[#f1f1f6] via-[#eef2ff] to-[#f1f1f6] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* Header */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center text-2xl shadow-[0_4px_0_#4338ca]">
                👥
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#1e1b4b]">Quản lý người dùng</h1>
                <p className="text-sm text-[#64748b] font-medium">
                  Thêm, sửa, phân quyền và quản lý tài khoản
                </p>
              </div>
            </div>
            <PillButton variant="primary" size="md" onClick={() => setModal({
            open: true,
            row: null
          })}>
              + Thêm người dùng
            </PillButton>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon="👥" label="Tổng" value={stats.total} tone="#6366f1" />
          <Stat icon="👑" label="Admin" value={stats.admin} tone="#fb7185" />
          <Stat icon="📘" label="Giáo viên" value={stats.teacher} tone="#06b6d4" />
          <Stat icon="🎓" label="Học viên" value={stats.student} tone="#a855f7" />
        </div>

        {/* Toolbar + table */}
        <Card className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, email, số điện thoại..." className="w-full pl-9 pr-3 py-2.5 rounded-2xl border-2 border-[#e6e6ed] text-sm font-medium focus:border-[#6366f1] outline-none" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map(f => <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${filter === f.key ? 'bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]' : 'bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]'}`}>
                  {f.label}
                </button>)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[680px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wide text-[#64748b] border-b-2 border-[#e6e6ed]">
                  <th className="py-2.5 pr-3">Người dùng</th>
                  <th className="py-2.5 pr-3">Liên hệ</th>
                  <th className="py-2.5 pr-3">Vai trò</th>
                  <th className="py-2.5 pr-3">Trạng thái</th>
                  <th className="py-2.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(u => <tr key={u.id} className="border-b border-[#f1f1f6] hover:bg-[#f8f8fc] transition-colors">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} tone={u.tone ?? toneFor(u.id)} />
                        <span className="font-extrabold text-sm text-[#1e1b4b] whitespace-nowrap">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-sm text-[#334155] font-medium">{u.email}</div>
                      <div className="text-xs text-[#94a3b8] font-medium">{u.phone || '—'}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3 pr-3">
                      <button onClick={() => handleToggle(u)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${u.active ? 'bg-[#d1fae5] text-[#047857]' : 'bg-[#f1f1f6] text-[#94a3b8]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-[#10b981]' : 'bg-[#94a3b8]'}`} />
                        {u.active ? 'Hoạt động' : 'Đã khóa'}
                      </button>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        <PillButton variant="ghost" onClick={() => setModal({
                      open: true,
                      row: u
                    })}>
                          ✏️ Sửa
                        </PillButton>
                        <PillButton variant="red" onClick={() => handleDelete(u.id)}>
                          🗑️
                        </PillButton>
                      </div>
                    </td>
                  </tr>)}
                {!loading && rows.length === 0 && <tr>
                    <td colSpan={5} className="py-12 text-center text-[#94a3b8] font-bold">
                      Không tìm thấy người dùng nào.
                    </td>
                  </tr>}
                {loading && <tr>
                    <td colSpan={5} className="py-12 text-center text-[#94a3b8] font-bold">
                      Đang tải…
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {modal.open && <UserModal initial={modal.row} onClose={() => setModal({
      open: false,
      row: null
    })} onSave={handleSave} />}
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