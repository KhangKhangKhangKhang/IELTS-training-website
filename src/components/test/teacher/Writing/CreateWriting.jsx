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

const CreateWriting = ({ idTest }) => {
  const [currentTask, setCurrentTask] = useState("TASK1");

  // TASK1 & TASK2 đều nằm chung 1 object
  const [tasks, setTasks] = useState({
    TASK1: null,
    TASK2: null,
  });

  // Load tasks từ API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getAllWritingTasksAPI(idTest);

        let t1 = null;
        let t2 = null;

        res.data.forEach((t) => {
          if (t.task_type === "TASK1") {
            t1 = {
              id: t.idWritingTask,
              title: t.title,
              time_limit: t.time_limit,
              imageUrl: t.image,
              image: null,
              task_type: "TASK1",
            };
          }
          if (t.task_type === "TASK2") {
            t2 = {
              id: t.idWritingTask,
              title: t.title,
              time_limit: t.time_limit,
              task_type: "TASK2",
            };
          }
        });

        setTasks({ TASK1: t1, TASK2: t2 });

        if (t1) setCurrentTask("TASK1");
        else if (t2) setCurrentTask("TASK2");
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchTasks();
  }, [idTest]);

  const data = tasks[currentTask] || {
    id: null,
    title: "",
    time_limit: "",
    task_type: currentTask,
    imageUrl: null,
    image: null,
  };

  // Update form fields
  const updateField = (field, value) => {
    setTasks((prev) => ({
      ...prev,
      [currentTask]: {
        ...data,
        [field]: value,
      },
    }));
  };

  // Image (chỉ TASK1)
  const handleFileChange = (file) => {
    updateField("image", file);
    updateField("imageUrl", URL.createObjectURL(file));
  };

  // Create hoặc Update
  const handleSubmit = async () => {
    const form = new FormData();
    form.append("idTest", idTest);
    form.append("task_type", data.task_type);
    form.append("title", data.title);
    form.append("time_limit", Number(data.time_limit));

    if (currentTask === "TASK1" && data.image instanceof File) {
      form.append("image", data.image);
    }

    try {
      if (data.id) {
        await updateWritingTaskAPI(data.id, form);
        alert("Cập nhật thành công!");
      } else {
        await createWritingTaskAPI(form);
        alert("Tạo task thành công!");
      }
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu task!");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!data.id) return alert("Task chưa có để xoá!");
    if (!confirm("Bạn chắc chắn muốn xoá task này?")) return;

    try {
      await deleteWritingTaskAPI(data.id);
      alert("Xoá thành công!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xoá task!");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
        {/* Tabs */}
        <div className="flex border-b">
          <Button
            onClick={() => setCurrentTask("TASK1")}
            className={`px-6 py-3 ${
              currentTask === "TASK1"
                ? "border-b-2 bg-blue-700 text-white"
                : "text-black"
            }`}
          >
            Task 1
          </Button>
          <Button
            onClick={() => setCurrentTask("TASK2")}
            className={`px-6 py-3 ${
              currentTask === "TASK2"
                ? "border-b-2 bg-blue-700 text-white"
                : "text-black"
            }`}
          >
            Task 2
          </Button>
        </div>

        {/* Main */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FORM */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {data.id ? "Cập nhật " + currentTask : "Tạo " + currentTask}
            </h2>

            <div className="mb-4">
              <Label>Title</Label>
              <Input
                value={data.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Enter title..."
              />
            </div>

            <div className="mb-4">
              <Label>Time Limit</Label>
              <Input
                type="number"
                value={data.time_limit}
                onChange={(e) => updateField("time_limit", e.target.value)}
              />
            </div>

            {currentTask === "TASK1" && (
              <div className="mb-4">
                <Label>Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
              </div>
            )}
          </div>

          {/* PREVIEW */}
          <div>
            <h2 className="font-semibold text-gray-700 mb-3">Preview</h2>
            <p className="text-lg">{data.title || "(No title)"}</p>

            {currentTask === "TASK1" && data.imageUrl && (
              <img src={data.imageUrl} className="mt-4 rounded-lg border" />
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between p-6">
          {data.id ? (
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
          >
            {data.id ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateWriting;
