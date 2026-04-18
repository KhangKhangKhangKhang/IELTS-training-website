import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Input, InputNumber, Spin, Tag, message } from "antd";
import {
  ArrowRight,
  AlertTriangle,
  Users,
  ShieldCheck,
  Activity,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import {
  getDashboardOverviewAPI,
  getDashboardSkillPerformanceAPI,
  getDashboardTopPerformersAPI,
} from "@/services/apiTeacherDashboard";
import { getModerationQueueAPI } from "@/services/apiForum";
import { getAllUserAPI } from "@/services/apiUser";

const POLICY_KEY = "admin_moderation_policy_v1";
const AUDIT_KEY = "admin_audit_log_v1";

const defaultPolicy = {
  autoApproveThreshold: 80,
  autoRejectThreshold: 20,
  blockedWords: "spam, scam",
  reviewSlaHours: 24,
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState({
    totalStudents: 0,
    testsThisMonth: 0,
    avgBandScore: 0,
  });
  const [skills, setSkills] = useState({
    LISTENING: 0,
    READING: 0,
    WRITING: 0,
    SPEAKING: 0,
  });
  const [topPerformers, setTopPerformers] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [users, setUsers] = useState([]);
  const [policy, setPolicy] = useState(defaultPolicy);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const rawPolicy = localStorage.getItem(POLICY_KEY);
    if (rawPolicy) {
      try {
        setPolicy({ ...defaultPolicy, ...JSON.parse(rawPolicy) });
      } catch {
        setPolicy(defaultPolicy);
      }
    }

    const rawAudit = localStorage.getItem(AUDIT_KEY);
    if (rawAudit) {
      try {
        const parsed = JSON.parse(rawAudit);
        setAuditLogs(Array.isArray(parsed) ? parsed : []);
      } catch {
        setAuditLogs([]);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [overviewData, skillData, topData, userData, moderationData] = await Promise.all([
          getDashboardOverviewAPI(),
          getDashboardSkillPerformanceAPI(),
          getDashboardTopPerformersAPI(),
          getAllUserAPI(),
          user?.idUser ? getModerationQueueAPI(user.idUser) : Promise.resolve({ data: [] }),
        ]);

        if (!mounted) {
          return;
        }

        setOverview(overviewData || {});
        setSkills(skillData || {});
        setTopPerformers(Array.isArray(topData) ? topData : []);
        setUsers(Array.isArray(userData?.data) ? userData.data : []);
        setModerationQueue(Array.isArray(moderationData?.data) ? moderationData.data : []);
      } catch {
        if (!mounted) {
          return;
        }

        setError("Failed to load admin dashboard data.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user?.idUser]);

  const userStats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((item) => item.role === "ADMIN").length,
      teacher: users.filter((item) => item.role === "GIAOVIEN").length,
      student: users.filter((item) => item.role === "USER").length,
    };
  }, [users]);

  const moderationStats = useMemo(() => {
    const summary = {
      total: moderationQueue.length,
      needsReview: 0,
      approved: 0,
      rejected: 0,
    };

    moderationQueue.forEach((record) => {
      const status = record?.moderation?.status;
      if (status === "needs_review" || status === "pending") {
        summary.needsReview += 1;
      }
      if (status === "approved" || status === "auto_approved") {
        summary.approved += 1;
      }
      if (status === "rejected" || status === "auto_rejected") {
        summary.rejected += 1;
      }
    });

    return summary;
  }, [moderationQueue]);

  const lowSkill = useMemo(() => {
    const items = Object.entries(skills || {});
    if (!items.length) {
      return null;
    }

    const [skillName, score] = items.sort((a, b) => Number(a[1]) - Number(b[1]))[0];
    return { skillName, score: Number(score || 0).toFixed(1) };
  }, [skills]);

  const alerts = useMemo(() => {
    const list = [];

    if (moderationStats.needsReview > 0) {
      list.push(`Moderation queue has ${moderationStats.needsReview} items waiting for review.`);
    }

    if (lowSkill && Number(lowSkill.score) < 6) {
      list.push(`System weakest skill is ${lowSkill.skillName} with average ${lowSkill.score}.`);
    }

    if (overview.avgBandScore < 5.5) {
      list.push("Average band score is below 5.5, consider intervention plan updates.");
    }

    return list;
  }, [lowSkill, moderationStats.needsReview, overview.avgBandScore]);

  const handleSavePolicy = () => {
    if (policy.autoRejectThreshold >= policy.autoApproveThreshold) {
      message.error("Reject threshold must be lower than approve threshold.");
      return;
    }

    localStorage.setItem(POLICY_KEY, JSON.stringify(policy));

    const actor = user?.nameUser || "ADMIN";
    const newEntry = {
      id: `${Date.now()}`,
      actor,
      at: new Date().toISOString(),
      detail: `Updated thresholds approve=${policy.autoApproveThreshold}, reject=${policy.autoRejectThreshold}, sla=${policy.reviewSlaHours}h`,
    };

    const updatedLogs = [newEntry, ...auditLogs].slice(0, 20);
    setAuditLogs(updatedLogs);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(updatedLogs));
    message.success("Policy draft saved locally.");
  };

  const quickActions = [
    {
      title: "1) Review moderation queue",
      description: "Open moderation center and resolve high-risk/pending items.",
      path: "/admin/moderation",
    },
    {
      title: "2) Manage users and roles",
      description: "Go to user governance for CRUD and role adjustments.",
      path: "/admin/userList",
    },
    {
      title: "3) Govern learning content",
      description: "Manage tests and grammar/vocabulary resources.",
      path: "/admin/testManager",
    },
    {
      title: "4) Inspect learning quality",
      description: "Inspect forum and learning feedback trends.",
      path: "/admin/statistic",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <Card>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Flow-first control center: monitor system health, process governance tasks, and apply moderation policy safely.
          </p>
        </Card>

        {error && <Alert type="error" showIcon message={error} />}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card loading={loading}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Total users</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{userStats.total}</p>
              </div>
              <Users className="text-blue-600" size={20} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Admin {userStats.admin} • Teacher {userStats.teacher} • Student {userStats.student}</p>
          </Card>

          <Card loading={loading}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Tests this month</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{overview.testsThisMonth}</p>
              </div>
              <Activity className="text-emerald-600" size={20} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Average band {Number(overview.avgBandScore || 0).toFixed(1)}</p>
          </Card>

          <Card loading={loading}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Moderation waiting</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{moderationStats.needsReview}</p>
              </div>
              <ShieldCheck className="text-orange-600" size={20} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Approved {moderationStats.approved} • Rejected {moderationStats.rejected}</p>
          </Card>

          <Card loading={loading}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Top performer snapshot</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {topPerformers[0] ? Number(topPerformers[0].averageBandScore).toFixed(1) : "0.0"}
                </p>
              </div>
              <Settings className="text-purple-600" size={20} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{topPerformers[0]?.nameUser || "No data"}</p>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2" loading={loading}>
            <h2 className="text-lg font-semibold text-slate-900">Admin Workflow</h2>
            <p className="mt-1 text-sm text-slate-600">Execute governance tasks in sequence to keep moderation and data quality stable.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {quickActions.map((action) => (
                <div key={action.title} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-800">{action.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                  <Button
                    type="link"
                    className="!px-0"
                    onClick={() => navigate(action.path)}
                    icon={<ArrowRight size={14} />}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card loading={loading}>
            <h2 className="text-lg font-semibold text-slate-900">Operational Alerts</h2>
            {alerts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No active alerts.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {alerts.map((alert) => (
                  <li key={alert} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="mt-0.5" />
                      <span>{alert}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-800">Moderation status mix</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Tag color="gold">Needs review: {moderationStats.needsReview}</Tag>
                <Tag color="green">Approved: {moderationStats.approved}</Tag>
                <Tag color="red">Rejected: {moderationStats.rejected}</Tag>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Moderation Policy Draft</h2>
            <p className="mt-1 text-sm text-slate-600">MVP config panel until system settings API is available.</p>

            <Form layout="vertical" className="mt-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Form.Item label="Auto-approve threshold (0-100)">
                  <InputNumber
                    min={0}
                    max={100}
                    value={policy.autoApproveThreshold}
                    onChange={(value) => setPolicy((prev) => ({ ...prev, autoApproveThreshold: Number(value || 0) }))}
                    className="!w-full"
                  />
                </Form.Item>

                <Form.Item label="Auto-reject threshold (0-100)">
                  <InputNumber
                    min={0}
                    max={100}
                    value={policy.autoRejectThreshold}
                    onChange={(value) => setPolicy((prev) => ({ ...prev, autoRejectThreshold: Number(value || 0) }))}
                    className="!w-full"
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Form.Item label="Review SLA (hours)">
                  <InputNumber
                    min={1}
                    max={168}
                    value={policy.reviewSlaHours}
                    onChange={(value) => setPolicy((prev) => ({ ...prev, reviewSlaHours: Number(value || 1) }))}
                    className="!w-full"
                  />
                </Form.Item>

                <Form.Item label="Blocked words (comma-separated)">
                  <Input
                    value={policy.blockedWords}
                    onChange={(event) => setPolicy((prev) => ({ ...prev, blockedWords: event.target.value }))}
                  />
                </Form.Item>
              </div>

              <Button type="primary" onClick={handleSavePolicy}>
                Save draft policy
              </Button>
            </Form>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Audit Trail (Local MVP)</h2>
            <p className="mt-1 text-sm text-slate-600">Recent sensitive changes recorded from this dashboard flow.</p>

            {auditLogs.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No audit entries yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {auditLogs.map((log) => (
                  <li key={log.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">{log.actor}</p>
                    <p className="text-xs text-slate-500">{new Date(log.at).toLocaleString("vi-VN")}</p>
                    <p className="mt-1 text-sm text-slate-700">{log.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {loading && (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
