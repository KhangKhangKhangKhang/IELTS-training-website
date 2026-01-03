import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle } from "lucide-react";

const RenderMatching = ({
  group,
  userAnswers = {},
  onAnswerChange,
  isReviewMode,
}) => {
  // 1. Tạo danh sách tùy chọn (Options)
  const optionsPool = React.useMemo(() => {
    if (!group?.questions || group.questions.length === 0) return [];
    const firstQ = group.questions[0];
    const pool = (firstQ.answers || []).map((ans) => ({
      key: ans.matching_key,
      text: ans.answer_text,
    }));
    return pool.sort((a, b) => a.key.localeCompare(b.key));
  }, [group]);

  return (
    <div className="space-y-6">
      {/* Box hiển thị danh sách Options */}
      <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
        <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-3 text-sm uppercase">
          Danh sách lựa chọn:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {optionsPool.map((opt, idx) => (
            <div
              key={idx}
              className="flex gap-2 text-sm bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[20px]">
                {opt.key}.
              </span>
              <span className="text-slate-700 dark:text-slate-300">{opt.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="space-y-4">
        {group.questions.map((q) => {
          // --- FIX QUAN TRỌNG NHẤT Ở ĐÂY ---
          // Lấy dữ liệu thô từ props
          const rawAnswer = userAnswers[q.question_id];

          // Kiểm tra: Nếu là Object -> lấy .value, Nếu là String -> lấy chính nó
          const userAnswerKey =
            typeof rawAnswer === "object" && rawAnswer !== null
              ? rawAnswer.value
              : rawAnswer;
          // --- HẾT FIX ---

          const correctAnswerKey = q.correct_answers?.[0]?.matching_key;
          // So sánh thì ép về string cho an toàn
          const isCorrect =
            isReviewMode && String(userAnswerKey) === String(correctAnswerKey);

          let containerClass =
            "flex flex-col md:flex-row gap-4 p-4 border rounded-xl transition-all duration-200 items-start md:items-center ";
          if (isReviewMode) {
            containerClass += isCorrect
              ? "bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
          } else {
            containerClass += "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600";
          }

          return (
            <div key={q.question_id} className={containerClass}>
              {/* Nội dung câu hỏi */}
              <div className="flex-1 flex gap-3">
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white shadow-sm shrink-0 ${
                    isReviewMode
                      ? isCorrect
                        ? "bg-green-500"
                        : "bg-red-500"
                      : "bg-blue-600"
                  }`}
                >
                  {q.question_number}
                </span>
                <div
                  className="text-slate-800 dark:text-slate-200 font-medium pt-0.5"
                  dangerouslySetInnerHTML={{ __html: q.question_text }}
                />
              </div>

              {/* Dropdown Select */}
              <div className="w-full md:w-[200px] shrink-0">
                <Select
                  disabled={isReviewMode}
                  // Ép kiểu String để Select hiểu được giá trị
                  value={userAnswerKey ? String(userAnswerKey) : ""}
                  onValueChange={(val) => {
                    const selectedOpt = optionsPool.find((o) => o.key === val);
                    onAnswerChange(q.question_id, val, selectedOpt?.text);
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 h-10 text-slate-800 dark:text-white">
                    <SelectValue placeholder="Chọn đáp án..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 z-50 shadow-xl max-h-[300px] border-slate-200 dark:border-slate-500">
                    {optionsPool.map((opt) => (
                      <SelectItem
                        key={opt.key}
                        value={opt.key} // Value của Item là String (A, B, C...)
                        className="cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/30"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-600 dark:text-blue-400 w-5">
                            {opt.key}
                          </span>
                          <span
                            className="text-slate-600 dark:text-slate-300 truncate max-w-[140px]"
                            title={opt.text}
                          >
                            {opt.text}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Hiển thị đáp án đúng khi Review */}
                {isReviewMode && !isCorrect && (
                  <div className="text-xs text-green-700 dark:text-green-400 font-bold mt-1 ml-1">
                    Đúng: {correctAnswerKey}
                  </div>
                )}
              </div>

              {/* Icon Check/X */}
              {isReviewMode && (
                <div className="shrink-0">
                  {isCorrect ? (
                    <CheckCircle2 className="text-green-600 dark:text-green-400 w-6 h-6" />
                  ) : (
                    <XCircle className="text-red-500 dark:text-red-400 w-6 h-6" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RenderMatching;
