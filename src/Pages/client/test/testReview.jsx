import React, { useState, useEffect, useMemo } from "react";
import { Modal, message, Spin } from "antd";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/authContext";
import { getAPITest } from "@/services/apiTest";
import { StartTestAPI, getBestBandByTestAPI } from "@/services/apiDoTest";
import {
  IELTSTestDiscoveryScreen,
} from "@/components/magicpath/ielts-test-discovery-screen/IELTSTestDiscoveryScreen";
import {
  mapTestTypeToSkill,
  mapLevelToDiff,
  formatDuration,
  computeRecentIds,
  getSkillCounts,
  getCachedUserStats,
  setCachedUserStats,
} from "@/components/test/testDiscoveryUtils";

const TestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // UI filter state (lives at the page level so the design component can
  // remain a controlled, presentational piece).
  const [skill, setSkill] = useState("all");
  const [diff, setDiff] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");

  // Data state
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userStatsById, setUserStatsById] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);

  // Confirm flow (preserved exactly from the previous page)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [startingTest, setStartingTest] = useState(false);

  // Effect A: blocking — fetch the test list. Page renders as soon as this
  // resolves (server-cached 1h on the backend, so typically <100ms after
  // the first hit).
  useEffect(() => {
    let cancelled = false;
    const fetchExams = async () => {
      setLoading(true);
      try {
        const res = await getAPITest();
        if (!cancelled) setExams(res?.data || []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        if (!cancelled) message.error("Không tải được danh sách đề thi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchExams();
    return () => {
      cancelled = true;
    };
  }, []);

  // Effect B: non-blocking — fetch the per-user best-band stats. Fired
  // in parallel with Effect A (mount → both run). Cards that depend on
  // userStatsById show a neutral state until this resolves.
  useEffect(() => {
    if (!user?.idUser) {
      setUserStatsById({});
      return;
    }
    const cached = getCachedUserStats(user.idUser);
    if (cached) {
      setUserStatsById(cached);
      return;
    }
    let cancelled = false;
    setStatsLoading(true);
    (async () => {
      try {
        const res = await getBestBandByTestAPI(user.idUser);
        const data = res?.data || {};
        if (!cancelled) {
          setUserStatsById(data);
          setCachedUserStats(user.idUser, data);
        }
      } catch (error) {
        console.error("Lỗi tải user stats:", error);
        if (!cancelled) setUserStatsById({});
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.idUser]);

  // Map raw exam objects → DiscoveryTestItem shape the design component
  // expects. Memoized so the filter bar / typing in the search box
  // doesn't re-map the entire list on every keystroke.
  const recentIds = useMemo(
    () => computeRecentIds(exams, 5),
    [exams]
  );

  const discoveryTests = useMemo(() => {
    return (exams || []).map((e) => {
      const stats = userStatsById[e.idTest];
      const dur = formatDuration(e.duration);
      return {
        id: e.idTest,
        title: e.title,
        img: e.img || null,
        skill: mapTestTypeToSkill(e.testType),
        difficulty: mapLevelToDiff(e.level),
        duration: dur.label.replace(" phút", ""), // numeric minutes for the card
        questions: e.numberQuestion || 0,
        attempts: e.attempts || 0,
        avgBand: e.avgBand ?? null,
        bestBand: stats ? Number(stats.maxBand) || null : null,
        lastFinishedAt: stats?.lastFinishedAt
          ? new Date(stats.lastFinishedAt).toISOString()
          : null,
        isNew: recentIds.has(e.idTest || e.id),
      };
    });
  }, [exams, userStatsById, recentIds]);

  const counts = useMemo(() => getSkillCounts(exams), [exams]);

  // === Confirm flow (unchanged from previous page) =====================
  const handleStartClick = (test) => {
    if (!user) {
      navigate("/login");
      return;
    }
    // The design component passes a DiscoveryTestItem; map back to the
    // shape the existing confirm modal uses (it expects the raw API test
    // fields).
    const raw = exams.find((e) => e.idTest === test.id);
    if (!raw) {
      message.error("Không tìm thấy thông tin đề thi.");
      return;
    }
    setSelectedExam(raw);
    setConfirmModalOpen(true);
  };

  const handleConfirmStart = async () => {
    if (!user?.idUser || !selectedExam) return;
    setStartingTest(true);
    try {
      const res = await StartTestAPI(user.idUser, selectedExam.idTest, {});
      const testResultData = res?.data?.data ?? res?.data;
      if (testResultData?.idTestResult) {
        message.success("Bắt đầu làm bài!");
        setConfirmModalOpen(false);
        navigate("/doTest", {
          state: {
            idTest: selectedExam.idTest,
            testType: selectedExam.testType,
            duration: selectedExam.duration,
            initialTestResult: testResultData,
          },
        });
      } else {
        throw new Error("Không lấy được ID bài làm (idTestResult)");
      }
    } catch (err) {
      console.error(err);
      message.error("Không thể bắt đầu bài thi. Vui lòng thử lại.");
    } finally {
      setStartingTest(false);
    }
  };

  // === Render =========================================================
  return (
    <div className="relative">
      {loading && exams.length === 0 ? (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafc]">
          <Spin size="large" tip="Đang tải đề thi..." />
        </div>
      ) : (
        <IELTSTestDiscoveryScreen
          tests={discoveryTests}
          counts={counts}
          userStatsById={userStatsById}
          statsLoading={statsLoading}
          skill={skill}
          setSkill={setSkill}
          diff={diff}
          setDiff={setDiff}
          search={search}
          setSearch={setSearch}
          view={view}
          setView={setView}
          onStartTest={handleStartClick}
        />
      )}

      <Modal
        title="Xác nhận làm bài"
        open={confirmModalOpen}
        onOk={handleConfirmStart}
        onCancel={() => setConfirmModalOpen(false)}
        confirmLoading={startingTest}
        okText="Bắt đầu ngay"
        cancelText="Hủy"
      >
        <p>
          Bạn có chắc chắn muốn bắt đầu làm đề thi:{" "}
          <strong>{selectedExam?.title}</strong>?
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Thời gian làm bài sẽ được tính ngay khi bạn nhấn Bắt đầu.
        </p>
      </Modal>
    </div>
  );
};

export default TestPage;
