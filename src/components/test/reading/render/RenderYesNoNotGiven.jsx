import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle } from "lucide-react";

const RenderYesNoNotGiven = ({
  question,
  onAnswerChange,
  userAnswer,
  isReviewMode,
  resultIsCorrect, // Prop mới nhận từ cha
}) => {
  const [localAnswer, setLocalAnswer] = useState(userAnswer);

  useEffect(() => {
    setLocalAnswer(userAnswer);
  }, [userAnswer]);

  const handleValueChange = (val) => {
    if (isReviewMode) return;
    setLocalAnswer(val);
    onAnswerChange(question.question_id, val);
  };

  const options = ["YES", "NO", "NOT GIVEN"];
  const correctAnswerText = question.correct_answers?.[0]?.answer_text;

  // --- SỬA LOGIC CHECK ĐÚNG SAI ---
  // Nếu là mode Review, dùng kết quả từ API trả về (resultIsCorrect)
  // thay vì tự so sánh string (vì server đã chấm rồi)
  const isCorrect = isReviewMode && resultIsCorrect === true;

  const containerClass = `mb-6 p-5 border rounded-xl transition-all duration-200 shadow-sm ${
    isReviewMode
      ? isCorrect
        ? "bg-green-50/50 border-green-200"
        : "bg-red-50/50 border-red-200"
      : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md"
  }`;

  // ... (Phần render UI giữ nguyên, chỉ thay đổi logic biến isCorrect ở trên)
  // Select Trigger Class
  let triggerClass = "w-full h-10 transition-all font-medium ";
  if (isReviewMode) {
    triggerClass += isCorrect
      ? "bg-green-100 border-green-500 text-green-700 disabled:opacity-100"
      : "bg-red-100 border-red-500 text-red-700 disabled:opacity-100";
  } else {
    triggerClass +=
      "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white";
  }

  const badgeClass = `flex items-center justify-center w-7 h-7 shrink-0 rounded-lg text-xs font-bold text-white shadow-sm ${
    isReviewMode ? (isCorrect ? "bg-green-500" : "bg-red-500") : "bg-blue-600"
  }`;

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <span className={badgeClass}>{question.question_number}</span>
          <div
            className="font-semibold text-slate-800 pt-0.5 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: question.question_text }}
          />
        </div>
        {isReviewMode &&
          (isCorrect ? (
            <CheckCircle2 className="text-green-600 w-6 h-6 shrink-0" />
          ) : (
            <XCircle className="text-red-500 w-6 h-6 shrink-0" />
          ))}
      </div>

      <div className="pl-10 max-w-[220px]">
        <Select
          disabled={isReviewMode}
          value={localAnswer || ""}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Chọn đáp án..." />
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200 shadow-xl z-50">
            {options.map((opt) => (
              <SelectItem
                key={opt}
                value={opt}
                className="focus:bg-blue-50 focus:text-blue-700 cursor-pointer py-2.5"
              >
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isReviewMode && !isCorrect && (
        <div className="mt-4 ml-10 text-sm flex items-center gap-2">
          <span className="text-slate-500">Đáp án đúng:</span>
          <span className="px-3 py-1 bg-green-100 text-green-700 font-bold rounded-md border border-green-200 shadow-sm">
            {correctAnswerText}
          </span>
        </div>
      )}
    </div>
  );
};

export default RenderYesNoNotGiven;
