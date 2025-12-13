import React from "react";
import RenderMCQ from "./RenderMCQ";
import RenderFillBlank from "./RenderFillBlank";
import RenderMatching from "./RenderMatching";
import RenderTFNG from "./RenderTFNG";
import RenderYesNoNotGiven from "./RenderYesNoNotGiven";
import RenderShortAnswer from "./RenderShortAnswer";
import RenderLabeling from "./RenderLabeling";

const QuestionRenderer = ({ group, onAnswerChange }) => {
  switch (group.type_question) {
    case "MCQ":
      return group.questions.map((question) => (
        <RenderMCQ
          key={question.question_id}
          question={question}
          onAnswerChange={onAnswerChange}
        />
      ));
    case "FILL_BLANK":
      return group.questions.map((question) => (
        <RenderFillBlank
          key={question.question_id}
          question={question}
          onAnswerChange={onAnswerChange}
        />
      ));
    case "MATCHING":
      return <RenderMatching group={group} onAnswerChange={onAnswerChange} />;
    case "TFNG":
      return group.questions.map((question) => (
        <RenderTFNG
          key={question.question_id}
          question={question}
          onAnswerChange={onAnswerChange}
        />
      ));
    case "YES_NO_NOT_GIVEN":
      return group.questions.map((question) => (
        <RenderYesNoNotGiven
          key={question.question_id}
          question={question}
          onAnswerChange={onAnswerChange}
        />
      ));
    case "SHORT_ANSWER":
      return group.questions.map((question) => (
        <RenderShortAnswer
          key={question.question_id}
          question={question}
          onAnswerChange={onAnswerChange}
        />
      ));
    case "LABELING":
      return group.questions.map((question) => (
        <RenderLabeling
          key={question.question_id}
          question={question}
          onAnswerChange={onAnswerChange}
        />
      ));
    default:
      return (
        <div className="mb-4 p-4 border rounded-md bg-slate-50">
          <p>Unknown question type: {group.type_question}</p>
        </div>
      );
  }
};

export default QuestionRenderer;
