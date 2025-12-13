import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const RenderMatching = ({ group, onAnswerChange }) => {
    const questions = group.questions.filter(q => q.is_question);
    const options = group.questions.filter(q => !q.is_question);

  return (
    <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{group.title}</h3>
        <p className="mb-4 italic">{group.instruction}</p>
        <div className="flex flex-col gap-4">
            {questions.map((question) => (
                <div key={question.question_id} className="grid grid-cols-2 gap-4 items-center">
                    <div>
                        <p className="font-semibold">{`Question ${question.question_number}`}</p>
                        <p>{question.question_text}</p>
                    </div>
                    <Select onValueChange={(value) => onAnswerChange(question.question_id, value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem key={option.question_id} value={option.question_id}>
                                    {option.question_text}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ))}
        </div>
        <div className="mt-4 p-4 border rounded-md bg-slate-50">
            <h4 className="font-semibold mb-2">Options</h4>
            <ul className="list-disc pl-5">
                {options.map((option) => (
                    <li key={option.question_id}>{option.question_text}</li>
                ))}
            </ul>
        </div>
    </div>
  );
};

export default RenderMatching;