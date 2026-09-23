import { useLocation, useNavigate, useParams } from "react-router-dom";
import Listening from "@/components/test/type/listening";
import Reading from "@/components/test/type/reading";
import Writing from "@/components/test/type/writing";
import Speaking from "@/components/test/type/speaking";
import { useState, useEffect } from "react";
import { Spin } from "antd";
import { getDetailInTestAPI, getTestPreviewAPI } from "@/services/apiDoTest";

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
  const queryIdTest = searchParams.get("idTest");
  const navigate = useNavigate();
  const params = useParams();
  const routeId = params.id || params.idTest;
  const state = location.state || {};
  // Resolution order: state (programmatic navigate) → query string (URL paste) → route param (/:id)
  const idTest = state.idTest || queryIdTest || routeId;
  const testType = state.testType;
  const duration = state.duration;
  const initialTestResult = state.initialTestResult;
  const [timedOut, setTimedOut] = useState(false);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(!testType);
  const [preview, setPreview] = useState(null);

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
    // Fetch test preview (question type counts per part) for the "Xem trước đề" card.
    (async () => {
      try {
        const res = await getTestPreviewAPI(idTest);
        setPreview(res?.data || res);
      } catch {
        setPreview(null);
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
    <>
      {preview && preview.parts && preview.parts.length > 0 && (
        <div className="max-w-4xl mx-auto mt-4 mb-2 p-4 rounded-2xl border-2 border-[#e6e6ed] bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-extrabold text-[#1e1b4b] flex items-center gap-2">
              📋 Cấu trúc đề ({preview.totalQuestions} câu)
            </h3>
            <span className="text-xs text-[#64748b]">{preview.testType} · {preview.level}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {preview.parts.map((p) => (
              <div key={p.partNumber} className="rounded-xl bg-[#f8f8fc] p-3 border border-[#e6e6ed]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase text-[#1e1b4b]">Part {p.partNumber}</span>
                  <span className="text-[11px] text-[#64748b]">{p.totalQuestions} câu</span>
                </div>
                <div className="space-y-0.5">
                  {p.questionTypes.map((qt) => (
                    <div key={qt.type} className="text-[11px] text-[#475569] flex justify-between">
                      <span>{qt.type.replace(/_/g, ' ')}</span>
                      <span className="font-bold">×{qt.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Comp
        idTest={idTest}
        duration={duration || test?.duration}
        initialTestResult={initialTestResult}
      previewMode={previewMode}
      />
    </>
  );
};

export default TestDetail;
