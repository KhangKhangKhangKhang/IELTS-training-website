import React, { useState, useEffect } from "react";
import { Button, Input, message, Spin, Card, Empty } from "antd";
import { DeleteOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import {
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
  createManyQuestion,
  updateManyQuestionAPI,
} from "@/services/apiTest";
import { getMaxNumberQuestion } from "@/lib/utils";

const LabelingForm = ({ idGroup, groupData, questionNumberOffset = 0 }) => {
  const [loadedQuestions, setLoadedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasQuestionsLoaded, setHasQuestionsLoaded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [formQuestions, setFormQuestions] = useState([]);

  useEffect(() => {
    if (!initialized && groupData?.quantity && loadedQuestions.length === 0) {
      const initialQuestions = Array(groupData.quantity)
        .fill(null)
        .map((_, idx) => ({
          numberQuestion: questionNumberOffset + idx + 1,
          content: "",
          labels: ["", "", ""],
        }));
      setFormQuestions(initialQuestions);
      setInitialized(true);
    }
  }, [
    groupData?.quantity,
    initialized,
    loadedQuestions.length,
    questionNumberOffset,
  ]);

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
              const ansData = ansRes?.data || [];
              const labels = ansData.map((a) => a.answer_text || "");
              return {
                ...q,
                labels: labels.length > 0 ? labels : [],
              };
            } catch (err) {
              return { ...q, labels: [] };
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
    const nextNum = questionNumberOffset + formQuestions.length + 1;
    setFormQuestions([
      ...formQuestions,
      { numberQuestion: nextNum, content: "", labels: ["", "", ""] },
    ]);
  };

  const handleChangeQuestion = (qIndex, value) => {
    const updated = [...formQuestions];
    updated[qIndex].content = value;
    setFormQuestions(updated);
  };

  const handleChangeLabel = (qIndex, labelIndex, value) => {
    const updated = [...formQuestions];
    updated[qIndex].labels[labelIndex] = value;
    setFormQuestions(updated);
  };

  const handleAddLabel = (qIndex) => {
    const updated = [...formQuestions];
    updated[qIndex].labels.push("");
    setFormQuestions(updated);
  };

  const handleRemoveLabel = (qIndex, labelIndex) => {
    const updated = [...formQuestions];
    updated[qIndex].labels.splice(labelIndex, 1);
    setFormQuestions(updated);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const questionsPayload = [];

      for (let qIdx = 0; qIdx < formQuestions.length; qIdx++) {
        const q = formQuestions[qIdx];
        if (!q.content || !q.content.trim()) {
          message.warning(`Câu ${q.numberQuestion} không có nội dung`);
          continue;
        }

        if (!q.labels || q.labels.filter((l) => l.trim()).length === 0) {
          message.warning(`Câu ${q.numberQuestion} không có nhãn nào`);
          continue;
        }

        const labels = q.labels.filter((l) => l.trim());

        questionsPayload.push({
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart || null,
          numberQuestion: q.numberQuestion,
          content: q.content,
          answers: labels.map((label) => ({
            answer_text: label,
            matching_key: null,
            matching_value: null,
          })),
        });
      }

      if (questionsPayload.length === 0) {
        message.error("Không có câu hỏi hợp lệ để lưu");
        return;
      }

      await createManyQuestion({ questions: questionsPayload });
      message.success("Đã lưu tất cả câu hỏi gán nhãn!");

      setFormQuestions([]);
      setInitialized(false);
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
      numberQuestion: q.numberQuestion,
      content: q.content,
      labels: q.labels || [],
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
          message.warning(
            `Câu ${q.numberQuestion || qIdx + 1} không có nội dung`
          );
          continue;
        }
        if (!q.labels || q.labels.filter((l) => l.trim()).length === 0) {
          message.warning(`Câu ${q.numberQuestion || qIdx + 1} không có nhãn`);
          continue;
        }

        const labels = q.labels.filter((l) => l.trim());

        questionsPayload.push({
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart || null,
          numberQuestion: q.numberQuestion || qIdx + 1,
          content: q.content,
          answers: labels.map((label) => ({
            answer_text: label,
            matching_key: null,
            matching_value: null,
          })),
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
      setFormQuestions([]);
      setInitialized(false);
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
      <div className="space-y-4 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold">
            Câu hỏi đã tạo ({loadedQuestions.length})
          </h3>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEditGroup}
          >
            Chỉnh sửa
          </Button>
        </div>

        {loadedQuestions.map((q, index) => (
          <Card key={q.idQuestion} className="shadow-sm" size="small">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold text-base mb-1">
                  Câu {q.numberQuestion}
                </div>
                {q.content && (
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="text-gray-600">Mô tả: </span>
                    {q.content}
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-gray-600">Nhãn lựa chọn:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {q.labels && q.labels.length > 0 ? (
                      q.labels.map((label, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-blue-50 border border-blue-300 text-blue-700 px-3 py-1 rounded text-xs font-medium"
                        >
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">
                        Không có nhãn
                      </span>
                    )}
                  </div>
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
          </Card>
        ))}

        <div className="flex gap-2 pt-4 border-t">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setHasQuestionsLoaded(false)}
          >
            Thêm câu hỏi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold">
          {isEditMode ? "Chỉnh sửa câu hỏi" : "Tạo câu hỏi gán nhãn"}
        </h3>
        {isEditMode && (
          <Button
            onClick={() => {
              setIsEditMode(false);
              setFormQuestions([]);
              setInitialized(false);
              setHasQuestionsLoaded(true);
            }}
          >
            Hủy
          </Button>
        )}
      </div>

      {formQuestions.length === 0 && (
        <Empty
          description="Chưa có câu hỏi nào"
          style={{ marginTop: "40px" }}
        />
      )}

      {formQuestions.map((q, qIndex) => (
        <Card key={qIndex} className="shadow-sm" size="small">
          <div className="font-semibold text-base mb-3">
            Câu {q.numberQuestion}
          </div>

          <Input.TextArea
            rows={1}
            placeholder="Mô tả câu hỏi hoặc yêu cầu"
            value={q.content}
            onChange={(e) => handleChangeQuestion(qIndex, e.target.value)}
            style={{ resize: "none" }}
            className="mb-4"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Nhãn lựa chọn:
              </label>
              <span className="text-xs text-gray-500">
                {q.labels ? q.labels.filter((l) => l.trim()).length : 0} nhãn
              </span>
            </div>

            {q.labels &&
              q.labels.map((label, labelIdx) => (
                <div key={labelIdx} className="flex gap-2 items-center">
                  <Input
                    placeholder={`Nhãn ${labelIdx + 1}`}
                    value={label}
                    onChange={(e) =>
                      handleChangeLabel(qIndex, labelIdx, e.target.value)
                    }
                    size="small"
                  />
                  {q.labels.length > 1 && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveLabel(qIndex, labelIdx)}
                    />
                  )}
                </div>
              ))}

            <Button
              type="dashed"
              block
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleAddLabel(qIndex)}
              className="mt-2"
            >
              Thêm nhãn
            </Button>
          </div>
        </Card>
      ))}

      <div className="flex gap-3">
        <Button onClick={handleAddQuestion} icon={<PlusOutlined />}>
          Thêm câu hỏi
        </Button>
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
