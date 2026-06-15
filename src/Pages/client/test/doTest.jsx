// doTest.jsx
// Page wrapper (Plan A pattern) dispatch magicpath screen vs code cũ.
//
// Logic:
//   previewMode=true                          → render code cũ (teacher preview)
//   initialTestResult?.finishedAt            → render code cũ (review mode)
//   testType === 'SPEAKING'                  → render code cũ (chưa có magicpath speaking)
//   testType in [LISTENING, READING, WRITING] → render magicpath screen mới

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Modal, Spin, message } from "antd";
import { useAuth } from "@/context/authContext";

import {
  getDetailInTestAPI,
  getTestResultAndAnswersAPI,
  StartTestAPI,
  findAllTestResultByIdUserAPI,
} from "@/services/apiDoTest";
import { getAllWritingTasksAPI } from "@/services/apiWriting";
import {
  toMagicpathShape,
  buildAnswersMapForMagicpath,
} from "@/services/magicpathAdapter";

// Code cũ — giữ cho teacher preview + review + Speaking fallback
import Listening from "@/components/test/type/listening";
import Reading from "@/components/test/type/reading";
import Writing from "@/components/test/type/writing";
import Speaking from "@/components/test/type/speaking";

// Magicpath screens
import { IELTSListeningTestScreen } from "@/components/magicpath/ielts-listening-test-screen/IELTSListeningTestScreen";
import { IELTSReadingTestScreen } from "@/components/magicpath/ielts-reading-test-screen/IELTSReadingTestScreen";
import { IELTSWritingTestScreen } from "@/components/magicpath/ielts-writing-test-screen/IELTSWritingTestScreen";

const oldComponents = {
  LISTENING: Listening,
  READING: Reading,
  WRITING: Writing,
  SPEAKING: Speaking,
};

const MAGIC_PATH_TYPES = new Set(["LISTENING", "READING", "WRITING"]);

