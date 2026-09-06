import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export type Skill = 'all' | 'reading' | 'listening' | 'writing' | 'speaking';
export type Diff = 'all' | 'easy' | 'medium' | 'hard' | 'veryHard';

export interface DiscoveryTestItem {
  id: string;
  title: string;
  img: string | null;
  skill: Exclude<Skill, 'all'>;
  difficulty: Exclude<Diff, 'all'>;
  duration: number; // seconds per API, formatted to "phút" downstream
  questions: number;
  attempts: number;
  avgBand: number | null;
  bestBand: number | null;
  lastFinishedAt: string | null; // ISO
  isNew?: boolean;
}

export interface DiscoveryCounts {
  all: number;
  reading: number;
  listening: number;
  writing: number;
  speaking: number;
}

export interface UserStatsByTest {
  [idTest: string]: { maxBand: number; lastFinishedAt: string | null };
}

export interface IELTSTestDiscoveryScreenProps {
  tests: DiscoveryTestItem[];
  counts: DiscoveryCounts;
  userStatsById?: UserStatsByTest;
  statsLoading?: boolean;
  skill: Skill;
  setSkill: (s: Skill) => void;
  diff: Diff;
  setDiff: (d: Diff) => void;
  search: string;
  setSearch: (s: string) => void;
  view: 'grid' | 'list';
  setView: (v: 'grid' | 'list') => void;
  onStartTest: (t: DiscoveryTestItem) => void;
}

const skillMeta: Record<Exclude<Skill, 'all'>, {
  icon: string;
  color: string;
  bg: string;
  ring: string;
}> = {
  reading: { icon: '📖', color: 'bg-[#6366f1]', bg: 'bg-[#eef2ff]', ring: 'ring-[#6366f1]' },
  listening: { icon: '🎧', color: 'bg-[#06b6d4]', bg: 'bg-[#cffafe]', ring: 'ring-[#06b6d4]' },
  writing: { icon: '✍️', color: 'bg-[#fb7185]', bg: 'bg-[#fff1f2]', ring: 'ring-[#fb7185]' },
  speaking: { icon: '🎤', color: 'bg-[#a855f7]', bg: 'bg-[#f3e8ff]', ring: 'ring-[#a855f7]' },
};

const diffMeta: Record<Exclude<Diff, 'all'>, { label: string; pill: string }> = {
  easy: { label: 'Dễ', pill: 'bg-[#d1fae5] text-[#047857]' },
  medium: { label: 'Trung bình', pill: 'bg-[#fef3c7] text-[#b45309]' },
  hard: { label: 'Khó', pill: 'bg-[#fee2e2] text-[#b91c1c]' },
  veryHard: { label: 'Rất khó', pill: 'bg-[#7f1d1d] text-white' },
};

