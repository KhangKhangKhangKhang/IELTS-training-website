import React, { useState, useEffect } from "react";
import { Button, Input, message, Spin } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import {
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
  updateAnswerAPI,
  createManyQuestion,
  updateManyQuestionAPI,
} from "@/services/apiTest";

const LabelingForm = ({ idGroup, groupData, questionNumberOffset = 0 }) => {
  const [loadedQuestions, setLoadedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasQuestionsLoaded, setHasQuestionsLoaded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formQuestions, setFormQuestions] = useState([
    { content: "", answer_text: "" },
  ]);

  // Initialize form questions based on quantity when group is first created
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
          answer_text: "",
        }));
      setFormQuestions(initialQuestions);
    }
  }, [groupData?.quantity, hasQuestionsLoaded, loadedQuestions.length]);

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

      if (!group || !group.question || group.question.length === 0) {
        setLoadedQuestions([]);
        setHasQuestionsLoaded(false);
      } else {
        const withAnswers = await Promise.all(
          group.question.map(async (q) => {
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

  const handleAddQuestion = () => {
    setFormQuestions([...formQuestions, { content: "", answer_text: "" }]);
  };

  const handleChangeQuestion = (qIndex, value) => {
    const updated = [...formQuestions];
    updated[qIndex].content = value;
    setFormQuestions(updated);
  };

  const handleChangeAnswer = (qIndex, value) => {
    const updated = [...formQuestions];
    updated[qIndex].answer_text = value;
    setFormQuestions(updated);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      const questionsPayload = [];

      for (let qIdx = 0; qIdx < formQuestions.length; qIdx++) {
        const q = formQuestions[qIdx];
        if (!q.content || !q.content.trim()) {
          message.warning(`Câu ${qIdx + 1} không có nội dung`);
          continue;
        }

        if (!q.answer_text) {
          message.warning(`Câu ${qIdx + 1} không có nhãn`);
          continue;
        }

        questionsPayload.push({
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart || null,
          numberQuestion:
            questionNumberOffset + loadedQuestions.length + qIdx + 1,
          content: q.content,
          answers: [
            {
              answer_text: q.answer_text,
              matching_key: null,
              matching_value: null,
            },
          ],
        });
      }

      if (questionsPayload.length === 0) {
        message.error("Không có câu hỏi hợp lệ để lưu");
        return;
      }

      await createManyQuestion({ questions: questionsPayload });
      message.success("Đã lưu tất cả câu hỏi gán nhãn!");

      setFormQuestions([{ content: "", answer_text: "" }]);
      await loadQuestions();
    } catch (err) {
      console.error(err);
      message.error("Lưu câu hỏi thất bại");
    } finally {
      setSaving(false);
    }
  };

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

  const handleEditGroup = () => {
    const editForm = loadedQuestions.map((q) => ({
      idQuestion: q.idQuestion,
      content: q.content,
      answer_text: q.answer_text,
    }));
    setFormQuestions(editForm);
    setIsEditMode(true);
    setHasQuestionsLoaded(false);
  };

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
        if (!q.answer_text) {
          message.warning(`Câu ${qIdx + 1} không có đáp án`);
          continue;
        }

        questionsPayload.push({
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart || null,
          numberQuestion: qIdx + 1,
          content: q.content,
          answers: [
            {
              answer_text: q.answer_text,
              matching_key: null,
              matching_value: null,
            },
          ],
          idQuestion: q.idQuestion,
        });
      }

      if (questionsPayload.length === 0) {
        message.error("Không có câu hỏi hợp lệ để lưu");
        return;
      }

      await updateManyQuestionAPI({ questions: questionsPayload });
      message.success("Đã cập nhật câu hỏi!");

      setIsEditMode(false);
      setFormQuestions([{ content: "", answer_text: "" }]);
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
              <div>
                <span className="font-semibold">Câu {q.numberQuestion}</span>
                <div className="text-sm text-gray-600 mt-1">{q.content}</div>
                <div className="text-sm text-gray-600">
                  Nhãn: <span className="font-medium">{q.answer_text}</span>
                </div>
              </div>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteQuestion(q.idQuestion, index)}
              />
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {isEditMode ? "Chỉnh sửa câu hỏi" : "Tạo câu hỏi gán nhãn"}
        </h3>
        {isEditMode && (
          <Button
            onClick={() => {
              setIsEditMode(false);
              setFormQuestions([{ content: "", answer_text: "" }]);
              setHasQuestionsLoaded(true);
            }}
          >
            Hủy
          </Button>
        )}
      </div>
      {formQuestions.map((q, qIndex) => (
        <div key={qIndex} className="border p-4 rounded bg-white shadow-sm">
          <div className="font-semibold mb-2">
            Câu{" "}
            {isEditMode
              ? qIndex + 1
              : questionNumberOffset + loadedQuestions.length + qIndex + 1}
          </div>

          <Input.TextArea
            rows={1}
            placeholder="Mô tả câu hỏi (tùy chọn)"
            value={q.content}
            onChange={(e) => handleChangeQuestion(qIndex, e.target.value)}
            style={{ resize: "none" }}
          />

          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-gray-600">Nhãn:</span>
            <Input
              placeholder="Nhập nội dung nhãn"
              value={q.answer_text}
              onChange={(e) => handleChangeAnswer(qIndex, e.target.value)}
            />
          </div>
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

export default LabelingForm;