const DoTest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const previewMode = searchParams.get("preview") === "teacher";
  const routeId = params.id || params.idTest;
  const state = location.state || {};
  const idTest = state.idTest || routeId;
  const testType = state.testType;
  const duration = state.duration;
  const initialTestResult = state.initialTestResult;

  const [loading, setLoading] = useState(!testType);
  const [test, setTest] = useState(null);
  const [testResultId, setTestResultId] = useState(
    initialTestResult?.idTestResult || initialTestResult?.id || null
  );
  const [userAnswers, setUserAnswers] = useState(
    initialTestResult?.userAnswer || []
  );
  const [writingTasks, setWritingTasks] = useState([]);
  const [timedOut, setTimedOut] = useState(false);
  const [alreadyFinished, setAlreadyFinished] = useState(null);
  // alreadyFinished shape: { idTestResult, finishedAt, bandScore } | null
  // null = chưa check xong hoặc chưa làm

  const resolvedType = (test?.testType || testType || "").toUpperCase();
  const finishedAt = initialTestResult?.finishedAt;
  const useOld =
    previewMode ||
    !!finishedAt ||
    !MAGIC_PATH_TYPES.has(resolvedType);

  // Timeout guard
  useEffect(() => {
    if (!idTest) {
      const t = setTimeout(() => setTimedOut(true), 5000);
      return () => clearTimeout(t);
    }
  }, [idTest]);

  useEffect(() => {
    if (!idTest) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getDetailInTestAPI(idTest);
        if (cancelled) return;
        setTest(res?.data || null);
      } catch (err) {
        console.error("getDetailInTestAPI error:", err);
        message.error("Không tải được dữ liệu đề thi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idTest]);

  // Guard: nếu user navigate thẳng tới /do-test/:id (go back, deep link, …)
  // mà user đã hoàn thành bài này rồi (status FINISHED) thì block,
  // show modal + điều hướng về trang test list. Tránh bị BE trả 400
  // "This test has already been submitted" khi autosave/submit.
  // Bỏ qua khi review mode (finishedAt có sẵn) hoặc teacher preview.
  useEffect(() => {
    if (previewMode) return;
    if (finishedAt) return;
    if (!idTest || !user?.idUser) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await findAllTestResultByIdUserAPI(user.idUser);
        if (cancelled) return;
        const list = (res?.data || []).filter(
          (r) => r?.idTest === idTest
        );
        // Mỗi lần startTest → tạo row mới trong userTestResult. Nhiều row
        // cho cùng idTest có thể tồn tại (làm nhiều lần, hoặc đang có
        // phiên IN_PROGRESS chưa nộp). Lấy row mới nhất theo createdAt —
        // nếu nó FINISHED thì block, nếu IN_PROGRESS thì cho resume.
        // KHÔNG phụ thuộc sort của BE — sort tại FE để an toàn.
        const latest = list
          .slice()
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          )[0];
        if (latest?.status === "FINISHED") {
          setAlreadyFinished({
            idTestResult: latest.idTestResult || latest.id || null,
            finishedAt: latest.finishedAt || null,
            bandScore: latest.bandScore ?? null,
          });
        }
      } catch (err) {
        // Lỗi check lịch sử không nên block UI — để user vào làm,
        // BE vẫn là source of truth, lỗi sẽ được xử lý khi submit.
        console.warn("findAllTestResultByIdUserAPI error:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewMode, finishedAt, idTest, user?.idUser]);

  // Khi dùng magicpath + chưa có testResultId → tạo mới
  useEffect(() => {
    if (useOld) return;
    if (testResultId) return;
    if (!idTest || !user?.idUser) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await StartTestAPI(user.idUser, idTest, {});
        if (cancelled) return;
        const data = res?.data || res;
        setTestResultId(data?.idTestResult || data?.id || null);
        setUserAnswers(data?.userAnswer || []);
      } catch (err) {
        console.error("StartTestAPI error:", err);
        // Không block UI — magicpath screen sẽ tự handle khi submit
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useOld, testResultId, idTest, user?.idUser]);

  // Load writingTasks nếu Writing
  useEffect(() => {
    if (useOld) return;
    if (resolvedType !== "WRITING") return;
    if (!idTest) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getAllWritingTasksAPI(idTest);
        if (cancelled) return;
        const arr = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        setWritingTasks(arr);
      } catch (err) {
        console.error("getAllWritingTasksAPI error:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useOld, resolvedType, idTest]);

  // Nếu có testResultId nhưng chưa có userAnswers (resume flow) → fetch
  useEffect(() => {
    if (useOld) return;
    if (!testResultId) return;
    if (userAnswers.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getTestResultAndAnswersAPI(testResultId);
        if (cancelled) return;
        const data = res?.data || res;
        setUserAnswers(data?.userAnswer || []);
      } catch (err) {
        console.error("getTestResultAndAnswersAPI error:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useOld, testResultId, userAnswers.length]);

  const testDataMagicpath = useMemo(() => {
    if (useOld || !test) return null;
    const answersMap = buildAnswersMapForMagicpath(userAnswers);
    return toMagicpathShape(test, answersMap);
  }, [useOld, test, userAnswers]);

  const initialAnswersForMagicpath = useMemo(() => {
    return buildAnswersMapForMagicpath(userAnswers);
  }, [userAnswers]);

  const handleSubmitSuccess = (result) => {
    const id = result?.idTestResult || result?.id || testResultId;
    if (id) {
      navigate(`/test/review/${id}`);
    } else {
      navigate("/test");
    }
  };

  if (timedOut) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không tải được dữ liệu đề thi. Quay lại trang Test...
      </div>
    );
  }

  // Block khi user đã hoàn thành bài này (go back / deep link).
  // Hiện modal 1 lần — user chọn "Xem kết quả" hoặc "Về trang Test".
  if (alreadyFinished) {
    const reviewId = alreadyFinished.idTestResult || testResultId;
    return (
      <Modal
        open
        title="Bài thi đã được nộp"
        okText={reviewId ? "Xem kết quả" : "Về trang Test"}
        cancelText="Về trang Test"
        showCancel
        closable={false}
        maskClosable={false}
        onOk={() => {
          if (reviewId) navigate(`/test/review/${reviewId}`);
          else navigate("/test");
        }}
        onCancel={() => navigate("/test")}
      >
        <p>Bạn đã hoàn thành bài thi này rồi và không thể làm lại.</p>
        {alreadyFinished.finishedAt && (
          <p className="text-gray-500 text-sm mt-2">
            Hoàn thành lúc:{" "}
            {new Date(alreadyFinished.finishedAt).toLocaleString("vi-VN")}
          </p>
        )}
        {typeof alreadyFinished.bandScore === "number" && (
          <p className="text-gray-500 text-sm mt-1">
            Band: {alreadyFinished.bandScore}
          </p>
        )}
      </Modal>
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

  // Code cũ (teacher preview, review mode, Speaking)
  if (useOld) {
    const OldComp = oldComponents[resolvedType];
    if (!OldComp) {
      return (
        <div className="text-center py-12 text-gray-500">
          Không tìm thấy loại đề: {resolvedType}
        </div>
      );
    }
    return (
      <OldComp
        idTest={idTest}
        duration={duration || test?.duration}
        initialTestResult={initialTestResult}
        previewMode={previewMode}
      />
    );
  }

  // Magicpath
  if (!testDataMagicpath) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  const commonProps = {
    testData: testDataMagicpath,
    testResultId: testResultId || undefined,
    userId: user?.idUser,
    onSubmitSuccess: handleSubmitSuccess,
  };

  if (resolvedType === "LISTENING") {
    return <IELTSListeningTestScreen {...commonProps} initialAnswers={initialAnswersForMagicpath} />;
  }
  if (resolvedType === "READING") {
    return <IELTSReadingTestScreen {...commonProps} initialAnswers={initialAnswersForMagicpath} />;
  }
  if (resolvedType === "WRITING") {
    return (
      <IELTSWritingTestScreen
        {...commonProps}
        writingTasks={writingTasks}
        initialAnswers={initialAnswersForMagicpath}
      />
    );
  }
  return (
    <div className="text-center py-12 text-gray-500">
      Không tìm thấy loại đề: {resolvedType}
    </div>
  );
};

export default DoTest;
