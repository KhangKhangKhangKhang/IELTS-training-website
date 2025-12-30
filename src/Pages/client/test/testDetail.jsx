import { useLocation, useNavigate } from "react-router-dom";
import Listening from "@/components/test/listening";
import Reading from "@/components/test/reading";
import Writing from "@/components/test/writing";
import Speaking from "@/components/test/speaking";
import { useState, useEffect } from "react";
import { Spin } from "antd";

const testComponents = {
  LISTENING: Listening,
  READING: Reading,
  WRITING: Writing,
  SPEAKING: Speaking,
};

const TestDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Lấy thêm initialTestResult
  const { idTest, testType, duration, initialTestResult } =
    location.state || {};
  const [timedOut, setTimedOut] = useState(false);

  const Comp = testComponents[testType?.toUpperCase()];

  useEffect(() => {
    const timer = setTimeout(() => {
      // Nếu không có idTest hoặc không có kết quả khởi tạo (người dùng cố tình paste link)
      // thì đá về trang chủ
      if (!idTest || !testType) {
        setTimedOut(true);
        navigate("/test", { replace: true });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [idTest, testType, navigate]);

  if (timedOut) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không tải được dữ liệu đề thi. Quay lại trang Test...
      </div>
    );
  }

  if (!idTest || !testType) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!Comp) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không tìm thấy loại đề: {testType}
      </div>
    );
  }

  // Truyền initialTestResult xuống
  return (
    <Comp
      idTest={idTest}
      duration={duration}
      initialTestResult={initialTestResult}
    />
  );
};

export default TestDetail;
