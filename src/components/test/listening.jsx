import React, { useEffect, useState, useRef } from "react";
import { Button, Spin, message, Result, Card } from "antd";
import {
  SmileOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import QuestionRenderer from "./reading/render/QuestionRenderer";
import SimpleResultModal from "./SimpleResultModal";
import {
  getDetailInTestAPI,
  createManyAnswersAPI,
  FinistTestAPI,
  getTestResultAndAnswersAPI,
} from "@/services/apiDoTest";
import {
  getPartByIdAPI,
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
} from "@/services/apiTest";
import { useAuth } from "@/context/authContext";

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

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
};

// Helper: Map API data to Component data
function mapGroup(apiGroup) {
  const type_question =
    TYPE_MAPPING[apiGroup.typeQuestion] || apiGroup.typeQuestion;

  const questions = (apiGroup.question || []).map((q) => {
    const answers = (q.answers || []).map((a) => ({
      answer_id: a.idAnswer,
      answer_text: a.answer_text,
      matching_key: a.matching_key,
      matching_value: a.matching_value,
    }));

    return {
      question_id: q.idQuestion,
      question_number: q.numberQuestion,
      question_text: q.content,
      correct_answers: q.correct_answers,
      answers,
    };
  });

  return {
    id: apiGroup.idGroupOfQuestions,
    title: apiGroup.title,
    quantity: apiGroup.quantity,
    type_question,
    img: apiGroup.img,
    instruction: apiGroup.instruction || "",
    questions,
  };
}

