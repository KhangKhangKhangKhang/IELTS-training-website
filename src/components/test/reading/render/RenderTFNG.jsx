import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle } from "lucide-react";

const RenderTFNG = ({ question, onAnswerChange, userAnswer, isReviewMode }) => {
  // 1. Local State
  const [localAnswer, setLocalAnswer] = useState(userAnswer);

  // 2. Sync Props -> Local
  useEffect(() => {
    setLocalAnswer(userAnswer);
  }, [userAnswer]);

  const handleValueChange = (val) => {
    if (isReviewMode) return;
    setLocalAnswer(val); // Cập nhật UI ngay lập tức
    onAnswerChange(question.question_id, val); // Gửi về cha
  };

  const options = ["TRUE", "FALSE", "NOT GIVEN"];
  const correctAnswerText = question.correct_answers?.[0]?.answer_text;
  const isCorrect =
    isReviewMode &&
    localAnswer?.toUpperCase() === correctAnswerText?.toUpperCase();

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

  let triggerClass = "w-full bg-white transition-all ";
  if (isReviewMode) {
    if (isCorrect) triggerClass += "border-green-500 ring-1 ring-green-500";
    else triggerClass += "border-red-500 ring-1 ring-red-500";
  } else {
    triggerClass += "border-gray-300 focus:ring-blue-500";
  }

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          <span className={badgeClass}>{question.question_number}</span>
          <div
            className="font-medium text-gray-800 pt-0.5"
            dangerouslySetInnerHTML={{ __html: question.question_text }}
          />
        </div>
        {isReviewMode &&
          (isCorrect ? (
            <CheckCircle2 className="text-green-600 w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="text-red-500 w-5 h-5 shrink-0" />
          ))}
      </div>

      <div className="pl-9 max-w-[250px]">
        <Select
          disabled={isReviewMode}
          value={localAnswer || ""}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Chọn đáp án..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isReviewMode && !isCorrect && (
        <div className="mt-3 ml-9 text-sm text-green-700 font-semibold p-2 bg-green-100/50 rounded inline-block border border-green-200">
          Correct Answer: {correctAnswerText}
        </div>
      )}
    </div>
  );
};
export default RenderTFNG;
