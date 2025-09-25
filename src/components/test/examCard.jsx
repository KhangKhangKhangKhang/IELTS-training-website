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
          src={exam.thumbnail}
          className="h-48 object-cover"
        />
      }
      actions={[
        <div key="time">
          <ClockCircleOutlined /> {exam.duration}p
        </div>,
        <div key="questions">
          <FileTextOutlined /> {exam.questions} Số câu hỏi
        </div>,
      ]}
      onClick={() => onExamClick(exam.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge
          color={
            exam.type === "Listening"
              ? "blue"
              : exam.type === "Writing"
              ? "green"
              : "orange"
          }
        >
          {exam.type}
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
    </Card>
  );
};

export default ExamCard;
