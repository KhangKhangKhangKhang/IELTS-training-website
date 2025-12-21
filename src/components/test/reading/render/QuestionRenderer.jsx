import React from "react";
import RenderMCQ from "./RenderMCQ";
import RenderFillBlank from "./RenderFillBlank";
import RenderMatching from "./RenderMatching";
import RenderTFNG from "./RenderTFNG";
import RenderYesNoNotGiven from "./RenderYesNoNotGiven";
import RenderShortAnswer from "./RenderShortAnswer";
import RenderLabeling from "./RenderLabeling";

const QuestionRenderer = ({
  group,
  onAnswerChange,
  userAnswers = {},
  isReviewMode = false,
  isMultiple = false,
}) => {
  // Helper lấy data cho Single Question
  const getUserData = (qId) => {
    const data = userAnswers[qId];
    if (!data) return { value: "", resultIsCorrect: false };

    if (typeof data === "object" && data !== null) {
      return {
        value: data.value,
        resultIsCorrect: data.isCorrect,
      };
    }
    return { value: data, resultIsCorrect: false };
  };

  // Helper lấy data cho Merged Question: Gom tất cả value từ các câu con
  const getMergedUserValues = (subQuestions) => {
    const values = [];
    subQuestions.forEach((subQ) => {
      const data = userAnswers[subQ.question_id];
      if (data && data.value) {
        values.push(data.value);
      }
    });
    return values; // VD: ["A", "C"]
  };

  const commonProps = {
    onAnswerChange,
    isReviewMode,
  };

  // --- [QUAN TRỌNG] LOGIC GỘP CÂU HỎI (MULTIPLE CHOICE) ---
  // Nếu là MCQ và cờ isMultiple bật -> Render 1 component duy nhất
  if (group.type_question === "MCQ" && isMultiple) {
    const firstQ = group.questions[0];
    const lastQ = group.questions[group.questions.length - 1];

    // Tạo object câu hỏi ảo đại diện cho cả nhóm
    const mergedQuestion = {
      ...firstQ,
      question_id: `merged_${firstQ.question_id}`, // ID ảo
      question_number: `${firstQ.question_number} - ${lastQ.question_number}`, // VD: 17 - 18
      quantity: group.questions.length, // Số lượng câu hỏi (2 câu)
    };

    // Lấy đáp án hiện tại user đã chọn cho các câu con
    const currentValues = getMergedUserValues(group.questions);

    // Tính toán đúng/sai cho nhóm gộp (Review mode)
    // Tạm tính: Nếu tất cả câu con đều đúng -> Gộp đúng
    const allCorrect = group.questions.every((q) => {
      const { resultIsCorrect } = getUserData(q.question_id);
      return resultIsCorrect;
    });

    return (
      <RenderMCQ
        key={firstQ.question_id}
        question={mergedQuestion}
        userAnswer={currentValues} // Truyền mảng ["A", "B"]
        isMultiple={true}
        resultIsCorrect={allCorrect}
        isReviewMode={isReviewMode}
        // --- LOGIC PHÂN PHỐI (REVERSE MAPPING) ---
        onAnswerChange={(fakeId, newValuesArray) => {
          // newValuesArray = ["B", "A"] -> Sort thành ["A", "B"] để điền tuần tự
          const sortedValues = [...newValuesArray].sort();

          group.questions.forEach((subQ, idx) => {
            const val = sortedValues[idx] || null; // null nếu user bỏ chọn bớt
            // Gọi hàm update gốc cho từng ID câu hỏi thật
            // VD: Câu 17 nhận 'A', Câu 18 nhận 'B'
            onAnswerChange(subQ.question_id, val, null);
          });
        }}
      />
    );
  }

  // --- SWITCH CASE CÁC DẠNG CÂU HỎI KHÁC ---
  switch (group.type_question) {
    case "MCQ":
      return group.questions.map((q) => {
        const { value, resultIsCorrect } = getUserData(q.question_id);
        return (
          <RenderMCQ
            key={q.question_id}
            question={q}
            userAnswer={value}
            resultIsCorrect={resultIsCorrect}
            isMultiple={false} // Force false cho single MCQ
            {...commonProps}
          />
        );
      });

    case "FILL_BLANK":
      return (
        <RenderFillBlank
          questions={group.questions}
          userAnswers={userAnswers}
          {...commonProps}
        />
      );
    case "MATCHING":
      return (
        <RenderMatching
          group={group}
          userAnswers={userAnswers}
          {...commonProps}
        />
      );
    case "TFNG":
      return group.questions.map((q) => {
        const { value, resultIsCorrect } = getUserData(q.question_id);
        return (
          <RenderTFNG
            key={q.question_id}
            question={q}
            userAnswer={value}
            resultIsCorrect={resultIsCorrect}
            {...commonProps}
          />
        );
      });
    case "YES_NO_NOTGIVEN":
      return group.questions.map((q) => {
        const { value, resultIsCorrect } = getUserData(q.question_id);
        return (
          <RenderYesNoNotGiven
            key={q.question_id}
            question={q}
            userAnswer={value}
            resultIsCorrect={resultIsCorrect}
            {...commonProps}
          />
        );
      });
    case "SHORT_ANSWER":
      return group.questions.map((q) => {
        const { value, resultIsCorrect } = getUserData(q.question_id);
        return (
          <RenderShortAnswer
            key={q.question_id}
            question={q}
            userAnswer={value}
            resultIsCorrect={resultIsCorrect}
            {...commonProps}
          />
        );
      });
    case "LABELING":
      return group.questions.map((q) => {
        const { value, resultIsCorrect } = getUserData(q.question_id);
        return (
          <RenderLabeling
            key={q.question_id}
            question={q}
            userAnswer={value}
            resultIsCorrect={resultIsCorrect}
            {...commonProps}
          />
        );
      });
    default:
      return (
        <div className="text-red-500">Unknown type: {group.type_question}</div>
      );
  }
};

export default QuestionRenderer;
