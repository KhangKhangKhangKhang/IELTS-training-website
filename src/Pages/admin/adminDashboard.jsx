import React, { useEffect, useState } from "react";
import { message } from "antd";
import { IELTSAdminDashboard } from "@/components/magicpath/ielts-admin-dashboard/IELTSAdminDashboard";
import {
  getDashboardOverviewAPI,
  getDashboardSkillPerformanceAPI,
  getDashboardTopPerformersAPI,
  getDashboardTopStreaksAPI,
} from "@/services/apiTeacherDashboard";
import { getModerationQueueAPI } from "@/services/apiForum";
import { getAllUserAPI } from "@/services/apiUser";
import {
  getCommissionConfigAPI,
  updateCommissionConfigAPI,
  getModerationPolicyAPI,
  updateModerationPolicyAPI,
} from "@/services/apiTeacherReview";
import { getAuditLogsAPI } from "@/services/apiAuditLog";
import {
  getStudyPlannerConfigAPI,
  updateStudyPlannerConfigAPI,
} from "@/services/apiStatistics";

/**
 * AdminDashboard — thin data wrapper around the MagicPath
 * `IELTSAdminDashboard` component. The MagicPath canvas component is purely
 * visual; this layer fetches real APIs and passes derived props down.
 *
 * MagicPath dashboard renders: header, 4 stat cards, skill breakdown,
 * trend chart, alerts, quick actions, moderation policy, commission config,
 * audit trail.
 *
 * Only the pieces we can actually populate from the live API are wired;
 * anything else (skill bars, trend chart, audit rows) shows the MagicPath
 * placeholder until a real endpoint lands.
 */
const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [commission, setCommission] = useState({ writing: 50000, speaking: 40000 });
  const [policy, setPolicy] = useState({
    autoApproveThreshold: 80,
    autoRejectThreshold: 20,
    blockedWords: [],
    reviewSlaHours: 24,
  });
  const [studyPlannerConfig, setStudyPlannerConfig] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [
          ov,
          _skills,
          _topPerformers,
          _topStreaks,
          usersRes,
          modRes,
          auditRes,
          commissionRes,
          policyRes,
          studyPlannerRes,
        ] = await Promise.allSettled([
          getDashboardOverviewAPI(),
          getDashboardSkillPerformanceAPI(),
          getDashboardTopPerformersAPI(),
          getDashboardTopStreaksAPI(),
          getAllUserAPI(),
          getModerationQueueAPI(),
          getAuditLogsAPI({ page: 1, limit: 20 }),
          getCommissionConfigAPI(),
          getModerationPolicyAPI(),
          getStudyPlannerConfigAPI(),
        ]);

        if (!mounted) return;

        if (ov.status === "fulfilled") setOverview(ov.value);
        if (usersRes.status === "fulfilled") {
          const list = usersRes.value?.data ?? usersRes.value ?? [];
          setUsers(Array.isArray(list) ? list : []);
        }
        if (modRes.status === "fulfilled") {
          const list = modRes.value?.items ?? modRes.value ?? [];
          setModerationQueue(Array.isArray(list) ? list : []);
        }
        if (auditRes.status === "fulfilled") {
          const list = auditRes.value?.items ?? auditRes.value?.data ?? [];
          setAuditLogs(Array.isArray(list) ? list : []);
        }
        if (commissionRes.status === "fulfilled") {
          const c = commissionRes.value;
          if (c) setCommission({ writing: c.writing ?? 50000, speaking: c.speaking ?? 40000 });
        }
        if (policyRes.status === "fulfilled") {
          const p = policyRes.value;
          if (p) setPolicy(p);
        }
        if (studyPlannerRes.status === "fulfilled") {
          setStudyPlannerConfig(studyPlannerRes.value);
        }
      } catch (err) {
        console.error("AdminDashboard load failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const teacherCount = users.filter((u) => u.role === "GIAOVIEN").length;
  const studentCount = users.filter((u) => u.role === "USER").length;
  const topPerformer = overview?.topPerformer ?? null;
  const pendingCount = moderationQueue.length;

  const handleSaveCommission = async (writing, speaking) => {
    try {
      await updateCommissionConfigAPI({ writing, speaking });
      setCommission({ writing, speaking });
      message.success("Đã lưu cấu hình hoa hồng");
    } catch (err) {
      message.error("Lưu hoa hồng thất bại");
      console.error(err);
    }
  };

  const handleSavePolicy = async (next) => {
    try {
      await updateModerationPolicyAPI(next);
      setPolicy(next);
      message.success("Đã lưu chính sách kiểm duyệt");
    } catch (err) {
      message.error("Lưu chính sách thất bại");
      console.error(err);
    }
  };

  const handleSaveStudyPlanner = async (next) => {
    try {
      await updateStudyPlannerConfigAPI(next);
      setStudyPlannerConfig(next);
      message.success("Đã lưu cấu hình Study Planner");
    } catch (err) {
      message.error("Lưu Study Planner thất bại");
      console.error(err);
    }
  };

  return (
    <IELTSAdminDashboard
      loading={loading}
      totalUsers={totalUsers}
      adminCount={adminCount}
      teacherCount={teacherCount}
      studentCount={studentCount}
      pendingModerationCount={pendingCount}
      topPerformer={topPerformer}
      commission={commission}
      policy={policy}
      studyPlannerConfig={studyPlannerConfig}
      auditLogs={auditLogs}
      onSaveCommission={handleSaveCommission}
      onSavePolicy={handleSavePolicy}
      onSaveStudyPlanner={handleSaveStudyPlanner}
      onRefresh={() => window.location.reload()}
    />
  );
};

export default AdminDashboard;