const Listening = ({ idTest, initialTestResult, duration }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [activePartIndex, setActivePartIndex] = useState(0);

  // Caching parts
  const [loadedParts, setLoadedParts] = useState({});
  const [isPartLoading, setIsPartLoading] = useState(false);

  // Result & Answers
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [testResult, setTestResult] = useState(initialTestResult || null);
  const [answers, setAnswers] = useState({});
  const [inProgress, setInProgress] = useState(!initialTestResult?.finishedAt);
  const [isReviewMode, setIsReviewMode] = useState(
    !!initialTestResult?.finishedAt
  );
  const [bandScore, setBandScore] = useState(
    initialTestResult?.band_score || null
  );

  // Timer & Submission
  const [timeLeft, setTimeLeft] = useState((duration || 40) * 60);
  const isSubmittingRef = useRef(false);

  // --- 1. INITIAL LOAD & SYNC ---
  useEffect(() => {
    if (
      initialTestResult?.userAnswer &&
      initialTestResult.userAnswer.length > 0
    ) {
      const mappedAnswers = {};
      initialTestResult.userAnswer.forEach((ans) => {
        mappedAnswers[ans.idQuestion] = {
          value: ans.matching_key || ans.answerText,
          text: ans.answerText,
          type: ans.userAnswerType,
          isCorrect: ans.isCorrect,
        };
      });
      setAnswers(mappedAnswers);
    }
  }, [initialTestResult]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (initialTestResult?.idTestResult && initialTestResult?.finishedAt) {
          const res = await getTestResultAndAnswersAPI(
            initialTestResult.idTestResult
          );
          if (res && res.data) {
            setTestResult(res.data);
            setBandScore(res.data.band_score);
            setTest(res.data.test);
            setInProgress(false);
            if (res.data.test?.parts) {
              const initialCache = {};
              res.data.test.parts.forEach((p) => {
                initialCache[p.idPart] = p;
              });
              setLoadedParts(initialCache);
            }
          }
        } else if (idTest) {
          const res = await getDetailInTestAPI(idTest);
          setTest(res?.data || null);
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        message.error("Không thể tải nội dung.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [idTest, initialTestResult]);

  // --- 2. LAZY LOAD PARTS ---
  useEffect(() => {
    if (!test || !test.parts) return;
    const currentPart = test.parts[activePartIndex];
    if (!currentPart || !currentPart.idPart) return;
    if (loadedParts[currentPart.idPart]) return;

    const loadPartDetail = async () => {
      setIsPartLoading(true);
      try {
        const res = await getPartByIdAPI(currentPart.idPart);
        let detail = res?.data?.[0] || null;
        if (detail) {
          if (Array.isArray(detail.groupOfQuestions)) {
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
          setLoadedParts((prev) => ({
            ...prev,
            [currentPart.idPart]: detail,
          }));
        }
      } catch (err) {
        console.error("load part detail error", err);
        message.error("Không tải được nội dung phần này");
      } finally {
        setIsPartLoading(false);
      }
    };
    loadPartDetail();
  }, [test, activePartIndex, loadedParts]);

  // --- 3. LOGIC XỬ LÝ ĐÁP ÁN ---
  const handleAnswerChange = (
    questionId,
    value,
    questionType,
    textContent = null
  ) => {
    if (!inProgress) return;
    const finalContent = textContent !== null ? textContent : value;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        value: value,
        text: finalContent,
        type: questionType,
      },
    }));
  };

  const getAnswerText = (qId, key) => {
    for (const part of Object.values(loadedParts)) {
      if (!part?.groupOfQuestions) continue;
      for (const group of part.groupOfQuestions) {
        if (!group.question) continue;
        for (const q of group.question) {
          if (q.idQuestion === qId) {
            const ans = q.answers?.find((a) => a.matching_key === key);
            if (ans) return ans.answer_text;
          }
        }
      }
    }
    return null;
  };

  // --- 4. SUBMIT LOGIC (ĐÃ FIX) ---
  const handleFinish = async (isAutoSubmit = false) => {
    if (isSubmittingRef.current || !inProgress) return;
    isSubmittingRef.current = true;
    const currentTestResultId = testResult?.idTestResult;

    if (!user?.idUser || !currentTestResultId) {
      message.error("Lỗi: Không tìm thấy ID bài làm");
      isSubmittingRef.current = false;
      return;
    }

    try {
      if (!isAutoSubmit)
        message.loading({ content: "Đang nộp bài...", key: "submitting" });

      const flattenedAnswers = [];

      Object.entries(answers).forEach(([qId, data]) => {
        let matchingValue = null;
        if (data.type === "YES_NO_NOTGIVEN" || data.type === "TFNG") {
          matchingValue = data.value;
        }

        // --- CASE 1: LABELING (FIXED) ---
        // Labeling bắt buộc phải gửi matching_key (là A, B...)
        // answerText sẽ là nội dung mô tả (nếu có), nếu không thì rỗng
        if (data.type === "LABELING") {
          const resolvedText = getAnswerText(qId, data.value);
          flattenedAnswers.push({
            idQuestion: qId,
            answerText: resolvedText || "", // Nội dung (Content)
            userAnswerType: data.type,
            matching_key: data.value, // Key (A, B, C...)
            matching_value: null,
          });
        }
        // --- CASE 2: MCQ / MATCHING ---
        else if (data.type === "MCQ" || data.type === "MATCHING") {
          if (Array.isArray(data.value)) {
            data.value.forEach((val) => {
              flattenedAnswers.push({
                idQuestion: qId,
                answerText: getAnswerText(qId, val) || "",
                userAnswerType: data.type,
                matching_key: val,
                matching_value: matchingValue,
              });
            });
          } else {
            flattenedAnswers.push({
              idQuestion: qId,
              answerText: data.text || getAnswerText(qId, data.value) || "",
              userAnswerType: data.type,
              matching_key: data.value,
              matching_value: matchingValue,
            });
          }
        }
        // --- CASE 3: FILL BLANK / OTHERS ---
        else {
          // Check xem value có phải là một Key trong Options box không
          const resolvedTextFromKey = getAnswerText(qId, data.value);
          if (resolvedTextFromKey) {
            // Case Box: Value là Key (A), Text là nội dung
            flattenedAnswers.push({
              idQuestion: qId,
              answerText: resolvedTextFromKey,
              userAnswerType: data.type,
              matching_key: data.value,
              matching_value: matchingValue,
            });
          } else {
            // Case Nhập tay: Value là Text
            flattenedAnswers.push({
              idQuestion: qId,
              answerText: data.text || data.value,
              userAnswerType: data.type,
              matching_key: null,
              matching_value: matchingValue,
            });
          }
        }
      });

      const answersPayload = { answers: flattenedAnswers };
      if (answersPayload.answers.length > 0) {
        await createManyAnswersAPI(
          user.idUser,
          currentTestResultId,
          answersPayload
        );
      }

      const res = await FinistTestAPI(currentTestResultId, user.idUser, {});
      const score = res?.band_score ?? res?.data?.band_score ?? 0;
      setBandScore(score);
      setInProgress(false);
      const finishData = res?.data || res || {};
      setTestResult((prev) => ({ ...prev, ...finishData }));
      message.success({ content: "Nộp bài thành công!", key: "submitting" });
      window.dispatchEvent(new Event("streak-update"));
    } catch (err) {
      console.error(err);
      message.error({ content: "Nộp bài thất bại", key: "submitting" });
      isSubmittingRef.current = false;
    }
  };

  const handleSwitchToReview = () => {
    if (!testResult?.idTestResult) {
      message.error("Chưa có kết quả bài thi để xem lại.");
      return;
    }
    setIsResultModalOpen(true);
  };

  // Timer Countdown
  useEffect(() => {
    if (loading || !inProgress || !test) return;
    if (timeLeft <= 0) {
      handleFinish(true);
      return;
    }
    const timerId = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, loading, inProgress, test]);

  // --- RENDER ---
  if (loading)
    return (
      <div className="py-20 text-center">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  if (!test)
    return (
      <div className="py-20 text-center text-gray-500">Không tìm thấy đề</div>
    );

  if (!inProgress && !isReviewMode && bandScore !== null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl rounded-2xl">
          <Result
            icon={<SmileOutlined style={{ color: "#1890ff" }} />}
            status="success"
            title="Chúc mừng bạn đã hoàn thành bài thi Listening!"
            subTitle={
              <div className="space-y-2">
                <p className="text-gray-500">
                  Hệ thống đã ghi nhận kết quả của bạn.
                </p>
                <div className="text-4xl font-extrabold text-blue-600 mt-4">
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
                Về trang chủ
              </Button>,
              <Button
                key="review"
                size="large"
                icon={<EyeOutlined />}
                onClick={handleSwitchToReview}
              >
                Xem chi tiết đáp án
              </Button>,
            ]}
          />
        </Card>
        <SimpleResultModal
          open={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          idTestResult={testResult?.idTestResult}
        />
      </div>
    );
  }

  const part = test.parts[activePartIndex];
  const cachedPart = loadedParts[part?.idPart];
  const renderPart = cachedPart || part;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* 1. TOP BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md h-[72px] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            {isReviewMode ? (
              <EyeOutlined className="text-xl" />
            ) : (
              <CustomerServiceOutlined className="text-xl" />
            )}
          </div>
          <div className="overflow-hidden">
            <h1
              className="text-lg font-bold truncate max-w-[250px] md:max-w-md m-0 leading-tight"
              title={test.title}
            >
              {test.title}
            </h1>
            <p className="text-xs text-gray-500 m-0">IELTS Listening Test</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isReviewMode ? (
            <>
              <div
                className={`flex items-center gap-2 text-xl font-mono font-bold px-4 py-1.5 rounded-lg border shadow-sm ${
                  timeLeft < 300
                    ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                <ClockCircleOutlined />
                {formatTime(timeLeft)}
              </div>
              <Button
                type="primary"
                danger
                size="large"
                onClick={() => handleFinish(false)}
                className="font-semibold shadow-md hover:scale-105 transition-transform"
              >
                NỘP BÀI
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="font-bold text-xl text-blue-600 mr-2">
                Score: {bandScore}
              </span>
              <Button onClick={() => setIsReviewMode(false)}>
                Thoát xem lại
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. AUDIO PLAYER */}
      <div className="fixed top-[72px] left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm py-3 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0">
            Audio Source
          </div>
          <audio
            controls
            controlsList="nodownload"
            className="w-full h-10 outline-none rounded-full shadow-inner bg-gray-100"
            src={test.audioUrl}
            style={{ borderRadius: "20px" }}
          >
            Trình duyệt của bạn không hỗ trợ audio.
          </audio>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="pt-[140px] pb-20 px-4 md:px-8 max-w-5xl mx-auto w-full flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-2 shrink-0 justify-center">
          {test.parts.map((p, idx) => (
            <button
              key={p.idPart}
              onClick={() => setActivePartIndex(idx)}
              className={`px-6 py-2.5 rounded-full border text-sm font-bold transition-all shadow-sm whitespace-nowrap ${
                idx === activePartIndex
                  ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              {p.namePart || `Part ${idx + 1}`}
            </button>
          ))}
        </div>

        {/* Part Content */}
        <div className="relative min-h-[400px]">
          {isPartLoading && !cachedPart && (
            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-start justify-center pt-20">
              <Spin size="large" tip="Đang tải câu hỏi..." />
            </div>
          )}

          {renderPart && (
            <div className="space-y-8 animate-fadeIn">
              {(renderPart.groupOfQuestions || part.groupOfQuestions || []).map(
                (group) => {
                  const rawType = group.typeQuestion;
                  const finalType = TYPE_MAPPING[rawType] || "SHORT_ANSWER";

                  let displayTitle = group.title || "Question Group";
                  let isMultiple = false;

                  if (displayTitle.startsWith("Multiple ||| ")) {
                    displayTitle = displayTitle.replace("Multiple ||| ", "");
                    isMultiple = true;
                  } else if (displayTitle.startsWith("Single ||| ")) {
                    displayTitle = displayTitle.replace("Single ||| ", "");
                    isMultiple = false;
                  }

                  return (
                    <div
                      key={group.idGroupOfQuestions}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      {/* Header Group */}
                      <div className="bg-slate-50/80 px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                        <h3 className="font-bold text-slate-800 text-lg">
                          {displayTitle}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white bg-slate-500 px-2 py-1 rounded">
                            {finalType}
                          </span>
                          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {group.quantity} Questions
                          </span>
                        </div>
                      </div>

                      {/* Questions Body */}
                      <div className="p-6">
                        <QuestionRenderer
                          group={mapGroup(group)}
                          onAnswerChange={(qId, val, text) =>
                            !isReviewMode &&
                            handleAnswerChange(qId, val, finalType, text)
                          }
                          userAnswers={answers}
                          isReviewMode={isReviewMode}
                          isMultiple={isMultiple}
                        />
                      </div>
                    </div>
                  );
                }
              )}

              {(!renderPart.groupOfQuestions ||
                renderPart.groupOfQuestions.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  Chưa có câu hỏi cho phần này.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Listening;
