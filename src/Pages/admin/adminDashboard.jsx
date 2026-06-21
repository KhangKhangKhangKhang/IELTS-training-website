import React, { useEffect, useState } from "react";
import { message } from "antd";
import { IELTSAdminDashboard } from "@/components/magicpath/ielts-admin-dashboard/IELTSAdminDashboard";
import { getDashboardOverviewAPI } from "@/services/apiTeacherDashboard";
import { getModerationQueueAPI } from "@/services/apiForum";
import { getAllUserAPI } from "@/services/apiUser";
import {
  getCommissionConfigAPI,
  updateCommissionConfigAPI,
  getModerationPolicyAPI,
  updateModerationPolicyAPI,
} from "@/services/apiTeacherReview";
import { getAuditLogsAPI } from "@/services/apiAuditLog";

/**
 * AdminDashboard — thin data wrapper around the MagicPath
 * `IELTSAdminDashboard` component. Fetches only the APIs that back
 * currently-rendered sections (no dead fetches, no hardcoded placeholders).
 *
 * Sections rendered: header, 3 stat cards, alerts, quick actions,
 * moderation policy, commission config, audit trail.
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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [ov, usersRes, modRes, auditRes, commissionRes, policyRes] =
          await Promise.allSettled([
            getDashboardOverviewAPI(),
            getAllUserAPI(),
            getModerationQueueAPI(),
            getAuditLogsAPI({ page: 1, limit: 20 }),
            getCommissionConfigAPI(),
            getModerationPolicyAPI(),
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
      auditLogs={auditLogs}
      onSaveCommission={handleSaveCommission}
      onSavePolicy={handleSavePolicy}
      onRefresh={() => window.location.reload()}
    />
  );
};

export default AdminDashboard;
