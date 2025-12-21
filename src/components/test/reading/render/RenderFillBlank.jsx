import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, ChevronDown } from "lucide-react"; // Thêm ChevronDown

// --- 1. SUB-COMPONENT: Ô Input (Hoặc Select) nằm trong đoạn văn ---
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

  // Logic Review
  let correctAnswerDisplay = "";
  if (isReviewMode) {
    if (isBoxMode) {
      const correctOpt = question.answers?.find(
        (a) => a.matching_value === "CORRECT"
      );
      correctAnswerDisplay = correctOpt?.matching_key || "N/A";
    } else {
      correctAnswerDisplay =
        question.correct_answers?.[0]?.answer_text || "N/A";
    }
  }

  const isCorrect = isReviewMode ? serverIsCorrect : false;

  // --- STYLE CHUNG (Gạch chân) ---
  let baseClass =
    "inline-block h-8 text-sm transition-all border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 px-2 text-center outline-none bg-transparent ";

  // Màu sắc khi Review
  if (isReviewMode) {
    baseClass += isCorrect
      ? "border-green-500 text-green-700 font-bold bg-green-50/50 "
      : "border-red-500 text-red-700 font-medium bg-red-50/50 ";
  } else {
    // Màu mặc định: Xám nhạt, hover đậm hơn, focus xanh
    baseClass +=
      "border-gray-300 hover:border-gray-400 focus:border-blue-600 focus:bg-blue-50/20 ";
  }

  return (
    <span className="inline-flex flex-col align-middle mx-1 relative group align-baseline">
      <span className="relative flex items-center justify-center">
        {isBoxMode ? (
          // --- CUSTOM DROPDOWN (Box Mode) ---
          <div className="relative inline-block">
            <select
              disabled={isReviewMode}
              value={localValue}
              onChange={handleChange}
              className={`${baseClass} w-[70px] appearance-none cursor-pointer font-semibold text-blue-700 pb-1`}
              style={{ textAlignLast: "center" }} // Căn giữa text trong select
            >
              <option value="" className="text-gray-400">
                Chọn
              </option>
              {boxOptions.map((opt) => (
                <option key={opt.matching_key} value={opt.matching_key}>
                  {opt.matching_key}
                </option>
              ))}
            </select>
            {/* Mũi tên Dropdown Custom */}
            {!isReviewMode && (
              <ChevronDown className="absolute right-0 top-2 w-3 h-3 text-gray-400 pointer-events-none" />
            )}
          </div>
        ) : (
          // --- INPUT THƯỜNG (Text Mode) ---
          <Input
            disabled={isReviewMode}
            value={localValue}
            onChange={handleChange}
            className={`${baseClass} w-[120px] pb-1`}
            placeholder={`(${question.question_number})`}
            autoComplete="off"
          />
        )}

        {/* Icon Đúng/Sai (Review Mode) */}
        {isReviewMode && (
          <span className="absolute -right-5 -top-2">
            {isCorrect ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 drop-shadow-sm" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 drop-shadow-sm" />
            )}
          </span>
        )}
      </span>

      {/* Tooltip hiển thị đáp án đúng khi sai */}
      {isReviewMode && !isCorrect && (
        <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-50 shadow-lg font-medium">
          Đáp án: {correctAnswerDisplay}
        </span>
      )}
    </span>
  );
};

