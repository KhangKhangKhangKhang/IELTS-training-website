import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle } from "lucide-react";

// --- SUB-COMPONENT: Dòng Matching Riêng Biệt ---
const MatchingRow = ({
  question,
  options,
  userAnswer,
  onAnswerChange,
  isReviewMode,
}) => {
  // Local state cho từng dòng
  const [localAnswer, setLocalAnswer] = useState(userAnswer);

  useEffect(() => {
    setLocalAnswer(userAnswer);
  }, [userAnswer]);

  const handleValueChange = (val) => {
    setLocalAnswer(val);
    onAnswerChange(question.question_id, val);
  };

  const correctOptionId =
    question.correct_answers?.[0]?.answer_text ||
    question.correct_answers?.[0]?.answer_id;

  const isCorrect = isReviewMode && localAnswer === correctOptionId;

  // Style logic
  let containerClass = "p-4 border rounded-lg transition-colors ";
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

  let triggerClass = "w-full min-w-[180px] bg-white ";
  if (isReviewMode) {
    if (isCorrect) triggerClass += "border-green-500 text-green-900";
    else triggerClass += "border-red-500 text-red-900";
  } else {
    triggerClass += "border-gray-300 focus:ring-blue-500";
  }

  return (
    <div className={containerClass}>
      {/* Header */}
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

      {/* Select Box */}
      <div className="pl-9">
        <Select
          disabled={isReviewMode}
          value={localAnswer || ""}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Chọn đáp án phù hợp..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.question_id} value={option.question_id}>
                <span className="font-bold mr-2">
                  {option.question_number || "•"}
                </span>
                {option.question_text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Footer Correct Answer */}
      {isReviewMode && !isCorrect && (
        <div className="mt-3 ml-9 text-sm text-green-700 font-semibold p-2 bg-green-100/50 rounded inline-block border border-green-200">
          Đáp án đúng:{" "}
          <b>
            {options.find((o) => o.question_id === correctOptionId)
              ?.question_text || correctOptionId}
          </b>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
const RenderMatching = ({
  group,
  onAnswerChange,
  userAnswers, // Object chứa toàn bộ đáp án
  isReviewMode,
}) => {
  const questions = group.questions.filter((q) => q.is_question !== false);
  const options = group.questions.filter((q) => q.is_question === false);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">{group.title}</h3>
      <p className="mb-4 text-sm text-gray-500 italic border-l-4 border-gray-300 pl-3">
        {group.instruction}
      </p>

      <div className="flex flex-col gap-4">
        {questions.map((question) => (
          <MatchingRow
            key={question.question_id}
            question={question}
            options={options}
            userAnswer={userAnswers[question.question_id]} // Truyền đáp án cụ thể
            onAnswerChange={onAnswerChange}
            isReviewMode={isReviewMode}
          />
        ))}
      </div>

      {options.length > 0 && (
        <div className="mt-6 p-4 border rounded-md bg-white shadow-sm">
          <h4 className="font-semibold mb-2 text-gray-700 border-b pb-1">
            Danh sách lựa chọn:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {options.map((option) => (
              <div
                key={option.question_id}
                className="text-sm p-2 bg-gray-50 rounded"
              >
                <span className="font-bold text-blue-600 mr-2">
                  {option.question_number || "•"}
                </span>
                {option.question_text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RenderMatching;
