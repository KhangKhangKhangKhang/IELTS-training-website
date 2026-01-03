"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import TestNavigationPanel from "../TestNavigationPanel";
import GradingAnimation from "../GradingAnimation";

import { getAllWritingTasksAPI } from "@/services/apiWriting";

import { FinishTestWritingAPI } from "@/services/apiDoTest";

import { useAuth } from "@/context/authContext";
import { cn } from "@/lib/utils";

// UI Libraries
import { Modal, Tabs, Collapse, Tag, Divider, Spin } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import {
  CheckCircle,
  BookOpen,
  PenTool,
  Layout,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

// Hook điều hướng
import { useNavigate } from "react-router-dom";
// Lưu ý: Nếu bạn dùng 'react-router' thuần thì giữ nguyên import cũ,
// nhưng thường web app sẽ dùng 'react-router-dom'.

// --- Sub-component: Hiển thị chi tiết 1 bài chấm ---
const SubmissionResultDetail = ({ data }) => {
  if (!data) return null;

  const { band_score, feedback, writingTask } = data;
  const feedbackData = feedback && feedback.length > 0 ? feedback[0] : null;

  // Cấu hình items cho Collapse (Feedback chi tiết)
  const collapseItems = [
    {
      key: "1",
      label: (
        <span className="font-semibold flex items-center gap-2">
          <Layout size={16} /> Task Response
        </span>
      ),
      children: (
        <p className="text-gray-600 leading-relaxed">
          {feedbackData?.taskResponse}
        </p>
      ),
    },
    {
      key: "2",
      label: (
        <span className="font-semibold flex items-center gap-2">
          <BookOpen size={16} /> Coherence & Cohesion
        </span>
      ),
      children: (
        <p className="text-gray-600 leading-relaxed">
          {feedbackData?.coherenceAndCohesion}
        </p>
      ),
    },
    {
      key: "3",
      label: (
        <span className="font-semibold flex items-center gap-2">
          <PenTool size={16} /> Lexical Resource
        </span>
      ),
      children: (
        <p className="text-gray-600 leading-relaxed">
          {feedbackData?.lexicalResource}
        </p>
      ),
    },
    {
      key: "4",
      label: (
        <span className="font-semibold flex items-center gap-2">
          <CheckCircle size={16} /> Grammatical Range & Accuracy
        </span>
      ),
      children: (
        <p className="text-gray-600 leading-relaxed">
          {feedbackData?.grammaticalRangeAndAccuracy}
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header Info */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="font-bold text-lg text-slate-800">
            {writingTask?.task_type}
          </h4>
          <p className="text-slate-500 text-sm">Title: {writingTask?.title}</p>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Band Score
          </span>
          <div className="text-4xl font-extrabold text-blue-600">
            {band_score || "N/A"}
          </div>
        </div>
      </div>

      {/* General Feedback */}
      <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
        <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
          <BarChart3 size={18} /> General Feedback
        </h5>
        <p className="text-slate-700 text-sm leading-relaxed">
          {feedbackData?.generalFeedback || "No general feedback provided."}
        </p>
      </div>

      {/* Detailed Criteria */}
      <div>
        <h5 className="font-bold text-slate-800 mb-3">Detailed Evaluation</h5>
        <Collapse
          items={collapseItems}
          defaultActiveKey={["1"]}
          ghost
          className="bg-white"
        />
      </div>

      {/* Detailed Corrections Table */}
      {feedbackData?.detailedCorrections?.length > 0 && (
        <div className="mt-6">
          <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Improvements
            & Corrections
          </h5>
          <div className="grid gap-4">
            {feedbackData.detailedCorrections.map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-md p-3 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between mb-2">
                  <Tag
                    color={
                      item.type === "Grammar"
                        ? "red"
                        : item.type === "Lexis"
                        ? "blue"
                        : "orange"
                    }
                  >
                    {item.type}
                  </Tag>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-2">
                  <div className="bg-red-50 p-2 rounded text-sm">
                    <span className="font-semibold text-red-700 block mb-1">
                      Original:
                    </span>
                    <span className="text-slate-700 line-through decoration-red-400 decoration-2">
                      {item.mistake}
                    </span>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-sm">
                    <span className="font-semibold text-green-700 block mb-1">
                      Correction:
                    </span>
                    <span className="text-slate-700">{item.correct}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2 rounded">
                  <span className="font-bold">Explanation: </span>{" "}
                  {item.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
const Writing = ({ idTest, duration, initialTestResult }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentTask, setCurrentTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navigation state
  const [navPanelWidth, setNavPanelWidth] = useState(15); // Navigation panel width for writing

  // Loading states
  const [isLoadingTasks, setIsLoadingTasks] = useState(true); // NEW: Loading tasks
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [submissionResults, setSubmissionResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Resizer state
  const [leftPanelWidth, setLeftPanelWidth] = useState(45);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Handle resizer drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth >= 25 && newWidth <= 65) {
        setLeftPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // === FETCH TASKS WITH LOADING ===
  useEffect(() => {
    const fetchTasks = async () => {
      if (!idTest) {
        setIsLoadingTasks(false);
        return;
      }

      setIsLoadingTasks(true);
      try {
        const res = await getAllWritingTasksAPI(idTest);
        const list = (res.data || []).sort((a, b) => {
          if (a.task_type === "TASK1") return -1;
          if (b.task_type === "TASK1") return 1;
          return 0;
        });

        setTasks(list);
        if (list.length > 0) {
          setCurrentTask(list[0].task_type);
          const initial = {};
          list.forEach((t) => (initial[t.idWritingTask] = ""));
          setAnswers(initial);
        }
      } catch (err) {
        console.error("Error fetching writing tasks:", err);
        alert("Failed to load writing tasks. Please try again.");
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [idTest]);

  const multiTask = tasks.length > 1;
  const activeTask = useMemo(
    () => tasks.find((t) => t.task_type === currentTask),
    [tasks, currentTask]
  );

  const wordCount = useMemo(() => {
    if (!activeTask || !answers[activeTask.idWritingTask]) return 0;
    return answers[activeTask.idWritingTask].trim().split(/\s+/).length;
  }, [answers, activeTask]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (isSubmitting || isLoadingTasks) return;
    if (!user?.idUser) return alert("User information not found!");
    if (tasks.length === 0) return alert("No tasks to submit!");
    if (!initialTestResult?.idTestResult) {
      return alert("Test result ID not found!");
    }

    if (!isAutoSubmit) {
      if (!window.confirm("Are you sure you want to submit your answers?"))
        return;
    }

    setIsSubmitting(true);
    setIsLoadingResults(true);

    try {
      // Build the writing submissions array in the format expected by the backend
      const writingSubmissions = tasks.map((task) => ({
        idWritingTask: task.idWritingTask,
        submission_text: answers[task.idWritingTask] || "",
      }));

      // Call the finish test writing API
      const response = await FinishTestWritingAPI(
        initialTestResult.idTestResult,
        user.idUser,
        { writingSubmissions }
      );

      // The API returns the complete result with all submissions graded
      if (response?.status === 200 && response?.data?.submissions) {
        // Transform the submissions data to match the expected format for the modal
        const submissionResults = response.data.submissions.map((sub) => ({
          band_score: sub.score,
          feedback: sub.feedback ? [sub.feedback] : [],
          writingTask: {
            task_type: sub.task_type,
            title:
              tasks.find((t) => t.idWritingTask === sub.idWritingTask)?.title ||
              "",
          },
        }));

        setSubmissionResults(submissionResults);
        setResultModalOpen(true);
      } else {
        alert("Test submitted successfully!");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting your writing. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsLoadingResults(false);
    }
  };

  const handleCloseModal = () => {
    setResultModalOpen(false);
    navigate("/");
  };

  // === LOADING UI KHI ĐANG FETCH TASKS ===
  if (isLoadingTasks) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Loading writing tasks...
          </p>
        </div>
      </div>
    );
  }

  // === NO TASKS FOUND ===
  if (tasks.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No writing tasks available for this test.
      </div>
    );
  }

  // === RENDER MAIN UI ===
  const modalTabItems = submissionResults.map((result, index) => ({
    key: index.toString(),
    label: `Task ${result.writingTask?.task_type === "TASK1" ? "1" : "2"}`,
    children: <SubmissionResultDetail data={result} />,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Show Grading Animation Overlay when submitting */}
      {isSubmitting && <GradingAnimation />}

      {/* Fixed Top Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 shadow-lg border-b border-slate-200 dark:border-slate-800 h-[72px] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-600">
            <PenTool className="text-2xl text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold truncate max-w-[300px] md:max-w-md m-0 leading-tight text-slate-800 dark:text-white">
              IELTS Writing Test
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 hidden md:block font-medium">
              ✍️ Writing Section
            </p>
          </div>
          {multiTask && (
            <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg p-1 bg-slate-50 dark:bg-slate-800 ml-4">
              {tasks.map((t) => (
                <Button
                  key={t.task_type}
                  variant={currentTask === t.task_type ? "default" : "ghost"}
                  onClick={() => setCurrentTask(t.task_type)}
                  className={cn(
                    "font-medium transition-all h-8 px-3",
                    currentTask === t.task_type
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  {t.task_type === "TASK1" ? "Task 1" : "Task 2"}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 text-xl font-mono font-bold px-5 py-2 rounded-xl border-2 shadow-lg transition-all duration-300",
              timeLeft < 300
                ? "bg-red-600 text-white border-red-500 animate-pulse"
                : timeLeft < 600
                ? "bg-orange-600 text-white border-orange-500"
                : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700"
            )}
          >
            <ClockCircleOutlined />
            {formatTime(timeLeft)}
          </div>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || isLoadingTasks}
            className="font-bold shadow-xl hover:scale-105 transition-transform bg-blue-600 hover:bg-blue-700 border-0 h-12 px-6 text-white"
          >
            {isSubmitting ? (
              <>
                <Spin size="small" className="mr-2 text-white" /> Processing...
              </>
            ) : (
              "🚀 SUBMIT TEST"
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[90px] p-6 max-w-[1400px] mx-auto h-screen flex flex-col">
        <div
          ref={containerRef}
          className="flex flex-1 min-h-0 relative"
          style={{ userSelect: isDragging ? "none" : "auto" }}
        >
          {/* Left Panel: Task Prompt */}
          <div
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
            style={{ width: `${leftPanelWidth}%` }}
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-white flex justify-between items-center">
              <span>📝 Task Prompt</span>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                    {activeTask?.task_type}
                  </h3>
                  <div className="w-10 h-1 bg-blue-500 rounded-full mb-4"></div>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed text-sm md:text-base">
                    {activeTask?.title}
                  </p>
                </div>

                {activeTask?.task_type === "TASK1" && activeTask?.image && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                    <img
                      src={activeTask.image}
                      alt="Task 1 Visual"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Draggable Resizer */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            className={`flex-shrink-0 w-2 cursor-col-resize flex items-center justify-center group transition-colors mx-1 rounded ${
              isDragging
                ? "bg-blue-100 dark:bg-blue-600/30"
                : "hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <div className="flex flex-col gap-1">
              <div
                className={`w-1 h-1 rounded-full transition-colors ${
                  isDragging
                    ? "bg-blue-600 dark:bg-blue-400"
                    : "bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-600 dark:group-hover:bg-blue-400"
                }`}
              ></div>
              <div
                className={`w-1 h-1 rounded-full transition-colors ${
                  isDragging
                    ? "bg-blue-600 dark:bg-blue-400"
                    : "bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-600 dark:group-hover:bg-blue-400"
                }`}
              ></div>
              <div
                className={`w-1 h-1 rounded-full transition-colors ${
                  isDragging
                    ? "bg-blue-600 dark:bg-blue-400"
                    : "bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-600 dark:group-hover:bg-blue-400"
                }`}
              ></div>
              <div
                className={`w-1 h-1 rounded-full transition-colors ${
                  isDragging
                    ? "bg-blue-600 dark:bg-blue-400"
                    : "bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-600 dark:group-hover:bg-blue-400"
                }`}
              ></div>
              <div
                className={`w-1 h-1 rounded-full transition-colors ${
                  isDragging
                    ? "bg-blue-600 dark:bg-blue-400"
                    : "bg-slate-400 dark:bg-slate-600 group-hover:bg-blue-600 dark:group-hover:bg-blue-400"
                }`}
              ></div>
            </div>
          </div>

          {/* Right Panel: Writing Area */}
          <div
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-white">
              <span>✍️ Your Answer</span>
            </div>
            <div className="p-5 flex-1 flex flex-col bg-slate-50 dark:bg-slate-800">
              <Textarea
                placeholder="Start writing your essay here..."
                value={answers[activeTask?.idWritingTask] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [activeTask.idWritingTask]: e.target.value,
                  }))
                }
                className="flex-1 resize-none text-base p-4 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg font-serif leading-relaxed"
              />
              <div className="flex justify-between items-center text-sm px-1 mt-3">
                <span
                  className={cn(
                    wordCount < (activeTask?.task_type === "TASK1" ? 150 : 250)
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-green-600 dark:text-green-400",
                    "font-medium"
                  )}
                >
                  {wordCount} /{" "}
                  {activeTask?.task_type === "TASK1" ? "150" : "250"} words
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RESULT MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <CheckCircle className="text-green-500" /> Submission Graded
          </div>
        }
        open={resultModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={900}
        centered
        className="top-5"
        bodyStyle={{ maxHeight: "80vh", overflowY: "auto" }}
      >
        <Divider className="my-3" />
        {isLoadingResults ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Spin size="large" />
            <p className="text-slate-600">
              Your writing is being graded by AI...
            </p>
          </div>
        ) : (
          <Tabs defaultActiveKey="0" items={modalTabItems} type="card" />
        )}
        <div className="mt-6 text-right">
          <Button
            onClick={handleCloseModal}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Writing;
