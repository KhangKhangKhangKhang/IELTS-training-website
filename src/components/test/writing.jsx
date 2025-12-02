"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAllWritingTasksAPI,
  createWritingSubmissionAPI,
  getWritingSubmissionAPI,
} from "@/services/apiWriting";

import { useAuth } from "@/context/authContext";
import { cn } from "@/lib/utils";

// UI Libraries
import { Modal, Tabs, Collapse, Tag, Divider, Spin } from "antd";
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
                    <span className="text-slate-700">{item.correction}</span>
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
const Writing = ({ idTest, duration }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentTask, setCurrentTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loading states
  const [isLoadingTasks, setIsLoadingTasks] = useState(true); // NEW: Loading tasks
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [submissionResults, setSubmissionResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

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

    if (!isAutoSubmit) {
      if (!window.confirm("Are you sure you want to submit your answers?"))
        return;
    }

    setIsSubmitting(true);
    setIsLoadingResults(true);

    try {
      const submissionsPromises = tasks.map((t) =>
        createWritingSubmissionAPI({
          idUser: user.idUser,
          idWritingTask: t.idWritingTask,
          submission_text: answers[t.idWritingTask] || "",
        })
      );

      const responses = await Promise.all(submissionsPromises);
      const submissionIds = responses
        .map((res) => res?.data?.idWritingSubmission)
        .filter(Boolean);

      if (submissionIds.length > 0) {
        const resultsPromises = submissionIds.map((id) =>
          getWritingSubmissionAPI(id)
        );
        const detailedResults = await Promise.all(resultsPromises);
        const cleanData = detailedResults.map((res) => res.data);

        setSubmissionResults(cleanData);
        setResultModalOpen(true);
      } else {
        alert("Submitted successfully but feedback is not ready yet.");
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
      <div className="p-4 sm:p-6 md:p-8">
        <Card className="max-w-6xl mx-auto border-slate-200 shadow-sm">
          <CardHeader className="flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-10 w-24 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-28 bg-red-100 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8 pt-6">
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <div className="h-7 w-40 bg-slate-300 rounded mb-4 animate-pulse" />
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-11/12" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-10/12" />
                </div>
              </div>
              <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-96 bg-slate-100 rounded-lg animate-pulse" />
              <div className="flex justify-between">
                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 pt-4">
            <div className="h-12 w-40 bg-slate-900 rounded animate-pulse" />
          </CardFooter>
        </Card>
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
    <div className="p-4 sm:p-6 md:p-8">
      <Card className="max-w-6xl mx-auto border-slate-200 shadow-sm">
        <CardHeader className="flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-slate-800">Writing Section</CardTitle>
            {multiTask && (
              <div className="flex border border-slate-200 rounded-md p-1 bg-slate-50">
                {tasks.map((t) => (
                  <Button
                    key={t.task_type}
                    variant={currentTask === t.task_type ? "default" : "ghost"}
                    onClick={() => setCurrentTask(t.task_type)}
                    className={cn(
                      "font-medium transition-all",
                      currentTask === t.task_type
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {t.task_type === "TASK1" ? "Task 1" : "Task 2"}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-red-500 bg-red-50 px-3 py-1 rounded-md border border-red-100">
            {formatTime(timeLeft)}
          </div>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-8 pt-6">
          {/* Left: Task Prompt */}
          <div className="flex flex-col gap-4 h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {activeTask?.task_type} Prompt
              </h3>
              <div className="w-10 h-1 bg-blue-500 rounded-full mb-4"></div>
              <p className="text-slate-700 whitespace-pre-line leading-relaxed text-sm md:text-base">
                {activeTask?.title}
              </p>
            </div>

            {activeTask?.task_type === "TASK1" && activeTask?.image && (
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={activeTask.image}
                  alt="Task 1 Visual"
                  className="w-full h-auto object-contain bg-white"
                />
              </div>
            )}
          </div>

          {/* Right: Writing Area */}
          <div className="flex flex-col gap-2 h-full">
            <Textarea
              placeholder="Start writing your essay here..."
              value={answers[activeTask?.idWritingTask] || ""}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [activeTask.idWritingTask]: e.target.value,
                }))
              }
              className="flex-1 min-h-[400px] resize-none text-base p-4 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm font-serif leading-relaxed"
            />
            <div className="flex justify-between items-center text-sm text-slate-500 px-1">
              <span>Time is running...</span>
              <span
                className={cn(
                  wordCount < (activeTask?.task_type === "TASK1" ? 150 : 250)
                    ? "text-amber-600"
                    : "text-green-600",
                  "font-medium"
                )}
              >
                Word count: {wordCount}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
          <Button
            onClick={() => handleSubmit(false)}
            size="lg"
            disabled={isSubmitting || isLoadingTasks}
            className="bg-slate-900 hover:bg-slate-800 text-white min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Spin size="small" className="mr-2 text-white" /> Processing...
              </>
            ) : multiTask ? (
              "Submit All Tasks"
            ) : (
              "Submit"
            )}
          </Button>
        </CardFooter>
      </Card>

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
