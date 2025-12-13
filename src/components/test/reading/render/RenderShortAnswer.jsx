import React from 'react';
import { Input } from '@/components/ui/input';

const RenderShortAnswer = ({ question, onAnswerChange }) => {
  return (
    <div className="mb-4 p-4 border rounded-md bg-slate-50">
      <p className="font-semibold mb-2">{`Question ${question.question_number}`}</p>
      <p className="mb-2">{question.question_text}</p>
      <Input
        onChange={(e) => onAnswerChange(question.question_id, e.target.value)}
        placeholder="Your answer"
      />
    </div>
  );
};

export default RenderShortAnswer;