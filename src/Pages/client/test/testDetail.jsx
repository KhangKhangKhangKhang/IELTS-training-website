import { useLocation, useNavigate } from "react-router-dom";
import Listening from "@/components/test/type/listening";
import Reading from "@/components/test/type/reading";
import Writing from "@/components/test/type/writing";
import Speaking from "@/components/test/type/speaking";
import { useState, useEffect } from "react";
import { Spin } from "antd";
import {
  getActiveTestSession,
  saveActiveTestSession,
} from "@/lib/testSessionStorage";

const testComponents = {
  LISTENING: Listening,
  READING: Reading,
  WRITING: Writing,
  SPEAKING: Speaking,
};

const TestDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state || null;
  const hasValidLocationState = !!(
    locationState?.idTest && locationState?.testType
  );
  const restoredSession =
    hasValidLocationState ? null : getActiveTestSession();
  const resolvedState = hasValidLocationState
    ? locationState
    : restoredSession || {};

  const { idTest, testType, duration, initialTestResult } = resolvedState;
  const [timedOut, setTimedOut] = useState(false);

  const Comp = testComponents[testType?.toUpperCase()];

  useEffect(() => {
    if (idTest && testType) {
      saveActiveTestSession({
        idTest,
        testType,
        duration,
        initialTestResult,
      });
    }
  }, [idTest, testType, duration, initialTestResult]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!idTest || !testType) {
        setTimedOut(true);
        navigate("/test", { replace: true });
      }
    }, 2000);

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
