import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
interface Topic {
  id: number;
  title: string;
  desc: string;
  level: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  duration: number;
  exercises: number;
  progress: number;
  status: 'done' | 'current' | 'locked' | 'available';
}
const categories = [{
  id: 'tenses',
  name: 'Tenses',
  icon: '🕐',
  count: 12,
  done: 8,
  color: 'from-[#6366f1] to-[#a855f7]',
  bg: 'bg-[#eef2ff]'
}, {
  id: 'conditionals',
  name: 'Conditionals',
  icon: '🔀',
  count: 6,
  done: 3,
  color: 'from-[#06b6d4] to-[#0891b2]',
  bg: 'bg-[#cffafe]'
}, {
  id: 'modals',
  name: 'Modal verbs',
  icon: '🔑',
  count: 8,
  done: 5,
  color: 'from-[#fb7185] to-[#e11d48]',
  bg: 'bg-[#fff1f2]'
}, {
  id: 'passive',
  name: 'Passive voice',
  icon: '🔄',
  count: 5,
  done: 1,
  color: 'from-[#a855f7] to-[#7e22ce]',
  bg: 'bg-[#f3e8ff]'
}, {
  id: 'reported',
  name: 'Reported speech',
  icon: '💬',
  count: 7,
  done: 0,
  color: 'from-[#f59e0b] to-[#d97706]',
  bg: 'bg-[#fef3c7]'
}, {
  id: 'articles',
  name: 'Articles & determiners',
  icon: '🔤',
  count: 9,
  done: 7,
  color: 'from-[#10b981] to-[#059669]',
  bg: 'bg-[#d1fae5]'
}];
const topics: Topic[] = [{
  id: 1,
  title: 'Present perfect vs. past simple',
  desc: 'Phân biệt 2 thì khi nói về hành động trong quá khứ và liên hệ với hiện tại.',
  level: 'B1',
  duration: 12,
  exercises: 18,
  progress: 100,
  status: 'done'
}, {
  id: 2,
  title: 'First &amp; second conditional',
  desc: 'Câu điều kiện loại 1 và 2 — when to use which, common mistakes.',
  level: 'B1',
  duration: 10,
  exercises: 15,
  progress: 100,
  status: 'done'
}, {
  id: 3,
  title: 'Third &amp; mixed conditionals',
  desc: 'Loại 3 và hỗn hợp — diễn tả giả định trái sự thật trong quá khứ và hiện tại.',
  level: 'B2',
  duration: 15,
  exercises: 20,
  progress: 65,
  status: 'current'
}, {
  id: 4,
  title: 'Modal verbs of speculation',
  desc: 'must / might / could / can\'t khi suy đoán về quá khứ và hiện tại.',
  level: 'B2',
  duration: 14,
  exercises: 22,
  progress: 0,
  status: 'available'
}, {
  id: 5,
  title: 'Passive voice in academic writing',
  desc: 'Khi nào nên dùng bị động, các cấu trúc nâng cao cho Writing Task 1.',
  level: 'C1',
  duration: 18,
  exercises: 24,
  progress: 0,
  status: 'available'
}, {
  id: 6,
  title: 'Reported speech with backshift',
  desc: 'Tường thuật lại lời nói — chuyển đổi thì, đại từ, thời gian.',
  level: 'B2',
  duration: 16,
  exercises: 20,
  progress: 0,
  status: 'locked'
}];
function StackedButton({
  children,
  tone = 'indigo',
  size = 'md',
  className = ''
}: {
  children: React.ReactNode;
  tone?: 'indigo' | 'cyan' | 'coral' | 'ghost' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const styles = {
    indigo: 'bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] hover:brightness-110',
    cyan: 'bg-[#06b6d4] text-white shadow-[0_4px_0_#0891b2] hover:brightness-110',
    coral: 'bg-[#fb7185] text-white shadow-[0_4px_0_#e11d48] hover:brightness-110',
    amber: 'bg-[#f59e0b] text-white shadow-[0_4px_0_#b45309] hover:brightness-110',
    ghost: 'bg-white text-[#6366f1] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]'
  };
  const sz = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-7 py-3.5 text-base' : 'px-4 py-2 text-sm';
  return <button className={`${styles[tone]} ${sz} font-extrabold uppercase tracking-wide rounded-2xl active:translate-y-[2px] active:shadow-[0_2px_0] transition-all ${className}`}>
      {children}
    </button>;
}
const levelMeta: Record<Topic['level'], {
  tone: string;
  label: string;
}> = {
  A2: {
    tone: 'bg-[#d1fae5] text-[#047857]',
    label: 'A2 · Cơ bản'
  },
  B1: {
    tone: 'bg-[#cffafe] text-[#0e7490]',
    label: 'B1 · Trung cấp'
  },
  B2: {
    tone: 'bg-[#eef2ff] text-[#4338ca]',
    label: 'B2 · Cao cấp'
  },
  C1: {
    tone: 'bg-[#fef3c7] text-[#b45309]',
    label: 'C1 · Nâng cao'
  },
  C2: {
    tone: 'bg-[#fff1f2] text-[#e11d48]',
    label: 'C2 · Thành thạo'
  }
};
function TopicCard({
  t
}: {
  t: Topic;
}) {
  const isLocked = t.status === 'locked';
  const isDone = t.status === 'done';
  const isCurrent = t.status === 'current';
  return <motion.div whileHover={!isLocked ? {
    y: -3
  } : {}} className={`relative bg-white rounded-3xl border-2 p-5 transition-all overflow-hidden ${isLocked ? 'border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] opacity-60' : isCurrent ? 'border-[#6366f1] shadow-[0_4px_0_#4338ca]' : 'border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] hover:border-[#6366f1]/40 hover:shadow-[0_5px_0_#e6e6ed] cursor-pointer'}`}>
      {isCurrent && <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#6366f1] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-[0_2px_0_#4338ca]">Đang học</div>}
      {isDone && <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#10b981] text-white shadow-[0_2px_0_#047857] flex items-center justify-center text-sm">✓</div>}
      {isLocked && <div className="absolute top-3 right-3 text-2xl">🔒</div>}

      <div className="flex items-center gap-2 mb-3 pr-12">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${levelMeta[t.level].tone}`}>
          {levelMeta[t.level].label}
        </span>
      </div>

      <h3 className="font-black text-[#1e1b4b] text-base mb-2 leading-snug" style={{
      fontFamily: 'Nunito'
    }} dangerouslySetInnerHTML={{
      __html: t.title
    }} />
      <p className="text-xs text-[#64748b] leading-relaxed mb-4" dangerouslySetInnerHTML={{
      __html: t.desc
    }} />

      <div className="flex items-center gap-3 text-xs text-[#64748b] mb-4">
        <span>⏱ {t.duration} phút</span>
        <span>· {t.exercises} bài tập</span>
      </div>

      {!isLocked && t.progress > 0 && <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] font-bold mb-1">
            <span className="text-[#64748b]">Tiến độ</span>
            <span className={isDone ? 'text-[#10b981]' : 'text-[#6366f1]'}>{t.progress}%</span>
          </div>
          <div className="h-2 bg-[#f1f1f6] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isDone ? 'bg-gradient-to-r from-[#10b981] to-[#059669]' : 'bg-gradient-to-r from-[#6366f1] to-[#a855f7]'}`} style={{
          width: `${t.progress}%`
        }} />
          </div>
        </div>}

      {!isLocked && <div className="flex items-center gap-2">
          <StackedButton tone={isCurrent ? 'indigo' : 'ghost'} className="flex-1">
            {isDone ? '🔄 Ôn lại' : isCurrent ? '▶ Tiếp tục' : '🚀 Bắt đầu'}
          </StackedButton>
          <button className="w-9 h-9 rounded-2xl bg-white border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1] flex items-center justify-center text-sm transition-all">
            🔖
          </button>
        </div>}

      {isLocked && <div className="text-xs text-[#64748b] font-bold flex items-center gap-1">
          <span>🔒</span> Hoàn thành "Modal verbs of speculation" để mở khóa
        </div>}
    </motion.div>;
}
export const IELTSGrammarPage = () => {
  const [activeCat, setActiveCat] = useState('tenses');
  return <div className="min-h-screen w-full bg-[#fafafc]">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b-2 border-[#e6e6ed]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] shadow-[0_3px_0_#4338ca] flex items-center justify-center text-lg">🦉</div>
            <span className="text-lg font-black text-[#1e1b4b]" style={{
            fontFamily: 'Nunito'
          }}>OwlIELTS</span>
          </div>
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {[{
            name: 'Trang chủ',
            icon: '🏠'
          }, {
            name: 'Practice',
            icon: '📝'
          }, {
            name: 'Vocab',
            icon: '📚'
          }, {
            name: 'Grammar',
            icon: '🎓',
            active: true
          }, {
            name: 'Cộng đồng',
            icon: '💬'
          }].map(item => <a key={item.name} className={`px-3 py-2 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-1.5 transition-all ${item.active ? 'bg-[#eef2ff] text-[#4338ca]' : 'text-[#64748b] hover:bg-[#f1f1f6]'}`}>
                <span className="text-xs">{item.icon}</span>{item.name}
              </a>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#fff1f2] text-[#e11d48] font-extrabold border-2 border-[#fb7185]/30 text-sm">🔥 12</div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#fb7185] to-[#f59e0b] flex items-center justify-center text-lg shadow-[0_3px_0_#b45309]">👩</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] rounded-3xl p-7 text-white shadow-[0_4px_0_#0b0a1f] overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#a855f7]/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#fb7185]/20 rounded-full blur-3xl" />
          <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-90 mb-2">📚 Grammar mastery</div>
              <h1 className="text-3xl font-black mb-2" style={{
              fontFamily: 'Nunito'
            }}>47 chủ điểm ngữ pháp · từ A2 → C2</h1>
              <p className="opacity-80 text-sm mb-5 max-w-xl">Mỗi chủ điểm: lý thuyết ngắn gọn 5 phút + 15-20 bài tập áp dụng. Đặc biệt cho IELTS Writing &amp; Speaking.</p>

              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Đã hoàn thành</div>
                  <div className="text-2xl font-black flex items-baseline gap-1" style={{
                  fontFamily: 'Nunito'
                }}>
                    24<span className="text-sm opacity-70 font-bold">/47</span>
                  </div>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Độ chính xác</div>
                  <div className="text-2xl font-black" style={{
                  fontFamily: 'Nunito'
                }}>87%</div>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Streak</div>
                  <div className="text-2xl font-black flex items-center gap-1" style={{
                  fontFamily: 'Nunito'
                }}>
                    🔥 12
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button className="bg-white text-[#4338ca] px-5 py-3 rounded-2xl font-extrabold uppercase tracking-wide text-sm shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-all">
                🎯 Làm test trình độ
              </button>
              <button className="bg-white/15 backdrop-blur text-white px-5 py-3 rounded-2xl font-extrabold uppercase tracking-wide text-sm border-2 border-white/30 hover:bg-white/25 transition-all">
                📊 Xem điểm yếu
              </button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-black text-[#1e1b4b]" style={{
            fontFamily: 'Nunito'
          }}>Danh mục</h2>
            <button className="text-xs font-bold text-[#6366f1] hover:underline">Xem tất cả →</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map(c => {
            const pct = c.done / c.count * 100;
            const active = activeCat === c.id;
            return <motion.button key={c.id} whileHover={{
              y: -3
            }} onClick={() => setActiveCat(c.id)} className={`bg-white rounded-3xl border-2 p-4 text-left transition-all ${active ? 'border-[#6366f1] shadow-[0_4px_0_#4338ca]' : 'border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] hover:border-[#6366f1]/40'}`}>
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-[0_3px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-xl mb-2.5`}>
                    {c.icon}
                  </div>
                  <div className="font-extrabold text-[#1e1b4b] text-sm mb-1.5">{c.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-2">{c.done}/{c.count} bài</div>
                  <div className="h-1.5 bg-[#f1f1f6] rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${c.color} rounded-full`} style={{
                  width: `${pct}%`
                }} />
                  </div>
                </motion.button>;
          })}
          </div>
        </section>

        {/* Featured lesson */}
        <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] overflow-hidden">
          <div className="grid md:grid-cols-[1fr_auto] gap-6">
            <div className="p-6">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#fb7185] mb-2">⭐ Bài đang học</div>
              <h2 className="text-2xl font-black text-[#1e1b4b] mb-2" style={{
              fontFamily: 'Nunito'
            }}>Third &amp; mixed conditionals</h2>
              <p className="text-sm text-[#64748b] leading-relaxed mb-5 max-w-xl">
                Câu điều kiện loại 3 dùng để diễn tả giả định trái sự thật trong quá khứ. Mixed conditionals kết hợp 2 loại để diễn tả tình huống phức tạp hơn.
              </p>

              <div className="bg-[#fafafc] rounded-2xl p-4 mb-5 border-l-4 border-[#6366f1]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#4338ca] mb-1">Cấu trúc</div>
                <div className="font-mono text-sm text-[#1e1b4b]">
                  If + S + <span className="bg-[#eef2ff] px-1 rounded">had + V3</span>, S + <span className="bg-[#fff1f2] px-1 rounded">would have + V3</span>
                </div>
                <div className="text-xs text-[#64748b] mt-2 italic">
                  e.g. <span className="text-[#1e1b4b]">If I had studied harder, I would have passed the exam.</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StackedButton tone="indigo" size="lg">▶ Tiếp tục bài 6/8</StackedButton>
                <StackedButton tone="ghost" size="lg">📝 Làm bài tập</StackedButton>
                <span className="text-xs font-bold text-[#64748b]">⏱ Còn 6 phút</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#fb7185] p-6 md:p-8 text-white flex flex-col justify-center min-w-[240px]">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-90 mb-1">Tiến độ bài</div>
              <div className="text-5xl font-black mb-2" style={{
              fontFamily: 'Nunito'
            }}>65%</div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-white rounded-full" style={{
                width: '65%'
              }} />
              </div>
              <div className="text-xs opacity-90 mb-4">6/8 phần đã xong</div>

              <div className="space-y-1.5 text-xs">
                {[{
                label: 'Lý thuyết',
                done: true
              }, {
                label: 'Ví dụ',
                done: true
              }, {
                label: 'Common mistakes',
                done: true
              }, {
                label: 'Quiz 1: Type 3',
                done: true
              }, {
                label: 'Quiz 2: Mixed',
                done: true
              }, {
                label: 'Writing application',
                done: true
              }, {
                label: 'Speaking practice',
                done: false,
                current: true
              }, {
                label: 'Final test',
                done: false
              }].map(s => <div key={s.label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] flex-none ${s.done ? 'bg-white text-[#10b981]' : s.current ? 'bg-white/20 ring-2 ring-white' : 'bg-white/10'}`}>
                      {s.done ? '✓' : ''}
                    </div>
                    <span className={s.done ? 'opacity-70' : s.current ? 'font-extrabold' : 'opacity-50'}>{s.label}</span>
                  </div>)}
              </div>
            </div>
          </div>
        </section>

        {/* Topics list */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-[#1e1b4b]" style={{
              fontFamily: 'Nunito'
            }}>
                {categories.find(c => c.id === activeCat)?.name || 'Topics'}
              </h2>
              <div className="text-xs text-[#64748b]">Học tuần tự để build kiến thức nền tảng vững</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#64748b]">Lọc:</span>
              {(['Tất cả', 'Đang học', 'Chưa học', 'Đã thuộc'] as const).map((f, i) => <button key={f} className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${i === 0 ? 'bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]' : 'bg-white border-2 border-[#e6e6ed] text-[#64748b] hover:border-[#6366f1]'}`}>
                  {f}
                </button>)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map(t => <TopicCard key={t.id} t={t} />)}
          </div>
        </section>

        {/* Practice CTA */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#fef3c7] via-[#fff1f2] to-[#eef2ff] rounded-3xl border-2 border-[#f59e0b]/30 p-6 flex items-center gap-4">
            <div className="text-5xl">🎯</div>
            <div className="flex-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309] mb-1">Mixed practice</div>
              <h3 className="text-lg font-black text-[#1e1b4b] mb-1" style={{
              fontFamily: 'Nunito'
            }}>50 câu trộn từ tất cả chủ điểm</h3>
              <p className="text-xs text-[#64748b]">Ôn tập tổng hợp giúp nhớ lâu hơn</p>
            </div>
            <StackedButton tone="amber">Bắt đầu</StackedButton>
          </div>

          <div className="bg-gradient-to-br from-[#eef2ff] via-[#f3e8ff] to-[#fff1f2] rounded-3xl border-2 border-[#a855f7]/30 p-6 flex items-center gap-4">
            <div className="text-5xl">🤖</div>
            <div className="flex-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#7e22ce] mb-1">AI Grammar coach</div>
              <h3 className="text-lg font-black text-[#1e1b4b] mb-1" style={{
              fontFamily: 'Nunito'
            }}>Hỏi AI bất kỳ câu hỏi grammar</h3>
              <p className="text-xs text-[#64748b]">Phân biệt các cấu trúc, sửa lỗi câu của bạn</p>
            </div>
            <StackedButton tone="indigo">Hỏi ngay</StackedButton>
          </div>
        </section>
      </main>
    </div>;
};