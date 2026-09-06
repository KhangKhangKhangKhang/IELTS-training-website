import React, { useEffect, useState } from "react";
import { message } from "antd";
import { IELTSTeacherGradingQueue } from "@/components/magicpath/ielts-teacher-grading-queue/IELTSTeacherGradingQueue";
import API from "@/services/axios.custom";
import {
  getAllTicketsAdminAPI,
  getTicketStatsAPI,
} from "@/services/apiTeacherReview";

/**
 * teacherReviewManager (admin) — thin data wrapper around the MagicPath
 * `IELTSTeacherGradingQueue` component. The MagicPath canvas is purely
 * visual; this layer fetches real tickets + stats and adapts the shape
 * to what the queue expects.
 */
const TeacherReviewManager = () => {
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({
    PENDING: 0,
    CLAIMED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.allSettled([
        getAllTicketsAdminAPI({ page: 1, limit: 200 }),
        getTicketStatsAPI(),
      ]);

      if (ticketsRes.status === "fulfilled") {
        const list = ticketsRes.value?.items ?? ticketsRes.value?.data ?? ticketsRes.value ?? [];
        setTickets(Array.isArray(list) ? list.map(normalizeTicket) : []);
      }
      if (statsRes.status === "fulfilled") {
        const s = statsRes.value;
        setCounts({
          PENDING: s?.PENDING ?? s?.pending ?? 0,
          CLAIMED: s?.CLAIMED ?? s?.claimed ?? 0,
          IN_PROGRESS: s?.IN_PROGRESS ?? s?.inProgress ?? 0,
          COMPLETED: s?.COMPLETED ?? s?.completed ?? 0,
          CANCELLED: s?.CANCELLED ?? s?.cancelled ?? 0,
        });
      }
    } catch (e) {
      console.error("teacherReviewManager fetch failed", e);
      message.error("Không tải được danh sách chấm bài");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleClaim = async (ticket) => {
    try {
      await API.post(`/teacher-review/claim-ticket/${ticket.teacherId ?? "auto"}/${ticket.id}`);
      message.success("Đã nhận bài");
      fetchAll();
    } catch (e) {
      message.error("Nhận bài thất bại");
      throw e;
    }
  };

  const handleUnclaim = async (ticket) => {
    try {
      await API.post(`/teacher-review/unclaim-ticket/${ticket.teacherId ?? "auto"}/${ticket.id}`);
      message.success("Đã trả lại bài");
      fetchAll();
    } catch (e) {
      message.error("Trả bài thất bại");
      throw e;
    }
  };

  const handleSubmit = async (payload) => {
    try {
      const { teacherBand, ...rest } = payload || {};
      await API.patch(`/teacher-review/submit-score/${payload.teacherId ?? "auto"}/${payload.id}`, {
        teacherBand,
        ...rest,
      });
      message.success("Đã nộp điểm");
      fetchAll();
    } catch (e) {
      message.error("Nộp điểm thất bại");
      throw e;
    }
  };

  return (
    <IELTSTeacherGradingQueue
      tickets={tickets}
      counts={counts}
      loading={loading}
      onClaim={handleClaim}
      onUnclaim={handleUnclaim}
      onSubmit={handleSubmit}
    />
  );
};

// Map backend ticket shape to what the MagicPath queue expects.
const normalizeTicket = (t) => ({
  id: t.idTicket ?? t.id,
  type: (t.type ?? t.testType ?? "WRITING").toUpperCase(),
  student: t.student?.nameUser ?? t.studentName ?? t.userName ?? "—",
  test: t.testResult?.test?.title ?? t.testTitle ?? t.testName ?? "—",
  aiBand: t.aiBandScore ?? t.aiBand ?? null,
  teacherBand: t.teacherBandScore ?? t.teacherBand ?? null,
  status: (t.status ?? "PENDING").toUpperCase(),
  date: t.createdAt ? new Date(t.createdAt).toLocaleDateString("vi-VN") : "",
  teacherId: t.idTeacher ?? t.teacher?.idUser,
  commission: t.commissionAmount ?? t.commission,
});

export default TeacherReviewManager;
