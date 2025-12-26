import React, { useEffect, useState, useRef, useMemo } from "react";
import { Button, Spin, message, Result, Card } from "antd";
import {
  SmileOutlined,
  ClockCircleOutlined,
  FormOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import QuestionRenderer from "./reading/render/QuestionRenderer";
import SimpleResultModal from "./SimpleResultModal";
import TestNavigationPanel from "./TestNavigationPanel";
import GradingAnimation from "./GradingAnimation";
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
  const [loadedParts, setLoadedParts] = useState({});
  const [isPartLoading, setIsPartLoading] = useState(false);
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
  const [timeLeft, setTimeLeft] = useState((duration || 60) * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Navigation state
  const questionRefs = useRef({});
  const [navPanelWidth, setNavPanelWidth] = useState(20); // Navigation panel width

  // Resizer state
  const [leftPanelWidth, setLeftPanelWidth] = useState(45);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth >= 30 && newWidth <= 70) {
        setLeftPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Load lại đáp án cũ khi Review
  useEffect(() => {
    if (
      initialTestResult?.userAnswer &&
      initialTestResult.userAnswer.length > 0
    ) {
      const mappedAnswers = {};
      initialTestResult.userAnswer.forEach((ans) => {
        mappedAnswers[ans.idQuestion] = {
          value: ans.matching_key || ans.answerText, // Ưu tiên lấy matching_key nếu có (cho dạng Box)
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

  // Flatten all questions from all parts for navigation
  const allQuestions = useMemo(() => {
    const flattened = [];
    if (!test || !test.parts) return flattened;

    test.parts.forEach((part, partIndex) => {
      const partDetail = loadedParts[part.idPart] || part;
      const groups = partDetail.groupOfQuestions || [];

      groups.forEach((group) => {
        const questions = group.question || [];
        questions.forEach((q) => {
          flattened.push({
            question_id: q.idQuestion,
            question_number: q.numberQuestion,
            partIndex: partIndex,
            groupId: group.idGroupOfQuestions,
          });
        });
      });
    });

    return flattened;
  }, [test, loadedParts]);

  // Handle jump to question
  const handleQuestionClick = (questionId, partIndex) => {
    // Switch to the correct part if needed
    if (partIndex !== activePartIndex) {
      setActivePartIndex(partIndex);
    }

    // Scroll to question after a short delay to allow part switch
    setTimeout(() => {
      const questionElement = questionRefs.current[questionId];
      if (questionElement) {
        questionElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, partIndex !== activePartIndex ? 300 : 0);
  };

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

  // Hàm tìm Text dựa trên Key và ID câu hỏi
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
    return null; // Trả về null nếu không tìm thấy key (nghĩa là input thường)
  };

  const handleFinish = async (isAutoSubmit = false) => {
    if (isSubmittingRef.current || !inProgress) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    const currentTestResultId = testResult?.idTestResult;
    if (!user?.idUser || !currentTestResultId) {
      message.error("Lỗi: Không tìm thấy ID bài làm (TestResultID)");
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    try {
      if (!isAutoSubmit)
        message.loading({ content: "Đang nộp bài...", key: "submitting" });

      const flattenedAnswers = [];

      Object.entries(answers).forEach(([qId, data]) => {
        let matchingValue = null;
        // Xử lý riêng cho YES/NO/TFNG
        if (data.type === "YES_NO_NOTGIVEN" || data.type === "TFNG") {
          matchingValue = data.value;
        }

        // --- XỬ LÝ QUAN TRỌNG TẠI ĐÂY ---
        if (data.type === "MCQ" || data.type === "MATCHING") {
          // Logic cũ cho MCQ/Matching
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
        } else {
          // --- LOGIC MỚI CHO FILL_BLANK VÀ CÁC DẠNG KHÁC ---

          // Thử tìm text tương ứng với value (Giả sử value là Key A, B...)
          const resolvedTextFromKey = getAnswerText(qId, data.value);

          if (resolvedTextFromKey) {
            // [CASE 1]: Đây là dạng Box (Value là Key "A", resolvedText là "Evolution")
            flattenedAnswers.push({
              idQuestion: qId,
              answerText: resolvedTextFromKey, // Gửi nội dung chữ
              userAnswerType: data.type,
              matching_key: data.value, // Gửi Key (A, B...)
              matching_value: matchingValue,
            });
          } else {
            // [CASE 2]: Đây là dạng nhập tay (Value là text user nhập)
            flattenedAnswers.push({
              idQuestion: qId,
              answerText: data.text || data.value,
              userAnswerType: data.type,
              matching_key: null, // Không có Key
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
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToReview = () => {
    if (!testResult?.idTestResult) {
      message.error("Chưa có kết quả bài thi để xem lại.");
      return;
    }
    setIsResultModalOpen(true);
  };

  useEffect(() => {
    if (loading || !inProgress || !test) return;
    if (timeLeft <= 0) {
      handleFinish(true);
      return;
    }
    const timerId = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, loading, inProgress, test]);

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

  if (!inProgress && !isReviewMode && bandScore !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
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
                icon={<EyeOutlined />}
                onClick={handleSwitchToReview}
              >
                Xem lại bài làm
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Show Grading Animation when submitting */}
      {isSubmitting && <GradingAnimation testType="READING" />}

      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 shadow-lg border-b border-slate-200 dark:border-slate-800 h-[72px] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-600">
            {isReviewMode ? (
              <EyeOutlined className="text-2xl text-white" />
            ) : (
              <FormOutlined className="text-2xl text-white" />
            )}
          </div>
          <div>
            <h1
              className="text-lg font-bold truncate max-w-[300px] md:max-w-md m-0 leading-tight text-slate-800 dark:text-white"
              title={test.title}
            >
              {test.title}{" "}
              {isReviewMode && (
                <span className="text-blue-600 dark:text-blue-400">(Review Mode)</span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 hidden md:block font-medium">
              📖 IELTS Reading Test
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isReviewMode ? (
            <>
              <div
                className={`flex items-center gap-2 text-xl font-mono font-bold px-5 py-2 rounded-xl border-2 shadow-lg transition-all duration-300 ${timeLeft < 300
                  ? "bg-red-600 text-white border-red-500 animate-pulse"
                  : timeLeft < 600
                    ? "bg-orange-600 text-white border-orange-500"
                    : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700"
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
                className="font-bold shadow-xl hover:scale-105 transition-transform bg-blue-600 hover:bg-blue-700 border-0 h-12 px-6"
              >
                🚀 SUBMIT TEST
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
              <span className="font-bold text-2xl text-blue-400">
                ⭐ Score: {bandScore}
              </span>
              <Button
                onClick={() => setIsReviewMode(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                Exit Review
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="pt-[90px] p-6 max-w-[1600px] mx-auto h-screen flex flex-col">
        <div className="flex gap-2 overflow-x-auto mb-4 pb-1 shrink-0 justify-center">
          {test.parts.map((p, idx) => (
            <button
              key={p.idPart}
              onClick={() => setActivePartIndex(idx)}
              className={`group px-6 py-3 rounded-xl border-2 text-sm font-bold transition-all shadow-md hover:shadow-lg whitespace-nowrap ${idx === activePartIndex
                ? "bg-blue-600 text-white border-blue-500 scale-105"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
            >
              <div className="flex items-center gap-2">
                <span className={idx === activePartIndex ? "text-xl" : "text-lg"}>
                  {idx === 0 ? "📖" : idx === 1 ? "📚" : "📕"}
                </span>
                <span>{p.namePart || `Part ${idx + 1}`}</span>
                {idx === activePartIndex && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </div>
            </button>
          ))}
        </div>

        {part && (
          <div ref={containerRef} className="flex flex-1 min-h-0 relative gap-3" style={{ userSelect: isDragging ? 'none' : 'auto' }}>
            {/* Navigation Panel */}
            <div
              className="shrink-0"
              style={{ width: `${navPanelWidth}%`, minWidth: '200px', maxWidth: '300px' }}
            >
              <TestNavigationPanel
                parts={test.parts}
                activePartIndex={activePartIndex}
                onPartChange={setActivePartIndex}
                answers={answers}
                allQuestions={allQuestions}
                onQuestionClick={handleQuestionClick}
                testType="reading"
              />
            </div>

            {isPartLoading && !cachedPart && (
              <div className="absolute inset-0 z-50 bg-slate-900/80 flex items-center justify-center rounded-xl backdrop-blur-sm">
                <Spin tip="Đang tải nội dung..." size="large" />
              </div>
            )}
            {/* Passage Panel */}
            <div
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
              style={{ width: `${leftPanelWidth}%` }}
            >
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-white flex justify-between items-center">
                <span>📖 Passage Content</span>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {renderPart?.passage?.content ? (
                  <div
                    className="prose prose-lg max-w-none text-slate-700 dark:text-slate-300 leading-relaxed dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: renderPart.passage.content }}
                  />
                ) : (
                  !isPartLoading && (
                    <div className="text-center py-10 text-slate-500">
                      Không có dữ liệu bài đọc
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Draggable Resizer */}
            <div
              onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
              className={`flex-shrink-0 w-2 cursor-col-resize flex items-center justify-center group transition-colors mx-1 rounded ${isDragging ? 'bg-blue-100 dark:bg-blue-600/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              <div className="flex flex-col gap-1">
                <div className={`w-1 h-1 rounded-full transition-colors ${isDragging ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-600 dark:group-hover:bg-blue-400'}`}></div>
                <div className={`w-1 h-1 rounded-full transition-colors ${isDragging ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-600 dark:group-hover:bg-blue-400'}`}></div>
                <div className={`w-1 h-1 rounded-full transition-colors ${isDragging ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-600 dark:group-hover:bg-blue-400'}`}></div>
                <div className={`w-1 h-1 rounded-full transition-colors ${isDragging ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-600 dark:group-hover:bg-blue-400'}`}></div>
                <div className={`w-1 h-1 rounded-full transition-colors ${isDragging ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-600 dark:group-hover:bg-blue-400'}`}></div>
              </div>
            </div>

            {/* Questions Panel */}
            <div
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
              style={{ width: `${100 - leftPanelWidth}%` }}
            >
              <div
                className={`p-4 border-b border-slate-200 dark:border-slate-700 font-semibold sticky top-0 z-10 ${isReviewMode
                  ? "bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-400"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                  }`}
              >
                <span>✍️ Questions</span>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-slate-800">
                {(
                  renderPart.groupOfQuestions ||
                  part.groupOfQuestions ||
                  []
                ).map((group) => {
                  const rawType = group.typeQuestion;
                  const finalType = TYPE_MAPPING[rawType] || "SHORT_ANSWER";

                  let displayTitle = group.title || "Group";
                  let isMultiple = false;

                  if (displayTitle.startsWith("Multiple ||| ")) {
                    displayTitle = displayTitle.replace("Multiple ||| ", "");
                    isMultiple = true;
                  } else if (displayTitle.startsWith("Single ||| ")) {
                    displayTitle = displayTitle.replace("Single ||| ", "");
                    isMultiple = false;
                  }

                  // Split title by ||| to separate main title from instructions
                  const titleParts = displayTitle.split(' ||| ');
                  const mainTitle = titleParts[0]; // "Questions 1-6"
                  const instructions = titleParts.slice(1); // ["The Reading Passage...", "Choose...", ...]

                  return (
                    <div
                      key={group.idGroupOfQuestions}
                      className="mb-8 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
                        <div className="flex-1">
                          <h4
                            className="font-bold text-gray-800 dark:text-white text-base mb-1 prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: mainTitle }}
                          />
                          {instructions.length > 0 && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                              {instructions.map((instruction, idx) => (
                                <div
                                  key={idx}
                                  className="italic prose prose-sm dark:prose-invert max-w-none"
                                  dangerouslySetInnerHTML={{ __html: instruction }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded ml-4 shrink-0">
                          {group.quantity} Questions
                        </span>
                      </div>

                      <div>
                        {(group.question || []).map((q) => (
                          <div
                            key={q.idQuestion}
                            ref={(el) => (questionRefs.current[q.idQuestion] = el)}
                          >
                            {/* Question content will be rendered by QuestionRenderer */}
                          </div>
                        ))}
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
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reading;