function StackedButton({
  children,
  tone = 'indigo',
  size = 'md',
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  tone?: 'indigo' | 'cyan' | 'coral' | 'ghost' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}) {
  const styles = {
    indigo: 'bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] hover:brightness-110',
    cyan: 'bg-[#06b6d4] text-white shadow-[0_4px_0_#0891b2] hover:brightness-110',
    coral: 'bg-[#fb7185] text-white shadow-[0_4px_0_#e11d48] hover:brightness-110',
    amber: 'bg-[#f59e0b] text-white shadow-[0_4px_0_#b45309] hover:brightness-110',
    ghost: 'bg-white text-[#6366f1] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]',
  };
  const sz = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-7 py-3.5 text-base' : 'px-4 py-2 text-sm';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles[tone]} ${sz} font-extrabold uppercase tracking-wide rounded-2xl active:translate-y-[2px] active:shadow-[0_2px_0] transition-all ${className}`}
    >
      {children}
    </button>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-sm transition-all border-2 ${
        active
          ? 'bg-[#6366f1] text-white border-[#4338ca] shadow-[0_3px_0_#4338ca]'
          : 'bg-white text-[#1e1b4b] border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]'
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-md ${
            active ? 'bg-white/20' : 'bg-[#f1f1f6] text-[#64748b]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function formatRelativeVi(date: Date | null): string {
  if (!date) return '';
  const ms = Date.now() - new Date(date).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return 'vừa xong';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk} tuần trước`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} tháng trước`;
  return `${Math.floor(day / 365)} năm trước`;
}

function TestCard({
  t,
  onStart,
}: {
  t: DiscoveryTestItem;
  onStart: () => void;
}) {
  const skill = skillMeta[t.skill];
  const diff = diffMeta[t.difficulty];

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] hover:shadow-[0_5px_0_#e6e6ed] hover:border-[#6366f1]/40 p-5 cursor-pointer transition-all relative overflow-hidden"
    >
      {t.isNew && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#fb7185] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-[0_2px_0_#e11d48]">
          Mới
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-2xl ${skill.color} text-white shadow-[0_3px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-xl flex-none`}
        >
          {skill.icon}
        </div>
        <div className="flex-1 min-w-0 pr-12">
          <h3 className="font-extrabold text-[#1e1b4b] leading-snug">{t.title}</h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${diff.pill}`}
        >
          {diff.label}
        </span>
        <span className="text-xs text-[#64748b]">⏱ {t.duration} phút</span>
        <span className="text-xs text-[#64748b]">· {t.questions} câu</span>
      </div>

      {t.bestBand !== null ? (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#eef2ff] border border-[#a5b4fc]/40 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_#4338ca]">
            {t.bestBand.toFixed(1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#4338ca]">
              Best band
            </div>
            <div className="text-xs text-[#64748b]">
              Đã làm {t.attempted} lần
              {t.lastFinishedAt ? ` · Lần cuối: ${formatRelativeVi(new Date(t.lastFinishedAt))}` : ''}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#fafafc] border border-dashed border-[#e6e6ed] mb-4">
          <span className="text-xl">🎯</span>
          <div className="text-xs text-[#64748b] font-semibold">
            Bạn chưa làm bài này
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <StackedButton tone="indigo" className="flex-1" onClick={onStart}>
          {t.bestBand !== null ? '🔄 Thử lại' : '🚀 Bắt đầu'}
        </StackedButton>
      </div>
    </motion.div>
  );
}

export const IELTSTestDiscoveryScreen = ({
  tests,
  counts,
  skill,
  setSkill,
  diff,
  setDiff,
  search,
  setSearch,
  view,
  setView,
  onStartTest,
}: IELTSTestDiscoveryScreenProps) => {
  const filtered = useMemo(
    () =>
      tests.filter(
        (t) =>
          (skill === 'all' || t.skill === skill) &&
          (diff === 'all' || t.difficulty === diff) &&
          (!search || t.title.toLowerCase().includes(search.toLowerCase())),
      ),
    [tests, skill, diff, search],
  );

  return (
    <div className="min-h-screen w-full bg-[#fafafc]">
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Hero stats */}
        <section className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 relative bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] rounded-3xl p-6 text-white shadow-[0_4px_0_#0b0a1f] overflow-hidden">
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-[#6366f1]/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#fb7185]/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-90 mb-1">
                Practice tests
              </div>
              <h1
                className="text-3xl font-black mb-2"
                style={{ fontFamily: 'Nunito' }}
              >
                Khám phá {tests.length}+ bài thi
              </h1>
              <p className="opacity-80 text-sm mb-5 max-w-md">
                Lọc theo kỹ năng, độ khó. Xem lại band tốt nhất và lịch sử làm bài của bạn.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
              Theo kỹ năng
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="px-2 py-1.5 rounded-lg bg-[#eef2ff]">
                <span className="font-extrabold text-[#4338ca]">📖 {counts.reading}</span>{' '}
                <span className="text-[#64748b]">Reading</span>
              </div>
              <div className="px-2 py-1.5 rounded-lg bg-[#cffafe]">
                <span className="font-extrabold text-[#0e7490]">🎧 {counts.listening}</span>{' '}
                <span className="text-[#64748b]">Listening</span>
              </div>
              <div className="px-2 py-1.5 rounded-lg bg-[#fff1f2]">
                <span className="font-extrabold text-[#e11d48]">✍️ {counts.writing}</span>{' '}
                <span className="text-[#64748b]">Writing</span>
              </div>
              <div className="px-2 py-1.5 rounded-lg bg-[#f3e8ff]">
                <span className="font-extrabold text-[#7e22ce]">🎤 {counts.speaking}</span>{' '}
                <span className="text-[#64748b]">Speaking</span>
              </div>
            </div>
          </div>
        </section>

        {/* Skill filter */}
        <section className="mb-4">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] mb-2">
            Theo kỹ năng
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill active={skill === 'all'} onClick={() => setSkill('all')} count={counts.all}>
              Tất cả
            </FilterPill>
            <FilterPill active={skill === 'reading'} onClick={() => setSkill('reading')} count={counts.reading}>
              📖 Reading
            </FilterPill>
            <FilterPill active={skill === 'listening'} onClick={() => setSkill('listening')} count={counts.listening}>
              🎧 Listening
            </FilterPill>
            <FilterPill active={skill === 'writing'} onClick={() => setSkill('writing')} count={counts.writing}>
              ✍️ Writing
            </FilterPill>
            <FilterPill active={skill === 'speaking'} onClick={() => setSkill('speaking')} count={counts.speaking}>
              🎤 Speaking
            </FilterPill>
          </div>
        </section>

        {/* Search + secondary filters */}
        <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên đề..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-[#e6e6ed] bg-[#fafafc] focus:bg-white focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.15)] font-semibold text-sm outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64748b]">Khó:</span>
            {(['all', 'easy', 'medium', 'hard', 'veryHard'] as Diff[]).map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDiff(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border-2 ${
                  diff === d
                    ? 'bg-[#6366f1] text-white border-[#4338ca] shadow-[0_2px_0_#4338ca]'
                    : 'bg-white text-[#64748b] border-[#e6e6ed] shadow-[0_1px_0_#e6e6ed] hover:border-[#6366f1]'
                }`}
              >
                {d === 'all' ? 'Tất cả' : diffMeta[d].label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-bold text-[#64748b]">Hiển thị:</span>
            <div className="flex bg-[#f1f1f6] rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                  view === 'grid' ? 'bg-white shadow-[0_1px_0_#e6e6ed]' : ''
                }`}
                aria-label="Grid view"
              >
                ⊞
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                  view === 'list' ? 'bg-white shadow-[0_1px_0_#e6e6ed]' : ''
                }`}
                aria-label="List view"
              >
                ☰
              </button>
            </div>
          </div>
        </section>

        {/* Results */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2
              className="text-xl font-black text-[#1e1b4b]"
              style={{ fontFamily: 'Nunito' }}
            >
              {filtered.length} bài thi{' '}
              {skill !== 'all' && <span className="text-[#6366f1]">{skillMeta[skill].icon}</span>}
            </h2>
          </div>

          <div
            className={`grid gap-4 ${
              view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            }`}
          >
            {filtered.map((t) => (
              <TestCard key={t.id} t={t} onStart={() => onStartTest(t)} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-3xl border-2 border-dashed border-[#e6e6ed] p-12 text-center">
              <div className="text-6xl mb-3">🦉</div>
              <div className="text-lg font-extrabold text-[#1e1b4b]">
                Không tìm thấy bài thi nào
              </div>
              <div className="text-sm text-[#64748b] mt-1">
                Thử bỏ bớt bộ lọc hoặc tìm từ khóa khác
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
