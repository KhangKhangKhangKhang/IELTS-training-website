// components/test/ExamCard.jsx
import React from "react";
import { Card, Badge } from "antd";
import { ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";

const ExamCard = ({ exam, onExamClick }) => {
  return (
    <Card
      hoverable
      cover={
        <img
          alt={exam.title}
          src={exam.img ? exam.img : null}
          className="h-48 object-cover"
        />
      }
      actions={[
        <div key="time">
          <ClockCircleOutlined /> {exam.duration}p
        </div>,
        <div key="questions">
          <FileTextOutlined /> {exam.numberQuestion} câu hỏi
        </div>,
      ]}
      onClick={() => onExamClick(exam.idTest)}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge
          color={
            exam.testType === "Listening"
              ? "blue"
              : exam.testType === "Writing"
              ? "green"
              : "orange"
          }
        >
          {exam.testType}
        </Badge>
      </div>
      <Card.Meta
        title={exam.title}
        description={
          <div className="truncate" title={exam.description}>
            {exam.description}
          </div>
        }
      />
      <div className="mt-2">
        <span className="font-semibold">Độ khó: </span>
        {exam.level}
      </div>
    </Card>
  );
};

export default ExamCard;
