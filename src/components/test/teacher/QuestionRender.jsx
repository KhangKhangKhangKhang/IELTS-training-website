// src/components/test/teacher/shared/QuestionTypeRenderer.jsx
import React from "react";

const QuestionTypeRenderer = ({
  type,
  idGroup,
  groupData,
  questionNumberOffset,
}) => {
  if (!type || !idGroup)
    return (
      <>
        <h1>No data</h1>
      </>
    );

  // Standalone inline renderers (the previous Detail/* form components were
  // removed when we ported the editor to a MagicPath canvas). Question
  // editing is now handled inside the canvas itself.
  const passProps = {
    idGroup,
    groupData,
    questionNumberOffset,
  };

  const Fallback = ({ label }) => (
    <div className="p-4 bg-gray-50 border rounded">
      <p className="text-gray-600 italic">
        Question type <strong>{label || type}</strong> is not yet supported in
        the standalone view. Use the canvas editor to manage it.
      </p>
      <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap">
        {JSON.stringify(passProps, null, 2)}
      </pre>
    </div>
  );

  return <Fallback />;
};

export default QuestionTypeRenderer;
