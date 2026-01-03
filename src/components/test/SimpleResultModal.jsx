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
  AudioOutlined,
  CommentOutlined,
  PlayCircleOutlined, // Thêm icon này cho player
} from "@ant-design/icons";

import QuestionRenderer from "./detail/QuestionRenderer";
import { getTestResultAndAnswersAPI } from "@/services/apiDoTest";

const { Title, Text } = Typography;

// --- CONSTANTS & HELPERS ---
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
    img: apiGroup.img,
    instruction: apiGroup.instruction || "",
    questions,
  };
}

// --- COMPONENT: Render Speaking Submission (ĐÃ FIX LOGIC LẤY DATA) ---
const RenderSpeakingSubmission = ({ submission }) => {
  if (!submission) return null;

  // 1. Lấy audio và feedback object
  const { audioUrl, feedback, status } = submission;

  // 2. Nếu chưa có feedback (chưa chấm hoặc đang xử lý)
  if (!feedback) {
    return (
      <div className="p-10 text-center bg-gray-50 h-full">
        <Spin tip="Đang tải kết quả..." />
        <div className="mt-4 text-gray-500">
          Trạng thái bài làm: <Tag color="orange">{status || "PENDING"}</Tag>
        </div>
        {audioUrl && (
          <div className="mt-6 max-w-md mx-auto bg-white p-4 rounded shadow-sm">
            <div className="text-xs font-bold text-gray-400 uppercase mb-2">
              Bài nói của bạn
            </div>
            <audio controls className="w-full h-8" src={audioUrl} />
          </div>
        )}
      </div>
    );
  }

  // 3. Destructure dữ liệu TỪ BÊN TRONG feedback
  const {
    scoreFluency,
    scoreLexical,
    scoreGrammar,
    scorePronunciation,
    overallScore,
    commentFluency,
    commentLexical,
    commentGrammar,
    commentPronunciation,
    generalFeedback,
    detailedCorrections,
  } = feedback;

  // Helper render header panel kèm điểm
  const renderPanelHeader = (title, score, icon) => (
    <div className="flex justify-between items-center w-full pr-4">
      <span className="font-semibold flex items-center gap-2">
        {icon} {title}
      </span>
      {score !== undefined && (
        <Tag color="geekblue" className="text-sm font-bold ml-2">
          {score} / 9.0
        </Tag>
      )}
    </div>
  );

  const collapseItems = [
    {
      key: "1",
      label: renderPanelHeader(
        "Fluency & Coherence",
        scoreFluency,
        <CommentOutlined />
      ),
      children: (
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
          {commentFluency || "No comment available"}
        </p>
      ),
    },
    {
      key: "2",
      label: renderPanelHeader(
        "Lexical Resource",
        scoreLexical,
        <BookOutlined />
      ),
      children: (
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
          {commentLexical || "No comment available"}
        </p>
      ),
    },
    {
      key: "3",
      label: renderPanelHeader(
        "Grammatical Range",
        scoreGrammar,
        <CheckSquareOutlined />
      ),
      children: (
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
          {commentGrammar || "No comment available"}
        </p>
      ),
    },
    {
      key: "4",
      label: renderPanelHeader(
        "Pronunciation",
        scorePronunciation,
        <AudioOutlined />
      ),
      children: (
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
          {commentPronunciation || "No comment available"}
        </p>
      ),
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* AUDIO PLAYER */}
        {audioUrl && (
          <Card className="shadow-sm border border-blue-100 bg-white">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                <PlayCircleOutlined style={{ fontSize: "24px" }} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Your Recording
                </div>
                <audio controls className="w-full h-8" src={audioUrl} />
              </div>
            </div>
          </Card>
        )}

        {/* Score Overview Card */}
        <Card className="shadow-sm border-t-4 border-t-blue-600">
          <div className="text-center">
            <h3 className="text-gray-500 mb-1 uppercase text-xs font-bold tracking-wider">
              Overall Speaking Score
            </h3>
            <div className="text-5xl font-extrabold text-blue-600">
              {overallScore || 0}
            </div>
            <div className="mt-4 flex justify-center gap-4 flex-wrap">
              {/* Mini stats */}
              <div className="bg-gray-100 px-3 py-1 rounded text-xs text-gray-600">
                Fluency: <b>{scoreFluency}</b>
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded text-xs text-gray-600">
                Lexical: <b>{scoreLexical}</b>
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded text-xs text-gray-600">
                Grammar: <b>{scoreGrammar}</b>
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded text-xs text-gray-600">
                Pronun: <b>{scorePronunciation}</b>
              </div>
            </div>
          </div>
        </Card>

        {/* General Feedback */}
        {generalFeedback && (
          <Card
            className="shadow-sm"
            style={{ backgroundColor: "#f0f9ff", borderColor: "#0284c7" }}
          >
            <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <TrophyOutlined /> General Feedback
            </h4>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {generalFeedback}
            </p>
          </Card>
        )}

        {/* Detailed Criteria */}
        <Card title="Detailed Evaluation Criteria" className="shadow-sm">
          <Collapse
            items={collapseItems}
            defaultActiveKey={["1", "2", "3", "4"]}
            ghost
          />
        </Card>

        {/* Detailed Corrections */}
        {detailedCorrections &&
          Array.isArray(detailedCorrections) &&
          detailedCorrections.length > 0 && (
            <Card
              title={
                <span className="flex items-center gap-2">
                  <AlertOutlined className="text-amber-500" /> Improvements &
                  Corrections
                </span>
              }
              className="shadow-sm"
            >
              <div className="grid gap-4">
                {detailedCorrections.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Tag
                        color={item.type === "Grammar" ? "red" : "blue"}
                        className="font-semibold"
                      >
                        {item.type}
                      </Tag>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <span className="font-semibold text-red-700 block mb-2 text-sm">
                          Mistake:
                        </span>
                        <span className="text-gray-700 line-through decoration-red-400 decoration-2">
                          {item.mistake}
                        </span>
                      </div>
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <span className="font-semibold text-green-700 block mb-2 text-sm">
                          Better Version:
                        </span>
                        <span className="text-gray-700">{item.correct}</span>
                      </div>
                    </div>
                    {item.explanation && (
                      <div className="text-sm text-gray-600 italic bg-blue-50 p-3 rounded border border-blue-200">
                        <span className="font-bold text-blue-700">
                          Explanation:{" "}
                        </span>
                        {item.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
      </div>
    </div>
  );
};

// --- COMPONENT: Render Writing Submission (Giữ nguyên) ---
const RenderWritingSubmission = ({ submission }) => {
  if (!submission) return null;

  const { submission_text, writingTask, feedback } = submission;
  const feedbackData = feedback && feedback.length > 0 ? feedback[0] : null;

  const collapseItems = [
    {
      key: "1",
      label: (
        <span className="font-semibold flex items-center gap-2">
          <FileTextOutlined /> Task Response
        </span>
      ),
      children: (
        <p className="text-gray-600 whitespace-pre-wrap">
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
        <p className="text-gray-600 whitespace-pre-wrap">
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
        <p className="text-gray-600 whitespace-pre-wrap">
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
        <p className="text-gray-600 whitespace-pre-wrap">
          {feedbackData?.grammaticalRangeAndAccuracy || "No feedback available"}
        </p>
      ),
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {writingTask?.task_type || "Writing Task"}
              </h3>
              <p className="text-gray-600 text-sm">
                {writingTask?.title || "No title"}
              </p>
            </div>
          </div>
        </Card>
        <Card
          title={
            <span>
              <EditOutlined /> Your Submission
            </span>
          }
          className="shadow-sm"
        >
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {submission_text || "No submission text"}
            </p>
          </div>
        </Card>
        {feedbackData?.generalFeedback && (
          <Card
            className="shadow-sm"
            style={{ backgroundColor: "#f0f9ff", borderColor: "#0284c7" }}
          >
            <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <TrophyOutlined /> General Feedback
            </h4>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {feedbackData.generalFeedback}
            </p>
          </Card>
        )}
        <Card title="Detailed Evaluation" className="shadow-sm">
          <Collapse items={collapseItems} defaultActiveKey={["1"]} ghost />
        </Card>
        {feedbackData?.detailedCorrections &&
          Array.isArray(feedbackData.detailedCorrections) &&
          feedbackData.detailedCorrections.length > 0 && (
            <Card
              title={
                <span className="flex items-center gap-2">
                  <AlertOutlined className="text-amber-500" /> Improvements
                </span>
              }
              className="shadow-sm"
            >
              <div className="grid gap-4">
                {feedbackData.detailedCorrections.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <Tag color="red" className="mb-2">
                      {item.type}
                    </Tag>
                    <div className="grid md:grid-cols-2 gap-4 mb-2">
                      <div className="bg-red-50 p-2 rounded text-gray-600 line-through decoration-red-400">
                        {item.mistake}
                      </div>
                      <div className="bg-green-50 p-2 rounded text-gray-800">
                        {item.correct}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 italic">
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

// --- MAIN MODAL COMPONENT ---
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
      map[ua.idQuestion] = { value: val, isCorrect: ua.isCorrect };
    });
    return map;
  }, [data]);

  const RenderPartTab = ({ part }) => {
    const hasPassage =
      part.passage &&
      part.passage.content &&
      part.passage.content.trim().length > 0;
    return (
      <div className="h-full flex flex-col md:flex-row gap-6 overflow-hidden bg-gray-100 p-4">
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
              let isMultiple = displayTitle.startsWith("Multiple ||| ");
              displayTitle = displayTitle
                .replace("Multiple ||| ", "")
                .replace("Single ||| ", "");
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
    if (!data) return [];

    // --- LOGIC MỚI: Tự động tìm dữ liệu ở mọi nơi ---
    const submissionList =
      data.writingSubmission ||
      data.speakingSubmission ||
      data.submissions ||
      [];

    if (submissionList.length > 0) {
      return submissionList.map((submission, index) => {
        // KIỂM TRA: Dựa vào JSON bạn cung cấp để phân biệt
        // Speaking có 'idSpeakingSubmission' hoặc 'audioUrl'
        const isSpeaking =
          submission.idSpeakingSubmission ||
          submission.audioUrl ||
          data.test?.testType === "SPEAKING";

        return {
          key:
            submission.idWritingSubmission ||
            submission.idSpeakingSubmission ||
            String(index),
          label: isSpeaking
            ? `Speaking Part ${index + 1}`
            : submission.writingTask?.task_type === "TASK1"
            ? "Task 1"
            : submission.writingTask?.task_type === "TASK2"
            ? "Task 2"
            : `Task ${index + 1}`,
          children: isSpeaking ? (
            <RenderSpeakingSubmission submission={submission} />
          ) : (
            <RenderWritingSubmission submission={submission} />
          ),
        };
      });
    }

    // Default: Reading/Listening
    if (!data.test?.parts) return [];
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
              {/* Logic hiển thị thống kê Header */}
              {data.test?.testType === "WRITING" ||
              data.test?.testType === "SPEAKING" ? (
                <Statistic
                  title="Parts"
                  value={tabItems.length}
                  valueStyle={{ color: "#16a34a", fontWeight: "bold" }}
                  prefix={<FileTextOutlined />}
                />
              ) : (
                <Statistic
                  title="Câu đúng"
                  value={data.total_correct}
                  suffix={`/ ${data.total_questions}`}
                  valueStyle={{ color: "#16a34a", fontWeight: "bold" }}
                  prefix={<CheckCircleOutlined />}
                />
              )}
              <div className="h-10 w-px bg-gray-300 mx-2 hidden md:block"></div>
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
