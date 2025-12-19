import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";

// --- SUB-COMPONENT: Ô Input nhỏ trong đoạn văn (Cho mode Summary) ---
const InlineInput = ({
  question,
  userAnswer,
  onAnswerChange,
  isReviewMode,
}) => {
  // 1. Thêm Local State để UI phản hồi ngay lập tức khi gõ
  const [localValue, setLocalValue] = useState(userAnswer || "");

  // 2. Sync với props khi có thay đổi từ bên ngoài (hoặc load lại trang)
  useEffect(() => {
    setLocalValue(userAnswer || "");
  }, [userAnswer]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val); // Cập nhật UI ngay
    onAnswerChange(question.question_id, val); // Gửi dữ liệu lên cha
  };

  const correctAnswerText = question.correct_answers?.[0]?.answer_text;
  const isCorrect =
    isReviewMode &&
    localValue?.trim().toLowerCase() ===
      correctAnswerText?.trim().toLowerCase();

  let inputClass =
    "inline-block w-[120px] mx-1 h-8 text-sm transition-all border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 px-1 text-center ";

  if (isReviewMode) {
    inputClass += isCorrect
      ? "border-green-500 bg-green-50 text-green-700 font-bold"
      : "border-red-500 bg-red-50 text-red-700 font-medium";
  } else {
    inputClass +=
      "border-gray-400 bg-gray-50 focus:border-blue-600 focus:bg-white";
  }

  return (
    <span className="inline-flex flex-col align-middle mx-1 relative group">
      <span className="relative">
        <Input
          disabled={isReviewMode}
          value={localValue} // Bind vào local state
          onChange={handleChange}
          className={inputClass}
          placeholder={`(${question.question_number})`}
        />
        {isReviewMode && (
          <span className="absolute -right-5 top-1">
            {isCorrect ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </span>
        )}
      </span>
      {isReviewMode && !isCorrect && (
        <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-green-700 text-white text-xs rounded whitespace-nowrap z-50 shadow-lg">
          Đúng: {correctAnswerText}
        </span>
      )}
    </span>
  );
};

// --- SUB-COMPONENT: Câu hỏi lẻ thông thường (Cho mode Sentence) ---
const SentenceItem = ({
  question,
  userAnswer,
  onAnswerChange,
  isReviewMode,
}) => {
  const [localAnswer, setLocalAnswer] = useState(userAnswer || "");

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

  let containerClass = "mb-4 p-4 border rounded-lg transition-colors ";
  if (isReviewMode) {
    containerClass += isCorrect
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  } else {
    containerClass += "bg-slate-50 border-gray-200 hover:border-blue-300";
  }

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 w-full">
          <span
            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white shadow-sm shrink-0 ${
              isReviewMode
                ? isCorrect
                  ? "bg-green-500"
                  : "bg-red-500"
                : "bg-blue-600"
            }`}
          >
            {question.question_number}
          </span>
          <div className="flex-1">
            <div
              className="font-medium text-gray-800 pt-0.5 mb-2"
              dangerouslySetInnerHTML={{ __html: question.question_text }}
            />
            <Input
              disabled={isReviewMode}
              value={localAnswer}
              onChange={handleChange}
              placeholder="Type your answer..."
              className={`bg-white border-gray-300 ${
                isReviewMode && !isCorrect ? "text-red-500 border-red-300" : ""
              } ${
                isReviewMode && isCorrect
                  ? "text-green-700 border-green-300"
                  : ""
              }`}
            />
          </div>
        </div>
        {isReviewMode &&
          (isCorrect ? (
            <CheckCircle2 className="text-green-600 w-5 h-5 ml-2" />
          ) : (
            <XCircle className="text-red-500 w-5 h-5 ml-2" />
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

// --- MAIN COMPONENT ---
const RenderFillBlank = ({
  questions,
  userAnswers = {},
  onAnswerChange,
  isReviewMode,
}) => {
  // 1. Kiểm tra xem có phải dạng Summary không
  const isSummaryMode = () => {
    if (!questions || questions.length <= 1) return false;
    const firstContent = questions[0].question_text?.trim();
    if (!firstContent) return false;
    return questions.every((q) => q.question_text?.trim() === firstContent);
  };

  // --- RENDER DẠNG SUMMARY ---
  if (isSummaryMode()) {
    const summaryContent = questions[0]?.question_text || "";

    // Tách chuỗi theo pattern [số], ví dụ [4], [5]
    const parts = summaryContent.split(/\[\s*(\d+)\s*\]/g);

    return (
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm leading-8 text-gray-800 text-base">
        {parts.map((part, index) => {
          // Phần tử lẻ là số thứ tự câu hỏi
          if (index % 2 === 1) {
            const questionNum = parseInt(part);
            const question = questions.find(
              (q) => q.question_number === questionNum
            );

            if (question) {
              return (
                <InlineInput
                  key={question.question_id}
                  question={question}
                  userAnswer={userAnswers[question.question_id]}
                  onAnswerChange={onAnswerChange}
                  isReviewMode={isReviewMode}
                />
              );
            }
            return (
              <span key={index} className="text-red-500 font-bold">
                [{part}]
              </span>
            );
          }
          // Phần tử chẵn là text
          return (
            <span key={index} dangerouslySetInnerHTML={{ __html: part }} />
          );
        })}
      </div>
    );
  }

  // --- RENDER DẠNG CÂU LẺ ---
  return (
    <div>
      {questions.map((q) => (
        <SentenceItem
          key={q.question_id}
          question={q}
          userAnswer={userAnswers[q.question_id]}
          onAnswerChange={onAnswerChange}
          isReviewMode={isReviewMode}
        />
      ))}
    </div>
  );
};

export default RenderFillBlank;
