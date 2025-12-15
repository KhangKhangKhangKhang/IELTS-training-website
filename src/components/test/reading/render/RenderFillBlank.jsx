import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";

const RenderFillBlank = ({
  question,
  onAnswerChange,
  userAnswer,
  isReviewMode,
}) => {
  // 1. Local State
  const [localAnswer, setLocalAnswer] = useState(userAnswer || "");

  // 2. Sync Props
  useEffect(() => {
    setLocalAnswer(userAnswer || "");
  }, [userAnswer]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalAnswer(val); // Gõ tới đâu hiện tới đó ngay
    onAnswerChange(question.question_id, val);
  };

  const correctAnswerText = question.correct_answers?.[0]?.answer_text;
  const isCorrect =
    isReviewMode &&
    localAnswer?.trim().toLowerCase() ===
      correctAnswerText?.trim().toLowerCase();

  // Styles
  let containerClass = "mb-4 p-4 border rounded-lg transition-colors ";
  if (isReviewMode) {
    containerClass += isCorrect
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  } else {
    containerClass += "bg-slate-50 border-gray-200 hover:border-blue-300";
  }

  const badgeClass = `flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white shadow-sm shrink-0 ${
    isReviewMode ? (isCorrect ? "bg-green-500" : "bg-red-500") : "bg-blue-600"
  }`;

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 w-full">
          <span className={badgeClass}>{question.question_number}</span>
          <div className="flex-1">
            <div
              className="font-medium text-gray-800 pt-0.5 mb-2"
              dangerouslySetInnerHTML={{ __html: question.question_text }}
            />
            <Input
              disabled={isReviewMode}
              value={localAnswer} // Bind vào local state
              onChange={handleChange}
              placeholder="Type your answer here..."
              className={`bg-white border-gray-300 ${
                isReviewMode && !isCorrect
                  ? "text-red-500 font-medium border-red-300"
                  : ""
              } ${
                isReviewMode && isCorrect
                  ? "text-green-700 font-medium border-green-300"
                  : ""
              }`}
            />
          </div>
        </div>
        {isReviewMode &&
          (isCorrect ? (
            <CheckCircle2 className="text-green-600 w-5 h-5 shrink-0 ml-2" />
          ) : (
            <XCircle className="text-red-500 w-5 h-5 shrink-0 ml-2" />
          ))}
      </div>

      {isReviewMode && !isCorrect && (
        <div className="mt-2 ml-9 text-sm text-green-700 font-semibold p-2 bg-green-100/50 rounded inline-block border border-green-200">
          Correct Answer: {correctAnswerText || "N/A"}
        </div>
      )}
    </div>
  );
};

export default RenderFillBlank;
