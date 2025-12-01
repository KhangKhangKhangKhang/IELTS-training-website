import React, { useState, useEffect } from "react";
import { Button, Input, message, Spin } from "antd";
import {
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
  updateAnswerAPI,
} from "@/services/apiTest";

const OtherForm = ({ idGroup }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (idGroup) {
      loadQuestions();
    }
  }, [idGroup]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await getQuestionsByIdGroupAPI(idGroup);
      const group = res?.data?.[0];

      if (!group || !group.question) {
        setQuestions([]);
        return;
      }

      const question = group.question;

      const withAnswers = await Promise.all(
        question.map(async (q) => {
          try {
            const ansRes = await getAnswersByIdQuestionAPI(q.idQuestion);
            const ansData = ansRes?.data?.[0];
            return {
              ...q,
              idAnswer: ansData?.idAnswer || null,
              answer_text: ansData?.answer_text || "",
            };
          } catch (err) {
            return { ...q, idAnswer: null, answer_text: "" };
          }
        })
      );

      setQuestions(withAnswers);
    } catch (err) {
      message.error("Không thể tải câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAnswer = (index, value) => {
    const updated = [...questions];
    updated[index].answer_text = value;
    setQuestions(updated);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      for (const q of questions) {
        if (!q.answer_text) {
          message.warning(`Câu ${q.numberQuestion} chưa có đáp án`);
          continue;
        }
        if (!q.idAnswer) {
          message.error(`Câu ${q.numberQuestion} chưa có idAnswer, không thể lưu.`);
          continue;
        }
        await updateAnswerAPI(q.idAnswer, {
          idQuestion: q.idQuestion,
          answer_text: q.answer_text,
        });
      }
      message.success("Đã lưu thay đổi!");
      await loadQuestions();
    } catch (err) {
      message.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spin tip="Đang tải câu hỏi..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          Chưa có câu hỏi nào trong nhóm này.
        </div>
      ) : (
        questions.map((q, index) => (
          <div key={q.idQuestion} className="border p-4 rounded bg-white">
            <div className="font-semibold mb-2">Câu {q.numberQuestion}</div>
            <Input.TextArea
              rows={2}
              value={q.content}
              readOnly
              style={{ backgroundColor: "#fafafa" }}
            />
            <div className="mt-3">
              <span className="text-sm text-gray-600 mb-1 block">Answer:</span>
              <Input.TextArea
                rows={3}
                placeholder="Enter answer"
                value={q.answer_text}
                onChange={(e) => handleChangeAnswer(index, e.target.value)}
              />
            </div>
          </div>
        ))
      )}
      {questions.length > 0 && (
        <div className="flex justify-end mt-4">
          <Button type="primary" onClick={handleSaveAll} loading={saving}>
            Lưu tất cả đáp án
          </Button>
        </div>
      )}
    </div>
  );
};

export default OtherForm;
