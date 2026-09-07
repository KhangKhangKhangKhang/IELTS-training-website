import React, { useState, useRef } from 'react';
import { Card, PillButton, ScoreRing } from './resultUI';
import { CriteriaList, Corrections } from './resultSections';
import { getTestResultAndAnswersAPI } from '@/services/apiDoTest';
import { requestTeacherReviewAPI, checkStudentTicketAPI } from '@/services/apiTeacherReview';
import { toast } from 'react-toastify';

function HeroStat({ label, value }) {
  return (
    <div className="bg-white/15 rounded-2xl px-4 py-2 text-center">
      <div className="text-lg font-black text-white leading-none">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-white/70 mt-1">{label}</div>
    </div>
  );
}

const fmt = (s) => `${Math.floor((s || 0) / 60)}:${String((s || 0) % 60).padStart(2, '0')}`;

export const IELTSTestResultReview = ({ testResultId, user, onBack, onRetake }) => {
  const [review, setReview] = useState('none');
  const [reviewTicket, setReviewTicket] = useState(null);
  const [tab, setTab] = useState('feedback');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ref mirror of `data` so the poll interval callback can read the latest
  // fetched payload without re-creating the interval whenever data updates.
  const dataRef = useRef(null);
  React.useEffect(() => { dataRef.current = data; }, [data]);

  React.useEffect(() => {
    if (!testResultId) return;
    let mounted = true;
    setLoading(true);

    const POLL_INTERVAL_MS = 3000;
    const POLL_TIMEOUT_MS = 90_000;
    const startTime = Date.now();
    let pollRef = null;

    // Pick the submissions array based on test type. Reading/listening use
    // neither (sync grade); writing uses writingSubmissions; speaking uses
    // speakingSubmissions. Each has slightly different field aliases in
    // some normalize paths, so fall back to the singular form too.
    const getSubs = (payload) => {
      const tt = (payload?.test?.testType || payload?.result?.testType || payload?.skill || '').toUpperCase();
      if (tt === 'SPEAKING') {
        return (payload?.speakingSubmissions || payload?.speakingSubmission || []).filter(Boolean);
      }
      // WRITING (default for the async path)
      return (payload?.writingSubmissions || payload?.writingSubmission || []).filter(Boolean);
    };

    const fetchOnce = () =>
      getTestResultAndAnswersAPI(testResultId)
        .then((res) => {
          if (!mounted) return;
          setData(res?.data || res);
        })
        .catch((e) => {
          console.error('load result failed', e);
        });

    const stopPolling = () => {
      if (pollRef) {
        clearInterval(pollRef);
        pollRef = null;
      }
    };

    const shouldKeepPolling = () => {
      const payload = dataRef.current;
      const subs = getSubs(payload);
      const allTerminal =
        subs.length > 0 &&
        subs.every(
          (s) => s.aiGradingStatus === 'COMPLETED' || s.aiGradingStatus === 'FAILED',
        );
      const result = payload?.result || payload;
      const bandScore = result?.band_score ?? result?.bandScore ?? payload?.bandScore;
      if (allTerminal) return false;
      if (typeof bandScore === 'number' && bandScore > 0) return false;
      if (Date.now() - startTime > POLL_TIMEOUT_MS) return false;
      return true;
    };

    const startPolling = () => {
      stopPolling();
      pollRef = setInterval(async () => {
        await fetchOnce();
        if (!mounted) {
          stopPolling();
          return;
        }
        if (!shouldKeepPolling()) {
          stopPolling();
        }
      }, POLL_INTERVAL_MS);
    };

    (async () => {
      await fetchOnce();
      if (!mounted) return;
      setLoading(false);
      // Decide whether to keep polling based on the initial result.
      const subs = getSubs(dataRef.current);
      const anyInflight = subs.some(
        (s) => s.aiGradingStatus === 'PENDING' || s.aiGradingStatus === 'GRADING',
      );
      if (anyInflight) startPolling();
    })();

    return () => {
      mounted = false;
      stopPolling();
    };
  }, [testResultId]);

  // Check trạng thái ticket chấm bài
  React.useEffect(() => {
    if (!testResultId) return;
    let mounted = true;
    checkStudentTicketAPI(testResultId)
      .then((res) => {
        if (!mounted) return;
        const ticket = res?.data || res;
        if (ticket && ticket.idTicket) {
          setReviewTicket(ticket);
          const status = (ticket.status || '').toUpperCase();
          if (status === 'PENDING') setReview('pending');
          else if (status === 'CLAIMED' || status === 'IN_PROGRESS') setReview('claimed');
          else if (status === 'COMPLETED') setReview('completed');
        }
      })
      .catch(() => { /* chưa có ticket là bình thường */ });
    return () => { mounted = false; };
  }, [testResultId]);

  const handleRequestReview = async () => {
    if (!user?.idUser) {
      toast.error('Vui lòng đăng nhập để yêu cầu chấm.');
      return;
    }
    try {
      const res = await requestTeacherReviewAPI(testResultId, user.idUser);
      const ticket = res?.data || res;
      setReviewTicket(ticket);
      setReview('pending');
      toast.success(res?.message || 'Đã gửi yêu cầu chấm tới giáo viên.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.';
      toast.error(msg);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[#64748b]">Đang tải kết quả…</div>;
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-[#64748b]">Không có dữ liệu.</div>;
  }

  const result = data.result || data;
  const answers = data.userAnswer || data.userAnswers || data.answers || [];
  // Dedup writingSubmissions theo idWritingTask (BE có thể trả nhiều row
  // cho cùng task do autosave). Giữ submission mới nhất theo submittedAt.
  const rawSubmissions = data.writingSubmissions || data.writingSubmission || [];
  const writingSubmissions = Object.values(
    rawSubmissions.reduce((acc, s) => {
      const key = s.idWritingTask;
      const prev = acc[key];
      if (!prev || new Date(s.submittedAt || 0) > new Date(prev.submittedAt || 0)) {
        acc[key] = s;
      }
      return acc;
    }, {})
  ).sort((a, b) => {
    const order = { TASK1: 1, TASK2: 2 };
    const at = order[(data?.test?.writingTasks || []).find((w) => w.idWritingTask === a.idWritingTask)?.taskType] || 9;
    const bt = order[(data?.test?.writingTasks || []).find((w) => w.idWritingTask === b.idWritingTask)?.taskType] || 9;
    return at - bt;
  });
  const band = result.band_score || result.bandScore || 0;

  const correctCount = result.total_correct || result.totalCorrect || answers.filter((a) => a.isCorrect).length;
  const totalQ = result.total_questions || result.totalQuestions || answers.length;
  const skill = result.skill || result.testType || data?.test?.testType || 'IELTS';
  const testTitle = result.testTitle || result.title || data?.test?.title || 'IELTS Test';
  const duration = result.duration || 0;
  const isWriting = (skill || '').toUpperCase() === 'WRITING' || (data?.test?.testType || '').toUpperCase() === 'WRITING';
  const isSpeaking = (skill || '').toUpperCase() === 'SPEAKING' || (data?.test?.testType || '').toUpperCase() === 'SPEAKING';

  // Speaking submissions: dedup by idSpeakingTask (autosave can produce
  // multiple rows per part). Keep the newest by submittedAt.
  const rawSpeaking = data?.speakingSubmissions || data?.speakingSubmission || [];
  const speakingSubmissions = Object.values(
    rawSpeaking.reduce((acc, s) => {
      const key = s.idSpeakingTask;
      const prev = acc[key];
      if (!prev || new Date(s.submittedAt || 0) > new Date(prev.submittedAt || 0)) {
        acc[key] = s;
      }
      return acc;
    }, {})
  ).sort((a, b) => {
    const order = { PART1: 1, PART2: 2, PART3: 3 };
    const at = order[(data?.test?.speakingTasks || []).find((t) => t.idSpeakingTask === a.idSpeakingTask)?.part] || 9;
    const bt = order[(data?.test?.speakingTasks || []).find((t) => t.idSpeakingTask === b.idSpeakingTask)?.part] || 9;
    return at - bt;
  });

  // Pick the active submission array for state flags based on test type.
  const activeSubs = isSpeaking ? speakingSubmissions : writingSubmissions;

  // Derive per-state flags so the UI knows what to render.
  const allTerminal = activeSubs.length > 0 && activeSubs.every(
    (s) => s.aiGradingStatus === 'COMPLETED' || s.aiGradingStatus === 'FAILED',
  );
  const allFailed = activeSubs.length > 0 && activeSubs.every(
    (s) => s.aiGradingStatus === 'FAILED',
  );
  const anyInflight = activeSubs.some(
    (s) => s.aiGradingStatus === 'PENDING' || s.aiGradingStatus === 'GRADING',
  );
  // Loading = band not yet known: still grading OR aggregator race window
  // (all submissions terminal but worker hasn't yet written bandScore).
  const bandLoading = band === 0 && !allFailed && (anyInflight || allTerminal);
  // Failed = AI grading failed for every submission.
  const bandFailed = allFailed;

  const submissionText = writingSubmissions.map((s) => s.submissionText || s.text).filter(Boolean).join('\n\n')
    || result.submissionText
    || answers.map((a) => a.answer).filter(Boolean).join('\n\n');

  // Map of writing-criterion key → human label for corrections list.
  const CRIT_LABEL = {
    TA: 'Task Response',
    CC: 'Coherence',
    LR: 'Vocabulary',
    GRA: 'Grammar',
    FC: 'Fluency',
    P: 'Pronunciation',
  };
  // Reading/Listening: MCQ/FillBlank mismatches.
  const corrections = answers
    .filter((a) => !a.isCorrect && a.correctAnswer && a.userAnswer)
    .slice(0, 5)
    .map((a) => ({
      type: a.questionType === 'FILL_BLANK' ? 'Grammar' : 'Vocabulary',
      mistake: a.userAnswer,
      correct: a.correctAnswer,
      explanation: a.explanation || 'Cần ôn lại phần này.',
    }));
  // Writing + Speaking: append detailedCorrections from each submission's
  // AI feedback. Each criterion code (TA/CC/LR/GRA for writing;
  // FC/LR/GRA/P for speaking) maps to a human-readable label.
  const aiSubs = isSpeaking ? speakingSubmissions : writingSubmissions;
  if (isWriting || isSpeaking) {
    aiSubs.forEach((s) => {
      const dc = s.aiDetailedFeedback?.detailedCorrections;
      if (!Array.isArray(dc)) return;
      dc.forEach((corr) => {
        corrections.push({
          type: CRIT_LABEL[corr.criterion] || (isSpeaking ? 'Speaking' : 'Writing'),
          mistake: corr.original,
          correct: corr.corrected,
          explanation: corr.explanation || '',
        });
      });
    });
  }

  // Criteria từ result.scores (backend trả) hoặc null
  let criteria = result.scores || null;

  // Writing: structured AI feedback shape (per criterion, score + comment).
  // Each entry of aiDetailedFeedback.{taskAchievement, coherenceAndCohesion,
  // lexicalResource, grammaticalRangeAndAccuracy} becomes its own card.
  const WRITING_CRITERIA = [
    { key: 'taskAchievement',             label: 'Task Achievement',       icon: '🎯' },
    { key: 'coherenceAndCohesion',        label: 'Coherence & Cohesion',   icon: '🔗' },
    { key: 'lexicalResource',             label: 'Lexical Resource',       icon: '📚' },
    { key: 'grammaticalRangeAndAccuracy', label: 'Grammatical Range',      icon: '✍️' },
  ];
  // Speaking: aiDetailedFeedback.{fluencyAndCoherence, lexicalResource,
  // grammaticalRangeAndAccuracy, pronunciation}.
  const SPEAKING_CRITERIA = [
    { key: 'fluencyAndCoherence',         label: 'Fluency & Coherence',    icon: '🗣️' },
    { key: 'lexicalResource',             label: 'Lexical Resource',       icon: '📚' },
    { key: 'grammaticalRangeAndAccuracy', label: 'Grammatical Range',      icon: '✍️' },
    { key: 'pronunciation',               label: 'Pronunciation',          icon: '🎤' },
  ];

  if (isWriting && !criteria) {
    const writingCriteria = [];
    writingSubmissions.forEach((s, i) => {
      const taskInfo = (data?.test?.writingTasks || []).find(
        (w) => w.idWritingTask === s.idWritingTask,
      );
      const taskLabel = taskInfo?.taskType || `Task ${i + 1}`;
      const fb = s.aiDetailedFeedback;
      if (!fb || typeof fb !== 'object' || Array.isArray(fb)) return;

      WRITING_CRITERIA.forEach(({ key, label, icon }) => {
        const c = fb[key];
        if (c && typeof c === 'object' && typeof c.score === 'number') {
          writingCriteria.push({
            name: `${taskLabel} · ${label}`,
            icon,
            score: c.score,
            text: c.comment || '',
          });
        }
      });
    });
    if (writingCriteria.length > 0) {
      criteria = writingCriteria;
    }
  }

  if (isSpeaking && !criteria) {
    const speakingCriteria = [];
    speakingSubmissions.forEach((s, i) => {
      const taskInfo = (data?.test?.speakingTasks || []).find(
        (t) => t.idSpeakingTask === s.idSpeakingTask,
      );
      const taskLabel = taskInfo?.part || `Part ${i + 1}`;
      const fb = s.aiDetailedFeedback;
      if (!fb || typeof fb !== 'object' || Array.isArray(fb)) return;

      SPEAKING_CRITERIA.forEach(({ key, label, icon }) => {
        const c = fb[key];
        if (c && typeof c === 'object' && typeof c.score === 'number') {
          speakingCriteria.push({
            name: `${taskLabel} · ${label}`,
            icon,
            score: c.score,
            text: c.comment || '',
          });
        }
      });
    });
    if (speakingCriteria.length > 0) {
      criteria = speakingCriteria;
    }
  }

  // In-flight feedback message (fallback khi chưa có criteria).
  const inFlightMessage = (isWriting || isSpeaking)
    ? (activeSubs.length === 0
        ? (isSpeaking ? 'Bạn chưa nộp phần thi nào.' : 'Bạn chưa nộp bài viết nào.')
        : activeSubs.every((s) => !s.aiDetailedFeedback && s.aiGradingStatus !== 'COMPLETED' && s.aiGradingStatus !== 'GRADED')
          ? (isSpeaking
              ? '🤖 AI đang phân tích bài nói của bạn. Vui lòng quay lại sau ít phút.'
              : '🤖 AI đang phân tích bài viết của bạn. Vui lòng quay lại sau ít phút.')
          : null)
    : null;

  // Pull generalFeedback prose from each submission's AI feedback so the
  // top "Nhận xét tổng quát" paragraph is meaningful instead of a dummy.
  const generalFb = (isWriting || isSpeaking)
    ? aiSubs
        .map((s) => s.aiDetailedFeedback?.generalFeedback)
        .filter(Boolean)
        .join('\n\n')
    : '';

  const overallFeedback = result.overallFeedback
    || result.feedback
    || generalFb
    || inFlightMessage
    || `Bạn đạt band ${band.toFixed(1)}. ${correctCount}/${totalQ} câu đúng. Hãy xem chi tiết bên dưới để cải thiện.`;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#eef2ff] via-[#f1f1f6] to-[#eff6ff] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Card className="!p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-[#6366f1] via-[#06b6d4] to-[#a855f7] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {bandFailed ? (
                <div className="bg-red-500/20 backdrop-blur rounded-3xl p-6 text-white text-center w-[150px] h-[150px] flex flex-col items-center justify-center">
                  <div className="text-3xl">⚠️</div>
                  <div className="text-xs font-bold uppercase mt-2">AI chấm lỗi</div>
                  <div className="text-[10px] mt-1 opacity-80">Vui lòng thử lại</div>
                </div>
              ) : (
                <ScoreRing value={band} loading={bandLoading} />
              )}
              <div className="flex-1 text-center sm:text-left text-white">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wide mb-2">✓ Hoàn thành</span>
                <h1 className="text-2xl font-black">IELTS {skill} - {testTitle}</h1>
                <p className="text-white/80 font-medium">
                  {isWriting || isSpeaking
                    ? (() => {
                        const scored = activeSubs.filter((s) => typeof s.aiOverallScore === 'number').length;
                        const total = activeSubs.length;
                        if (scored === 0) return 'Đang chờ chấm AI';
                        if (scored < total) return `Đã chấm ${scored}/${total} phần`;
                        return 'Đã chấm AI';
                      })()
                    : `Đúng ${correctCount}/${totalQ} câu`}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                  <HeroStat label="Loại đề" value={skill} />
                  <HeroStat label="Thời gian" value={fmt(duration)} />
                  {isWriting ? (
                    writingSubmissions.map((s, i) => {
                      const t = (data?.test?.writingTasks || []).find((w) => w.idWritingTask === s.idWritingTask);
                      const label = t?.taskType || `Task ${i + 1}`;
                      const score = typeof s.aiOverallScore === 'number' ? s.aiOverallScore.toFixed(1) : '—';
                      return (
                        <HeroStat key={s.idWritingSubmission || i} label={label} value={score} />
                      );
                    })
                  ) : isSpeaking ? (
                    speakingSubmissions.map((s, i) => {
                      const t = (data?.test?.speakingTasks || []).find((st) => st.idSpeakingTask === s.idSpeakingTask);
                      const label = t?.part || `Part ${i + 1}`;
                      const score = typeof s.aiOverallScore === 'number' ? s.aiOverallScore.toFixed(1) : '—';
                      return (
                        <HeroStat key={s.idSpeakingSubmission || i} label={label} value={score} />
                      );
                    })
                  ) : (
                    <HeroStat label="Số câu đúng" value={`${correctCount}/${totalQ}`} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f3e8ff] flex items-center justify-center text-2xl shrink-0">👨‍🏫</div>
              <div>
                <h3 className="font-extrabold text-[#1e1b4b]">Chấm điểm bởi giáo viên</h3>
                <p className="text-sm text-[#64748b] font-medium">Nhận đánh giá chi tiết từ giáo viên thật để cải thiện nhanh hơn.</p>
              </div>
            </div>
            {review === 'none' && <PillButton variant="purple" onClick={handleRequestReview}>Yêu cầu chấm</PillButton>}
            {review === 'pending' && <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#fef3c7] text-[#b45309] font-bold text-sm whitespace-nowrap">⏳ Đang chờ giáo viên</span>}
            {review === 'claimed' && <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#cffafe] text-[#0e7490] font-bold text-sm whitespace-nowrap">✅ GV đang chấm</span>}
          </div>
        </Card>

        <div className="flex gap-2">
          <button onClick={() => setTab('feedback')} className={`px-4 py-2 rounded-2xl text-sm font-extrabold transition-all ${tab === 'feedback' ? 'bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca]' : 'bg-white text-[#64748b] border-2 border-[#e6e6ed] hover:border-[#6366f1]'}`}>🤖 Phản hồi AI</button>
          <button onClick={() => setTab('submission')} className={`px-4 py-2 rounded-2xl text-sm font-extrabold transition-all ${tab === 'submission' ? 'bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca]' : 'bg-white text-[#64748b] border-2 border-[#e6e6ed] hover:border-[#6366f1]'}`}>📄 Bài làm của bạn</button>
        </div>

        {tab === 'feedback' ? (
          <>
            <Card className="p-5">
              <h3 className="font-extrabold text-[#1d4ed8] flex items-center gap-2 mb-2">🏆 Nhận xét tổng quát</h3>
              <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-line">
                {overallFeedback}
              </p>
            </Card>
            {criteria && <CriteriaList criteria={criteria} />}
            {corrections.length > 0 && <Corrections corrections={corrections} />}
          </>
        ) : (
          <Card className="p-5">
            <h3 className="font-extrabold text-[#1e1b4b] mb-3 flex items-center gap-2">📄 Bài làm của bạn</h3>
            {answers.length > 0 || writingSubmissions.length > 0 || speakingSubmissions.length > 0 ? (
              <div className="space-y-3">
                {answers.map((a, i) => (
                  <div key={`a-${i}`} className={`rounded-xl border-2 p-3 ${a.isCorrect ? 'bg-[#f0fdf4] border-[#bbf7d0]' : 'bg-[#fef2f2] border-[#fecaca]'}`}>
                    <div className="text-[10px] font-bold uppercase text-[#64748b] mb-1">Câu {a.questionId || i + 1}</div>
                    <div className="text-sm text-[#334155]"><strong>Bạn:</strong> {a.userAnswer || '(bỏ trống)'}</div>
                    {!a.isCorrect && <div className="text-sm text-[#047857] mt-1"><strong>Đáp án:</strong> {a.correctAnswer}</div>}
                  </div>
                ))}
                {writingSubmissions.map((s, i) => {
                  const taskInfo = (data?.test?.writingTasks || []).find(
                    (w) => w.idWritingTask === s.idWritingTask
                  );
                  const taskLabel = taskInfo?.taskType || `Writing ${i + 1}`;
                  const taskTitle = taskInfo?.title || '';
                  return (
                    <div key={`w-${i}`} className="rounded-xl border-2 border-[#e0e7ff] bg-[#eef2ff] p-3">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4338ca] bg-white border-2 border-[#a5b4fc] rounded-lg px-2 py-0.5">
                          {taskLabel}
                        </span>
                        {taskTitle && (
                          <span className="text-xs font-bold text-[#1e1b4b]">{taskTitle}</span>
                        )}
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                          {s.submissionText?.trim().split(/\s+/).filter(Boolean).length || 0} từ
                        </span>
                      </div>
                      <div className="text-sm text-[#334155] whitespace-pre-wrap leading-relaxed">
                        {s.submissionText || '(bỏ trống)'}
                      </div>
                      {s.aiGradingStatus && (
                        <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                          Trạng thái chấm: {s.aiGradingStatus}
                          {typeof s.aiOverallScore === 'number' && ` · ${s.aiOverallScore}`}
                        </div>
                      )}
                    </div>
                  );
                })}
                {speakingSubmissions.map((s, i) => {
                  const taskInfo = (data?.test?.speakingTasks || []).find(
                    (t) => t.idSpeakingTask === s.idSpeakingTask
                  );
                  const taskLabel = taskInfo?.part || `Part ${i + 1}`;
                  const taskTitle = taskInfo?.title || '';
                  return (
                    <div key={`s-${i}`} className="rounded-xl border-2 border-[#fce7f3] bg-[#fdf2f8] p-3">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#be185d] bg-white border-2 border-[#fbcfe8] rounded-lg px-2 py-0.5">
                          {taskLabel}
                        </span>
                        {taskTitle && (
                          <span className="text-xs font-bold text-[#1e1b4b]">{taskTitle}</span>
                        )}
                        {s.audioUrl && (
                          <audio controls preload="none" src={s.audioUrl} className="ml-auto h-8 max-w-[200px]" />
                        )}
                      </div>
                      {s.transcript && (
                        <div className="text-sm text-[#334155] whitespace-pre-wrap leading-relaxed italic">
                          "{s.transcript}"
                        </div>
                      )}
                      {s.aiGradingStatus && (
                        <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                          Trạng thái chấm: {s.aiGradingStatus}
                          {typeof s.aiOverallScore === 'number' && ` · ${s.aiOverallScore}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#fffbeb] border-2 border-[#fde68a] rounded-2xl p-4 text-sm text-[#92400e] leading-relaxed">
                <div className="font-bold mb-1">⚠️ Bài làm này chưa có câu trả lời nào được lưu.</div>
                <div>Có thể bài chưa được autosave (chưa trả lời câu nào trước khi nộp) hoặc autosave gặp lỗi mạng. Hãy thử làm lại bài thi và trả lời ít nhất 1 câu.</div>
              </div>
            )}
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <PillButton variant="ghost" onClick={onBack}>← Về trang đề thi</PillButton>
          <PillButton variant="primary" onClick={onRetake}>Làm lại đề này</PillButton>
        </div>
      </div>
    </div>
  );
};

export default IELTSTestResultReview;
