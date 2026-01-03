import React from "react";
import { Select, Card, Image, Tag } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Option } = Select;

const RenderLabeling = ({
  group,
  userAnswers,
  onAnswerChange,
  isReviewMode,
}) => {
  // 1. Prepare Data
  const questions = group.questions || [];
  if (questions.length === 0) return null;

  const firstQ = questions[0];
  const optionsPool = (firstQ.answers || [])
    .filter((a) => a.matching_key)
    .sort((a, b) => (a.matching_key || "").localeCompare(b.matching_key || ""));

  // Check valid content
  const hasContent = optionsPool.some(
    (opt) => opt.answer_text && opt.answer_text.trim() !== ""
  );

  return (
    <div
      className={`grid grid-cols-1 ${group.img ? "lg:grid-cols-2" : ""} gap-8`}
    >
      {/* COLUMN 1: IMAGE (MAP) */}
      {group.img && (
        <div className="flex flex-col">
          <div className="lg:sticky lg:top-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex justify-center shadow-sm">
              <Image
                src={group.img}
                alt="Labeling Map"
                className="max-h-[600px] object-contain rounded"
                preview={{
                  mask: <span className="text-white text-sm">Zoom</span>,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* COLUMN 2: OPTIONS & QUESTIONS */}
      <div className="flex flex-col gap-5">
        {/* Legend */}
        {hasContent && (
          <Card
            title={
              <span className="text-blue-700 dark:text-blue-400 font-bold text-sm">
                Options List
              </span>
            }
            size="small"
            className="bg-blue-50/60 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 shadow-sm"
            bodyStyle={{ padding: "12px" }}
          >
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {optionsPool.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-1.5 rounded text-xs min-w-[24px] text-center">
                    {opt.matching_key}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {opt.answer_text}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Questions List */}
        <div className="space-y-3">
          {questions.map((q) => {
            const userData = userAnswers[q.question_id];

            // Lấy value an toàn
            let userValue = undefined;
            if (userData) {
              userValue =
                typeof userData === "object" ? userData.value : userData;
            }

            const correctOpt = q.answers?.find(
              (a) => a.matching_value === "CORRECT"
            );
            const correctAnswerKey = correctOpt?.matching_key;

            const isCorrect =
              userData?.isCorrect !== undefined
                ? userData.isCorrect
                : String(userValue) === String(correctAnswerKey);

            return (
              <div
                key={q.question_id}
                className={`flex flex-wrap items-center justify-between gap-3 p-3 border rounded-xl transition-all duration-200 ${
                  isReviewMode
                    ? isCorrect
                      ? "bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${
                      isReviewMode
                        ? isCorrect
                          ? "bg-green-500"
                          : "bg-red-500"
                        : "bg-blue-600"
                    }`}
                  >
                    {q.question_number}
                  </div>

                  <div className="font-medium text-slate-800 dark:text-slate-200 text-base leading-tight">
                    {q.question_text || (
                      <span className="text-slate-400 dark:text-slate-500 italic font-normal text-sm">
                        Question {q.question_number}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isReviewMode && !isCorrect && (
                    <div className="flex flex-col items-end mr-2">
                      <Tag
                        color="green"
                        className="font-bold text-base m-0 px-2 py-0.5"
                      >
                        {correctAnswerKey}
                      </Tag>
                    </div>
                  )}

                  <Select
                    placeholder="?"
                    style={{ width: hasContent ? 220 : 90 }}
                    size="large"
                    value={userValue}
                    onChange={(val) => onAnswerChange(q.question_id, val)}
                    disabled={isReviewMode}
                    status={isReviewMode ? (isCorrect ? "" : "error") : ""}
                    className={!hasContent ? "font-bold text-center" : ""}
                    dropdownMatchSelectWidth={hasContent ? true : false}
                  >
                    {optionsPool.map((opt) => (
                      <Option key={opt.matching_key} value={opt.matching_key}>
                        {hasContent ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-700">
                              {opt.matching_key}.
                            </span>
                            <span className="truncate">{opt.answer_text}</span>
                          </div>
                        ) : (
                          <div className="text-center font-bold text-blue-700 text-lg">
                            {opt.matching_key}
                          </div>
                        )}
                      </Option>
                    ))}
                  </Select>

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
