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
  let containerClass = "mb-4 p-4 border rounded-lg transition-colors ";
  if (isReviewMode) {
    containerClass += isOverallCorrect
      ? "bg-green-50/30 border-green-200"
      : "bg-red-50/30 border-red-200";
  } else {
    containerClass += "bg-slate-50 border-gray-200 hover:border-blue-300";
  }

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <span
            className={`flex items-center justify-center min-w-[24px] h-6 rounded px-2 text-xs font-bold text-white shadow-sm ${
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
            className="font-medium text-gray-800"
            dangerouslySetInnerHTML={{ __html: question.question_text }}
          />
        </div>
        {isReviewMode &&
          (isOverallCorrect ? (
            <CheckCircle2 className="text-green-600 w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="text-red-500 w-5 h-5 shrink-0" />
          ))}
      </div>

      <div className="space-y-2">
        {question.answers.map((answer) => {
          const key = answer.matching_key;
          let itemClass =
            "flex items-center space-x-3 p-2 rounded border transition-all ";

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
                  " bg-green-100 border-green-400 text-green-800 font-medium";
              } else {
                // User chọn + Sai -> ĐỎ
                itemClass +=
                  " bg-red-100 border-red-300 text-red-800 opacity-90";
              }
            } else {
              // User KHÔNG chọn
              if (isKeyActuallyCorrect) {
                // Đúng mà không chọn -> Viền xanh đứt đoạn (gợi ý)
                itemClass += " border-green-300 border-dashed bg-green-50/30";
              } else {
                // Sai và không chọn -> Mờ đi
                itemClass += " border-transparent opacity-50 grayscale-[0.5]";
              }
            }
          } else {
            // Mode làm bài
            itemClass +=
              " border-transparent hover:bg-white hover:shadow-sm cursor-pointer";
            if (isSelected) itemClass += " bg-blue-50 border-blue-200";
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
                  <div className="text-sm cursor-pointer flex-1">
                    <span className="font-bold text-gray-700 mr-2">{key}.</span>
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
        <div className="mt-3 text-sm flex items-center gap-2">
          <span className="text-gray-500 font-medium">Đáp án đúng:</span>
          <div className="flex gap-2">
            {uniqueCorrectKeys.map((k) => (
              <span
                key={k}
                className="px-2 py-0.5 bg-green-100 text-green-700 font-bold border border-green-300 rounded text-xs"
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
