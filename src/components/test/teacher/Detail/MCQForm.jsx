// src/components/test/teacher/shared/MCQForm.jsx
import React, { useState, useEffect } from "react";
import { Button, Input, Checkbox, message, Spin } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import {
  createManyQuestion,
  updateManyQuestionAPI,
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
} from "@/services/apiTest";

const MCQForm = ({
  idGroup,
  groupData,
  questionNumberOffset = 0,
  onRefresh,
}) => {
  const [loadedQuestions, setLoadedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasQuestionsLoaded, setHasQuestionsLoaded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [formQuestions, setFormQuestions] = useState([
    { content: "", options: [{ text: "", correct: false }] },
  ]);

  // Init Data
  useEffect(() => {
    if (
      groupData?.quantity &&
      !hasQuestionsLoaded &&
      loadedQuestions.length === 0
    ) {
      const initialQuestions = Array(groupData.quantity)
        .fill(null)
        .map(() => ({
          content: "",
          // Mặc định 4 options
          options: [
            { text: "", correct: false },
            { text: "", correct: false },
            { text: "", correct: false },
            { text: "", correct: false },
          ],
        }));
      setFormQuestions(initialQuestions);
    }
  }, [groupData?.quantity, hasQuestionsLoaded, loadedQuestions.length]);

  // Load Data
  useEffect(() => {
    if (idGroup) loadData();
  }, [idGroup]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getQuestionsByIdGroupAPI(idGroup);
      const group = res?.data?.[0];

      if (group && group.question?.length > 0) {
        const loadedQ = await Promise.all(
          group.question.map(async (q) => {
            const ansRes = await getAnswersByIdQuestionAPI(q.idQuestion);
            const answers = ansRes?.data || [];

            // Map API response về Form structure
            const options = answers.map((a) => ({
              text: a.answer_text,
              correct:
                a.matching_value === "CORRECT" || a.matching_value === "TRUE",
            }));

            return {
              idQuestion: q.idQuestion,
              numberQuestion: q.numberQuestion,
              content: q.content,
              options:
                options.length > 0 ? options : [{ text: "", correct: false }],
            };
          })
        );
        setFormQuestions(loadedQ); // Dùng formQuestions để hiển thị luôn khi edit
        setLoadedQuestions(loadedQ);
        setHasQuestionsLoaded(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
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
    if (field === "correct" && value === true) {
      updated[qIndex].options.forEach((opt) => (opt.correct = false)); // Chỉ 1 đúng
    }
    updated[qIndex].options[oIndex][field] = value;
    setFormQuestions(updated);
  };

  // Save Logic (QUAN TRỌNG)
  const buildPayload = (questions, isUpdate = false) => {
    return questions.map((q, qIdx) => {
      const answersPayload = q.options.map((opt, oIdx) => ({
        // TEXT: Nội dung giáo viên nhập (VD: "Apple")
        answer_text: opt.text || "",
        // KEY: Tự động sinh A, B, C... dựa vào index
        matching_key: String.fromCharCode(65 + oIdx),
        // VALUE: Đánh dấu đúng sai
        matching_value: opt.correct ? "CORRECT" : "INCORRECT",
      }));

      const base = {
        idGroupOfQuestions: idGroup,
        idPart: groupData?.idPart || null,
        numberQuestion: isUpdate
          ? q.numberQuestion
          : questionNumberOffset + loadedQuestions.length + qIdx + 1,
        content: q.content,
        answers: answersPayload,
      };

      if (isUpdate && q.idQuestion) base.idQuestion = q.idQuestion;
      return base;
    });
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const payload = buildPayload(formQuestions, false); // Create mode

      if (payload.some((q) => q.answers.length === 0)) {
        message.warning("Vui lòng thêm lựa chọn cho câu hỏi");
        return;
      }

      await createManyQuestion({ questions: payload });
      message.success("Đã lưu câu hỏi MCQ!");

      setFormQuestions([
        { content: "", options: [{ text: "", correct: false }] },
      ]);
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      message.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const payload = buildPayload(formQuestions, true); // Update mode
      await updateManyQuestionAPI({ questions: payload });
      message.success("Cập nhật thành công!");

      setIsEditMode(false);
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      message.error("Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin className="block mx-auto py-6" />;

  // Render danh sách đã có (View mode)
  if (hasQuestionsLoaded && loadedQuestions.length > 0 && !isEditMode) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-700">
            Danh sách câu hỏi ({loadedQuestions.length})
          </h3>
          <Button
            type="primary"
            onClick={() => {
              // Copy data sang form để edit
              const editForm = loadedQuestions.map((q) => ({
                idQuestion: q.idQuestion,
                numberQuestion: q.numberQuestion,
                content: q.content,
                options: (q.answers || []).map((ans) => ({
                  text: ans.answer_text,
                  correct:
                    ans.matching_value === "CORRECT" ||
                    ans.matching_value === "TRUE",
                })),
              }));
              setFormQuestions(editForm);
              setIsEditMode(true);
            }}
          >
            ✎ Chỉnh sửa
          </Button>
        </div>
        {loadedQuestions.map((q) => (
          <div key={q.idQuestion} className="border p-4 rounded bg-white">
            <div className="font-bold mb-2">
              Câu {q.numberQuestion}: {q.content}
            </div>
            <div className="grid grid-cols-1 gap-2 pl-4">
              {(q.answers || []).map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-2 border rounded text-sm flex gap-2 ${
                    ans.matching_value === "CORRECT"
                      ? "bg-green-50 border-green-300"
                      : "bg-gray-50"
                  }`}
                >
                  <span className="font-bold min-w-[20px]">
                    {ans.matching_key}.
                  </span>
                  <span>{ans.answer_text}</span>
                  {ans.matching_value === "CORRECT" && (
                    <span className="ml-auto text-green-600 font-bold">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button
          block
          type="dashed"
          onClick={() => {
            setHasQuestionsLoaded(false);
            setIsEditMode(false);
            setFormQuestions([
              { content: "", options: [{ text: "", correct: false }] },
            ]);
          }}
        >
          + Thêm câu hỏi mới vào nhóm này
        </Button>
      </div>
    );
  }

  // Render Form (Create/Edit mode)
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h3 className="font-bold">
          {isEditMode ? "Chỉnh sửa câu hỏi" : "Tạo câu hỏi mới"}
        </h3>
        {(isEditMode || hasQuestionsLoaded) && (
          <Button
            onClick={() => {
              setIsEditMode(false);
              setHasQuestionsLoaded(true);
              loadData();
            }}
          >
            Hủy
          </Button>
        )}
      </div>

      {formQuestions.map((q, qIndex) => (
        <div
          key={qIndex}
          className="border p-4 rounded bg-white shadow-sm relative"
        >
          <div className="font-semibold mb-2">
            Câu{" "}
            {q.numberQuestion ||
              questionNumberOffset + loadedQuestions.length + qIndex + 1}
          </div>

          <Input.TextArea
            rows={2}
            placeholder="Nội dung câu hỏi..."
            value={q.content}
            onChange={(e) => handleChangeQuestion(qIndex, e.target.value)}
            className="mb-4"
          />

          <div className="space-y-2">
            {q.options.map((opt, oIndex) => (
              <div key={oIndex} className="flex gap-2 items-center">
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
                {/* Hiển thị Key tự động A, B, C... */}
                <span className="font-bold text-blue-600 w-6 text-center">
                  {String.fromCharCode(65 + oIndex)}
                </span>
                <Input
                  placeholder={`Nội dung lựa chọn...`}
                  value={opt.text}
                  onChange={(e) =>
                    handleChangeOption(qIndex, oIndex, "text", e.target.value)
                  }
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteOption(qIndex, oIndex)}
                />
              </div>
            ))}
            <Button
              type="dashed"
              size="small"
              onClick={() => handleAddOption(qIndex)}
              className="mt-2 ml-8"
            >
              + Thêm lựa chọn
            </Button>
          </div>
        </div>
      ))}

      <div className="flex gap-3 justify-end">
        {!isEditMode && (
          <Button onClick={handleAddQuestion}>+ Thêm câu hỏi</Button>
        )}
        <Button
          type="primary"
          onClick={isEditMode ? handleSaveEdit : handleSaveAll}
          loading={saving}
        >
          {isEditMode ? "Cập nhật tất cả" : "Lưu"}
        </Button>
      </div>
    </div>
  );
};

export default MCQForm;
