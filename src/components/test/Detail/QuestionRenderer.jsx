import React from "react";
import RenderMCQ from "./RenderMCQ";
import RenderFillBlank from "./RenderFillBlank";
import RenderMatching from "./RenderMatching";
import RenderTFNG from "./RenderTFNG";
import RenderYesNoNotGiven from "./RenderYesNoNotGiven";
import RenderShortAnswer from "./RenderShortAnswer";
import RenderLabeling from "./RenderLabeling";

/**
 * QuestionRenderer - Orchestrates rendering of different question types
 *
 * @param {Object} props
 * @param {Object} props.group - Question group data
 * @param {Function} props.onAnswerChange - Callback when answer changes
 * @param {Object} props.userAnswers - Map of questionId -> user answer data
 * @param {boolean} props.isReviewMode - Whether in review mode (shows correct/incorrect)
 * @param {boolean} props.isMultiple - Whether MCQ allows multiple selections
 * @param {Object} props.answerKeyData - Map of questionId -> { correctKeys, acceptedAnswers } (Review mode only)
 */
const QuestionRenderer = ({
  group,
  onAnswerChange,
  userAnswers = {},
  isReviewMode = false,
  isMultiple = false,
  answerKeyData = {}, // NEW: Injected answer key data for review mode
}) => {
  // Helper: Get user data for a single question
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

  // Helper: Get merged user values for grouped questions
  const getMergedUserValues = (subQuestions) => {
    const values = [];
    subQuestions.forEach((subQ) => {
      const data = userAnswers[subQ.question_id];
      if (data && data.value) {
        values.push(data.value);
      }
    });
    return values;
  };

  // Helper: Get correct keys from answerKeyData (Review mode only)
  const getCorrectKeysForQuestion = (questionId) => {
    if (!isReviewMode || !answerKeyData[questionId]) return [];
    return answerKeyData[questionId].correctKeys || [];
  };

  // Helper: Get all correct keys for a group of questions (Merged MCQ)
  const getAllCorrectKeysForGroup = (questions) => {
    if (!isReviewMode) return [];
    const allKeys = [];
    questions.forEach((q) => {
      const keys = getCorrectKeysForQuestion(q.question_id);
      allKeys.push(...keys);
    });
    return allKeys;
  };

  const commonProps = {
    onAnswerChange,
    isReviewMode,
    answerKeyData, // Pass down to child components
  };

  // --- [MERGED MCQ] Logic for grouped multiple choice ---
  if (group.type_question === "MCQ" && isMultiple) {
    const firstQ = group.questions[0];
    const lastQ = group.questions[group.questions.length - 1];

    // Create virtual merged question
    const mergedQuestion = {
      ...firstQ,
      question_id: `merged_${firstQ.question_id}`,
      question_number: `${firstQ.question_number} - ${lastQ.question_number}`,
      quantity: group.questions.length,
    };

    // Get current user selections
    const currentValues = getMergedUserValues(group.questions);

    // Calculate correctness for merged group (all sub-questions must be correct)
    const allCorrect = group.questions.every((q) => {
      const { resultIsCorrect } = getUserData(q.question_id);
      return resultIsCorrect;
    });

    // Get ALL correct keys from answerKeyData for the group (Review mode)
    const allCorrectKeys = getAllCorrectKeysForGroup(group.questions);

    return (
      <RenderMCQ
        key={firstQ.question_id}
        question={mergedQuestion}
        userAnswer={currentValues}
        isMultiple={true}
        resultIsCorrect={allCorrect}
        isReviewMode={isReviewMode}
        correctKeysList={allCorrectKeys}
        onAnswerChange={(fakeId, newValuesArray) => {
          // Sort values and assign sequentially to sub-questions
          const sortedValues = [...newValuesArray].sort();
          group.questions.forEach((subQ, idx) => {
            const val = sortedValues[idx] || null;
            onAnswerChange(subQ.question_id, val, null);
          });
        }}
      />
    );
  }

  // --- SWITCH CASE for different question types ---
  switch (group.type_question) {
    case "MCQ":
      return group.questions.map((q) => {
        const { value, resultIsCorrect } = getUserData(q.question_id);
        // Get correct keys from answerKeyData instead of question.correct_answers
        const correctKeys = getCorrectKeysForQuestion(q.question_id);

        return (
          <RenderMCQ
            key={q.question_id}
            question={q}
            userAnswer={value}
            resultIsCorrect={resultIsCorrect}
            isMultiple={false}
            correctKeysList={correctKeys}
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
        const correctKeys = getCorrectKeysForQuestion(q.question_id);
        return (
          <RenderTFNG
            key={q.question_id}
            question={q}
            userAnswer={value}
            resultIsCorrect={resultIsCorrect}
            correctKeysList={correctKeys}
            {...commonProps}
          />
        );
      });

    case "YES_NO_NOTGIVEN":
      return group.questions.map((q) => {
        const { value, resultIsCorrect } = getUserData(q.question_id);
        const correctKeys = getCorrectKeysForQuestion(q.question_id);
        return (
          <RenderYesNoNotGiven
            key={q.question_id}
            question={q}
            userAnswer={value}
            resultIsCorrect={resultIsCorrect}
            correctKeysList={correctKeys}
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
      return (
        <RenderLabeling
          group={group}
          userAnswers={userAnswers}
          {...commonProps}
        />
      );

    default:
      return (
        <div className="text-red-500">Unknown type: {group.type_question}</div>
      );
  }
};

export default QuestionRenderer;

