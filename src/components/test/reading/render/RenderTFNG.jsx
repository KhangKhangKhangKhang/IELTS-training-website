import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const RenderTFNG = ({ question, onAnswerChange }) => {
  const options = ["True", "False", "Not Given"];

  return (
    <div className="mb-4 p-4 border rounded-md bg-slate-50">
      <p className="font-semibold mb-2">{`Question ${question.question_number}`}</p>
      <p className="mb-2">{question.question_text}</p>
      <RadioGroup
        onValueChange={(value) => onAnswerChange(question.question_id, value)}
      >
        {options.map((option) => (
          <div key={option} className="flex items-center  space-x-2">
            <RadioGroupItem
              className=""
              value={option}
              id={`${question.question_id}-${option}`}
            />
            <Label htmlFor={`${question.question_id}-${option}`}>
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default RenderTFNG;
