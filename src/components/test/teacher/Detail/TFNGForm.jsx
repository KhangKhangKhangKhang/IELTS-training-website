import React, { useState, useEffect } from "react";
import { Button, Input, Select, message, List } from "antd";
// import {
//   createQuestionAPI,
//   createAnswerAPI,
//   getQuestionsByGroupAPI,
//   updateQuestionAPI,
// } from "@/services/apiTest";

const { Option } = Select;

const TFNGForm = ({ idGroup, groupData }) => {
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load questions khi component mount hoặc idGroup thay đổi
  useEffect(() => {
    if (idGroup) {
      loadQuestions();
    }
  }, [idGroup]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      // TODO: Gọi API lấy danh sách câu hỏi theo idGroup
      // const res = await getQuestionsByGroupAPI(idGroup);
      // const questionsData = res.data || [];

      // Tạm thời sử dụng dữ liệu từ groupData nếu có
      if (groupData && groupData.questions) {
        setQuestions(groupData.questions);
      } else {
        // Mock data tạm thời dựa trên API response
        const mockQuestions = [
          {
            idCauHoi: "1",
            content: "The kākāpō is a diurnal bird.",
            correctAnswer: "FALSE",
            answers: [{ answerText: "FALSE" }],
          },
          {
            idCauHoi: "2",
            content: "Này là mockdata tỉnh lại đi.",
            correctAnswer: "FALSE",
            answers: [{ answerText: "FALSE" }],
          },
        ];
        setQuestions(mockQuestions);
      }
    } catch (err) {
      console.error("Lỗi khi tải câu hỏi:", err);
      message.error("Không thể tải câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        idCauHoi: `temp-${Date.now()}`,
        content: "",
        correctAnswer: null,
        isNew: true,
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      for (const [index, q] of questions.entries()) {
        if (!q.content.trim()) {
          message.warning(`Câu ${index + 1} chưa có nội dung`);
          continue;
        }
        if (!q.correctAnswer) {
          message.warning(`Câu ${index + 1} chưa chọn đáp án`);
          continue;
        }

        // TODO: Gọi API lưu câu hỏi
        if (q.isNew) {
          // Tạo mới
          // const res = await createQuestionAPI({
          //   idGroup,
          //   content: q.content,
          //   type: "TFNG"
          // });
          // const questionId = res.idCauHoi;
          // await createAnswerAPI(questionId, { answerText: q.correctAnswer });
        } else {
          // Cập nhật
          // await updateQuestionAPI(q.idCauHoi, { content: q.content });
          // await updateAnswerAPI(...); // Cần API update answer
        }
      }
      message.success("Đã lưu câu hỏi TFNG!");

      // Reload questions để cập nhật trạng thái
      await loadQuestions();
    } catch (err) {
      console.error(err);
      message.error("Lưu câu hỏi thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Đang tải câu hỏi...</div>;
  }

  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          Chưa có câu hỏi nào trong nhóm này.
        </div>
      ) : (
        questions.map((q, index) => (
          <div key={q.idCauHoi} className="border p-4 rounded bg-white">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Câu {index + 1}</div>
              <Button
                size="small"
                danger
                onClick={() => handleRemoveQuestion(index)}
              >
                Xóa
              </Button>
            </div>
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
            {q.isNew && (
              <div className="mt-2 text-xs text-blue-600">
                * Câu hỏi mới - chưa lưu
              </div>
            )}
          </div>
        ))
      )}

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
