// components/test/ExamSelector.jsx (Đã tối ưu)
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "antd";
import { DownOutlined } from "@ant-design/icons";

const ExamSelector = ({ currentType, onTypeChange }) => {
  const examTypes = [
    { key: "LISTENING", label: "Listening" },
    { key: "WRITING", label: "Writing" },
    { key: "READING", label: "Reading" },
    { key: "SPEAKING", label: "Speaking" },
    { key: "ALL", label: "All" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="border  min-w-[120px] flex items-center justify-between">
          {currentType} <DownOutlined className="ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {examTypes.map((type) => (
          <DropdownMenuItem
            key={type.key}
            onClick={() => onTypeChange(type.key)}
            className={currentType === type.key ? "bg-blue-50" : "bg-white"}
          >
            {type.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExamSelector;
