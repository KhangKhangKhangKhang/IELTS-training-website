import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Spin } from "antd";
import { EditorSidebar } from "./editorSidebar";
import { EditorHeader } from "./editorHeader";
import { EditorRail } from "./editorRail";
import { QuestionGroups } from "./editorReadingListening";
import { PassageEditor } from "./editorPassage";
import { WritingEditor } from "./editorWriting";
import { SpeakingEditor } from "./editorSpeaking";
import { PartsProvider } from "./partsContext";
import {
  getAllPartByIdAPI,
  getPartByIdAPI,
  createPartAPI,
} from "@/services/apiTest";
import TestInfoEditor from "@/components/test/teacher/TestInfoEditor";

const SKILL_FROM_TYPE = {
  READING: "READING",
  LISTENING: "LISTENING",
  WRITING: "WRITING",
  SPEAKING: "SPEAKING",
};

export const IELTSTestEditor = ({
  idTest,
  exam,
  onExamUpdate,
  onImportPdf,
  onPreview,
  onPublish,
}) => {
  const initialSkill = SKILL_FROM_TYPE[exam?.testType] || "READING";
  const [skill, setSkill] = useState(initialSkill);
  const [tab, setTab] = useState("questions");
  const [sidebarState, setSidebarState] = useState({
    parts: [],
    activePartId: null,
    groupCount: 0,
  });

  // Shared part list state — only relevant for READING / LISTENING.
  const [parts, setParts] = useState([]);
  const [activePartId, setActivePartId] = useState(null);
  const [partsLoading, setPartsLoading] = useState(false);

  const refreshParts = useCallback(async () => {
    if (!idTest) return [];
    try {
      setPartsLoading(true);
      const res = await getAllPartByIdAPI(idTest);
      const arr = res?.data || [];
      setParts(arr);
      // Don't auto-shift activePartId here; only set if none selected.
      if (!activePartId && arr.length > 0) {
        setActivePartId(arr[0].idPart);
      }
      return arr;
    } catch (e) {
      console.error(e);
      return [];
    } finally {
      setPartsLoading(false);
    }
  }, [idTest, activePartId]);

  // Initial load when entering the editor
  useEffect(() => {
    if (!idTest) return;
    refreshParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idTest]);

  const getPartDetail = useCallback(async (idPart) => {
    const res = await getPartByIdAPI(idPart);
    // getPartByIdAPI returns a single part object (not array) for the get-one endpoint
    return res?.data || null;
  }, []);

  const createPart = useCallback(async () => {
    const res = await createPartAPI({
      idTest,
      namePart: `Part ${parts.length + 1}`,
      order: parts.length,
    });
    const newPart = res?.data;
    if (newPart?.idPart) {
      const next = [...parts, newPart];
      setParts(next);
      setActivePartId(newPart.idPart);
    }
    return newPart;
  }, [idTest, parts]);

  const partsCtx = useMemo(
    () => ({
      parts,
      activePartId,
      setActivePartId,
      refreshParts,
      getPartDetail,
      createPart,
      loading: partsLoading,
    }),
    [parts, activePartId, partsLoading, refreshParts, getPartDetail, createPart]
  );

  // Push part list to sidebar whenever it changes (READING / LISTENING only)
  useEffect(() => {
    if (skill === "READING" || skill === "LISTENING") {
      setSidebarState((s) => ({ ...s, parts }));
    }
  }, [parts, skill]);

  // Auto-reset sub-tab when skill changes
  const changeSkill = (s) => {
    setSkill(s);
    setTab("questions");
  };

  // Keep initial skill in sync with exam.testType (in case it loads later)
  useEffect(() => {
    if (exam?.testType && SKILL_FROM_TYPE[exam.testType]) {
      setSkill(SKILL_FROM_TYPE[exam.testType]);
    }
  }, [exam?.testType]);

  const totalQuestions =
    (skill === "READING" || skill === "LISTENING"
      ? parts.reduce((sum, p) => sum + (p.quantity || 0), 0)
      : 0) || 0;
  const targetQuestions = Number(exam?.numberQuestion) || 0;

  // Build sidebar part list per skill
  const sidebarParts = (() => {
    if (skill === "WRITING") {
      return [
        {
          id: "t1",
          name: "Task 1 — Chart",
          meta: "≥150 words",
          status: sidebarState.t1Done ? "done" : "editing",
        },
        {
          id: "t2",
          name: "Task 2 — Essay",
          meta: "≥250 words",
          status: sidebarState.t2Done ? "done" : "editing",
        },
      ];
    }
    if (skill === "SPEAKING") {
      return (sidebarState.parts || []).map((p, i) => ({
        id: p.idSpeakingTask || p.id,
        name: p.part || p.title || `Part ${i + 1}`,
        meta: `${p.questionsCount ?? "?"} topics`,
        status: "editing",
      }));
    }
    return (parts || []).map((p, i) => ({
      id: p.idPart,
      name: p.namePart || `Part ${i + 1}`,
      meta: `${p.quantity || 0} questions`,
      status: p.quantity > 0 ? "editing" : "todo",
    }));
  })();

  const renderBody = () => {
    if (tab === "settings") {
      return (
        <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-5">
          <h2 className="text-lg font-black text-[#1e1b4b] mb-4">
            ⚙️ Test Settings
          </h2>
          <TestInfoEditor exam={exam} onUpdate={onExamUpdate} />
        </div>
      );
    }

    // READING / LISTENNING share one PartsContext
    if (skill === "READING" || skill === "LISTENING") {
      return (
        <PartsProvider value={partsCtx}>
          {tab === "content" && skill === "READING" ? (
            <PassageEditor onChange={setSidebarState} />
          ) : (
            <QuestionGroups
              idTest={idTest}
              isListening={skill === "LISTENING"}
              onChange={setSidebarState}
              exam={exam}
            />
          )}
        </PartsProvider>
      );
    }

    if (skill === "WRITING") {
      return <WritingEditor idTest={idTest} onChange={setSidebarState} />;
    }
    if (skill === "SPEAKING") {
      return <SpeakingEditor idTest={idTest} onChange={setSidebarState} />;
    }
    return null;
  };

  return (
    <div className="min-h-screen w-full bg-[#fafafc] flex">
      <EditorSidebar
        skill={skill}
        parts={sidebarParts}
        activeIdx={0}
        exam={exam}
        totalQuestions={totalQuestions}
        targetQuestions={targetQuestions}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        <EditorHeader
          skill={skill}
          onSkillChange={changeSkill}
          tab={tab}
          onTabChange={setTab}
          exam={exam}
          onPreview={onPreview}
          onImportPdf={onImportPdf}
          onPublish={onPublish}
        />

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_340px] overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto bg-[#f1f1f6] min-h-0">
            {renderBody()}
          </div>

          <EditorRail skill={skill} />
        </div>
      </main>
    </div>
  );
};

export default IELTSTestEditor;
