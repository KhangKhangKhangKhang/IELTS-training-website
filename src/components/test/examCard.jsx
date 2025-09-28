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
          src={exam.img ? exam.img : "ảnh đẹp"}
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
      onClick={() => onExamClick(exam.idDe)}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge
          color={
            exam.loaiDe === "Listening"
              ? "blue"
              : exam.loaiDe === "Writing"
              ? "green"
              : "orange"
          }
        >
          {exam.loaiDe}
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
