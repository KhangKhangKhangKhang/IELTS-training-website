import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Input,
  message,
  Spin,
  Radio,
  Tooltip,
  Select,
  Card,
} from "antd";
import {
  SaveOutlined,
  VerticalAlignTopOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
  createManyQuestion,
  updateManyQuestionAPI,
} from "@/services/apiTest";

const { Option } = Select;

const FillBlankForm = ({
  idGroup,
  groupData,
  questionNumberOffset = 0,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mode: "SENTENCE" | "SUMMARY" | "SUMMARY_BOX"
  const [mode, setMode] = useState("SENTENCE");

  // State chung
  const [questions, setQuestions] = useState([]);
  const [summaryText, setSummaryText] = useState("");

  // State riêng cho mode SUMMARY_BOX (Danh sách các từ trong Box)
  // [{ key: "A", text: "example" }, { key: "B", text: "answer" }]
  const [boxOptions, setBoxOptions] = useState([]);

  const textAreaRef = useRef(null);
  const quantity = groupData?.quantity || 1;

  useEffect(() => {
    if (idGroup) loadQuestions();
    else initFixedForm();
  }, [idGroup]);

  // --- 1. INIT & LOAD DATA ---

  const initFixedForm = () => {
    // Khởi tạo form rỗng theo số lượng quantity
    const initialQuestions = Array.from({ length: quantity }, (_, index) => ({
      idQuestion: null,
      content: "",
      answer_text: "", // Dùng cho mode thường
      selectedBoxKey: null, // Dùng cho mode Box (lưu Key A, B...)
      numberQuestion: questionNumberOffset + index + 1,
    }));

    setQuestions(initialQuestions);
    setSummaryText("");
    setBoxOptions([
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
    ]);
    setMode("SENTENCE");
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await getQuestionsByIdGroupAPI(idGroup);
      const group = res?.data?.[0];

      if (!group || !group.question || group.question.length === 0) {
        initFixedForm();
      } else {
        const questionsList = group.question;

        // Load answers cho tất cả câu hỏi
        const fullQuestions = await Promise.all(
          questionsList.map(async (q) => {
            try {
              const ansRes = await getAnswersByIdQuestionAPI(q.idQuestion);
              const ansData = ansRes?.data || [];

              // Logic detect đáp án
              // 1. Nếu là Box: ansData sẽ chứa nhiều option (A, B, C...), ta cần tìm cái CORRECT
              const correctAns = ansData.find(
                (a) => a.matching_value === "CORRECT"
              );
              // 2. Nếu là thường: ansData chỉ có 1 phần tử hoặc matching_value null

              return {
                ...q,
                // Dữ liệu cho mode thường
                answer_text: ansData[0]?.answer_text || "",
                // Dữ liệu cho mode Box
                selectedBoxKey: correctAns ? correctAns.matching_key : null,
                // Lưu lại full options để tí nữa detect mode
                rawAnswers: ansData,
              };
            } catch (err) {
              return { ...q, answer_text: "" };
            }
          })
        );

        detectModeAndFillData(fullQuestions);
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi tải câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  const detectModeAndFillData = (loadedQuestions) => {
    // Fill thêm nếu thiếu câu hỏi so với quantity
    let processedQuestions = [...loadedQuestions];
    if (loadedQuestions.length < quantity) {
      const diff = quantity - loadedQuestions.length;
      const extra = Array.from({ length: diff }, (_, i) => ({
        content: "",
        answer_text: "",
        selectedBoxKey: null,
        numberQuestion: questionNumberOffset + loadedQuestions.length + i + 1,
      }));
      processedQuestions = [...processedQuestions, ...extra];
    }

    if (processedQuestions.length > 0) {
      const firstQ = processedQuestions[0];
      const firstContent = firstQ.content?.trim();
      const firstAnswers = firstQ.rawAnswers || [];

      // DETECT MODE: SUMMARY_BOX
      // Điều kiện: Có matching_key (A, B...) trong đáp án
      const hasKey = firstAnswers.some((a) => a.matching_key);
      if (hasKey) {
        setMode("SUMMARY_BOX");
        setSummaryText(firstContent); // Các câu hỏi Box đều chung content
        setQuestions(processedQuestions);

        // Reconstruct Box Options từ câu hỏi đầu tiên
        const options = firstAnswers
          .map((a) => ({ key: a.matching_key, text: a.answer_text }))
          .sort((a, b) => a.key.localeCompare(b.key));

        if (options.length > 0) setBoxOptions(options);
        else
          setBoxOptions([
            { key: "A", text: "" },
            { key: "B", text: "" },
          ]); // fallback

        return;
      }

      // DETECT MODE: SUMMARY (Thường)
      // Điều kiện: Content giống nhau hoặc dài
      const isSummary =
        processedQuestions.length > 1
          ? processedQuestions.every((q) => q.content?.trim() === firstContent)
          : firstContent && firstContent.length > 50;

      if (isSummary && firstContent) {
        setMode("SUMMARY");
        setSummaryText(firstContent);
        setQuestions(processedQuestions);
        return;
      }
    }

    // Default: SENTENCE
    setMode("SENTENCE");
    setQuestions(processedQuestions);
  };

  // --- 2. HANDLERS ---

  // Xử lý thay đổi câu hỏi
  const handleChangeQuestion = (idx, field, val) => {
    const newQ = [...questions];
    newQ[idx][field] = val;
    setQuestions(newQ);
  };

  // Xử lý chèn placeholder vào Summary Text
  const handleInsertPlaceholder = (numberQuestion) => {
    const placeholder = ` [${numberQuestion}] `;
    if (textAreaRef.current) {
      const input = textAreaRef.current.resizableTextArea.textArea;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const text = input.value;
      const newText =
        text.substring(0, start) + placeholder + text.substring(end);
      setSummaryText(newText);
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

  // --- Box Options Handlers ---
  const handleBoxOptionChange = (idx, val) => {
    const newBox = [...boxOptions];
    newBox[idx].text = val;
    setBoxOptions(newBox);
  };
  const handleAddBoxOption = () => {
    const nextChar = String.fromCharCode(65 + boxOptions.length);
    setBoxOptions([...boxOptions, { key: nextChar, text: "" }]);
  };
  const handleRemoveBoxOption = (idx) => {
    const newBox = boxOptions.filter((_, i) => i !== idx);
    setBoxOptions(newBox);
  };

  // --- 3. SAVE LOGIC ---
  const handleSave = async () => {
    try {
      setSaving(true);
      let payload = [];

      // --- LOGIC: SENTENCE ---
      if (mode === "SENTENCE") {
        if (questions.some((q) => !q.content.trim())) {
          message.warning("Vui lòng nhập nội dung cho tất cả các câu hỏi!");
          setSaving(false);
          return;
        }
        payload = questions.map((q) => ({
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart,
          idQuestion: q.idQuestion || null,
          numberQuestion: q.numberQuestion,
          content: q.content,
          answers: [
            {
              answer_text: q.answer_text,
              matching_key: null,
              matching_value: null,
            },
          ],
        }));
      }

      // --- LOGIC: SUMMARY (Typing) ---
      else if (mode === "SUMMARY") {
        if (!summaryText.trim()) {
          message.warning("Chưa nhập nội dung đoạn văn Summary");
          setSaving(false);
          return;
        }
        payload = questions.map((q) => ({
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart,
          idQuestion: q.idQuestion || null,
          numberQuestion: q.numberQuestion,
          content: summaryText,
          answers: [
            {
              answer_text: q.answer_text,
              matching_key: null,
              matching_value: null,
            },
          ],
        }));
      }

      // --- LOGIC: SUMMARY_BOX (Selection) ---
      else if (mode === "SUMMARY_BOX") {
        if (!summaryText.trim()) {
          message.warning("Chưa nhập nội dung đoạn văn Summary");
          setSaving(false);
          return;
        }
        // Validate Box
        if (boxOptions.some((o) => !o.text.trim())) {
          message.warning("Vui lòng điền đủ nội dung các lựa chọn trong Box");
          setSaving(false);
          return;
        }

        payload = questions.map((q) => {
          // Với dạng Box, answers chứa TOÀN BỘ options
          // Option nào user chọn thì matching_value = "CORRECT"
          const answersPayload = boxOptions.map((opt) => ({
            answer_text: opt.text,
            matching_key: opt.key,
            matching_value: opt.key === q.selectedBoxKey ? "CORRECT" : null,
          }));

          return {
            idGroupOfQuestions: idGroup,
            idPart: groupData?.idPart,
            idQuestion: q.idQuestion || null,
            numberQuestion: q.numberQuestion,
            content: summaryText,
            answers: answersPayload,
          };
        });
      }

      // CALL API
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
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-3 mb-4">
        <span className="font-semibold text-gray-700">Chế độ nhập:</span>
        <Radio.Group
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="SENTENCE">Từng câu</Radio.Button>
          <Radio.Button value="SUMMARY">Đoạn văn (Điền từ)</Radio.Button>
          <Radio.Button value="SUMMARY_BOX">
            Đoạn văn + Box (Chọn từ)
          </Radio.Button>
        </Radio.Group>

        <span className="text-gray-400 text-sm ml-auto">
          Số lượng: <b>{quantity}</b> (câu {questions[0]?.numberQuestion} -{" "}
          {questions[questions.length - 1]?.numberQuestion})
        </span>
      </div>

      {/* 2. RENDER FOR SUMMARY_BOX: OPTIONS POOL */}
      {mode === "SUMMARY_BOX" && (
        <Card
          size="small"
          title="Danh sách lựa chọn (The Box)"
          className="bg-blue-50 border-blue-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
            {boxOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-bold bg-white border px-2 py-1 rounded w-10 text-center text-blue-600">
                  {opt.key}
                </span>
                <Input
                  placeholder={`Nội dung ${opt.key}`}
                  value={opt.text}
                  onChange={(e) => handleBoxOptionChange(idx, e.target.value)}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveBoxOption(idx)}
                  disabled={boxOptions.length <= 2}
                />
              </div>
            ))}
          </div>
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAddBoxOption}
          >
            Thêm lựa chọn
          </Button>
        </Card>
      )}

      {/* 3. CONTENT AREA (SUMMARY TEXT) */}
      {(mode === "SUMMARY" || mode === "SUMMARY_BOX") && (
        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold text-gray-700">
              Nội dung đoạn văn Summary:
            </label>
            <span className="text-xs text-gray-500">
              Đặt con trỏ vào ô văn bản và bấm nút [Chèn...] ở dưới để điền vị
              trí
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
      )}

      {/* 4. QUESTIONS LIST */}
      <div className="bg-gray-50 p-4 rounded border">
        <h4 className="font-semibold mb-3 text-gray-700">
          {mode === "SENTENCE"
            ? "Nhập câu hỏi & Đáp án:"
            : "Thiết lập đáp án & Vị trí:"}
        </h4>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className={`p-3 rounded border shadow-sm ${
                mode === "SENTENCE"
                  ? "bg-gray-50"
                  : "bg-white flex items-center gap-2"
              }`}
            >
              {/* --- CASE: SENTENCE MODE --- */}
              {mode === "SENTENCE" && (
                <div className="space-y-2">
                  <div className="font-bold text-gray-700">
                    Câu {q.numberQuestion}
                  </div>
                  <div className="flex gap-2">
                    <Input.TextArea
                      rows={1}
                      placeholder="Nội dung câu hỏi..."
                      className="bg-white"
                      value={q.content}
                      onChange={(e) =>
                        handleChangeQuestion(idx, "content", e.target.value)
                      }
                    />
                    <Button
                      onClick={() =>
                        handleChangeQuestion(
                          idx,
                          "content",
                          (q.content || "") + " _____ "
                        )
                      }
                    >
                      + ____
                    </Button>
                  </div>
                  <Input
                    prefix={
                      <span className="font-bold text-sm mr-1">Đáp án:</span>
                    }
                    value={q.answer_text}
                    onChange={(e) =>
                      handleChangeQuestion(idx, "answer_text", e.target.value)
                    }
                  />
                </div>
              )}

              {/* --- CASE: SUMMARY / SUMMARY_BOX --- */}
              {mode !== "SENTENCE" && (
                <>
                  {/* Label số câu */}
                  <div className="font-bold text-gray-700 w-12 text-center bg-gray-100 rounded py-2 shrink-0">
                    {q.numberQuestion}
                  </div>

                  {/* Input Đáp án */}
                  <div className="flex-1">
                    {mode === "SUMMARY" ? (
                      <Input
                        placeholder={`Đáp án từ điền vào (Text)`}
                        value={q.answer_text}
                        onChange={(e) =>
                          handleChangeQuestion(
                            idx,
                            "answer_text",
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      <Select
                        className="w-full"
                        placeholder="Chọn đáp án từ Box"
                        value={q.selectedBoxKey}
                        onChange={(val) =>
                          handleChangeQuestion(idx, "selectedBoxKey", val)
                        }
                      >
                        {boxOptions.map((opt) => (
                          <Option key={opt.key} value={opt.key}>
                            <span className="font-bold text-blue-600 mr-2">
                              {opt.key}.
                            </span>
                            {opt.text || "(Trống)"}
                          </Option>
                        ))}
                      </Select>
                    )}
                  </div>

                  {/* Nút Chèn */}
                  <Tooltip
                    title={`Chèn vị trí [${q.numberQuestion}] vào đoạn văn`}
                  >
                    <Button
                      type="primary"
                      ghost
                      icon={<VerticalAlignTopOutlined />}
                      onClick={() => handleInsertPlaceholder(q.numberQuestion)}
                    >
                      Chèn
                    </Button>
                  </Tooltip>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Footer Save */}
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