// --- 2. SUB-COMPONENT: Câu hỏi rời (Sentence Item) ---
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

  useEffect(() => {
    setLocalAnswer(userValue || "");
  }, [userValue]);

  const handleChange = (e) => {
    onAnswerChange(question.question_id, e.target.value);
  };

  const correctAnswerText = question.correct_answers?.[0]?.answer_text;
  const isCorrect = isReviewMode ? serverIsCorrect : false;

  let containerClass =
    "mb-4 p-4 border rounded-lg transition-all duration-200 ";
  if (isReviewMode) {
    containerClass += isCorrect
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  } else {
    containerClass +=
      "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm";
  }

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-4 w-full">
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white shadow-sm shrink-0 ${
              isReviewMode
                ? isCorrect
                  ? "bg-green-500"
                  : "bg-red-500"
                : "bg-blue-600"
            }`}
          >
            {question.question_number}
          </span>
          <div className="flex-1 space-y-3">
            <div
              className="font-medium text-gray-800 text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: question.question_text }}
            />
            <Input
              disabled={isReviewMode}
              value={localAnswer}
              onChange={handleChange}
              placeholder="Nhập câu trả lời..."
              className={`max-w-md ${
                isReviewMode
                  ? isCorrect
                    ? "bg-white border-green-300 text-green-700"
                    : "bg-white border-red-300 text-red-700"
                  : "bg-gray-50 border-gray-300 focus:bg-white"
              }`}
            />
          </div>
        </div>
        {isReviewMode &&
          (isCorrect ? (
            <CheckCircle2 className="text-green-600 w-6 h-6 ml-2 shrink-0" />
          ) : (
            <XCircle className="text-red-500 w-6 h-6 ml-2 shrink-0" />
          ))}
      </div>
      {isReviewMode && !isCorrect && (
        <div className="mt-2 ml-12 text-sm">
          <span className="font-semibold text-gray-500">Đáp án đúng: </span>
          <span className="text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded border border-green-200">
            {correctAnswerText || "N/A"}
          </span>
        </div>
      )}
    </div>
  );
};

// --- 3. MAIN COMPONENT ---
const RenderFillBlank = ({
  questions,
  userAnswers = {},
  onAnswerChange,
  isReviewMode,
}) => {
  const getUserData = (qId) => userAnswers[qId] || "";

  const isSummaryMode = () => {
    if (!questions || questions.length === 0) return false;
    if (questions.length === 1 && questions[0].question_text?.length > 50)
      return true;
    if (questions.length > 1) {
      const firstContent = questions[0].question_text?.trim();
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

  if (isSummaryMode()) {
    const summaryContent = questions[0]?.question_text || "";
    const parts = summaryContent.split(/\[\s*(\d+)\s*\]/g);

    return (
      <div className="flex flex-col gap-8">
        {/* --- [FIX] DISPLAY OPTIONS (BOX) --- */}
        {hasBox && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-slate-700 text-sm  tracking-wider">
                Danh sách lựa chọn
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                {boxOptions.length} lựa chọn
              </span>
            </div>

            {/* GRID 2 CỘT CHO MỌI MÀN HÌNH (sm trở lên) */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {boxOptions.map((opt) => (
                <div
                  key={opt.matching_key}
                  className="flex items-start p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-100 text-blue-700 font-bold text-sm border border-blue-200 shrink-0 mr-3  transition-colors">
                    {opt.matching_key}
                  </span>
                  <span className="text-gray-700 text-sm leading-snug pt-1">
                    {opt.answer_text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SUMMARY CONTENT --- */}
        <div className="p-8 bg-white border border-gray-200 rounded-xl shadow-sm leading-loose text-gray-800 text-lg text-justify font-serif">
          {parts.map((part, index) => {
            if (index % 2 === 1) {
              const questionNum = parseInt(part);
              const question = questions.find(
                (q) => q.question_number === questionNum
              );

              if (question) {
                return (
                  <InlineInput
                    key={question.question_id}
                    question={question}
                    userAnswerData={getUserData(question.question_id)}
                    onAnswerChange={onAnswerChange}
                    isReviewMode={isReviewMode}
                    boxOptions={boxOptions}
                  />
                );
              }
              return (
                <span
                  key={index}
                  className="text-red-500 font-bold mx-1 px-2 border border-red-200 bg-red-50 rounded"
                >
                  [{part}]
                </span>
              );
            }
            return (
              <span key={index} dangerouslySetInnerHTML={{ __html: part }} />
            );
          })}
        </div>
      </div>
    );
  }

  // --- RENDER SENTENCE MODE ---
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
