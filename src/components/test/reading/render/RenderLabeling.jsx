import React from "react";
import { Select, Card, Image, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Option } = Select;

const RenderLabeling = ({
  group,
  userAnswers,
  onAnswerChange,
  isReviewMode,
}) => {
  // 1. Chuẩn bị dữ liệu Options
  const questions = group.questions || [];
  if (questions.length === 0) return null;

  const firstQ = questions[0];
  const optionsPool = (firstQ.answers || [])
    .filter((a) => a.matching_key)
    .sort((a, b) => (a.matching_key || "").localeCompare(b.matching_key || ""));

  // Check xem options có nội dung text hay không
  const hasContent = optionsPool.some(
    (opt) => opt.answer_text && opt.answer_text.trim() !== ""
  );

  return (
    <div
      className={`grid grid-cols-1 ${group.img ? "lg:grid-cols-2" : ""} gap-8`}
    >
      {/* --- CỘT 1: HÌNH ẢNH (MAP) --- */}
      {group.img && (
        <div className="flex flex-col">
          <div className="lg:sticky lg:top-4">
            <div className="bg-white border rounded-lg p-2 flex justify-center shadow-sm">
              <Image
                src={group.img}
                alt="Labeling Map"
                className="max-h-[600px] object-contain rounded"
                preview={{
                  mask: <span className="text-white text-sm">Phóng to</span>,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- CỘT 2: OPTIONS & QUESTIONS --- */}
      <div className="flex flex-col gap-5">
        {/* A. Bảng Chú thích (Legend) - Chỉ hiện nếu có text */}
        {hasContent && (
          <Card
            title={
              <span className="text-blue-700 font-bold text-sm">
                Danh sách lựa chọn
              </span>
            }
            size="small"
            className="bg-blue-50/60 border-blue-100 shadow-sm"
            bodyStyle={{ padding: "12px" }}
          >
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {optionsPool.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-blue-700 bg-white border px-1.5 rounded text-xs min-w-[24px] text-center">
                    {opt.matching_key}
                  </span>
                  <span className="text-gray-700 font-medium">
                    {opt.answer_text}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* B. Danh sách Câu hỏi */}
        <div className="space-y-3">
          {questions.map((q) => {
            const userData = userAnswers[q.question_id] || {};
            const userValue = userData.value || undefined;
            const isCorrect = userData.isCorrect;

            // Tìm Key đáp án đúng
            const correctOpt = q.answers?.find(
              (a) => a.matching_value === "CORRECT"
            );
            const correctAnswerKey = correctOpt?.matching_key;

            return (
              <div
                key={q.question_id}
                // Flex row để dàn hàng ngang: Số câu - Text ..... Dropdown
                className={`flex flex-wrap items-center justify-between gap-3 p-3 border rounded-lg transition-all ${
                  isReviewMode
                    ? isCorrect
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                    : "bg-white hover:border-blue-400 hover:shadow-sm"
                }`}
              >
                {/* 1. Bên Trái: Số câu + Nội dung câu hỏi */}
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${
                      isReviewMode
                        ? isCorrect
                          ? "bg-green-500"
                          : "bg-red-500"
                        : "bg-blue-600"
                    }`}
                  >
                    {q.question_number}
                  </div>

                  <div className="font-medium text-gray-800 text-base leading-tight">
                    {q.question_text || (
                      <span className="text-gray-400 italic font-normal text-sm">
                        Vị trí số {q.question_number}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Bên Phải: Dropdown chọn đáp án */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Nếu Review sai thì hiện đáp án đúng bên cạnh */}
                  {isReviewMode && !isCorrect && (
                    <div className="flex flex-col items-end mr-2">
                      <Tag
                        color="green"
                        className="font-bold text-base m-0 px-2 py-0.5"
                      >
                        {correctAnswerKey}
                      </Tag>
                      {correctOpt?.answer_text && (
                        <span className="text-[10px] text-gray-500 max-w-[100px] truncate">
                          {correctOpt.answer_text}
                        </span>
                      )}
                    </div>
                  )}

                  {/* CÁI DROPDOWN ĐÃ ĐƯỢC TỐI ƯU */}
                  <Select
                    placeholder="?"
                    // Logic style:
                    // - Nếu không có text (chỉ A,B): width nhỏ (80px), chữ to, đậm.
                    // - Nếu có text: width lớn (200px) để hiện text.
                    style={{ width: hasContent ? 220 : 90 }}
                    size="large"
                    value={userValue}
                    onChange={(val) => onAnswerChange(q.question_id, val)}
                    disabled={isReviewMode}
                    status={isReviewMode ? (isCorrect ? "" : "error") : ""}
                    className={!hasContent ? "font-bold text-center" : ""}
                    dropdownMatchSelectWidth={hasContent ? true : false} // Nếu box nhỏ thì dropdown cũng nhỏ
                  >
                    {optionsPool.map((opt) => (
                      <Option key={opt.matching_key} value={opt.matching_key}>
                        {hasContent ? (
                          // Có nội dung: Hiện "A. Library"
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-700">
                              {opt.matching_key}.
                            </span>
                            <span className="truncate">{opt.answer_text}</span>
                          </div>
                        ) : (
                          // Không nội dung: Hiện "A" ở giữa, to rõ
                          <div className="text-center font-bold text-blue-700 text-lg">
                            {opt.matching_key}
                          </div>
                        )}
                      </Option>
                    ))}
                  </Select>

                  {/* Icon Check/X khi review */}
                  {isReviewMode && (
                    <div className="w-6 flex justify-center">
                      {isCorrect ? (
                        <CheckCircleOutlined className="text-green-500 text-lg" />
                      ) : (
                        <CloseCircleOutlined className="text-red-500 text-lg" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RenderLabeling;
