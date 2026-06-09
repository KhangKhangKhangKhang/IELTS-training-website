import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaginationStacked } from "@/components/shared/PaginationStacked";

const SEED_CATEGORIES = [
  {
    id: "cat-1",
    name: "Tenses",
    description: "12 English tenses — usage and recognition cues.",
    count: 12,
    isSystem: true,
  },
  {
    id: "cat-2",
    name: "Conditionals",
    description: "Conditionals — 4 types and mixed conditionals.",
    count: 6,
    isSystem: true,
  },
  {
    id: "cat-3",
    name: "Modal verbs",
    description: "Modal verbs of ability, obligation, speculation.",
    count: 8,
    isSystem: true,
  },
  {
    id: "cat-4",
    name: "Passive voice",
    description: "Passive voice in academic and conversational English.",
    count: 5,
    isSystem: true,
  },
  {
    id: "cat-5",
    name: "Reported speech",
    description: "Reported speech — backshift, pronouns, time markers.",
    count: 7,
    isSystem: false,
    ownerName: "Ms. Mai",
  },
  {
    id: "cat-6",
    name: "Articles & determiners",
    description: "Articles a/an/the and other determiners.",
    count: 9,
    isSystem: true,
  },
];

const SEED_GRAMMARS = [
  {
    id: "g-1",
    title: "Present perfect vs. past simple",
    level: "Mid",
    categories: ["cat-1", "cat-2"],
    exerciseCount: 18,
    description: "Distinguish 2 tenses when talking about past actions with present relevance.",
  },
  {
    id: "g-2",
    title: "First & second conditional",
    level: "Mid",
    categories: ["cat-2"],
    exerciseCount: 15,
    description: "Type 1 and 2 conditionals — when to use which, common mistakes.",
  },
  {
    id: "g-3",
    title: "Third & mixed conditionals",
    level: "High",
    categories: ["cat-2"],
    exerciseCount: 20,
    description: "Type 3 and mixed — describing hypothetical past and present.",
  },
  {
    id: "g-4",
    title: "Modal verbs of speculation",
    level: "High",
    categories: ["cat-3"],
    exerciseCount: 22,
    description: "must / might / could / can't for speculating about past and present.",
  },
  {
    id: "g-5",
    title: "Passive voice in academic writing",
    level: "Great",
    categories: ["cat-4"],
    exerciseCount: 24,
    description: "When to use passive, advanced structures for Writing Task 1.",
  },
  {
    id: "g-6",
    title: "Reported speech with backshift",
    level: "High",
    categories: ["cat-5"],
    exerciseCount: 20,
    description: "Reporting speech — tense shift, pronouns, time markers.",
  },
  {
    id: "g-7",
    title: "A, an, the — basic articles",
    level: "Low",
    categories: ["cat-6"],
    exerciseCount: 14,
    description: "Rules for using articles a, an, the in simple sentences.",
  },
];

