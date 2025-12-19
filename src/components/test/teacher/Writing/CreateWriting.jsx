"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  createWritingTaskAPI,
  updateWritingTaskAPI,
  deleteWritingTaskAPI,
  getAllWritingTasksAPI,
} from "@/services/apiWriting";
import TestInfoEditor from "../TestInfoEditor";

const CreateWriting = ({ idTest, exam, onExamUpdate }) => {
  const [currentTask, setCurrentTask] = useState("TASK1");

  // Khởi tạo luôn object mặc định để tránh null
  const [tasks, setTasks] = useState({
    TASK1: {
      id: null,
      title: "",
      time_limit: "",
      imageUrl: null,
      image: null, // file object
      task_type: "TASK1",
    },
    TASK2: {
      id: null,
      title: "",
      time_limit: "",
      task_type: "TASK2",
    },
  });

  // Load tasks từ API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getAllWritingTasksAPI(idTest);

        const newTasks = {
          TASK1: { ...tasks.TASK1 },
          TASK2: { ...tasks.TASK2 },
        };

        res.data.forEach((t) => {
          const base = {
            id: t.idWritingTask,
            title: t.title,
            time_limit: t.time_limit,
            task_type: t.task_type,
          };

          if (t.task_type === "TASK1") {
            newTasks.TASK1 = {
              ...newTasks.TASK1,
              ...base,
              imageUrl: t.image || null,
              image: null, // không giữ file cũ
            };
          } else if (t.task_type === "TASK2") {
            newTasks.TASK2 = { ...newTasks.TASK2, ...base };
          }
        });

        setTasks(newTasks);

        // Tự động chọn tab có dữ liệu trước
        if (newTasks.TASK1.id) setCurrentTask("TASK1");
        else if (newTasks.TASK2.id) setCurrentTask("TASK2");
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    if (idTest) fetchTasks();
  }, [idTest]);

  // Lấy task hiện tại (luôn có object đầy đủ)
  const current = tasks[currentTask];

  // Cập nhật field
  const updateField = (field, value) => {
    setTasks((prev) => ({
      ...prev,
      [currentTask]: {
        ...prev[currentTask],
        [field]: value,
      },
    }));
  };

  // Xử lý ảnh
  const handleFileChange = (file) => {
    if (!file) return;
    updateField("image", file);
    updateField("imageUrl", URL.createObjectURL(file));
  };

  // Submit
  const handleSubmit = async () => {
    try {
      const tasksToSubmit = [];

      // Kiểm tra TASK1
      if (tasks.TASK1.title.trim()) {
        tasksToSubmit.push({
          type: "TASK1",
          data: tasks.TASK1,
        });
      }

      // Kiểm tra TASK2
      if (tasks.TASK2.title.trim()) {
        tasksToSubmit.push({
          type: "TASK2",
          data: tasks.TASK2,
        });
      }

      if (tasksToSubmit.length === 0) {
        alert("Vui lòng nhập tiêu đề cho ít nhất 1 task!");
        return;
      }

      // Submit từng task
      for (const taskToSubmit of tasksToSubmit) {
        const form = new FormData();
        form.append("idTest", idTest);
        form.append("task_type", taskToSubmit.data.task_type);
        form.append("title", taskToSubmit.data.title);
        form.append("time_limit", Number(taskToSubmit.data.time_limit) || 0);

        // Chỉ append ảnh nếu là TASK1 và có chọn file mới
        if (
          taskToSubmit.type === "TASK1" &&
          taskToSubmit.data.image instanceof File
        ) {
          form.append("image", taskToSubmit.data.image);
        }

        if (taskToSubmit.data.id) {
          // Update task
          await updateWritingTaskAPI(taskToSubmit.data.id, form);
        } else {
          // Create task
          const res = await createWritingTaskAPI(form);
          // Cập nhật lại state với id mới
          setTasks((prev) => ({
            ...prev,
            [taskToSubmit.type]: {
              ...prev[taskToSubmit.type],
              id: res.data.idWritingTask,
            },
          }));
        }
      }

      alert(`Lưu ${tasksToSubmit.length} task thành công!`);
    } catch (error) {
      console.error(error);
      alert(
        "Lỗi khi lưu task: " + (error.response?.data?.message || error.message)
      );
    }
  };

  // Xoá
  const handleDelete = async () => {
    if (!current.id) return alert("Không có task để xoá!");
    if (!confirm("Bạn chắc chắn muốn xoá task này?")) return;

    try {
      await deleteWritingTaskAPI(current.id);
      // Reset task về trạng thái mặc định thay vì reload
      setTasks((prev) => ({
        ...prev,
        [currentTask]: {
          ...(currentTask === "TASK1"
            ? {
                id: null,
                title: "",
                time_limit: "",
                imageUrl: null,
                image: null,
                task_type: "TASK1",
              }
            : {
                id: null,
                title: "",
                time_limit: "",
                task_type: "TASK2",
              }),
        },
      }));
      alert("Xoá thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xoá!");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Panel chỉnh sửa thông tin đề thi */}
      <div className="max-w-6xl mx-auto mb-4">
        <TestInfoEditor exam={exam} onUpdate={onExamUpdate} />
      </div>
      
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
        {/* Tabs */}
        <div className="flex border-b">
          {["TASK1", "TASK2"].map((task) => (
            <Button
              key={task}
              onClick={() => setCurrentTask(task)}
              className={`px-6 py-3 font-medium transition-all ${
                currentTask === task
                  ? "border-b-4 border-blue-600 bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {task.replace("TASK", "Task ")}
            </Button>
          ))}
        </div>

        {/* Main */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-800">
              {current.id ? `Chỉnh sửa ${currentTask}` : `Tạo ${currentTask}`}
            </h2>

            <div>
              <Label className="text-base">Tiêu đề</Label>
              <Input
                value={current.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Nhập tiêu đề đề bài..."
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-base">Thời gian làm bài (phút)</Label>
              <Input
                type="number"
                value={current.time_limit}
                onChange={(e) => updateField("time_limit", e.target.value)}
                placeholder="60"
                className="mt-1"
              />
            </div>
            {currentTask === "TASK1" && (
              <div className="space-y-3">
                <Label className="text-base">Hình ảnh</Label>

                {/* Nếu đã có ảnh (từ server hoặc mới chọn) */}
                {current.imageUrl ? (
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                    <img
                      src={current.imageUrl}
                      alt="Current"
                      className="w-24 h-24 object-cover rounded-md border shadow-sm"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        {current.image instanceof File
                          ? current.image.name
                          : "Ảnh hiện tại"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {current.image instanceof File
                          ? `${(current.image.size / 1024).toFixed(1)} KB`
                          : "Đã tải lên từ server"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        updateField("image", null);
                        updateField("imageUrl", null);
                        // Reset input file (quan trọng!)
                        const input = document.getElementById("image-input");
                        if (input) input.value = "";
                      }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </div>
                ) : (
                  /* Nếu chưa có ảnh → hiện input chọn file */
                  <Input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileChange(e.target.files[0])
                    }
                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                )}

                {/* Nút thay đổi ảnh (khi đã có ảnh) */}
                {current.imageUrl && (
                  <label htmlFor="image-input" className="cursor-pointer">
                    <Input
                      id="image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileChange(e.target.files[0])
                      }
                    />
                    <span className="text-sm text-blue-600 hover:text-blue-800 underline">
                      Thay đổi ảnh
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-gray-700">
              Xem trước
            </h3>
            <div className="bg-white p-5 rounded border min-h-48">
              <p className="text-xl font-medium mb-4">
                {current.title || "<Chưa có tiêu đề>"}
              </p>
              {currentTask === "TASK1" && current.imageUrl && (
                <img
                  src={current.imageUrl}
                  alt="Preview"
                  className="mt-4 max-w-full h-auto rounded-lg shadow-md border"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div>
            {current.id && (
              <Button variant="destructive" onClick={handleDelete}>
                Xoá Task
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {tasks.TASK1.title.trim() && tasks.TASK2.title.trim()
                ? "Sẽ lưu cả 2 tasks"
                : tasks.TASK1.title.trim() || tasks.TASK2.title.trim()
                ? "Sẽ lưu 1 task"
                : "Nhập dữ liệu để lưu"}
            </span>
            <Button
              size="lg"
              className="bg-slate-900 text-white hover:bg-slate-800, hover:cursor-pointer"
              onClick={handleSubmit}
            >
              {current.id ? "Cập nhật" : "Lưu"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWriting;
