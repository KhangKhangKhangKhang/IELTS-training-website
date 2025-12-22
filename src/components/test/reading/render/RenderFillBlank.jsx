import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";
import { Tooltip } from "antd"; // Dùng Tooltip của Antd cho đẹp và không bị lỗi layout

// --- 1. SUB-COMPONENT: Inline Input ---
const InlineInput = ({
  question,
  userAnswerData,
  onAnswerChange,
  isReviewMode,
  boxOptions = [],
}) => {
  const userValue =
    typeof userAnswerData === "object" ? userAnswerData?.value : userAnswerData;
  const serverIsCorrect =
    typeof userAnswerData === "object" ? userAnswerData?.isCorrect : false;

  const [localValue, setLocalValue] = useState(userValue || "");

  useEffect(() => {
    setLocalValue(userValue || "");
  }, [userValue]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    onAnswerChange(question.question_id, val);
  };

  const isBoxMode = boxOptions.length > 0;

  // --- REVIEW LOGIC ---
  let correctAnswerDisplay = "";
  let isCorrect = false;

  if (isReviewMode) {
    // Nếu server đã chấm (có resultIsCorrect) thì dùng luôn
    isCorrect = serverIsCorrect;

    // Lấy text đáp án đúng để hiển thị
    if (isBoxMode) {
      // Dạng Box: Lấy Key đúng (A, B...)
      const correctOpt = question.answers?.find(
        (a) => a.matching_value === "CORRECT"
      );
      correctAnswerDisplay = correctOpt?.matching_key || "N/A";
    } else {
      // Dạng điền từ: Lấy text đáp án đầu tiên trong list correct_answers
      const correctObj = question.correct_answers?.[0];
      correctAnswerDisplay =
        correctObj?.answer_text || correctObj?.matching_key || "N/A";

      // Fallback: Nếu không có correct_answers riêng, lấy answer đầu tiên trong list answers
      if (correctAnswerDisplay === "N/A" && question.answers?.length > 0) {
        correctAnswerDisplay = question.answers[0].answer_text;
      }
    }
  }

  // --- STYLING ---
  let inputClass =
    "inline-block text-sm transition-all border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 px-2 text-center outline-none bg-transparent ";

  if (isReviewMode) {
    inputClass += isCorrect
      ? "border-green-500 text-green-700 font-bold bg-green-50 "
      : "border-red-500 text-red-700 font-medium bg-red-50 ";
  } else {
    inputClass +=
      "border-gray-300 hover:border-gray-400 focus:border-blue-600 focus:bg-blue-50/20 ";
  }

  // Component hiển thị Input hoặc Select
  const InputElement = isBoxMode ? (
    <div className="relative inline-block">
      <select
        disabled={isReviewMode}
        value={localValue}
        onChange={handleChange}
        className={`${inputClass} min-w-[60px] appearance-none cursor-pointer font-semibold text-blue-700 pb-0.5 h-7`}
        style={{ textAlignLast: "center" }}
      >
        <option value="" className="text-gray-400">
          -
        </option>
        {boxOptions.map((opt) => (
          <option key={opt.matching_key} value={opt.matching_key}>
            {opt.matching_key}
          </option>
        ))}
      </select>
    </div>
  ) : (
    <Input
      disabled={isReviewMode}
      value={localValue}
      onChange={handleChange}
      className={`${inputClass} min-w-[80px] w-auto h-7 pb-0.5`}
      placeholder={`(${question.question_number})`}
      autoComplete="off"
      style={{ padding: "0 5px" }}
    />
  );

  return (
    <span className="inline-flex items-center align-bottom mx-1 relative group">
      {/* Nếu sai thì bọc Tooltip hiển thị đáp án đúng */}
      {isReviewMode && !isCorrect ? (
        <Tooltip
          title={
            <span className="font-bold">Đúng: {correctAnswerDisplay}</span>
          }
          color="#108ee9"
          placement="top"
          zIndex={9999} // Đảm bảo nổi lên trên cùng
        >
          <span className="relative flex items-center">
            {InputElement}
            <XCircle className="w-4 h-4 text-red-500 ml-1 shrink-0" />
          </span>
        </Tooltip>
      ) : (
        <span className="relative flex items-center">
          {InputElement}
          {isReviewMode && isCorrect && (
            <CheckCircle2 className="w-4 h-4 text-green-600 ml-1 shrink-0" />
          )}
        </span>
      )}
    </span>
  );
};

