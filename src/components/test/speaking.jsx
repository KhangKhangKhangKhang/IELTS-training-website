"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Spin, Card, Alert, message } from "antd"; // Đã bỏ Modal ở đây vì dùng SimpleResultModal
import {
  ClockCircleOutlined,
  SoundOutlined,
  StopOutlined,
  RightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { useNavigate } from "react-router-dom";

// --- IMPORTS API ---
import { getDetailInTestAPI } from "@/services/apiDoTest";
import { finishSpeakingTest } from "@/services/apiSpeaking";

// --- IMPORTS COMPONENT ---
import GradingAnimation from "./GradingAnimation";
import SimpleResultModal from "./SimpleResultModal"; // <--- IMPORT COMPONENT KẾT QUẢ MỚI

// (Đã xóa SpeakingResultDetail cũ vì không dùng nữa)

// --- MAIN COMPONENT ---
const Speaking = ({ idTest, initialTestResult }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- STATE DỮ LIỆU ---
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  // --- STATE LUỒNG (FLOW) ---
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [step, setStep] = useState("INTRO_PART");

  // TIMER
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // --- AUDIO STORAGE (QUAN TRỌNG: Giữ nguyên logic Ref) ---
  const audioBlobsRef = useRef({});
  const [, setForceUpdate] = useState({});
  const finalPartsRef = useRef({});

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);

  // SUBMISSION
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATE MỚI CHO MODAL KẾT QUẢ ---
  const [showResultModal, setShowResultModal] = useState(false);
  const [submittedTestId, setSubmittedTestId] = useState(null);

  // --- 1. FETCH DATA (GIỮ NGUYÊN) ---
  useEffect(() => {
    const fetchTest = async () => {
      if (!idTest) return;
      try {
        setLoading(true);
        const res = await getDetailInTestAPI(idTest);
        if (res && res.data) {
          const sortedTasks = (res.data.speakingTasks || []).sort((a, b) => {
            const partA = a.part?.toUpperCase() || "";
            const partB = b.part?.toUpperCase() || "";
            return partA.localeCompare(partB);
          });

          sortedTasks.forEach((task) => {
            if (task.questions) {
              task.questions.sort(
                (q1, q2) => (q1.order || 0) - (q2.order || 0)
              );
            }
          });

          setTasks(sortedTasks);
        }
      } catch (error) {
        console.error("Error fetching test:", error);
        message.error("Không thể tải đề thi.");
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [idTest]);

  const currentTask = tasks[currentTaskIndex];
  const currentQuestion = currentTask?.questions?.[currentQuestionIndex];

  // --- 2. LOGIC XỬ LÝ AUDIO (GIỮ NGUYÊN) ---
  const processAndSavePartAudio = (taskIndex) => {
    try {
      const taskBlobsObj = audioBlobsRef.current[taskIndex];
      console.log(`🎤 Processing Part ${taskIndex + 1}...`, taskBlobsObj);

      if (!taskBlobsObj || Object.keys(taskBlobsObj).length === 0) {
        console.warn(`⚠️ Part ${taskIndex + 1} Empty!`);
        return;
      }

      const sortedBlobKeys = Object.keys(taskBlobsObj).sort(
        (a, b) => Number(a) - Number(b)
      );
      const blobsToMerge = sortedBlobKeys.map((key) => taskBlobsObj[key]);
      const mergedBlob = new Blob(blobsToMerge, { type: "audio/webm" });

      finalPartsRef.current[taskIndex] = mergedBlob;
      console.log(
        `✅ Saved Part ${taskIndex + 1} to Final Ref. Size: ${mergedBlob.size}`
      );
    } catch (error) {
      console.error("Error processing audio:", error);
    }
  };

  // --- 3. TIMER LOGIC (GIỮ NGUYÊN) ---
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleTimerEnd();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleTimerEnd = () => {
    setTimerActive(false);
    if (step === "PREP") startRecording();
    else if (step === "RECORDING") stopRecording();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- 4. RECORDING LOGIC (GIỮ NGUYÊN) ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        if (!audioBlobsRef.current[currentTaskIndex]) {
          audioBlobsRef.current[currentTaskIndex] = {};
        }
        audioBlobsRef.current[currentTaskIndex][currentQuestionIndex] =
          audioBlob;

        setForceUpdate({});
        console.log(
          `💾 Recorded Q${currentQuestionIndex + 1}. Blob size: ${
            audioBlob.size
          }`
        );

        setTimeout(() => handleNextQuestionOrPart(), 500);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStep("RECORDING");
      setTimeLeft(currentQuestion?.speakingTime || 60);
      setTimerActive(true);
    } catch (err) {
      console.error("Mic Error:", err);
      message.error("Không thể truy cập Microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  // --- 5. NAVIGATION (GIỮ NGUYÊN) ---
  const setupNewQuestion = (question) => {
    setStep("PREP");
    setTimeLeft(question.preparationTime > 0 ? question.preparationTime : 5);
    setTimerActive(true);
  };

  const handleStartPart = () => {
    setCurrentQuestionIndex(0);
    const firstQ = currentTask?.questions?.[0];
    if (firstQ) setupNewQuestion(firstQ);
    else message.warning("Phần thi này chưa có câu hỏi.");
  };

  const handleNextQuestionOrPart = () => {
    setTimerActive(false);

    if (currentQuestionIndex < (currentTask?.questions?.length || 0) - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      const nextQ = currentTask.questions[nextIdx];
      setupNewQuestion(nextQ);
    } else {
      processAndSavePartAudio(currentTaskIndex);
      if (currentTaskIndex < tasks.length - 1) {
        setCurrentTaskIndex((prev) => prev + 1);
        setCurrentQuestionIndex(0);
        setStep("INTRO_PART");
      } else {
        setStep("FINISHED_TEST");
        handleSubmitTest();
      }
    }
  };

  // --- 6. SUBMIT HANDLER (ĐÃ SỬA ĐỂ DÙNG MODAL MỚI) ---
  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log("🚀 START SUBMIT PROCESS");
      processAndSavePartAudio(currentTaskIndex);

      const formData = new FormData();
      formData.append("idSpeakingTask", idTest);

      Object.keys(finalPartsRef.current).forEach((key) => {
        const index = Number(key);
        const blob = finalPartsRef.current[index];
        if (blob && blob.size > 0) {
          const fieldName = `part${index + 1}Audio`;
          formData.append(fieldName, blob, `${fieldName}.webm`);
          console.log(`📦 Appending: ${fieldName} (${blob.size} bytes)`);
        }
      });

      console.log("📨 Sending to API...");
      const res = await finishSpeakingTest(
        initialTestResult.idTestResult,
        user.idUser,
        formData
      );

      console.log("📥 API Response:", res);

      if (res && res.data) {
        console.log("✅ Submit Success. ID Result:", res.data.idTestResult);

        // --- THAY ĐỔI Ở ĐÂY ---
        // Thay vì setFinalResult(res.data) để hiện modal cũ
        // Ta set ID để hiện modal SimpleResultModal
        setSubmittedTestId(res.data.idTestResult);
        setShowResultModal(true);
      } else {
        message.success("Đã hoàn thành bài thi (Không có dữ liệu chi tiết).");
        navigate("/");
      }
    } catch (error) {
      console.error("❌ Submit Error:", error);
      message.error("Có lỗi xảy ra khi nộp bài.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseResult = () => {
    setShowResultModal(false);
    navigate("/");
  };

  // --- RENDER (GIỮ NGUYÊN GIAO DIỆN) ---
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Spin size="large" />
        <p className="mt-4 text-slate-500">Đang tải đề thi Speaking...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-10 text-center">Đề thi không có dữ liệu Speaking.</div>
    );
  }

  const isRealPrep = currentQuestion?.preparationTime > 0;
  const isPart2 = currentTask?.part?.toUpperCase().includes("PART2");
  const hasSubPrompts =
    currentQuestion?.subPrompts &&
    currentQuestion.subPrompts.length > 0 &&
    currentQuestion.subPrompts.some((s) => s.trim() !== "");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex flex-col">
      {isSubmitting && <GradingAnimation testType="SPEAKING" />}

      {/* HEADER */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 px-6 h-16 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600 font-bold">
            <SoundOutlined />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-700 dark:text-white uppercase">
              {currentTask?.part || `Part ${currentTaskIndex + 1}`}
            </h1>
            <p className="text-xs text-slate-500">
              Question {currentQuestionIndex + 1} /{" "}
              {currentTask?.questions?.length || 0}
            </p>
          </div>
        </div>

        {(step === "RECORDING" || step === "PREP") && (
          <div
            className={cn(
              "flex items-center gap-2 text-2xl font-mono font-bold px-4 py-1 rounded border-2 transition-all",
              step === "PREP"
                ? "border-amber-400 text-amber-500 bg-amber-50"
                : timeLeft < 10
                ? "border-red-500 text-red-500 bg-red-50 animate-pulse"
                : "border-blue-500 text-blue-600 bg-blue-50"
            )}
          >
            <ClockCircleOutlined /> {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col justify-center">
        {step === "INTRO_PART" && (
          <Card className="text-center py-10 shadow-lg border-t-4 border-t-blue-600">
            <SoundOutlined className="text-6xl text-blue-200 mb-6" />
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {currentTask?.part || `Speaking Part ${currentTaskIndex + 1}`}
            </h2>
            <p className="text-slate-500 text-lg mb-8 max-w-lg mx-auto">
              {currentTask?.title} <br /> Bạn sẽ trả lời lần lượt từng câu hỏi.
            </p>
            <Button
              type="primary"
              size="large"
              onClick={handleStartPart}
              className="h-12 px-8 text-lg bg-blue-600 hover:bg-blue-700"
            >
              Bắt đầu Part {currentTaskIndex + 1} <RightOutlined />
            </Button>
          </Card>
        )}

        {step === "PREP" && (
          <div className="animate-fade-in">
            <Alert
              message={
                isRealPrep ? "Thời gian chuẩn bị" : "Thời gian đọc câu hỏi"
              }
              description={
                isRealPrep
                  ? "Bạn có thời gian để đọc câu hỏi và ghi chú."
                  : "Vui lòng đọc kỹ câu hỏi."
              }
              type={isRealPrep ? "warning" : "info"}
              showIcon
              className="mb-6"
            />
            <Card
              className={cn(
                "shadow-md border-amber-200",
                isRealPrep ? "bg-amber-50/30" : "bg-white"
              )}
            >
              {currentQuestion?.topic && (
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
                  Topic: {currentQuestion.topic}
                </h3>
              )}
              <div className="text-2xl font-medium text-slate-800 mb-4 leading-relaxed">
                {currentQuestion?.prompt}
              </div>
              {hasSubPrompts && (
                <ul className="list-disc list-inside space-y-2 text-slate-600 bg-white p-4 rounded-lg border border-slate-200">
                  {currentQuestion.subPrompts.map((sub, i) =>
                    sub && sub.trim() !== "" ? <li key={i}>{sub}</li> : null
                  )}
                </ul>
              )}
              {isPart2 && (
                <div className="mt-6 animate-fade-in-up">
                  <label className="text-sm font-bold text-slate-500 mb-1 block">
                    📝 Notes (Nháp):
                  </label>
                  <textarea
                    className="w-full h-32 p-3 border rounded-md focus:ring-2 ring-amber-300 outline-none resize-none"
                    placeholder="Ghi chú ý tưởng của bạn tại đây..."
                  ></textarea>
                </div>
              )}
            </Card>
            <div className="text-center mt-8">
              <p className="text-slate-500 text-sm mb-2">
                Thời gian đọc đề của bạn còn:
              </p>
              <div className="text-4xl font-mono font-bold text-blue-600">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        )}

        {step === "RECORDING" && (
          <div className="animate-fade-in">
            <Card className="shadow-lg border-t-4 border-t-red-500 text-center py-8">
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>{" "}
                  RECORDING
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-6 px-4">
                {currentQuestion?.prompt}
              </h3>
              {hasSubPrompts && (
                <div className="text-left max-w-md mx-auto bg-slate-50 p-4 rounded mb-6 text-slate-600 text-sm">
                  <ul className="list-disc list-inside">
                    {currentQuestion.subPrompts.map(
                      (s, i) => s && <li key={i}>{s}</li>
                    )}
                  </ul>
                </div>
              )}
              <div className="flex justify-center mb-8">
                <div className="flex items-end gap-1 h-12">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-red-400 rounded-t-sm animate-music-bar"
                      style={{
                        height: `${Math.random() * 100}%`,
                        animationDuration: `${0.5 + Math.random()}s`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
              <Button
                danger
                type="primary"
                size="large"
                icon={<StopOutlined />}
                onClick={stopRecording}
                className="h-14 px-10 text-lg rounded-full shadow-red-200 shadow-xl"
              >
                Dừng & Câu tiếp theo
              </Button>
              <p className="mt-4 text-slate-400 text-sm">
                Thời gian còn lại: {formatTime(timeLeft)}
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* --- THAY THẾ MODAL CŨ BẰNG SIMPLE RESULT MODAL --- */}
      <SimpleResultModal
        open={showResultModal}
        idTestResult={submittedTestId}
        onClose={handleCloseResult}
      />

      <style jsx>{`
        @keyframes music-bar {
          0%,
          100% {
            height: 10%;
          }
          50% {
            height: 100%;
          }
        }
        .animate-music-bar {
          animation: music-bar 1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Speaking;
