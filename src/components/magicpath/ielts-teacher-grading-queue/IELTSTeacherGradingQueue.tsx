import React, { useState } from "react";
import { Card, Tag, PillButton } from "./queueUI";
import { ScoringDrawer } from "./queueScoring";
import { TICKETS, Ticket } from "./queueData";
type TabKey = "PENDING" | "CLAIMED" | "IN_PROGRESS" | "COMPLETED";
const TABS: {
  key: TabKey;
  label: string;
  icon: string;
}[] = [{
  key: "PENDING",
  label: "Tất cả",
  icon: "📥"
}, {
  key: "CLAIMED",
  label: "Đã nhận",
  icon: "📌"
}, {
  key: "IN_PROGRESS",
  label: "Đang chấm",
  icon: "✍️"
}, {
  key: "COMPLETED",
  label: "Lịch sử",
  icon: "✅"
}];
export const IELTSTeacherGradingQueue = () => {
  const [tab, setTab] = useState<TabKey>("PENDING");
  const [scoring, setScoring] = useState<Ticket | null>(null);
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("Đã nộp điểm thành công!");

  // Each tab filters by exact status (no longer collapse).
  const rows = TICKETS.filter(t => t.status === tab);
  const counts = {
    PENDING: TICKETS.filter(t => t.status === "PENDING").length,
    CLAIMED: TICKETS.filter(t => t.status === "CLAIMED").length,
    IN_PROGRESS: TICKETS.filter(t => t.status === "IN_PROGRESS").length,
    COMPLETED: TICKETS.filter(t => t.status === "COMPLETED").length
  };
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  };
  const submit = () => {
    setScoring(null);
    showToast("Đã nộp điểm thành công!");
  };
  const handleClaim = (t: Ticket) => showToast(`Đã nhận bài của ${t.student}`);
  const handleUnclaim = (t: Ticket) => showToast(`Đã trả lại bài của ${t.student}`);
  return <div className="min-h-screen w-full bg-gradient-to-br from-[#f1f1f6] via-[#eef2ff] to-[#f1f1f6] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center text-2xl shadow-[0_4px_0_#4338ca]">
              ⏱️
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1e1b4b]">
                Hàng đợi chấm bài
              </h1>
              <p className="text-sm text-[#64748b] font-medium">
                Danh sách bài Writing/Speaking cần giáo viên chấm
              </p>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-31 gap-4">
          <Summary icon="📥" label="Chờ nhận" value={counts.PENDING} tone="#f59e0b" />
          
          <Summary icon="📌" label="Đã nhận" value={counts.CLAIMED} tone="#06b6d4" />
          
          <Summary icon="✍️" label="Đang chấm" value={counts.IN_PROGRESS} tone="#a855f7" />
          
          {/* <Summary icon="💰" label="Thu nhập tháng" value={monthlyIncome} tone="#10b981" /> */}
          
        </div>

        {/* Tabs + table */}
        <Card className="p-5">
          <div className="flex gap-2 mb-4 flex-wrap">
            {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold transition-all ${tab === t.key ? "bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca]" : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"}`}>
              
                <span>{t.icon}</span>
                {t.label}
                <span className={`px-1.5 rounded-full text-[11px] ${tab === t.key ? "bg-white/25" : "bg-white"}`}>
                
                  {counts[t.key]}
                </span>
              </button>)}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wide text-[#64748b] border-b-2 border-[#e6e6ed]">
                  <th className="py-2.5 pr-3">Loại</th>
                  <th className="py-2.5 pr-3">Học viên</th>
                  <th className="py-2.5 pr-3">Bài test</th>
                  <th className="py-2.5 pr-3">Band AI</th>
                  {tab === "COMPLETED" && <th className="py-2.5 pr-3">Band GV</th>}
                  <th className="py-2.5 pr-3">Ngày</th>
                  <th className="py-2.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(t => <tr key={t.id} className="border-b border-[#f1f1f6] hover:bg-[#f8f8fc] transition-colors">
                  
                    <td className="py-3 pr-3">
                      <Tag tone={t.type === "WRITING" ? "writing" : "speaking"}>
                        {t.type === "WRITING" ? "✍️ Writing" : "🗣️ Speaking"}
                      </Tag>
                    </td>
                    <td className="py-3 pr-3 font-bold text-sm text-[#1e1b4b] whitespace-nowrap">
                      {t.student}
                    </td>
                    <td className="py-3 pr-3 text-sm text-[#64748b] font-medium">
                      {t.test}
                    </td>
                    <td className="py-3 pr-3 font-black text-[#6366f1]">
                      {t.aiBand.toFixed(1)}
                    </td>
                    {tab === "COMPLETED" && <td className="py-3 pr-3 font-black text-[#10b981]">
                        {t.teacherBand?.toFixed(1) ?? "-"}
                      </td>}
                    <td className="py-3 pr-3 text-xs text-[#64748b] font-medium whitespace-nowrap">
                      {t.date}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      {t.status === "PENDING" && <PillButton variant="primary" onClick={() => handleClaim(t)}>
                      
                          Nhận bài
                        </PillButton>}
                      {t.status === "CLAIMED" && <div className="inline-flex gap-1.5">
                          <PillButton variant="ghost" onClick={() => handleUnclaim(t)}>
                        
                            Trả lại
                          </PillButton>
                          <PillButton variant="cyan" onClick={() => setScoring(t)}>
                        
                            Bắt đầu chấm
                          </PillButton>
                        </div>}
                      {t.status === "IN_PROGRESS" && <div className="inline-flex gap-1.5">
                          <PillButton variant="ghost" onClick={() => handleUnclaim(t)}>
                        
                            Trả lại
                          </PillButton>
                          <PillButton variant="primary" onClick={() => setScoring(t)}>
                        
                            Tiếp tục chấm
                          </PillButton>
                        </div>}
                      {t.status === "COMPLETED" && <PillButton variant="ghost">Xem lại</PillButton>}
                    </td>
                  </tr>)}
                {rows.length === 0 && <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94a3b8] font-bold">
                    
                      Không có ticket nào.
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {scoring && <ScoringDrawer ticket={scoring} onClose={() => setScoring(null)} onSubmit={submit} />}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#10b981] text-white px-5 py-3 rounded-2xl font-extrabold text-sm shadow-2xl flex items-center gap-2">
          ✅ {toastMsg}
        </div>}
    </div>;
};
function Summary({
  icon,
  label,
  value,
  tone
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  tone: string;
}) {
  return <Card className="p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0" style={{
      background: `${tone}1a`
    }}>
        
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-[#1e1b4b] leading-none">
          {value}
        </div>
        <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mt-1">
          {label}
        </div>
      </div>
    </Card>;
}