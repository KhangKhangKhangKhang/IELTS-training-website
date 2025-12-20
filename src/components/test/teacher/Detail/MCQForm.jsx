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

  // Init Data (Giữ nguyên logic khởi tạo rỗng nếu cần)
  useEffect(() => {
    if (
      groupData?.quantity &&
      !hasQuestionsLoaded &&
      loadedQuestions.length === 0 &&
      !idGroup // Chỉ init rỗng khi chưa có idGroup (tạo mới hoàn toàn)
    ) {
      const initialQuestions = Array(groupData.quantity)
        .fill(null)
        .map(() => ({
          content: "",
          options: [
            { text: "", correct: false },
            { text: "", correct: false },
            { text: "", correct: false },
            { text: "", correct: false },
          ],
        }));
      setFormQuestions(initialQuestions);
    }
  }, [
    groupData?.quantity,
    hasQuestionsLoaded,
    loadedQuestions.length,
    idGroup,
  ]);

  // Load Data
  useEffect(() => {
    if (idGroup) loadData();
  }, [idGroup]);

  // --- PHẦN SỬA ĐỔI QUAN TRỌNG Ở ĐÂY ---
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getQuestionsByIdGroupAPI(idGroup);
      const group = res?.data?.[0];

      if (group && group.question?.length > 0) {
        const loadedQ = await Promise.all(
          group.question.map(async (q) => {
            // Lấy danh sách answers của câu hỏi này
            const ansRes = await getAnswersByIdQuestionAPI(q.idQuestion);
            const answersData = ansRes?.data || [];

            // 1. Sắp xếp answer theo key A, B, C, D để hiển thị đúng thứ tự
            answersData.sort((a, b) =>
              (a.matching_key || "").localeCompare(b.matching_key || "")
            );

            // 2. Map dữ liệu API sang cấu trúc Form
            let options = answersData.map((a) => ({
              text: a.answer_text || "", // Lấy nội dung câu trả lời
              correct: a.matching_value === "CORRECT", // Check đúng sai
              key: a.matching_key, // Lưu lại key để tham khảo nếu cần
            }));

            // Nếu không có options nào (lỗi dữ liệu), tạo mặc định 4 ô trống
            if (options.length === 0) {
              options = [
                { text: "", correct: false },
                { text: "", correct: false },
                { text: "", correct: false },
                { text: "", correct: false },
              ];
            }

            return {
              idQuestion: q.idQuestion,
              numberQuestion: q.numberQuestion,
              content: q.content,
              options: options,
            };
          })
        );

        setFormQuestions(loadedQ);
        setLoadedQuestions(loadedQ);
        setHasQuestionsLoaded(true);
      } else {
        // Trường hợp có Group nhưng chưa có câu hỏi (hoặc mới tạo)
        setHasQuestionsLoaded(false);
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tải nội dung MCQ");
    } finally {
      setLoading(false);
    }
  };

  // --- CÁC HANDLERS KHÁC GIỮ NGUYÊN ---
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
    // Nếu chọn đáp án đúng, bỏ chọn các đáp án khác (MCQ chỉ 1 đúng)
    if (field === "correct" && value === true) {
      updated[qIndex].options.forEach((opt) => (opt.correct = false));
    }
    updated[qIndex].options[oIndex][field] = value;
    setFormQuestions(updated);
  };

  // Save Logic
  const buildPayload = (questions, isUpdate = false) => {
    return questions.map((q, qIdx) => {
      const answersPayload = q.options.map((opt, oIdx) => ({
        // Map ngược lại khi lưu: text -> answer_text
        answer_text: opt.text || "",
        matching_key: String.fromCharCode(65 + oIdx), // Tự sinh A, B, C, D
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
      // Validate
      if (formQuestions.some((q) => !q.content.trim())) {
        message.warning("Vui lòng nhập nội dung câu hỏi");
        setSaving(false);
        return;
      }

      const payload = buildPayload(formQuestions, false);
      await createManyQuestion({ questions: payload });
      message.success("Đã lưu câu hỏi MCQ!");

      // Refresh lại
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
      const payload = buildPayload(formQuestions, true);
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

  // --- RENDER VIEW MODE (HIỂN THỊ DANH SÁCH ĐÃ CÓ) ---
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
              // Deep copy để edit không ảnh hưởng list hiển thị
              const editForm = JSON.parse(JSON.stringify(loadedQuestions));
              setFormQuestions(editForm);
              setIsEditMode(true);
            }}
          >
            ✎ Chỉnh sửa
          </Button>
        </div>
        {loadedQuestions.map((q) => (
          <div key={q.idQuestion} className="border p-4 rounded bg-white">
            <div className="font-bold mb-2 text-blue-800">
              Câu {q.numberQuestion}: {q.content}
            </div>
            <div className="grid grid-cols-1 gap-2 pl-4">
              {(q.options || []).map((opt, idx) => {
                // Tính toán key A, B, C, D dựa vào index
                const key = String.fromCharCode(65 + idx);
                return (
                  <div
                    key={idx}
                    className={`p-2 border rounded text-sm flex gap-2 items-center ${
                      opt.correct
                        ? "bg-green-50 border-green-300"
                        : "bg-gray-50"
                    }`}
                  >
                    <span className="font-bold min-w-[25px] text-center bg-white border rounded px-1">
                      {key}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                    {opt.correct && (
                      <span className="text-green-600 font-bold ml-2">
                        ✓ TRUE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <Button
          block
          type="dashed"
          onClick={() => {
            // Chuyển sang mode tạo mới nhưng giữ lại list cũ để hiển thị nếu muốn (ở đây ta reset về form tạo)
            setHasQuestionsLoaded(false); // Ẩn list cũ đi để hiện form tạo
            setIsEditMode(false);
            setFormQuestions([
              {
                content: "",
                options: [
                  { text: "", correct: false },
                  { text: "", correct: false },
                  { text: "", correct: false },
                  { text: "", correct: false },
                ],
              },
            ]);
          }}
        >
          + Thêm câu hỏi mới vào nhóm này
        </Button>
      </div>
    );
  }

  // --- RENDER EDIT/CREATE MODE ---
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
              loadData(); // Reload lại dữ liệu gốc
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
                <span className="font-bold text-blue-600 w-8 text-center bg-gray-100 rounded py-1">
                  {String.fromCharCode(65 + oIndex)}
                </span>
                <Input
                  placeholder={`Lựa chọn ${String.fromCharCode(
                    65 + oIndex
                  )}...`}
                  value={opt.text} // BINDING QUAN TRỌNG: opt.text lấy từ API answer_text
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
