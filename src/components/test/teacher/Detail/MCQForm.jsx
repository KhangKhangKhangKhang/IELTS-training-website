// src/components/test/teacher/shared/MCQForm.jsx
import React, { useState } from "react";
import { Button, Input, Checkbox, message } from "antd";
// import { createQuestionAPI, createOptionsAPI } from "@/services/apiTest";

const MCQForm = ({ idGroup, groupData, questionNumberOffset = 0 }) => {
  const [questions, setQuestions] = useState([
    { content: "", options: [{ text: "", correct: false }] },
  ]);
  const [saving, setSaving] = useState(false);

  const canAddQuestion = questions.length < groupData.quantity;

  const handleAddQuestion = () => {
    if (canAddQuestion) {
      setQuestions([
        ...questions,
        { content: "", options: [{ text: "", correct: false }] },
      ]);
    } else {
      message.warning(
        `You can only add ${groupData.quantity} questions to this group.`
      );
    }
  };

  const handleAddOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].options.push({ text: "", correct: false });
    setQuestions(updated);
  };

  const handleChangeQuestion = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].content = value;
    setQuestions(updated);
  };

  const handleChangeOption = (qIndex, oIndex, field, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex][field] = value;
    setQuestions(updated);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      for (const q of questions) {
        if (!q.content.trim()) continue;
        // const res = await createQuestionAPI({ idGroup, content: q.content });
        const res = { idQuestion: Math.random().toString(36).substring(2, 8) }; // mock
        const idQuestion = res.idQuestion;

        for (const opt of q.options) {
          if (!opt.text.trim()) continue;
          // await createOptionsAPI(idQuestion, { content: opt.text, correct: opt.correct });
        }
      }
      message.success("Đã lưu tất cả câu hỏi MCQ!");
    } catch (err) {
      console.error(err);
      message.error("Lưu câu hỏi thất bại");
    } finally {
      setSaving(false);
    }
  };

  const startQuestionNumber = questionNumberOffset + 1;
  const endQuestionNumber = questionNumberOffset + groupData.quantity;

  return (
    <div className="space-y-6">
      <div className="p-2 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
        <p className="font-semibold text-blue-800">
          Questions {startQuestionNumber} - {endQuestionNumber}
        </p>
        <p className="text-sm text-blue-700">
          This group should have {groupData.quantity} questions. You have added{" "}
          {questions.length}.
        </p>
      </div>
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="border p-4 rounded bg-white shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">
              Câu {questionNumberOffset + qIndex + 1}
            </span>
            <Button size="small" onClick={() => handleAddOption(qIndex)}>
              + Thêm lựa chọn
            </Button>
          </div>

          <Input.TextArea
            rows={2}
            placeholder="Nhập nội dung câu hỏi..."
            value={q.content}
            onChange={(e) => handleChangeQuestion(qIndex, e.target.value)}
          />

          <div className="mt-3 space-y-2">
            {q.options.map((opt, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <Checkbox
                  checked={opt.correct}
                  onChange={(e) =>
                    handleChangeOption(
                      qIndex,
                      oIndex,
                      "correct",
                      e.target.checked
                    )
                  }
                />
                <Input
                  placeholder={`Đáp án ${oIndex + 1}`}
                  value={opt.text}
                  onChange={(e) =>
                    handleChangeOption(qIndex, oIndex, "text", e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <Button onClick={handleAddQuestion} disabled={!canAddQuestion}>
          + Thêm câu hỏi
        </Button>
        <Button type="primary" onClick={handleSaveAll} loading={saving}>
          Lưu tất cả
        </Button>
      </div>
    </div>
  );
};

export default MCQForm;
