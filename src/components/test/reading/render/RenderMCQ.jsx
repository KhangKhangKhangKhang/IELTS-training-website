import React from "react";
import { Checkbox } from "antd"; // [FIX] Sử dụng Antd Checkbox
import { CheckCircle2, XCircle } from "lucide-react";

const RenderMCQ = ({
  question,
  onAnswerChange,
  userAnswer, // String (Single) hoặc Array (Multiple)
  isReviewMode,
  resultIsCorrect,
  isMultiple = false, // [FIX] Nhận prop
}) => {
  const correctAnswerObj = question.correct_answers?.[0];
  const correctAnswerKey = correctAnswerObj?.matching_key;

  // Logic check đúng/sai trong Review Mode
  const isCorrect = isReviewMode && resultIsCorrect === true;

  // --- [FIX] XỬ LÝ CHỌN NHIỀU ---
  const handleCheckboxChange = (key, checked) => {
    let currentAnswers = Array.isArray(userAnswer) ? [...userAnswer] : [];

    if (checked) {
      if (!currentAnswers.includes(key)) currentAnswers.push(key);
    } else {
      currentAnswers = currentAnswers.filter((k) => k !== key);
    }

    // Gửi mảng lên cha
    onAnswerChange(
      question.question_id,
      currentAnswers,
      currentAnswers.join(", ")
    );
  };

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
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <span
            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white shadow-sm ${
              isReviewMode
                ? isCorrect
                  ? "bg-green-500"
                  : "bg-red-500"
                : "bg-blue-600"
            }`}
          >
            {question.question_number}
          </span>
          <div
            className="font-medium text-gray-800"
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

      <div className="space-y-2">
        {question.answers.map((answer) => {
          const key = answer.matching_key;
          let itemClass =
            "flex items-center space-x-3 p-2 rounded border border-transparent transition-all";

          if (isReviewMode) {
            // Logic highlight review
            // Nếu là mảng (Multiple) kiểm tra includes, nếu string (Single) so sánh bằng
            const isSelected = Array.isArray(userAnswer)
              ? userAnswer.includes(key)
              : userAnswer === key;

            if (isSelected && !isCorrect) {
              itemClass += " bg-red-100 border-red-300 opacity-80";
            } else {
              itemClass += " opacity-50";
            }
          } else {
            itemClass += " hover:bg-white hover:shadow-sm cursor-pointer";
            const isSelected = isMultiple
              ? Array.isArray(userAnswer) && userAnswer.includes(key)
              : userAnswer === key;

            if (isSelected) itemClass += " bg-blue-50 border-blue-200";
          }

          return (
            <div key={answer.answer_id} className={itemClass}>
              {isMultiple ? (
                // --- [FIX] RENDER CHECKBOX (MULTIPLE) ---
                <Checkbox
                  disabled={isReviewMode}
                  checked={
                    Array.isArray(userAnswer) && userAnswer.includes(key)
                  }
                  onChange={(e) => handleCheckboxChange(key, e.target.checked)}
                >
                  <span className="font-bold min-w-[20px] text-gray-700 ml-2">
                    {key}.
                  </span>
                  <span className="ml-1">{answer.answer_text}</span>
                </Checkbox>
              ) : (
                // --- [FIX] RENDER RADIO (SINGLE) ---
                <div
                  className="flex items-center w-full"
                  onClick={() =>
                    !isReviewMode &&
                    onAnswerChange(
                      question.question_id,
                      key,
                      answer.answer_text
                    )
                  }
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${
                      userAnswer === key ? "border-blue-600" : "border-gray-400"
                    }`}
                  >
                    {userAnswer === key && (
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <div className="text-sm cursor-pointer flex-1">
                    <span className="font-bold text-gray-700 mr-2">{key}.</span>
                    {answer.answer_text}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isReviewMode && !isCorrect && (
        <div className="mt-3 text-sm text-green-700 font-semibold pl-8 bg-green-50 p-2 rounded border border-green-200 inline-block">
          Correct Answer: {correctAnswerKey} ({correctAnswerObj?.answer_text})
        </div>
      )}
    </div>
  );
};

export default RenderMCQ;
