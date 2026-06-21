import React from 'react';
export const C = {
  primary: '#6366f1',
  primaryDark: '#4338ca',
  cyan: '#06b6d4',
  coral: '#fb7185',
  amber: '#f59e0b',
  purple: '#a855f7',
  ink: '#1e1b4b',
  muted: '#64748b',
  line: '#e6e6ed',
  green: '#10b981',
  red: '#ef4444'
};
export function Card({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-5 ${className}`}>
      
      {children}
    </div>;
}
export function Badge({
  tone = 'indigo',
  children
}: {
  tone?: 'indigo' | 'cyan' | 'coral' | 'amber' | 'purple' | 'green' | 'red' | 'slate';
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    indigo: 'bg-[#6366f1] text-white',
    cyan: 'bg-[#06b6d4] text-white',
    coral: 'bg-[#fb7185] text-white',
    amber: 'bg-[#f59e0b] text-white',
    purple: 'bg-[#a855f7] text-white',
    green: 'bg-[#10b981] text-white',
    red: 'bg-[#ef4444] text-white',
    slate: 'bg-[#f1f1f6] text-[#64748b]'
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${map[tone]}`}>
      
      {children}
    </span>;
}
export function PillButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'cyan' | 'ghost' | 'coral';
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const sz = size === 'sm' ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm';
  const styles: Record<string, string> = {
    primary: 'bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#4338ca]',
    cyan: 'bg-[#06b6d4] text-white shadow-[0_4px_0_#0891b2] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#0891b2]',
    coral: 'bg-[#fb7185] text-white shadow-[0_4px_0_#e11d48] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#e11d48]',
    ghost: 'bg-white text-[#6366f1] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1] active:translate-y-[1px]'
  };
  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
  return <button type={type} onClick={onClick} disabled={disabled} className={`${sz} ${styles[variant]} ${disabledCls} font-extrabold uppercase tracking-wide rounded-2xl transition-all whitespace-nowrap`}>
      {children}
    </button>;
}
export function StatCard({
  label,
  value,
  icon,
  tone,
  footer
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  tone: 'indigo' | 'cyan' | 'amber' | 'purple';
  footer?: React.ReactNode;
}) {
  const ring: Record<string, string> = {
    indigo: 'from-[#6366f1] to-[#818cf8]',
    cyan: 'from-[#06b6d4] to-[#22d3ee]',
    amber: 'from-[#f59e0b] to-[#fbbf24]',
    purple: 'from-[#a855f7] to-[#c084fc]'
  };
  return <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
          {label}
        </div>
        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${ring[tone]} flex items-center justify-center text-lg shadow-sm`}>
          
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black text-[#1e1b4b] leading-none">{value}</div>
      {footer && <div className="flex flex-wrap items-center gap-1.5">{footer}</div>}
    </Card>;
}