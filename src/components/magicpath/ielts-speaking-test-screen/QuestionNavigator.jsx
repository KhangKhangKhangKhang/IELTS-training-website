// Left aside: list of question chips for the active Part.
// Click a chip to jump to that question.
// Three visual states per chip: done (green ✓), active (indigo border), default (white).
// For Part 2 there are no per-question chips — show a help message instead.

const QuestionNavigator = ({ part, partLabel, badge, questions, currentIdx, completedIds, onJump }) => {
  if (part === 'part2') {
    return (
      <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-2">
          📋 {badge}
        </div>
        <div className="text-xs font-semibold text-[#64748b] leading-relaxed">
          Part 2 là 1 cue card dài 1-2 phút. Không có danh sách câu hỏi riêng lẻ.
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-3">
        📋 Câu hỏi · {partLabel}
      </div>
      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
        {questions.map((q, i) => {
          const isActive = i === currentIdx;
          const isDone = completedIds.includes(i);
          return (
            <button
              key={q.id ?? i}
              type="button"
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onJump?.(i)}
              className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-lg border-2 transition-colors ${
                isActive
                  ? 'bg-[#eef2ff] border-[#6366f1] shadow-[0_2px_0_#4338ca]'
                  : isDone
                  ? 'bg-[#d1fae5] border-[#10b981]/30'
                  : 'bg-[#fafafc] border-transparent hover:border-[#a5b4fc]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded text-white text-[10px] flex items-center justify-center flex-none mt-0.5 font-black ${
                  isDone ? 'bg-[#10b981]' : isActive ? 'bg-[#4338ca]' : 'bg-[#6366f1]'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#1e1b4b] line-clamp-2 leading-snug">
                  {q.question}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionNavigator;
