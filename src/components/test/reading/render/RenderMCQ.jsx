import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const RenderMCQ = ({ question, onAnswerChange }) => {
  return (
    <div className="mb-4 p-4 border rounded-md bg-slate-50">
      <p className="font-semibold mb-2">{`Question ${question.question_number}`}</p>
      <p className="mb-2">{question.question_text}</p>
      <RadioGroup
        onValueChange={(value) => onAnswerChange(question.question_id, value)}
      >
        {question.answers.map((answer) => (
          <div key={answer.answer_id} className="flex items-center space-x-2">
            <RadioGroupItem value={answer.answer_id} id={answer.answer_id} />
            <Label htmlFor={answer.answer_id}>{answer.answer_text}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default RenderMCQ;
