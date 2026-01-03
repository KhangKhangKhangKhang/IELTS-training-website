import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";

const RenderShortAnswer = ({
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
    setLocalAnswer(val);
    onAnswerChange(question.question_id, val);
  };

  const correctAnswerText = question.correct_answers?.[0]?.answer_text;
  const isCorrect =
    isReviewMode &&
    localAnswer?.trim().toLowerCase() ===
      correctAnswerText?.trim().toLowerCase();

  // Styles
  let containerClass = "mb-4 p-4 border rounded-xl transition-all duration-200 ";
  if (isReviewMode) {
    containerClass += isCorrect
      ? "bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      : "bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  } else {
    containerClass += "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md";
  }

  const badgeClass = `flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white shadow-sm shrink-0 ${
    isReviewMode ? (isCorrect ? "bg-green-500" : "bg-red-500") : "bg-blue-600"
  }`;

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 w-full">
          <span className={badgeClass}>{question.question_number}</span>
          <div className="flex-1">
            <div
              className="font-medium text-slate-800 dark:text-slate-200 pt-0.5 mb-2"
              dangerouslySetInnerHTML={{ __html: question.question_text }}
            />
            <Input
              disabled={isReviewMode}
              value={localAnswer} // Bind vào local state
              onChange={handleChange}
              placeholder="Type answer..."
              className={`bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                isReviewMode && !isCorrect
                  ? "text-red-500 dark:text-red-400 font-medium border-red-300 dark:border-red-600"
                  : ""
              }`}
            />
          </div>
        </div>
        {isReviewMode &&
          (isCorrect ? (
            <CheckCircle2 className="text-green-600 dark:text-green-400 w-5 h-5 shrink-0 ml-2" />
          ) : (
            <XCircle className="text-red-500 dark:text-red-400 w-5 h-5 shrink-0 ml-2" />
          ))}
      </div>

      {isReviewMode && !isCorrect && (
        <div className="mt-3 ml-9 text-sm text-green-700 dark:text-green-400 font-semibold p-2.5 bg-green-100/50 dark:bg-green-900/30 rounded-lg inline-block border border-green-200 dark:border-green-700">
          Correct: {correctAnswerText}
        </div>
      )}
    </div>
  );
};

export default RenderShortAnswer;
