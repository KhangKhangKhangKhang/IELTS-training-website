import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userSpeakingSubmission, finishSpeakingTest } from '@/services/apiSpeaking';
import { toast } from 'react-toastify';
import PartTab from './PartTab';
import QuestionNavigator from './QuestionNavigator';
import QuestionPartScreen from './QuestionPartScreen';

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

function LiveWave({ recording }) {
  const bars = 48;
  return (
    <div className="flex items-center justify-center gap-[3px] h-16 w-full">
      {Array.from({ length: bars }).map((_, i) => {
        const distance = Math.abs(i - bars / 2);
        const baseH = recording ? 12 + (bars / 2 - distance) * 1.4 : 8;
        return (
          <motion.div
            key={i}
            animate={recording ? { scaleY: [0.4, 1.4, 0.7, 1.2, 0.5] } : { scaleY: 0.3 }}
            transition={recording ? { duration: 0.6 + (i % 5) * 0.12, repeat: Infinity, delay: i * 0.02 } : {}}
            className={`flex-1 max-w-[6px] rounded-full origin-center ${recording ? 'bg-gradient-to-t from-[#fb7185] to-[#f59e0b]' : 'bg-[#e6e6ed]'}`}
            style={{ height: `${baseH}px` }}
          />
        );
      })}
    </div>
  );
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export const IELTSSpeakingTestScreen = ({ testData, testResultId, userId, onSubmitSuccess }) => {
  // Normalize parts
  const parts = useMemo(() => testData?.speakingTasks || testData?.parts || [], [testData]);
  const part1Questions = useMemo(() => (parts[0]?.questions || []).map((q, i) => ({ id: q.id ?? i + 1, question: q.question || q.content || '' })), [parts]);
  const cueCard = parts[1] || { topic: 'No cue card', bullets: [] };
  const part3Questions = useMemo(() => (parts[2]?.questions || []).map((q, i) => ({ id: q.id ?? i + 1, question: q.question || q.content || '' })), [parts]);

  const totalSeconds = (testData?.durationMinutes || 15) * 60;

  const [activeTab, setActiveTab] = useState('part1');  // 'part1' | 'part2' | 'part3'
  const [phase, setPhase] = useState('cuecard-prep');
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [notes, setNotes] = useState('');
  const [audioBlobs, setAudioBlobs] = useState({ part1: null, part2: null, part3: null });
  const [recordedPart1Ids, setRecordedPart1Ids] = useState([]); // indices of recorded questions
  const [recordedPart3Ids, setRecordedPart3Ids] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [currentPart1Idx, setCurrentPart1Idx] = useState(0);
  const [currentPart3Idx, setCurrentPart3Idx] = useState(0);

  // Unlock logic: Part 1 always, Part 2 after Part 1 recorded, Part 3 after Part 2 recorded.
  const isUnlocked = (tab) => {
    if (tab === 'part1') return true;
    if (tab === 'part2') return audioBlobs.part1 !== null || part1Questions.length === 0;
    if (tab === 'part3') return audioBlobs.part2 !== null;
    return false;
  };

  // Indices of part1/part3 questions that have been recorded.
  // Tracked explicitly so the navigator chip coloring stays correct for questions
  // 1..N-1 even when the single audioBlobs slot has been overwritten by a later recording.
  const getCompletedPart1Ids = () => recordedPart1Ids;
  const getCompletedPart3Ids = () => recordedPart3Ids;

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const phaseKey = activeTab; // 'part1' | 'part2' | 'part3' — derived from activeTab, not phase
        if (phaseKey) setAudioBlobs((prev) => ({ ...prev, [phaseKey]: blob }));
        if (phaseKey === 'part1') {
          setRecordedPart1Ids((prev) => (prev.includes(currentPart1Idx) ? prev : [...prev, currentPart1Idx]));
        }
        if (phaseKey === 'part3') {
          setRecordedPart3Ids((prev) => (prev.includes(currentPart3Idx) ? prev : [...prev, currentPart3Idx]));
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecording(true);
      setRecSeconds(0);
    } catch (e) {
      console.error('mic error', e);
      toast.error('Không thể truy cập microphone. Vui lòng cho phép trong trình duyệt.');
    }
  }, [activeTab, currentPart1Idx, currentPart3Idx]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  // Phase timers
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (phase === 'cuecard-prep') {
      setPrepSeconds(60);
      intervalRef.current = setInterval(() => {
        setPrepSeconds((s) => {
          if (s <= 1) {
            setPhase('cuecard-talk');
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (recording) {
      intervalRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, recording]);

  // Upload audio blob when stops
  useEffect(() => {
    const phaseKey = activeTab; // 'part1' | 'part2' | 'part3' — derived from activeTab, not phase
    if (!phaseKey || !testResultId) return;
    const blob = audioBlobs[phaseKey];
    if (!blob) return;
    const taskId = phaseKey === 'part1' ? parts[0]?.id : phaseKey === 'part2' ? parts[1]?.id : parts[2]?.id;
    const questionId = phaseKey === 'part1' ? part1Questions[currentPart1Idx]?.id : phaseKey === 'part3' ? part3Questions[currentPart3Idx]?.id : null;
    const formData = new FormData();
    formData.append('audio', blob, `${phaseKey}.webm`);
    formData.append('idTestResult', testResultId);
    if (taskId) formData.append('idSpeakingTask', taskId);
    if (questionId) formData.append('idQuestion', questionId);
    userSpeakingSubmission(formData).catch((e) => {
      console.error('upload speaking failed', e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlobs]);

  const handleSubmit = async () => {
    if (submitting) return false;
    setSubmitting(true);
    try {
      // ensure all blobs uploaded
      for (const [key, blob] of Object.entries(audioBlobs)) {
        if (!blob) continue;
        const taskId = key === 'part1' ? parts[0]?.id : key === 'part2' ? parts[1]?.id : parts[2]?.id;
        const fd = new FormData();
        fd.append('audio', blob, `${key}.webm`);
        fd.append('idTestResult', testResultId);
        if (taskId) fd.append('idSpeakingTask', taskId);
        await userSpeakingSubmission(fd);
      }
      const result = await finishSpeakingTest(testResultId, userId, new FormData());
      toast.success('Nộp bài thành công!');
      try {
        const { notifyTestSubmitted } = await import('@/lib/testEvents');
        notifyTestSubmitted({ skillType: 'SPEAKING' });
      } catch {
        // non-fatal
      }
      if (onSubmitSuccess) onSubmitSuccess(result);
      return true;
    } catch (e) {
      console.error('finish speaking failed', e);
      toast.error('Nộp bài thất bại.');
      setSubmitting(false);
      return false;
    }
  };

  if (!testData) {
    return <div className="min-h-screen flex items-center justify-center text-[#64748b]">Không có dữ liệu.</div>;
  }

  return (
    <div className="min-h-screen w-full bg-[#fafafc] flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b-2 border-[#e6e6ed]">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] shadow-[0_3px_0_#4338ca] flex items-center justify-center text-lg">🦉</div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">IELTS Speaking</div>
              <div className="text-sm font-extrabold text-[#1e1b4b]">{testData?.title || 'Test'}</div>
            </div>
          </div>

          <div className="flex-1 flex justify-center gap-2 overflow-x-auto min-w-[300px]">
            <PartTab
              done={audioBlobs.part1 !== null}
              active={activeTab === 'part1'}
              locked={!isUnlocked('part1')}
              label="Part 1"
              sub="Introduction"
              num="1"
              onClick={() => setActiveTab('part1')}
            />
            <PartTab
              done={audioBlobs.part2 !== null}
              active={activeTab === 'part2'}
              locked={!isUnlocked('part2')}
              label="Part 2"
              sub="Cue card · 2 phút"
              num="2"
              onClick={() => setActiveTab('part2')}
            />
            <PartTab
              done={audioBlobs.part3 !== null}
              active={activeTab === 'part3'}
              locked={!isUnlocked('part3')}
              label="Part 3"
              sub="Discussion"
              num="3"
              onClick={() => setActiveTab('part3')}
            />
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono font-black text-lg border-2 ${phase === 'cuecard-prep' ? 'bg-[#fef3c7] text-[#b45309] border-[#f59e0b] shadow-[0_3px_0_#b45309]' : 'bg-[#eef2ff] text-[#4338ca] border-[#a5b4fc] shadow-[0_3px_0_#a5b4fc]'}`}>
            <span>⏱</span>
            <span>{phase === 'cuecard-prep' ? `0:${String(prepSeconds).padStart(2, '0')}` : recording ? fmt(recSeconds) : fmt(totalSeconds)}</span>
          </div>

          <StackedButton tone="coral" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang nộp...' : 'Kết thúc'}
          </StackedButton>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-6">
        <aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
          <QuestionNavigator
            part={activeTab}
            partLabel={activeTab === 'part1' ? 'Part 1' : activeTab === 'part3' ? 'Part 3' : 'Part 2'}
            badge={activeTab === 'part1' ? 'Câu hỏi cá nhân · 4-5 phút' : activeTab === 'part3' ? 'Câu hỏi abstract · 4-5 phút' : 'Long turn'}
            questions={activeTab === 'part1' ? part1Questions : activeTab === 'part3' ? part3Questions : []}
            currentIdx={activeTab === 'part1' ? currentPart1Idx : activeTab === 'part3' ? currentPart3Idx : 0}
            completedIds={activeTab === 'part1' ? getCompletedPart1Ids() : activeTab === 'part3' ? getCompletedPart3Ids() : []}
            onJump={(idx) => {
              if (activeTab === 'part1') setCurrentPart1Idx(idx);
              if (activeTab === 'part3') setCurrentPart3Idx(idx);
            }}
          />
        </aside>

        <section className="space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'part1' && phase !== 'done' && (
              <motion.div key={`part1-${currentPart1Idx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <QuestionPartScreen
                  partNumber={1}
                  partLabel="Introduction"
                  questions={part1Questions}
                  currentIdx={currentPart1Idx}
                  audioKey="part1"
                  audioBlob={audioBlobs.part1}
                  recording={recording}
                  recSeconds={recSeconds}
                  LiveWave={LiveWave}
                  onToggleRecord={() => (recording ? stopRecording() : startRecording())}
                  onPrev={() => setCurrentPart1Idx((i) => Math.max(0, i - 1))}
                  onNext={() => {
                    if (currentPart1Idx < part1Questions.length - 1) {
                      setCurrentPart1Idx((i) => i + 1);
                    } else {
                      setActiveTab('part2');
                      setPhase('cuecard-prep');
                    }
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'part2' && phase === 'cuecard-prep' && (
              <motion.div key="prep" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-[#fef3c7] to-[#fff1f2] border-b-2 border-[#e6e6ed] flex items-center gap-3">
                  <div className="text-2xl animate-pulse">⏳</div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#b45309]">Đang chuẩn bị</div>
                    <div className="text-sm font-extrabold text-[#1e1b4b]">Bạn có 1 phút để ghi chú &amp; lên ý</div>
                  </div>
                  <div className="ml-auto px-4 py-2 rounded-2xl bg-[#fef3c7] border-2 border-[#f59e0b] shadow-[0_3px_0_#b45309] text-[#b45309] font-mono font-black text-2xl">
                    0:{String(prepSeconds).padStart(2, '0')}
                  </div>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-5">
                  <div className="bg-gradient-to-br from-[#eef2ff] via-white to-[#fff1f2] rounded-3xl p-6 border-2 border-[#a5b4fc] shadow-[0_3px_0_#a5b4fc] relative overflow-hidden">
                    <div className="absolute -top-2 -right-2 px-3 py-1 rounded-bl-2xl bg-[#6366f1] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-[0_2px_0_#4338ca]">Cue Card</div>
                    <h2 className="text-2xl font-black text-[#1e1b4b] mb-4 pr-16" style={{ fontFamily: 'Nunito' }}>{cueCard.topic}</h2>
                    {cueCard.bullets?.length > 0 && (
                      <>
                        <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-3">You should say:</div>
                        <ul className="space-y-2">
                          {cueCard.bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-[#1e1b4b] font-semibold">
                              <div className="w-5 h-5 rounded-md bg-[#6366f1] text-white flex items-center justify-center text-[10px] font-black flex-none mt-0.5">{i + 1}</div>
                              <span className="leading-relaxed">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-1.5"><span>📝</span> Ghi chú nhanh</div>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={9} placeholder="Gạch đầu dòng các ý chính..." className="w-full px-4 py-3 rounded-2xl border-2 border-[#e6e6ed] focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.18)] bg-white font-semibold text-sm leading-relaxed outline-none transition-all resize-none" style={{ fontFamily: 'Plus Jakarta Sans' }} />
                    <div className="text-[10px] text-[#64748b] mt-1.5">💡 Ghi chú sẽ ẩn khi bắt đầu nói</div>
                  </div>
                </div>

                <div className="border-t-2 border-[#e6e6ed] p-4 bg-[#fafafc] flex items-center justify-between">
                  <div className="text-xs font-bold text-[#64748b]">Hệ thống tự động chuyển khi hết thời gian</div>
                  <StackedButton tone="indigo" onClick={() => { setPhase('cuecard-talk'); setPrepSeconds(0); }}>Bắt đầu nói ngay</StackedButton>
                </div>
              </motion.div>
            )}

            {activeTab === 'part2' && phase === 'cuecard-talk' && (
              <motion.div key="talk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-[#eef2ff] to-white border-b-2 border-[#e6e6ed] flex items-center gap-3">
                  <div className="text-2xl">🎙</div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1]">Đang ghi âm · Part 2</div>
                    <div className="text-sm font-extrabold text-[#1e1b4b]">Nói trong 1-2 phút</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="px-3 py-1 rounded-xl bg-[#fff1f2] text-[#e11d48] text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                      <span className={`w-2 h-2 bg-[#fb7185] rounded-full ${recording ? 'animate-pulse' : ''}`} />
                      {recording ? 'REC' : 'READY'}
                    </div>
                    <div className="font-mono font-black text-xl text-[#1e1b4b]">{fmt(recSeconds)}</div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="bg-[#fafafc] rounded-2xl p-5 border-2 border-[#e6e6ed]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-2">Đề bài</div>
                    <div className="text-base font-extrabold text-[#1e1b4b]" style={{ fontFamily: 'Nunito' }}>{cueCard.topic}</div>
                    {cueCard.bullets?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {cueCard.bullets.map((b, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#e6e6ed] text-[#64748b] font-semibold">{b.replace(/\.$/, '')}</span>)}
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-3xl p-6 text-white">
                    <LiveWave recording={recording} />
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs">
                        <div className="opacity-80">Mic input</div>
                        <div className="font-extrabold flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${recording ? 'bg-[#10b981]' : 'bg-[#64748b]'}`} /> {recording ? 'Tốt' : 'Sẵn sàng'}
                        </div>
                      </div>
                      <button onClick={() => (recording ? stopRecording() : startRecording())} className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl active:translate-y-[2px] transition-all ${recording ? 'bg-[#fb7185] text-white shadow-[0_4px_0_#e11d48] active:shadow-[0_2px_0_#e11d48]' : 'bg-white text-[#fb7185] shadow-[0_4px_0_rgba(0,0,0,0.25)] active:shadow-[0_2px_0_rgba(0,0,0,0.25)]'}`}>
                        {recording ? '⏸' : '🎙'}
                      </button>
                      <div className="text-xs text-right">
                        <div className="opacity-80">Duration</div>
                        <div className="font-extrabold font-mono">{fmt(recSeconds)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-[#e6e6ed] p-4 bg-[#fafafc] flex items-center gap-3">
                  <StackedButton tone="ghost" onClick={() => { stopRecording(); setAudioBlobs((p) => ({ ...p, part2: null })); }}>↻ Thu lại</StackedButton>
                  <div className="flex-1 text-center text-xs font-bold text-[#64748b]">
                    {audioBlobs.part2 ? <span className="text-[#10b981]">✓ Đã lưu audio</span> : 'Tối đa 2 phút · Tối thiểu nên nói 1 phút'}
                  </div>
                  <StackedButton tone="indigo" disabled={!audioBlobs.part2} onClick={() => { setActiveTab('part3'); setPhase('part3'); setCurrentPart3Idx(0); }}>Hoàn thành ✓</StackedButton>
                </div>
              </motion.div>
            )}

            {activeTab === 'part3' && phase !== 'done' && (
              <motion.div key={`part3-${currentPart3Idx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <QuestionPartScreen
                  partNumber={3}
                  partLabel="Discussion"
                  questions={part3Questions}
                  currentIdx={currentPart3Idx}
                  audioKey="part3"
                  audioBlob={audioBlobs.part3}
                  recording={recording}
                  recSeconds={recSeconds}
                  LiveWave={LiveWave}
                  onToggleRecord={() => (recording ? stopRecording() : startRecording())}
                  onPrev={() => setCurrentPart3Idx((i) => Math.max(0, i - 1))}
                  onNext={async () => {
                    if (currentPart3Idx < part3Questions.length - 1) {
                      setCurrentPart3Idx((i) => i + 1);
                    } else {
                      // Don't flip to 'done' until submit actually succeeds (handleSubmit toasts on failure).
                      const success = await handleSubmit();
                      if (success) setPhase('done');
                    }
                  }}
                />
              </motion.div>
            )}

            {phase === 'done' && (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-8 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-black text-[#1e1b4b] mb-2" style={{ fontFamily: 'Nunito' }}>Hoàn thành!</h2>
                <p className="text-sm text-[#64748b] mb-4">Đang chờ AI chấm điểm. Bạn có thể xem kết quả trong trang review.</p>
                <div className="text-xs text-[#94a3b8]">Đã tải lên: {Object.values(audioBlobs).filter(Boolean).length}/3 phần</div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Sau khi nộp, điểm AI sẽ hiển thị ở trang kết quả.</div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default IELTSSpeakingTestScreen;
