// Pages/teacher/test/testManager.jsx
// UI adapted from MagicPath "IELTS Test Manager".
// Strategy: keep the original BE endpoints + state flow intact.
// `attempts` and `avgBand` are now computed by the BE on read via Prisma
// _count + groupBy on UserTestResult (no DB schema change).
// Dropped canvas fields the DB does not provide: status, collection.
// TODO (BE): add `status` enum + `collection` + bulk-publish/archive + duplicate
//   to fully match the canvas.
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Spin, message } from "antd";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { getAPITest, deleteAPITest } from "@/services/apiTest";
import StackedButton from "@/components/ui/StackedButton";

/* -------- Skill meta (canvas colors) -------- */
const SKILL_META = {
  READING: {
    label: "Reading",
    icon: "📖",
    color: "bg-[#6366f1]",
    tone: "bg-[#eef2ff] text-[#4338ca]",
  },
  LISTENING: {
    label: "Listening",
    icon: "🎧",
    color: "bg-[#06b6d4]",
    tone: "bg-[#cffafe] text-[#0e7490]",
  },
  WRITING: {
    label: "Writing",
    icon: "✍️",
    color: "bg-[#fb7185]",
    tone: "bg-[#fff1f2] text-[#e11d48]",
  },
  SPEAKING: {
    label: "Speaking",
    icon: "🎤",
    color: "bg-[#a855f7]",
    tone: "bg-[#f3e8ff] text-[#7e22ce]",
  },
};

const LEVEL_TONE = {
  Low: "bg-[#d1fae5] text-[#047857]",
  Mid: "bg-[#cffafe] text-[#0e7490]",
  High: "bg-[#fef3c7] text-[#b45309]",
  Great: "bg-[#f3e8ff] text-[#7e22ce]",
};

const SKILL_OPTIONS = ["ALL", "READING", "LISTENING", "WRITING", "SPEAKING"];
const LEVEL_OPTIONS = ["ALL", "Low", "Mid", "High", "Great"];

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
};

