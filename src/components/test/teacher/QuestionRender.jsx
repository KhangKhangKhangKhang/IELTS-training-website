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

const QuestionTypeRenderer = ({ type, idGroup, groupData }) => {
  if (!type || !idGroup)
    return (
      <>
        <h1>Không có dữ liệu</h1>
      </>
    );

  switch (type) {
    case "MCQ":
      return <MCQForm idGroup={idGroup} groupData={groupData} />;
    case "TFNG":
      return <TFNGForm idGroup={idGroup} groupData={groupData} />;
    case "YES_NO_NOT_GIVEN":
      return <YesNoNotGivenForm idGroup={idGroup} groupData={groupData} />;
    case "MATCHING":
      return <MatchingForm idGroup={idGroup} groupData={groupData} />;
    case "FILL_BLANK":
      return <FillBlankForm idGroup={idGroup} groupData={groupData} />;
    case "LABELING":
      return <LabelingForm idGroup={idGroup} groupData={groupData} />;
    case "SHORT_ANSWER":
      return <ShortAnswerForm idGroup={idGroup} groupData={groupData} />;
    case "OTHER":
      return <OtherForm idGroup={idGroup} groupData={groupData} />;

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