// --- 2. SUB-COMPONENT: Sentence Item (Normal) ---
const SentenceItem = ({
  question,
  userAnswerData,
  onAnswerChange,
  isReviewMode,
}) => {
  const userValue =
    typeof userAnswerData === "object" ? userAnswerData?.value : userAnswerData;
  const serverIsCorrect =
    typeof userAnswerData === "object" ? userAnswerData?.isCorrect : false;
  const [localAnswer, setLocalAnswer] = useState(userValue || "");

  useEffect(() => setLocalAnswer(userValue || ""), [userValue]);
  const handleChange = (e) =>
    onAnswerChange(question.question_id, e.target.value);

  const correctAnswerText =
    question.correct_answers?.[0]?.answer_text ||
    question.answers?.[0]?.answer_text;
  const isCorrect = isReviewMode ? serverIsCorrect : false;

  return (
    <div
      className={`mb-4 p-4 border rounded-lg transition-all ${
        isReviewMode
          ? isCorrect
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-4 w-full">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm shrink-0">
            {question.question_number}
          </span>
          <div className="flex-1 space-y-3">
            <div
              className="font-medium text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: question.question_text }}
            />
            <div className="flex items-center gap-2">
              <Input
                disabled={isReviewMode}
                value={localAnswer}
                onChange={handleChange}
                placeholder="Nhập câu trả lời..."
                className="max-w-md bg-white"
              />
              {isReviewMode &&
                (isCorrect ? (
                  <CheckCircle2 className="text-green-600 w-5 h-5" />
                ) : (
                  <XCircle className="text-red-500 w-5 h-5" />
                ))}
            </div>
          </div>
        </div>
      </div>
      {isReviewMode && !isCorrect && (
        <div className="mt-2 ml-12 text-sm text-gray-600 bg-white p-2 rounded border border-red-100 inline-block">
          Đáp án đúng:{" "}
          <span className="font-bold text-green-700">{correctAnswerText}</span>
        </div>
      )}
    </div>
  );
};

// --- 3. [NEW] TABLE/HTML PARSER COMPONENT ---
const HtmlTableParser = ({
  htmlContent,
  questions,
  userAnswers,
  onAnswerChange,
  isReviewMode,
  boxOptions,
}) => {
  const getQuestionByNumber = (num) =>
    questions.find((q) => q.question_number === parseInt(num));
  const getUserData = (qId) => userAnswers[qId] || "";

  const renderNode = (node, index) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const parts = text.split(/\[\s*(\d+)\s*\]/g);

      if (parts.length === 1) return text;

      return parts.map((part, i) => {
        if (i % 2 === 1) {
          const qNum = part;
          const question = getQuestionByNumber(qNum);
          if (question) {
            return (
              <InlineInput
                key={`q-${question.question_id}`}
                question={question}
                userAnswerData={getUserData(question.question_id)}
                onAnswerChange={onAnswerChange}
                isReviewMode={isReviewMode}
                boxOptions={boxOptions}
              />
            );
          }
          return (
            <span key={i} className="text-red-500 font-bold">
              [{qNum}]
            </span>
          );
        }
        return part;
      });
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes).map(renderNode);
      const props = { key: index };

      Array.from(node.attributes).forEach((attr) => {
        if (attr.name === "style") {
          props.style = attr.value.split(";").reduce((acc, rule) => {
            const [key, val] = rule.split(":");
            if (key && val) {
              const camelKey = key
                .trim()
                .replace(/-([a-z])/g, (g) => g[1].toUpperCase());
              acc[camelKey] = val.trim();
            }
            return acc;
          }, {});
        } else if (attr.name === "class") {
          props.className = attr.value;
        } else {
          props[attr.name] = attr.value;
        }
      });

      return React.createElement(tagName, props, children);
    }
    return null;
  };

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const nodes = Array.from(doc.body.childNodes);

  return (
    <div className="html-parser-output overflow-x-auto leading-8">
      {nodes.map(renderNode)}
    </div>
  );
};

// --- 4. MAIN COMPONENT ---
const RenderFillBlank = ({
  questions,
  userAnswers = {},
  onAnswerChange,
  isReviewMode,
}) => {
  const getUserData = (qId) => userAnswers[qId] || "";

  const isGroupMode = () => {
    if (!questions || questions.length === 0) return false;
    const firstContent = questions[0].question_text?.trim() || "";
    if (firstContent.startsWith("<table") || firstContent.length > 50)
      return true;
    if (questions.length > 1) {
      return questions.every((q) => q.question_text?.trim() === firstContent);
    }
    return false;
  };

  const getBoxOptions = () => {
    if (!questions || questions.length === 0) return [];
    const firstQ = questions[0];
    const options = (firstQ.answers || []).filter((a) => a.matching_key);
    return options.sort((a, b) =>
      (a.matching_key || "").localeCompare(b.matching_key || "")
    );
  };

  const boxOptions = getBoxOptions();
  const hasBox = boxOptions.length > 0;
  const isGroup = isGroupMode();

  if (isGroup) {
    const htmlContent = questions[0]?.question_text || "";

    return (
      <div className="flex flex-col gap-8">
        {hasBox && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-slate-700 text-sm">
                Danh sách lựa chọn
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                {boxOptions.length} lựa chọn
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {boxOptions.map((opt) => (
                <div
                  key={opt.matching_key}
                  className="flex items-center p-1.5 bg-white border rounded shadow-sm text-xs"
                >
                  <span className="font-bold text-blue-700 min-w-[20px] text-center">
                    {opt.matching_key}
                  </span>
                  <span
                    className="border-l pl-2 ml-1 truncate"
                    title={opt.answer_text}
                  >
                    {opt.answer_text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-800 text-lg">
          <HtmlTableParser
            htmlContent={htmlContent}
            questions={questions}
            userAnswers={userAnswers}
            onAnswerChange={onAnswerChange}
            isReviewMode={isReviewMode}
            boxOptions={boxOptions}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <SentenceItem
          key={q.question_id}
          question={q}
          userAnswerData={getUserData(q.question_id)}
          onAnswerChange={onAnswerChange}
          isReviewMode={isReviewMode}
        />
      ))}
    </div>
  );
};

export default RenderFillBlank;
