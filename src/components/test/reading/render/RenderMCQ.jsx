import React, { useMemo } from "react";
import { Checkbox } from "antd";
import { CheckCircle2, XCircle } from "lucide-react";

const RenderMCQ = ({
  question,
  onAnswerChange,
  userAnswer, // String (Single) hoặc Array (Multiple)
  isReviewMode,
  resultIsCorrect,
  isMultiple = false,
  correctKeysList = [], // Nhận danh sách full đáp án đúng từ cha: VD ["B", "C", "B", "C"]
}) => {
  // Check tổng thể: Nếu user làm sai hoặc thiếu -> false
  const isOverallCorrect = isReviewMode && resultIsCorrect === true;

  // --- [FIX] LỌC TRÙNG LẶP CHO PHẦN HIỂN THỊ FOOTER ---
  // Sử dụng Set để loại bỏ các key trùng nhau (VD: ['B', 'B'] -> ['B'])
  const uniqueCorrectKeys = useMemo(() => {
    return [...new Set(correctKeysList)].sort();
  }, [correctKeysList]);
  // ----------------------------------------------------

  // --- XỬ LÝ CHỌN NHIỀU ---
  const handleCheckboxChange = (key, checked) => {
    let currentAnswers = Array.isArray(userAnswer) ? [...userAnswer] : [];

    if (checked) {
      if (!currentAnswers.includes(key)) currentAnswers.push(key);
    } else {
      currentAnswers = currentAnswers.filter((k) => k !== key);
    }

    onAnswerChange(
      question.question_id,
      currentAnswers,
      currentAnswers.join(", ")
    );
  };

  // Container Class
  let containerClass = "mb-4 p-4 border rounded-xl transition-all duration-200 ";
  if (isReviewMode) {
    containerClass += isOverallCorrect
      ? "bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      : "bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  } else {
    containerClass += "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md";
  }

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <span
            className={`flex items-center justify-center min-w-[28px] h-7 rounded-lg px-2 text-xs font-bold text-white shadow-sm ${
              isReviewMode
                ? isOverallCorrect
                  ? "bg-green-500"
                  : "bg-red-500"
                : "bg-blue-600"
            }`}
          >
            {question.question_number}
          </span>
          <div
            className="font-medium text-slate-800 dark:text-slate-200 pt-0.5"
            dangerouslySetInnerHTML={{ __html: question.question_text }}
          />
        </div>
        {isReviewMode &&
          (isOverallCorrect ? (
            <CheckCircle2 className="text-green-600 dark:text-green-400 w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="text-red-500 dark:text-red-400 w-5 h-5 shrink-0" />
          ))}
      </div>

      <div className="space-y-2">
        {question.answers.map((answer) => {
          const key = answer.matching_key;
          let itemClass =
            "flex items-center space-x-3 p-3 rounded-lg border transition-all duration-150 ";

          // User có chọn key này không?
          const isSelected = isMultiple
            ? Array.isArray(userAnswer) && userAnswer.includes(key)
            : userAnswer === key;

          if (isReviewMode) {
            // Key này có phải là đáp án đúng không?
            // Dùng list gốc để tô màu (dù list gốc có trùng thì includes vẫn đúng)
            const isKeyActuallyCorrect = correctKeysList.includes(key);

            if (isSelected) {
              if (isKeyActuallyCorrect) {
                // User chọn + Đúng -> XANH
                itemClass +=
                  " bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-500 text-green-800 dark:text-green-200 font-medium";
              } else {
                // User chọn + Sai -> ĐỎ
                itemClass +=
                  " bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-500 text-red-800 dark:text-red-200 opacity-90";
              }
            } else {
              // User KHÔNG chọn
              if (isKeyActuallyCorrect) {
                // Đúng mà không chọn -> Viền xanh đứt đoạn (gợi ý)
                itemClass += " border-green-400 dark:border-green-500 border-dashed bg-green-50/50 dark:bg-green-900/30";
              } else {
                // Sai và không chọn -> Mờ nhẹ nhưng vẫn thấy được
                itemClass += " border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 opacity-60";
              }
            }
          } else {
            // Mode làm bài
            itemClass +=
              " border-slate-200 dark:border-slate-500 bg-white dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-600 hover:shadow-sm cursor-pointer";
            if (isSelected) itemClass += " !bg-blue-100 dark:!bg-blue-900/50 !border-blue-400 dark:!border-blue-500";
          }

          return (
            <div key={answer.answer_id} className={itemClass}>
              {isMultiple ? (
                <Checkbox
                  disabled={isReviewMode}
                  checked={isSelected}
                  onChange={(e) => handleCheckboxChange(key, e.target.checked)}
                >
                  <span
                    className={`font-bold min-w-[20px] ml-2 ${
                      isReviewMode &&
                      isSelected &&
                      !correctKeysList.includes(key)
                        ? "text-red-700"
                        : "text-gray-700"
                    }`}
                  >
                    {key}.
                  </span>
                  <span className="ml-1">{answer.answer_text}</span>
                </Checkbox>
              ) : (
                <div
                  className="flex items-center w-full"
                  onClick={() =>
                    !isReviewMode &&
                    onAnswerChange(
                      question.question_id,
                      key,
                      answer.answer_text
                    )
                  }
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${
                      isSelected ? "border-blue-600" : "border-gray-400"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <div className="text-sm cursor-pointer flex-1 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-slate-200 mr-2">{key}.</span>
                    {answer.answer_text}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- PHẦN HIỂN THỊ ĐÁP ÁN (FOOTER) --- */}
      {/* Logic: Nếu chưa đúng hoàn toàn -> Show list đáp án đúng (Đã lọc trùng) */}
      {isReviewMode && !isOverallCorrect && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-600 text-sm flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Đáp án đúng:</span>
          <div className="flex gap-2">
            {uniqueCorrectKeys.map((k) => (
              <span
                key={k}
                className="px-2.5 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 font-bold border border-green-300 dark:border-green-700 rounded-lg text-xs"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RenderMCQ;
