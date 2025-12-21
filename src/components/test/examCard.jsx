// components/test/ExamCard.jsx
import React from "react";
import { Card, Badge } from "antd";
import { ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";

const ExamCard = ({ exam, onExamClick }) => {
  return (
    <Card
      hoverable
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 [&_.ant-card-body]:dark:text-white [&_.ant-card-meta-title]:dark:text-white [&_.ant-card-meta-description]:dark:text-slate-400 [&_.ant-card-actions]:dark:bg-slate-700 [&_.ant-card-actions]:dark:border-slate-600 [&_.ant-card-actions>li]:dark:text-slate-300"
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
      <div className="mt-2 text-slate-700 dark:text-slate-300">
        <span className="font-semibold">Độ khó: </span>
        {exam.level}
      </div>
    </Card>
  );
};

export default ExamCard;
