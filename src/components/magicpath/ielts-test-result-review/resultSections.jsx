import React, { useEffect, useState } from 'react';
import { Card } from './resultUI';
import { getResultBreakdownAPI } from '@/services/apiDoTest';

const SKILL_LABEL = {
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

const KIND_LABEL = {
  per_question_type: 'Phân tích theo dạng câu hỏi',
  per_task_type: 'Phân tích theo task',
  per_part: 'Phân tích theo phần',
};

const QUESTION_TYPE_LABEL = {
  TRUE_FALSE_NOT_GIVEN: 'True/False/Not Given',
  YES_NO_NOT_GIVEN: 'Yes/No/Not Given',
  MATCHING_HEADING: 'Matching Heading',
  MATCHING_INFORMATION: 'Matching Information',
  MATCHING_FEATURES: 'Matching Features',
  MATCHING_SENTENCE_ENDINGS: 'Matching Sentence Endings',
  SENTENCE_COMPLETION: 'Sentence Completion',
  SUMMARY_COMPLETION: 'Summary Completion',
  NOTE_COMPLETION: 'Note Completion',
  TABLE_COMPLETION: 'Table Completion',
  FLOW_CHART_COMPLETION: 'Flow Chart Completion',
  DIAGRAM_LABELING: 'Diagram Labeling',
  SHORT_ANSWER: 'Short Answer',
  MULTIPLE_CHOICE: 'Multiple Choice',
  TASK1: 'Task 1 (mô tả graph/chart)',
  TASK2: 'Task 2 (essay)',
  PART1: 'Part 1 (interview)',
  PART2: 'Part 2 (long turn)',
  PART3: 'Part 3 (discussion)',
};

export function BreakdownCard({ idTestResult }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!idTestResult) return;
    let mounted = true;
    setLoading(true);
    getResultBreakdownAPI(idTestResult)
      .then((res) => {
        if (!mounted) return;
        setData(res?.data || res);
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(e?.response?.data?.message || 'Không tải được breakdown');
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [idTestResult]);

  if (loading) {
    return (
      <Card className="p-5">
        <h2 className="text-lg font-extrabold text-[#1e1b4b] mb-2">📈 Phân tích chi tiết</h2>
        <div className="text-sm text-[#94a3b8]">Đang tải...</div>
      </Card>
    );
  }

  if (err || !data || !data.breakdown || data.breakdown.length === 0) {
    return null;
  }

  const skillLabel = SKILL_LABEL[data.skillType] || data.skillType;
  const kindLabel = KIND_LABEL[data.kind] || 'Phân tích';
  const isScoreKind = data.kind !== 'per_question_type';

  return (
    <Card className="p-5">
      <h2 className="text-lg font-extrabold text-[#1e1b4b] mb-1 flex items-center gap-2">
        📈 {kindLabel} ({skillLabel})
      </h2>
      <p className="text-xs text-[#64748b] mb-4">Biết mạnh/yếu ở đâu để tập trung luyện.</p>
      <div className="space-y-3">
        {data.breakdown.map((row) => {
          const label = QUESTION_TYPE_LABEL[row.questionType] || row.questionType;
          const value = isScoreKind ? row.avgScore : row.accuracy;
          const max = isScoreKind ? 9 : 100;
          const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
          const color = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
          return (
            <div key={row.questionType}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-[#1e1b4b]">{label}</span>
                <span className="text-sm font-black" style={{ color }}>
                  {isScoreKind ? `${(row.avgScore ?? 0).toFixed(1)} / 9` : `${row.correct}/${row.total} (${row.accuracy}%)`}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#e6e6ed] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function CriteriaList({ criteria }) {
  const [open, setOpen] = useState(0);
  const list = criteria || [];
  if (list.length === 0) return null;
  return (
    <Card className="p-5">
      <h2 className="text-lg font-extrabold text-[#1e1b4b] mb-4 flex items-center gap-2">📊 Đánh giá chi tiết</h2>
      <div className="space-y-3">
        {list.map((c, i) => (
          <div key={c.name} className="rounded-2xl border-2 border-[#e6e6ed] overflow-hidden">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between p-4 hover:bg-[#f8f8fc] transition-colors">
              <span className="flex items-center gap-2 font-extrabold text-[#1e1b4b] text-sm">
                <span>{c.icon}</span> {c.name}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-black" style={{ color: c.score >= 6 ? '#10b981' : '#f59e0b' }}>{(c.score || 0).toFixed(1)}</span>
                <span className={`text-[#94a3b8] transition-transform ${open === i ? 'rotate-180' : ''}`}>▾</span>
              </span>
            </button>
            {open === i && <div className="px-4 pb-4 text-sm text-[#475569] leading-relaxed">{c.text}</div>}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Corrections({ corrections }) {
  const list = corrections || [];
  if (list.length === 0) return null;
  return (
    <Card className="p-5">
      <h2 className="text-lg font-extrabold text-[#1e1b4b] mb-4 flex items-center gap-2">⚡ Sửa lỗi & cải thiện</h2>
      <div className="space-y-4">
        {list.map((c, i) => (
          <div key={i} className="rounded-2xl border-2 border-[#e6e6ed] p-4">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-3 ${c.type === 'Grammar' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#eef2ff] text-[#4338ca]'}`}>
              {c.type}
            </span>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div className="bg-[#fef2f2] rounded-xl border-2 border-[#fecaca] p-3">
                <p className="text-[11px] font-bold uppercase text-[#b91c1c] mb-1">Lỗi sai</p>
                <p className="text-sm text-[#475569] line-through decoration-[#f87171] decoration-2">{c.mistake}</p>
              </div>
              <div className="bg-[#f0fdf4] rounded-xl border-2 border-[#bbf7d0] p-3">
                <p className="text-[11px] font-bold uppercase text-[#047857] mb-1">Sửa lại</p>
                <p className="text-sm text-[#334155]">{c.correct}</p>
              </div>
            </div>
            <div className="bg-[#eff6ff] rounded-xl border-2 border-[#bfdbfe] p-3 text-sm text-[#475569] italic">
              <span className="font-bold text-[#1d4ed8] not-italic">Giải thích: </span>
              {c.explanation}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
