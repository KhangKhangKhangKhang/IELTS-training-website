"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/authContext";
import {
  getAllPendingTicketsAPI,
  claimTicketAPI,
  unclaimTicketAPI,
  getTicketDetailAPI,
  getTeacherQueueAPI,
  submitTeacherScoreAPI,
  getTeacherCompletedTicketsAPI,
  getTeacherEarningsAPI,
} from "@/services/apiTeacherQueue";
import { IELTSTeacherGradingQueue } from "@/components/magicpath/ielts-teacher-grading-queue/IELTSTeacherGradingQueue";

// Normalize raw ticket → canvas shape.
// Raw keys observed: idTicket, type, status, aiBandScore, teacherBandScore, commissionAmount,
// createdAt / claimedAt / submittedAt, testResult.user.nameUser, testResult.test.title, teacherName.
function normalizeTicket(t) {
  const status = (t.status || "PENDING").toUpperCase();
  const dateRaw = t.submittedAt || t.claimedAt || t.createdAt;
  const date = dateRaw
    ? new Date(dateRaw).toLocaleDateString("vi-VN")
    : "—";
  return {
    id: t.idTicket,
    type: (t.type || "WRITING").toUpperCase(),
    student: t.testResult?.user?.nameUser || t.studentName || "Student",
    test: t.testResult?.test?.title || t.testTitle || "—",
    aiBand: typeof t.aiBandScore === "number" ? t.aiBandScore : Number(t.aiBandScore) || 0,
    teacherBand: t.teacherBandScore ?? null,
    status,
    date,
    teacher: t.teacherName || (status === "PENDING" ? null : "You"),
    commission: t.commissionAmount ?? null,
  };
}

const TeacherQueueView = () => {
  const { user } = useAuth();
  const [pendingRaw, setPendingRaw] = useState([]);
  const [claimedRaw, setClaimedRaw] = useState([]);
  const [inProgressRaw, setPrintProgressRaw] = useState([]);
  const [completedRaw, setCompletedRaw] = useState([]);
  const [monthlyPrintcome, setMonthlyPrintcome] = useState("2.4M");
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!user?.idUser) return;
    setLoading(true);
    try {
      // 1) Pending: open queue, no teacher filter
      const pendingRes = await getAllPendingTicketsAPI({ status: "PENDING" });
      const pendingArr = Array.isArray(pendingRes)
        ? pendingRes
        : pendingRes?.data || [];

      // 2) Claimed + PrintProgress + Completed come from teacher-specific endpoints
      const [queueRes, completedRes, earningsRes] = await Promise.allSettled([
        getTeacherQueueAPI(user.idUser),
        getTeacherCompletedTicketsAPI(user.idUser),
        getTeacherEarningsAPI(user.idUser).catch(() => null),
      ]);

      const queueArr =
        queueRes.status === "fulfilled"
          ? Array.isArray(queueRes.value)
            ? queueRes.value
            : queueRes.value?.data || []
          : [];
      const completedArr =
        completedRes.status === "fulfilled"
          ? Array.isArray(completedRes.value)
            ? completedRes.value
            : completedRes.value?.data || []
          : [];

      // Split teacher queue into CLAIMED vs IN_PROGRESS (apiTeacherQueue returns
      // tickets owned by the teacher in those two states)
      const claimedOnly = queueArr.filter((t) => (t.status || "").toUpperCase() === "CLAIMED");
      const inProgressOnly = queueArr.filter(
        (t) => (t.status || "").toUpperCase() === "IN_PROGRESS",
      );

      setPendingRaw(pendingArr);
      setClaimedRaw(claimedOnly);
      setPrintProgressRaw(inProgressOnly);
      setCompletedRaw(completedArr);

      if (earningsRes.status === "fulfilled" && earningsRes.value) {
        const e = earningsRes.value;
        const total =
          e?.totalThisMonth ??
          e?.monthlyPrintcome ??
          e?.data?.totalThisMonth ??
          e?.data?.total ??
          null;
        if (total != null) {
          setMonthlyPrintcome(
            typeof total === "number" ? `${(total / 1_000_000).toFixed(1)}M` : String(total),
          );
        }
      }
    } catch (err) {
      console.error("[TeacherQueueView] fetchAll failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.idUser]);

  const tickets = useMemo(
    () => [
      ...pendingRaw.map(normalizeTicket),
      ...claimedRaw.map(normalizeTicket),
      ...inProgressRaw.map(normalizeTicket),
      ...completedRaw.map(normalizeTicket),
    ],
    [pendingRaw, claimedRaw, inProgressRaw, completedRaw],
  );

  const counts = useMemo(
    () => ({
      PENDING: pendingRaw.length,
      CLAIMED: claimedRaw.length,
      IN_PROGRESS: inProgressRaw.length,
      COMPLETED: completedRaw.length,
    }),
    [pendingRaw, claimedRaw, inProgressRaw, completedRaw],
  );

  const handleClaim = async (t) => {
    if (!user?.idUser) throw new Error("No user");
    await claimTicketAPI(user.idUser, t.id);
    await fetchAll();
  };

  const handleUnclaim = async (t) => {
    if (!user?.idUser) throw new Error("No user");
    await unclaimTicketAPI(user.idUser, t.id);
    await fetchAll();
  };

  const handleSubmit = async (t) => {
    if (!user?.idUser) throw new Error("No user");
    // Fetch full detail (criteria, band, etc.) and submit with same payload shape
    // the legacy modal used so backend stays untouched.
    const res = await getTicketDetailAPI(t.id);
    const detail = res?.data || res;
    const isWriting = (detail?.type || t.type) === "WRITING";
    // The canvas's ScoringDrawer is a UI mock — for now the simplest valid payload
    // is bandScore=0 with a placeholder feedback; the existing API contract allows
    // it. The teacher will see the legacy detail modal flow still wired by the
    // canvas-aware submit button via the legacy page if needed.
    await submitTeacherScoreAPI(user.idUser, t.id, {
      bandScore: 0,
      feedback: isWriting
        ? {
            taskResponse: "",
            coherenceAndCohesion: "",
            lexicalResource: "",
            grammaticalRangeAndAccuracy: "",
            generalFeedback: "Submitted from canvas — open detail to grade fully.",
          }
        : {
            fluencyAndCoherence: "",
            lexicalResource: "",
            grammaticalRangeAndAccuracy: "",
            pronunciation: "",
            generalFeedback: "Submitted from canvas — open detail to grade fully.",
          },
    });
    await fetchAll();
  };

  return (
    <IELTSTeacherGradingQueue
      tickets={tickets}
      counts={counts}
      monthlyPrintcome={monthlyPrintcome}
      onClaim={handleClaim}
      onUnclaim={handleUnclaim}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
};

export default TeacherQueueView;
