import React, { useEffect, useState, useRef } from "react";
import { Button, Spin, message, Result, Card } from "antd";
import {
  SmileOutlined,
  ClockCircleOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import QuestionRenderer from "./reading/render/QuestionRenderer";
import {
  getDetailInTestAPI,
  createManyAnswersAPI,
  FinistTestAPI,
} from "@/services/apiDoTest";
import {
  getPartByIdAPI,
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
} from "@/services/apiTest";
import { useAuth } from "@/context/authContext";

// --- CONSTANTS ---
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

// --- HELPERS ---
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
};

function mapGroup(apiGroup) {
  const type_question =
    TYPE_MAPPING[apiGroup.typeQuestion] || apiGroup.typeQuestion;

  const questions = (apiGroup.question || []).map((q) => ({
    question_id: q.idQuestion,
    question_number: q.numberQuestion,
    question_text: q.content,
    answers: (q.answers || []).map((a) => ({
      answer_id: a.idAnswer,
      answer_text: a.answer_text,
      matching_key: a.matching_key,
      matching_value: a.matching_value,
    })),
  }));

  return {
    title: apiGroup.title,
    quantity: apiGroup.quantity,
    type_question,
    instruction: apiGroup.instruction || "",
    questions,
  };
}

const Reading = ({ idTest, initialTestResult, duration }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);

  const [activePartIndex, setActivePartIndex] = useState(0);
  const [partDetail, setPartDetail] = useState(null);

  const [testResult, setTestResult] = useState(initialTestResult || null);
  const [answers, setAnswers] = useState({});
  const [inProgress, setInProgress] = useState(!!initialTestResult);
  const [bandScore, setBandScore] = useState(null);

  // Timer state
  const [timeLeft, setTimeLeft] = useState((duration || 60) * 60);
  const isSubmittingRef = useRef(false);

  // Load Test Data
  useEffect(() => {
    if (!idTest) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getDetailInTestAPI(idTest);
        setTest(res?.data || null);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải nội dung đề");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [idTest]);

  // Load Part Detail
  useEffect(() => {
    const loadPartDetail = async () => {
      try {
        setPartDetail(null);
        const part = test?.parts?.[activePartIndex];
        if (!part || !part.idPart) return;
        const res = await getPartByIdAPI(part.idPart);
        let detail = res?.data?.[0] || null;

        if (detail && Array.isArray(detail.groupOfQuestions)) {
          const enrichedGroups = await Promise.all(
            detail.groupOfQuestions.map(async (g) => {
              try {
                const grpRes = await getQuestionsByIdGroupAPI(
                  g.idGroupOfQuestions
                );
                const grpData = grpRes?.data?.[0] || {};
                const questions = Array.isArray(grpData.question)
                  ? grpData.question
                  : [];
                const questionsWithAnswers = await Promise.all(
                  questions.map(async (q) => {
                    try {
                      const ansRes = await getAnswersByIdQuestionAPI(
                        q.idQuestion
                      );
                      return { ...q, answers: ansRes?.data || [] };
                    } catch (e) {
                      return { ...q, answers: [] };
                    }
                  })
                );
                return { ...g, question: questionsWithAnswers };
              } catch (e) {
                return { ...g, question: [] };
              }
            })
          );
          detail = { ...detail, groupOfQuestions: enrichedGroups };
        }
        setPartDetail(detail);
      } catch (err) {
        console.error("load part detail", err);
        setPartDetail(null);
      }
    };
    if (test) loadPartDetail();
  }, [test, activePartIndex]);

  // Handle Finish
  const handleFinish = async (isAutoSubmit = false) => {
    if (isSubmittingRef.current || !inProgress) return;
    isSubmittingRef.current = true;

    if (!user?.idUser || !testResult?.idTestResult) {
      message.error("Lỗi dữ liệu bài làm");
      isSubmittingRef.current = false;
      return;
    }

    try {
      if (isAutoSubmit) {
        message.warning("Hết giờ làm bài! Hệ thống đang tự động nộp...");
      } else {
        message.loading({ content: "Đang nộp bài...", key: "submitting" });
      }

      const res = await FinistTestAPI(testResult.idTestResult, user.idUser, {});
      const score = res?.band_score ?? res?.data?.band_score ?? 0;

      setBandScore(score);
      setInProgress(false);

      if (!isAutoSubmit) {
        message.success({ content: "Nộp bài thành công!", key: "submitting" });
      } else {
        message.success("Đã nộp bài tự động.");
      }
      window.dispatchEvent(new Event("streak-update"));
    } catch (err) {
      console.error(err);
      message.error("Nộp bài thất bại");
      isSubmittingRef.current = false;
    }
  };

  // Timer Effect
  useEffect(() => {
    if (loading || !inProgress || !test) return;
    if (timeLeft <= 0) {
      handleFinish(true);
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, loading, inProgress, test]);

  // Handle Answer Change (UPDATED)
  const handleAnswerChange = async (questionId, value, questionType) => {
    if (!inProgress) return;

    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (!user?.idUser || !testResult?.idTestResult) return;

    try {
      const payload = {
        answers: [
          {
            idQuestion: questionId,
            answerText: value,
            userAnswerType: questionType, // Sử dụng Type được truyền vào
            matching_key: null,
            matching_value: null,
          },
        ],
      };
      await createManyAnswersAPI(user.idUser, testResult.idTestResult, payload);
    } catch (err) {
      console.error("Save answer failed", err);
    }
  };

  if (loading)
    return (
      <div className="py-10 text-center">
        <Spin size="large" />
      </div>
    );
  if (!test)
    return (
      <div className="py-10 text-center text-gray-500">Không tìm thấy đề</div>
    );

  // Render Result
  if (!inProgress && bandScore !== null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card
          className="w-full max-w-2xl shadow-lg rounded-xl overflow-hidden"
          bodyStyle={{ padding: "40px 24px" }}
        >
          <Result
            icon={<SmileOutlined style={{ color: "#1890ff" }} />}
            status="success"
            title="Chúc mừng bạn đã hoàn thành bài thi!"
            subTitle={
              <div className="space-y-2">
                <p className="text-gray-500">
                  Kết quả bài làm của bạn đã được hệ thống ghi nhận.
                </p>
                <div className="text-3xl font-bold text-blue-600 mt-4">
                  Band Score: {bandScore}
                </div>
              </div>
            }
            extra={[
              <Button
                type="primary"
                key="home"
                size="large"
                onClick={() => navigate("/homepage")}
              >
                Quay về trang chủ
              </Button>,
              <Button
                key="review"
                size="large"
                onClick={() =>
                  message.info("Tính năng xem lại bài làm đang phát triển")
                }
              >
                Xem lại bài làm
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  // --- RENDER CHÍNH ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- HEADER --- */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md h-[72px] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <FormOutlined style={{ fontSize: "20px" }} />
          </div>
          <div>
            <h1
              className="text-lg font-bold truncate max-w-[300px] md:max-w-md m-0 leading-tight"
              title={test.title}
            >
              {test.title}
            </h1>
            <p className="text-xs text-gray-500 m-0 hidden md:block">
              Reading Test
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div
            className={`flex items-center gap-2 text-xl font-mono font-bold px-4 py-1.5 rounded-lg border shadow-sm transition-all ${
              timeLeft < 300
                ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                : "bg-gray-50 text-gray-700 border-gray-200"
            }`}
          >
            <ClockCircleOutlined />
            {formatTime(timeLeft)}
          </div>

          {/* Submit Button */}
          <Button
            type="primary"
            danger
            size="large"
            onClick={() => handleFinish(false)}
            className="font-semibold shadow-md hover:scale-105 transition-transform"
          >
            NỘP BÀI
          </Button>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="pt-[90px] p-6 max-w-[1400px] mx-auto h-screen flex flex-col">
        {/* Navigation Parts */}
        <div className="flex gap-2 overflow-x-auto mb-4 pb-1 shrink-0">
          {test.parts.map((p, idx) => (
            <button
              key={p.idPart}
              onClick={() => setActivePartIndex(idx)}
              className={`px-5 py-2 rounded-full border text-sm font-semibold transition-all whitespace-nowrap ${
                idx === activePartIndex
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
              }`}
            >
              {p.namePart || `Part ${idx + 1}`}
            </button>
          ))}
        </div>

        {/* Passage & Questions Columns */}
        {test.parts[activePartIndex] &&
          (() => {
            const part = test.parts[activePartIndex];
            const renderPart = partDetail || part;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Passage Column */}
                <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 flex justify-between items-center sticky top-0">
                    <span>📖 Passage Content</span>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {renderPart?.passage?.content ? (
                      <div
                        className="prose max-w-none text-gray-800 leading-relaxed font-serif text-lg"
                        dangerouslySetInnerHTML={{
                          __html: renderPart.passage.content,
                        }}
                      />
                    ) : (
                      <div className="text-center py-10 text-gray-400">
                        Không có dữ liệu bài đọc
                      </div>
                    )}
                  </div>
                </div>

                {/* Questions Column */}
                <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 sticky top-0 z-10">
                    <span>✍️ Questions</span>
                  </div>
                  <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
                    {(
                      renderPart.groupOfQuestions ||
                      part.groupOfQuestions ||
                      []
                    ).map((group) => {
                      // Xác định Type Question từ dữ liệu có sẵn
                      const rawType = group.typeQuestion;
                      const finalType = TYPE_MAPPING[rawType] || "SHORT_ANSWER";

                      return (
                        <div
                          key={group.idGroupOfQuestions}
                          className="mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                        >
                          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                            <h4 className="font-bold text-gray-800 text-base">
                              {group.title || "Group"}
                            </h4>
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {group.quantity} Questions
                            </span>
                          </div>

                          {/* Truyền finalType vào handler thông qua Arrow Function */}
                          <QuestionRenderer
                            group={mapGroup(group)}
                            onAnswerChange={(qId, val) =>
                              handleAnswerChange(qId, val, finalType)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
};

export default Reading;
