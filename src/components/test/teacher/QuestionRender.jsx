// src/components/test/teacher/shared/QuestionTypeRenderer.jsx
import React from "react";
import MCQForm from "@/components/test/teacher/Detail/MCQForm";
import TFNGForm from "@/components/test/teacher/Detail/TFNGForm";
import YesNoNotGivenForm from "@/components/test/teacher/Detail/YesNoNotGivenForm";
import FillBlankForm from "@/components/test/teacher/Detail/FillBlankForm";
import ShortAnswerForm from "@/components/test/teacher/Detail/ShortAnswerForm";
import LabelingForm from "@/components/test/teacher/Detail/LabelingForm";
import MatchingForm from "@/components/test/teacher/Detail/MatchingForm";
import OtherForm from "@/components/test/teacher/Detail/OtherForm";

const QuestionTypeRenderer = ({
  type,
  idGroup,
  groupData,
  questionNumberOffset,
}) => {
  if (!type || !idGroup)
    return (
      <>
        <h1>Không có dữ liệu</h1>
      </>
    );

  const passProps = {
    idGroup,
    groupData,
    questionNumberOffset,
  };

  switch (type) {
    case "MCQ":
      return <MCQForm {...passProps} />;
    case "TFNG":
      return <TFNGForm {...passProps} />;
    case "YES_NO_NOTGIVEN":
      return <YesNoNotGivenForm {...passProps} />;
    case "MATCHING":
      return <MatchingForm {...passProps} />;
    case "FILL_BLANK":
      return <FillBlankForm {...passProps} />;
    case "LABELING":
      return <LabelingForm {...passProps} />;
    case "SHORT_ANSWER":
      return <ShortAnswerForm {...passProps} />;
    case "OTHER":
      return <OtherForm {...passProps} />;
    default:
      return (
        <div className="p-4 bg-gray-50 border rounded">
          <p className="text-gray-600 italic">
            Loại câu hỏi <strong>{type}</strong> chưa được hỗ trợ trực quan.
          </p>
        </div>
      );
  }
};

export default QuestionTypeRenderer;
