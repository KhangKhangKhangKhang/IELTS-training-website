import React from "react";
import { useLocation, useParams } from "react-router";
import CreateReading from "@/components/test/teacher/Reading/CreateReading";
import CreateListening from "@/components/test/teacher/Listening/CreateListening";
import CreateWriting from "@/components/test/teacher/Writing/CreateWriting";

const TestEdit = () => {
  const { idTest } = useParams();
  const exam = useLocation().state?.exam;

  if (!exam) return <p>Không tìm thấy đề thi</p>;

  switch (exam.testType) {
    case "READING":
      return <CreateReading idTest={exam.idTest} exam={exam} />;
    case "LISTENING":
      return <CreateListening idTest={exam.idTest} exam={exam} />;
    case "WRITING":
      return <CreateWriting idTest={exam.idTest} exam={exam} />;
    default:
      return <p>Loại đề không hợp lệ: {exam.testType}</p>;
  }
};

export default TestEdit;
