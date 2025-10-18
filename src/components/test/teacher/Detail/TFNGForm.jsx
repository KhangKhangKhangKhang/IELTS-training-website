// src/components/test/teacher/shared/TFNGForm.jsx
import React, { useState } from "react";
import { Button, Input, Select, message } from "antd";
// import { createQuestionAPI, createAnswerAPI } from "@/services/apiTest";

const { Option } = Select;

const TFNGForm = ({ idGroup }) => {
  const [questions, setQuestions] = useState([
    { content: "", correctAnswer: null },
  ]);
  const [saving, setSaving] = useState(false);

  const handleAddQuestion = () => {
    setQuestions([...questions, { content: "", correctAnswer: null }]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      for (const q of questions) {
        if (!q.content.trim()) continue;
        // const res = await createQuestionAPI({ idGroup, content: q.content });
        const res = { idCauHoi: Math.random().toString(36).substring(2, 8) }; // mock
        const idCauHoi = res.idCauHoi;

        // await createAnswerAPI(idCauHoi, { answerText: q.correctAnswer });
      }
      message.success("Đã lưu câu hỏi TFNG!");
    } catch (err) {
      console.error(err);
      message.error("Lưu câu hỏi thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {questions.map((q, index) => (
        <div key={index} className="border p-4 rounded bg-white shadow-sm">
          <div className="font-semibold mb-2">Câu {index + 1}</div>
          <Input.TextArea
            rows={2}
            placeholder="Nhập nội dung câu hỏi..."
            value={q.content}
            onChange={(e) => handleChange(index, "content", e.target.value)}
          />
          <div className="mt-3">
            <Select
              style={{ width: 200 }}
              placeholder="Chọn đáp án đúng"
              value={q.correctAnswer}
              onChange={(v) => handleChange(index, "correctAnswer", v)}
            >
              <Option value="TRUE">True</Option>
              <Option value="FALSE">False</Option>
              <Option value="NOT GIVEN">Not Given</Option>
            </Select>
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <Button onClick={handleAddQuestion}>+ Thêm câu hỏi</Button>
        <Button type="primary" onClick={handleSaveAll} loading={saving}>
          Lưu tất cả
        </Button>
      </div>
    </div>
  );
};

export default TFNGForm;
