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
export function Avatar({
  name,
  tone = '#6366f1',
  size = 48,
  online = false
}: {
  name: string;
  tone?: string;
  size?: number;
  online?: boolean;
}) {
  return <div className="relative shrink-0" style={{
    width: size,
    height: size
  }}>
      <div className="w-full h-full rounded-2xl flex items-center justify-center text-white font-black" style={{
      background: tone,
      fontSize: size * 0.4
    }}>
        
        {name.charAt(0).toUpperCase()}
      </div>
      {online && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#10b981] rounded-full border-2 border-white" />}
    </div>;
}
export function Badge({
  tone = 'slate',
  children
}: {
  tone?: 'indigo' | 'cyan' | 'coral' | 'amber' | 'green' | 'purple' | 'slate';
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    indigo: 'bg-[#eef2ff] text-[#4338ca]',
    cyan: 'bg-[#cffafe] text-[#0e7490]',
    coral: 'bg-[#ffe4e6] text-[#be123c]',
    amber: 'bg-[#fef3c7] text-[#b45309]',
    green: 'bg-[#d1fae5] text-[#047857]',
    purple: 'bg-[#f3e8ff] text-[#7e22ce]',
    slate: 'bg-[#f1f1f6] text-[#64748b]'
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${map[tone]}`}>
      {children}
    </span>;
}