import React, { useEffect, useState, useRef } from "react";
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
      correct_answers: q.correct_answers, // Pass correct answers if available (for Review)
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

  // --- THAY ĐỔI 1: State quản lý Cache và Loading ---
  const [loadedParts, setLoadedParts] = useState({}); // Cache: { idPart: data }
  const [isPartLoading, setIsPartLoading] = useState(false);

  // State quản lý Modal kết quả
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // State dữ liệu bài thi
  const [testResult, setTestResult] = useState(initialTestResult || null);
  const [answers, setAnswers] = useState({});
  const [inProgress, setInProgress] = useState(!initialTestResult?.finishedAt);

  // Flag check xem có phải đang xem lại lịch sử cũ hay không
  const [isReviewMode, setIsReviewMode] = useState(
    !!initialTestResult?.finishedAt
  );

  const [bandScore, setBandScore] = useState(
    initialTestResult?.band_score || null
  );

  const [timeLeft, setTimeLeft] = useState((duration || 60) * 60);
  const isSubmittingRef = useRef(false);

  // --- 1. LOAD DATA INITIAL ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // CASE A: Chế độ Review (Lịch sử đã làm xong từ trước)
        if (initialTestResult?.idTestResult && initialTestResult?.finishedAt) {
          const res = await getTestResultAndAnswersAPI(
            initialTestResult.idTestResult
          );
          if (res && res.data) {
            setTestResult(res.data);
            setBandScore(res.data.band_score);
            setTest(res.data.test);
            setInProgress(false);

            // Nếu API review trả về full parts data thì cache luôn để khỏi load lại
            if (res.data.test?.parts) {
              const initialCache = {};
              res.data.test.parts.forEach((p) => {
                initialCache[p.idPart] = p;
              });
              setLoadedParts(initialCache);
            }
          }
        }
        // CASE B: Chế độ làm bài mới
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

  // --- 2. LOAD PART DETAIL (CÓ CACHE & FIX API) ---
  useEffect(() => {
    if (!test || !test.parts) return;

    const currentPart = test.parts[activePartIndex];
    if (!currentPart || !currentPart.idPart) return;

    // CHECK CACHE: Nếu part này đã có trong state loadedParts rồi thì KHÔNG gọi API nữa
    if (loadedParts[currentPart.idPart]) {
      return;
    }

    const loadPartDetail = async () => {
      setIsPartLoading(true); // Bắt đầu loading nội dung
      try {
        // Gọi API lấy chi tiết Part
        const res = await getPartByIdAPI(currentPart.idPart);

        // --- FIX QUAN TRỌNG: Lấy phần tử đầu tiên của mảng data ---
        let detail = res?.data?.[0] || null;

        if (detail) {
          // Xử lý enrich câu hỏi (Lấy chi tiết answers cho từng question)
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

          // LƯU VÀO CACHE: Merge part mới vào danh sách cũ
          setLoadedParts((prev) => ({
            ...prev,
            [currentPart.idPart]: detail,
          }));
        }
      } catch (err) {
        console.error("load part detail error", err);
        message.error("Không tải được nội dung phần này");
      } finally {
        setIsPartLoading(false); // Tắt loading
      }
    };

    loadPartDetail();
  }, [test, activePartIndex, loadedParts]);

  // --- 3. HANDLE INPUT CHANGE ---
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

  // --- 4. HANDLE FINISH ---
  const handleFinish = async (isAutoSubmit = false) => {
    if (isSubmittingRef.current || !inProgress) return;
    isSubmittingRef.current = true;

    const currentTestResultId = testResult?.idTestResult;

    if (!user?.idUser || !currentTestResultId) {
      message.error("Lỗi: Không tìm thấy ID bài làm (TestResultID)");
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

      // 1. Submit Answers
      if (answersPayload.answers.length > 0) {
        await createManyAnswersAPI(
          user.idUser,
          currentTestResultId,
          answersPayload
        );
      }

      // 2. Finish Test
      const res = await FinistTestAPI(currentTestResultId, user.idUser, {});
      const score = res?.band_score ?? res?.data?.band_score ?? 0;

      setBandScore(score);
      setInProgress(false);

      const finishData = res?.data || res || {};
      setTestResult((prev) => ({
        ...prev,
        ...finishData,
      }));

      message.success({ content: "Nộp bài thành công!", key: "submitting" });
      window.dispatchEvent(new Event("streak-update"));
    } catch (err) {
      console.error(err);
      message.error({ content: "Nộp bài thất bại", key: "submitting" });
      isSubmittingRef.current = false;
    }
  };

  // --- 5. HANDLE SWITCH TO REVIEW ---
  const handleSwitchToReview = () => {
    if (!testResult?.idTestResult) {
      message.error("Chưa có kết quả bài thi để xem lại.");
      return;
    }
    setIsResultModalOpen(true);
  };

  // Timer logic
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

  // --- RESULT VIEW (Sau khi nộp bài) ---
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

  // --- LOGIC RENDER ---
  const part = test.parts[activePartIndex];
  // Lấy dữ liệu từ cache loadedParts
  const cachedPart = loadedParts[part?.idPart];
  // Render ưu tiên dữ liệu đã load chi tiết, fallback về dữ liệu gốc
  const renderPart = cachedPart || part;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md h-[72px] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
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

        {part && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            {/* --- CỘT 1: PASSAGE CONTENT --- */}
            {/* Thêm class 'relative' để loading overlay nằm gọn trong khung này */}
            <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full relative">
              {/* LOADING OVERLAY: Chỉ hiện đè lên phần Passage */}
              {isPartLoading && !cachedPart && (
                <div className="absolute inset-0 z-50 bg-white/90 flex items-center justify-center backdrop-blur-[1px]">
                  <Spin tip="Đang tải bài đọc..." size="large" />
                </div>
              )}

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
                  // Chỉ hiện thông báo "Không có dữ liệu" khi KHÔNG phải đang loading
                  !isPartLoading && (
                    <div className="text-center py-10 text-gray-400">
                      Không có dữ liệu bài đọc
                    </div>
                  )
                )}
              </div>
            </div>

            {/* --- CỘT 2: QUESTIONS PANEL --- */}
            {/* Bên này không bị che loading, người dùng vẫn thấy danh sách câu hỏi (nếu có data sơ bộ) */}
            <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
              <div
                className={`p-4 border-b border-gray-100 font-semibold sticky top-0 z-10 ${
                  isReviewMode
                    ? "bg-green-50 text-green-800"
                    : "bg-gray-50 text-gray-700"
                }`}
              >
                <span>✍️ Questions</span>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
                {(renderPart.groupOfQuestions || []).map((group) => {
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
                        userAnswers={answers}
                        isReviewMode={false}
                      />
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
