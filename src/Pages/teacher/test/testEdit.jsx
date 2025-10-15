import React from "react";
import { useLocation, useParams } from "react-router";
import CreateReading from "@/components/test/teacher/Reading/CreateReading";
import CreateListening from "@/components/test/teacher/Listening/CreateListening";
import CreateWriting from "@/components/test/teacher/Writing/CreateWriting";

const TestEdit = () => {
  const { idDe } = useParams();
  const exam = useLocation().state?.exam;

  if (!exam) return <p>Không tìm thấy đề thi</p>;

  switch (exam.loaiDe) {
    case "READING":
      return <CreateReading idDe={idDe} exam={exam} />;
    case "LISTENING":
      return <CreateListening idDe={idDe} exam={exam} />;
    case "WRITING":
      return <CreateWriting idDe={idDe} exam={exam} />;
    default:
      return <p>Loại đề không hợp lệ: {exam.loaiDe}</p>;
  }
};

export default TestEdit;
