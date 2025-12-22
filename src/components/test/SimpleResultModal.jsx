import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Spin,
  message,
  Tabs,
  Card,
  Typography,
  Statistic,
  Tag,
} from "antd";
import {
  TrophyOutlined,
  ReadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

import QuestionRenderer from "./reading/render/QuestionRenderer";
import { getTestResultAndAnswersAPI } from "@/services/apiDoTest";

const { Title, Text } = Typography;

const TYPE_MAPPING = {
  YES_NO_NOTGIVEN: "YES_NO_NOTGIVEN",
  TFNG: "TFNG",
  MCQ: "MCQ",
  FILL_BLANK: "FILL_BLANK",
  LABELING: "LABELING",
  MATCHING: "MATCHING",
  SHORT_ANSWER: "SHORT_ANSWER",
  OTHER: "OTHER",
};

// Helper function mapGroupForReview như cũ
function mapGroupForReview(apiGroup) {
  const type_question =
    TYPE_MAPPING[apiGroup.typeQuestion] || apiGroup.typeQuestion;

  const questions = (apiGroup.question || []).map((q) => {
    const answers = (q.answers || []).map((a) => ({
      answer_id: a.idAnswer,
      answer_text: a.answer_text,
      matching_key: a.matching_key,
      matching_value: a.matching_value,
    }));

    let correct_answers = [];
    if (q.correct_answers && q.correct_answers.length > 0) {
      correct_answers = q.correct_answers;
    } else {
      correct_answers = answers.filter((a) => {
        const val = (a.matching_value || "").toUpperCase();
        return val === "CORRECT" || val === "TRUE" || val === "YES";
      });
      if (correct_answers.length === 0 && answers.length > 0) {
        correct_answers = answers;
      }
    }

    return {
      question_id: q.idQuestion,
      question_number: q.numberQuestion,
      question_text: q.content,
      correct_answers: correct_answers,
      answers,
    };
  });

  return {
    title: apiGroup.title,
    quantity: apiGroup.quantity,
    type_question,
    img: apiGroup.img, // Mapping thêm ảnh cho dạng Labeling
    instruction: apiGroup.instruction || "",
    questions,
  };
}

const SimpleResultModal = ({ open, onClose, idTestResult }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (open && idTestResult) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await getTestResultAndAnswersAPI(idTestResult);
          if (res && res.data) {
            setData(res.data);
          } else {
            message.warning("Không tìm thấy dữ liệu chi tiết.");
          }
        } catch (error) {
          console.error("Lỗi tải kết quả:", error);
          message.error("Lỗi kết nối khi tải đáp án.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setData(null);
    }
  }, [open, idTestResult]);

  const normalizedUserAnswers = useMemo(() => {
    if (!data?.userAnswer) return {};
    const map = {};
    data.userAnswer.forEach((ua) => {
      let val = ua.answerText;
      if (ua.matching_key) {
        val = ua.matching_key;
      } else if (
        ua.matching_value &&
        (ua.userAnswerType === "YES_NO_NOTGIVEN" ||
          ua.userAnswerType === "TFNG")
      ) {
        val = ua.matching_value;
      }
      map[ua.idQuestion] = {
        value: val,
        isCorrect: ua.isCorrect,
      };
    });
    return map;
  }, [data]);

  // --- COMPONENT RENDER PART ---
  const RenderPartTab = ({ part }) => {
    // KIỂM TRA XEM CÓ BÀI ĐỌC KHÔNG
    const hasPassage =
      part.passage &&
      part.passage.content &&
      part.passage.content.trim().length > 0;

    return (
      <div className="h-full flex flex-col md:flex-row gap-6 overflow-hidden bg-gray-100 p-4">
        {/* CỘT TRÁI: READING PASSAGE (Chỉ hiện nếu có nội dung) */}
        {hasPassage && (
          <div className="w-full md:w-1/2 h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 flex items-center gap-2">
              <ReadOutlined /> Reading Passage
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="prose max-w-none text-justify text-gray-800 text-lg leading-8 font-serif">
                {part.passage.content.split(/\r?\n\r?\n/).map((para, i) => (
                  <p key={i} className="mb-4 indent-8">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CỘT PHẢI: QUESTIONS */}
        {/* Nếu không có passage (Listening), cột này sẽ full width và căn giữa */}
        <div
          className={`h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
            hasPassage ? "w-full md:w-1/2" : "w-full max-w-5xl mx-auto"
          }`}
        >
          <div className="p-4 bg-blue-50 border-b border-blue-100 font-bold text-blue-800 flex items-center gap-2">
            <FileTextOutlined /> Questions & Answers
          </div>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/30">
            {(part.groupOfQuestions || []).map((group) => {
              let displayTitle = group.title || "Group";
              let isMultiple = false;
              if (displayTitle.startsWith("Multiple ||| ")) {
                displayTitle = displayTitle.replace("Multiple ||| ", "");
                isMultiple = true;
              } else if (displayTitle.startsWith("Single ||| ")) {
                displayTitle = displayTitle.replace("Single ||| ", "");
              }

              const mappedGroup = mapGroupForReview(group);

              return (
                <div key={group.idGroupOfQuestions} className="mb-8">
                  <div className="mb-3 border-b border-gray-200 pb-2">
                    <h4 className="font-bold text-gray-800 text-lg">
                      {displayTitle}
                    </h4>
                    {group.instruction && (
                      <p className="text-sm text-gray-500 italic mt-1">
                        {group.instruction}
                      </p>
                    )}
                  </div>

                  <QuestionRenderer
                    group={mappedGroup}
                    userAnswers={normalizedUserAnswers}
                    isReviewMode={true}
                    isMultiple={isMultiple}
                    onAnswerChange={() => {}}
                  />
                </div>
              );
            })}
            {(!part.groupOfQuestions || part.groupOfQuestions.length === 0) && (
              <div className="text-center text-gray-400 py-10">
                Không có câu hỏi
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const tabItems = useMemo(() => {
    if (!data?.test?.parts) return [];
    return data.test.parts.map((part, index) => ({
      key: part.idPart || String(index),
      label: `Part ${index + 1}`,
      children: <RenderPartTab part={part} />,
    }));
  }, [data, normalizedUserAnswers]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="98vw"
      style={{ top: 10 }}
      bodyStyle={{ height: "90vh", padding: 0, overflow: "hidden" }}
      className="review-modal"
      title={null}
      closeIcon={
        <span className="bg-gray-200 hover:bg-red-500 hover:text-white rounded-full p-2 transition-all">
          <CloseCircleOutlined style={{ fontSize: 16 }} />
        </span>
      }
    >
      {loading ? (
        <div className="flex flex-col justify-center items-center h-full gap-4">
          <Spin size="large" />
          <Text>Đang tải lại bài làm của bạn...</Text>
        </div>
      ) : data ? (
        <div className="flex flex-col h-full bg-gray-100">
          {/* HEADER */}
          <div className="bg-white px-6 py-3 border-b shadow-sm flex flex-wrap justify-between items-center gap-4 shrink-0">
            <div>
              <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
                {data.test?.title || "Review Result"}
              </Title>
              <div className="flex items-center gap-2 mt-1">
                <Tag color="green">FINISHED</Tag>
                <Text type="secondary" className="text-xs">
                  ID: {data.idTestResult?.slice(0, 8)}...
                </Text>
              </div>
            </div>

            <div className="flex gap-6 items-center">
              <Statistic
                title="Band Score"
                value={data.band_score}
                precision={1}
                valueStyle={{ color: "#2563eb", fontWeight: "bold" }}
                prefix={<TrophyOutlined />}
              />
              <Statistic
                title="Câu đúng"
                value={data.total_correct}
                suffix={`/ ${data.total_questions}`}
                valueStyle={{ color: "#16a34a", fontWeight: "bold" }}
                prefix={<CheckCircleOutlined />}
              />
              <div className="h-10 w-px bg-gray-300 mx-2 hidden md:block"></div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md"
              >
                Đóng Review
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex-1 overflow-hidden">
            <Tabs
              defaultActiveKey="0"
              items={tabItems}
              type="card"
              className="h-full custom-result-tabs"
              tabBarStyle={{
                marginBottom: 0,
                background: "#fff",
                paddingLeft: 16,
                paddingTop: 8,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-full text-gray-400">
          Không có dữ liệu
        </div>
      )}

      <style jsx>{`
        .custom-result-tabs .ant-tabs-content {
          height: 100%;
        }
        .custom-result-tabs .ant-tabs-tabpane {
          height: 100%;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </Modal>
  );
};

export default SimpleResultModal;
