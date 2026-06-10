import React from "react";
import { Input, InputNumber } from "antd";
import { PlusOutlined } from "@ant-design/icons";

// FILL_IN_THE_BLANK (alias / generic wrapper for the 5 fill-blank sub-types)
// BE sub-types: SENTENCE_COMPLETION, SUMMARY_COMPLETION, NOTE_COMPLETION,
//                TABLE_COMPLETION, FLOW_CHART_COMPLETION
// This wrapper reuses SentenceCompletionForm as a default for the
// "FILL_IN_THE_BLANK" coarse type (when caller didn't pick a sub-type).
import SentenceCompletionForm from "./SentenceCompletionForm";
import SummaryCompletionForm from "./SummaryCompletionForm";
import NoteCompletionForm from "./NoteCompletionForm";
import TableCompletionForm from "./TableCompletionForm";
import FlowChartCompletionForm from "./FlowChartCompletionForm";

const FillBlankForm = (props) => {
  const { subType, ...rest } = props;
  switch (subType) {
    case "SUMMARY_COMPLETION":
      return <SummaryCompletionForm {...rest} />;
    case "NOTE_COMPLETION":
      return <NoteCompletionForm {...rest} />;
    case "TABLE_COMPLETION":
      return <TableCompletionForm {...rest} />;
    case "FLOW_CHART_COMPLETION":
      return <FlowChartCompletionForm {...rest} />;
    case "SENTENCE_COMPLETION":
    case undefined:
    default:
      return <SentenceCompletionForm {...rest} />;
  }
};

export default FillBlankForm;
