// src/components/test/teacher/shared/MCQForm.jsx
import React, { useState, useEffect } from "react";
import { Button, Input, Checkbox, message, Spin } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import {
  createManyQuestion,
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
} from "@/services/apiTest";

const MCQForm = ({ idGroup, groupData }) => {
  const [loadedQuestions, setLoadedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasQuestionsLoaded, setHasQuestionsLoaded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Form state for creating new questions
  const [formQuestions, setFormQuestions] = useState([
    { content: "", options: [{ text: "", correct: false }] },
  ]);

  useEffect(() => {
    if (idGroup) {
      loadQuestions();
    }
  }, [idGroup]);

  // ======== LOAD EXISTING QUESTIONS ========
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await getQuestionsByIdGroupAPI(idGroup);
      const group = res?.data?.[0];

      if (!group || !group.question || group.question.length === 0) {
        setLoadedQuestions([]);
        setHasQuestionsLoaded(false);
      } else {
        // Load each question with its answers
        const withAnswers = await Promise.all(
          group.question.map(async (q) => {
            try {
              const ansRes = await getAnswersByIdQuestionAPI(q.idQuestion);
              const answers = ansRes?.data || [];
              return {
                ...q,
                answers: answers,
              };
            } catch (err) {
              return { ...q, answers: [] };
            }
          })
        );
        setLoadedQuestions(withAnswers);
        setHasQuestionsLoaded(true);
      }
    } catch (err) {
      console.error("Error loading questions:", err);
      setLoadedQuestions([]);
      setHasQuestionsLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  // ======== FORM HANDLERS ========
  const handleAddQuestion = () => {
    setFormQuestions([
      ...formQuestions,
      { content: "", options: [{ text: "", correct: false }] },
    ]);
  };

  const handleAddOption = (qIndex) => {
    const updated = [...formQuestions];
    updated[qIndex].options.push({ text: "", correct: false });
    setFormQuestions(updated);
  };

  const handleDeleteOption = (qIndex, oIndex) => {
    const updated = [...formQuestions];
    updated[qIndex].options.splice(oIndex, 1);
    setFormQuestions(updated);
  };

  const handleChangeQuestion = (qIndex, value) => {
    const updated = [...formQuestions];
    updated[qIndex].content = value;
    setFormQuestions(updated);
  };

  const handleChangeOption = (qIndex, oIndex, field, value) => {
    const updated = [...formQuestions];
    updated[qIndex].options[oIndex][field] = value;
    setFormQuestions(updated);
  };

  // ======== CREATE QUESTIONS ========
  const handleSaveAll = async () => {
    try {
      setSaving(true);

      // Build payload for createManyQuestion
      const questionsPayload = [];

      for (let qIdx = 0; qIdx < formQuestions.length; qIdx++) {
        const q = formQuestions[qIdx];
        if (!q.content || !q.content.trim()) {
          message.warning(`Câu ${qIdx + 1} không có nội dung`);
          continue;
        }

        // Build answers array with options as answers
        const answers = (q.options || [])
          .filter((opt) => opt && opt.text && opt.text.trim())
          .map((opt, oIdx) => ({
            answer_text: opt.text,
            matching_key: String.fromCharCode(65 + oIdx), // A, B, C...
            matching_value: opt.correct ? "Correct" : "Incorrect",
          }));

        if (answers.length === 0) {
          message.warning(`Câu ${qIdx + 1} không có lựa chọn nào`);
          continue;
        }

        questionsPayload.push({
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart || null,
          numberQuestion: loadedQuestions.length + qIdx + 1,
          content: q.content,
          answers: answers,
        });
      }

      if (questionsPayload.length === 0) {
        message.error("Không có câu hỏi hợp lệ để lưu");
        return;
      }

      // Call createManyQuestion with all questions
      await createManyQuestion({ questions: questionsPayload });
      message.success("Đã lưu tất cả câu hỏi MCQ!");

      // Reset form and reload
      setFormQuestions([
        { content: "", options: [{ text: "", correct: false }] },
      ]);
      await loadQuestions();
    } catch (err) {
      console.error(err);
      message.error("Lưu câu hỏi thất bại");
    } finally {
      setSaving(false);
    }
  };

  // ======== DELETE QUESTION ========
  const handleDeleteQuestion = async (idQuestion, index) => {
    try {
      const updated = loadedQuestions.filter((_, idx) => idx !== index);
      setLoadedQuestions(updated);
      message.success("Đã xóa câu hỏi");
    } catch (err) {
      console.error(err);
      message.error("Xóa câu hỏi thất bại");
    }
  };

  // ======== EDIT MODE ========
  const handleEditGroup = () => {
    // Convert loaded questions to form format for editing
    const editForm = loadedQuestions.map((q) => ({
      idQuestion: q.idQuestion,
      content: q.content,
      options: (q.answers || []).map((ans) => ({
        text: ans.answer_text,
        correct: ans.matching_value === "Correct",
      })),
    }));
    setFormQuestions(editForm);
    setIsEditMode(true);
    setHasQuestionsLoaded(false);
  };

  // ======== SAVE EDIT ========
  const handleSaveEdit = async () => {
    try {
      setSaving(true);

      const questionsPayload = [];

      for (let qIdx = 0; qIdx < formQuestions.length; qIdx++) {
        const q = formQuestions[qIdx];
        if (!q.content || !q.content.trim()) {
          message.warning(`Câu ${qIdx + 1} không có nội dung`);
          continue;
        }

        const answers = (q.options || [])
          .filter((opt) => opt && opt.text && opt.text.trim())
          .map((opt, oIdx) => ({
            answer_text: opt.text,
            matching_key: String.fromCharCode(65 + oIdx),
            matching_value: opt.correct ? "Correct" : "Incorrect",
          }));

        if (answers.length === 0) {
          message.warning(`Câu ${qIdx + 1} không có lựa chọn nào`);
          continue;
        }

        questionsPayload.push({
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart || null,
          numberQuestion: qIdx + 1,
          content: q.content,
          answers: answers,
        });
      }

      if (questionsPayload.length === 0) {
        message.error("Không có câu hỏi hợp lệ để lưu");
        return;
      }

      await createManyQuestion({ questions: questionsPayload });
      message.success("Đã cập nhật câu hỏi MCQ!");

      setIsEditMode(false);
      setFormQuestions([
        { content: "", options: [{ text: "", correct: false }] },
      ]);
      await loadQuestions();
    } catch (err) {
      console.error(err);
      message.error("Cập nhật câu hỏi thất bại");
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

  // ======== SHOW EXISTING QUESTIONS ========
  if (hasQuestionsLoaded && loadedQuestions.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Câu hỏi đã có</h3>
          <Button type="primary" onClick={handleEditGroup}>
            ✎ Chỉnh sửa
          </Button>
        </div>
        {loadedQuestions.map((q, index) => (
          <div
            key={q.idQuestion}
            className="border p-4 rounded bg-white shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold">
                Câu {q.numberQuestion}: {q.content}
              </span>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteQuestion(q.idQuestion, index)}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium mb-2">Đáp án:</p>
              <div className="space-y-1">
                {(q.answers || []).map((ans, idx) => (
                  <div
                    key={idx}
                    className="text-sm flex items-center gap-2 p-1"
                  >
                    <span className="font-semibold min-w-6">
                      {ans.matching_key}:
                    </span>
                    <span>{ans.answer_text}</span>
                    {ans.matching_value === "Correct" && (
                      <span className="ml-auto text-green-600 text-xs font-bold">
                        ✓ ĐÁP ÁN ĐÚNG
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2 pt-4 border-t">
          <Button type="primary" onClick={() => setHasQuestionsLoaded(false)}>
            + Thêm câu hỏi
          </Button>
        </div>
      </div>
    );
  }

  // ======== SHOW FORM TO CREATE/EDIT QUESTIONS ========
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {isEditMode ? "Chỉnh sửa câu hỏi MCQ" : "Tạo câu hỏi MCQ"}
        </h3>
        {isEditMode && (
          <Button
            onClick={() => {
              setIsEditMode(false);
              setFormQuestions([
                { content: "", options: [{ text: "", correct: false }] },
              ]);
              setHasQuestionsLoaded(true);
            }}
          >
            Hủy
          </Button>
        )}
      </div>
      {formQuestions.map((q, qIndex) => (
        <div key={qIndex} className="border p-4 rounded bg-white shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">
              Câu{" "}
              {isEditMode ? qIndex + 1 : loadedQuestions.length + qIndex + 1}
            </span>
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
                  placeholder={`Lựa chọn ${String.fromCharCode(65 + oIndex)}`}
                  value={opt.text}
                  onChange={(e) =>
                    handleChangeOption(qIndex, oIndex, "text", e.target.value)
                  }
                />
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteOption(qIndex, oIndex)}
                />
              </div>
            ))}
          </div>

          <Button
            type="dashed"
            className="mt-3 w-full"
            onClick={() => handleAddOption(qIndex)}
          >
            + Thêm lựa chọn
          </Button>
        </div>
      ))}

      <div className="flex gap-3">
        <Button onClick={handleAddQuestion}>+ Thêm câu hỏi</Button>
        <Button
          type="primary"
          onClick={isEditMode ? handleSaveEdit : handleSaveAll}
          loading={saving}
        >
          {isEditMode ? "Cập nhật" : "Lưu"}
        </Button>
      </div>
    </div>
  );
};

export default MCQForm;
