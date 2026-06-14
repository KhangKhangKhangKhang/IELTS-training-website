// Shared layout for Part 1 and Part 3 of the speaking test.
// Renders: header (label + REC pill) → question heading → dark mic card (LiveWave + mic + timer) → footer nav (← prev / status / next →).
// The mic card and LiveWave come from the parent (it owns MediaRecorder state).
// This component is presentational except for click handlers on the prev/next buttons.

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const QuestionPartScreen = ({
  partNumber,        // 1 | 3
  partLabel,         // 'Introduction' | 'Discussion'
  questions,         // [{ id, question }]
  currentIdx,
  audioKey,          // 'part1' | 'part3'
  audioBlob,         // Blob | null
  recording,
  recSeconds,
  LiveWave,          // React component: ({ recording }) => JSX
  onToggleRecord,    // () => void
  onPrev,
  onNext,
  onJump,            // (idx) => void — used by parent for QuestionNavigator integration; not invoked here
}) => {
  const total = questions.length;
  const q = questions[currentIdx];
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === total - 1;
  const lastLabel = isLast ? (partNumber === 1 ? 'Qua Part 2 →' : 'Nộp bài ✓') : 'Câu tiếp →';

  return (
    <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1]">
          Part {partNumber} · {partLabel} · Câu {currentIdx + 1}/{total}
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#fff1f2] text-[#e11d48] text-xs font-extrabold uppercase tracking-wide">
          <span className={`w-2 h-2 bg-[#fb7185] rounded-full ${recording ? 'animate-pulse' : ''}`} />
          {recording ? 'REC' : 'READY'}
        </div>
      </div>
      <h2 className="text-2xl font-black text-[#1e1b4b] mb-5 leading-tight" style={{ fontFamily: 'Nunito' }}>
        {q?.question}
      </h2>

      <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-3xl p-6 text-white">
        <LiveWave recording={recording} />
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs">
            <div className="opacity-80">Mic input</div>
            <div className="font-extrabold flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${recording ? 'bg-[#10b981]' : 'bg-[#64748b]'}`} />
              {recording ? 'Đang ghi' : 'Sẵn sàng'}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleRecord}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl active:translate-y-[2px] transition-all ${
              recording
                ? 'bg-[#fb7185] text-white shadow-[0_4px_0_#e11d48] active:shadow-[0_2px_0_#e11d48]'
                : 'bg-white text-[#fb7185] shadow-[0_4px_0_rgba(0,0,0,0.25)] active:shadow-[0_2px_0_rgba(0,0,0,0.25)]'
            }`}
          >
            {recording ? '⏸' : '🎙'}
          </button>
          <div className="text-xs text-right">
            <div className="opacity-80">Duration</div>
            <div className="font-extrabold font-mono">{fmt(recSeconds)}</div>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-[#e6e6ed] p-4 bg-[#fafafc] flex items-center gap-3 mt-4 -mx-6 -mb-6 rounded-b-3xl">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className="px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide rounded-2xl bg-white text-[#6366f1] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#6366f1]"
        >
          ← Câu trước
        </button>
        <div className="flex-1 text-center text-xs font-bold text-[#64748b]">
          {audioBlob ? <span className="text-[#10b981]">✓ Đã ghi âm</span> : 'Bấm mic để trả lời'}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!audioBlob}
          className="px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide rounded-2xl bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
        >
          {lastLabel}
        </button>
      </div>
    </div>
  );
};

export default QuestionPartScreen;
