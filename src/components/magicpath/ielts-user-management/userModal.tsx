import React, { useState } from 'react';
import { PillButton } from './userUI';
export type UserRow = {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'GIAOVIEN' | 'USER';
  tone?: string;
  active: boolean;
};
export type UserFormData = {
  name: string;
  email: string;
  phone: string;
  role: UserRow['role'];
};
export function UserModal({
  initial,
  onClose,
  onSave
}: {
  initial: UserRow | null;
  onClose: () => void;
  onSave: (data: UserFormData) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [role, setRole] = useState<UserRow['role']>(initial?.role ?? 'USER');
  const handleSubmit = () => {
    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim(), role });
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-[#1e1b4b]">
            {initial ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-[#f1f1f6] text-[#64748b] font-black">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Họ và tên" value={name} onChange={setName} placeholder="Nguyễn Văn A" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="email@example.com" />
          <Field label="Số điện thoại" value={phone} onChange={setPhone} placeholder="09xxxxxxxx" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] mb-1.5 block">
              Vai trò
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['USER', 'GIAOVIEN', 'ADMIN'] as const).map(r => <button key={r} onClick={() => setRole(r)} className={`py-2 rounded-xl text-xs font-bold transition-all ${role === r ? 'bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]' : 'bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]'}`}>
                  {r === 'USER' ? 'Học viên' : r === 'GIAOVIEN' ? 'Giáo viên' : 'Admin'}
                </button>)}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <PillButton variant="ghost" size="md" onClick={onClose}>
            Hủy
          </PillButton>
          <PillButton variant="primary" size="md" onClick={handleSubmit}>
            {initial ? 'Lưu thay đổi' : 'Thêm mới'}
          </PillButton>
        </div>
      </div>
    </div>;
}
function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] mb-1.5 block">
        {label}
      </span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-2.5 rounded-2xl border-2 border-[#e6e6ed] font-bold text-[#1e1b4b] focus:border-[#6366f1] outline-none" />
      
    </label>;
}