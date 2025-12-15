import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Check } from "lucide-react";

const RenderLabeling = ({
  question,
  onAnswerChange,
  userAnswer,
  isReviewMode,
}) => {
  const [localSelected, setLocalSelected] = useState(userAnswer);

  useEffect(() => {
    setLocalSelected(userAnswer);
  }, [userAnswer]);

  const labels = (question.answers || []).map(
    (a) => a.answer_text || a.matching_value || a.matching_key || a.answer_id
  );

  const correctText = question.correct_answers?.[0]?.answer_text;
  const isCorrect = isReviewMode && localSelected === correctText;

  const handleSelect = (lab) => {
    if (isReviewMode) return;
    setLocalSelected(lab);
    onAnswerChange(question.question_id, lab);
  };

  // Style Container
  let containerClass = "mb-4 p-4 border rounded-lg transition-colors ";
  if (isReviewMode) {
    containerClass += isCorrect
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  } else {
    containerClass += "bg-slate-50 border-gray-200 hover:border-blue-300";
  }

  // Style Badge
  const badgeClass = `flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white shadow-sm shrink-0 ${
    isReviewMode ? (isCorrect ? "bg-green-500" : "bg-red-500") : "bg-blue-600"
  }`;

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

      {/* Buttons / Chips */}
      <div className="pl-9 flex flex-wrap gap-2">
        {labels.map((lab, idx) => {
          const isSelected = localSelected === lab;

          let btnClass =
            "flex items-center px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-200 shadow-sm ";

          if (isReviewMode) {
            if (lab === correctText) {
              btnClass +=
                "bg-green-600 text-white border-green-600 ring-2 ring-green-200";
            } else if (isSelected && lab !== correctText) {
              btnClass += "bg-red-500 text-white border-red-500 opacity-90";
            } else {
              btnClass +=
                "bg-gray-100 text-gray-400 border-gray-200 opacity-40 cursor-not-allowed";
            }
          } else {
            // Chế độ làm bài
            if (isSelected) {
              btnClass +=
                "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-200 shadow-md transform scale-105";
            } else {
              btnClass +=
                "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isReviewMode}
              className={btnClass}
              onClick={() => handleSelect(lab)}
            >
              {isSelected && !isReviewMode && (
                <Check className="w-4 h-4 mr-2" />
              )}
              {lab}
            </button>
          );
        })}
      </div>

      {isReviewMode && !isCorrect && (
        <div className="mt-3 ml-9 text-sm text-green-700 font-semibold p-2 bg-green-100/50 rounded inline-block border border-green-200">
          Correct Answer: {correctText}
        </div>
      )}
    </div>
  );
};

export default RenderLabeling;
