import React, { useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

const Writing = () => {
  const [currentTask, setCurrentTask] = useState("task1");
  const [task1Data, setTask1Data] = useState({
    question: "Summarize the information in the chart below",
    imageUrl: "https://example.com/chart.jpg",
    answer: "",
  });

  const [task2Data, setTask2Data] = useState({
    question: "Do you agree or disagree with the following statement?",
    answer: "",
  });

  const handleTask1Change = (value) => {
    setTask1Data((prev) => ({ ...prev, answer: value }));
  };

  const handleTask2Change = (value) => {
    setTask2Data((prev) => ({ ...prev, answer: value }));
  };

  const handleSubmit = async () => {
    const submissionData = {
      task1: task1Data,
      task2: task2Data,
    };

    try {
      await fetch("/api/writing-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });
      alert("Bài làm đã được lưu thành công!");
    } catch (error) {
      console.error("Lỗi khi gửi bài:", error);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
        {/* Header với pagination */}
        <div className="flex border-b">
          <Button
            variant={currentTask === "task1" ? "default" : "ghost"}
            onClick={() => setCurrentTask("task1")}
            className={` hover:cursor-pointer px-6 py-3 font-medium ${
              currentTask === "task1"
                ? "border-b-2 bg-blue-700  text-white hover:bg-blue-500 "
                : "text-black"
            }`}
          >
            Task 1
          </Button>
          <Button
            variant={currentTask === "task2" ? "default" : "ghost"}
            onClick={() => setCurrentTask("task2")}
            className={`hover:cursor-pointer px-6 py-3 font-medium ${
              currentTask === "task2"
                ? "border-b-2 text-white bg-blue-700 hover:bg-blue-500"
                : "text-black"
            }`}
          >
            Task 2
          </Button>
        </div>

        {/* Nội dung task */}
        <div className="flex flex-col md:flex-row p-6">
          {/* Phần câu hỏi bên trái */}
          <div className="md:w-2/5 mb-6 md:mb-0 md:pr-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                {currentTask}
              </h2>
              <p className="text-gray-900">
                {currentTask === "task1"
                  ? task1Data.question
                  : task2Data.question}
              </p>
            </div>

            {currentTask === "task1" && task1Data.imageUrl && (
              <div className="mt-4">
                <img
                  src={task1Data.imageUrl}
                  width={1000}
                  height={500}
                  alt="Chart for task 1"
                  className="w-full h-auto rounded-lg border"
                />
              </div>
            )}
          </div>

          {/* Phần viết bài bên phải */}
          <div className="md:w-3/5">
            <Textarea
              placeholder="Your answer.."
              value={
                currentTask === "task1" ? task1Data.answer : task2Data.answer
              }
              onChange={(e) =>
                currentTask === "task1"
                  ? handleTask1Change(e.target.value)
                  : handleTask2Change(e.target.value)
              }
              className="min-h-[400px] resize-none"
            />
          </div>
        </div>

        {/* Navigation và Submit */}
        <div className="flex justify-end items-end">
          <Button
            onClick={handleSubmit}
            className="mr-8 mb-5 text-white bg-blue-600 hover:bg-blue-700"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Writing;
