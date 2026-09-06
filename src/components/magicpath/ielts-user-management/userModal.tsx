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
  gender: 'Male' | 'Female';
  level: 'Low' | 'Mid' | 'High' | 'Great';
  accountType: 'LOCAL' | 'GOOGLE';
  password?: string;
};
const GENDERS = [
  { value: 'Male', label: 'Nam' },
  { value: 'Female', label: 'Nữ' },
] as const;
const LEVELS = [
  { value: 'Low', label: 'Thấp' },
  { value: 'Mid', label: 'Trung bình' },
  { value: 'High', label: 'Cao' },
  { value: 'Great', label: 'Xuất sắc' },
] as const;
const ACCOUNT_TYPES = [
  { value: 'LOCAL', label: 'Local' },
] as const;
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
  const [gender, setGender] = useState<UserFormData['gender']>('Male');
  const [level, setLevel] = useState<UserFormData['level']>('Mid');
  const [accountType, setAccountType] = useState<UserFormData['accountType']>('LOCAL');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isAdd = !initial;

  const handleSubmit = () => {
    if (isAdd) {
      if (!password || password.length < 8) {
        setError('Mật khẩu phải có ít nhất 8 ký tự');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu nhập lại không khớp');
        return;
      }
    }
    setError(null);
    const payload: UserFormData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      gender,
      level,
      accountType,
    };
    if (isAdd) payload.password = password;
    onSave(payload);
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f1f1f6]">
          <h2 className="text-xl font-black text-[#1e1b4b]">
            {initial ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
          </h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-[#f1f1f6] text-[#64748b] font-black text-lg">
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Họ và tên" value={name} onChange={setName} placeholder="Nguyễn Văn A" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="email@example.com" />
          <Field label="Số điện thoại" value={phone} onChange={setPhone} placeholder="09xxxxxxxx" />
          <SegmentField label="Giới tính" options={GENDERS.map(g => ({ ...g }))} value={gender} onChange={setGender} />
          <SegmentField label="Vai trò" options={[
              { value: 'USER', label: 'Học viên' },
              { value: 'GIAOVIEN', label: 'Giáo viên' },
              { value: 'ADMIN', label: 'Admin' },
            ]} value={role} onChange={setRole} cols={3} />
          <SegmentField label="Trình độ" options={LEVELS.map(l => ({ ...l }))} value={level} onChange={setLevel} cols={4} />
          {isAdd && <>
              <PasswordField label="Mật khẩu" value={password} onChange={setPassword} placeholder="Ít nhất 8 ký tự" />
              <PasswordField label="Nhập lại mật khẩu" value={confirmPassword} onChange={setConfirmPassword} placeholder="Nhập lại mật khẩu" />
            </>}
          {error && <div className="md:col-span-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl px-4 py-3">
              {error}
            </div>}
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-[#f1f1f6]">
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
      <span className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] mb-2 block">
        {label}
      </span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-2xl border-2 border-[#e6e6ed] font-bold text-[#1e1b4b] focus:border-[#6366f1] outline-none transition-colors" />

    </label>;
}
function PasswordField({
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
      <span className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] mb-2 block">
        {label}
      </span>
      <input type="password" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-2xl border-2 border-[#e6e6ed] font-bold text-[#1e1b4b] focus:border-[#6366f1] outline-none transition-colors" />
    </label>;
}
function SegmentField<T extends string>({
  label,
  options,
  value,
  onChange,
  cols = 3
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  cols?: 2 | 3 | 4;
}) {
  const gridCols = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4';
  return <div>
      <span className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] mb-2 block">
        {label}
      </span>
      <div className={`grid ${gridCols} gap-2`}>
        {options.map(o => <button key={o.value} type="button" onClick={() => onChange(o.value)} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${value === o.value ? 'bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]' : 'bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]'}`}>
            {o.label}
          </button>)}
      </div>
    </div>;
}