import React, { useState } from "react";
import CreateTestForm from "@/components/test/teacher/CreateTestForm";
import { useNavigate } from "react-router-dom";
import { Result, Button } from "antd";
import { CheckCircle, ArrowRight, Plus } from "lucide-react";

const TestCreate = () => {
  const [createdTest, setCreatedTest] = useState(null);
  const navigate = useNavigate();

  const handleCreateSuccess = (testData) => {
    setCreatedTest(testData);
    navigate(`/teacher/testManager/testEdit/${testData.idTest}`, {
      state: { exam: testData },
    });
  };

  const handleBackToCreate = () => {
    setCreatedTest(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {!createdTest ? (
          <CreateTestForm onSuccess={handleCreateSuccess} />
        ) : (
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 text-center max-w-lg border border-gray-100 dark:border-slate-700">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Tạo đề thành công!
              </h2>
              
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Đề thi <strong className="text-blue-600 dark:text-blue-400">{createdTest.title}</strong> đã được tạo.
                <br />
                Bây giờ bạn có thể thêm các phần (parts) cho đề thi này.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate(`/teacher/testEdit/${createdTest.idTest}`)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                >
                  Chuyển đến tạo Parts
                  <ArrowRight size={18} />
                </button>
                
                <button
                  onClick={handleBackToCreate}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all"
                >
                  <Plus size={18} />
                  Tạo đề khác
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCreate;
