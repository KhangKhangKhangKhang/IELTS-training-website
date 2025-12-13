import React, { useState } from "react";
import { Card, Tag } from "antd";

const RenderLabeling = ({ question, onAnswerChange }) => {
  const labels = (question.answers || []).map(
    (a) => a.answer_text || a.matching_value || a.matching_key || a.answer_id
  );
  const [selected, setSelected] = useState(null);

  const handleSelect = (label) => {
    const val = label;
    setSelected(val);
    if (typeof onAnswerChange === "function")
      onAnswerChange(question.question_id, val);
  };

  return (
    <Card className="mb-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-14 text-sm font-medium text-gray-700">
          {question.question_number}
        </div>
        <div className="flex-1">
          {question.question_text && (
            <div
              className="mb-3 text-gray-800"
              dangerouslySetInnerHTML={{ __html: question.question_text }}
            />
          )}

          <div className="flex flex-wrap gap-2">
            {labels.length > 0 ? (
              labels.map((lab, idx) => (
                <Tag
                  key={idx}
                  onClick={() => handleSelect(lab)}
                  color={selected === lab ? "blue" : "default"}
                  className="cursor-pointer px-3 py-1 text-sm"
                >
                  {lab}
                </Tag>
              ))
            ) : (
              <div className="text-sm text-gray-400 italic">Không có nhãn</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RenderLabeling;
