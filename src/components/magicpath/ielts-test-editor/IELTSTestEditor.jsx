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
  getLimits,
  validateTotalQuestionCount,
  validateTotalPartCount,
} from "./testLimits";
import {
  getAllPartByIdAPI,
  getPartByIdAPI,
  createPartAPI,
  deletePartAPI,
} from "@/services/apiTest";
import { message, Modal } from "antd";

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
      // The list endpoint only includes `_count.questions` and NOT the
      // groupOfQuestions[].quantity rows. We need actual group quantities
      // to compute the test total question count for the per-skill cap.
      // Fetch each part detail in parallel and merge.
      const details = await Promise.all(
        arr.map((p) =>
          getPartDetail(p.idPart)
            .then((d) => d || p)
            .catch(() => p)
        )
      );
      // Merge the detailed part (with questionGroups) into the lightweight
      // list entry, keeping list metadata.
      const enriched = arr.map((light, i) => ({
        ...light,
        questionGroups: details[i]?.questionGroups || details[i]?.groupOfQuestions || [],
        groupOfQuestions: details[i]?.questionGroups || details[i]?.groupOfQuestions || [],
      }));
      setParts(enriched);
      // Don't auto-shift activePartId here; only set if none selected.
      if (!activePartId && enriched.length > 0) {
        setActivePartId(enriched[0].idPart);
      }
      return enriched;
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
    // Unify naming: always "Part N" regardless of skill (was "Section N" for
    // Listening before, which made tab labels inconsistent across skills).
    const namePart = `Part ${parts.length + 1}`;
    const res = await createPartAPI({
      idTest,
      namePart,
      order: parts.length,
    });
    const newPart = res?.data;
    if (newPart?.idPart) {
      const next = [...parts, newPart];
      setParts(next);
      setActivePartId(newPart.idPart);
    }
    return newPart;
  }, [idTest, parts, skill]);

  const handleDeletePart = useCallback(
    (idPart) => {
      const idx = parts.findIndex((p) => p.idPart === idPart);
      const label = parts[idx]?.namePart || `Part ${idx + 1}`;
      Modal.confirm
        ? Modal.confirm({
            title: "Delete part?",
            content: `Delete "${label}" and ALL its question groups + questions? This cannot be undone.`,
            okText: "Delete",
            okButtonProps: { danger: true },
            centered: true,
            async onOk() {
              try {
                await deletePartAPI(idPart);
                message.success(`Part "${label}" deleted`);
                if (activePartId === idPart) setActivePartId(null);
                await refreshParts();
              } catch (e) {
                console.error(e);
                message.error("Delete part failed");
              }
            },
          })
        : (async () => {
            if (!window.confirm(`Delete "${label}" and all its content?`)) return;
            try {
              await deletePartAPI(idPart);
              message.success(`Part "${label}" deleted`);
              if (activePartId === idPart) setActivePartId(null);
              await refreshParts();
            } catch {
              message.error("Delete part failed");
            }
          })();
    },
    [parts, activePartId, refreshParts]
  );

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

  // Keep initial skill in sync with exam.testType (in case it loads later)
  useEffect(() => {
    if (exam?.testType && SKILL_FROM_TYPE[exam.testType]) {
      setSkill(SKILL_FROM_TYPE[exam.testType]);
    }
  }, [exam?.testType]);

  // Derive per-part question count. Sources (in priority order):
  //   1. Prisma `_count.questions` (preferred — already aggregated by BE)
  //   2. Sum of groupOfQuestions[].quantity on the part
  //   3. Legacy `p.quantity` field
  const derivePartQty = (p) => {
    const fromCount = Number(p?._count?.questions ?? 0);
    if (fromCount > 0) return fromCount;
    const groups = Array.isArray(p?.groupOfQuestions)
      ? p.groupOfQuestions
      : Array.isArray(p?.questionGroups) ? p.questionGroups : [];
    const fromGroups = groups.reduce(
      (s, g) => s + (Number(g?.quantity) || 0),
      0
    );
    if (fromGroups > 0) return fromGroups;
    return Number(p?.quantity ?? 0) || 0;
  };

  const totalQuestions =
    (skill === "READING" || skill === "LISTENING"
      ? parts.reduce((sum, p) => sum + derivePartQty(p), 0)
      : 0) || 0;

  // Per-skill limits (L=40 q across 4 sections, R=40 q across 3 parts, etc.)
  const skillLimits = getLimits(skill);
  // targetQuestions takes the test's numberQuestion (server-set) and falls
  // back to the per-skill hard target (L=40, R=40, others 0).
  const targetQuestions =
    Number(exam?.numberQuestion) || skillLimits.totalQuestions || 0;

  // Total-part cap: refuse to create a 5th section / 4th reading part.
  const totalPartCap = validateTotalPartCount(skill, parts.length);
  // Total-question cap: warn when current total > per-skill max.
  const totalQuestionCap = validateTotalQuestionCount(skill, totalQuestions);

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
    if (skill === "LISTENING") {
      // Listening: 4 sections, audio on every section. There is no per-section
      // target — questions are distributed freely across sections, capped only
      // by the per-skill total (40 across the whole test).
      return (parts || []).map((p, i) => {
        const qty = derivePartQty(p);
        return {
          id: p.idPart,
          name: p.namePart || `Part ${i + 1}`,
          meta: `${qty} q · 🎧 audio`,
          status: qty > 0 ? "editing" : "todo",
        };
      });
    }
    if (skill === "READING") {
      return (parts || []).map((p, i) => {
        const qty = derivePartQty(p);
        return {
          id: p.idPart,
          name: p.namePart || `Part ${i + 1}`,
          meta: `${qty} q`,
          status: qty > 0 ? "editing" : "todo",
        };
      });
    }
    return (parts || []).map((p, i) => ({
      id: p.idPart,
      name: p.namePart || `Part ${i + 1}`,
      meta: `${derivePartQty(p)} questions`,
      status: derivePartQty(p) > 0 ? "editing" : "todo",
    }));
  })();

  const activeSidebarIdx = Math.max(
    0,
    sidebarParts.findIndex((p) => p.id === activePartId)
  );

  const handleSidebarSelect = (idx) => {
    const item = sidebarParts[idx];
    if (!item) return;
    if (skill === "READING" || skill === "LISTENING") {
      setActivePartId(item.id);
      setTab("questions");
    }
  };

  const renderBody = () => {
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
              externalParts={parts}
              externalActivePartId={activePartId}
              skillLimits={skillLimits}
              testTotalQuestions={totalQuestions}
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
        activeIdx={activeSidebarIdx}
        onSelect={handleSidebarSelect}
        onCreate={skill === "READING" || skill === "LISTENING" ? createPart : undefined}
        onDelete={skill === "READING" || skill === "LISTENING" ? handleDeletePart : undefined}
        exam={exam}
        totalQuestions={totalQuestions}
        targetQuestions={targetQuestions}
        skillLimits={skillLimits}
        totalPartCapMessage={totalPartCap.ok ? null : totalPartCap.message}
        totalQuestionCapMessage={totalQuestionCap.ok ? null : totalQuestionCap.message}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        <EditorHeader
          skill={skill}
          tab={tab}
          onTabChange={setTab}
          exam={exam}
          onPreview={onPreview}
          onImportPdf={onImportPdf}
          onPublish={onPublish}
          onExamUpdate={onExamUpdate}
        />

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_340px] overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto bg-[#f1f1f6] min-h-0">
            {renderBody()}
          </div>

          <EditorRail
            skill={skill}
            exam={exam}
            tab={tab}
            onTabChange={setTab}
            sidebarState={sidebarState}
            totalQuestions={totalQuestions}
            targetQuestions={targetQuestions}
          />
        </div>
      </main>
    </div>
  );
};

export default IELTSTestEditor;
