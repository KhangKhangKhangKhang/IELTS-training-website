import React, { useEffect, useState, useMemo, useRef } from "react";
import { message, Modal } from "antd";
import { StackedButton, inputCls } from "./editorUI";
import {
  getPartByIdAPI,
  createPartAPI,
  updatePartAPI,
  deletePartAPI,
  createGroupOfQuestionsAPI,
  updateGroupOfQuestionsAPI,
  deleteGroupOfQuestionsAPI,
  getQuestionsByIdGroupAPI,
  createManyQuestion,
  updateManyQuestionAPI,
  deleteQuestionAPI,
  getAPITest,
} from "@/services/apiTest";
import { getDetailInTestAPI } from "@/services/apiDoTest";
import { useAuth } from "@/context/authContext";
import { useParts } from "./partsContext";
import {
  subTypesByFamily,
  TEMPLATES,
  resolveSubType as _resolveSubType,
  validateMetadata,
} from "./questionTypeMeta";
import useQuestionDraft from "./useQuestionDraft";

// Per-type question editors (14 BE sub-types → 12 component files)
import MCQForm from "@/components/test/teacher/Detail/MCQForm";
import TFNGForm from "@/components/test/teacher/Detail/TFNGForm";
import YesNoNotGivenForm from "@/components/test/teacher/Detail/YesNoNotGivenForm";
import ShortAnswerForm from "@/components/test/teacher/Detail/ShortAnswerForm";
import FillBlankForm from "@/components/test/teacher/Detail/FillBlankForm";
import MatchingForm from "@/components/test/teacher/Detail/MatchingForm";
import LabelingForm from "@/components/test/teacher/Detail/LabelingForm";
import OtherForm from "@/components/test/teacher/Detail/OtherForm";

export const typeMeta = {
  MCQ: { icon: "🔘", label: "Multiple choice", color: "bg-[#6366f1]", desc: "4 options A/B/C/D" },
  TFNG: { icon: "✓✗", label: "True / False / Not Given", color: "bg-[#10b981]", desc: "True / False / Not Given" },
  YNNG: { icon: "❓", label: "Yes / No / Not Given", color: "bg-[#10b981]", desc: "Yes / No / Not Given" },
  FILL_BLANK: { icon: "📝", label: "Fill in the blanks", color: "bg-[#06b6d4]", desc: "Fill in 1-3 words" },
  MATCHING: { icon: "🔗", label: "Matching", color: "bg-[#a855f7]", desc: "Match sentences with headings" },
  SHORT_ANSWER: { icon: "✏️", label: "Short answer", color: "bg-[#fb7185]", desc: "Answer in 1-3 words" },
  LABELING: { icon: "🏷️", label: "Labelling", color: "bg-[#f59e0b]", desc: "Label images/diagrams" },
  OTHER: { icon: "📌", label: "Other", color: "bg-[#64748b]", desc: "Other question type" },
};

// Map BE questionType → canvas QType label
// Note: canvas "FILL_BLANK" / "MATCHING" are *families* (groups of sub-types).
// When the BE has saved a SPECIFIC sub-type (e.g. SUMMARY_COMPLETION),
// the canvas renders the group header with that sub-type's "family" label,
// but the per-question editor picks the right sub-type via resolveSubType().
const TYPE_BACKEND_TO_CANVAS = {
  MULTIPLE_CHOICE: "MCQ",
  TRUE_FALSE_NOT_GIVEN: "TFNG",
  YES_NO_NOT_GIVEN: "YNNG",
  // FILL family
  SENTENCE_COMPLETION: "FILL_BLANK",
  SUMMARY_COMPLETION: "FILL_BLANK",
  NOTE_COMPLETION: "FILL_BLANK",
  TABLE_COMPLETION: "FILL_BLANK",
  FLOW_CHART_COMPLETION: "FILL_BLANK",
  // MATCHING family
  MATCHING_HEADING: "MATCHING",
  MATCHING_INFORMATION: "MATCHING",
  MATCHING_FEATURES: "MATCHING",
  MATCHING_SENTENCE_ENDINGS: "MATCHING",
  // Other
  SHORT_ANSWER: "SHORT_ANSWER",
  DIAGRAM_LABELING: "LABELING",
  LABELING: "LABELING",
  OTHER: "OTHER",
};
// Canvas family → default BE sub-type (first sub-type of the family).
// The wizard uses this when user picks a family (e.g. FILL_BLANK) without
// a more specific sub-type. Override-able via sub-type selector.
const TYPE_CANVAS_TO_BACKEND = {
  MCQ: "MULTIPLE_CHOICE",
  TFNG: "TRUE_FALSE_NOT_GIVEN",
  YNNG: "YES_NO_NOT_GIVEN",
  FILL_BLANK: "SENTENCE_COMPLETION",
  MATCHING: "MATCHING_FEATURES",
  SHORT_ANSWER: "SHORT_ANSWER",
  LABELING: "DIAGRAM_LABELING",
  OTHER: "OTHER",
};

// Resolve a BE questionType to a canvas FAMILY key (FILL_BLANK / MATCHING / OTHER / ...).
// Used by QuestionQuickForm to decide whether to render the sub-type selector.
const FAMILY_OF = {
  SENTENCE_COMPLETION: "FILL_BLANK",
  SUMMARY_COMPLETION: "FILL_BLANK",
  NOTE_COMPLETION: "FILL_BLANK",
  TABLE_COMPLETION: "FILL_BLANK",
  FLOW_CHART_COMPLETION: "FILL_BLANK",
  MATCHING_HEADING: "MATCHING",
  MATCHING_INFORMATION: "MATCHING",
  MATCHING_FEATURES: "MATCHING",
  MATCHING_SENTENCE_ENDINGS: "MATCHING",
};
const getFamilyFromQType = (qType) => FAMILY_OF[qType] || qType;

