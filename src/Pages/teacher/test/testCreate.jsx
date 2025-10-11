import React, { useState } from "react";
import CreateTestForm from "@/components/test/teacher/CreateTestForm";
import { useNavigate } from "react-router-dom";
import { Result, Button, Space } from "antd";
import { CheckCircleOutlined, ArrowRightOutlined } from "@ant-design/icons";

const TestCreate = () => {
  const [createdTest, setCreatedTest] = useState(null);
  const navigate = useNavigate();

  const handleCreateSuccess = (testData) => {
    setCreatedTest(testData);
    //navigate(`/admin/tests/${testData.idDe}/parts`);
  };

  const handleBackToCreate = () => {
    setCreatedTest(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {!createdTest ? (
          <CreateTestForm onSuccess={handleCreateSuccess} />
        ) : (
          <div className="flex justify-center items-center min-h-[60vh]">
            <Result
              icon={<CheckCircleOutlined className="text-green-500" />}
              title={
                <span className="text-2xl font-semibold text-gray-800">
                  Đề{" "}
                  <strong className="text-blue-600">{createdTest.title}</strong>{" "}
                  đã được tạo thành công!
                </span>
              }
              subTitle="Bây giờ bạn có thể thêm các phần (parts) cho đề thi này."
              extra={[
                <Button
                  type="primary"
                  key="parts"
                  size="large"
                  onClick={() =>
                    navigate(`/admin/tests/${createdTest.idDe}/parts`)
                  }
                  icon={<ArrowRightOutlined />}
                >
                  Chuyển đến tạo Parts
                </Button>,
                <Button
                  key="create-more"
                  size="large"
                  onClick={handleBackToCreate}
                >
                  Tạo đề khác
                </Button>,
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCreate;
