import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createManyAnswersAPI, FinistTestAPI } from '@/services/apiDoTest';
import { buildLegacyAnswerForAdapter } from '@/services/contractAdapters';
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

function PaletteCell({ num, state, active, onClick }) {
  // Force numeric label. Nếu BE/adapter lỡ để UUID vào đây thì vẫn
  // hiển thị số thay vì UUID.
  const label = typeof num === "number" || (typeof num === "string" && /^\d+$/.test(num))
    ? num
    : "?";
  const base = 'relative w-9 h-9 rounded-xl text-xs font-extrabold transition-all border-2 flex items-center justify-center';
  let cls = '';
  if (active) cls = 'bg-[#6366f1] text-white border-[#4338ca] shadow-[0_3px_0_#4338ca] scale-110';
  else if (state === 'flagged') cls = 'bg-[#fff1f2] text-[#e11d48] border-[#fb7185] shadow-[0_2px_0_#e11d48]';
  else if (state === 'answered') cls = 'bg-[#eef2ff] text-[#4338ca] border-[#a5b4fc] shadow-[0_2px_0_#a5b4fc]';
  else cls = 'bg-white text-[#64748b] border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]';
  return (
    <button onClick={onClick} className={`${base} ${cls}`}>
      {label}
      {state === 'flagged' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#fb7185] rounded-full ring-2 ring-white" />}
    </button>
  );
}

function MCQOption({ letter, text, selected, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-start gap-3 p-3 rounded-2xl border-2 text-left transition-all ${selected ? 'bg-[#eef2ff] border-[#6366f1] shadow-[0_2px_0_#4338ca]' : 'bg-white border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]'}`}>
      <div className={`flex-none w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${selected ? 'bg-[#6366f1] text-white' : 'bg-[#f1f1f6] text-[#64748b]'}`}>{letter}</div>
      <div className="flex-1 pt-1 text-sm font-semibold text-[#1e1b4b]">{text}</div>
      {selected && <div className="text-[#6366f1] text-lg">✓</div>}
    </button>
  );
}

function MatchingQuestion({ question, options, value, onChange }) {
  const letters = options.map((_, i) => String.fromCharCode(65 + i));
  return (
    <div className="space-y-3">
      <div className="bg-[#eef2ff] border-2 border-[#a5b4fc] rounded-2xl p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-2">Word bank</div>
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt, idx) => (
            <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white border-2 border-[#a5b4fc]">
              <span className="w-5 h-5 rounded-md bg-[#6366f1] text-white text-[10px] font-black flex items-center justify-center">{String.fromCharCode(65 + idx)}</span>
              <span className="text-xs font-semibold text-[#1e1b4b]">{opt.text || opt.matching_key}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((_, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const selected = value === letter;
          return (
            <button key={letter} onClick={() => onChange(letter)} className={`w-11 h-11 rounded-2xl font-black text-sm transition-all border-2 ${selected ? 'bg-[#6366f1] text-white border-[#4338ca] shadow-[0_3px_0_#4338ca]' : 'bg-white text-[#1e1b4b] border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]'}`}>
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LabelingQuestion({ question, options, imageUrl, value, onChange }) {
  return (
    <div className="space-y-3">
      {imageUrl && (
        <div className="bg-[#fafafc] border-2 border-[#e6e6ed] rounded-2xl p-2 flex items-center justify-center">
          <img src={imageUrl} alt="diagram" className="max-w-full max-h-64 object-contain" />
        </div>
      )}
      <div className="bg-[#eef2ff] border-2 border-[#a5b4fc] rounded-2xl p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-2">Word bank</div>
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt, idx) => (
            <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white border-2 border-[#a5b4fc]">
              <span className="w-5 h-5 rounded-md bg-[#6366f1] text-white text-[10px] font-black flex items-center justify-center">{opt.matching_key || String.fromCharCode(65 + idx)}</span>
              <span className="text-xs font-semibold text-[#1e1b4b]">{opt.text || opt.answer_text}</span>
            </div>
          ))}
        </div>
      </div>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-3 rounded-2xl border-2 border-[#e6e6ed] focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.18)] bg-white font-semibold outline-none transition-all">
        <option value="">— Chọn —</option>
        {options.map((opt, idx) => {
          const key = opt.matching_key || String.fromCharCode(65 + idx);
          return <option key={idx} value={key}>{key}. {opt.text || opt.answer_text}</option>;
        })}
      </select>
    </div>
  );
}

function Waveform({ progress, playing }) {
  const bars = 64;
  return (
    <div className="flex items-center gap-[2px] h-12 w-full">
      {Array.from({ length: bars }).map((_, i) => {
        const pct = (i / bars) * 100;
        const past = pct < progress;
        const seed = Math.sin(i * 12.9898) * 43758.5453;
        const h = 14 + Math.abs(seed - Math.floor(seed)) * 30;
        const isLive = playing && Math.abs(pct - progress) < 1.5;
        return (
          <motion.div
            key={i}
            animate={isLive ? { scaleY: [1, 1.6, 1] } : { scaleY: 1 }}
            transition={isLive ? { duration: 0.4, repeat: Infinity } : {}}
            className={`flex-1 rounded-full origin-center ${past ? 'bg-[#6366f1]' : 'bg-[#e6e6ed]'} ${isLive ? '!bg-[#fb7185]' : ''}`}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export const IELTSListeningTestScreen = ({ testData, testResultId, userId, initialAnswers, onSubmitSuccess }) => {
  const sections = useMemo(() => {
    const parts = testData?.parts || [];
    if (parts.length === 0) return [];
    return parts.map((s, idx) => {
      const groupQs = (s?.questionGroups || []).flatMap((g) => g?.questions || g?.question || []);
      const start = idx === 0 ? 1 : (() => { let c = 1; for (let i = 0; i < idx; i++) { c += (parts[i]?.questionGroups || []).reduce((acc, g) => acc + (g?.questions || g?.question || []).length, 0); } return c; })();
      const end = start + groupQs.length - 1;
      return {
        // Render index theo vị trí trong parts (Section 1, 2, …) thay vì
        // s.id UUID từ BE — UUID dùng nội bộ cho key, không phải label.
        id: idx + 1,
        title: s.title || `Section ${idx + 1}`,
        context: s.context || s.description || s?.passage?.content || '',
        questionRange: [start, Math.max(end, start)],
      };
    });
  }, [testData]);

  const questions = useMemo(() => {
    const parts = testData?.parts || [];
    const flat = parts.flatMap((p) =>
      (p?.questionGroups || []).flatMap((g) => g?.questions || g?.question || [])
    );
    return flat.map((q, idx) => {
      const wordBank = (q.answers || []).map((a) => ({
        text: a.answer_text || a.text || '',
        matching_key: a.matching_key || a.label || '',
      }));
      const options = (q.options && q.options.length > 0) ? q.options : wordBank;
      return {
        id: q.id || q.questionNumber || idx + 1,
        // Ưu tiên displayNum từ adapter (số thứ tự BE) trước, fallback idx+1
        displayNum: q.displayNum ?? idx + 1,
        type: q.type || q.questionType || 'FILL_BLANK',
        prompt: q.prompt || q.content || q.questionText || '',
        options,
        wordBank,
        imageUrl: q.imageUrl || null,
        answer: q.userAnswer || '',
      };
    });
  }, [testData]);

  const totalQuestions = questions.length;
  const totalSeconds = (testData?.durationMinutes || 30) * 60;
  const audioUrl = testData?.audioUrl || testData?.listeningAudio;

  const [answers, setAnswers] = useState(() => {
    const init = {};
    const seed = initialAnswers || {};
    questions.forEach((q) => {
      const val = seed[q.id] ?? seed[String(q.id)] ?? q.answer;
      if (val) init[q.id] = val;
    });
    return init;
  });
  const [flagged, setFlagged] = useState({});
  const [activeId, setActiveId] = useState(questions[0]?.id || 1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [submitting, setSubmitting] = useState(false);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const autosaveRef = useRef(null);

  // Timer — auto submit khi hết giờ
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // Audio progress (mock — không dùng audio thật)
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => setProgress((p) => (p < 100 ? p + 0.5 : 100)), 200);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing]);

  // Build legacy-shape answer items the contract adapter can convert.
  // Defined BEFORE the autosave useEffect that depends on it.
  const answersToLegacyPayload = useCallback(() => {
    return Object.entries(answers)
      .map(([qid, val]) => {
        const q = questions.find((x) => x.id === qid || x.id === Number(qid) || String(x.id) === qid);
        return buildLegacyAnswerForAdapter(qid, val, q?.type);
      })
      .filter(Boolean);
  }, [answers, questions]);

  // Autosave (debounce 1.5s)
  useEffect(() => {
    if (!testResultId || !userId) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      const payload = answersToLegacyPayload();
      if (payload.length === 0) return;
      createManyAnswersAPI(userId, testResultId, { answers: payload }).catch((e) => {
        console.warn('autosave failed', e);
      });
    }, 1500);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, [answers, testResultId, userId, answersToLegacyPayload]);

  const setAnswer = useCallback((qid, val) => {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  }, []);

  const toggleFlag = useCallback((qid) => {
    setFlagged((prev) => ({ ...prev, [qid]: !prev[qid] }));
  }, []);

  const getState = useCallback((qid) => {
    if (flagged[qid]) return 'flagged';
    if (answers[qid]) return 'answered';
    return 'unanswered';
  }, [flagged, answers]);

  const active = questions.find((q) => q.id === activeId);
  const activeState = active ? getState(active.id) : 'unanswered';
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;
  const overallProgress = totalQuestions ? (answeredCount / totalQuestions) * 100 : 0;

  const goNext = () => {
    const idx = questions.findIndex((q) => q.id === activeId);
    if (idx < questions.length - 1) setActiveId(questions[idx + 1].id);
  };
  const goPrev = () => {
    const idx = questions.findIndex((q) => q.id === activeId);
    if (idx > 0) setActiveId(questions[idx - 1].id);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = answersToLegacyPayload();
      const result = await FinistTestAPI(testResultId, userId, {
        answers: payload,
        duration: totalSeconds - secondsLeft,
      });
      toast.success('Nộp bài thành công!');
      if (onSubmitSuccess) onSubmitSuccess(result);
    } catch (e) {
      console.error('submit failed', e);
      toast.error('Nộp bài thất bại. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  if (!testData || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#64748b]">
        Không có câu hỏi nào.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#fafafc] flex flex-col">
      <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b-2 border-[#e6e6ed]">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] shadow-[0_3px_0_#4338ca] flex items-center justify-center text-lg">🦉</div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">IELTS Listening</div>
              <div className="text-sm font-extrabold text-[#1e1b4b]">{testData?.title || 'Test'}</div>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] max-w-md mx-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-[#64748b] mb-1.5">
              <span>{answeredCount}/{totalQuestions} đã trả lời</span>
              <span className="ml-auto text-[#6366f1]">{Math.round(overallProgress)}%</span>
            </div>
            <div className="h-2.5 bg-[#f1f1f6] rounded-full overflow-hidden">
              <motion.div animate={{ width: `${overallProgress}%` }} className="h-full bg-gradient-to-r from-[#6366f1] via-[#06b6d4] to-[#fb7185] rounded-full" />
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

      {/* Section ribbon */}
      {sections.length > 0 && (
        <div className="bg-white border-b-2 border-[#e6e6ed]">
          <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center gap-3 overflow-x-auto">
            {sections.map((s, i) => {
              const isCurrent = activeId >= s.questionRange[0] && activeId <= s.questionRange[1];
              const isDone = s.questionRange[1] < activeId;
              return (
                <div key={s.id} className="flex items-center gap-3 flex-none">
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border-2 ${isCurrent ? 'bg-[#eef2ff] border-[#6366f1] shadow-[0_2px_0_#4338ca]' : isDone ? 'bg-[#d1fae5] border-[#10b981]/40' : 'bg-white border-[#e6e6ed]'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${isCurrent ? 'bg-[#6366f1] text-white' : isDone ? 'bg-[#10b981] text-white' : 'bg-[#f1f1f6] text-[#64748b]'}`}>
                      {isDone ? '✓' : s.id}
                    </div>
                    <div>
                      <div className={`text-xs font-extrabold ${isCurrent ? 'text-[#4338ca]' : isDone ? 'text-[#047857]' : 'text-[#64748b]'}`}>{s.title}</div>
                      <div className="text-[10px] text-[#64748b]">{s.context} · Q{s.questionRange[0]}-{s.questionRange[1]}</div>
                    </div>
                  </div>
                  {i < sections.length - 1 && <div className="w-6 h-0.5 bg-[#e6e6ed]" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr_240px] gap-6">
        <section className="space-y-4 lg:sticky lg:top-[160px] lg:self-start">
          <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white rounded-3xl shadow-[0_3px_0_#0b0a1f] p-6 overflow-hidden relative">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#6366f1]/30 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#fb7185]/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">
                <span className={`inline-block w-2 h-2 rounded-full ${playing ? 'bg-[#fb7185] animate-pulse' : 'bg-white/40'}`} />
                {playing ? 'Đang phát' : 'Sẵn sàng'}
              </div>
              <h2 className="text-2xl font-black mb-1" style={{ fontFamily: 'Nunito' }}>Listening Audio</h2>
              <p className="text-sm opacity-80 mb-5">{testData?.audioDescription || 'Nghe kỹ và trả lời các câu hỏi bên dưới.'}</p>

              <Waveform progress={progress} playing={playing} />

              <div className="flex items-center justify-between text-xs font-mono mt-2 opacity-90">
                <span>{fmt(Math.floor((progress / 100) * totalSeconds))}</span>
                <span>{fmt(totalSeconds)}</span>
              </div>

              <div className="flex items-center justify-between mt-5">
                <div className="flex items-center gap-2">
                  <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); }} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg" title="Lùi 10s">⏮</button>
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        if (playing) { audioRef.current.pause(); setPlaying(false); }
                        else { audioRef.current.play().catch(() => {}); setPlaying(true); }
                      } else {
                        setPlaying((p) => !p);
                      }
                    }}
                    className="w-14 h-14 rounded-2xl bg-white text-[#4338ca] shadow-[0_4px_0_rgba(0,0,0,0.25)] flex items-center justify-center text-2xl active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-all"
                  >
                    {playing ? '⏸' : '▶'}
                  </button>
                  <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10); }} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg" title="Tới 10s">⏭</button>
                </div>
                <button className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm" title="Volume">🔊</button>
              </div>

              <div className="mt-5 pt-5 border-t border-white/15 flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="text-xs leading-relaxed opacity-90">
                  <strong className="block mb-0.5">Audio chỉ phát 1 lần</strong>
                  Bài thi thật không cho tua. Tập trung lắng nghe và ghi đáp án trong khi nghe.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-dashed border-[#e6e6ed] p-5 text-center">
            <div className="text-xs text-[#64748b]">Audio đang phát — tập trung nghe và ghi đáp án.</div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] flex flex-col overflow-hidden max-h-[calc(100vh-220px)]">
          {active && (
            <>
              <div className="px-6 py-4 border-b-2 border-[#e6e6ed] flex items-center justify-between bg-gradient-to-r from-[#fff1f2] to-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca] flex items-center justify-center text-lg font-black">{active.displayNum}</div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Question {active.displayNum} of {totalQuestions}</div>
                    <div className="text-sm font-extrabold text-[#1e1b4b]">
                      {active.type === 'MCQ' && 'Multiple choice'}
                      {active.type === 'FILL_BLANK' && 'Fill in the blank'}
                      {active.type === 'MATCHING' && 'Matching'}
                      {active.type === 'LABELING' && 'Labeling'}
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleFlag(active.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all ${activeState === 'flagged' ? 'bg-[#fb7185] text-white shadow-[0_2px_0_#e11d48]' : 'bg-white text-[#64748b] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#fb7185] hover:text-[#fb7185]'}`}>
                  <span>🚩</span>
                  <span>{activeState === 'flagged' ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
                </button>
              </div>

              <div className="overflow-y-auto p-6 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div key={active.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    <p className="text-base font-semibold text-[#1e1b4b] leading-relaxed mb-5">{active.prompt}</p>

                    {active.type === 'MCQ' && active.options?.length > 0 && (
                      <div className="space-y-2.5">
                        {active.options.map((opt, idx) => {
                          const letter = String.fromCharCode(65 + idx);
                          const label = typeof opt === 'string'
                            ? opt
                            : (opt?.text ?? opt?.answer_text ?? opt?.matching_key ?? '');
                          return <MCQOption key={idx} letter={letter} text={label} selected={answers[active.id] === letter} onClick={() => setAnswer(active.id, letter)} />;
                        })}
                      </div>
                    )}

                    {active.type === 'FILL_BLANK' && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Câu trả lời (NO MORE THAN TWO WORDS AND/OR A NUMBER)</label>
                        <input
                          value={answers[active.id] || ''}
                          onChange={(e) => setAnswer(active.id, e.target.value)}
                          placeholder="Type while listening..."
                          className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#e6e6ed] focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.18)] bg-white font-semibold outline-none transition-all text-lg"
                        />
                        <div className="text-xs text-[#64748b]">💡 Tự động lưu sau 1.5s</div>
                      </div>
                    )}

                    {active.type === 'MATCHING' && active.options?.length > 0 && (
                      <MatchingQuestion
                        question={active}
                        options={active.options}
                        value={answers[active.id]}
                        onChange={(v) => setAnswer(active.id, v)}
                      />
                    )}

                    {active.type === 'LABELING' && (
                      <LabelingQuestion
                        question={active}
                        options={active.wordBank || active.options}
                        imageUrl={active.imageUrl}
                        value={answers[active.id]}
                        onChange={(v) => setAnswer(active.id, v)}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="border-t-2 border-[#e6e6ed] p-4 flex items-center gap-3 bg-[#fafafc]">
                <StackedButton tone="ghost" onClick={goPrev}>← Câu trước</StackedButton>
                <div className="flex-1 text-center text-xs font-bold text-[#64748b]">
                  {activeState === 'answered' ? <span className="text-[#10b981]">✓ Đã lưu</span> : 'Chưa trả lời'}
                </div>
                <StackedButton tone="indigo" onClick={goNext}>Câu sau →</StackedButton>
              </div>
            </>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-[160px] lg:self-start">
          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-[#1e1b4b]">Question Palette</h3>
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748b]">{questions[0]?.displayNum ?? "?"} - {questions[questions.length - 1]?.displayNum ?? "?"}</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {questions.map((q) => (
                <PaletteCell key={q.id} num={q.displayNum} state={getState(q.id)} active={q.id === activeId} onClick={() => setActiveId(q.id)} />
              ))}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-[#eef2ff] border-2 border-[#a5b4fc]" />
                <span className="text-[#64748b]">Đã trả lời ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-[#fff1f2] border-2 border-[#fb7185]" />
                <span className="text-[#64748b]">Đã đánh dấu ({Object.values(flagged).filter(Boolean).length})</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white rounded-3xl shadow-[0_3px_0_#0e7490] p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-90 mb-2">
              <span>👂</span> Mẹo Listening
            </div>
            <div className="text-sm font-semibold leading-relaxed">
              Đọc trước câu hỏi 30 giây để biết cần nghe key word nào.
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default IELTSListeningTestScreen;
