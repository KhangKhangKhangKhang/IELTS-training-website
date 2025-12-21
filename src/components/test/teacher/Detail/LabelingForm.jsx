import React, { useState, useEffect } from "react";
import { Button, Input, Select, message, Card, Spin } from "antd";
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import {
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
  createManyQuestion,
  updateManyQuestionAPI,
} from "@/services/apiTest";

const { Option } = Select;

const LabelingForm = ({
  idGroup,
  groupData,
  questionNumberOffset = 0,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. POOL OPTIONS: Danh sách các nhãn chung (A, B, C...)
  const [optionsPool, setOptionsPool] = useState([]);

  // 2. QUESTIONS: Danh sách câu hỏi
  const [questions, setQuestions] = useState([]);

  // --- INIT & LOAD DATA ---
  useEffect(() => {
    if (idGroup) loadData();
    else initDefault();
  }, [idGroup]);

  // Khởi tạo mặc định
  const initDefault = () => {
    if (groupData?.quantity) {
      // Tạo dư ra vài option mặc định (A-H chẳng hạn)
      const defaultOptionsCount = groupData.quantity + 3;
      const defaultOptions = Array.from(
        { length: defaultOptionsCount },
        (_, i) => ({
          key: String.fromCharCode(65 + i), // A, B, C...
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
      } else {
        // --- 1. Load Options Pool ---
        const firstQId = group.question[0].idQuestion;
        const firstAnsRes = await getAnswersByIdQuestionAPI(firstQId);
        const ansData = firstAnsRes?.data || [];

        const loadedOptions = ansData
          .map((a) => ({
            key: a.matching_key,
            text: a.answer_text || "", // Cho phép rỗng
          }))
          .sort((a, b) => (a.key || "").localeCompare(b.key || ""));

        if (loadedOptions.length > 0) {
          setOptionsPool(loadedOptions);
        } else {
          setOptionsPool([
            { key: "A", text: "" },
            { key: "B", text: "" },
          ]);
        }

        // --- 2. Load Questions ---
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
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi tải dữ liệu Labeling");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleOptionChange = (idx, val) => {
    const newPool = [...optionsPool];
    newPool[idx].text = val;
    setOptionsPool(newPool);
  };

  const handleAddOption = () => {
    let nextKey = "A";
    if (optionsPool.length > 0) {
      const lastKey = optionsPool[optionsPool.length - 1].key;
      const lastCharCode = lastKey.charCodeAt(0);
      nextKey = String.fromCharCode(lastCharCode + 1);
    }
    setOptionsPool([...optionsPool, { key: nextKey, text: "" }]);
  };

  const handleRemoveOption = (idx) => {
    // Nếu xóa option đang được chọn làm đáp án thì reset đáp án đó
    const keyRemoved = optionsPool[idx].key;
    const newQuestions = questions.map((q) =>
      q.correctKey === keyRemoved ? { ...q, correctKey: undefined } : q
    );
    setQuestions(newQuestions);

    const newPool = optionsPool.filter((_, i) => i !== idx);
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

      // --- BỎ ĐOẠN VALIDATE BẮT BUỘC NHẬP TEXT ---
      // if (optionsPool.some(o => !o.text.trim())) { ... } -> Deleted

      // Check xem có ít nhất 1 option không (để tránh lỗi crash)
      if (optionsPool.length === 0) {
        message.warning("Cần ít nhất 1 lựa chọn (Option)");
        setSaving(false);
        return;
      }

      const payload = questions.map((q) => {
        const answersPayload = optionsPool.map((opt) => ({
          answer_text: opt.text || "", // Nếu rỗng thì gửi chuỗi rỗng
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
      message.success("Lưu Labeling thành công!");

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

  return (
    <div className="space-y-6 pb-4">
      {/* SECTION 1: OPTIONS POOL */}
      <Card
        title={
          <span className="text-blue-700 font-bold">
            Bước 1: Tạo danh sách Nhãn (Options)
          </span>
        }
        size="small"
        className="bg-blue-50 border-blue-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {optionsPool.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-none w-10 h-9 flex items-center justify-center bg-white border border-blue-300 rounded font-bold text-blue-600 shadow-sm">
                {opt.key}
              </div>
              <Input
                placeholder={`Nội dung (để trống nếu chỉ dùng Key ${opt.key})`}
                value={opt.text}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
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
          className="mt-4 bg-white"
        >
          Thêm nhãn
        </Button>
      </Card>

      {/* SECTION 2: QUESTIONS */}
      <Card
        title={
          <span className="font-bold">Bước 2: Gán đáp án cho câu hỏi</span>
        }
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
                  placeholder="Mô tả vị trí (không bắt buộc)..."
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
                      {/* Hiển thị text hoặc chữ Trống nếu không có text */}
                      {opt.text ? (
                        opt.text.length > 20 ? (
                          opt.text.substring(0, 20) + "..."
                        ) : (
                          opt.text
                        )
                      ) : (
                        <span className="text-gray-400 italic">(Trống)</span>
                      )}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end pt-2 border-t">
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          className="min-w-[150px]"
        >
          Lưu Labeling
        </Button>
      </div>
    </div>
  );
};

export default LabelingForm;
