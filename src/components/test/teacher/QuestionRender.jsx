// src/components/test/teacher/shared/QuestionTypeRenderer.jsx
import React from "react";
import MCQForm from "@/components/test/teacher/Detail/MCQForm";
import TFNGForm from "@/components/test/teacher/Detail/TFNGForm";

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
