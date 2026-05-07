import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Input, InputNumber, Spin, Tag, message, Table, Select, DatePicker } from "antd";
import {
  ArrowRight,
  AlertTriangle,
  Users,
  ShieldCheck,
  Activity,
  Settings,
  Trophy,
  RefreshCw,
  BarChart3,
  TrendingUp,
  UserPlus,
  Settings2,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
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
import dayjs from "dayjs";

const defaultPolicy = {
  autoApproveThreshold: 80,
  autoRejectThreshold: 20,
  blockedWords: [],
  reviewSlaHours: 24,
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

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
  const [topStreaks, setTopStreaks] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [users, setUsers] = useState([]);
  const [policy, setPolicy] = useState(defaultPolicy);
  const [auditLogs, setAuditLogs] = useState([]);
  const [commission, setCommission] = useState({ writing: 50000, speaking: 40000 });
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);

  // Audit log filter states
  const [auditFilter, setAuditFilter] = useState({ action: undefined, page: 1, limit: 10 });
  const [auditTotal, setAuditTotal] = useState(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [overviewData, skillData, topData, streakData, userData, moderationData, commissionData, policyData, auditData] = await Promise.all([
          getDashboardOverviewAPI(),
          getDashboardSkillPerformanceAPI(),
          getDashboardTopPerformersAPI(),
          getDashboardTopStreaksAPI(),
          getAllUserAPI(),
          user?.idUser ? getModerationQueueAPI(user.idUser) : Promise.resolve({ data: [] }),
          getCommissionConfigAPI(),
          getModerationPolicyAPI(),
          getAuditLogsAPI({ limit: 10 }),
        ]);

        if (!mounted) {
          return;
        }

        setOverview(overviewData || {});
        setSkills(skillData || {});
        setTopPerformers(Array.isArray(topData) ? topData : []);
        setTopStreaks(Array.isArray(streakData) ? streakData : []);
        setUsers(Array.isArray(userData?.data) ? userData.data : []);
        setModerationQueue(Array.isArray(moderationData?.data) ? moderationData.data : []);

        if (commissionData) {
          setCommission({ writing: commissionData.writing || 50000, speaking: commissionData.speaking || 40000 });
        }

        if (policyData) {
          setPolicy({
            autoApproveThreshold: policyData.autoApproveThreshold ?? 80,
            autoRejectThreshold: policyData.autoRejectThreshold ?? 20,
            blockedWords: Array.isArray(policyData.blockedWords) ? policyData.blockedWords : [],
            reviewSlaHours: policyData.reviewSlaHours ?? 24,
          });
        }

        if (auditData) {
          setAuditLogs(auditData.data || []);
          setAuditTotal(auditData.total || 0);
        }

        setLastUpdated(new Date());
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

  const handleSavePolicy = async () => {
    if (policy.autoRejectThreshold >= policy.autoApproveThreshold) {
      message.error("Reject threshold must be lower than approve threshold.");
      return;
    }

    setPolicySaving(true);
    try {
      // blockedWords is already an array from the Tag UI
      const blockedWordsArray = Array.isArray(policy.blockedWords)
        ? policy.blockedWords.filter((w) => w.trim().length > 0)
        : [];

      await updateModerationPolicyAPI({
        autoApproveThreshold: policy.autoApproveThreshold,
        autoRejectThreshold: policy.autoRejectThreshold,
        blockedWords: blockedWordsArray,
        reviewSlaHours: policy.reviewSlaHours,
      });

      // Refresh audit logs
      const auditData = await getAuditLogsAPI({ limit: 10 });
      setAuditLogs(auditData.data || []);
      setAuditTotal(auditData.total || 0);

      message.success("Policy saved successfully.");
    } catch (err) {
      console.error("Error saving policy:", err);
      message.error("Không thể lưu cấu hình policy.");
    } finally {
      setPolicySaving(false);
    }
  };

  const handleSaveCommission = async () => {
    setCommissionSaving(true);
    try {
      await updateCommissionConfigAPI({
        writing: commission.writing,
        speaking: commission.speaking,
      });
      message.success("Đã lưu cấu hình commission thành công!");

      // Refresh audit logs
      const auditData = await getAuditLogsAPI({ limit: 10 });
      setAuditLogs(auditData.data || []);
      setAuditTotal(auditData.total || 0);
    } catch (err) {
      console.error("Error saving commission:", err);
      message.error("Không thể lưu cấu hình commission.");
    } finally {
      setCommissionSaving(false);
    }
  };

  const handleRefreshAudit = async () => {
    try {
      const auditData = await getAuditLogsAPI({ ...auditFilter, limit: 10 });
      setAuditLogs(auditData.data || []);
      setAuditTotal(auditData.total || 0);
    } catch (err) {
      console.error("Error refreshing audit logs:", err);
    }
  };

  const handleAuditFilterChange = async (value) => {
    setAuditFilter(value);
    try {
      const auditData = await getAuditLogsAPI({ ...value, limit: 10 });
      setAuditLogs(auditData.data || []);
      setAuditTotal(auditData.total || 0);
    } catch (err) {
      console.error("Error filtering audit logs:", err);
    }
  };

  const quickActions = [
    {
      title: "Review moderation queue",
      description: "Open moderation center and resolve high-risk/pending items.",
      path: "/admin/moderation",
      icon: ShieldCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Manage users and roles",
      description: "Go to user governance for CRUD and role adjustments.",
      path: "/admin/userList",
      icon: UserPlus,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Govern learning content",
      description: "Manage tests and grammar/vocabulary resources.",
      path: "/admin/testManager",
      icon: Settings2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Inspect learning quality",
      description: "Inspect forum and learning feedback trends.",
      path: "/admin/statistic",
      icon: BarChart3,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  const auditColumns = [
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Actor",
      dataIndex: "actorName",
      key: "actorName",
      width: 120,
      render: (name, record) => (
        <div>
          <span className="font-medium">{name || "System"}</span>
          <Tag className="ml-1" color={record.actorRole === "ADMIN" ? "red" : record.actorRole === "GIAOVIEN" ? "blue" : "default"}>
            {record.actorRole}
          </Tag>
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 180,
      render: (action) => <Tag color="cyan">{action}</Tag>,
    },
    {
      title: "Target",
      key: "target",
      render: (_, record) => (
        <span className="text-slate-600">
          {record.targetType}
          {record.targetId && ` (#${record.targetId.slice(0, 8)})`}
        </span>
      ),
    },
    {
      title: "Details",
      key: "details",
      render: (_, record) => (
        <div className="text-sm text-slate-600">
          {record.beforeValue && record.afterValue && (
            <span className="text-green-600">Updated</span>
          )}
          {record.afterValue && !record.beforeValue && (
            <span className="text-blue-600">Created</span>
          )}
          {record.beforeValue && !record.afterValue && (
            <span className="text-red-600">Deleted</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-linear-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <Card className="border-0 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600">
                Flow-first control center: monitor system health, process governance tasks, and apply moderation policy safely.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-slate-500">
                  Last updated: {dayjs(lastUpdated).format("HH:mm:ss")}
                </span>
              )}
              <Button
                icon={<RefreshCw size={14} />}
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {error && <Alert type="error" showIcon message={error} />}

        {/* Stats Cards - Asymmetric Grid */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card loading={loading} className="border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Total users</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{userStats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              <Tag color="red" className="text-xs">Admin {userStats.admin}</Tag>
              <Tag color="blue" className="text-xs">Teacher {userStats.teacher}</Tag>
              <Tag color="default" className="text-xs">Student {userStats.student}</Tag>
            </div>
          </Card>

          <Card loading={loading} className="border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Tests this month</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{overview.testsThisMonth}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100">
                <Activity className="text-emerald-600" size={20} />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Avg band: <span className="font-semibold text-emerald-600">{Number(overview.avgBandScore || 0).toFixed(1)}</span></p>
          </Card>

          <Card loading={loading} className="border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Moderation waiting</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{moderationStats.needsReview}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <ShieldCheck className="text-orange-600" size={20} />
              </div>
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="text-green-600">✓ {moderationStats.approved}</span>
              <span className="text-red-600">✗ {moderationStats.rejected}</span>
            </div>
          </Card>

          <Card loading={loading} className="border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Top performer</p>
                <p className="mt-1 text-3xl font-bold text-purple-600">
                  {topPerformers[0] ? Number(topPerformers[0].averageBandScore).toFixed(1) : "0.0"}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Trophy className="text-purple-600" size={20} />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600 truncate">{topPerformers[0]?.nameUser || "No data"}</p>
          </Card>
        </section>

        {/* Skill Breakdown + Alerts Row */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card loading={loading} className="lg:col-span-2 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Skill Performance</h2>
              <TrendingUp size={18} className="text-slate-400" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["LISTENING", "READING", "WRITING", "SPEAKING"].map((skill) => {
                const score = skills[skill] || 0;
                const color = score >= 6 ? "text-emerald-600" : score >= 5 ? "text-yellow-600" : "text-red-600";
                return (
                  <div key={skill} className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 uppercase">{skill}</p>
                    <p className={`mt-1 text-2xl font-bold ${color}`}>{Number(score).toFixed(1)}</p>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${score >= 6 ? "bg-emerald-500" : score >= 5 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(100, (score / 9) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {lowSkill && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <AlertTriangle size={14} className="inline mr-1" />
                  Weakest skill: <span className="font-semibold">{lowSkill.skillName}</span> ({lowSkill.score})
                </p>
              </div>
            )}
          </Card>

          <Card loading={loading} className="border-0 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Operational Alerts</h2>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✓</div>
                <p className="text-sm text-slate-500">No active alerts.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {alerts.map((alert, idx) => (
                  <li key={idx} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="mt-0.5 text-amber-600" />
                      <span className="text-sm text-amber-800">{alert}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* Quick Actions */}
        <Card loading={loading} className="border-0 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.title}
                  className={`rounded-lg border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-shadow ${action.bgColor}`}
                  onClick={() => navigate(action.path)}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={action.color} />
                    <p className="font-semibold text-slate-800">{action.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{action.description}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Configuration Section */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Moderation Policy */}
          <Card className="border-0 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Moderation Policy</h2>
            <p className="mt-1 text-sm text-slate-600">Configure auto-moderation thresholds and blocked terms.</p>

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

                <Form.Item label="Blocked words" className="col-span-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(policy.blockedWords || []).map((word, index) => (
                      <Tag
                        key={index}
                        closable
                        onClose={() => {
                          const newWords = policy.blockedWords.filter((_, i) => i !== index);
                          setPolicy((prev) => ({ ...prev, blockedWords: newWords }));
                        }}
                        className="text-sm px-2 py-1"
                      >
                        {word}
                      </Tag>
                    ))}
                  </div>
                  <Input
                    placeholder="Add new blocked word, press Enter"
                    onPressEnter={(e) => {
                      const value = e.target.value.trim().toLowerCase();
                      if (value && !policy.blockedWords.includes(value)) {
                        setPolicy((prev) => ({
                          ...prev,
                          blockedWords: [...prev.blockedWords, value],
                        }));
                      }
                      e.target.value = '';
                    }}
                  />
                  <span className="text-xs text-slate-500 mt-1">Press Enter to add a word</span>
                </Form.Item>
              </div>

              <Button type="primary" onClick={handleSavePolicy} loading={policySaving}>
                Save policy
              </Button>
            </Form>
          </Card>

          {/* Commission Configuration */}
          <Card className="border-0 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Commission Configuration</h2>
            <p className="mt-1 text-sm text-slate-600">Set fixed commission per reviewed paper.</p>

            <Form layout="vertical" className="mt-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Form.Item label="Writing (VNĐ)">
                  <InputNumber
                    min={0}
                    step={10000}
                    value={commission.writing}
                    onChange={(value) => setCommission((prev) => ({ ...prev, writing: Number(value || 0) }))}
                    className="!w-full"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/,/g, '')}
                  />
                </Form.Item>

                <Form.Item label="Speaking (VNĐ)">
                  <InputNumber
                    min={0}
                    step={10000}
                    value={commission.speaking}
                    onChange={(value) => setCommission((prev) => ({ ...prev, speaking: Number(value || 0) }))}
                    className="!w-full"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/,/g, '')}
                  />
                </Form.Item>
              </div>

              <Button type="primary" onClick={handleSaveCommission} loading={commissionSaving}>
                Save commission
              </Button>
            </Form>
          </Card>
        </section>

        {/* Audit Trail */}
        <Card className="border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Audit Trail</h2>
              <p className="mt-1 text-sm text-slate-600">Server-side log of all sensitive admin actions.</p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                placeholder="Filter by action"
                allowClear
                style={{ width: 200 }}
                onChange={(value) => handleAuditFilterChange({ ...auditFilter, action: value })}
                options={[
                  { label: "All Actions", value: undefined },
                  { label: "Moderation Policy", value: "MODERATION_POLICY_UPDATE" },
                  { label: "Commission", value: "COMMISSION_UPDATE" },
                  { label: "Forum Review", value: "FORUM_POST_REVIEW" },
                  { label: "User Create", value: "USER_CREATE" },
                  { label: "User Update", value: "USER_UPDATE" },
                  { label: "User Delete", value: "USER_DELETE" },
                  { label: "Role Change", value: "USER_ROLE_CHANGE" },
                ]}
              />
              <Button icon={<RefreshCw size={14} />} onClick={handleRefreshAudit}>
                Refresh
              </Button>
            </div>
          </div>

          <Table
            columns={auditColumns}
            dataSource={auditLogs}
            rowKey="idAuditLog"
            pagination={{
              current: auditFilter.page,
              pageSize: 10,
              total: auditTotal,
              onChange: (page) => handleAuditFilterChange({ ...auditFilter, page }),
              showSizeChanger: false,
            }}
            locale={{ emptyText: "No audit entries yet." }}
            size="small"
          />
        </Card>

        {loading && (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;