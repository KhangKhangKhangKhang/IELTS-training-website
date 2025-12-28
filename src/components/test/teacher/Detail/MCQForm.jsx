import React, { useState, useEffect } from "react";
import { Button, Input, Checkbox, message, Spin } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import {
  createManyQuestion,
  updateManyQuestionAPI,
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
} from "@/services/apiTest";
import RichTextEditor from "@/components/ui/RichTextEditor";

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
  const [isMultipleMode, setIsMultipleMode] = useState(false);

  // Form state
  const [formQuestions, setFormQuestions] = useState([
    { content: "", options: [{ text: "", correct: false }] },
  ]);

  // --- 1. INIT DATA (Khi component mount) ---
  useEffect(() => {
    let _isMultiple = false;
    if (groupData?.title) {
      if (groupData.title.startsWith("Multiple |||")) {
        _isMultiple = true;
      }
    }
    setIsMultipleMode(_isMultiple);

    // Nếu chưa load và chưa có idGroup (trường hợp hiếm), init form
    if (
      groupData?.quantity &&
      !hasQuestionsLoaded &&
      loadedQuestions.length === 0 &&
      !idGroup
    ) {
      initEmptyForms(_isMultiple, groupData.quantity);
    }
  }, [groupData, hasQuestionsLoaded, loadedQuestions.length, idGroup]);

  // --- 2. LOAD DATA (Khi có idGroup) ---
  useEffect(() => {
    if (idGroup) loadData();
  }, [idGroup]);

  // Hàm hỗ trợ tạo form rỗng
  const initEmptyForms = (isMultiple, quantity) => {
    // Nếu Multiple: Chỉ tạo 1 form. Nếu Single: Tạo N form theo quantity.
    const quantityToInit = isMultiple ? 1 : quantity || 1;

    const initialQuestions = Array(quantityToInit)
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
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getQuestionsByIdGroupAPI(idGroup);
      const group = res?.data?.[0];

      // CASE 1: ĐÃ CÓ CÂU HỎI TRONG DB
      if (group && group.question?.length > 0) {
        const loadedQ = await Promise.all(
          group.question.map(async (q) => {
            const ansRes = await getAnswersByIdQuestionAPI(q.idQuestion);
            const answersData = ansRes?.data || [];

            // Sort answers if needed, then map to options
            let options = answersData.map((a) => ({
              text: a.answer_text || "",
              correct: a.matching_value === "CORRECT",
              key: a.matching_key,
            }));

            // Fallback options nếu lỗi data
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

        // Logic Multiple Mode: Gộp hiển thị
        if (group.title.startsWith("Multiple |||") && loadedQ.length > 0) {
          // Lấy câu đầu tiên làm mẫu, lưu lại realIds để update
          const mergedForm = [
            {
              ...loadedQ[0],
              realIds: loadedQ.map((q) => q.idQuestion),
            },
          ];
          setFormQuestions(mergedForm);
          setLoadedQuestions(loadedQ);
        } else {
          // Single Mode: Hiển thị tất cả
          setFormQuestions(loadedQ);
          setLoadedQuestions(loadedQ);
        }
        setHasQuestionsLoaded(true);
      }
      // CASE 2: CHƯA CÓ CÂU HỎI (Nhóm mới tạo) -> AUTO GEN FORM
      else {
        let _isMultiple = false;
        if (groupData?.title && groupData.title.startsWith("Multiple |||")) {
          _isMultiple = true;
        }
        // Gọi hàm tạo form rỗng dựa trên quantity
        initEmptyForms(_isMultiple, groupData?.quantity);

        setLoadedQuestions([]);
        setHasQuestionsLoaded(false); // Để hiển thị màn hình nhập liệu ngay
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi tải data");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleAddQuestion = () => {
    setFormQuestions([
      ...formQuestions,
      { content: "", options: [{ text: "", correct: false }] },
    ]);
  };

  const handleDeleteFormQuestion = (qIndex) => {
    if (formQuestions.length <= 1) {
      return message.warning("Cần có ít nhất 1 câu hỏi");
    }
    const updated = formQuestions.filter((_, idx) => idx !== qIndex);
    setFormQuestions(updated);
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
    if (!isMultipleMode && field === "correct" && value === true) {
      updated[qIndex].options.forEach((opt) => (opt.correct = false));
    }
    updated[qIndex].options[oIndex][field] = value;
    setFormQuestions(updated);
  };

  // --- BUILD PAYLOAD ---
  const buildPayload = (questions, isUpdate = false) => {
    // A. NẾU LÀ MULTIPLE MODE (GỘP)
    if (isMultipleMode) {
      const masterQ = questions[0];
      const correctCount = masterQ.options.filter((opt) => opt.correct).length;

      if (correctCount !== groupData.quantity) {
        message.warning(
          `Bạn cần chọn đúng ${groupData.quantity} đáp án ĐÚNG cho nhóm câu hỏi này.`
        );
        throw new Error("Invalid selection count");
      }

      const payload = [];
      const startNumber = isUpdate
        ? loadedQuestions[0].numberQuestion
        : questionNumberOffset + loadedQuestions.length + 1;

      for (let i = 0; i < groupData.quantity; i++) {
        const answersPayload = masterQ.options.map((opt, oIdx) => ({
          answer_text: opt.text || "",
          matching_key: String.fromCharCode(65 + oIdx),
          matching_value: opt.correct ? "CORRECT" : "INCORRECT",
        }));

        const qPayload = {
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart || null,
          numberQuestion: startNumber + i,
          content: masterQ.content,
          answers: answersPayload,
        };

        if (isUpdate && masterQ.realIds && masterQ.realIds[i]) {
          qPayload.idQuestion = masterQ.realIds[i];
        }

        payload.push(qPayload);
      }
      return payload;
    }

    // B. NẾU LÀ SINGLE MODE
    return questions.map((q, qIdx) => {
      const answersPayload = q.options.map((opt, oIdx) => ({
        answer_text: opt.text || "",
        matching_key: String.fromCharCode(65 + oIdx),
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
      if (formQuestions.some((q) => !q.content.trim())) {
        message.warning("Vui lòng nhập nội dung câu hỏi");
        setSaving(false);
        return;
      }

      const payload = buildPayload(formQuestions, false);

      await createManyQuestion({ questions: payload });
      message.success("Đã lưu câu hỏi MCQ!");

      await loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err.message !== "Invalid selection count") {
        console.error(err);
        message.error("Lưu thất bại");
      }
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
      if (err.message !== "Invalid selection count") {
        console.error(err);
        message.error("Cập nhật thất bại");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin className="block mx-auto py-6" />;

  // --- RENDER VIEW MODE ---
  if (hasQuestionsLoaded && loadedQuestions.length > 0 && !isEditMode) {
    const displayQuestions = isMultipleMode
      ? [
        {
          ...loadedQuestions[0],
          numberQuestionDisplay: `${loadedQuestions[0].numberQuestion} - ${loadedQuestions[loadedQuestions.length - 1].numberQuestion
            }`,
          options: loadedQuestions[0].options,
        },
      ]
      : loadedQuestions;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-700 dark:text-gray-200">
            Danh sách câu hỏi ({loadedQuestions.length})
            {isMultipleMode && (
              <span className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded">
                Multiple Choice (Gộp)
              </span>
            )}
          </h3>
          <Button type="primary" onClick={() => setIsEditMode(true)}>
            ✎ Chỉnh sửa
          </Button>
        </div>
        {displayQuestions.map((q, idx) => (
          <div
            key={q.idQuestion || idx}
            className="border border-gray-200 dark:border-slate-600 p-4 rounded-lg bg-white dark:bg-slate-800"
          >
            <div className="font-bold mb-2 text-blue-800 dark:text-blue-400"
              dangerouslySetInnerHTML={{ __html: `Câu ${q.numberQuestionDisplay || q.numberQuestion}: ${q.content}` }}
            />
            <div className="grid grid-cols-1 gap-2 pl-4">
              {(q.options || []).map((opt, oIdx) => (
                <div
                  key={oIdx}
                  className={`p-2 border rounded text-sm flex gap-2 items-center ${opt.correct
                    ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                    : "bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600"
                    }`}
                >
                  <span className="font-bold min-w-[25px] text-center bg-white dark:bg-slate-600 border dark:border-slate-500 rounded px-1 text-gray-700 dark:text-gray-200">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span className="flex-1 text-gray-800 dark:text-gray-200">{opt.text}</span>
                  {opt.correct && (
                    <span className="text-green-600 dark:text-green-400 font-bold ml-2">
                      ✓ TRUE
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {!isEditMode && !isMultipleMode && (
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
        )}
      </div>
    );
  }

  // --- RENDER FORM ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h3 className="font-bold text-gray-800 dark:text-white">
          {isEditMode ? "Chỉnh sửa" : "Tạo câu hỏi"}{" "}
          {isMultipleMode
            ? `(Nhập 1 lần cho ${groupData.quantity} câu)`
            : "(Từng câu)"}
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
          className="border border-gray-200 dark:border-slate-600 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm relative"
        >
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
            <div className="font-bold text-blue-600 dark:text-blue-400 text-lg">
              {isMultipleMode
                ? `Nội dung chung cho ${groupData.quantity} câu hỏi`
                : `Câu số ${questionNumberOffset + loadedQuestions.length + qIndex + 1}`}
            </div>

            {!isMultipleMode && (
              <Button
                type="primary"
                danger
                ghost
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteFormQuestion(qIndex)}
              >
                Xóa câu hỏi này
              </Button>
            )}
          </div>

          <RichTextEditor
            value={q.content}
            onChange={(html) => handleChangeQuestion(qIndex, html)}
            placeholder="Nhập nội dung câu hỏi (có thể định dạng text)..."
            minHeight="80px"
          />

          <div className="space-y-2">
            {q.options.map((opt, oIndex) => (
              <div key={oIndex} className="flex gap-2 items-center">
                {isMultipleMode ? (
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
                ) : (
                  <input
                    type="radio"
                    name={`question-${qIndex}`}
                    checked={opt.correct}
                    onChange={() =>
                      handleChangeOption(qIndex, oIndex, "correct", true)
                    }
                    className="w-4 h-4 cursor-pointer text-blue-600 accent-blue-600"
                  />
                )}
                <span className="font-bold text-blue-600 dark:text-blue-400 w-8 text-center bg-gray-100 dark:bg-slate-600 rounded py-1">
                  {String.fromCharCode(65 + oIndex)}
                </span>
                <Input
                  placeholder={`Lựa chọn...`}
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
        {!isEditMode && !isMultipleMode && (
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
