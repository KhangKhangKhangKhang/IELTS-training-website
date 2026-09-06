import { useLocation, useNavigate, useParams } from "react-router-dom";
import Listening from "@/components/test/type/listening";
import Reading from "@/components/test/type/reading";
import Writing from "@/components/test/type/writing";
import Speaking from "@/components/test/type/speaking";
import { useState, useEffect } from "react";
import { Spin } from "antd";
import { getDetailInTestAPI } from "@/services/apiDoTest";

const testComponents = {
  LISTENING: Listening,
  READING: Reading,
  WRITING: Writing,
  SPEAKING: Speaking,
};

const TestDetail = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const previewMode = searchParams.get("preview") === "teacher";
  const navigate = useNavigate();
  const params = useParams();
  const routeId = params.id || params.idTest;
  const state = location.state || {};
  const idTest = state.idTest || routeId;
  const testType = state.testType;
  const duration = state.duration;
  const initialTestResult = state.initialTestResult;
  const [timedOut, setTimedOut] = useState(false);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(!testType);

  const resolvedType = (test?.testType || testType || "").toUpperCase();
  const Comp = testComponents[resolvedType];

  useEffect(() => {
    if (testType) return;
    if (!idTest) return;
    (async () => {
      try {
        setLoading(true);
        const res = await getDetailInTestAPI(idTest);
        setTest(res?.data || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [idTest, testType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!idTest) {
        setTimedOut(true);
        navigate("/test", { replace: true });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [idTest, navigate]);

  if (timedOut) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không tải được dữ liệu đề thi. Quay lại trang Test...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!idTest || !resolvedType) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không đủ dữ liệu để preview đề.
      </div>
    );
  }

  if (!Comp) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không tìm thấy loại đề: {resolvedType}
      </div>
    );
  }

  return (
    <Comp
      idTest={idTest}
      duration={duration || test?.duration}
      initialTestResult={initialTestResult}
      previewMode={previewMode}
    />
  );
};

export default TestDetail;
