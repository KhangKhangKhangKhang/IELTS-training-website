import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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

function StackedButton({ children, tone = 'indigo', onClick, className = '', size = 'md', disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${TONE_STYLES[tone]} ${SIZE_STYLES[size]} font-extrabold uppercase tracking-wide rounded-2xl active:translate-y-[2px] active:shadow-[0_2px_0] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function PaletteCell({ num, state, active, onClick }) {
  // Force numeric label. Tránh hiển thị UUID nếu data lỡ truyền.
  const label = typeof num === "number" || (typeof num === "string" && /^\d+$/.test(num))
    ? num
    : "?";
  const base = 'relative w-9 h-9 rounded-xl text-sm font-extrabold transition-all border-2';
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
    <button onClick={onClick} className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${selected ? 'bg-[#eef2ff] border-[#6366f1] shadow-[0_2px_0_#4338ca]' : 'bg-white border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]'}`}>
      <div className={`flex-none w-9 h-9 rounded-xl flex items-center justify-center font-black ${selected ? 'bg-[#6366f1] text-white' : 'bg-[#f1f1f6] text-[#64748b]'}`}>{letter}</div>
      <div className="flex-1 pt-1.5 text-sm font-semibold text-[#1e1b4b]">{text}</div>
      {selected && <div className="text-[#6366f1] text-lg pt-1">✓</div>}
    </button>
  );
}

function TFNGOption({ value, selected, onClick }) {
  const colors = {
    TRUE: { bg: 'bg-[#10b981]', shadow: 'shadow-[0_3px_0_#047857]' },
    FALSE: { bg: 'bg-[#fb7185]', shadow: 'shadow-[0_3px_0_#e11d48]' },
    'NOT GIVEN': { bg: 'bg-[#64748b]', shadow: 'shadow-[0_3px_0_#334155]' },
  };
  return (
    <button onClick={onClick} className={`flex-1 px-4 py-3 rounded-2xl font-extrabold text-xs uppercase tracking-wide transition-all border-2 ${selected ? `${colors[value].bg} ${colors[value].shadow} text-white border-transparent` : 'bg-white text-[#1e1b4b] border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]'}`}>
      {value}
    </button>
  );
}

function YesNoNotGivenOption({ value, selected, onClick }) {
  const colors = {
    YES: { bg: 'bg-[#06b6d4]', shadow: 'shadow-[0_3px_0_#0e7490]' },
    NO: { bg: 'bg-[#fb7185]', shadow: 'shadow-[0_3px_0_#e11d48]' },
    'NOT GIVEN': { bg: 'bg-[#64748b]', shadow: 'shadow-[0_3px_0_#334155]' },
  };
  return (
    <button onClick={onClick} className={`flex-1 px-4 py-3 rounded-2xl font-extrabold text-xs uppercase tracking-wide transition-all border-2 ${selected ? `${colors[value].bg} ${colors[value].shadow} text-white border-transparent` : 'bg-white text-[#1e1b4b] border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]'}`}>
      {value}
    </button>
  );
}

function MatchingQuestion({ question, options, value, onChange }) {
  const letters = options.map((_, i) => String.fromCharCode(65 + i));
  return (
    <div className="space-y-4">
      <div className="bg-[#eef2ff] border-2 border-[#a5b4fc] rounded-2xl p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-2">Word bank</div>
        <div className="flex flex-wrap gap-2">
          {options.map((opt, idx) => (
            <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border-2 border-[#a5b4fc]">
              <span className="w-5 h-5 rounded-md bg-[#6366f1] text-white text-[10px] font-black flex items-center justify-center">{String.fromCharCode(65 + idx)}</span>
              <span className="text-xs font-semibold text-[#1e1b4b]">{opt.text || opt.matching_key}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Chọn đáp án</label>
        <div className="flex flex-wrap gap-2">
          {options.map((_, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const selected = value === letter;
            return (
              <button key={letter} onClick={() => onChange(letter)} className={`w-12 h-12 rounded-2xl font-black text-sm transition-all border-2 ${selected ? 'bg-[#6366f1] text-white border-[#4338ca] shadow-[0_3px_0_#4338ca]' : 'bg-white text-[#1e1b4b] border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1]'}`}>
                {letter}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LabelingQuestion({ question, options, imageUrl, value, onChange }) {
  return (
    <div className="space-y-4">
      {imageUrl && (
        <div className="bg-[#fafafc] border-2 border-[#e6e6ed] rounded-2xl p-3 flex items-center justify-center">
          <img src={imageUrl} alt="diagram" loading="lazy" className="max-w-full max-h-80 object-contain" />
        </div>
      )}
      <div className="bg-[#eef2ff] border-2 border-[#a5b4fc] rounded-2xl p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-2">Word bank</div>
        <div className="flex flex-wrap gap-2">
          {options.map((opt, idx) => (
            <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border-2 border-[#a5b4fc]">
              <span className="w-5 h-5 rounded-md bg-[#6366f1] text-white text-[10px] font-black flex items-center justify-center">{opt.matching_key || String.fromCharCode(65 + idx)}</span>
              <span className="text-xs font-semibold text-[#1e1b4b]">{opt.text || opt.answer_text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Chọn nhãn</label>
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#e6e6ed] focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.18)] bg-white font-semibold outline-none transition-all">
          <option value="">— Chọn —</option>
          {options.map((opt, idx) => {
            const key = opt.matching_key || String.fromCharCode(65 + idx);
            return <option key={idx} value={key}>{key}. {opt.text || opt.answer_text}</option>;
          })}
        </select>
      </div>
    </div>
  );
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export const IELTSReadingTestScreen = ({ testData, testResultId, userId, initialAnswers, onSubmitSuccess }) => {
  // Normalize passages + questions
  const passages = useMemo(() => {
    const parts = testData?.parts || [];
    if (parts.length === 0) {
      return [{ id: 1, title: testData?.title || 'Passage', content: testData?.content || '', questionIds: (testData?.questions || []).map((q) => q.id || q.questionNumber) }];
    }
    return parts.map((p, idx) => {
      const groupQs = (p?.questionGroups || []).flatMap((g) => g?.questions || g?.question || []);
      return {
        id: p.id ?? idx + 1,
        title: p?.passage?.title || p.title || `Passage ${idx + 1}`,
        content: p?.passage?.content || p.content || p.text || '',
        questionIds: groupQs.map((q) => q.id || q.questionNumber),
      };
    });
  }, [testData]);

  const questions = useMemo(() => {
    const parts = testData?.parts || [];
    const flat = parts.flatMap((p) =>
      (p?.questionGroups || []).flatMap((g) => g?.questions || g?.question || [])
    );
    return flat.map((q, idx) => {
      // Word bank cho MATCHING/LABELING từ g.answers[]
      const wordBank = (q.answers || []).map((a) => ({
        text: a.answer_text || a.text || '',
        matching_key: a.matching_key || a.label || '',
      }));
      // options ưu tiên q.options, fallback word bank
      const options = (q.options && q.options.length > 0)
        ? q.options
        : wordBank;
      return {
        id: q.id || q.questionNumber || idx + 1,
        // Ưu tiên displayNum từ adapter (số thứ tự BE) trước, fallback idx+1
        displayNum: q.displayNum ?? idx + 1,
        type: q.type || q.questionType || 'MCQ',
        prompt: q.prompt || q.content || q.questionText || '',
        options,
        wordBank,
        imageUrl: q.imageUrl || null,
        answer: q.userAnswer || '',
        passageId: q.passageId || null,
      };
    });
  }, [testData]);

  const totalQuestions = questions.length;
  const totalSeconds = (testData?.durationMinutes || 60) * 60;
  const passageOf = useCallback((qid) => {
    const q = questions.find((x) => x.id === qid);
    if (!q) return passages[0]?.id;
    if (q.passageId) return q.passageId;
    // fallback: tìm passage có chứa questionId
    for (const p of passages) {
      if (p.questionIds.includes(qid)) return p.id;
    }
    return passages[0]?.id;
  }, [questions, passages]);

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
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [highlightSentence, setHighlightSentence] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const autosaveRef = useRef(null);

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

  // Build legacy-shape answer items the contract adapter can convert.
  // Each question's `type` (legacy alias or backend enum) drives the payload shape.
  // Defined BEFORE the autosave useEffect that depends on it.
  const answersToLegacyPayload = useCallback(() => {
    return Object.entries(answers)
      .map(([qid, val]) => {
        const q = questions.find((x) => x.id === qid || x.id === Number(qid) || String(x.id) === qid);
        return buildLegacyAnswerForAdapter(qid, val, q?.type);
      })
      .filter(Boolean);
  }, [answers, questions]);

  // Autosave
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
  const activePassage = passages.find((p) => p.id === passageOf(activeId));
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;
  const progress = totalQuestions ? (answeredCount / totalQuestions) * 100 : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeWarn = secondsLeft < 5 * 60;

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
      try {
        const { notifyTestSubmitted } = await import('@/lib/testEvents');
        notifyTestSubmitted({ skillType: 'READING' });
      } catch {
        // non-fatal
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
    } catch (e) {
      console.error('submit failed', e);
      toast.error('Nộp bài thất bại. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  // Render passage content (HTML) — strip HTML tags cho highlight target,
  // nhưng render bằng dangerouslySetInnerHTML để giữ thẻ <p><strong>...
  const renderedPassage = useMemo(() => {
    if (!activePassage?.content) return null;
    return { __html: activePassage.content };
  }, [activePassage]);

  if (!testData || questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-[#64748b]">Không có câu hỏi nào.</div>;
  }

  return (
    <div className="min-h-screen w-full bg-[#fafafc] flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b-2 border-[#e6e6ed]">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] shadow-[0_3px_0_#4338ca] flex items-center justify-center text-lg">🦉</div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">IELTS Reading</div>
              <div className="text-sm font-extrabold text-[#1e1b4b]">{testData?.title || 'Test'}</div>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] max-w-md mx-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-[#64748b] mb-1.5">
              <span>{answeredCount}/{totalQuestions} đã trả lời</span>
              <span className="ml-auto text-[#6366f1]">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-[#f1f1f6] rounded-full overflow-hidden">
              <motion.div animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-[#6366f1] via-[#06b6d4] to-[#fb7185] rounded-full" />
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono font-black text-lg border-2 ${timeWarn ? 'bg-[#fff1f2] text-[#e11d48] border-[#fb7185] shadow-[0_3px_0_#e11d48] animate-pulse' : 'bg-[#eef2ff] text-[#4338ca] border-[#a5b4fc] shadow-[0_3px_0_#a5b4fc]'}`}>
            <span>⏱</span>
            <span>{String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
          </div>

          <StackedButton tone="coral" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang nộp...' : 'Nộp bài'}
          </StackedButton>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_1fr_240px] gap-6">
        <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] flex flex-col overflow-hidden max-h-[calc(100vh-120px)]">
          <div className="px-6 py-4 border-b-2 border-[#e6e6ed] flex items-center justify-between bg-gradient-to-r from-[#eef2ff] to-white">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1]">{activePassage?.title || 'Passage'}</div>
              <h2 className="text-xl font-black text-[#1e1b4b]" style={{ fontFamily: 'Nunito' }}>{activePassage?.title || 'Reading Passage'}</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setHighlightSentence((h) => !h)} className="w-9 h-9 rounded-xl bg-white border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#f59e0b] flex items-center justify-center text-sm" title="Highlight">✏️</button>
            </div>
          </div>
          <div className="overflow-y-auto p-6 text-[15px] leading-[1.85] text-[#1e1b4b]" style={{ fontFamily: 'Plus Jakarta Sans' }} dangerouslySetInnerHTML={renderedPassage} />
        </section>

        <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] flex flex-col overflow-hidden max-h-[calc(100vh-120px)]">
          {active && (
            <>
              <div className="px-6 py-4 border-b-2 border-[#e6e6ed] flex items-center justify-between bg-gradient-to-r from-[#fff1f2] to-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca] flex items-center justify-center text-lg font-black">{active.displayNum}</div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Question {active.displayNum} of {totalQuestions}</div>
                    <div className="text-sm font-extrabold text-[#1e1b4b]">
                      {active.type === 'MCQ' && 'Multiple choice'}
                      {active.type === 'TFNG' && 'True / False / Not given'}
                      {active.type === 'FILL_BLANK' && 'Fill in the blank'}
                      {active.type === 'SHORT_ANSWER' && 'Short answer'}
                      {active.type === 'MATCHING' && 'Matching'}
                      {active.type === 'LABELING' && 'Labeling'}
                      {active.type === 'YES_NO_NOTGIVEN' && 'Yes / No / Not given'}
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

                    {active.type === 'TFNG' && (
                      <div className="flex gap-2">
                        {['TRUE', 'FALSE', 'NOT GIVEN'].map((v) => <TFNGOption key={v} value={v} selected={answers[active.id] === v} onClick={() => setAnswer(active.id, v)} />)}
                      </div>
                    )}

                    {active.type === 'FILL_BLANK' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Câu trả lời của bạn</label>
                        <input value={answers[active.id] || ''} onChange={(e) => setAnswer(active.id, e.target.value)} placeholder="Type ONE WORD ONLY" className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#e6e6ed] focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.18)] bg-white font-semibold outline-none transition-all" />
                        <div className="text-xs text-[#64748b]">💡 Đáp án phải đúng chính tả và viết thường</div>
                      </div>
                    )}

                    {active.type === 'SHORT_ANSWER' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Câu trả lời (NO MORE THAN THREE WORDS)</label>
                        <textarea value={answers[active.id] || ''} onChange={(e) => setAnswer(active.id, e.target.value)} rows={3} placeholder="Type your answer here..." className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#e6e6ed] focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.18)] bg-white font-semibold outline-none transition-all resize-none" />
                      </div>
                    )}

                    {active.type === 'YES_NO_NOTGIVEN' && (
                      <div className="flex gap-2">
                        {['YES', 'NO', 'NOT GIVEN'].map((v) => (
                          <YesNoNotGivenOption key={v} value={v} selected={answers[active.id] === v} onClick={() => setAnswer(active.id, v)} />
                        ))}
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
                  {activeState === 'answered' ? '✓ Đã lưu' : 'Chưa trả lời'}
                </div>
                <StackedButton tone="indigo" onClick={goNext}>Câu sau →</StackedButton>
              </div>
            </>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-[#1e1b4b]">Bản đồ câu hỏi</h3>
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748b]">{totalQuestions} câu</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {questions.map((q) => <PaletteCell key={q.id} num={q.displayNum} state={getState(q.id)} active={q.id === activeId} onClick={() => setActiveId(q.id)} />)}
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-white border-2 border-[#e6e6ed]" />
                <span className="text-[#64748b]">Chưa trả lời ({questions.filter((q) => getState(q.id) === 'unanswered').length})</span>
              </div>
            </div>
          </div>

          <div className="bg-[#fff1f2] border-2 border-[#fb7185]/30 rounded-3xl p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-[#e11d48] mb-1">⚠️ Mẹo</div>
            <div className="text-sm font-semibold text-[#1e1b4b] leading-relaxed">
              Đừng dừng quá lâu ở 1 câu. Đánh dấu rồi quay lại sau khi xong các câu dễ.
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default IELTSReadingTestScreen;
