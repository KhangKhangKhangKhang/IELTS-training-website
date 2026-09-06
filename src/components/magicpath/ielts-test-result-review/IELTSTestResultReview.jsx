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
      const subs = (payload?.writingSubmissions || payload?.writingSubmission || []).filter(Boolean);
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
      const subs = (dataRef.current?.writingSubmissions ||
        dataRef.current?.writingSubmission || []).filter(Boolean);
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
  const bandLoading = band === 0 && writingSubmissions.some(
    (s) => s.aiGradingStatus === 'PENDING' || s.aiGradingStatus === 'GRADING',
  );
  const correctCount = result.total_correct || result.totalCorrect || answers.filter((a) => a.isCorrect).length;
  const totalQ = result.total_questions || result.totalQuestions || answers.length;
  const skill = result.skill || result.testType || data?.test?.testType || 'IELTS';
  const testTitle = result.testTitle || result.title || data?.test?.title || 'IELTS Test';
  const duration = result.duration || 0;
  const isWriting = (skill || '').toUpperCase() === 'WRITING' || (data?.test?.testType || '').toUpperCase() === 'WRITING';
  const submissionText = writingSubmissions.map((s) => s.submissionText || s.text).filter(Boolean).join('\n\n')
    || result.submissionText
    || answers.map((a) => a.answer).filter(Boolean).join('\n\n');

  // Group answers theo question type
  const corrections = answers
    .filter((a) => !a.isCorrect && a.correctAnswer && a.userAnswer)
    .slice(0, 5)
    .map((a) => ({
      type: a.questionType === 'FILL_BLANK' ? 'Grammar' : 'Vocabulary',
      mistake: a.userAnswer,
      correct: a.correctAnswer,
      explanation: a.explanation || 'Cần ôn lại phần này.',
    }));

  // Criteria từ result.scores (backend trả) hoặc null
  let criteria = result.scores || null;

  // Writing: aggregate per-task AI feedback thành CriteriaList shape.
  // Nếu BE không trả structured scores, fallback về string feedback
  // bằng cách wrap thành 1 criterion duy nhất (text dài → không vào
  // accordion, hiển thị full). Nếu submissions chưa chấm → null.
  if (isWriting && !criteria) {
    const writingCriteria = [];
    writingSubmissions.forEach((s, i) => {
      const taskInfo = (data?.test?.writingTasks || []).find(
        (w) => w.idWritingTask === s.idWritingTask
      );
      const taskLabel = taskInfo?.taskType || `Task ${i + 1}`;
      const fb = s.aiDetailedFeedback;
      const scores = s.aiScores || s.criteriaScores || null;

      if (scores && typeof scores === 'object' && !Array.isArray(scores)) {
        // Object {taskResponse, coherence, lexical, grammar} → tách thành criteria
        Object.entries(scores).forEach(([key, val]) => {
          const num = typeof val === 'number' ? val : typeof val?.score === 'number' ? val.score : null;
          const text = typeof val === 'object' && val !== null
            ? (val.comment || val.feedback || val.text || '')
            : (num != null ? `Band ${num.toFixed(1)}` : '');
          if (num != null) {
            writingCriteria.push({
              name: `${taskLabel} · ${key}`,
              icon: '📝',
              score: num,
              text,
            });
          }
        });
      } else if (Array.isArray(scores)) {
        scores.forEach((c) => {
          if (typeof c?.score === 'number') {
            writingCriteria.push({
              name: `${taskLabel} · ${c.name || c.criterion || 'Criterion'}`,
              icon: c.icon || '📝',
              score: c.score,
              text: c.text || c.comment || c.feedback || '',
            });
          }
        });
      } else if (fb) {
        // Fallback: 1 criterion per task chứa full feedback
        writingCriteria.push({
          name: taskLabel,
          icon: '📝',
          score: typeof s.aiOverallScore === 'number' ? s.aiOverallScore : 0,
          text: typeof fb === 'string' ? fb : JSON.stringify(fb, null, 2),
        });
      }
    });
    if (writingCriteria.length > 0) {
      criteria = writingCriteria;
    }
  }

  // Writing feedback message (fallback khi chưa có criteria).
  const writingFeedbackMessage = isWriting
    ? (writingSubmissions.length === 0
        ? 'Bạn chưa nộp bài viết nào.'
        : writingSubmissions.every((s) => !s.aiDetailedFeedback && s.aiGradingStatus !== 'COMPLETED' && s.aiGradingStatus !== 'GRADED')
          ? '🤖 AI đang phân tích bài viết của bạn. Vui lòng quay lại sau ít phút.'
          : null)
    : null;

  const overallFeedback = result.overallFeedback
    || result.feedback
    || writingFeedbackMessage
    || `Bạn đạt band ${band.toFixed(1)}. ${correctCount}/${totalQ} câu đúng. Hãy xem chi tiết bên dưới để cải thiện.`;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#eef2ff] via-[#f1f1f6] to-[#eff6ff] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Card className="!p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-[#6366f1] via-[#06b6d4] to-[#a855f7] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing value={band} loading={bandLoading} />
              <div className="flex-1 text-center sm:text-left text-white">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wide mb-2">✓ Hoàn thành</span>
                <h1 className="text-2xl font-black">IELTS {skill} - {testTitle}</h1>
                <p className="text-white/80 font-medium">
                  {isWriting
                    ? (() => {
                        const scored = writingSubmissions.filter((s) => typeof s.aiOverallScore === 'number').length;
                        const total = writingSubmissions.length;
                        if (scored === 0) return 'Đang chờ chấm AI';
                        if (scored < total) return `Đã chấm ${scored}/${total} task`;
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
            {answers.length > 0 || writingSubmissions.length > 0 ? (
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
