import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createWritingSubmissionAPI } from '@/services/apiWriting';
import { FinishTestWritingAPI } from '@/services/apiDoTest';
import { toast } from 'react-toastify';

const TONE_STYLES = {
  indigo: 'bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] hover:brightness-110',
  cyan: 'bg-[#06b6d4] text-white shadow-[0_4px_0_#0891b2] hover:brightness-110',
  coral: 'bg-[#fb7185] text-white shadow-[0_4px_0_#e11d48] hover:brightness-110',
  amber: 'bg-[#f59e0b] text-white shadow-[0_4px_0_#b45309] hover:brightness-110',
  ghost: 'bg-white text-[#6366f1] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]',
};
const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

function StackedButton({ children, tone = 'indigo', onClick, size = 'md', disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${TONE_STYLES[tone]} ${SIZE_STYLES[size]} font-extrabold uppercase tracking-wide rounded-2xl active:translate-y-[2px] active:shadow-[0_2px_0] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export const IELTSWritingTestScreen = ({ testData, testResultId, userId, writingTasks, initialAnswers, onSubmitSuccess }) => {
  // tasks: từ props hoặc testData
  const tasks = useMemo(() => {
    const raw = writingTasks || testData?.writingTasks || [];
    if (raw.length === 0) {
      return [
        { id: 1, title: 'Task 1', prompt: 'No task available.', minWords: 150, imageUrl: null },
        { id: 2, title: 'Task 2', prompt: 'No task available.', minWords: 250, imageUrl: null },
      ];
    }
    return raw.map((t, idx) => ({
      id: t.id ?? idx + 1,
      title: t.title || (idx === 0 ? 'Task 1' : 'Task 2'),
      prompt: t.description || t.prompt || t.content || '',
      minWords: t.minWords || (idx === 0 ? 150 : 250),
      imageUrl: t.imageUrl || t.image || null,
    }));
  }, [writingTasks, testData]);

  const totalSeconds = (testData?.durationMinutes || 60) * 60;

  const [texts, setTexts] = useState(() => {
    const init = {};
    const map = initialAnswers || {};
    tasks.forEach((t) => {
      // initialAnswers có thể map theo taskId (number) hoặc idWritingTask (string)
      const seed = map[t.id] ?? map[String(t.id)] ?? map[t.idWritingTask] ?? map[String(t.idWritingTask)] ?? '';
      init[t.id] = typeof seed === 'string' ? seed : (seed?.submissionText || seed?.text || '');
    });
    return init;
  });
  const [activeTaskId, setActiveTaskId] = useState(tasks[0]?.id || 1);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [submitting, setSubmitting] = useState(false);
  const autosaveRef = useRef(null);

  const activeTask = tasks.find((t) => t.id === activeTaskId) || tasks[0];
  const text = texts[activeTaskId] || '';
  const isTask2 = activeTask.minWords >= 250;
  const targetWords = activeTask.minWords;
  const wordCount = useMemo(() => (text.trim() === '' ? 0 : text.trim().split(/\s+/).length), [text]);
  const wordPct = Math.min(100, (wordCount / targetWords) * 100);

  const setText = useCallback((val) => {
    setTexts((prev) => ({ ...prev, [activeTaskId]: val }));
  }, [activeTaskId]);

  // Timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // Autosave (debounce 2s)
  useEffect(() => {
    if (!testResultId || !activeTaskId) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      const txt = texts[activeTaskId];
      if (!txt) return;
      createWritingSubmissionAPI(
        {
          idWritingTask: activeTaskId,
          submissionText: txt,
          wordCount,
        },
        testResultId
      ).catch((e) => {
        console.warn('autosave writing failed', e);
      });
    }, 2000);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, [texts, activeTaskId, testResultId, wordCount]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await FinishTestWritingAPI(testResultId, userId, {
        writingSubmissions: tasks.map((t) => ({
          idWritingTask: t.id,
          submissionText: texts[t.id] || '',
        })),
        duration: totalSeconds - secondsLeft,
      });
      toast.success('Nộp bài thành công!');
      if (onSubmitSuccess) onSubmitSuccess(result);
    } catch (e) {
      console.error('submit writing failed', e);
      toast.error('Nộp bài thất bại. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  if (!testData || tasks.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-[#64748b]">Không có bài tập nào.</div>;
  }

  return (
    <div className="min-h-screen w-full bg-[#fafafc] flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b-2 border-[#e6e6ed]">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] shadow-[0_3px_0_#4338ca] flex items-center justify-center text-lg">🦉</div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">IELTS Writing</div>
              <div className="text-sm font-extrabold text-[#1e1b4b]">{testData?.title || 'Test'}</div>
            </div>
          </div>

          <div className="flex-1 flex justify-center min-w-[200px]">
            <div className="flex bg-[#f1f1f6] rounded-2xl p-1">
              {tasks.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTaskId(t.id)}
                  className={`px-5 py-2 rounded-xl text-sm font-extrabold uppercase tracking-wide transition-all ${activeTaskId === t.id ? 'bg-white text-[#6366f1] shadow-[0_2px_0_#e6e6ed]' : 'text-[#64748b]'}`}
                >
                  {t.title} · {t.minWords === 150 ? '20' : '40'} phút
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl font-mono font-black text-lg bg-[#eef2ff] text-[#4338ca] border-2 border-[#a5b4fc] shadow-[0_3px_0_#a5b4fc]">
            <span>⏱</span>
            <span>{fmt(secondsLeft)}</span>
          </div>

          <StackedButton tone="coral" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang nộp...' : 'Nộp bài'}
          </StackedButton>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_280px] gap-6">
        <section className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-[#eef2ff] to-white border-b-2 border-[#e6e6ed] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#6366f1] text-white flex items-center justify-center text-xs font-black">{tasks.findIndex((t) => t.id === activeTaskId) + 1}</div>
              <div className="text-sm font-extrabold text-[#1e1b4b]">{activeTask.title}</div>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#64748b]">≥ {targetWords} words</span>
            </div>
            <div className="p-5 text-sm text-[#1e1b4b] leading-relaxed whitespace-pre-line" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {activeTask.prompt}
            </div>
            {activeTask.imageUrl && (
              <div className="px-5 pb-5">
                <img src={activeTask.imageUrl} alt="task figure" className="rounded-2xl border-2 border-[#e6e6ed] w-full" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-2">📝 Dàn bài gợi ý</div>
            <ol className="space-y-1.5 text-xs">
              {(isTask2
                ? ['Introduction + thesis', 'Body 1: View A + lý do', 'Body 2: View B + lý do', 'Conclusion + opinion']
                : ['Paraphrase đề', 'Overview 2-3 ý lớn', 'Body 1: chi tiết nhóm 1', 'Body 2: chi tiết nhóm 2']
              ).map((step, i) => (
                <li key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#fafafc]">
                  <div className="w-5 h-5 rounded-md bg-[#6366f1] text-white flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                  <span className="font-semibold text-[#1e1b4b]">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] flex flex-col overflow-hidden max-h-[calc(100vh-120px)]">
          <div className="px-4 py-2.5 border-b-2 border-[#e6e6ed] flex items-center justify-end gap-2 bg-[#fafafc]">
            <span className="text-xs font-bold text-[#64748b]">{wordCount} / {targetWords} từ</span>
            <div className="w-24 h-2 bg-[#f1f1f6] rounded-full overflow-hidden">
              <motion.div animate={{ width: `${wordPct}%` }} className={`h-full rounded-full ${wordCount >= targetWords ? 'bg-gradient-to-r from-[#10b981] to-[#06b6d4]' : 'bg-gradient-to-r from-[#fb7185] to-[#f59e0b]'}`} />
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isTask2 ? 'Mở bài bằng cách giới thiệu chủ đề...' : 'Bắt đầu paraphrase đề bài...'}
            className="flex-1 px-8 py-6 outline-none resize-none text-base leading-[1.85] text-[#1e1b4b] placeholder-[#94a3b8] bg-white"
            style={{ fontFamily: 'Plus Jakarta Sans' }}
          />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
          <div className="bg-[#fef3c7] border-2 border-[#f59e0b]/30 rounded-3xl p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-[#b45309] mb-1">⚠️ Mẹo</div>
            <div className="text-sm font-semibold text-[#1e1b4b] leading-relaxed">
              {isTask2 ? 'Trình bày quan điểm rõ ràng, có thesis statement ở introduction.' : 'Không đưa ý kiến cá nhân — chỉ mô tả số liệu trên biểu đồ.'}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default IELTSWritingTestScreen;
