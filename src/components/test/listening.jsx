import React, { useEffect, useState } from "react";
import { Button, Modal, Spin, message, Divider } from "antd";
import QuestionRenderer from "./reading/render/QuestionRenderer"; // Ensure this path is correct
import {
  getDetailInTestAPI,
  StartTestAPI,
  createManyAnswersAPI,
  FinistTestAPI,
} from "@/services/apiDoTest";
import {
  getPartByIdAPI,
  getQuestionsByIdGroupAPI,
  getAnswersByIdQuestionAPI,
} from "@/services/apiTest";
import { useAuth } from "@/context/authContext";

// --- ADDED: Helper to map backend data to Renderer format ---
const mapGroup = (group) => {
  return {
    ...group,
    // Backend usually returns 'typeQuestion', Renderer expects 'type_question'
    type_question: group.typeQuestion,
    // Map questions array
    questions: Array.isArray(group.question)
      ? group.question.map((q) => ({
          question_id: q.idQuestion,
          question_number: q.numberQuestion,
          question_text: q.content, // This might contain the HTML Table string
          correct_answers: q.answers,
          answers: q.answers, // Needed for Box/Matching options
        }))
      : [],
  };
};

const Listening = ({ idTest, autoShowStart = false }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [partDetail, setPartDetail] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [answers, setAnswers] = useState({});
  const [inProgress, setInProgress] = useState(false);
  const [bandScore, setBandScore] = useState(null);

  useEffect(() => {
    if (!idTest) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getDetailInTestAPI(idTest);
        setTest(res?.data || null);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải đề");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [idTest]);

  useEffect(() => {
    if (!loading && test) {
      try {
        const urlStart =
          new URLSearchParams(window.location.search).get("start") === "true";
        if (autoShowStart || urlStart) setShowStartModal(true);
      } catch (e) {
        // ignore
      }
    }
  }, [loading, test, autoShowStart]);

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

  const handleStart = async () => {
    if (!user?.idUser) return message.error("Bạn chưa đăng nhập");
    setShowStartModal(false);
    try {
      const res = await StartTestAPI(user.idUser, idTest, {});
      const data = res?.data;
      if (!data?.idTestResult) throw new Error("Không nhận được idTestResult");
      setTestResult(data);
      setInProgress(true);
      message.success("Bắt đầu làm bài");
    } catch (err) {
      console.error(err);
      message.error("Bắt đầu bài thi thất bại");
    }
  };

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

  const handleFinish = async () => {
    if (!user?.idUser || !testResult?.idTestResult) return;
    try {
      const res = await FinistTestAPI(testResult.idTestResult, user.idUser, {});
      setBandScore(res?.band_score ?? res?.data?.band_score ?? null);
      setInProgress(false);
      message.success("Hoàn tất bài thi");
    } catch (err) {
      console.error(err);
      message.error("Kết thúc bài thi thất bại");
    }
  };

  if (loading)
    return (
      <div className="py-10">
        <Spin />
      </div>
    );
  if (!test)
    return (
      <div className="py-10 text-center text-gray-500">Không tìm thấy đề</div>
    );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{test.title}</h1>
            <p className="text-sm text-gray-500">{test.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {!inProgress ? (
              <Button type="primary" onClick={() => setShowStartModal(true)}>
                Bắt đầu làm đề
              </Button>
            ) : (
              <Button danger onClick={handleFinish}>
                Nộp bài
              </Button>
            )}
          </div>
        </div>

        {bandScore !== null && (
          <div className="mb-4 p-4 bg-green-50 border rounded">
            <h3 className="font-semibold">Kết quả</h3>
            <p className="text-lg">Band score: {bandScore}</p>
          </div>
        )}

        {/* Parts navigation */}
        <div className="flex gap-2 overflow-x-auto mb-6">
          {test.parts.map((p, idx) => (
            <button
              key={p.idPart}
              onClick={() => setActivePartIndex(idx)}
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
                idx === activePartIndex
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {p.namePart || `Part ${idx + 1}`}
            </button>
          ))}
        </div>

        {/* Questions area (no passage) */}
        {test.parts[activePartIndex] &&
          (() => {
            const part = test.parts[activePartIndex];
            const renderPart = partDetail || part;
            return (
              <div className="bg-white p-6 rounded shadow-sm">
                <h3 className="font-semibold mb-3">Questions</h3>
                {(
                  renderPart.groupOfQuestions ||
                  part.groupOfQuestions ||
                  []
                ).map((group) => (
                  <div key={group.idGroupOfQuestions} className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{group.title || "Group"}</h4>
                      <span className="text-sm text-gray-500">
                        {group.quantity} câu
                      </span>
                    </div>
                    <QuestionRenderer
                      // Now mapGroup is defined and will work
                      group={mapGroup(group)}
                      onAnswerChange={handleAnswerChange}
                    />
                    <Divider />
                  </div>
                ))}
              </div>
            );
          })()}

        <Modal
          title="Xác nhận"
          open={showStartModal}
          onOk={handleStart}
          onCancel={() => setShowStartModal(false)}
        >
          <p>Bạn có muốn bắt đầu làm đề này không?</p>
        </Modal>
      </div>
    </div>
  );
};

export default Listening;
