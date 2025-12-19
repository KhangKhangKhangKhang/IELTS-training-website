import React, { useState, useEffect, useRef } from "react";
import { Button, Input, message, Spin, Radio, Tooltip } from "antd";
import {
  SaveOutlined,
  ArrowUpOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import {
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
  createManyQuestion,
  updateManyQuestionAPI,
} from "@/services/apiTest";

const FillBlankForm = ({
  idGroup,
  groupData,
  questionNumberOffset = 0,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("SENTENCE"); // "SENTENCE" | "SUMMARY"

  // State data
  const [questions, setQuestions] = useState([]); // Dùng chung cho cả 2 mode
  const [summaryText, setSummaryText] = useState("");

  // Ref để xử lý chèn text vào vị trí con trỏ
  const textAreaRef = useRef(null);

  // Số lượng câu hỏi cố định của Group
  const quantity = groupData?.quantity || 1;

  useEffect(() => {
    if (idGroup) loadQuestions();
  }, [idGroup]);

  // --- 1. LOAD DATA & INIT ---
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await getQuestionsByIdGroupAPI(idGroup);
      const group = res?.data?.[0];

      // Nếu chưa có câu hỏi nào -> Init theo số lượng quantity
      if (!group || !group.question || group.question.length === 0) {
        initFixedForm();
      } else {
        const questionsList = group.question;

        // Load answers
        const fullQuestions = await Promise.all(
          questionsList.map(async (q) => {
            try {
              const ansRes = await getAnswersByIdQuestionAPI(q.idQuestion);
              const ansData = ansRes?.data?.[0];
              return {
                ...q,
                answer_text: ansData?.answer_text || "",
                idAnswer: ansData?.idAnswer,
              };
            } catch (err) {
              return { ...q, answer_text: "" };
            }
          })
        );

        // Detect mode
        detectModeAndFillData(fullQuestions);
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi tải câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  // Khởi tạo form với số lượng cố định, không cho user thêm bớt lung tung
  const initFixedForm = () => {
    // Mặc định là SENTENCE, nhưng nếu user muốn Summary thì data structure vẫn vậy
    const initialQuestions = Array.from({ length: quantity }, (_, index) => ({
      idQuestion: null,
      content: "", // Nếu mode Sentence thì user nhập, Summary thì để trống (sẽ fill lúc save)
      answer_text: "",
      numberQuestion: questionNumberOffset + index + 1, // Tự động tính: Ví dụ 4, 5, 6
    }));

    setQuestions(initialQuestions);
    setSummaryText("");
    setMode("SENTENCE");
  };

  const detectModeAndFillData = (loadedQuestions) => {
    // Nếu số lượng load về ít hơn số lượng quy định của Group (do lỗi gì đó), fill thêm cho đủ
    let processedQuestions = [...loadedQuestions];
    if (loadedQuestions.length < quantity) {
      const diff = quantity - loadedQuestions.length;
      const extra = Array.from({ length: diff }, (_, i) => ({
        content: "",
        answer_text: "",
        numberQuestion: questionNumberOffset + loadedQuestions.length + i + 1,
      }));
      processedQuestions = [...processedQuestions, ...extra];
    }

    // Logic detect Summary
    if (processedQuestions.length > 0) {
      const firstContent = processedQuestions[0].content?.trim();
      // Nếu có >1 câu và content giống nhau => Summary Mode
      // Hoặc nếu chỉ có 1 câu nhưng content dài và chứa ký tự [...] => Có thể là Summary
      const isSummary =
        processedQuestions.length > 1
          ? processedQuestions.every((q) => q.content?.trim() === firstContent)
          : firstContent && firstContent.length > 50; // Heuristic đơn giản

      if (isSummary && firstContent) {
        setMode("SUMMARY");
        setSummaryText(firstContent);
        setQuestions(processedQuestions);
        return;
      }
    }

    setMode("SENTENCE");
    setQuestions(processedQuestions);
  };

  // --- 2. HANDLERS ---

  const handleChangeQuestion = (idx, field, val) => {
    const newQ = [...questions];
    newQ[idx][field] = val;
    setQuestions(newQ);
  };

  // Hàm quan trọng: Chèn placeholder vào vị trí con trỏ chuột trong TextArea
  const handleInsertPlaceholder = (numberQuestion) => {
    const placeholder = ` [${numberQuestion}] `;

    if (textAreaRef.current) {
      const input = textAreaRef.current.resizableTextArea.textArea; // Antd TextArea ref path
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const text = input.value;

      // Chèn text vào giữa
      const newText =
        text.substring(0, start) + placeholder + text.substring(end);

      setSummaryText(newText);

      // Focus lại và đặt con trỏ sau text vừa chèn (dùng setTimeout để đợi React render)
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(
          start + placeholder.length,
          start + placeholder.length
        );
      }, 0);
    } else {
      setSummaryText((prev) => prev + placeholder);
    }
  };

  // --- 3. SAVE LOGIC ---
  const handleSave = async () => {
    try {
      setSaving(true);
      let payload = [];

      if (mode === "SENTENCE") {
        payload = questions.map((q) => ({
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart,
          idQuestion: q.idQuestion || null,
          numberQuestion: q.numberQuestion,
          content: q.content, // Nội dung riêng từng câu
          answers: [
            {
              answer_text: q.answer_text,
              matching_key: null,
              matching_value: null,
            },
          ],
        }));

        // Validate
        if (payload.some((q) => !q.content.trim())) {
          message.warning("Vui lòng nhập nội dung cho tất cả các câu hỏi!");
          setSaving(false);
          return;
        }
      } else {
        // SUMMARY MODE
        if (!summaryText.trim()) {
          message.warning("Chưa nhập nội dung đoạn văn Summary");
          setSaving(false);
          return;
        }

        // Validate xem trong text đã có đủ placeholder chưa (Optional)
        // const missingPlaceholders = questions.filter(q => !summaryText.includes(`[${q.numberQuestion}]`));
        // if (missingPlaceholders.length > 0) {
        //    message.warning(`Cảnh báo: Trong đoạn văn thiếu vị trí cho câu ${missingPlaceholders.map(q=>q.numberQuestion).join(', ')}`);
        // }

        payload = questions.map((q) => ({
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart,
          idQuestion: q.idQuestion || null,
          numberQuestion: q.numberQuestion,
          content: summaryText, // Tất cả chung 1 content
          answers: [
            {
              answer_text: q.answer_text,
              matching_key: null,
              matching_value: null,
            },
          ],
        }));
      }

      const toUpdate = payload.filter((p) => p.idQuestion);
      const toCreate = payload.filter((p) => !p.idQuestion);

      const promises = [];
      if (toUpdate.length > 0)
        promises.push(updateManyQuestionAPI({ questions: toUpdate }));
      if (toCreate.length > 0)
        promises.push(createManyQuestion({ questions: toCreate }));

      await Promise.all(promises);
      message.success("Đã lưu thành công!");
      if (onRefresh) onRefresh();
      await loadQuestions();
    } catch (err) {
      console.error(err);
      message.error("Lưu thất bại!");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-6">
        <Spin />
      </div>
    );

  return (
    <div className="space-y-5 pb-4">
      {/* 1. Switch Mode */}
      <div className="flex items-center gap-4 border-b pb-3 mb-4">
        <span className="font-semibold text-gray-700">Chế độ nhập:</span>
        <Radio.Group
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="SENTENCE">Từng câu (Sentences)</Radio.Button>
          <Radio.Button value="SUMMARY">Đoạn văn (Summary)</Radio.Button>
        </Radio.Group>
        <span className="text-gray-400 text-sm ml-auto">
          Số lượng câu hỏi: <b>{quantity}</b> (câu{" "}
          {questions[0]?.numberQuestion} -{" "}
          {questions[questions.length - 1]?.numberQuestion})
        </span>
      </div>

      {/* 2. Content */}
      {mode === "SENTENCE" ? (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-gray-50 p-4 rounded border">
              <div className="font-bold text-gray-700 mb-2">
                Câu {q.numberQuestion}
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input.TextArea
                    rows={2}
                    className="bg-white"
                    placeholder="Nhập câu hỏi..."
                    value={q.content}
                    onChange={(e) =>
                      handleChangeQuestion(idx, "content", e.target.value)
                    }
                  />
                  <Button
                    type="dashed"
                    onClick={() =>
                      handleChangeQuestion(
                        idx,
                        "content",
                        (q.content || "") + " _____ "
                      )
                    }
                  >
                    + Chèn _____
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-[60px]">
                    Đáp án:
                  </span>
                  <Input
                    placeholder="Đáp án đúng"
                    value={q.answer_text}
                    onChange={(e) =>
                      handleChangeQuestion(idx, "answer_text", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Khu vực nhập Summary */}
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-gray-700">
                Nội dung đoạn văn:
              </label>
              <span className="text-xs text-gray-500">
                Đặt con trỏ vào ô văn bản và bấm nút [↑ Chèn...] ở dưới để điền
                vị trí
              </span>
            </div>
            <Input.TextArea
              ref={textAreaRef}
              rows={8}
              className="text-base leading-relaxed p-3 shadow-sm border-blue-200 focus:border-blue-500"
              placeholder="Nhập đoạn văn summary tại đây..."
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
            />
          </div>

          {/* Khu vực nhập đáp án + Nút chèn */}
          <div className="bg-gray-50 p-4 rounded border">
            <h4 className="font-semibold mb-3 text-gray-700">
              Nhập đáp án & Chèn vị trí vào văn bản:
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white p-2 rounded border shadow-sm hover:border-blue-400 transition-colors"
                >
                  {/* Label số câu */}
                  <div className="font-bold text-gray-700 w-16 text-center bg-gray-100 rounded py-1">
                    {q.numberQuestion}
                  </div>

                  {/* Input đáp án */}
                  <Input
                    className="flex-1"
                    placeholder={`Đáp án câu ${q.numberQuestion}`}
                    value={q.answer_text}
                    onChange={(e) =>
                      handleChangeQuestion(idx, "answer_text", e.target.value)
                    }
                  />

                  {/* Nút Chèn thông minh */}
                  <Tooltip
                    title={`Chèn vị trí [${q.numberQuestion}] vào đoạn văn ở trên`}
                  >
                    <Button
                      type="primary"
                      ghost
                      icon={<VerticalAlignTopOutlined />}
                      onClick={() => handleInsertPlaceholder(q.numberQuestion)}
                    >
                      Chèn [{q.numberQuestion}]
                    </Button>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Footer Save */}
      <div className="pt-4 mt-4 border-t flex justify-end">
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          className="min-w-[150px]"
        >
          Lưu nhóm câu hỏi
        </Button>
      </div>
    </div>
  );
};

export default FillBlankForm;
