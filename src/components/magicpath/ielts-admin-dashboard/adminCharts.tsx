import React from 'react';
import { Card, Badge, PillButton, C } from './adminUI';
const SKILLS = [{
  name: 'LISTENING',
  score: 6.4,
  icon: '🎧',
  color: '#06b6d4'
}, {
  name: 'READING',
  score: 6.8,
  icon: '📖',
  color: '#6366f1'
}, {
  name: 'WRITING',
  score: 5.6,
  icon: '✍️',
  color: '#fb7185'
}, {
  name: 'SPEAKING',
  score: 5.9,
  icon: '🗣️',
  color: '#a855f7'
}];
const TREND = [38, 52, 44, 61, 73, 58, 84];
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export function SkillBreakdown() {
  return <Card className="lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#1e1b4b]">Hiệu suất kỹ năng</h2>
          <p className="text-xs text-[#64748b] font-medium">Điểm band trung bình toàn hệ thống</p>
        </div>
        <Badge tone="cyan">↗ +0.3 tuần này</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SKILLS.map(s => {
        const pct = Math.min(100, s.score / 9 * 100);
        return <div key={s.name} className="bg-[#f8f8fc] rounded-2xl p-4 border-2 border-[#e6e6ed] flex flex-col items-center gap-2">
              
              <div className="text-2xl">{s.icon}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
                {s.name}
              </div>
              <div className="text-2xl font-black" style={{
            color: s.score >= 6 ? C.green : s.score >= 5 ? C.amber : C.red
          }}>
                
                {s.score.toFixed(1)}
              </div>
              <div className="w-full h-2.5 bg-[#e6e6ed] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
              width: `${pct}%`,
              background: s.color
            }} />
                
              </div>
            </div>;
      })}
      </div>
      <div className="mt-4 flex items-start gap-2 bg-[#fff7ed] border-2 border-[#fed7aa] rounded-2xl p-3">
        <span className="text-base">⚠️</span>
        <p className="text-xs font-semibold text-[#b45309]">
          Kỹ năng yếu nhất: <span className="font-extrabold">WRITING</span> (5.6) — nên cập nhật kế hoạch can thiệp.
        </p>
      </div>
    </Card>;
}
export function TrendChart() {
  const max = Math.max(...TREND);
  return <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#1e1b4b]">Bài thi 7 ngày</h2>
          <p className="text-xs text-[#64748b] font-medium">Số lượt nộp bài / ngày</p>
        </div>
        <span className="text-2xl">📈</span>
      </div>
      <div className="flex items-end justify-between gap-2 h-36">
        {TREND.map((v, i) => <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="w-full flex items-end justify-center" style={{
          height: '100%'
        }}>
              <div className="w-full max-w-[26px] rounded-t-xl bg-gradient-to-t from-[#6366f1] to-[#818cf8] group-hover:from-[#06b6d4] group-hover:to-[#22d3ee] transition-all" style={{
            height: `${v / max * 100}%`
          }} title={`${v} bài`} />
            
            </div>
            <span className="text-[10px] font-bold text-[#64748b]">{DAYS[i]}</span>
          </div>)}
      </div>
    </Card>;
}