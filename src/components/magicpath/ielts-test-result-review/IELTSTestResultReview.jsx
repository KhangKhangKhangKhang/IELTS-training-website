import React, { useState } from 'react';
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

  React.useEffect(() => {
    if (!testResultId) return;
    let mounted = true;
    setLoading(true);
    getTestResultAndAnswersAPI(testResultId)
      .then((res) => { if (mounted) setData(res?.data || res); })
      .catch((e) => {
        console.error('load result failed', e);
        toast.error('Không tải được kết quả.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
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
  const writingSubmissions = data.writingSubmissions || data.writingSubmission || [];
  const band = result.band_score || result.bandScore || 0;
  const correctCount = result.total_correct || result.totalCorrect || answers.filter((a) => a.isCorrect).length;
  const totalQ = result.total_questions || result.totalQuestions || answers.length;
  const skill = result.skill || result.testType || 'IELTS';
  const testTitle = result.testTitle || result.title || 'IELTS Test';
  const duration = result.duration || 0;
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
  const criteria = result.scores || null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#eef2ff] via-[#f1f1f6] to-[#eff6ff] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Card className="!p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-[#6366f1] via-[#06b6d4] to-[#a855f7] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing value={band} />
              <div className="flex-1 text-center sm:text-left text-white">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wide mb-2">✓ Hoàn thành</span>
                <h1 className="text-2xl font-black">IELTS {skill} - {testTitle}</h1>
                <p className="text-white/80 font-medium">Đúng {correctCount}/{totalQ} câu</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                  <HeroStat label="Loại đề" value={skill} />
                  <HeroStat label="Thời gian" value={fmt(duration)} />
                  <HeroStat label="Số câu đúng" value={`${correctCount}/${totalQ}`} />
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
              <p className="text-sm text-[#475569] leading-relaxed">
                {result.overallFeedback || result.feedback || `Bạn đạt band ${band.toFixed(1)}. ${correctCount}/${totalQ} câu đúng. Hãy xem chi tiết bên dưới để cải thiện.`}
              </p>
            </Card>
            {criteria && <CriteriaList criteria={criteria} />}
            {corrections.length > 0 && <Corrections corrections={corrections} />}
          </>
        ) : (
          <Card className="p-5">
            <h3 className="font-extrabold text-[#1e1b4b] mb-3 flex items-center gap-2">📄 Bài làm của bạn</h3>
            {answers.length > 0 ? (
              <div className="space-y-2">
                {answers.map((a, i) => (
                  <div key={i} className={`rounded-xl border-2 p-3 ${a.isCorrect ? 'bg-[#f0fdf4] border-[#bbf7d0]' : 'bg-[#fef2f2] border-[#fecaca]'}`}>
                    <div className="text-[10px] font-bold uppercase text-[#64748b] mb-1">Câu {a.questionId || i + 1}</div>
                    <div className="text-sm text-[#334155]"><strong>Bạn:</strong> {a.userAnswer || '(bỏ trống)'}</div>
                    {!a.isCorrect && <div className="text-sm text-[#047857] mt-1"><strong>Đáp án:</strong> {a.correctAnswer}</div>}
                  </div>
                ))}
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
