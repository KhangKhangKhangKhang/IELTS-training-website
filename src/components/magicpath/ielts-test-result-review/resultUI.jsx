import React from 'react';
import { Spin } from 'antd';

export function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] ${className}`}>{children}</div>;
}

export function PillButton({ children, onClick, variant = 'primary', size = 'md' }) {
  const sz = size === 'sm' ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm';
  const styles = {
    primary: 'bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#4338ca]',
    purple: 'bg-[#a855f7] text-white shadow-[0_4px_0_#7e22ce] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#7e22ce]',
    ghost: 'bg-white text-[#6366f1] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1] active:translate-y-[1px]',
  };
  return (
    <button onClick={onClick} className={`${sz} ${styles[variant]} font-extrabold uppercase tracking-wide rounded-2xl transition-all whitespace-nowrap`}>
      {children}
    </button>
  );
}

export function ScoreRing({ value, loading = false }) {
  const size = 150;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, (value || 0) / 9);
  if (loading) {
    return (
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Spin size="large" />
      </div>
    );
  }
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#ffffff" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-5xl font-black leading-none">{(value || 0).toFixed(1)}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide opacity-80 mt-1">Band</span>
      </div>
    </div>
  );
}
