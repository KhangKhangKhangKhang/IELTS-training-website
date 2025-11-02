import React, { useState, useEffect } from "react";
import { Button, Input, Select, message, Spin } from "antd";
import {
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
  updateAnswerAPI,
} from "@/services/apiTest";

const { Option } = Select;

const TFNGForm = ({ idGroup }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (idGroup) {
      loadQuestions();
    }
  }, [idGroup]);

  // ======== LOAD QUESTIONS + ANSWERS ========
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await getQuestionsByIdGroupAPI(idGroup);
      const group = res?.data?.[0];

      if (!group || !group.question) {
        message.info("Không có câu hỏi nào trong nhóm này");
        setQuestions([]);
        return;
      }

      const question = group.question;

      // Lấy đáp án cho từng câu hỏi
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
            console.error("Lỗi load answer cho", q.idQuestion, err);
            return { ...q, idAnswer: null, answer_text: "" };
          }
        })
      );

      setQuestions(withAnswers);
    } catch (err) {
      console.error("Lỗi khi tải câu hỏi:", err);
      message.error("Không thể tải câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  // ======== HANDLE CHANGE ========
  const handleChangeAnswer = (index, value) => {
    const updated = [...questions];
    updated[index].answer_text = value;
    setQuestions(updated);
  };

  // ======== SAVE ALL ========
  const handleSaveAll = async () => {
    console.log("Saving all answers:", questions);
    try {
      setSaving(true);

      for (const [index, q] of questions.entries()) {
        if (!q.answer_text) {
          message.warning(`Câu ${q.numberQuestion} chưa chọn đáp án`);
          continue;
        }

        if (!q.idAnswer) {
          message.error(
            `Câu ${q.numberQuestion} chưa có idAnswer, không thể lưu.`
          );
          continue;
        }

        // Gọi API PATCH để cập nhật câu trả lời
        await updateAnswerAPI(q.idAnswer, {
          idQuestion: q.idQuestion,
          idOption: null,
          answer_text: q.answer_text,
          matching_key: null,
          matching_value: null,
        });
        console.log(`Đã cập nhật câu ${q.numberQuestion}:`, q.answer_text);
      }

      message.success("Đã lưu thay đổi TFNG!");
      await loadQuestions(); // reload lại dữ liệu mới nhất
    } catch (err) {
      console.error(err);
      message.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  // ======== RENDER ========
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
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Câu {q.numberQuestion}</div>
            </div>

            <Input.TextArea
              rows={2}
              value={q.content}
              readOnly
              style={{ backgroundColor: "#fafafa" }}
            />

            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-gray-600">Đáp án hiện tại:</span>
              <Select
                style={{ width: 160 }}
                placeholder="Chọn đáp án"
                value={q.answer_text || undefined}
                onChange={(v) => handleChangeAnswer(index, v)}
              >
                <Option value="TRUE">TRUE</Option>
                <Option value="FALSE">FALSE</Option>
                <Option value="NOT GIVEN">NOT GIVEN</Option>
              </Select>
            </div>
          </div>
        ))
      )}

      {questions.length > 0 && (
        <div className="flex justify-end">
          <Button
            type="primary"
            onClick={handleSaveAll}
            loading={saving}
            className="mt-4"
          >
            Lưu tất cả đáp án
          </Button>
        </div>
      )}
    </div>
  );
};

export default TFNGForm;
