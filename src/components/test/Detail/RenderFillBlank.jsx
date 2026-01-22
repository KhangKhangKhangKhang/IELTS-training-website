import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";
import { Tooltip } from "antd";

// --- 1. SUB-COMPONENT: Inline Input ---
const InlineInput = ({
  question,
  userAnswerData,
  onAnswerChange,
  isReviewMode,
  boxOptions = [],
  answerKeyData = {}, // NEW: Injected answer key for review mode
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
    // Use server-graded result
    isCorrect = serverIsCorrect;

    // Get correct answer display from answerKeyData (injected in review mode)
    const keyData = answerKeyData[question.question_id];

    if (isBoxMode) {
      // Box mode: Show correct key(s)
      const correctKeys = keyData?.correctKeys || [];
      correctAnswerDisplay = correctKeys.length > 0 ? correctKeys.join(" / ") : "N/A";
    } else {
      // Text input mode: Show ALL accepted answers joined with ' / '
      const acceptedAnswers = keyData?.acceptedAnswers || [];
      if (acceptedAnswers.length > 0) {
        correctAnswerDisplay = acceptedAnswers.join(" / ");
      } else {
        // Fallback if answerKeyData not available
        correctAnswerDisplay = question.answers?.[0]?.answer_text || "N/A";
      }
    }
  }

  // --- STYLING ---
  let inputClass =
    "inline-block text-sm transition-all border-b-2 border-t-0 border-x-0 rounded-sm focus:ring-0 px-2 text-center outline-none ";

  if (isReviewMode) {
    inputClass += isCorrect
      ? "border-green-500 text-green-700 dark:text-green-300 font-bold bg-green-50 dark:bg-green-900/50 "
      : "border-red-500 text-red-700 dark:text-red-300 font-medium bg-red-50 dark:bg-red-900/50 ";
  } else {
    inputClass +=
      "border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white hover:border-blue-500 dark:hover:border-blue-400 focus:border-blue-600 focus:bg-blue-50 dark:focus:bg-blue-900/50 ";
  }

  // Component hiển thị Input hoặc Select
  const InputElement = isBoxMode ? (
    <div className="relative inline-block">
      <select
        disabled={isReviewMode}
        value={localValue}
        onChange={handleChange}
        className={`${inputClass} min-w-[60px] appearance-none cursor-pointer font-semibold dark:text-blue-300 pb-0.5 h-7`}
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
            <XCircle className="w-4 h-4 text-red-500 dark:text-red-400 ml-1 shrink-0" />
          </span>
        </Tooltip>
      ) : (
        <span className="relative flex items-center">
          {InputElement}
          {isReviewMode && isCorrect && (
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 ml-1 shrink-0" />
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
  answerKeyData = {}, // NEW: Injected answer key for review mode
}) => {
  const userValue =
    typeof userAnswerData === "object" ? userAnswerData?.value : userAnswerData;
  const serverIsCorrect =
    typeof userAnswerData === "object" ? userAnswerData?.isCorrect : false;
  const [localAnswer, setLocalAnswer] = useState(userValue || "");

  useEffect(() => setLocalAnswer(userValue || ""), [userValue]);
  const handleChange = (e) =>
    onAnswerChange(question.question_id, e.target.value);

  // Get ALL accepted answers from answerKeyData (joined with ' / ')
  const keyData = answerKeyData[question.question_id];
  const acceptedAnswers = keyData?.acceptedAnswers || [];
  const correctAnswerText = acceptedAnswers.length > 0
    ? acceptedAnswers.join(" / ")
    : question.answers?.[0]?.answer_text || "N/A";
  const isCorrect = isReviewMode ? serverIsCorrect : false;

  return (
    <div
      className={`mb-4 p-4 border rounded-xl transition-all ${isReviewMode
        ? isCorrect
          ? "bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
        }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-4 w-full">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm shrink-0">
            {question.question_number}
          </span>
          <div className="flex-1 space-y-3">
            <div
              className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: question.question_text }}
            />
            <div className="flex items-center gap-2">
              <Input
                disabled={isReviewMode}
                value={localAnswer}
                onChange={handleChange}
                placeholder="Nhập câu trả lời..."
                className="max-w-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200"
              />
              {isReviewMode &&
                (isCorrect ? (
                  <CheckCircle2 className="text-green-600 dark:text-green-400 w-5 h-5" />
                ) : (
                  <XCircle className="text-red-500 dark:text-red-400 w-5 h-5" />
                ))}
            </div>
          </div>
        </div>
      </div>
      {isReviewMode && !isCorrect && (
        <div className="mt-2 ml-12 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-red-100 dark:border-red-800 inline-block">
          Đáp án đúng:{" "}
          <span className="font-bold text-green-700 dark:text-green-400">{correctAnswerText}</span>
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
  answerKeyData = {}, // NEW: Injected answer key for review mode
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
                answerKeyData={answerKeyData}
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
  answerKeyData = {}, // NEW: Injected answer key for review mode
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
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                Danh sách lựa chọn
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {boxOptions.length} lựa chọn
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {boxOptions.map((opt) => (
                <div
                  key={opt.matching_key}
                  className="flex items-center p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm text-xs"
                >
                  <span className="font-bold text-blue-700 dark:text-blue-400 min-w-[20px] text-center">
                    {opt.matching_key}
                  </span>
                  <span
                    className="border-l border-slate-300 dark:border-slate-600 pl-2 ml-1 truncate text-slate-700 dark:text-slate-300"
                    title={opt.answer_text}
                  >
                    {opt.answer_text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-slate-800 dark:text-slate-200 text-lg">
          <HtmlTableParser
            htmlContent={htmlContent}
            questions={questions}
            userAnswers={userAnswers}
            onAnswerChange={onAnswerChange}
            isReviewMode={isReviewMode}
            boxOptions={boxOptions}
            answerKeyData={answerKeyData}
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
          answerKeyData={answerKeyData}
        />
      ))}
    </div>
  );
};

export default RenderFillBlank;
