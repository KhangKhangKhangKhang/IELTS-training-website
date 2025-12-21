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
    { key: "Tất cả", label: "Tất cả" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="border min-w-[120px] px-4 py-2 rounded-md flex items-center justify-between text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
          {currentType} <DownOutlined className="ml-2" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        {examTypes.map((type) => (
          <DropdownMenuItem
            key={type.key}
            onClick={() => onTypeChange(type.key)}
            className={`${currentType === type.key
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 "
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 "
              } hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer `}
          >
            {type.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExamSelector;
