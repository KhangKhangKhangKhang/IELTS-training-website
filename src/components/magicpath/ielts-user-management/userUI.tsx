import React from 'react';
export function Card({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] ${className}`}>
      
      {children}
    </div>;
}
export function RoleBadge({
  role
}: {
  role: 'ADMIN' | 'GIAOVIEN' | 'USER';
}) {
  const map = {
    ADMIN: {
      label: '👑 Admin',
      cls: 'bg-[#ffe4e6] text-[#be123c]'
    },
    GIAOVIEN: {
      label: '📘 Giáo viên',
      cls: 'bg-[#cffafe] text-[#0e7490]'
    },
    USER: {
      label: '🎓 Học viên',
      cls: 'bg-[#f1f1f6] text-[#64748b]'
    }
  };
  const m = map[role];
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${m.cls}`}>
      {m.label}
    </span>;
}
export function Avatar({
  name,
  tone
}: {
  name: string;
  tone: string;
}) {
  return <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0" style={{
    background: tone
  }}>
      
      {name.charAt(0).toUpperCase()}
    </div>;
}
export function PillButton({
  children,
  onClick,
  variant = 'primary',
  size = 'sm'
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'red';
  size?: 'sm' | 'md';
}) {
  const sz = size === 'sm' ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2.5 text-sm';
  const styles: Record<string, string> = {
    primary: 'bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#4338ca]',
    red: 'bg-[#ef4444] text-white shadow-[0_3px_0_#b91c1c] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#b91c1c]',
    ghost: 'bg-white text-[#64748b] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1] hover:text-[#6366f1]'
  };
  return <button onClick={onClick} className={`${sz} ${styles[variant]} font-extrabold uppercase tracking-wide rounded-xl transition-all whitespace-nowrap`}>
      
      {children}
    </button>;
}