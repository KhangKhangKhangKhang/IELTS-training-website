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
  const getUserAnswer = (qId) => userAnswers[qId];

  const commonProps = {
    onAnswerChange, // Component con sẽ gọi onAnswerChange(id, val, text)
    isReviewMode,
  };

  switch (group.type_question) {
    case "MCQ":
      return group.questions.map((q) => (
        <RenderMCQ
          key={q.question_id}
          question={q}
          userAnswer={getUserAnswer(q.question_id)}
          {...commonProps}
        />
      ));
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
    // ... Các case khác tương tự, chỉ cần truyền onAnswerChange xuống là được
    // Vì RenderTFNG, RenderShortAnswer mặc định trả về text = val nên không cần sửa
    case "TFNG":
      return group.questions.map((q) => (
        <RenderTFNG
          key={q.question_id}
          question={q}
          userAnswer={getUserAnswer(q.question_id)}
          {...commonProps}
        />
      ));
    case "YES_NO_NOTGIVEN":
      return group.questions.map((q) => (
        <RenderYesNoNotGiven
          key={q.question_id}
          question={q}
          userAnswer={getUserAnswer(q.question_id)}
          {...commonProps}
        />
      ));
    case "SHORT_ANSWER":
      return group.questions.map((q) => (
        <RenderShortAnswer
          key={q.question_id}
          question={q}
          userAnswer={getUserAnswer(q.question_id)}
          {...commonProps}
        />
      ));
    case "LABELING":
      return group.questions.map((q) => (
        <RenderLabeling
          key={q.question_id}
          question={q}
          userAnswer={getUserAnswer(q.question_id)}
          {...commonProps}
        />
      ));
    default:
      return (
        <div className="text-red-500">Unknown type: {group.type_question}</div>
      );
  }
};

export default QuestionRenderer;
