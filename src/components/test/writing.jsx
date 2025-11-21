"use client";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
  getAllWritingTasksAPI,
  createWritingSubmissionAPI,
} from "@/services/apiWriting";

import { useAuth } from "@/context/authContext";

const Writing = ({ idTest, duration }) => {
  // duration: số phút, nếu API có thì thay vào

  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentTask, setCurrentTask] = useState(null);

  // Countdown time (seconds)
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  /* --------------------- LOAD TASK --------------------- */
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getAllWritingTasksAPI(idTest);

        // ALWAYS SORT: TASK1 trước TASK2
        const list = (res.data || []).sort((a, b) => {
          if (a.task_type === "TASK1") return -1;
          if (b.task_type === "TASK1") return 1;
          return 0;
        });

        setTasks(list);

        if (list.length > 0) setCurrentTask(list[0].task_type);

        const initial = {};
        list.forEach((t) => (initial[t.idWritingTask] = ""));
        setAnswers(initial);
      } catch (err) {
        console.error("Error fetching writing tasks:", err);
      }
    };

    if (idTest) fetchTasks();
  }, [idTest]);

  const multiTask = tasks.length > 1;
  const activeTask = tasks.find((t) => t.task_type === currentTask);

  /* --------------------- COUNTDOWN --------------------- */
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit(); // hết giờ auto submit
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

  /* ---------------------- SUBMIT ------------------------ */
  const handleSubmit = async () => {
    if (!user?.idUser) return alert("Không tìm thấy thông tin người dùng!");

    if (tasks.length === 0) return alert("Không có đề để nộp!");

    try {
      if (!multiTask) {
        const t = tasks[0];
        await createWritingSubmissionAPI({
          idUser: user.idUser,
          idWritingTask: t.idWritingTask,
          submission_text: answers[t.idWritingTask] || "",
        });

        alert("Nộp bài thành công!");
        return;
      }

      for (const t of tasks) {
        await createWritingSubmissionAPI({
          idUser: user.idUser,
          idWritingTask: t.idWritingTask,
          submission_text: answers[t.idWritingTask] || "",
        });
      }

      alert("Nộp bài cả 2 task thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi nộp bài!");
    }
  };

  if (tasks.length === 0)
    return (
      <div className="p-6 text-center text-gray-600">
        Không có đề Writing nào cho bài thi này.
      </div>
    );

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg relative">
        {/* ----------- COUNTDOWN TIMER ----------- */}
        <div className="absolute top-4 right-4 p-3 bg-black text-white rounded-md font-semibold">
          Time left: {formatTime(timeLeft)}
        </div>

        {/* Tabs */}
        {multiTask && (
          <div className="flex border-b">
            {tasks.map((t) => (
              <Button
                key={t.task_type}
                variant={currentTask === t.task_type ? "default" : "ghost"}
                onClick={() => setCurrentTask(t.task_type)}
                className={`hover:cursor-pointer px-6 py-3 font-medium ${
                  currentTask === t.task_type
                    ? "border-b-2 bg-blue-700 text-white hover:bg-blue-500"
                    : "text-black"
                }`}
              >
                {t.task_type === "TASK1" ? "Task 1" : "Task 2"}
              </Button>
            ))}
          </div>
        )}

        {/* Nội dung */}
        <div className="flex flex-col md:flex-row p-6">
          {/* Câu hỏi */}
          <div className="md:w-2/5 mb-6 md:mb-0 md:pr-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              {activeTask?.task_type}
            </h2>
            <p className="text-gray-900 whitespace-pre-line">
              {activeTask?.title}
            </p>

            {activeTask?.task_type === "TASK1" && activeTask?.image && (
              <img
                src={activeTask.image}
                alt="Task 1"
                className="w-full h-auto rounded-lg border mt-3"
              />
            )}
          </div>

          {/* Bài viết */}
          <div className="md:w-3/5">
            <Textarea
              placeholder="Write your answer here..."
              value={answers[activeTask?.idWritingTask] || ""}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [activeTask.idWritingTask]: e.target.value,
                }))
              }
              className="min-h-[400px] resize-none"
            />
          </div>
        </div>

        {/* Nút Submit */}
        <div className="flex justify-end items-end">
          <Button
            onClick={handleSubmit}
            className="mr-8 mb-5 text-white bg-blue-600 hover:bg-blue-700"
          >
            {multiTask ? "Submit All Tasks" : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Writing;
