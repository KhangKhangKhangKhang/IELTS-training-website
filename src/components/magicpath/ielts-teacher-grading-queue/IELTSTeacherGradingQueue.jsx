import React, { useState } from "react";
import { Card, Tag, PillButton } from "./queueUI";
import { ScoringDrawer } from "./queueScoring";

const TABS = [
  { key: "PENDING", label: "All", icon: "📥" },
  { key: "CLAIMED", label: "Claimed", icon: "📌" },
  { key: "IN_PROGRESS", label: "In Progress", icon: "✍️" },
  { key: "COMPLETED", label: "History", icon: "✅" },
];

export const IELTSTeacherGradingQueue = ({
  tickets = [],
  counts: countsProp,
  monthlyIncome = "2.4M",
  onClaim,
  onUnclaim,
  onSubmit,
  loading = false,
}) => {
  const [tab, setTab] = useState("PENDING");
  const [scoring, setScoring] = useState(null);
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("Score submitted successfully!");

  const rows = tickets.filter((t) => t.status === tab);
  const counts =
    countsProp || {
      PENDING: tickets.filter((t) => t.status === "PENDING").length,
      CLAIMED: tickets.filter((t) => t.status === "CLAIMED").length,
      IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      COMPLETED: tickets.filter((t) => t.status === "COMPLETED").length,
    };

  const showToast = (msg) => {
    setToastMsg(msg);
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  };

  const submit = async (payload) => {
    setScoring(null);
    if (onSubmit) {
      try {
        await onSubmit(payload);
        showToast("Score submitted successfully!");
      } catch (e) {
        showToast("Score submission failed");
      }
    } else {
      showToast("Score submitted successfully!");
    }
  };

  const handleClaim = async (t) => {
    if (onClaim) {
      try {
        await onClaim(t);
        showToast(`Claimed test from ${t.student}`);
      } catch (e) {
        showToast("Claim failed");
      }
    } else {
      showToast(`Claimed test from ${t.student}`);
    }
  };

  const handleUnclaim = async (t) => {
    if (onUnclaim) {
      try {
        await onUnclaim(t);
        showToast(`Returned test from ${t.student}`);
      } catch (e) {
        showToast("Return failed");
      }
    } else {
      showToast(`Returned test from ${t.student}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f1f1f6] via-[#eef2ff] to-[#f1f1f6] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center text-2xl shadow-[0_4px_0_#4338ca]">
              ⏱️
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1e1b4b]">
                Grading queue
              </h1>
              <p className="text-sm text-[#64748b] font-medium">
                List of Writing/Speaking tests waiting for teacher grading
              </p>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Summary icon="📥" label="Pending" value={counts.PENDING} tone="#f59e0b" />
          <Summary icon="📌" label="Claimed" value={counts.CLAIMED} tone="#06b6d4" />
          <Summary icon="✍️" label="In Progress" value={counts.IN_PROGRESS} tone="#a855f7" />
          {/* <Summary icon="💰" label="Monthly income" value={monthlyIncome} tone="#10b981" /> */}
        </div>

        {/* Tabs + table */}
        <Card className="p-5">
          <div className="flex gap-2 mb-4 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold transition-all ${
                  tab === t.key
                    ? "bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca]"
                    : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
                <span
                  className={`px-1.5 rounded-full text-[11px] ${
                    tab === t.key ? "bg-white/25" : "bg-white"
                  }`}
                >
                  {counts[t.key] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wide text-[#64748b] border-b-2 border-[#e6e6ed]">
                  <th className="py-2.5 pr-3">Type</th>
                  <th className="py-2.5 pr-3">Student</th>
                  <th className="py-2.5 pr-3">Test</th>
                  <th className="py-2.5 pr-3">AI Band</th>
                  {tab === "COMPLETED" && <th className="py-2.5 pr-3">Teacher Band</th>}
                  <th className="py-2.5 pr-3">Date</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[#f1f1f6] hover:bg-[#f8f8fc] transition-colors"
                  >
                    <td className="py-3 pr-3">
                      <Tag tone={t.type === "WRITING" ? "writing" : "speaking"}>
                        {t.type === "WRITING" ? "✍️ Writing" : "🗣️ Speaking"}
                      </Tag>
                    </td>
                    <td className="py-3 pr-3 font-bold text-sm text-[#1e1b4b] whitespace-nowrap">
                      {t.student}
                    </td>
                    <td className="py-3 pr-3 text-sm text-[#64748b] font-medium">{t.test}</td>
                    <td className="py-3 pr-3 font-black text-[#6366f1]">
                      {typeof t.aiBand === "number" ? t.aiBand.toFixed(1) : t.aiBand}
                    </td>
                    {tab === "COMPLETED" && (
                      <td className="py-3 pr-3 font-black text-[#10b981]">
                        {t.teacherBand != null
                          ? typeof t.teacherBand === "number"
                            ? t.teacherBand.toFixed(1)
                            : t.teacherBand
                          : "-"}
                      </td>
                    )}
                    <td className="py-3 pr-3 text-xs text-[#64748b] font-medium whitespace-nowrap">
                      {t.date}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      {t.status === "PENDING" && (
                        <PillButton variant="primary" onClick={() => handleClaim(t)}>
                          Claim
                        </PillButton>
                      )}
                      {t.status === "CLAIMED" && (
                        <div className="inline-flex gap-1.5">
                          <PillButton variant="ghost" onClick={() => handleUnclaim(t)}>
                            Return
                          </PillButton>
                          <PillButton variant="cyan" onClick={() => setScoring(t)}>
                            Start grading
                          </PillButton>
                        </div>
                      )}
                      {t.status === "IN_PROGRESS" && (
                        <div className="inline-flex gap-1.5">
                          <PillButton variant="ghost" onClick={() => handleUnclaim(t)}>
                            Return
                          </PillButton>
                          <PillButton variant="primary" onClick={() => setScoring(t)}>
                            Continue grading
                          </PillButton>
                        </div>
                      )}
                      {t.status === "COMPLETED" && (
                        <PillButton variant="ghost">Review</PillButton>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94a3b8] font-bold">
                      No tickets.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94a3b8] font-bold">
                      Loading...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {scoring && (
        <ScoringDrawer
          ticket={scoring}
          onClose={() => setScoring(null)}
          onSubmit={() => submit(scoring)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#10b981] text-white px-5 py-3 rounded-2xl font-extrabold text-sm shadow-2xl flex items-center gap-2">
          ✅ {toastMsg}
        </div>
      )}
    </div>
  );
};

function Summary({ icon, label, value, tone }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0"
        style={{ background: `${tone}1a` }}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-[#1e1b4b] leading-none">{value}</div>
        <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mt-1">
          {label}
        </div>
      </div>
    </Card>
  );
}

export default IELTSTeacherGradingQueue;