export function QuestionGroups({ idTest, isListening = false, onChange, exam: examProp }) {
  const { user } = useAuth();
  const {
    parts,
    activePartId,
    setActivePartId,
    createPart,
    getPartDetail,
    loading,
  } = useParts();

  const [activePartDetail, setActivePartDetail] = useState(null);
  const [confirm, setConfirm] = useState(null); // { title, content, danger, onOk } | null
  const [groups, setGroups] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [creatingPart, setCreatingPart] = useState(false);
  const [exam, setExam] = useState(examProp || null);

  // Load exam metadata once (for numberQuestion target & audio URL preview)
  useEffect(() => {
    if (examProp) {
      setExam(examProp);
      return;
    }
    if (!idTest) return;
    (async () => {
      try {
        const [testRes, detailRes] = await Promise.allSettled([
          getAPITest(),
          getDetailInTestAPI(idTest),
        ]);
        const allTests = testRes.status === "fulfilled" ? testRes.value?.data || testRes.value || [] : [];
        const found = allTests.find((t) => t.idTest === idTest);
        setExam(found || (detailRes.status === "fulfilled" ? detailRes.value?.data : null) || null);
      } catch {}
    })();
  }, [idTest, examProp]);

  // Load part detail (with groups) when activePart changes
  useEffect(() => {
    if (!activePartId) {
      setActivePartDetail(null);
      setGroups([]);
      return;
    }
    (async () => {
      try {
        const detail = await getPartDetail(activePartId);
        setActivePartDetail(detail);
        const gs = detail?.groupOfQuestions || [];
        setGroups(gs);
        onChange?.({
          parts,
          activePartId,
          groupCount: gs.length,
        });
      } catch (e) {
        console.error(e);
        setActivePartDetail(null);
        setGroups([]);
      }
    })();
  }, [activePartId, parts, onChange, getPartDetail]);

  const refreshActivePart = async () => {
    if (!activePartId) return;
    try {
      const detail = await getPartDetail(activePartId);
      setActivePartDetail(detail);
      setGroups(detail?.groupOfQuestions || []);
    } catch {}
  };

  const handleCreatePart = async () => {
    if (creatingPart) return;
    setCreatingPart(true);
    try {
      const newPart = await createPart();
      if (newPart?.idPart) {
        setActivePartId(newPart.idPart);
        message.success("Part created");
      }
    } catch {
      message.error("Failed to create part");
    } finally {
      setCreatingPart(false);
    }
  };

  const handleDeleteGroup = (g) => {
    const meta = typeMeta[TYPE_BACKEND_TO_CANVAS[g.questionType]] || typeMeta.OTHER;
    setConfirm({
      title: "Delete group?",
      content: `Delete group "${g.title || meta.label}"? This will also remove all its questions.`,
      danger: true,
      okText: "Delete",
      onOk: async () => {
        try {
          await deleteGroupOfQuestionsAPI(g.idGroupOfQuestions);
          message.success("Group deleted");
          await refreshActivePart();
        } catch {
          message.error("Delete group failed");
        }
      },
    });
  };

  // Build group range [from, to] using cumulative quantity
  const groupsWithRange = useMemo(() => {
    let from = 1;
    return groups.map((g) => {
      const qty = Number(g.quantity) || 0;
      const to = from + qty - 1;
      const r = [from, to];
      from = to + 1;
      return { ...g, range: r };
    });
  }, [groups]);

  return (
    <div className="space-y-4">
      {/* Top: part selector + add */}
      <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] mr-2">
            Part:
          </div>
          {parts.map((p) => (
            <button
              key={p.idPart}
              onClick={() => setActivePartId(p.idPart)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activePartId === p.idPart
                  ? "bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca]"
                  : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"
              }`}
            >
              {p.namePart || `Part ${parts.indexOf(p) + 1}`}
            </button>
          ))}
          <button
            onClick={handleCreatePart}
            disabled={creatingPart}
            data-testid="add-part-btn"
            className="px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-dashed border-[#c7d2fe] text-[#6366f1] hover:bg-[#eef2ff]"
          >
            + Add Part
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-[#94a3b8] py-12 font-bold">
          Loading...
        </div>
      ) : !activePartId ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#e6e6ed] p-12 text-center">
          <div className="text-4xl mb-2">📋</div>
          <div className="font-extrabold text-[#1e1b4b]">
            No parts yet
          </div>
          <div className="text-xs text-[#64748b] mt-1 mb-4 font-medium">
            Create the first part to start adding questions
          </div>
          <StackedButton tone="indigo" onClick={handleCreatePart}>
            + Create Part
          </StackedButton>
        </div>
      ) : (
        <>
          {isListening && <ListeningAudioCard exam={exam} partDetail={activePartDetail} />}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#1e1b4b]">
                {groups.length} question groups
              </h2>
              <div className="text-xs text-[#64748b] font-medium">
                Click to expand · Each group is one question type
              </div>
            </div>
            <StackedButton tone="indigo" onClick={() => setShowAdd(true)}>
              + Add group
            </StackedButton>
          </div>

          <div className="space-y-3">
            {groupsWithRange.map((g) => {
              const meta = typeMeta[TYPE_BACKEND_TO_CANVAS[g.questionType]] || typeMeta.OTHER;
              const total = Number(g.quantity) || 0;
              const complete = total > 0;
              const open = expanded === g.idGroupOfQuestions;
              return (
                <div
                  key={g.idGroupOfQuestions}
                  className={`bg-white rounded-3xl border-2 overflow-hidden transition-all ${
                    open
                      ? "border-[#6366f1] shadow-[0_4px_0_#4338ca]"
                      : "border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed]"
                  }`}
                >
                  <div className="flex items-stretch">
                    <button
                      onClick={() => setExpanded(open ? null : g.idGroupOfQuestions)}
                      className="flex-1 p-4 flex items-center gap-3 hover:bg-[#fafafc] transition-colors text-left min-w-0"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl ${meta.color} text-white flex items-center justify-center text-base font-black flex-none`}
                      >
                        {meta.icon}
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[#fafafc] border-2 border-[#e6e6ed] text-[#1e1b4b] font-mono font-extrabold text-xs flex-none">
                        {g.range[0]}–{g.range[1]}
                      </span>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-extrabold text-[#1e1b4b] text-sm truncate">
                          {g.title || meta.label}
                        </div>
                        <div className="text-[10px] font-bold text-[#64748b] mt-0.5">
                          {meta.label}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          complete
                            ? "bg-[#d1fae5] text-[#047857]"
                            : "bg-[#fef3c7] text-[#b45309]"
                        }`}
                      >
                        ✓ {total}/{total}
                      </span>
                      <span
                        className={`text-[#64748b] text-sm transition-transform ${
                          open ? "rotate-90" : ""
                        }`}
                      >
                        ▶
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(g);
                      }}
                      title="Delete group"
                      aria-label="Delete group"
                      className="px-3 m-2 rounded-xl bg-[#fff1f2] hover:bg-[#fecdd3] text-[#fb7185] text-sm font-black flex-none border-2 border-[#fecdd3]"
                    >
                      ✕
                    </button>
                  </div>

                  {open && (
                    <GroupEditor
                      group={g}
                      onSave={refreshActivePart}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="w-full p-5 rounded-3xl border-2 border-dashed border-[#e6e6ed] text-[#64748b] hover:border-[#6366f1] hover:text-[#6366f1] hover:bg-[#eef2ff]/30 transition-all"
          >
            <div className="text-3xl mb-1">➕</div>
            <div className="text-sm font-extrabold uppercase tracking-wide">
              Add question group
            </div>
            <div className="text-[10px] mt-0.5">
              Or import from Word/PDF (use the Import PDF button above)
            </div>
          </button>

          {showAdd && activePartId && (
            <AddGroupModal
              onClose={() => setShowAdd(false)}
              onCreated={async () => {
                setShowAdd(false);
                await refreshActivePart();
              }}
              partId={activePartId}
              defaultFrom={(groupsWithRange.at(-1)?.[1] || 0) + 1}
            />
          )}
        </>
      )}

      {/* Delete-group confirm modal (antd v5 + React 19 static Modal.confirm is broken) */}
      <Modal
        open={!!confirm}
        title={confirm?.title}
        onCancel={() => setConfirm(null)}
        onOk={async () => {
          const action = confirm?.onOk;
          setConfirm(null);
          if (action) await action();
        }}
        okText={confirm?.okText || "OK"}
        cancelText="Cancel"
        okButtonProps={confirm?.danger ? { danger: true } : undefined}
        centered
      >
        <div className="text-sm text-[#1e1b4b] whitespace-pre-line">
          {confirm?.content}
        </div>
      </Modal>
    </div>
  );
}

// =====================================================================
// Group editor (inline): edit title, instructions, quantity
// =====================================================================
function GroupEditor({ group, onSave }) {
  const [title, setTitle] = useState(group.title || "");
  const [instructions, setInstructions] = useState(group.instructions || "");
  const [quantity, setQuantity] = useState(Number(group.quantity) || 0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  // activeForm: { mode: 'create' | 'edit', question: any, draftId: string } | null
  //   - create: 'draft-<slotIndex>' for inline auto-rendered slot
  //   - edit:   'edit-<questionId>' for editing an existing question
  const [activeForm, setActiveForm] = useState(null);
  // staged items (local, not yet on BE):
  //   stagedNew:  Array of { localId, payload, draftKey, slotIndex, status }
  //               status: 'empty' (placeholder) | 'draft' (has content, not saved)
  //   stagedEdit: Map<questionId, { payload, draftKey }>
  const [stagedNew, setStagedNew] = useState([]);
  const [stagedEdit, setStagedEdit] = useState({});
  const initRef = useRef(false);
  // Confirm dialog state (controlled modal — antd v5 + React 19 has issues with static Modal.confirm)
  const [confirm, setConfirm] = useState(null); // { title, content, danger, onOk } | null

  useEffect(() => {
    if (!group.idGroupOfQuestions) return;
    initRef.current = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getQuestionsByIdGroupAPI(group.idGroupOfQuestions);
        // res.data is the legacy array; for a single-group GET it returns [group].
        // The actual questions live at res.data[0].questions (mapped by adapter).
        const arr = Array.isArray(res?.data) ? res.data : [];
        const questionList = arr[0]?.questions || [];
        setQuestions(Array.isArray(questionList) ? questionList : []);
        // After loading questions, seed empty slots to match the group quantity.
        // quantity is captured from the prop; we use a ref to avoid double-init.
        seedSlots(Array.isArray(questionList) ? questionList : [], Number(group.quantity) || 0);
      } catch {
        setQuestions([]);
        seedSlots([], Number(group.quantity) || 0);
      } finally {
        setLoading(false);
        initRef.current = true;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.idGroupOfQuestions]);

  // Seed (or top up) empty slots so the visible slot count == max(quantity, questions.length)
  //   The "want" is the TOTAL number of slots to show. Existing committed
  //   questions are already rendered by the `questions.map()` block, so the
  //   number of empty placeholders we need to seed is `want - existingQuestions.length`.
  const seedSlots = (existingQuestions, qty) => {
    const want = Math.max(qty, existingQuestions.length);
    setStagedNew((prev) => {
      const need = Math.max(0, want - existingQuestions.length - prev.length);
      if (need <= 0) return prev;
      const extras = Array.from({ length: need }, (_, i) => ({
        localId: `slot-${Date.now()}-${prev.length + i}-${Math.random().toString(36).slice(2, 6)}`,
        payload: null,        // null = empty placeholder, no form data yet
        draftKey: `draft-${prev.length + i}-${Date.now()}`,
        slotIndex: prev.length + i,
        status: "empty",
      }));
      return [...prev, ...extras];
    });
  };

  // When the user changes the quantity input, sync the slot count.
  // - Top up empty placeholders if new total > current staged count
  // - Trim trailing EMPTY placeholders (only!) if new total < current
  //   (we never delete a placeholder that has filled content)
  useEffect(() => {
    if (!initRef.current) return;
    const total = Math.max(Number(quantity) || 0, questions.length);
    const target = Math.max(0, total - questions.length);
    setStagedNew((prev) => {
      if (prev.length === target) return prev;
      if (prev.length < target) {
        // Top up
        const need = target - prev.length;
        const extras = Array.from({ length: need }, (_, i) => ({
          localId: `slot-${Date.now()}-${prev.length + i}-${Math.random().toString(36).slice(2, 6)}`,
          payload: null,
          draftKey: `draft-${prev.length + i}-${Date.now()}`,
          slotIndex: prev.length + i,
          status: "empty",
        }));
        return [...prev, ...extras];
      }
      // Trim trailing EMPTY placeholders only (keep filled ones, keep at least 1)
      const keepAtLeast = 1;
      const trimTo = Math.max(keepAtLeast, target);
      const next = prev.slice(0, trimTo);
      // Clean up localStorage drafts for removed empty slots
      next.forEach((s, i) => {
        if (!prev[i] || s.localId !== prev[i].localId) {
          try {
            if (prev[i]?.draftKey) {
              window.localStorage.removeItem(
                `ielts:draft:group:${group.idGroupOfQuestions}:${prev[i].draftKey}`
              );
            }
          } catch {}
        }
      });
      return next;
    });
  }, [quantity, questions.length, group.idGroupOfQuestions]);

  const saveGroup = async () => {
    setSaving(true);
    try {
      await updateGroupOfQuestionsAPI(group.idGroupOfQuestions, {
        idPart: group.idPart,
        questionType: group.questionType,
        title,
        instructions,
        quantity: Number(quantity) || 0,
      });
      message.success("Group saved");
      setSavedAt(Date.now());
      onSave?.();
    } catch {
      message.error("Save group failed");
    } finally {
      setSaving(false);
    }
  };

  // Dirty detection: any unsaved change vs original group values
  const isDirty =
    title !== (group.title || "") ||
    instructions !== (group.instructions || "") ||
    Number(quantity) !== (Number(group.quantity) || 0);

  const canSave = isDirty && !saving && title.trim().length > 0;

  const refreshQuestions = async () => {
    const res = await getQuestionsByIdGroupAPI(group.idGroupOfQuestions);
    const arr = Array.isArray(res?.data) ? res.data : [];
    const questionList = arr[0]?.questions || [];
    setQuestions(Array.isArray(questionList) ? questionList : []);
  };

  // Update a slot's payload (called by the inline form for that slot)
  const handleStageNew = (payload, draftKey, slotLocalId) => {
    setStagedNew((arr) =>
      arr.map((s) =>
        s.localId === slotLocalId
          ? { ...s, payload, draftKey, status: "draft" }
          : s
      )
    );
    // Keep form open for further edits (don't auto-collapse)
    setActiveForm(null);
  };

  // Open a specific slot's inline form
  const openSlot = (slot) => {
    setActiveForm({
      mode: "create",
      question: null,
      draftKey: slot.draftKey,
      slotLocalId: slot.localId,
    });
  };

  // Remove a slot (only empty placeholders can be removed; filled ones can be cleared via ✕ on staged)
  const removeSlot = (slotLocalId) => {
    setStagedNew((arr) => {
      const target = arr.find((s) => s.localId === slotLocalId);
      if (target?.draftKey) {
        try {
          window.localStorage.removeItem(
            `ielts:draft:group:${group.idGroupOfQuestions}:${target.draftKey}`
          );
        } catch {}
      }
      return arr.filter((s) => s.localId !== slotLocalId);
    });
  };

  // Stage an EDIT to an existing question (not yet sent to BE)
  const handleStageEdit = (payload, draftKey) => {
    if (!activeForm?.question) return;
    const id = activeForm.question.idQuestion;
    setStagedEdit((m) => ({
      ...m,
      [id]: { payload, draftKey },
    }));
    setActiveForm(null);
  };

  // Discard a staged new question (clear payload, keep slot)
  const clearSlot = (localId) => {
    setStagedNew((arr) =>
      arr.map((s) => {
        if (s.localId !== localId) return s;
        if (s.draftKey) {
          try {
            window.localStorage.removeItem(
              `ielts:draft:group:${group.idGroupOfQuestions}:${s.draftKey}`
            );
          } catch {}
        }
        return { ...s, payload: null, status: "empty" };
      })
    );
  };

  // Discard a staged edit
  const handleDiscardStagedEdit = (idQuestion, draftKey) => {
    setStagedEdit((m) => {
      const next = { ...m };
      delete next[idQuestion];
      return next;
    });
    if (draftKey) {
      try {
        window.localStorage.removeItem(
          `ielts:draft:group:${group.idGroupOfQuestions}:${draftKey}`
        );
      } catch {}
    }
  };

  // Bulk save: 1 transaction for all new + parallel PATCH for all edits.
  // Only slots with non-empty content are sent. Empty placeholders and
  // empty-content slots are skipped (with a warning toast if any were skipped).
  // Also syncs group quantity if it was auto-bumped while adding new questions.
  const saveAllQuestions = async () => {
    if (savingAll) return;
    const validSlots = stagedNew.filter(
      (s) => s.payload && (s.payload.content || "").trim().length > 0
    );
    const skippedEmpty = stagedNew.length - validSlots.length;
    if (validSlots.length === 0 && Object.keys(stagedEdit).length === 0) {
      message.info("Nothing to save");
      return;
    }
    if (skippedEmpty > 0) {
      message.warning(
        `Skipped ${skippedEmpty} empty slot${skippedEmpty > 1 ? "s" : ""} — add content before saving`
      );
    }

    setSavingAll(true);
    try {
      // Sync group quantity if it drifted (auto-bump from adding beyond cap)
      const filledSlots = stagedNew.filter(
        (s) => s.payload && (s.payload.content || "").trim().length > 0
      );
      const desiredQty = Math.max(
        Number(quantity) || 0,
        questions.length + filledSlots.length
      );
      const groupDirty =
        desiredQty !== (Number(group.quantity) || 0) ||
        title !== (group.title || "") ||
        instructions !== (group.instructions || "");
      // Build creates with fresh questionNumber. Skip empty placeholders.
      const baseNumber = questions.length + 1;
      const toCreate = filledSlots.map((s, idx) => ({
        content: s.payload.content,
        questionType: s.payload.questionType,
        typeQuestion: s.payload.typeQuestion,
        metadata: s.payload.metadata,
        idGroupOfQuestions: group.idGroupOfQuestions,
        idPart: group.idPart,
        questionNumber: baseNumber + idx,
        order: questions.length + idx,
      }));

      // Build updates from existing questions
      const existingMap = new Map(questions.map((q) => [q.idQuestion, q]));
      const toUpdate = Object.entries(stagedEdit)
        .filter(([id]) => existingMap.has(id))
        .map(([id, { payload }]) => {
          const orig = existingMap.get(id);
          return {
            idQuestion: id,
            idGroupOfQuestions: group.idGroupOfQuestions,
            idPart: group.idPart,
            content: payload.content,
            questionType: payload.questionType,
            typeQuestion: payload.typeQuestion,
            metadata: payload.metadata,
            order: orig.order ?? 0,
            questionNumber: orig.questionNumber,
          };
        });

      // Fire creates and updates in parallel. If the group itself changed
      // (e.g. quantity auto-bumped), also persist that in the same batch.
      const ops = [];
      if (groupDirty) {
        ops.push(
          updateGroupOfQuestionsAPI(group.idGroupOfQuestions, {
            idPart: group.idPart,
            questionType: group.questionType,
            title,
            instructions,
            quantity: desiredQty,
          })
        );
      }
      if (toCreate.length > 0) {
        ops.push(createManyQuestion({ questions: toCreate }));
      }
      if (toUpdate.length > 0) {
        ops.push(updateManyQuestionAPI({ questions: toUpdate }));
      }
      await Promise.all(ops);

      // Clear drafts of all staged items
      [...stagedNew, ...Object.entries(stagedEdit).map(([id, v]) => ({ draftKey: v.draftKey, idQuestion: id }))]
        .forEach((s) => {
          if (s.draftKey) {
            try {
              window.localStorage.removeItem(
                `ielts:draft:group:${group.idGroupOfQuestions}:${s.draftKey}`
              );
            } catch {}
          }
        });

      message.success(
        `Saved ${toCreate.length} new + ${toUpdate.length} updated question(s)`
      );
      setStagedNew([]);
      setStagedEdit({});
      setActiveForm(null);
      await refreshQuestions();
      onSave?.();
    } catch (e) {
      console.error(e);
      message.error("Save all failed — staged items kept, you can retry");
    } finally {
      setSavingAll(false);
    }
  };

  const handleEditQuestion = (q) => {
    const draftKey = `edit-${q.idQuestion}`;
    setActiveForm({ mode: "edit", question: q, draftKey });
  };

  const handleDeleteQuestion = (q) => {
    if (!q?.idQuestion) return;
    const hasDraft = !!stagedEdit[q.idQuestion];
    const preview = q.content ? `"${q.content.slice(0, 30)}…"` : "(empty)";
    setConfirm({
      title: "Delete question?",
      content: `Delete question ${preview}?${
        hasDraft ? " This will also discard unsaved local changes." : ""
      }`,
      danger: true,
      okText: "Delete",
      onOk: async () => {
        try {
          if (hasDraft) {
            setStagedEdit((m) => {
              const next = { ...m };
              delete next[q.idQuestion];
              return next;
            });
          }
          setQuestions((qs) => qs.filter((x) => x.idQuestion !== q.idQuestion));
          await deleteQuestionAPI(q.idQuestion);
          message.success("Question deleted");
        } catch (e) {
          console.error(e);
          message.error("Delete failed — reloading from server");
          await refreshQuestions();
        }
      },
    });
  };

  const meta = typeMeta[TYPE_BACKEND_TO_CANVAS[group.questionType]] || typeMeta.OTHER;

  return (
    <div className="border-t-2 border-[#e6e6ed] p-4 bg-[#fafafc] space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Group title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls()}
            placeholder="e.g. Questions 1-5: Multiple choice"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Number of questions
          </span>
          <input
            type="number"
            min={0}
            max={50}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            className={inputCls()}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Instructions
        </span>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={2}
          className={`${inputCls()} resize-none`}
          placeholder="Enter instructions for this question group..."
        />
      </label>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-[11px] font-bold">
          {saving ? (
            <span className="inline-flex items-center gap-1.5 text-[#6366f1]">
              <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-pulse" />
              Saving…
            </span>
          ) : savedAt && !isDirty ? (
            <span className="inline-flex items-center gap-1.5 text-[#047857]">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              All changes saved
            </span>
          ) : isDirty ? (
            <span className="inline-flex items-center gap-1.5 text-[#b45309]">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              Unsaved changes
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={saveGroup}
          disabled={!canSave}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wide border-2 transition-all ${
            !canSave
              ? "bg-[#f1f1f6] text-[#94a3b8] border-[#e6e6ed] cursor-not-allowed"
              : "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white border-[#4338ca] shadow-[0_4px_0_#312e81] hover:translate-y-[-1px] hover:shadow-[0_5px_0_#312e81] active:translate-y-[1px] active:shadow-[0_2px_0_#312e81]"
          }`}
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving
            </>
          ) : (
            <>💾 Save group info</>
          )}
        </button>
      </div>

      {/* Questions list */}
      <div className="pt-3 border-t-2 border-[#e6e6ed] space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-[#64748b]">
              {meta.icon} Question list ({questions.length + stagedNew.length} slots
              {stagedNew.filter((s) => s.payload && (s.payload.content || "").trim()).length > 0
                ? ` · ${stagedNew.filter((s) => s.payload && (s.payload.content || "").trim()).length} filled`
                : ""}
              )
            </div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">
              Fill in the questions below, then click <b>Save draft</b> to commit
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(stagedNew.some((s) => s.payload && (s.payload.content || "").trim()) || Object.keys(stagedEdit).length > 0) && (
              <button
                type="button"
                onClick={saveAllQuestions}
                disabled={savingAll}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide border-2 transition-all ${
                  savingAll
                    ? "bg-[#f1f1f6] text-[#94a3b8] border-[#e6e6ed] cursor-not-allowed"
                    : "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white border-[#4338ca] shadow-[0_3px_0_#312e81] hover:translate-y-[-1px] active:translate-y-[1px]"
                }`}
              >
                {savingAll ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving
                  </>
                ) : (
                  <>💾 Save draft ({stagedNew.filter((s) => s.payload && (s.payload.content || "").trim()).length + Object.keys(stagedEdit).length})</>
                )}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-[#94a3b8] text-xs py-3">Loading...</div>
        ) : (
          <div className="space-y-2">
            {/* Saved (committed) questions */}
            {questions.map((q, i) => {
              const edit = stagedEdit[q.idQuestion];
              const staged = !!edit;
              const isOpen = activeForm?.mode === "edit" && activeForm.question?.idQuestion === q.idQuestion;
              return (
                <div
                  key={q.idQuestion || i}
                  className={`rounded-2xl border-2 transition-colors ${
                    staged
                      ? "bg-[#fffbeb] border-dashed border-[#f59e0b]"
                      : "bg-white border-[#e6e6ed] hover:border-[#6366f1]/40"
                  }`}
                >
                  <div className="flex items-start gap-3 p-3">
                    <div className="w-8 h-8 rounded-xl bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca] flex items-center justify-center font-black text-xs flex-none">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      {staged && (
                        <div className="text-[9px] font-black uppercase tracking-wider text-[#b45309] mb-0.5">
                          ✏️ Modified — not saved
                        </div>
                      )}
                      <div className="text-sm font-semibold text-[#1e1b4b] leading-relaxed">
                        {q.content || q.textQuestion || (
                          <span className="text-[#be123c] italic text-[12px] font-bold">
                            ⚠ No content — click ✎ to add question text
                          </span>
                        )}
                      </div>
                      {q.options?.length > 0 && (
                        <div className="mt-1 text-[11px] text-[#64748b] font-medium">
                          {q.options.map((o, oi) => (
                            <span
                              key={oi}
                              className={
                                o.isCorrect
                                  ? "text-[#047857] font-extrabold mr-2"
                                  : "mr-2"
                              }
                            >
                              {String.fromCharCode(65 + oi)}. {o.textOption || o.content}
                              {o.isCorrect ? " ✓" : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        isOpen
                          ? setActiveForm(null)
                          : setActiveForm({ mode: "edit", question: q, draftKey: `edit-${q.idQuestion}` })
                      }
                      className="w-7 h-7 rounded-lg hover:bg-[#eef2ff] flex items-center justify-center text-[#6366f1] flex-none"
                      title="Edit"
                    >
                      ✎
                    </button>
                    {staged ? (
                      <button
                        onClick={() => handleDiscardStagedEdit(q.idQuestion, edit.draftKey)}
                        className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] flex items-center justify-center text-[#fb7185] flex-none"
                        title="Discard changes"
                      >
                        ✕
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteQuestion(q)}
                        className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] flex items-center justify-center text-[#fb7185] flex-none"
                        title="Delete"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3">
                      <QuestionQuickForm
                        key={`edit-${q.idQuestion}`}
                        qType={group.questionType}
                        mode="edit"
                        groupId={group.idGroupOfQuestions}
                        draftKey={`edit-${q.idQuestion}`}
                        existing={q}
                        onUpdate={(payload) => handleStageEdit(payload, `edit-${q.idQuestion}`)}
                        onCancel={() => setActiveForm(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Slots — auto-rendered to match group quantity */}
            {stagedNew.map((slot, idx) => {
              const isOpen =
                activeForm?.mode === "create" && activeForm.slotLocalId === slot.localId;
              const number = questions.length + idx + 1;
              const isFilled = !!slot.payload;
              const hasContent =
                isFilled && (slot.payload.content || "").trim().length > 0;
              return (
                <div
                  key={slot.localId}
                  className={`rounded-2xl border-2 transition-colors ${
                    isOpen
                      ? "bg-white border-[#6366f1]"
                      : hasContent
                        ? "bg-[#eef2ff] border-dashed border-[#6366f1]"
                        : isFilled
                          ? "bg-[#fff1f2] border-dashed border-[#fb7185]"
                          : "bg-[#fafafc] border-dashed border-[#c7d2fe]"
                  }`}
                >
                  <div className="flex items-start gap-3 p-3">
                    <div
                      className={`w-8 h-8 rounded-xl text-white shadow-[0_2px_0_#4338ca] flex items-center justify-center font-black text-xs flex-none ${
                        hasContent
                          ? "bg-[#6366f1]"
                          : isFilled
                            ? "bg-[#fb7185]"
                            : "bg-[#a5b4fc]"
                      }`}
                    >
                      {number}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isFilled && !hasContent ? (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveForm({
                              mode: "create",
                              question: null,
                              draftKey: slot.draftKey,
                              slotLocalId: slot.localId,
                            })
                          }
                          className="w-full text-left text-sm font-extrabold text-[#be123c] uppercase tracking-wide"
                        >
                          ⚠️ Empty content — click to fill question {number}
                        </button>
                      ) : hasContent ? (
                        <>
                          <div className="text-[9px] font-black uppercase tracking-wider text-[#4338ca] mb-0.5">
                            🆕 New — not saved
                          </div>
                          <div className="text-sm font-semibold text-[#1e1b4b] leading-relaxed">
                            {slot.payload.content}
                          </div>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            isOpen
                              ? setActiveForm(null)
                              : setActiveForm({
                                  mode: "create",
                                  question: null,
                                  draftKey: slot.draftKey,
                                  slotLocalId: slot.localId,
                                })
                          }
                          className="w-full text-left text-sm font-extrabold text-[#6366f1] uppercase tracking-wide"
                        >
                          {isOpen ? "× Close" : "+ Click to fill question " + number}
                        </button>
                      )}
                    </div>
                    {isFilled && (
                      <button
                        onClick={() =>
                          setActiveForm({
                            mode: "create",
                            question: null,
                            draftKey: slot.draftKey,
                            slotLocalId: slot.localId,
                          })
                        }
                        className="w-7 h-7 rounded-lg hover:bg-[#eef2ff] flex items-center justify-center text-[#6366f1] flex-none"
                        title="Edit"
                      >
                        ✎
                      </button>
                    )}
                    {isFilled ? (
                      <button
                        onClick={() => clearSlot(slot.localId)}
                        className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] flex items-center justify-center text-[#fb7185] flex-none"
                        title="Clear slot"
                      >
                        ✕
                      </button>
                    ) : (
                      stagedNew.length > 1 && (
                        <button
                          onClick={() => removeSlot(slot.localId)}
                          className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] flex items-center justify-center text-[#fb7185] flex-none"
                          title="Remove slot"
                        >
                          ✕
                        </button>
                      )
                    )}
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3">
                      <QuestionQuickForm
                        key={slot.draftKey}
                        qType={group.questionType}
                        mode="create"
                        groupId={group.idGroupOfQuestions}
                        draftKey={slot.draftKey}
                        initialPayload={slot.payload}
                        onAddToGroup={(payload) => handleStageNew(payload, slot.draftKey, slot.localId)}
                        onCancel={() => setActiveForm(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={!!confirm}
        title={confirm?.title}
        onCancel={() => setConfirm(null)}
        onOk={async () => {
          const action = confirm?.onOk;
          setConfirm(null);
          if (action) await action();
        }}
        okText={confirm?.okText || "OK"}
        cancelText="Cancel"
        okButtonProps={confirm?.danger ? { danger: true } : undefined}
        centered
      >
        <div className="text-sm text-[#1e1b4b] whitespace-pre-line">
          {confirm?.content}
        </div>
      </Modal>
    </div>
  );
}

// =====================================================================
// Quick question form — dispatches to the right editor by `qType`.
// Supports CREATE + EDIT (when `existing` is passed).
//
// Local-first: form data is auto-persisted to localStorage via
// useQuestionDraft. The "Add to group" / "Update" buttons stage the
// change locally; the BE is hit only when the user clicks "Save all"
// on the parent GroupEditor.
//
// New in this version:
// - Sub-type selector for FILL_IN_THE_BLANK and MATCHING families
// - Auto-fills template metadata on mount (so users see filled-in
//   examples and can edit instead of starting from scratch)
// - Validation before submit: highlights missing fields, disables Save
// - Mirror `content` to `metadata.statement` for TFNG/YNNG
// - Draft auto-save + restore via useQuestionDraft
// =====================================================================
function QuestionQuickForm({
  qType,
  mode = "create",
  groupId,
  draftKey,
  existing = null,
  initialPayload = null,
  onAddToGroup,
  onUpdate,
  onCancel,
}) {
  const initialSubType = (() => {
    if (existing?.questionType) return existing.questionType;
    if (initialPayload?.questionType) return initialPayload.questionType;
    // If qType is a BE sub-type, use it directly. Otherwise pick the
    // first sub-type of the family as a sensible default.
    const fam = getFamilyFromQType(qType);
    if (fam === "FILL_BLANK") return "SENTENCE_COMPLETION";
    if (fam === "MATCHING") return "MATCHING_FEATURES";
    return qType;
  })();

  // Local form state. These three pieces are the draft.
  const [content, setContent] = useState(
    existing?.content || initialPayload?.content || ""
  );
  const [subType, setSubType] = useState(initialSubType);
  const [metadata, setMetadata] = useState(() => {
    if (existing?.metadata) return existing.metadata;
    if (initialPayload?.metadata) return initialPayload.metadata;
    if (TEMPLATES[initialSubType]) {
      return JSON.parse(JSON.stringify(TEMPLATES[initialSubType]));
    }
    return {};
  });
  const [hydrated, setHydrated] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Auto-fill template when sub-type changes (only for fresh create mode)
  useEffect(() => {
    if (existing || initialPayload) return;
    if (TEMPLATES[subType]) {
      setMetadata(JSON.parse(JSON.stringify(TEMPLATES[subType])));
    }
  }, [subType, existing, initialPayload]);

  // Persist to localStorage as draft
  const { savedAt: draftSavedAt, clearDraft } = useQuestionDraft({
    groupId,
    draftKey,
    formData: { content, subType, metadata },
    enabled: true,
    onHydrate: (draft) => {
      if (draft && (draft.content !== undefined || draft.metadata !== undefined)) {
        if (draft.content !== undefined) setContent(draft.content);
        if (draft.subType !== undefined) setSubType(draft.subType);
        if (draft.metadata !== undefined) setMetadata(draft.metadata);
      }
      setHydrated(true);
    },
  });

  const safeMetadata = metadata ?? {};
  // Map BE enum (e.g. SENTENCE_COMPLETION) → family (FILL_BLANK) so the
  // sub-type selector renders for groups saved with a SPECIFIC sub-type too.
  const family = getFamilyFromQType(qType);
  const isFamily = family === "FILL_BLANK" || family === "MATCHING";
  const effectiveType = isFamily ? subType : qType;

  // For TFNG / YNNG, the BE requires BOTH `content` (top-level) AND
  // `metadata.statement`. Mirror the two so the user only types once.
  // If user types in `statement`, copy → `content`. If user clears
  // `content`, clear `statement` too.
  useEffect(() => {
    if (effectiveType !== "TRUE_FALSE_NOT_GIVEN" && effectiveType !== "YES_NO_NOT_GIVEN") return;
    const stmt = safeMetadata?.statement || "";
    if (stmt && stmt !== content) {
      setContent(stmt);
    } else if (!stmt && content) {
      setMetadata((m) => ({ ...(m || {}), statement: content }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeMetadata?.statement, content, effectiveType]);

  // Dispatch the per-type editor
  const renderTypeEditor = () => {
    const common = { value: safeMetadata, onChange: setMetadata };
    switch (effectiveType) {
      case "MULTIPLE_CHOICE":
        return <MCQForm {...common} />;
      case "TRUE_FALSE_NOT_GIVEN":
        return <TFNGForm {...common} />;
      case "YES_NO_NOT_GIVEN":
        return <YesNoNotGivenForm {...common} />;
      case "SHORT_ANSWER":
        return <ShortAnswerForm {...common} />;
      case "SENTENCE_COMPLETION":
      case "SUMMARY_COMPLETION":
      case "NOTE_COMPLETION":
      case "TABLE_COMPLETION":
      case "FLOW_CHART_COMPLETION":
        return <FillBlankForm {...common} subType={effectiveType} />;
      case "MATCHING_HEADING":
      case "MATCHING_INFORMATION":
      case "MATCHING_FEATURES":
      case "MATCHING_SENTENCE_ENDINGS":
        return <MatchingForm {...common} qType={effectiveType} />;
      case "DIAGRAM_LABELING":
        return <LabelingForm {...common} />;
      case "OTHER":
        return <OtherForm {...common} />;
      default:
        return (
          <div className="text-xs text-[#94a3b8] italic">
            Unsupported question type: {effectiveType}
          </div>
        );
    }
  };

  const { ok, errors } = validateMetadata(effectiveType, safeMetadata);
  const contentEmpty = !content.trim();

  const handleSubmit = () => {
    setShowErrors(true);
    if (contentEmpty) {
      message.warning("Enter question content");
      return;
    }
    if (!ok) {
      message.warning("Please fill the highlighted fields");
      return;
    }
    // For TFNG / YNNG, mirror content → metadata.statement when missing
    let finalMetadata = safeMetadata;
    if (
      effectiveType === "TRUE_FALSE_NOT_GIVEN" ||
      effectiveType === "YES_NO_NOT_GIVEN"
    ) {
      finalMetadata = { ...(safeMetadata || {}), statement: safeMetadata?.statement || content };
    }
    const payload = {
      content,
      typeQuestion: effectiveType,
      questionType: effectiveType,
      metadata: finalMetadata,
    };
    if (mode === "edit") {
      onUpdate?.(payload);
    } else {
      onAddToGroup?.(payload);
    }
    clearDraft();
  };

  const handleCancel = () => {
    clearDraft();
    onCancel?.();
  };

  // Sub-type family selector
  const renderSubTypeSelector = () => {
    const list = subTypesByFamily[family];
    if (!list) return null;
    return (
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Sub-type
        </span>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {list.map((s) => {
            const active = subType === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSubType(s.key)}
                className={`px-3 py-2 rounded-xl border-2 text-xs font-extrabold transition-all text-left ${
                  active
                    ? "border-[#6366f1] bg-[#eef2ff] text-[#4338ca]"
                    : "border-[#e6e6ed] text-[#64748b] hover:border-[#c7d2fe]"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#6366f1] p-3 space-y-3">
      {/* Sub-type selector (only for FILL / MATCHING families) */}
      {isFamily && renderSubTypeSelector()}

      {/* Content / prompt */}
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Question content / prompt
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="The question text the student sees…"
          className={`${inputCls()} resize-none ${showErrors && contentEmpty ? "border-[#ef4444]" : ""}`}
        />
        {showErrors && contentEmpty && (
          <p className="text-[10px] text-[#ef4444] mt-1 font-extrabold">
            Content is required
          </p>
        )}
      </div>

      {/* Per-type editor (with error highlighting) */}
      {renderTypeEditor()}

      {showErrors && !ok && (
        <div className="bg-[#fff1f2] border-2 border-[#fecdd3] rounded-xl p-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#be123c] mb-1">
            Please complete required fields
          </p>
          <ul className="space-y-0.5">
            {Object.entries(errors).map(([k, v]) => (
              <li key={k} className="text-[10px] text-[#be123c] font-bold">
                • {v}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#94a3b8]">
          {draftSavedAt ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              Draft saved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" />
              Not saved as draft
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 rounded-xl text-xs font-extrabold text-[#64748b] hover:bg-[#f1f1f6]"
          >
            Cancel
          </button>
          <StackedButton
            tone="indigo"
            size="sm"
            onClick={handleSubmit}
            className={(showErrors && (!ok || contentEmpty)) ? "opacity-50" : ""}
          >
            {mode === "edit" ? "✓ Save changes" : "+ Add question"}
          </StackedButton>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Add Group Modal (question type + count + title + instructions)
// =====================================================================
function AddGroupModal({ onClose, onCreated, partId, defaultFrom = 1 }) {
  const [selected, setSelected] = useState("MCQ");
  const [quantity, setQuantity] = useState(4);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    setBusy(true);
    try {
      // If user picked a sub-type, `selected` is already a BE enum
      // (e.g. SUMMARY_COMPLETION). Otherwise translate canvas → BE.
      const isSubType = Object.values(subTypesByFamily)
        .flat()
        .some((s) => s.key === selected);
      const beType = isSubType
        ? selected
        : TYPE_CANVAS_TO_BACKEND[selected] || "OTHER";
      await createGroupOfQuestionsAPI({
        idPart: partId,
        questionType: beType,
        title,
        instructions,
        quantity: Number(quantity) || 0,
        order: defaultFrom,
      });
      message.success("Group created");
      onCreated?.();
    } catch {
      message.error("Create group failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1e1b4b]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[28px] border-2 border-[#e6e6ed] shadow-[0_8px_0_#e6e6ed] w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-[#e6e6ed] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1]">
              Step 1/2
            </div>
            <h3 className="text-xl font-black text-[#1e1b4b]">
              Choose question type
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-[#f1f1f6] flex items-center justify-center text-[#64748b] text-lg"
          >
            ×
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.keys(typeMeta).map((t) => {
              const meta = typeMeta[t];
              const sel = selected === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelected(t)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    sel
                      ? "border-[#6366f1] bg-[#eef2ff] shadow-[0_3px_0_#4338ca]"
                      : "border-[#e6e6ed] hover:border-[#6366f1]/40"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${meta.color} text-white flex items-center justify-center text-sm font-black mb-2`}
                  >
                    {meta.icon}
                  </div>
                  <div className="font-extrabold text-[#1e1b4b] text-xs">
                    {meta.label}
                  </div>
                  <div className="text-[9px] text-[#64748b] mt-0.5">
                    {meta.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sub-type selector (only for FILL_IN_THE_BLANK / MATCHING) */}
          {subTypesByFamily[selected] && (
            <div className="mt-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
                Choose a more specific sub-type
              </span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {subTypesByFamily[selected].map((s) => {
                  const active = selected === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSelected(s.key)}
                      className={`px-3 py-2 rounded-xl border-2 text-xs font-extrabold transition-all text-left ${
                        active
                          ? "border-[#6366f1] bg-[#eef2ff] text-[#4338ca]"
                          : "border-[#e6e6ed] text-[#64748b] hover:border-[#c7d2fe]"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-5 grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-[#64748b] block mb-1.5">
                Number of questions
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className={inputCls()}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-[#64748b] block mb-1.5">
                Start question
              </label>
              <input
                type="number"
                value={defaultFrom}
                disabled
                className={`${inputCls()} opacity-60`}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs font-bold uppercase text-[#64748b] block mb-1.5">
              Title / Instructions
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Questions 10-13. Complete the summary..."
              className={inputCls()}
            />
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="Detailed instructions (optional)..."
              className={`${inputCls()} mt-2 resize-none`}
            />
          </div>
        </div>
        <div className="p-4 border-t-2 border-[#e6e6ed] bg-[#fafafc] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-bold text-[#64748b] hover:text-[#1e1b4b]"
          >
            Cancel
          </button>
          <StackedButton tone="indigo" onClick={handleCreate} className={busy ? "opacity-60" : ""}>
            {busy ? "Creating..." : "Create group →"}
          </StackedButton>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Listening: audio card (read-only display; upload is via TestInfoEditor)
// =====================================================================
function ListeningAudioCard({ exam, partDetail }) {
  const audioUrl = exam?.audioUrl || exam?.audio || null;
  return (
    <div className="bg-white rounded-3xl border-2 border-[#06b6d4] shadow-[0_3px_0_#0891b2] p-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#06b6d4] text-white flex items-center justify-center text-lg flex-none shadow-[0_2px_0_#0891b2]">
          🎧
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[#1e1b4b] text-sm">
            Test audio
          </div>
          <div className="text-xs text-[#64748b] font-medium truncate">
            {audioUrl ? audioUrl : "No audio yet — upload in the Settings tab"}
          </div>
        </div>
        {audioUrl && (
          <audio controls src={audioUrl} className="h-9" />
        )}
      </div>
    </div>
  );
}

export default QuestionGroups;
