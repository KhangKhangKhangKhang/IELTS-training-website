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
} from "@/services/apiWriting";

import { useAuth } from "@/context/authContext";
import { cn } from "@/lib/utils";

const Writing = ({ idTest, duration }) => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentTask, setCurrentTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
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
      }
    };

    if (idTest) fetchTasks();
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
    if (isSubmitting) return;
    if (!user?.idUser) return alert("User information not found!");
    if (tasks.length === 0) return alert("No tasks to submit!");

    if (!isAutoSubmit) {
      const confirmationMessage =
        "Are you sure you want to submit your answers?";
      if (!window.confirm(confirmationMessage)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const submissions = tasks.map((t) =>
        createWritingSubmissionAPI({
          idUser: user.idUser,
          idWritingTask: t.idWritingTask,
          submission_text: answers[t.idWritingTask] || "",
        })
      );
      await Promise.all(submissions);
      alert("Successfully submitted all tasks!");
      window.location.href = "/test/list";
    } catch (err) {
      console.error(err);
      alert("Error submitting tasks!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No writing tasks available for this test.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Writing Section</CardTitle>
            {multiTask && (
              <div className="flex border rounded-md p-1">
                {tasks.map((t) => (
                  <Button
                    key={t.task_type}
                    variant={currentTask === t.task_type ? "default" : "ghost"}
                    onClick={() => setCurrentTask(t.task_type)}
                    className={cn(
                      "font-medium",
                      currentTask === t.task_type && "shadow"
                    )}
                  >
                    {t.task_type === "TASK1" ? "Task 1" : "Task 2"}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="text-2xl font-bold text-red-500">
            {formatTime(timeLeft)}
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">{activeTask?.task_type}</h3>
            <p className="text-gray-700 whitespace-pre-line">
              {activeTask?.title}
            </p>
            {activeTask?.task_type === "TASK1" && activeTask?.img && (
              <img
                src={activeTask.img}
                alt="Task 1"
                className="w-full h-auto rounded-lg border"
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Write your answer here..."
              value={answers[activeTask?.idWritingTask] || ""}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [activeTask.idWritingTask]: e.target.value,
                }))
              }
              className="min-h-[450px] resize-none text-base"
            />
            <p className="text-sm text-gray-500 text-right">
              Word count: {wordCount}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleSubmit}
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : multiTask
              ? "Submit All Tasks"
              : "Submit"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Writing;
