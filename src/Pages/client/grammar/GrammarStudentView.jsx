import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, message } from "antd";
import { useAuth } from "@/context/authContext";
import { IELTSGrammarPage } from "@/components/magicpath/ielts-grammar-page/IELTSGrammarPage";
import {
  getGrammarCategoriesUserAPI,
  getSystemCategoriesAPI,
  getAllGrammarAPI,
  getGrammarLearningSummaryAPI,
  getGrammarLearningTopicsAPI,
} from "@/services/apiGrammar";

const TOPICS_PAGE_SIZE = 10;

// Stable icon assignment for category fall-back (since BE doesn't store icon).
const ICON_POOL = ["🕐", "🔀", "🔑", "🔄", "💬", "🔤", "📘", "📐", "✨", "📝"];
const COLOR_POOL = [
  "from-[#6366f1] to-[#a855f7]",
  "from-[#06b6d4] to-[#0891b2]",
  "from-[#fb7185] to-[#e11d48]",
  "from-[#a855f7] to-[#7e22ce]",
  "from-[#f59e0b] to-[#d97706]",
  "from-[#10b981] to-[#059669]",
];

const GrammarStudentView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [systemCategories, setSystemCategories] = useState([]);
  const [userCategories, setUserCategories] = useState([]);
  const [allGrammars, setAllGrammars] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsPage, setTopicsPage] = useState(1);

  const paginatedTopics = useMemo(() => {
    const start = (topicsPage - 1) * TOPICS_PAGE_SIZE;
    return topics.slice(start, start + TOPICS_PAGE_SIZE);
  }, [topics, topicsPage]);
  const topicsTotalPages = Math.max(
    1,
    Math.ceil(topics.length / TOPICS_PAGE_SIZE)
  );

  // Reset page when switching category
  useEffect(() => {
    setTopicsPage(1);
  }, [activeCategoryId]);

  // Load summary + categories on mount
  useEffect(() => {
    if (!user?.idUser) return;
    (async () => {
      try {
        setLoading(true);
        const [sumRes, sysRes, usrRes, allGramRes] = await Promise.allSettled([
          getGrammarLearningSummaryAPI(user.idUser),
          getSystemCategoriesAPI(),
          getGrammarCategoriesUserAPI(user.idUser),
          getAllGrammarAPI(),
        ]);
        if (sumRes.status === "fulfilled") {
          setSummary(sumRes.value?.data || sumRes.value || null);
        }
        const sys = sysRes.status === "fulfilled" ? sysRes.value?.data?.data || sysRes.value?.data || [] : [];
        const usr = usrRes.status === "fulfilled" ? usrRes.value?.data?.data || usrRes.value?.data || [] : [];
        const allGram = allGramRes.status === "fulfilled" ? allGramRes.value?.data?.data || allGramRes.value?.data || [] : [];
        setSystemCategories(Array.isArray(sys) ? sys : []);
        setUserCategories(Array.isArray(usr) ? usr : []);
        setAllGrammars(Array.isArray(allGram) ? allGram : []);

        // Pick first available category
        const firstId = (sys?.[0]?.idGrammarCategory) || (usr?.[0]?.idGrammarCategory) || null;
        if (firstId) setActiveCategoryId(firstId);
      } catch (e) {
        message.error("Không thể tải dữ liệu Grammar");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.idUser]);

  // Load topics for active category
  useEffect(() => {
    if (!user?.idUser || !activeCategoryId) return;
    (async () => {
      try {
        setTopicsLoading(true);
        const res = await getGrammarLearningTopicsAPI(user.idUser, activeCategoryId);
        setTopics(res?.data?.topics || []);
      } catch (e) {
        // category may be empty; clear list silently
        setTopics([]);
      } finally {
        setTopicsLoading(false);
      }
    })();
  }, [user?.idUser, activeCategoryId]);

  // Build the categories list for the canvas
  const categoryList = useMemo(() => {
    const sysCount = new Map();
    for (const c of systemCategories) {
      sysCount.set(c.idGrammarCategory, c.grammars?.length || 0);
    }
    const usrCount = new Map();
    for (const c of userCategories) {
      usrCount.set(c.idGrammarCategory, (c.grammars || []).length);
    }

    const merged = [
      ...systemCategories.map((c) => ({
        id: c.idGrammarCategory,
        name: c.name,
        count: sysCount.get(c.idGrammarCategory) || 0,
        done: 0, // done count needs aggregate call — keep 0 fallback
        system: true,
      })),
      ...userCategories.map((c) => ({
        id: c.idGrammarCategory,
        name: c.name,
        count: usrCount.get(c.idGrammarCategory) || 0,
        done: 0,
        system: false,
      })),
    ];

    return merged.map((c, i) => ({
      ...c,
      icon: ICON_POOL[i % ICON_POOL.length],
      color: COLOR_POOL[i % COLOR_POOL.length],
      done: summary?.weakAreas ? 0 : 0, // simple count: real "done" requires per-category aggregate
    }));
  }, [systemCategories, userCategories, summary]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (categoryList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-5xl">📚</div>
        <h2 className="text-xl font-black text-slate-800">Chưa có chủ điểm ngữ pháp</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Hệ thống chưa có chủ điểm ngữ pháp nào. Vui lòng quay lại sau hoặc liên
          hệ giáo viên/admin.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {topicsLoading && (
        <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center">
          <Spin />
        </div>
      )}
      <IELTSGrammarPage
        summary={summary}
        categories={categoryList}
        topics={topics}
        paginatedTopics={paginatedTopics}
        topicsPage={topicsPage}
        topicsTotalPages={topicsTotalPages}
        onPageChange={setTopicsPage}
        topicsPageSize={TOPICS_PAGE_SIZE}
        activeCategory={activeCategoryId}
        onSelectCategory={(id) => setActiveCategoryId(id)}
        onStartTopic={(t) => navigate(`/grammar/${t.id}`)}
        onStartPractice={() => navigate(`/grammar/practice`)}
        onStartLevelTest={() => navigate(`/grammar/practice`)}
      />
    </div>
  );
};

export default GrammarStudentView;
