import React, { useState, useEffect } from "react";
import { Button, Input, Select, message, Card } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
  createManyQuestion,
  updateManyQuestionAPI,
} from "@/services/apiTest";
import RichTextEditor from "@/components/ui/RichTextEditor";

const { Option } = Select;

const MatchingForm = ({
  idGroup,
  groupData,
  questionNumberOffset = 0,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. POOL OPTIONS: Danh sách các lựa chọn chung (A, B, C...)
  // [{ key: "A", text: "Nội dung A" }, { key: "B", text: "Nội dung B" }]
  const [optionsPool, setOptionsPool] = useState([]);

  // 2. QUESTIONS: Danh sách câu hỏi
  // [{ content: "Câu hỏi 1", correctKey: "A" }]
  const [questions, setQuestions] = useState([]);

  // Load dữ liệu khi sửa
  useEffect(() => {
    if (idGroup) loadData();
  }, [idGroup]);

  // Khởi tạo mặc định khi tạo mới
  useEffect(() => {
    if (
      groupData?.quantity &&
      questions.length === 0 &&
      optionsPool.length === 0
    ) {
      // Tạo options mặc định A, B, C...
      const defaultOptions = Array(groupData.quantity)
        .fill(null)
        .map((_, i) => ({
          key: String.fromCharCode(65 + i),
          text: "",
        }));
      setOptionsPool(defaultOptions);

      // Tạo câu hỏi rỗng
      const defaultQuestions = Array(groupData.quantity)
        .fill(null)
        .map(() => ({
          content: "",
          correctKey: undefined,
        }));
      setQuestions(defaultQuestions);
    }
  }, [groupData]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getQuestionsByIdGroupAPI(idGroup);
      const group = res?.data?.[0];

      if (group && group.question?.length > 0) {
        // Lấy Options Pool từ câu hỏi đầu tiên (vì câu nào cũng lưu full options)
        const firstQId = group.question[0].idQuestion;
        const firstAnsRes = await getAnswersByIdQuestionAPI(firstQId);

        // Reconstruct Options Pool
        const loadedOptions = (firstAnsRes?.data || [])
          .map((a) => ({ key: a.matching_key, text: a.answer_text }))
          .sort((a, b) => a.key.localeCompare(b.key));

        setOptionsPool(loadedOptions);

        // Load từng câu hỏi để biết câu nào chọn key nào
        const loadedQ = await Promise.all(
          group.question.map(async (q) => {
            const ansRes = await getAnswersByIdQuestionAPI(q.idQuestion);
            const answers = ansRes?.data || [];
            // Tìm đáp án đúng (có value là CORRECT)
            const correctAns = answers.find(
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

        setQuestions(loadedQ);
      }
    } catch (err) {
      console.error(err);
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
    const nextChar = String.fromCharCode(65 + optionsPool.length);
    setOptionsPool([...optionsPool, { key: nextChar, text: "" }]);
  };

  const handleRemoveOption = (idx) => {
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

      const payload = questions.map((q, index) => {
        // LOGIC QUAN TRỌNG:
        // Mỗi câu hỏi sẽ chứa TOÀN BỘ danh sách options trong answers
        // Để Frontend lúc làm bài hiển thị đủ list A, B, C, D...
        const answersPayload = optionsPool.map((opt) => ({
          // 1. answer_text: Lưu nội dung (Ví dụ: "1233214")
          answer_text: opt.text,

          // 2. matching_key: Lưu ký tự (Ví dụ: "B")
          matching_key: opt.key,

          // 3. matching_value: Lưu "CORRECT" nếu đúng, null nếu sai (theo yêu cầu của bạn)
          matching_value: opt.key === q.correctKey ? "CORRECT" : null,
        }));

        return {
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart,
          idQuestion: q.idQuestion || null,
          numberQuestion: q.numberQuestion || questionNumberOffset + index + 1,
          content: q.content,
          answers: answersPayload, // Gửi full options cho mỗi câu
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
      message.success("Lưu Matching thành công!");
      if (onRefresh) onRefresh();
      loadData(); // Reload lại để đồng bộ ID
    } catch (err) {
      console.error(err);
      message.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-4">
      {/* 1. Nhập danh sách lựa chọn */}
      <Card
        title="Bước 1: Tạo danh sách lựa chọn (Options)"
        size="small"
        className="bg-blue-50 border-blue-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {optionsPool.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="bg-white border px-3 py-1 rounded font-bold text-blue-600 w-12 text-center shrink-0">
                {opt.key}
              </div>
              <Input
                placeholder={`Nội dung cho ${opt.key}`}
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
          className="mt-3"
        >
          Thêm lựa chọn
        </Button>
      </Card>

      {/* 2. Ghép câu hỏi */}
      <Card title="Bước 2: Câu hỏi & Đáp án đúng" size="small">
        {questions.map((q, idx) => (
          <div key={idx} className="mb-4 pb-4 border-b last:border-0">
            <div className="font-bold text-gray-600 mb-2">
              Câu {q.numberQuestion || questionNumberOffset + idx + 1}
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <RichTextEditor
                  value={q.content}
                  onChange={(html) =>
                    handleQuestionChange(idx, "content", html)
                  }
                  placeholder="Nhập nội dung câu hỏi (có thể định dạng text)..."
                  minHeight="80px"
                />
              </div>
              <div className="w-[200px]">
                <Select
                  className="w-full"
                  placeholder="Chọn đáp án đúng"
                  value={q.correctKey}
                  onChange={(val) =>
                    handleQuestionChange(idx, "correctKey", val)
                  }
                >
                  {optionsPool.map((opt) => (
                    <Option key={opt.key} value={opt.key}>
                      <strong>{opt.key}.</strong>{" "}
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
          </div>
        ))}
      </Card>

      <div className="flex justify-end pt-2">
        <Button
          type="primary"
          size="large"
          onClick={handleSave}
          loading={saving}
        >
          Lưu Matching
        </Button>
      </div>
    </div>
  );
};

export default MatchingForm;
