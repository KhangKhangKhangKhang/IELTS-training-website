import React, { useState } from 'react';
import { Card, Badge, PillButton, StatCard } from './adminUI';
import { SkillBreakdown, TrendChart } from './adminCharts';
import { ModerationPolicy, CommissionConfig } from './adminConfig';
import { AuditTrail } from './adminAudit';
const QUICK_ACTIONS = [{
  title: 'Hàng đợi kiểm duyệt',
  desc: 'Xử lý bài rủi ro cao / chờ duyệt',
  icon: '🛡️',
  tone: 'coral',
  href: '/admin/moderation'
}, {
  title: 'Người dùng & vai trò',
  desc: 'Quản trị CRUD và phân quyền',
  icon: '👥',
  tone: 'indigo',
  href: '/admin/userList'
}, {
  title: 'Nội dung học tập',
  desc: 'Quản lý đề thi, ngữ pháp, từ vựng',
  icon: '📚',
  tone: 'purple',
  href: '/admin/testManager'
}, {
  title: 'Chấm bài',
  desc: 'Theo dõi hàng đợi chấm & hoa hồng',
  icon: '⏱️',
  tone: 'cyan',
  href: '/admin/teacher-review'
}] as const;
type AuditLog = {
  createdAt?: string;
  actorName?: string;
  actorRole?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
};
type Props = {
  loading?: boolean;
  totalUsers?: number;
  adminCount?: number;
  teacherCount?: number;
  studentCount?: number;
  pendingModerationCount?: number;
  topPerformer?: { nameUser?: string; band?: number } | null;
  commission?: { writing: number; speaking: number };
  policy?: {
    autoApproveThreshold: number;
    autoRejectThreshold: number;
    blockedWords: string[];
    reviewSlaHours: number;
  };
  studyPlannerConfig?: unknown;
  auditLogs?: AuditLog[];
  onSaveCommission?: (writing: number, speaking: number) => void | Promise<void>;
  onSavePolicy?: (next: Props['policy']) => void | Promise<void>;
  onSaveStudyPlanner?: (next: unknown) => void | Promise<void>;
  onRefresh?: () => void;
};
const fmt = (n: number | undefined) => (n ?? 0).toLocaleString('vi-VN');
const formatTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
const buildAlerts = (pendingModerationCount: number, topPerformer: Props['topPerformer']) => {
  const out: string[] = [];
  if (pendingModerationCount > 0) {
    out.push(`Hàng đợi kiểm duyệt có ${pendingModerationCount} mục đang chờ xử lý.`);
  }
  if (topPerformer?.band) {
    out.push(`Học viên top hiện tại: ${topPerformer.nameUser ?? '?'} (${topPerformer.band}).`);
  }
  return out;
};
export const IELTSAdminDashboard = (props: Props) => {
  const {
    loading,
    totalUsers = 0,
    adminCount = 0,
    teacherCount = 0,
    studentCount = 0,
    pendingModerationCount = 0,
    topPerformer = null,
    commission = { writing: 50000, speaking: 40000 },
    policy = { autoApproveThreshold: 80, autoRejectThreshold: 20, blockedWords: [], reviewSlaHours: 24 },
    auditLogs = [],
    onSaveCommission,
    onSavePolicy,
    onRefresh,
  } = props;

  const [dismissed, setDismissed] = useState<number[]>([]);
  const alerts = buildAlerts(pendingModerationCount, topPerformer).filter((_, i) => !dismissed.includes(i));
  const updatedAt = formatTime(new Date().toISOString());

  const handleNav = (href: string) => {
    if (typeof window !== 'undefined') window.location.href = href;
  };

  return <div className="min-h-screen w-full bg-gradient-to-br from-[#f1f1f6] via-[#eef2ff] to-[#f1f1f6] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        {/* Header */}
        <Card className="!p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-2xl shadow-[0_4px_0_#4338ca]">
                ⚙️
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#1e1b4b]">Bảng điều khiển Admin</h1>
                <p className="text-sm text-[#64748b] font-medium">
                  Theo dõi sức khỏe hệ thống, xử lý quản trị và áp dụng chính sách an toàn.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[#64748b] hidden sm:block">
                Cập nhật: {updatedAt}
              </span>
              <PillButton variant="ghost" size="sm" onClick={onRefresh}>
                ↻ Làm mới
              </PillButton>
            </div>
          </div>
        </Card>

        {/* Stat cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Tổng người dùng" value={fmt(totalUsers)} icon="👥" tone="indigo" footer={<>
                <Badge tone="coral">Admin {adminCount}</Badge>
                <Badge tone="cyan">GV {teacherCount}</Badge>
                <Badge tone="slate">HV {studentCount}</Badge>
              </>} />

          <StatCard label="Bài thi tháng này" value="—" icon="📝" tone="cyan" footer={<span className="text-xs font-bold text-[#64748b]">
                Band TB: <span className="text-[#10b981]">—</span>
              </span>} />

          <StatCard label="Chờ kiểm duyệt" value={fmt(pendingModerationCount)} icon="🛡️" tone="amber" footer={<span className="text-xs font-bold text-[#64748b]">
                Cần xử lý ngay
              </span>} />

          <StatCard label="Học viên top" value={topPerformer?.band?.toFixed?.(1) ?? '—'} icon="🏆" tone="purple" footer={<span className="text-xs font-bold text-[#64748b]">{topPerformer?.nameUser ?? '—'}</span>} />

        </section>

        {/* Charts + alerts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkillBreakdown />
          <Card>
            <h2 className="text-lg font-extrabold text-[#1e1b4b] mb-4">Cảnh báo vận hành</h2>
            {alerts.length === 0 ? <div className="text-center py-10">
                <div className="text-5xl mb-2">🎉</div>
                <p className="text-sm font-bold text-[#64748b]">Không có cảnh báo nào.</p>
              </div> : <ul className="space-y-3">
                {alerts.map((a, i) => <li key={i} className="flex items-start gap-2 bg-[#fff7ed] border-2 border-[#fed7aa] rounded-2xl p-3">
                      <span className="text-base mt-0.5">⚠️</span>
                      <span className="flex-1 text-xs font-semibold text-[#b45309]">{a}</span>
                      <button onClick={() => setDismissed([...dismissed, i])} className="text-[#b45309] font-black hover:scale-125 transition-transform">
                        ×
                      </button>
                    </li>)}
              </ul>}
          </Card>
        </section>

        {/* Trend + quick actions */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TrendChart />
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-extrabold text-[#1e1b4b] mb-4">Tác vụ nhanh</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_ACTIONS.map(a => <button key={a.title} onClick={() => handleNav(a.href)} className="flex items-center gap-3 text-left bg-[#f8f8fc] border-2 border-[#e6e6ed] rounded-2xl p-4 hover:border-[#6366f1] hover:-translate-y-0.5 transition-all">
                  <div className="w-11 h-11 rounded-2xl bg-white border-2 border-[#e6e6ed] flex items-center justify-center text-xl shrink-0">
                    {a.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-[#1e1b4b] text-sm">{a.title}</div>
                    <div className="text-xs text-[#64748b] font-medium truncate">{a.desc}</div>
                  </div>
                  <span className="ml-auto text-[#6366f1] font-black">→</span>
                </button>)}
            </div>
          </Card>
        </section>

        {/* Config */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ModerationPolicy initial={policy} onSave={onSavePolicy} />
          <CommissionConfig initial={commission} onSave={onSaveCommission} />
        </section>

        {/* Audit */}
        <AuditTrail logs={auditLogs} />
      </div>
    </div>;
};