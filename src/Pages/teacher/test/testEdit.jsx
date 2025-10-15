import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";
import { useLocation, useParams } from "react-router";
import { InputNumber, Select } from "antd";

const TestEdit = () => {
  const { idDe } = useParams();
  const exam = useLocation().state?.exam || { title: "Chỉnh sửa đề thi" };

  // danh sách loại câu hỏi
  const loaiCauHoi = [
    { value: "MCQ", label: "Multiple choice" },
    { value: "TFNG", label: "True / False / Not Given" },
    { value: "FILL_BLANK", label: "Fill in the blanks" },
    { value: "YES_NO_NOT_GIVEN", label: "Yes / No / Not Given" },
    { value: "SHORT_ANSWER", label: "Short answer" },
    { value: "LABELING", label: "Labeling" },
    { value: "MATCHING", label: "Matching headings" },
    { value: "OTHER", label: "Other" },
  ];

  // State lưu danh sách nhóm câu hỏi
  const [questionGroups, setQuestionGroups] = useState([
    { id: 1, quantity: 3, type: null },
  ]);

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (value, id) => {
    setQuestionGroups((prev) =>
      prev.map((group) =>
        group.id === id ? { ...group, quantity: value } : group
      )
    );
  };

  // Xử lý chọn loại câu hỏi
  const handleTypeChange = (value, id) => {
    setQuestionGroups((prev) => {
      const updated = prev.map((group) =>
        group.id === id ? { ...group, type: value } : group
      );

      // Nếu đang chọn ở nhóm cuối cùng và có type thì thêm nhóm mới
      const isLast = id === prev[prev.length - 1].id;
      if (isLast) {
        updated.push({
          id: prev[prev.length - 1].id + 1,
          quantity: 3,
          type: null,
        });
      }
      return updated;
    });
  };

  console.log("Editing test with ID:", exam);

  return (
    <div className="flex-col h-screen p-4">
      <h1 className="flex items-center justify-center text-3xl font-medium mb-6">
        {exam.title}
      </h1>

      <div className="flex justify-between gap-4 items-start h-[calc(100vh-100px)] p-3 overflow-auto">
        {/* ======= LEFT: Passage ======= */}
        <div className="flex w-full h-full">
          <div className="flex flex-col w-full h-full border-2 border-gray-300 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-start">
              Đoạn văn của đề
            </h2>
            <div className="flex-grow flex items-start justify-start">
              <Textarea
                className="w-full h-full resize-none break-words"
                placeholder="Điền đoạn văn bạn ở đây"
              />
            </div>
          </div>
        </div>

        {/* ======= RIGHT: Question settings ======= */}
        <div className="flex w-full h-full overflow-auto">
          <div className="flex flex-col w-full h-full border-2 border-gray-300 rounded-lg p-6 overflow-auto">
            <h2 className="text-2xl font-semibold mb-4 text-start">
              Câu hỏi của đề
            </h2>

            {/* Danh sách các nhóm câu hỏi */}
            <div className="flex flex-col gap-6 overflow-auto">
              {questionGroups.map((group, index) => (
                <div
                  key={group.id}
                  className="border border-gray-300 rounded-lg p-4"
                >
                  <h3 className="text-lg font-medium mb-3">
                    Nhóm câu hỏi {index + 1}
                  </h3>

                  <div className="flex items-center gap-3">
                    <span className="font-medium">Số lượng câu hỏi:</span>
                    <InputNumber
                      min={1}
                      max={50}
                      value={group.quantity}
                      onChange={(value) =>
                        handleQuantityChange(value, group.id)
                      }
                    />

                    <span className="font-medium">Loại câu hỏi:</span>
                    <Select
                      style={{ width: 220 }}
                      placeholder="Chọn loại câu hỏi"
                      options={loaiCauHoi}
                      value={group.type}
                      onChange={(value) => handleTypeChange(value, group.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEdit;
