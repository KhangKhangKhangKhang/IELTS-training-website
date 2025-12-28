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
  Collapse,
} from "antd";
import {
  TrophyOutlined,
  ReadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
  EditOutlined,
  LinkOutlined,
  CheckSquareOutlined,
  AlertOutlined,
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

// --- COMPONENT: Render Writing Submission ---
const RenderWritingSubmission = ({ submission }) => {
  if (!submission) return null;

  const { submission_text, writingTask, feedback } = submission;
  const feedbackData = feedback && feedback.length > 0 ? feedback[0] : null;

  // Collapse items for detailed feedback
  const collapseItems = [
    {
      key: "1",
      label: (
        <span className="font-semibold flex items-center gap-2">
          <FileTextOutlined /> Task Response
        </span>
      ),
      children: (
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {feedbackData?.taskResponse || "No feedback available"}
        </p>
      ),
    },
    {
      key: "2",
      label: (
        <span className="font-semibold flex items-center gap-2">
          <LinkOutlined /> Coherence & Cohesion
        </span>
      ),
      children: (
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {feedbackData?.coherenceAndCohesion || "No feedback available"}
        </p>
      ),
    },
    {
      key: "3",
      label: (
        <span className="font-semibold flex items-center gap-2">
          <BookOutlined /> Lexical Resource
        </span>
      ),
      children: (
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {feedbackData?.lexicalResource || "No feedback available"}
        </p>
      ),
    },
    {
      key: "4",
      label: (
        <span className="font-semibold flex items-center gap-2">
          <CheckSquareOutlined /> Grammatical Range & Accuracy
        </span>
      ),
      children: (
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {feedbackData?.grammaticalRangeAndAccuracy || "No feedback available"}
        </p>
      ),
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-50 dark:bg-slate-900 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Info */}
        <Card className="shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {writingTask?.task_type || "Writing Task"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {writingTask?.title || "No title"}
              </p>
            </div>
          </div>
        </Card>

        {/* Your Submission */}
        <Card title={<span className="dark:text-white"><EditOutlined /> Your Submission</span>} className="shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {submission_text || "No submission text"}
            </p>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Word count: {submission_text ? submission_text.trim().split(/\s+/).length : 0}
          </div>
        </Card>

        {/* General Feedback */}
        {feedbackData?.generalFeedback && (
          <Card
            className="shadow-sm dark:bg-slate-800/50 dark:border-blue-500/50"
            style={{ backgroundColor: 'var(--feedback-bg, #f0f9ff)', borderColor: 'var(--feedback-border, #0284c7)' }}
          >
            <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
              <TrophyOutlined /> General Feedback
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {feedbackData.generalFeedback}
            </p>
          </Card>
        )}

        {/* Detailed Criteria */}
        <Card title={<span className="dark:text-white">Detailed Evaluation</span>} className="shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <Collapse
            items={collapseItems}
            defaultActiveKey={["1"]}
            ghost
            className="dark:bg-transparent"
          />
        </Card>

        {/* Detailed Corrections */}
        {feedbackData?.detailedCorrections && Array.isArray(feedbackData.detailedCorrections) && feedbackData.detailedCorrections.length > 0 && (
          <Card
            title={
              <span className="flex items-center gap-2">
                <AlertOutlined className="text-amber-500" /> Improvements & Corrections
              </span>
            }
            className="shadow-sm"
          >
            <div className="grid gap-4">
              {feedbackData.detailedCorrections.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <Tag
                      color={
                        item.type === "Grammar"
                          ? "red"
                          : item.type === "Lexis"
                            ? "blue"
                            : "orange"
                      }
                      className="font-semibold"
                    >
                      {item.type}
                    </Tag>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded border border-red-200 dark:border-red-800">
                      <span className="font-semibold text-red-700 dark:text-red-400 block mb-2 text-sm">
                        Original:
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 line-through decoration-red-400 decoration-2">
                        {item.mistake}
                      </span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded border border-green-200 dark:border-green-800">
                      <span className="font-semibold text-green-700 dark:text-green-400 block mb-2 text-sm">
                        Correction:
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{item.correct}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 italic bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-800">
                    <span className="font-bold text-blue-700 dark:text-blue-400">Explanation: </span>
                    {item.explanation}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// Cache configuration
const CACHE_KEY_PREFIX = "test_result_cache_";
const CACHE_EXPIRY_DAYS = 7;

// Helper functions for caching
const getCacheKey = (idTestResult) => `${CACHE_KEY_PREFIX}${idTestResult}`;

const getCachedResult = (idTestResult) => {
  try {
    const cacheKey = getCacheKey(idTestResult);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    // Check if cache is expired
    if (Date.now() - timestamp > expiryTime) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
};

const setCachedResult = (idTestResult, data) => {
  try {
    const cacheKey = getCacheKey(idTestResult);
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error saving to cache:", error);
    // If localStorage is full, try to clear old caches
    if (error.name === "QuotaExceededError") {
      clearOldCaches();
    }
  }
};

const clearOldCaches = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    // Remove oldest caches (keep only last 10)
    if (keysToRemove.length > 10) {
      keysToRemove.slice(0, keysToRemove.length - 10).forEach((key) => {
        localStorage.removeItem(key);
      });
    }
  } catch (error) {
    console.error("Error clearing old caches:", error);
  }
};

const SimpleResultModal = ({ open, onClose, idTestResult }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (open && idTestResult) {
      const fetchData = async () => {
        // First, check cache
        const cachedData = getCachedResult(idTestResult);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return; // Use cached data, no need to fetch
        }

        setLoading(true);
        try {
          const res = await getTestResultAndAnswersAPI(idTestResult);
          if (res && res.data) {
            setData(res.data);
            // Save to cache for future use
            setCachedResult(idTestResult, res.data);
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
      <div className="h-full flex flex-col md:flex-row gap-6 overflow-hidden bg-gray-100 dark:bg-slate-900 p-4">
        {/* CỘT TRÁI: READING PASSAGE (Chỉ hiện nếu có nội dung) */}
        {hasPassage && (
          <div className="w-full md:w-1/2 h-full flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 font-bold text-gray-700 dark:text-white flex items-center gap-2">
              <ReadOutlined /> Reading Passage
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="prose max-w-none text-justify text-gray-800 dark:text-gray-200 text-lg leading-8 font-serif">
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
          className={`h-full flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden ${hasPassage ? "w-full md:w-1/2" : "w-full max-w-5xl mx-auto"
            }`}
        >
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <FileTextOutlined /> Questions & Answers
          </div>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/30 dark:bg-slate-900/50">
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
                  <div className="mb-3 border-b border-gray-200 dark:border-slate-600 pb-2">
                    <h4 className="font-bold text-gray-800 dark:text-white text-lg">
                      {displayTitle}
                    </h4>
                    {group.instruction && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                        {group.instruction}
                      </p>
                    )}
                  </div>

                  <QuestionRenderer
                    group={mappedGroup}
                    userAnswers={normalizedUserAnswers}
                    isReviewMode={true}
                    isMultiple={isMultiple}
                    onAnswerChange={() => { }}
                  />
                </div>
              );
            })}
            {(!part.groupOfQuestions || part.groupOfQuestions.length === 0) && (
              <div className="text-center text-gray-400 dark:text-gray-500 py-10">
                Không có câu hỏi
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const tabItems = useMemo(() => {
    // Check if this is a Writing test
    if (data?.test?.testType === "WRITING" && data?.writingSubmission) {
      // Create tabs from writing submissions
      return data.writingSubmission.map((submission, index) => ({
        key: submission.idWritingSubmission || String(index),
        label: submission.writingTask?.task_type === "TASK1"
          ? "Task 1"
          : submission.writingTask?.task_type === "TASK2"
            ? "Task 2"
            : `Task ${index + 1}`,
        children: <RenderWritingSubmission submission={submission} />,
      }));
    }

    // Default: Reading/Listening tests with parts
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
      closeIcon={<CloseCircleOutlined style={{ fontSize: 25 }} />}
    >
      {loading ? (
        <div className="flex flex-col justify-center items-center h-full gap-4 bg-white dark:bg-slate-900">
          <Spin size="large" />
          <Text className="dark:text-gray-300">Đang tải lại bài làm của bạn...</Text>
        </div>
      ) : data ? (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-slate-900">
          {/* HEADER */}
          <div className="bg-white dark:bg-slate-800 px-6 py-3 border-b dark:border-slate-700 shadow-sm flex flex-wrap justify-between items-center gap-4 shrink-0">
            <div>
              <Title level={4} style={{ margin: 0 }} className="dark:text-white text-gray-900">
                {data.test?.title || "Review Result"}
              </Title>
              <div className="flex items-center gap-2 mt-1">
                <Tag color="green">FINISHED</Tag>
                <Text type="secondary" className="text-xs dark:text-gray-400">
                  ID: {data.idTestResult?.slice(0, 8)}...
                </Text>
              </div>
            </div>

            <div className="flex gap-6 items-center">
              <Statistic
                title={<span className="dark:text-gray-400">Band Score</span>}
                value={data.band_score}
                precision={1}
                valueStyle={{ color: "#2563eb", fontWeight: "bold" }}
                prefix={<TrophyOutlined />}
              />
              {data.test?.testType === "WRITING" ? (
                <Statistic
                  title={<span className="dark:text-gray-400">Submissions</span>}
                  value={data.writingSubmission?.length || 0}
                  valueStyle={{ color: "#16a34a", fontWeight: "bold" }}
                  prefix={<FileTextOutlined />}
                />
              ) : (
                <Statistic
                  title={<span className="dark:text-gray-400">Câu đúng</span>}
                  value={data.total_correct}
                  suffix={`/ ${data.total_questions}`}
                  valueStyle={{ color: "#16a34a", fontWeight: "bold" }}
                  prefix={<CheckCircleOutlined />}
                />
              )}
              <div className="h-10 w-px bg-gray-300 dark:bg-slate-600 mx-2 hidden md:block"></div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex-1 overflow-hidden">
            <Tabs
              defaultActiveKey="0"
              items={tabItems}
              type="card"
              className="h-full custom-result-tabs dark-tabs"
              tabBarStyle={{
                marginBottom: 0,
                paddingLeft: 16,
                paddingTop: 8,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-full text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-900">
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
        /* Dark mode scrollbar */
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        /* Dark mode for Ant Design tabs */
        .dark .dark-tabs .ant-tabs-nav {
          background: #1e293b !important;
        }
        .dark .dark-tabs .ant-tabs-tab {
          background: #334155 !important;
          border-color: #475569 !important;
          color: #94a3b8 !important;
        }
        .dark .dark-tabs .ant-tabs-tab-active {
          background: #0f172a !important;
          border-bottom-color: #0f172a !important;
        }
        .dark .dark-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #fff !important;
        }
      `}</style>
    </Modal>
  );
};

export default SimpleResultModal;
