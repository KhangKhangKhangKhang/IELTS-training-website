import React, { useState, useEffect } from "react";
import { Button, Input, Select, message, Card, Spin, Radio } from "antd";
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import {
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
  createManyQuestion,
  updateManyQuestionAPI,
} from "@/services/apiTest";

const { Option } = Select;

// Hàm tạo nhãn tự động theo index
const getLabelByKeyType = (index, type) => {
  if (type === "ROMAN") {
    const romans = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
      "XIII",
      "XIV",
      "XV",
    ];
    return romans[index] || String(index + 1);
  }
  if (type === "NUMBER") {
    return String(index + 1);
  }
  // Default ABC
  return String.fromCharCode(65 + index);
};

const LabelingForm = ({
  idGroup,
  groupData,
  questionNumberOffset = 0,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // View/Edit mode states
  const [hasQuestionsLoaded, setHasQuestionsLoaded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Mặc định là ABC
  const [labelType, setLabelType] = useState("ABC");

  // 1. POOL OPTIONS
  const [optionsPool, setOptionsPool] = useState([]);

  // 2. QUESTIONS
  const [questions, setQuestions] = useState([]);

  // --- INIT & LOAD DATA ---
  useEffect(() => {
    if (idGroup) loadData();
    else initDefault();
  }, [idGroup]);

  const initDefault = () => {
    if (groupData?.quantity) {
      const defaultOptionsCount = groupData.quantity + 3;
      const defaultOptions = Array.from(
        { length: defaultOptionsCount },
        (_, i) => ({
          key: getLabelByKeyType(i, "ABC"),
          text: "",
        })
      );
      setOptionsPool(defaultOptions);

      const defaultQuestions = Array.from(
        { length: groupData.quantity },
        (_, i) => ({
          idQuestion: null,
          numberQuestion: questionNumberOffset + i + 1,
          content: "",
          correctKey: undefined,
        })
      );
      setQuestions(defaultQuestions);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getQuestionsByIdGroupAPI(idGroup);
      const group = res?.data?.[0];

      if (!group || !group.question || group.question.length === 0) {
        initDefault();
        setHasQuestionsLoaded(false);
      } else {
        // Load Options
        const firstQId = group.question[0].idQuestion;
        const firstAnsRes = await getAnswersByIdQuestionAPI(firstQId);
        const ansData = firstAnsRes?.data || [];

        // Sắp xếp để đảm bảo thứ tự
        const loadedOptions = ansData
          .map((a) => ({
            key: a.matching_key,
            text: a.answer_text || "",
          }))
          .sort((a, b) =>
            a.key.localeCompare(b.key, undefined, {
              numeric: true,
              sensitivity: "base",
            })
          );

        if (loadedOptions.length > 0) {
          setOptionsPool(loadedOptions);
          // Tự động nhận diện kiểu nhãn đang có trong DB
          const firstKey = loadedOptions[0].key;
          if (!isNaN(firstKey)) setLabelType("NUMBER");
          else if (["I", "V", "X"].includes(firstKey[0])) setLabelType("ROMAN");
          else setLabelType("ABC");
        } else {
          setOptionsPool([
            { key: "A", text: "" },
            { key: "B", text: "" },
          ]);
        }

        // Load Questions
        const loadedQuestions = await Promise.all(
          group.question.map(async (q) => {
            const qAnsRes = await getAnswersByIdQuestionAPI(q.idQuestion);
            const qAnsData = qAnsRes?.data || [];
            const correctAns = qAnsData.find(
              (a) => a.matching_value === "CORRECT"
            );

            return {
              idQuestion: q.idQuestion,
              numberQuestion: q.numberQuestion,
              content: q.content,
              correctKey: correctAns ? correctAns.matching_key : undefined,
            };
          })
        );
        loadedQuestions.sort((a, b) => a.numberQuestion - b.numberQuestion);
        setQuestions(loadedQuestions);

        // Set VIEW MODE
        setHasQuestionsLoaded(true);
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // --- EDIT MODE HANDLERS ---
  const handleEditGroup = () => {
    setIsEditMode(true);
    setHasQuestionsLoaded(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setHasQuestionsLoaded(true);
    loadData();
  };

  // --- LOGIC TỰ ĐỘNG ĐÁNH SỐ LẠI ---
  // Mỗi khi list thay đổi hoặc type thay đổi, ta chạy lại key cho toàn bộ list
  const regenerateKeys = (currentPool, type) => {
    return currentPool.map((opt, index) => ({
      ...opt,
      key: getLabelByKeyType(index, type),
    }));
  };

  // Đổi kiểu nhãn (ABC -> 123)
  const handleLabelTypeChange = (e) => {
    const newType = e.target.value;
    setLabelType(newType);

    // Refresh lại toàn bộ key theo kiểu mới
    const newPool = regenerateKeys(optionsPool, newType);
    setOptionsPool(newPool);

    // Reset đáp án đã chọn vì Key thay đổi
    setQuestions(questions.map((q) => ({ ...q, correctKey: undefined })));
    message.info("Đã đổi kiểu nhãn. Vui lòng chọn lại đáp án đúng.");
  };

  // Thêm nhãn
  const handleAddOption = () => {
    const newPool = [...optionsPool, { text: "" }]; // Thêm item rỗng trước
    // Tự động tính key cho tất cả
    setOptionsPool(regenerateKeys(newPool, labelType));
  };

  // Xóa nhãn
  const handleRemoveOption = (idx) => {
    const keyRemoved = optionsPool[idx].key;

    // Cập nhật câu hỏi nếu đang chọn key bị xóa
    const newQuestions = questions.map((q) =>
      q.correctKey === keyRemoved ? { ...q, correctKey: undefined } : q
    );
    setQuestions(newQuestions);

    const tempPool = optionsPool.filter((_, i) => i !== idx);
    // Tự động đánh số lại (A, B, C... ko bị lủng lỗ)
    setOptionsPool(regenerateKeys(tempPool, labelType));
  };

  const handleOptionTextChange = (idx, val) => {
    const newPool = [...optionsPool];
    newPool[idx].text = val;
    setOptionsPool(newPool);
  };

  const handleQuestionChange = (idx, field, val) => {
    const newQ = [...questions];
    newQ[idx][field] = val;
    setQuestions(newQ);
  };

  // --- SAVE ---
  const handleSave = async () => {
    try {
      setSaving(true);
      if (optionsPool.length === 0) {
        message.warning("Cần ít nhất 1 lựa chọn");
        setSaving(false);
        return;
      }

      const payload = questions.map((q) => {
        const answersPayload = optionsPool.map((opt) => ({
          answer_text: opt.text ? opt.text.trim() : "",
          matching_key: opt.key,
          matching_value: opt.key === q.correctKey ? "CORRECT" : null,
        }));

        return {
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart,
          idQuestion: q.idQuestion || null,
          numberQuestion: q.numberQuestion,
          content: q.content || "",
          answers: answersPayload,
        };
      });

      const toUpdate = payload.filter((p) => p.idQuestion);
      const toCreate = payload.filter((p) => !p.idQuestion);

      const promises = [];
      if (toUpdate.length > 0)
        promises.push(updateManyQuestionAPI({ questions: toUpdate }));
      if (toCreate.length > 0)
        promises.push(createManyQuestion({ questions: toCreate }));

      await Promise.all(promises);
      message.success("Lưu thành công!");
      if (onRefresh) onRefresh();
      loadData();
    } catch (err) {
      console.error(err);
      message.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin className="block mx-auto py-10" />;

  // ======== VIEW MODE: Display Loaded Questions ========
  if (hasQuestionsLoaded && !isEditMode && questions.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Câu hỏi đã tạo ({questions.length} câu)
            <span className="ml-3 text-sm text-gray-500 font-normal">
              Loại nhãn: {labelType === "ABC" ? "A, B, C" : labelType === "ROMAN" ? "I, II, III" : "1, 2, 3"}
            </span>
          </h3>
          <Button type="primary" onClick={handleEditGroup}>
            ✎ Chỉnh sửa
          </Button>
        </div>

        {/* Display Options Pool */}
        <Card title="Danh sách nhãn (Labels)" size="small" className="bg-blue-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {optionsPool.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border">
                <span className="font-bold text-blue-600 w-10 text-center bg-blue-100 rounded px-2 py-1">
                  {opt.key}
                </span>
                <span className="text-sm flex-1">{opt.text || "(Không có text)"}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Display Questions with Answers */}
        <Card title="Đáp án" size="small">
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <div key={q.idQuestion || idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
                <div className="flex-none w-12 h-10 flex items-center justify-center bg-blue-600 text-white font-bold rounded">
                  {q.numberQuestion}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">
                    {q.content || "(Không có mô tả)"}
                  </div>
                </div>
                <div className="flex-none">
                  <span className="text-xs text-gray-500 mr-2">Đáp án:</span>
                  <span className="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded">
                    {q.correctKey || "?"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ======== FORM MODE: Create or Edit ========
  return (
    <div className="space-y-6 pb-4">
      <Card
        title={
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-blue-700 font-bold">
                Bước 1: Danh sách Nhãn (Options)
              </span>
              <span className="text-xs text-gray-500 font-normal">
                Nhập text (nếu có) hoặc để trống
              </span>
            </div>

            {/* THANH CHỌN KIỂU NHÃN - DẠNG BUTTON */}
            <div className="flex items-center gap-3 text-sm font-normal">
              <span className="text-gray-600">Loại nhãn:</span>
              <Radio.Group
                value={labelType}
                onChange={handleLabelTypeChange}
                buttonStyle="solid"
                size="middle"
              >
                <Radio.Button value="ABC">A, B, C</Radio.Button>
                <Radio.Button value="ROMAN">I, II, III</Radio.Button>
                <Radio.Button value="NUMBER">1, 2, 3</Radio.Button>
              </Radio.Group>
            </div>
          </div>
        }
        size="small"
        className="bg-blue-50 border-blue-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {optionsPool.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {/* DISPLAY KEY (KHÔNG CHO SỬA) */}
              <div className="flex-none w-10 h-9 flex items-center justify-center bg-blue-600 text-white font-bold rounded shadow-sm select-none">
                {opt.key}
              </div>

              <Input
                placeholder={`Mô tả cho ${opt.key} (có thể để trống)`}
                value={opt.text}
                onChange={(e) => handleOptionTextChange(idx, e.target.value)}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveOption(idx)}
              />
            </div>
          ))}
        </div>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddOption}
          className="mt-4 bg-white block w-full"
        >
          + Thêm nhãn mới
        </Button>
      </Card>

      <Card
        title={<span className="font-bold">Bước 2: Gán đáp án</span>}
        size="small"
      >
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-3 border rounded-lg bg-gray-50 hover:bg-white transition-colors"
            >
              <div className="flex-none w-12 h-10 flex items-center justify-center bg-blue-600 text-white font-bold rounded shadow-sm">
                {q.numberQuestion}
              </div>

              <div className="flex-1">
                <label className="text-xs text-gray-500 font-medium ml-1">
                  Mô tả câu hỏi
                </label>
                <Input
                  placeholder="Mô tả vị trí..."
                  value={q.content}
                  onChange={(e) =>
                    handleQuestionChange(idx, "content", e.target.value)
                  }
                />
              </div>

              <div className="w-[200px]">
                <label className="text-xs text-gray-500 font-medium ml-1">
                  Đáp án đúng
                </label>
                <Select
                  className="w-full"
                  placeholder="Chọn đáp án"
                  value={q.correctKey}
                  onChange={(val) =>
                    handleQuestionChange(idx, "correctKey", val)
                  }
                  allowClear
                >
                  {optionsPool.map((opt) => (
                    <Option key={opt.key} value={opt.key}>
                      <span className="font-bold text-blue-600 mr-2">
                        {opt.key}.
                      </span>
                      {opt.text
                        ? opt.text.length > 15
                          ? opt.text.substring(0, 15) + "..."
                          : opt.text
                        : "(Trống)"}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end pt-2 border-t">
        {isEditMode && (
          <Button onClick={handleCancelEdit} className="mr-2">
            Hủy
          </Button>
        )}
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          className="min-w-[150px]"
        >
          {isEditMode ? "Cập nhật" : "Lưu Labeling"}
        </Button>
      </div>
    </div>
  );
};

export default LabelingForm;
