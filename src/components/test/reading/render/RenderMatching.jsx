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
      <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
        <h4 className="font-bold text-blue-800 mb-3 text-sm uppercase">
          Danh sách lựa chọn:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {optionsPool.map((opt, idx) => (
            <div
              key={idx}
              className="flex gap-2 text-sm bg-white p-2 rounded shadow-sm border"
            >
              <span className="font-bold text-blue-600 min-w-[20px]">
                {opt.key}.
              </span>
              <span className="text-gray-700">{opt.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {group.questions.map((q) => {
          const userAnswerKey = userAnswers[q.question_id];
          const correctAnswerKey = q.correct_answers?.[0]?.matching_key;
          const isCorrect = isReviewMode && userAnswerKey === correctAnswerKey;

          let containerClass =
            "flex flex-col md:flex-row gap-4 p-4 border rounded-lg transition-colors items-start md:items-center ";
          if (isReviewMode) {
            containerClass += isCorrect
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200";
          } else {
            containerClass += "bg-white hover:border-blue-300";
          }

          return (
            <div key={q.question_id} className={containerClass}>
              <div className="flex-1 flex gap-3">
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white shadow-sm shrink-0 ${
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
                  className="text-gray-800 font-medium pt-0.5"
                  dangerouslySetInnerHTML={{ __html: q.question_text }}
                />
              </div>

              <div className="w-full md:w-[200px] shrink-0">
                <Select
                  disabled={isReviewMode}
                  value={userAnswerKey || ""}
                  onValueChange={(val) => {
                    // LOGIC MỚI: Tìm text tương ứng với Key vừa chọn
                    const selectedOpt = optionsPool.find((o) => o.key === val);
                    onAnswerChange(q.question_id, val, selectedOpt?.text);
                  }}
                >
                  <SelectTrigger className="bg-white border-gray-300 h-10">
                    <SelectValue placeholder="Chọn đáp án..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50 shadow-xl max-h-[300px]">
                    {optionsPool.map((opt) => (
                      <SelectItem
                        key={opt.key}
                        value={opt.key}
                        className="cursor-pointer"
                      >
                        <span className="font-bold text-blue-600 mr-2">
                          {opt.key}
                        </span>
                        <span className="text-gray-600 truncate max-w-[150px] inline-block align-bottom">
                          {opt.text.length > 20
                            ? opt.text.substring(0, 20) + "..."
                            : opt.text}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isReviewMode && !isCorrect && (
                  <div className="text-xs text-green-700 font-bold mt-1 ml-1">
                    Đúng: {correctAnswerKey}
                  </div>
                )}
              </div>

              {isReviewMode && (
                <div className="shrink-0">
                  {isCorrect ? (
                    <CheckCircle2 className="text-green-600 w-6 h-6" />
                  ) : (
                    <XCircle className="text-red-500 w-6 h-6" />
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
