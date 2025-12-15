import React, { useEffect, useState } from "react";
import { Button, Spin, message, Divider, Result, Card } from "antd";
import { SmileOutlined } from "@ant-design/icons";
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

// Hàm mapGroup giữ nguyên như cũ
function mapGroup(apiGroup) {
  const typeMap = {
    YES_NO_NOTGIVEN: "YES_NO_NOT_GIVEN",
    YES_NO_NOT_GIVEN: "YES_NO_NOT_GIVEN",
    TFNG: "TFNG",
    MCQ: "MCQ",
    FILL_BLANK: "FILL_BLANK",
    LABELING: "LABELING",
    MATCHING: "MATCHING",
    SHORT_ANSWER: "SHORT_ANSWER",
    OTHER: "OTHER",
  };

  const type_question = typeMap[apiGroup.typeQuestion] || apiGroup.typeQuestion;

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

const Reading = ({ idTest, initialTestResult }) => {
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
                      const answers = ansRes?.data || [];
                      return { ...q, answers };
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

  // Handle Answer Change
  const handleAnswerChange = async (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (!user?.idUser || !testResult?.idTestResult) return;
    try {
      const payload = {
        answers: [
          {
            idQuestion: questionId,
            answerText: value,
            userAnswerType: typeof value === "string" ? "SHORT_ANSWER" : "MCQ",
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

  // --- HÀM NỘP BÀI QUAN TRỌNG ---
  const handleFinish = async () => {
    if (!user?.idUser || !testResult?.idTestResult) {
      message.error("Lỗi dữ liệu bài làm");
      return;
    }
    try {
      const res = await FinistTestAPI(testResult.idTestResult, user.idUser, {});
      const score = res?.band_score ?? res?.data?.band_score ?? 0;

      setBandScore(score);
      setInProgress(false);
      message.success("Nộp bài thành công!");

      // ----------------------------------------------------
      // 🔥 BẮN SỰ KIỆN ĐỂ NAVBAR CẬP NHẬT STREAK NGAY LẬP TỨC
      // ----------------------------------------------------
      window.dispatchEvent(new Event("streak-update"));
    } catch (err) {
      console.error(err);
      message.error("Nộp bài thất bại");
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

  // Render Kết quả
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

  // Render Giao diện làm bài
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{test.title}</h1>
            <p className="text-sm text-gray-500">{test.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button danger type="primary" size="large" onClick={handleFinish}>
              Nộp bài
            </Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto mb-6">
          {test.parts.map((p, idx) => (
            <button
              key={p.idPart}
              onClick={() => setActivePartIndex(idx)}
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors ${
                idx === activePartIndex
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
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
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 bg-white p-6 rounded shadow-sm overflow-auto max-h-[85vh]">
                  <h3 className="font-semibold mb-3">Passage</h3>
                  {renderPart?.passage?.content ? (
                    <div
                      className="prose max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{
                        __html: renderPart.passage.content,
                      }}
                    />
                  ) : (
                    <div className="text-sm text-gray-400">
                      Không có passage cho phần này
                    </div>
                  )}
                </div>
                <div className="col-span-4 bg-white p-4 rounded shadow-sm overflow-auto max-h-[85vh]">
                  <h3 className="font-semibold mb-3">Questions</h3>
                  {(
                    renderPart.groupOfQuestions ||
                    part.groupOfQuestions ||
                    []
                  ).map((group) => (
                    <div key={group.idGroupOfQuestions} className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {group.title || "Group"}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {group.quantity} câu
                        </span>
                      </div>
                      <QuestionRenderer
                        group={mapGroup(group)}
                        onAnswerChange={handleAnswerChange}
                      />
                      <Divider />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
};

export default Reading;
