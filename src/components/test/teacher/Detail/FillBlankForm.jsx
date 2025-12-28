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
  InputNumber,
} from "antd";
import {
  SaveOutlined,
  VerticalAlignTopOutlined,
  PlusOutlined,
  DeleteOutlined,
  TableOutlined,
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

  // View/Edit mode states
  const [hasQuestionsLoaded, setHasQuestionsLoaded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadedQuestions, setLoadedQuestions] = useState([]);

  // Mode: "SENTENCE" | "SUMMARY" | "SUMMARY_BOX" | "TABLE"
  const [mode, setMode] = useState("SENTENCE");

  // State chung
  const [questions, setQuestions] = useState([]);
  const [summaryText, setSummaryText] = useState("");

  // State cho mode SUMMARY_BOX
  const [boxOptions, setBoxOptions] = useState([]);

  // State cho mode TABLE
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(2);
  // tableData is a 2D array: [ ["Cell 1-1", "Cell 1-2"], ... ]
  const [tableData, setTableData] = useState([
    ["", ""],
    ["", ""],
    ["", ""],
  ]);
  // Track focused cell to insert placeholder
  const [focusedCell, setFocusedCell] = useState({ r: 0, c: 0 });

  const textAreaRef = useRef(null);
  const quantity = groupData?.quantity || 1;

  useEffect(() => {
    if (idGroup) loadQuestions();
    else initFixedForm();
  }, [idGroup]);

  // --- 1. INIT & LOAD DATA ---

  const initFixedForm = () => {
    const initialQuestions = Array.from({ length: quantity }, (_, index) => ({
      idQuestion: null,
      content: "",
      answer_text: "",
      selectedBoxKey: null,
      numberQuestion: questionNumberOffset + index + 1,
    }));

    setQuestions(initialQuestions);
    setSummaryText("");
    setBoxOptions([
      { key: "A", text: "" },
      { key: "B", text: "" },
    ]);
    // Reset Table
    setTableData([
      ["", ""],
      ["", ""],
      ["", ""],
    ]);
    setTableRows(3);
    setTableCols(2);
    setMode("SENTENCE");
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await getQuestionsByIdGroupAPI(idGroup);
      const group = res?.data?.[0];

      if (!group || !group.question || group.question.length === 0) {
        initFixedForm();
        setLoadedQuestions([]);
        setHasQuestionsLoaded(false);
      } else {
        const questionsList = group.question;

        const fullQuestions = await Promise.all(
          questionsList.map(async (q) => {
            try {
              const ansRes = await getAnswersByIdQuestionAPI(q.idQuestion);
              const ansData = ansRes?.data || [];
              const correctAns = ansData.find(
                (a) => a.matching_value === "CORRECT"
              );

              return {
                ...q,
                answer_text: ansData[0]?.answer_text || "",
                selectedBoxKey: correctAns ? correctAns.matching_key : null,
                rawAnswers: ansData,
              };
            } catch (err) {
              return { ...q, answer_text: "" };
            }
          })
        );

        // Store loaded questions for VIEW MODE
        setLoadedQuestions(fullQuestions);
        setHasQuestionsLoaded(true);

        // Also populate for potential editing
        detectModeAndFillData(fullQuestions);
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi tải câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  // --- HTML TABLE PARSER HELPER ---
  const parseHTMLToTableData = (htmlString) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      const table = doc.querySelector("table");
      if (!table) return null;

      const rows = table.querySelectorAll("tr");
      const newGrid = [];
      let maxCols = 0;

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td, th");
        const rowData = [];
        cells.forEach((cell) => {
          // Keep inner HTML to preserve placeholders like [1]
          rowData.push(cell.innerHTML);
        });
        if (rowData.length > maxCols) maxCols = rowData.length;
        newGrid.push(rowData);
      });

      return { grid: newGrid, rows: newGrid.length, cols: maxCols };
    } catch (e) {
      console.error("Error parsing table HTML", e);
      return null;
    }
  };

  const detectModeAndFillData = (loadedQuestions) => {
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

      // 1. Detect TABLE Mode
      if (firstContent && firstContent.startsWith("<table")) {
        const parsed = parseHTMLToTableData(firstContent);
        if (parsed) {
          setMode("TABLE");
          setTableData(parsed.grid);
          setTableRows(parsed.rows);
          setTableCols(parsed.cols);
          setQuestions(processedQuestions);
          return;
        }
      }

      // 2. Detect SUMMARY_BOX Mode
      const hasKey = firstAnswers.some((a) => a.matching_key);
      if (hasKey) {
        setMode("SUMMARY_BOX");
        setSummaryText(firstContent);
        setQuestions(processedQuestions);

        const options = firstAnswers
          .map((a) => ({ key: a.matching_key, text: a.answer_text }))
          .sort((a, b) => a.key.localeCompare(b.key));

        setBoxOptions(
          options.length > 0
            ? options
            : [
              { key: "A", text: "" },
              { key: "B", text: "" },
            ]
        );
        return;
      }

      // 3. Detect SUMMARY Mode
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

  const handleEditGroup = () => {
    // Enter EDIT MODE
    setIsEditMode(true);
    setHasQuestionsLoaded(false);
    // Data already populated by detectModeAndFillData during load
  };

  const handleCancelEdit = () => {
    // Exit EDIT MODE, return to VIEW
    setIsEditMode(false);
    setHasQuestionsLoaded(true);
    // Reload to discard changes
    loadQuestions();
  };

  const handleChangeQuestion = (idx, field, val) => {
    const newQ = [...questions];
    newQ[idx][field] = val;
    setQuestions(newQ);
  };

  const handleDeleteQuestion = (idx) => {
    if (questions.length <= 1) {
      return message.warning("Cần có ít nhất 1 câu hỏi");
    }
    const newQ = questions.filter((_, i) => i !== idx);
    // Re-number remaining questions
    const renumbered = newQ.map((q, i) => ({
      ...q,
      numberQuestion: questionNumberOffset + i + 1,
    }));
    setQuestions(renumbered);
  };

  // -- SUMMARY HANDLER --
  const handleInsertPlaceholderSummary = (numberQuestion) => {
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

  // -- TABLE HANDLERS --
  const handleTableDimensionChange = (newR, newC) => {
    // Resize grid while keeping data
    const newGrid = [];
    for (let r = 0; r < newR; r++) {
      const row = [];
      for (let c = 0; c < newC; c++) {
        // Copy existing data if available
        if (tableData[r] && tableData[r][c] !== undefined) {
          row.push(tableData[r][c]);
        } else {
          row.push("");
        }
      }
      newGrid.push(row);
    }
    setTableRows(newR);
    setTableCols(newC);
    setTableData(newGrid);
  };

  const handleCellChange = (r, c, val) => {
    const newData = [...tableData];
    newData[r][c] = val;
    setTableData(newData);
  };

  const handleInsertPlaceholderTable = (numberQuestion) => {
    const { r, c } = focusedCell;
    const currentVal = tableData[r]?.[c] || "";
    // Insert simple [X] placeholder
    const newVal = currentVal + ` [${numberQuestion}] `;
    handleCellChange(r, c, newVal);
  };

  const generateTableHTML = () => {
    // Generate basic HTML table with inline styles
    let html = `<table border="1" style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">`;
    tableData.forEach((row, rIdx) => {
      // First row usually header in typical listening tasks, but let's keep it simple as tds
      // or implement a "Header Row" toggle later if needed.
      // Inline styles for cells
      const cellStyle =
        "padding: 8px; border: 1px solid #ddd; text-align: left;";
      const bgStyle = rIdx === 0 ? "background-color: #f2f2f2;" : ""; // Light grey for first row

      html += `<tr>`;
      row.forEach((cell) => {
        html += `<td style="${cellStyle} ${bgStyle}">${cell}</td>`;
      });
      html += `</tr>`;
    });
    html += `</table>`;
    return html;
  };

  // --- BOX OPTIONS HANDLERS ---
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
        if (boxOptions.some((o) => !o.text.trim())) {
          message.warning("Vui lòng điền đủ nội dung các lựa chọn trong Box");
          setSaving(false);
          return;
        }
        payload = questions.map((q) => {
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

      // --- LOGIC: TABLE (New) ---
      else if (mode === "TABLE") {
        // 1. Generate HTML from grid
        const tableHTML = generateTableHTML();

        // 2. Build payload (Similar to Summary)
        payload = questions.map((q) => ({
          idGroupOfQuestions: idGroup,
          idPart: groupData?.idPart,
          idQuestion: q.idQuestion || null,
          numberQuestion: q.numberQuestion,
          // !!! IMPORTANT: Content is the HTML Table string !!!
          content: tableHTML,
          answers: [
            {
              answer_text: q.answer_text,
              matching_key: null,
              matching_value: null,
            },
          ],
        }));
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

      // Reset edit mode and show VIEW MODE
      setIsEditMode(false);

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

  // ======== VIEW MODE: Display Loaded Questions ========
  if (hasQuestionsLoaded && !isEditMode && loadedQuestions.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Câu hỏi đã tạo ({loadedQuestions.length} câu)
            <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 font-normal">
              Mode: {mode === "SENTENCE" ? "Từng câu" : mode === "SUMMARY" ? "Summary (Điền từ)" : mode === "SUMMARY_BOX" ? "Summary (Chọn Box)" : "Table"}
            </span>
          </h3>
          <Button type="primary" onClick={handleEditGroup}>
            ✎ Chỉnh sửa
          </Button>
        </div>

        {/* Display based on mode */}
        {mode === "SENTENCE" && (
          <div className="space-y-3">
            {loadedQuestions.map((q, idx) => (
              <Card key={q.idQuestion || idx} size="small">
                <div className="font-semibold text-blue-600 mb-2">
                  Câu {q.numberQuestion}: <span dangerouslySetInnerHTML={{ __html: q.content }} />
                </div>
                <div className="text-sm text-gray-600">
                  Đáp án: <span className="font-medium">{q.answer_text}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {(mode === "SUMMARY" || mode === "SUMMARY_BOX") && (
          <div className="space-y-4">
            <Card title="Đoạn văn Summary" size="small">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: summaryText }}
              />
            </Card>

            {mode === "SUMMARY_BOX" && boxOptions.length > 0 && (
              <Card title="Danh sách lựa chọn (The Box)" size="small">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {boxOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 p-2 rounded border">
                      <span className="font-bold text-blue-600 w-8">{opt.key}.</span>
                      <span className="text-sm">{opt.text}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card title={`Đáp án (${loadedQuestions.length} câu)`} size="small">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {loadedQuestions.map((q, idx) => (
                  <div key={q.idQuestion || idx} className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-200">
                    <span className="font-bold text-blue-600 w-8">{q.numberQuestion}.</span>
                    <span className="text-sm font-medium">
                      {mode === "SUMMARY" ? q.answer_text : `${q.selectedBoxKey || "?"}`}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {mode === "TABLE" && (
          <div className="space-y-4">
            <Card title="Bảng biểu (Table)" size="small">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: loadedQuestions[0]?.content || "" }}
              />
            </Card>

            <Card title={`Đáp án (${loadedQuestions.length} câu)`} size="small">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {loadedQuestions.map((q, idx) => (
                  <div key={q.idQuestion || idx} className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-200">
                    <span className="font-bold text-blue-600 w-8">{q.numberQuestion}.</span>
                    <span className="text-sm font-medium">{q.answer_text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // ======== FORM MODE: Create or Edit ========
  return (
    <div className="space-y-5 pb-4">
      {/* 1. Switch Mode */}
      <div className="flex flex-col gap-4 border-b pb-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-700 dark:text-gray-200">Chế độ nhập:</span>
          <span className="text-gray-400 text-sm">
            Số lượng: <b>{quantity}</b> (câu {questions[0]?.numberQuestion} -{" "}
            {questions[questions.length - 1]?.numberQuestion})
          </span>
        </div>
        <Radio.Group
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          buttonStyle="solid"
          size="middle"
        >
          <Radio.Button value="SENTENCE">Từng câu</Radio.Button>
          <Radio.Button value="TABLE">Bảng (Table Completion)</Radio.Button>
          <Radio.Button value="SUMMARY">Summary (Điền từ)</Radio.Button>
          <Radio.Button value="SUMMARY_BOX">Summary (Chọn Box)</Radio.Button>
        </Radio.Group>
      </div>

      {/* 2. RENDER: TABLE EDITOR (Only in TABLE mode) */}
      {mode === "TABLE" && (
        <Card
          size="small"
          title={
            <div className="flex items-center gap-4">
              <TableOutlined />
              <span>Cấu hình bảng biểu</span>
            </div>
          }
          className="bg-blue-50 border-blue-200"
        >
          <div className="flex gap-4 items-center mb-4">
            <div>
              <span className="mr-2">Số dòng:</span>
              <InputNumber
                min={1}
                max={20}
                value={tableRows}
                onChange={(v) => handleTableDimensionChange(v, tableCols)}
              />
            </div>
            <div>
              <span className="mr-2">Số cột:</span>
              <InputNumber
                min={1}
                max={10}
                value={tableCols}
                onChange={(v) => handleTableDimensionChange(tableRows, v)}
              />
            </div>
            <div className="text-xs text-gray-500 italic ml-2">
              *Nhập dữ liệu vào ô và chèn vị trí câu hỏi
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 bg-white">
              <tbody>
                {tableData.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cellVal, cIdx) => (
                      <td
                        key={`${rIdx}-${cIdx}`}
                        className="border border-gray-300 p-1 min-w-[150px]"
                      >
                        <Input.TextArea
                          value={cellVal}
                          onChange={(e) =>
                            handleCellChange(rIdx, cIdx, e.target.value)
                          }
                          onFocus={() => setFocusedCell({ r: rIdx, c: cIdx })}
                          rows={2}
                          className="text-sm"
                          placeholder={`R${rIdx + 1} C${cIdx + 1}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 3. RENDER: BOX OPTIONS (Only in SUMMARY_BOX mode) */}
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

      {/* 4. CONTENT AREA (SUMMARY TEXT only) */}
      {(mode === "SUMMARY" || mode === "SUMMARY_BOX") && (
        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold text-gray-700 dark:text-gray-200">
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

      {/* 5. QUESTIONS LIST */}
      <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded border">
        <h4 className="font-semibold mb-3 text-gray-700">
          {mode === "SENTENCE"
            ? "Nhập câu hỏi & Đáp án:"
            : "Thiết lập đáp án & Vị trí:"}
        </h4>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className={`p-3 rounded border shadow-sm ${mode === "SENTENCE"
                ? "bg-gray-50 dark:bg-slate-700"
                : "bg-white flex items-center gap-2"
                }`}
            >
              {/* --- CASE: SENTENCE MODE --- */}
              {mode === "SENTENCE" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-gray-700 dark:text-gray-200">
                      Câu {q.numberQuestion}
                    </div>
                    {questions.length > 1 && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteQuestion(idx)}
                      >
                        Xóa
                      </Button>
                    )}
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

              {/* --- CASE: SUMMARY / SUMMARY_BOX / TABLE --- */}
              {mode !== "SENTENCE" && (
                <>
                  {/* Label số câu */}
                  <div className="font-bold text-gray-700 dark:text-gray-200 w-12 text-center bg-gray-100 dark:bg-slate-600 rounded py-2 shrink-0">
                    {q.numberQuestion}
                  </div>

                  {/* Input Đáp án */}
                  <div className="flex-1">
                    {mode === "SUMMARY" || mode === "TABLE" ? (
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
                    title={
                      mode === "TABLE"
                        ? `Chèn vào ô đang chọn`
                        : `Chèn vị trí [${q.numberQuestion}] vào đoạn văn`
                    }
                  >
                    <Button
                      type="primary"
                      ghost
                      icon={<VerticalAlignTopOutlined />}
                      onClick={() => {
                        if (mode === "TABLE") {
                          handleInsertPlaceholderTable(q.numberQuestion);
                        } else {
                          handleInsertPlaceholderSummary(q.numberQuestion);
                        }
                      }}
                    >
                      Chèn
                    </Button>
                  </Tooltip>

                  {/* Nút Xóa */}
                  {questions.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteQuestion(idx)}
                    >
                      Xóa
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Footer Save */}
      <div className="pt-4 mt-4 border-t flex justify-between items-center">
        {isEditMode && (
          <Button onClick={handleCancelEdit}>
            Hủy
          </Button>
        )}
        <div className={!isEditMode ? "w-full flex justify-end" : ""}>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            className="min-w-[150px]"
          >
            {isEditMode ? "Cập nhật" : "Lưu nhóm câu hỏi"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FillBlankForm;

