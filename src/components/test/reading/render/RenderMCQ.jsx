import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";

const RenderMCQ = ({ question, onAnswerChange, userAnswer, isReviewMode }) => {
  const correctAnswerObj = question.correct_answers?.[0];
  const correctAnswerKey = correctAnswerObj?.matching_key;
  const isCorrect = isReviewMode && userAnswer === correctAnswerKey;

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

      <RadioGroup
        disabled={isReviewMode}
        value={userAnswer}
        onValueChange={(val) => {
          // LOGIC MỚI: Tìm text tương ứng
          const selectedAns = question.answers.find(
            (a) => a.matching_key === val
          );
          onAnswerChange(question.question_id, val, selectedAns?.answer_text);
        }}
        className="space-y-2"
      >
        {question.answers.map((answer) => {
          let itemClass =
            "flex items-center space-x-3 p-2 rounded border border-transparent transition-all";
          if (isReviewMode) {
            if (answer.matching_key === correctAnswerKey) {
              itemClass +=
                " bg-green-100 border-green-300 ring-1 ring-green-400 font-medium";
            } else if (
              answer.matching_key === userAnswer &&
              userAnswer !== correctAnswerKey
            ) {
              itemClass += " bg-red-100 border-red-300 opacity-80";
            } else {
              itemClass += " opacity-50";
            }
          } else {
            itemClass += " hover:bg-white hover:shadow-sm cursor-pointer";
            if (userAnswer === answer.matching_key)
              itemClass += " bg-blue-50 border-blue-200";
          }

          return (
            <div key={answer.answer_id} className={itemClass}>
              <RadioGroupItem
                value={answer.matching_key}
                id={answer.answer_id}
                className="text-blue-600"
              />
              <Label
                htmlFor={answer.answer_id}
                className="cursor-pointer w-full text-sm flex gap-2"
              >
                <span className="font-bold min-w-[20px] text-gray-700">
                  {answer.matching_key}.
                </span>
                <span>{answer.answer_text}</span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {isReviewMode && !isCorrect && (
        <div className="mt-3 text-sm text-green-700 font-semibold pl-8 bg-green-50 p-2 rounded border border-green-200 inline-block">
          Correct Answer: {correctAnswerKey} ({correctAnswerObj?.answer_text})
        </div>
      )}
    </div>
  );
};

export default RenderMCQ;
