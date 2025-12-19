import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle } from "lucide-react";

const RenderTFNG = ({
  question,
  onAnswerChange,
  userAnswer,
  isReviewMode,
  resultIsCorrect, // <--- THÊM PROP NÀY
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

  const options = ["TRUE", "FALSE", "NOT GIVEN"];
  const correctAnswerText = question.correct_answers?.[0]?.answer_text;

  // --- LOGIC MỚI: Dùng kết quả chính xác từ API ---
  const isCorrect = isReviewMode && resultIsCorrect === true;

  // Container Class
  const containerClass = `mb-6 p-5 border rounded-xl transition-all duration-200 shadow-sm ${
    isReviewMode
      ? isCorrect
        ? "bg-green-50/50 border-green-200"
        : "bg-red-50/50 border-red-200"
      : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md"
  }`;

  // Select Trigger Class (Ô hiển thị giá trị đã chọn)
  let triggerClass = "w-full h-10 transition-all font-medium ";
  if (isReviewMode) {
    triggerClass += isCorrect
      ? "bg-green-100 border-green-500 text-green-700 disabled:opacity-100"
      : "bg-red-100 border-red-500 text-red-700 disabled:opacity-100";
  } else {
    triggerClass +=
      "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white";
  }

  // Badge hiển thị số câu hỏi
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

      <div className="pl-10 max-w-[200px]">
        <Select
          disabled={isReviewMode}
          value={localAnswer || ""}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>

          {/* fix lỗi trong suốt: bg-white và shadow-xl */}
          <SelectContent className="bg-white border border-slate-200 shadow-xl z-50">
            {options.map((opt) => (
              <SelectItem
                key={opt}
                value={opt}
                className="focus:bg-blue-50 focus:text-blue-700 cursor-pointer py-2"
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
          <span className="px-3 py-1 bg-green-100 text-green-700 font-bold rounded border border-green-200">
            {correctAnswerText}
          </span>
        </div>
      )}
    </div>
  );
};

export default RenderTFNG;