const LEVEL_META = {
  Low: { label: "Basic", tone: "bg-[#d1fae5] text-[#047857]", cefr: "A2-B1" },
  Mid: { label: "Medium", tone: "bg-[#cffafe] text-[#0e7490]", cefr: "B1-B2" },
  High: { label: "Cao", tone: "bg-[#fef3c7] text-[#b45309]", cefr: "B2-C1" },
  Great: { label: "Expert", tone: "bg-[#fff1f2] text-[#e11d48]", cefr: "C1-C2" },
};

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] ${className}`}
    >
      {children}
    </div>
  );
}

function StackedButton({
  children,
  tone = "indigo",
  size = "md",
  className = "",
  onClick,
}) {
  const styles = {
    indigo:
      "bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca] hover:brightness-110",
    coral:
      "bg-[#fb7185] text-white shadow-[0_3px_0_#e11d48] hover:brightness-110",
    cyan: "bg-[#06b6d4] text-white shadow-[0_3px_0_#0891b2] hover:brightness-110",
    amber:
      "bg-[#f59e0b] text-white shadow-[0_3px_0_#b45309] hover:brightness-110",
    emerald:
      "bg-[#10b981] text-white shadow-[0_3px_0_#047857] hover:brightness-110",
    rose: "bg-[#ef4444] text-white shadow-[0_3px_0_#b91c1c] hover:brightness-110",
    ghost:
      "bg-white text-[#64748b] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#6366f1] hover:text-[#6366f1]",
  };
  const sz =
    size === "sm"
      ? "px-3 py-1.5 text-xs"
      : size === "lg"
      ? "px-5 py-2.5 text-sm"
      : "px-4 py-2 text-xs";
  return (
    <button
      onClick={onClick}
      className={`${styles[tone] || styles.indigo} ${sz} font-extrabold uppercase tracking-wide rounded-2xl active:translate-y-[1px] active:shadow-[0_1px_0] transition-all ${className}`}
    >
      {children}
    </button>
  );
}

function StatCard({ icon, label, value, tone = "indigo" }) {
  const toneMap = {
    indigo: "bg-[#eef2ff] text-[#4338ca]",
    emerald: "bg-[#d1fae5] text-[#047857]",
    amber: "bg-[#fef3c7] text-[#b45309]",
    coral: "bg-[#fff1f2] text-[#e11d48]",
  };
  return (
    <Card className="p-4 flex items-center gap-3">
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
          toneMap[tone] || toneMap.indigo
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-[#1e1b4b] leading-none">
          {value}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] mt-1">
          {label}
        </div>
      </div>
    </Card>
  );
}

function CategoryRow({ c, onEdit, onDelete }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="group flex items-center gap-4 p-4 rounded-2xl border-2 border-[#e6e6ed] hover:border-[#6366f1] hover:bg-[#f8f8fc] transition-all"
    >
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white flex items-center justify-center text-lg shrink-0 shadow-[0_2px_0_#4338ca]">
        {c.isSystem ? "🌐" : "📁"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-extrabold text-[#1e1b4b] truncate">{c.name}</h3>
          {c.isSystem ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f1f6] text-[#64748b]">
              SYSTEM
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eef2ff] text-[#4338ca]">
              {c.ownerName || "MINE"}
            </span>
          )}
        </div>
        <p className="text-xs text-[#64748b] mt-0.5 line-clamp-1">
          {c.description}
        </p>
      </div>
      <div className="text-xs font-extrabold text-[#64748b] bg-[#f1f1f6] px-2.5 py-1 rounded-lg shrink-0">
        {c.count} points
      </div>
      <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-xl bg-white border-2 border-[#e6e6ed] hover:border-[#6366f1] hover:text-[#6366f1] text-[#64748b] flex items-center justify-center text-sm transition-all"
          title="Edit"
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-xl bg-white border-2 border-[#e6e6ed] hover:border-[#ef4444] hover:text-[#ef4444] text-[#64748b] flex items-center justify-center text-sm transition-all"
          title="Delete"
        >
          🗑
        </button>
      </div>
    </motion.div>
  );
}

function GrammarRow({ g, catMap, onEdit, onDelete, onAssign }) {
  const lvl = LEVEL_META[g.level];
  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="group flex items-start gap-4 p-4 rounded-2xl border-2 border-[#e6e6ed] hover:border-[#6366f1] hover:bg-[#f8f8fc] transition-all"
    >
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#a855f7] to-[#6366f1] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-[0_2px_0_#7e22ce]">
        #{g.id.slice(-2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-extrabold text-[#1e1b4b]">{g.title}</h3>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${lvl.tone}`}
          >
            {lvl.label} · {lvl.cefr}
          </span>
        </div>
        <p className="text-xs text-[#64748b] mt-1 line-clamp-1">
          {g.description}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {g.categories.map((cid) => {
            const cat = catMap[cid];
            return cat ? (
              <span
                key={cid}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#eef2ff] text-[#4338ca]"
              >
                📂 {cat.name}
              </span>
            ) : null;
          })}
          <span className="text-[10px] font-bold text-[#64748b]">
            · {g.exerciseCount} exercises
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onAssign}
          className="px-2.5 py-1 rounded-xl bg-white border-2 border-[#e6e6ed] hover:border-[#6366f1] hover:text-[#6366f1] text-[#64748b] text-[11px] font-extrabold transition-all"
          title="Assign to category"
        >
          + Assign
        </button>
        <div className="flex gap-1.5">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-xl bg-white border-2 border-[#e6e6ed] hover:border-[#6366f1] hover:text-[#6366f1] text-[#64748b] flex items-center justify-center text-sm transition-all"
            title="Edit"
          >
            ✎
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-xl bg-white border-2 border-[#e6e6ed] hover:border-[#ef4444] hover:text-[#ef4444] text-[#64748b] flex items-center justify-center text-sm transition-all"
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ModalShell({ open, onClose, title, children, tone = "indigo" }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg shadow-[0_2px_0] ${
                    tone === "rose"
                      ? "bg-[#ef4444] shadow-[#b91c1c]"
                      : "bg-[#6366f1] shadow-[#4338ca]"
                  }`}
                >
                  {tone === "rose" ? "🗑" : "✎"}
                </div>
                <h2 className="text-lg font-black text-[#1e1b4b]">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl hover:bg-[#f1f1f6] text-[#64748b] font-black"
              >
                ×
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const IELTSGrammarManagement = ({
  externalCategories,
  externalGrammars,
  onSaveGrammar,
  onDeleteGrammar,
  onSaveCategory,
  onDeleteCategory,
  onAssignGrammar,
  onCreateNew,
}) => {
  const [tab, setTab] = useState("grammars");
  const [categories, setCategories] = useState(
    externalCategories || SEED_CATEGORIES
  );
  const [grammars, setGrammars] = useState(externalGrammars || SEED_GRAMMARS);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [editCategory, setEditCategory] = useState(null);
  const [editGrammar, setEditGrammar] = useState(null);
  const [assignGrammar, setAssignGrammar] = useState(null);

  // Re-sync local state when external data changes
  useEffect(() => {
    if (externalCategories) setCategories(externalCategories);
  }, [externalCategories]);
  useEffect(() => {
    if (externalGrammars) setGrammars(externalGrammars);
  }, [externalGrammars]);

  const handleSaveGrammar = (g) => {
    if (onSaveGrammar) onSaveGrammar(g);
    else setGrammars((p) => p.map((x) => (x.id === g.id ? g : x)));
    setEditGrammar(null);
  };
  const handleDeleteGrammar = (g) => {
    if (onDeleteGrammar) onDeleteGrammar(g);
    else setGrammars((p) => p.filter((x) => x.id !== g.id));
  };
  const handleSaveCategory = (c) => {
    if (onSaveCategory) onSaveCategory(c);
    else setCategories((p) => p.map((x) => (x.id === c.id ? c : x)));
    setEditCategory(null);
  };
  const handleDeleteCategory = (c) => {
    if (onDeleteCategory) onDeleteCategory(c);
    else setCategories((p) => p.filter((x) => x.id !== c.id));
  };
  const handleAssignGrammar = (g, nextCategories) => {
    if (onAssignGrammar) onAssignGrammar(g, nextCategories);
    else setGrammars((p) => p.map((x) => (x.id === g.id ? { ...x, categories: nextCategories } : x)));
    setAssignGrammar(null);
  };

  const catMap = categories.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {});

  const filteredGrammars = grammars.filter((g) => {
    const matchSearch =
      !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === "all" || g.level === levelFilter;
    return matchSearch && matchLevel;
  });

  const filteredCategories = categories.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  // Client-side pagination (10 per page). Reset to page 1 when tab/search/filter
  // changes so the user doesn't land on an empty page.
  const PAGE_SIZE = 10;
  const [grammarPage, setGrammarPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);

  useEffect(() => {
    setGrammarPage(1);
  }, [search, levelFilter, tab]);
  useEffect(() => {
    setCategoryPage(1);
  }, [search, tab]);

  const paginatedGrammars = useMemo(() => {
    const start = (grammarPage - 1) * PAGE_SIZE;
    return filteredGrammars.slice(start, start + PAGE_SIZE);
  }, [filteredGrammars, grammarPage]);

  const paginatedCategories = useMemo(() => {
    const start = (categoryPage - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [filteredCategories, categoryPage]);

  const grammarTotalPages = Math.max(
    1,
    Math.ceil(filteredGrammars.length / PAGE_SIZE)
  );
  const categoryTotalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / PAGE_SIZE)
  );

  const stats = {
    total: grammars.length,
    low: grammars.filter((g) => g.level === "Low").length,
    mid: grammars.filter((g) => g.level === "Mid").length,
    high: grammars.filter(
      (g) => g.level === "High" || g.level === "Great"
    ).length,
    totalCats: categories.length,
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f1f1f6] via-[#eef2ff] to-[#f1f1f6] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#fb7185] flex items-center justify-center text-2xl shadow-[0_4px_0_#4338ca]">
              🛠️
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-[#1e1b4b]">
                Grammar Management
              </h1>
              <p className="text-sm text-[#64748b] font-medium">
                Create and manage IELTS grammar topics & points for the system
              </p>
            </div>
            <StackedButton tone="indigo" size="lg" onClick={onCreateNew}>
              + New
            </StackedButton>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon="📚"
            label="Total"
            value={stats.total}
            tone="indigo"
          />
          <StatCard icon="🌱" label="Basic" value={stats.low} tone="emerald" />
          <StatCard
            icon="🌿"
            label="Medium"
            value={stats.mid}
            tone="amber"
          />
          <StatCard
            icon="🔥"
            label="High + Expert"
            value={stats.high}
            tone="coral"
          />
        </div>

        {/* Tabs + Toolbar */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-[#e6e6ed]">
            <button
              onClick={() => setTab("grammars")}
              className={`px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide border-b-4 transition-all ${
                tab === "grammars"
                  ? "border-[#6366f1] text-[#4338ca]"
                  : "border-transparent text-[#64748b] hover:text-[#1e1b4b]"
              }`}
            >
              📝 Grammars
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-[#eef2ff] text-[#4338ca]">
                {grammars.length}
              </span>
            </button>
            <button
              onClick={() => setTab("categories")}
              className={`px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide border-b-4 transition-all ${
                tab === "categories"
                  ? "border-[#6366f1] text-[#4338ca]"
                  : "border-transparent text-[#64748b] hover:text-[#1e1b4b]"
              }`}
            >
              📂 Categories
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-[#f1f1f6] text-[#64748b]">
                {categories.length}
              </span>
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === "grammars"
                    ? "Search by title or description..."
                    : "Search by name or category description..."
                }
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl border-2 border-[#e6e6ed] text-sm font-medium focus:border-[#6366f1] outline-none"
              />
            </div>
            {tab === "grammars" && (
              <div className="flex gap-1.5 flex-wrap">
                {["all", "Low", "Mid", "High", "Great"].map((lv) => (
                  <button
                    key={lv}
                    onClick={() => setLevelFilter(lv)}
                    className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                      levelFilter === lv
                        ? "bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]"
                        : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"
                    }`}
                  >
                    {lv === "all" ? "All" : LEVEL_META[lv].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <div className="space-y-3">
            {tab === "grammars" ? (
              paginatedGrammars.length ? (
                paginatedGrammars.map((g) => (
                  <GrammarRow
                    key={g.id}
                    g={g}
                    catMap={catMap}
                    onEdit={() => setEditGrammar(g)}
                    onDelete={() => {
                      if (window.confirm(`Delete "${g.title}"?`))
                        handleDeleteGrammar(g);
                    }}
                    onAssign={() => setAssignGrammar(g)}
                  />
                ))
              ) : (
                <div className="py-12 text-center text-[#94a3b8] font-bold">
                  No matching grammars.
                </div>
              )
            ) : paginatedCategories.length ? (
              paginatedCategories.map((c) => (
                <CategoryRow
                  key={c.id}
                  c={c}
                  onEdit={() => setEditCategory(c)}
                  onDelete={() => {
                    if (
                      window.confirm(
                        `Delete category "${c.name}"? All grammars inside will be affected.`
                      )
                    )
                      handleDeleteCategory(c);
                  }}
                />
              ))
            ) : (
              <div className="py-12 text-center text-[#94a3b8] font-bold">
                No categories yet.
              </div>
            )}
          </div>

          {/* Pagination */}
          {tab === "grammars" ? (
            <PaginationStacked
              page={grammarPage}
              totalPages={grammarTotalPages}
              onChange={setGrammarPage}
              total={filteredGrammars.length}
              pageSize={PAGE_SIZE}
            />
          ) : (
            <PaginationStacked
              page={categoryPage}
              totalPages={categoryTotalPages}
              onChange={setCategoryPage}
              total={filteredCategories.length}
              pageSize={PAGE_SIZE}
            />
          )}
        </Card>
      </div>

      {/* Edit grammar modal */}
      <ModalShell
        open={!!editGrammar}
        onClose={() => setEditGrammar(null)}
        title="Edit grammar"
      >
        {editGrammar && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
                Title
              </label>
              <input
                value={editGrammar.title}
                onChange={(e) =>
                  setEditGrammar({ ...editGrammar, title: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm focus:border-[#6366f1] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
                Description
              </label>
              <textarea
                rows={3}
                value={editGrammar.description}
                onChange={(e) =>
                  setEditGrammar({
                    ...editGrammar,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm focus:border-[#6366f1] outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
                Level
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {["Low", "Mid", "High", "Great"].map((lv) => (
                  <button
                    key={lv}
                    onClick={() => setEditGrammar({ ...editGrammar, level: lv })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                      editGrammar.level === lv
                        ? "bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]"
                        : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"
                    }`}
                  >
                    {LEVEL_META[lv].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <StackedButton tone="ghost" onClick={() => setEditGrammar(null)}>
                Cancel
              </StackedButton>
              <StackedButton tone="indigo" onClick={() => handleSaveGrammar(editGrammar)}>
                Save changes
              </StackedButton>
            </div>
          </div>
        )}
      </ModalShell>

      {/* Edit category modal */}
      <ModalShell
        open={!!editCategory}
        onClose={() => setEditCategory(null)}
        title="Edit category"
      >
        {editCategory && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
                Category name
              </label>
              <input
                value={editCategory.name}
                onChange={(e) =>
                  setEditCategory({ ...editCategory, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm focus:border-[#6366f1] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
                Description
              </label>
              <textarea
                rows={3}
                value={editCategory.description}
                onChange={(e) =>
                  setEditCategory({
                    ...editCategory,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm focus:border-[#6366f1] outline-none resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <StackedButton tone="ghost" onClick={() => setEditCategory(null)}>
                Cancel
              </StackedButton>
              <StackedButton tone="indigo" onClick={() => handleSaveCategory(editCategory)}>
                Save changes
              </StackedButton>
            </div>
          </div>
        )}
      </ModalShell>

      {/* Assign category modal */}
      <ModalShell
        open={!!assignGrammar}
        onClose={() => setAssignGrammar(null)}
        title="Assign to category"
      >
        {assignGrammar && (
          <div className="space-y-3">
            <p className="text-xs text-[#64748b]">
              Choose categories for{" "}
              <span className="font-extrabold text-[#1e1b4b]">
                "{assignGrammar.title}"
              </span>
              :
            </p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {categories.map((c) => {
                const checked = assignGrammar.categories.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      checked
                        ? "border-[#6366f1] bg-[#eef2ff]"
                        : "border-[#e6e6ed] hover:border-[#c7d2fe]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? assignGrammar.categories.filter((x) => x !== c.id)
                          : [...assignGrammar.categories, c.id];
                        setAssignGrammar({
                          ...assignGrammar,
                          categories: next,
                        });
                      }}
                      className="w-4 h-4 accent-[#6366f1]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#1e1b4b]">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-[#64748b]">
                        {c.isSystem ? "System" : c.ownerName || "Mine"} ·{" "}
                        {c.count} points
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <StackedButton tone="ghost" onClick={() => setAssignGrammar(null)}>
                Cancel
              </StackedButton>
              <StackedButton
                tone="emerald"
                onClick={() =>
                  handleAssignGrammar(assignGrammar, assignGrammar.categories)
                }
              >
                Save assignment
              </StackedButton>
            </div>
          </div>
        )}
      </ModalShell>
    </div>
  );
};

export default IELTSGrammarManagement;