const formatRelative = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const day = 86400000;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} days ago`;
  return formatDate(iso);
};

const TestManager = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [selected, setSelected] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const PAGE_SIZE =8;
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteMode, setDeleteMode] = useState("single"); // "single" | "bulk"
  const [targetExam, setTargetExam] = useState(null);
  const navigate = useNavigate();

  /* ---- fetch ---- */
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await getAPITest();
      setExams(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Data loading error:", error);
      message.error("Failed to load test list");
    } finally {
      setLoading(false);
    }
  };

  /* ---- filter ---- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exams.filter((e) => {
      if (skill !== "ALL" && e.testType !== skill) return false;
      if (level !== "ALL" && e.level !== level) return false;
      if (!q) return true;
      const title = (e.title || "").toLowerCase();
      const desc = (e.description || "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [exams, search, skill, level]);

  /* ---- pagination ---- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Reset page if filter shrinks the list below current page
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    // If filters/search change and we are now past the last page, snap back
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  /* ---- selection ---- */
  const allSelected =
    filtered.length > 0 && filtered.every((e) => selected.has(e.idTest));
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.idTest)));
    }
  };
  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ---- stats ---- */
  const stats = useMemo(() => {
    const total = exams.length;
    const bySkill = SKILL_OPTIONS.filter((s) => s !== "ALL").map((s) => ({
      skill: s,
      count: exams.filter((e) => e.testType === s).length,
    }));
    const totalAttempts = exams.reduce(
      (sum, e) => sum + (Number(e.attempts) || 0),
      0
    );
    const totalQuestions = exams.reduce(
      (sum, e) => sum + (Number(e.numberQuestion) || 0),
      0
    );
    // average of (avgBand) over tests that have at least 1 attempt
    const scorable = exams.filter(
      (e) => typeof e.avgBand === "number" && e.avgBand > 0
    );
    const overallAvgBand =
      scorable.length > 0
        ? scorable.reduce((s, e) => s + e.avgBand, 0) / scorable.length
        : null;
    return {
      total,
      bySkill,
      totalAttempts,
      totalQuestions,
      overallAvgBand,
    };
  }, [exams]);

  /* ---- actions ---- */
  const handleCreate = () => navigate("./testCreate");
  const handleEdit = (exam) =>
    navigate(`./testEdit/${exam.idTest}`, { state: { exam } });

  const handleDeleteClick = (exam) => {
    setDeleteMode("single");
    setTargetExam(exam);
    setDeleteModalVisible(true);
  };

  const handleBulkDeleteClick = () => {
    if (selected.size === 0) return;
    setDeleteMode("bulk");
    setTargetExam(null);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteMode === "single" && targetExam) {
        await deleteAPITest(targetExam.idTest);
        message.success("Test deleted successfully");
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(targetExam.idTest);
          return next;
        });
      } else {
        // bulk: delete sequentially to keep server load predictable
        const ids = Array.from(selected);
        let ok = 0;
        for (const id of ids) {
          try {
            await deleteAPITest(id);
            ok += 1;
          } catch (e) {
            console.error("Delete error", id, e);
          }
        }
        message.success(`Deleted ${ok}/${ids.length} tests`);
        setSelected(new Set());
      }
      fetchExams();
    } catch (error) {
      console.error("Error deleting test:", error);
      message.error("Error deleting test");
    } finally {
      setDeleteModalVisible(false);
      setTargetExam(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fafafc] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top bar */}
        <header className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] px-5 py-4 flex items-center gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
              Test Manager
            </div>
            <h1
              className="text-2xl font-black text-[#1e1b4b] truncate"
              style={{ fontFamily: "Nunito" }}
            >
              {stats.total} tests by you
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <StackedButton tone="ghost" size="md" onClick={fetchExams}>
              ↻ Refresh
            </StackedButton>
            <StackedButton tone="indigo" size="md" onClick={handleCreate}>
              + Create new test
            </StackedButton>
          </div>
        </header>

        {/* Stats strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon="📝"
            value={stats.total}
            label="Total tests"
            color="bg-[#6366f1]"
          />
          <StatCard
            icon="📊"
            value={stats.totalAttempts.toLocaleString("vi-VN")}
            label="Attempts"
            color="bg-[#fb7185]"
          />
          <StatCard
            icon="⭐"
            value={
              stats.overallAvgBand !== null
                ? stats.overallAvgBand.toFixed(1)
                : "—"
            }
            label="Average Band"
            color="bg-[#10b981]"
          />
          <StatCard
            icon="❓"
            value={stats.totalQuestions}
            label="Total questions"
            color="bg-[#06b6d4]"
          />
        </section>

        {/* Filter bar */}
        <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find test name, description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-[#e6e6ed] bg-[#fafafc] focus:bg-white focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.15)] font-semibold text-sm outline-none transition-all"
            />
          </div>

          <ChipGroup
            label="Skill:"
            options={SKILL_OPTIONS}
            value={skill}
            onChange={setSkill}
            renderOption={(s) =>
              s === "ALL" ? "All" : SKILL_META[s]?.icon || s
            }
            getAria={(s) => `Filter theo skill ${s}`}
          />
          <ChipGroup
            label="Level:"
            options={LEVEL_OPTIONS}
            value={level}
            onChange={setLevel}
            renderOption={(s) => (s === "ALL" ? "All" : s)}
            getAria={(s) => `Filter theo level ${s}`}
          />
        </section>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white rounded-2xl shadow-[0_3px_0_#4338ca] p-3 px-5 flex items-center gap-3 flex-wrap"
          >
            <span className="text-lg">✓</span>
            <span className="font-extrabold text-sm">
              {selected.size} tests selected
            </span>
            <div className="ml-auto flex items-center gap-2 text-xs">
              <button
                onClick={() => setSelected(new Set())}
                className="bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-1.5 rounded-xl font-extrabold uppercase tracking-wide"
              >
                Deselect
              </button>
              <button
                onClick={handleBulkDeleteClick}
                className="bg-[#fb7185] hover:brightness-110 px-3 py-1.5 rounded-xl font-extrabold uppercase tracking-wide shadow-[0_2px_0_#e11d48]"
              >
                🗑 Delete {selected.size} tests
              </button>
            </div>
          </motion.section>
        )}

        {/* Table */}
        <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spin size="large" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[#64748b] font-semibold">
              No matching tests found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="bg-[#fafafc] border-b-2 border-[#e6e6ed]">
                    <th className="w-12 p-3">
                      <CheckBox
                        checked={allSelected}
                        onChange={toggleAll}
                        ariaLabel="Select all"
                      />
                    </th>
                    <th className="text-left text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] py-3 px-3">
                      Test name
                    </th>
                    <th className="text-center text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] py-3 px-3 hidden md:table-cell w-28">
                      Skill
                    </th>
                    <th className="text-center text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] py-3 px-3 hidden lg:table-cell w-20">
                      Level
                    </th>
                    <th className="text-center text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] py-3 px-3 hidden lg:table-cell w-24">
                      Questions
                    </th>
                    <th className="text-center text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] py-3 px-3 hidden xl:table-cell w-24">
                      Attempts
                    </th>
                    <th className="text-center text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] py-3 px-3 hidden xl:table-cell w-24">
                      Band TB
                    </th>
                    <th className="text-center text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] py-3 px-3 hidden md:table-cell w-32">
                      Update
                    </th>
                    <th className="w-28 p-3 text-right text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((exam) => {
                    const isSel = selected.has(exam.idTest);
                    const sk =
                      SKILL_META[exam.testType] || SKILL_META.READING;
                    const lvTone =
                      LEVEL_TONE[exam.level] || "bg-[#f1f1f6] text-[#64748b]";
                    return (
                      <tr
                        key={exam.idTest}
                        className={`border-b border-[#f1f1f6] hover:bg-[#fafafc] transition-colors ${
                          isSel ? "bg-[#eef2ff]/50" : ""
                        }`}
                      >
                        <td className="p-3">
                          <CheckBox
                            checked={isSel}
                            onChange={() => toggleOne(exam.idTest)}
                            ariaLabel={`Select test ${exam.title}`}
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-2xl ${sk.color} text-white shadow-[0_2px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-base flex-none`}
                            >
                              {sk.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-[#1e1b4b] text-sm truncate max-w-[280px]">
                                {exam.title}
                              </div>
                              {exam.description && (
                                <div className="text-[10px] text-[#64748b] truncate max-w-[280px]">
                                  {exam.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center hidden md:table-cell">
                          <span
                            className={`inline-block text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${sk.tone}`}
                          >
                            {sk.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center hidden lg:table-cell">
                          <span
                            className={`inline-block text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${lvTone}`}
                          >
                            {exam.level || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-sm font-extrabold text-[#1e1b4b] tabular-nums hidden lg:table-cell">
                          {exam.numberQuestion ?? "—"}
                        </td>
                        <td className="py-3 px-3 text-center text-sm font-extrabold text-[#1e1b4b] tabular-nums hidden xl:table-cell">
                          {Number.isFinite(exam.attempts) &&
                          exam.attempts > 0
                            ? exam.attempts.toLocaleString("vi-VN")
                            : "—"}
                        </td>
                        <td className="py-3 px-3 text-center hidden xl:table-cell">
                          <span className="inline-flex items-center justify-center min-w-[3rem] h-6">
                            {typeof exam.avgBand === "number" &&
                            exam.avgBand > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#eef2ff] text-[#4338ca] font-extrabold text-xs tabular-nums">
                                {exam.avgBand.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-[#94a3b8] text-xs">—</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-xs text-[#64748b] hidden md:table-cell">
                          {formatRelative(exam.updatedAt || exam.createdAt)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <IconAction
                              label="Edit"
                              onClick={() => handleEdit(exam)}
                              tone="indigo"
                            >
                              ✎
                            </IconAction>
                            <IconAction
                              label="Delete"
                              onClick={() => handleDeleteClick(exam)}
                              tone="coral"
                            >
                              🗑
                            </IconAction>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t-2 border-[#e6e6ed] bg-[#fafafc] text-xs flex-wrap gap-2">
              <span className="font-bold text-[#64748b]">
                Show{" "}
                <span className="tabular-nums">
                  {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                / {filtered.length} tests
              </span>
              <Pagination
                current={safePage}
                totalPages={totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </section>
      </div>

      <Modal
        title="Confirm delete"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
      >
        {deleteMode === "single" ? (
          <p>
            Are you sure you want to delete the test{" "}
            <strong>"{targetExam?.title}"</strong>?
          </p>
        ) : (
          <p>
            You are about to delete <strong>{selected.size}</strong> selected tests.
          </p>
        )}
        <p className="text-red-500 mt-2">This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

/* --------------------------- Sub-components --------------------------- */
const StatCard = ({ icon, value, label, color }) => (
  <div className="bg-white rounded-2xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4 flex items-center gap-3">
    <div
      className={`w-10 h-10 rounded-xl ${color} text-white shadow-[0_2px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-base flex-none`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div
        className="text-2xl font-black text-[#1e1b4b] truncate"
        style={{ fontFamily: "Nunito" }}
      >
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] truncate">
        {label}
      </div>
    </div>
  </div>
);

const CheckBox = ({ checked, onChange, ariaLabel }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={onChange}
    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black transition-all ${
      checked
        ? "bg-[#6366f1] text-white"
        : "bg-white border-2 border-[#e6e6ed] hover:border-[#6366f1]"
    }`}
  >
    {checked ? "✓" : ""}
  </button>
);

const ChipGroup = ({ label, options, value, onChange, renderOption }) => (
  <div className="flex items-center gap-2 flex-wrap">
    <span className="text-xs font-bold text-[#64748b]">{label}</span>
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border-2 ${
          value === opt
            ? "bg-[#6366f1] text-white border-[#4338ca] shadow-[0_2px_0_#4338ca]"
            : "bg-white text-[#64748b] border-[#e6e6ed] shadow-[0_1px_0_#e6e6ed] hover:border-[#6366f1]"
        }`}
      >
        {renderOption(opt)}
      </button>
    ))}
  </div>
);

const IconAction = ({ children, label, onClick, tone = "indigo" }) => {
  const tones = {
    indigo:
      "bg-[#eef2ff] text-[#4338ca] hover:bg-[#6366f1] hover:text-white",
    coral:
      "bg-[#fff1f2] text-[#e11d48] hover:bg-[#fb7185] hover:text-white",
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all ${tones[tone]}`}
    >
      {children}
    </button>
  );
};

const Pagination = ({ current, totalPages, onChange }) => {
  if (totalPages <= 1) {
    return <span className="text-[#94a3b8]">Page 1 / 1</span>;
  }

  // Build page list with ellipsis. Show first, last, current ±1, and "..." for gaps.
  const pages = [];
  const add = (p) => pages.push(p);
  const window = 1; // pages around current

  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= current - window && p <= current + window)
    ) {
      add(p);
    } else if (pages[pages.length - 1] !== "…") {
      add("…");
    }
  }

  const baseBtn =
    "min-w-[2rem] h-8 rounded-lg text-xs font-extrabold flex items-center justify-center transition-all px-2";
  const activeBtn =
    "bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]";
  const idleBtn =
    "bg-white text-[#64748b] border-2 border-[#e6e6ed] hover:border-[#6366f1]";

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className={`${baseBtn} ${idleBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Previous page"
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`e-${i}`}
            className="px-1 text-[#94a3b8] font-bold"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === current ? "page" : undefined}
            className={`${baseBtn} ${p === current ? activeBtn : idleBtn}`}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === totalPages}
        className={`${baseBtn} ${idleBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Page sau"
      >
        ›
      </button>
    </nav>
  );
};

export default TestManager;
