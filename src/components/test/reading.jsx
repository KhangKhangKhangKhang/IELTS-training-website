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
import {
  getDetailInTestAPI,
  createManyAnswersAPI,
  FinistTestAPI,
  getTestResultAndAnswersAPI, // <--- IMPORT API NÀY
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

    // Logic lấy đáp án đúng để hiển thị (cho mode Review)
    const correct_answers = answers.filter((a) => {
      const val = a.matching_value?.toUpperCase();
      return val === "CORRECT" || val === "TRUE" || val === "YES";
    });

    return {
      question_id: q.idQuestion,
      question_number: q.numberQuestion,
      question_text: q.content,
      answers,
      correct_answers,
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
  const [partDetail, setPartDetail] = useState(null);

  // State
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
  const isSubmittingRef = useRef(false);

  // --- 1. LOAD DATA: Xử lý 2 trường hợp (Làm bài & Xem lại) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // CASE A: Chế độ Review (Đã có kết quả thi và đã kết thúc)
        // Chúng ta gọi API lấy full kết quả + đáp án
        if (initialTestResult?.idTestResult && initialTestResult?.finishedAt) {
          const res = await getTestResultAndAnswersAPI(
            initialTestResult.idTestResult
          );

          if (res && res.data) {
            // 1. Set thông tin kết quả (bao gồm userAnswer có isCorrect)
            setTestResult(res.data);
            setBandScore(res.data.band_score);

            // 2. Set nội dung đề thi (API trả về luôn trong res.data.test)
            // Lưu ý: Nếu API trả về cấu trúc test lồng nhau, hãy check kỹ console log
            setTest(res.data.test);

            setIsReviewMode(true);
            setInProgress(false);
          }
        }
        // CASE B: Chế độ làm bài (Chưa có kết quả hoặc mới bắt đầu)
        else if (idTest) {
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

  // --- 2. REVIEW MAP (Quan trọng: Map user answer từ API) ---
  const reviewAnswersMap = useMemo(() => {
    // Chỉ chạy khi có testResult và userAnswer từ API getTestResultAndAnswersAPI
    if (!testResult?.userAnswer) return {};

    return testResult.userAnswer.reduce((acc, item) => {
      // Logic xác định giá trị hiển thị (Value)
      let val = item.answerText; // Mặc định là text

      // Nếu là MCQ/Matching -> Lấy Matching Key (A, B, C...)
      if (item.userAnswerType === "MCQ" || item.userAnswerType === "MATCHING") {
        // Ưu tiên matching_key, nếu null thì fallback về answerText (phòng hờ)
        val = item.matching_key || item.answerText;
      }

      // Nếu là TFNG/YesNo -> Lấy Matching Value (YES, TRUE...)
      if (
        item.userAnswerType === "YES_NO_NOTGIVEN" ||
        item.userAnswerType === "TFNG"
      ) {
        val = item.matching_value || item.answerText;
      }

      // Map vào object: Key là QuestionID -> Value là { value, isCorrect }
      acc[item.idQuestion] = {
        value: val,
        isCorrect: item.isCorrect, // Lấy trực tiếp từ API (true/false)
      };

      return acc;
    }, {});
  }, [testResult]);

  // --- 3. LOAD PART DETAIL (Khi chuyển Part) ---
  // (Giữ nguyên logic cũ vì nó xử lý việc load chi tiết câu hỏi cho từng Part)
  useEffect(() => {
    if (!test) return; // Chỉ chạy khi đã có test (dù load từ nguồn nào)

    const loadPartDetail = async () => {
      try {
        setPartDetail(null);
        const part = test?.parts?.[activePartIndex];
        if (!part || !part.idPart) return;

        // Nếu API Review đã trả về đủ chi tiết trong groupOfQuestions rồi thì có thể không cần gọi lại
        // Nhưng để an toàn và đồng nhất, ta vẫn gọi logic cũ để enrich data
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
    loadPartDetail();
  }, [test, activePartIndex]);

  // --- 4. HANDLE INPUT CHANGE ---
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

  // --- 5. HANDLE FINISH ---
  const handleFinish = async (isAutoSubmit = false) => {
    if (isSubmittingRef.current || !inProgress) return;
    isSubmittingRef.current = true;

    if (!user?.idUser || !testResult?.idTestResult) {
      message.error("Lỗi dữ liệu bài làm");
      isSubmittingRef.current = false;
      return;
    }

    try {
      if (!isAutoSubmit)
        message.loading({ content: "Đang nộp bài...", key: "submitting" });

      const answersPayload = {
        answers: Object.entries(answers).map(([qId, data]) => {
          let matchingKey = null;
          let matchingValue = null;

          if (data.type === "MCQ" || data.type === "MATCHING") {
            matchingKey = data.value;
          }
          if (data.type === "YES_NO_NOTGIVEN" || data.type === "TFNG") {
            matchingValue = data.value;
          }

          return {
            idQuestion: qId,
            answerText: data.text,
            userAnswerType: data.type,
            matching_key: matchingKey,
            matching_value: matchingValue,
          };
        }),
      };

      if (answersPayload.answers.length > 0) {
        await createManyAnswersAPI(
          user.idUser,
          testResult.idTestResult,
          answersPayload
        );
      }

      // Nộp bài xong -> Lấy điểm
      const res = await FinistTestAPI(testResult.idTestResult, user.idUser, {});
      const score = res?.band_score ?? res?.data?.band_score ?? 0;

      setBandScore(score);
      setInProgress(false);
      setTestResult(res?.data || res); // Lúc này testResult mới chỉ có điểm, chưa chắc có full userAnswer chi tiết

      message.success({ content: "Nộp bài thành công!", key: "submitting" });
      window.dispatchEvent(new Event("streak-update"));
    } catch (err) {
      console.error(err);
      message.error({ content: "Nộp bài thất bại", key: "submitting" });
      isSubmittingRef.current = false;
    }
  };

  // --- 6. SWITCH TO REVIEW MODE (Sau khi nộp bài) ---
  const handleSwitchToReview = async () => {
    if (!testResult?.idTestResult) return;
    setLoading(true);
    try {
      // Gọi lại API chi tiết để lấy isCorrect cho từng câu
      const res = await getTestResultAndAnswersAPI(testResult.idTestResult);
      if (res && res.data) {
        setTestResult(res.data);
        setIsReviewMode(true);
      }
    } catch (error) {
      message.error("Không thể tải kết quả chi tiết");
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (loading || !inProgress || !test) return;
    if (timeLeft <= 0) {
      handleFinish(true);
      return;
    }
    const timerId = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, loading, inProgress, test]);

  // Loading View
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

  // Result View (Màn hình chúc mừng)
  if (!inProgress && !isReviewMode && bandScore !== null) {
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
                icon={<EyeOutlined />}
                onClick={handleSwitchToReview} // Gọi hàm load lại data chi tiết
              >
                Xem lại bài làm
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  // --- RENDER MAIN UI ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md h-[72px] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              isReviewMode
                ? "bg-green-100 text-green-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {isReviewMode ? (
              <EyeOutlined style={{ fontSize: "20px" }} />
            ) : (
              <FormOutlined style={{ fontSize: "20px" }} />
            )}
          </div>
          <div>
            <h1
              className="text-lg font-bold truncate max-w-[300px] md:max-w-md m-0 leading-tight"
              title={test.title}
            >
              {test.title}{" "}
              {isReviewMode && (
                <span className="text-green-600">(Xem lại)</span>
              )}
            </h1>
            <p className="text-xs text-gray-500 m-0 hidden md:block">
              Reading Test
            </p>
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
                Quay lại kết quả
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="pt-[90px] p-6 max-w-[1400px] mx-auto h-screen flex flex-col">
        {/* Parts Tabs */}
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

        {test.parts[activePartIndex] &&
          (() => {
            const part = test.parts[activePartIndex];
            const renderPart = partDetail || part;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Passage Content */}
                <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 flex justify-between items-center sticky top-0">
                    <span>📖 Passage Content</span>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {renderPart?.passage?.content ? (
                      <div className="prose max-w-none text-gray-800 leading-relaxed font-serif text-lg">
                        {renderPart.passage.content
                          .split(/\r?\n\r?\n/)
                          .filter((paragraph) => paragraph.trim())
                          .map((paragraph, index) => (
                            <p
                              key={index}
                              className="mb-4 text-justify indent-8 first-letter:text-2xl first-letter:font-bold first-letter:text-blue-600"
                            >
                              {paragraph.trim()}
                            </p>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-400">
                        Không có dữ liệu bài đọc
                      </div>
                    )}
                  </div>
                </div>

                {/* Questions Panel */}
                <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
                  <div
                    className={`p-4 border-b border-gray-100 font-semibold sticky top-0 z-10 ${
                      isReviewMode
                        ? "bg-green-50 text-green-800"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span>✍️ Questions {isReviewMode && "(Review Mode)"}</span>
                  </div>
                  <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
                    {(
                      renderPart.groupOfQuestions ||
                      part.groupOfQuestions ||
                      []
                    ).map((group) => {
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

                          <QuestionRenderer
                            group={mapGroup(group)}
                            onAnswerChange={(qId, val, text) =>
                              !isReviewMode &&
                              handleAnswerChange(qId, val, finalType, text)
                            }
                            userAnswers={
                              isReviewMode
                                ? reviewAnswersMap // { value, isCorrect }
                                : answers // { value, text, type }
                            }
                            isReviewMode={isReviewMode}
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
