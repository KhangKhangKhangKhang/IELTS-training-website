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
}) => {
  // Helper để lấy data an toàn
  // Nếu là Review Mode, data có dạng { value: "A", isCorrect: true/false }
  // Nếu là Doing Mode, data có dạng { value: "A", ... }
  const getUserData = (qId) => {
    const data = userAnswers[qId];
    if (!data) return { value: "", resultIsCorrect: false };

    // Check nếu data là object có property value
    if (typeof data === "object" && data !== null) {
      return {
        value: data.value,
        resultIsCorrect: data.isCorrect, // Lấy trạng thái đúng sai từ API
      };
    }
    // Fallback cho trường hợp cũ (nếu có)
    return { value: data, resultIsCorrect: false };
  };

  const commonProps = {
    onAnswerChange,
    isReviewMode,
  };

  switch (group.type_question) {
    case "MCQ":
      return group.questions.map((q) => {
        const { value, resultIsCorrect } = getUserData(q.question_id);
        return (
          <RenderMCQ
            key={q.question_id}
            question={q}
            userAnswer={value}
            resultIsCorrect={resultIsCorrect} // Truyền xuống
            {...commonProps}
          />
        );
      });
    case "FILL_BLANK":
      return (
        <RenderFillBlank
          questions={group.questions}
          userAnswers={userAnswers} // Component này xử lý hơi khác, xem bên dưới
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
