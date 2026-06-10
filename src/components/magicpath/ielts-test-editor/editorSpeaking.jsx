import React, { useState, useEffect } from "react";
import { message } from "antd";
import { StackedButton, inputCls } from "./editorUI";
import {
  createSpeakingTask,
  updateSpeakingTask,
  deleteSpeakingTask,
  createSpeakingQuestion,
  getSpeakingQuestionsByTaskId,
  updateSpeakingQuestion,
  deleteSpeakingQuestion,
} from "@/services/apiSpeaking";
import { getDetailInTestAPI } from "@/services/apiDoTest";

export function SpeakingEditor({ idTest, onChange }) {
  const [parts, setParts] = useState([]);
  const [activePartId, setActivePartId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingPart, setCreatingPart] = useState(false);
  const [showQModal, setShowQModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    if (!idTest) return;
    loadParts();
  }, [idTest]);

  const loadParts = async () => {
    try {
      setLoading(true);
      const res = await getDetailInTestAPI(idTest);
      const arr = res?.data?.speakingTasks || [];
      const sorted = [...arr].sort((a, b) => (a.part || "").localeCompare(b.part || ""));
      setParts(sorted);
      if (sorted.length > 0 && !activePartId) setActivePartId(sorted[0].idSpeakingTask);
      onChange?.({ parts: sorted });
    } catch (e) {
      console.error(e);
      message.error("Failed to load parts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activePartId) {
      setQuestions([]);
      return;
    }
    (async () => {
      try {
        const res = await getSpeakingQuestionsByTaskId(activePartId);
        setQuestions(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setQuestions([]);
      }
    })();
  }, [activePartId]);

  const handleCreatePart = async () => {
    if (creatingPart) return;
    setCreatingPart(true);
    try {
      const nextNum = parts.length + 1;
      const name = `PART${nextNum}`;
      await createSpeakingTask({ idTest, title: name, part: name });
      message.success(`Created ${name}`);
      await loadParts();
    } catch (e) {
      message.error("Failed to create part");
    } finally {
      setCreatingPart(false);
    }
  };

  const handleRenamePart = async (idPart, newName) => {
    try {
      await updateSpeakingTask(idPart, { part: newName, title: newName });
      message.success("Renamed");
      await loadParts();
    } catch {
      message.error("Rename failed");
    }
  };

  const handleDeletePart = async (idPart) => {
    if (!window.confirm("Delete this part?")) return;
    try {
      await deleteSpeakingTask(idPart);
      message.success("Deleted");
      if (activePartId === idPart) setActivePartId(null);
      await loadParts();
    } catch {
      message.error("Delete failed");
    }
  };

  const handleSaveQuestion = async (payload) => {
    try {
      if (editingQuestion?.idSpeakingQuestion) {
        await updateSpeakingQuestion(editingQuestion.idSpeakingQuestion, payload);
        message.success("Question updated");
      } else {
        await createSpeakingQuestion({ ...payload, idSpeakingTask: activePartId });
        message.success("Question added");
      }
      setShowQModal(false);
      setEditingQuestion(null);
      // refresh
      const res = await getSpeakingQuestionsByTaskId(activePartId);
      setQuestions(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      message.error("Save question failed");
    }
  };

  const handleDeleteQuestion = async (q) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteSpeakingQuestion(q.idSpeakingQuestion);
      message.success("Deleted");
      const res = await getSpeakingQuestionsByTaskId(activePartId);
      setQuestions(Array.isArray(res?.data) ? res.data : []);
    } catch {
      message.error("Delete failed");
    }
  };

  const activePart = parts.find((p) => p.idSpeakingTask === activePartId);

  if (loading) {
    return (
      <div className="text-center text-[#94a3b8] py-12 font-bold">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Part selector */}
      <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] mr-2">
            Part:
          </div>
          {parts.map((p) => (
            <button
              key={p.idSpeakingTask}
              onClick={() => setActivePartId(p.idSpeakingTask)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activePartId === p.idSpeakingTask
                  ? "bg-[#a855f7] text-white shadow-[0_3px_0_#7e22ce]"
                  : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"
              }`}
            >
              {p.part || p.title}
            </button>
          ))}
          <button
            onClick={handleCreatePart}
            disabled={creatingPart}
            className="px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-dashed border-[#e9d5ff] text-[#a855f7] hover:bg-[#faf5ff]"
          >
            + Add Part
          </button>
        </div>
      </div>

      {!activePartId ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#e6e6ed] p-12 text-center">
          <div className="text-4xl mb-2">🗣️</div>
          <div className="font-extrabold text-[#1e1b4b]">No parts yet</div>
          <div className="text-xs text-[#64748b] mt-1 mb-4 font-medium">
            Create the first part to start adding questions
          </div>
          <StackedButton tone="purple" onClick={handleCreatePart}>
            + Create Part
          </StackedButton>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#1e1b4b]">
                {questions.length} questions
              </h2>
              <div className="text-xs text-[#64748b] font-medium">
                {activePart?.part || "Part"} · Each question has prep + speak time
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newName = window.prompt("New part name:", activePart?.part || "");
                  if (newName) handleRenamePart(activePartId, newName);
                }}
                className="text-xs font-extrabold text-[#64748b] uppercase tracking-wide hover:text-[#1e1b4b]"
              >
                ✏️ Rename
              </button>
              <button
                onClick={() => handleDeletePart(activePartId)}
                className="text-xs font-extrabold text-[#fb7185] uppercase tracking-wide hover:underline"
              >
                🗑 Delete Part
              </button>
              <StackedButton
                tone="purple"
                onClick={() => {
                  setEditingQuestion(null);
                  setShowQModal(true);
                }}
              >
                + Create Topic
              </StackedButton>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] overflow-hidden">
            <div className="px-5 py-3 border-b-2 border-[#e6e6ed] bg-[#faf5ff] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🏷️</span>
                <span className="font-black text-[#7e22ce]">
                  {activePart?.part || "Part"}
                </span>
                <span className="text-[10px] font-extrabold uppercase bg-[#f3e8ff] text-[#7e22ce] px-2 py-0.5 rounded-full">
                  {questions.length} questions
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setShowQModal(true);
                }}
                className="text-xs font-extrabold text-[#a855f7] uppercase tracking-wide"
              >
                + Add question
              </button>
            </div>
            <div className="p-4 space-y-3">
              {questions.length === 0 ? (
                <div className="text-center text-[#94a3b8] text-xs py-6 italic">
                  No questions in this part yet
                </div>
              ) : (
                questions.map((q, i) => (
                  <div
                    key={q.idSpeakingQuestion || i}
                    className="flex gap-3 p-3 rounded-2xl bg-[#fafafc] border-2 border-[#e6e6ed] hover:border-[#a855f7]/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#a855f7] text-white shadow-[0_2px_0_#7e22ce] flex items-center justify-center font-black text-xs flex-none">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1e1b4b] flex-1">
                          {q.content || q.prompt || "(Empty question)"}
                        </p>
                      </div>
                      {q.subPrompts?.length > 0 && (
                        <div className="mt-1.5 pl-3 border-l-2 border-[#e9d5ff] space-y-0.5">
                          {q.subPrompts.map((s, si) => (
                            <p key={si} className="text-xs text-[#64748b] font-medium">
                              • {s}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 text-[10px] text-[#64748b] font-bold w-24 border-l-2 border-[#e6e6ed] pl-3 justify-center flex-none">
                      <div>
                        ⚙️ Prep: <b className="text-[#1e1b4b]">{q.prep || 0}s</b>
                      </div>
                      <div>
                        ⏱ Speak: <b className="text-[#1e1b4b]">{q.speak || 0}s</b>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 justify-center flex-none">
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setShowQModal(true);
                        }}
                        className="w-7 h-7 rounded-lg hover:bg-[#f1f1f6] flex items-center justify-center text-[#64748b]"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q)}
                        className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] flex items-center justify-center text-[#fb7185]"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setEditingQuestion(null);
              setShowQModal(true);
            }}
            className="w-full p-5 rounded-3xl border-2 border-dashed border-[#e6e6ed] text-[#64748b] hover:border-[#a855f7] hover:text-[#a855f7] hover:bg-[#faf5ff] transition-all"
          >
            <div className="text-3xl mb-1">🗣️</div>
            <div className="text-sm font-extrabold uppercase tracking-wide">
              Create new question
            </div>
          </button>

          {showQModal && (
            <SpeakingQuestionModal
              existing={editingQuestion}
              onClose={() => {
                setShowQModal(false);
                setEditingQuestion(null);
              }}
              onSave={handleSaveQuestion}
            />
          )}
        </>
      )}
    </div>
  );
}

function SpeakingQuestionModal({ existing, onClose, onSave }) {
  const [prompt, setPrompt] = useState(existing?.content || existing?.prompt || "");
  const [subs, setSubs] = useState(
    existing?.subPrompts?.length ? existing.subPrompts : [""]
  );
  const [prep, setPrep] = useState(existing?.prep ?? 0);
  const [speak, setSpeak] = useState(existing?.speak ?? 60);

  const handleSave = () => {
    if (!prompt.trim()) {
      message.warning("Enter question content");
      return;
    }
    onSave({
      content: prompt,
      prompt,
      subPrompts: subs.filter((s) => s.trim()),
      prep: Number(prep) || 0,
      speak: Number(speak) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1e1b4b]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[28px] border-2 border-[#e6e6ed] shadow-[0_8px_0_#e6e6ed] w-full max-w-xl overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-[#e6e6ed] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#a855f7]">
              Speaking
            </div>
            <h3 className="text-xl font-black text-[#1e1b4b]">
              {existing ? "Edit" : "Create"} question
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-[#f1f1f6] flex items-center justify-center text-[#64748b] text-lg"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-extrabold uppercase text-[#64748b] block mb-1.5">
                Prep (seconds)
              </span>
              <input
                type="number"
                min={0}
                value={prep}
                onChange={(e) => setPrep(Number(e.target.value) || 0)}
                className={inputCls()}
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-extrabold uppercase text-[#64748b] block mb-1.5">
                Speak (seconds)
              </span>
              <input
                type="number"
                min={0}
                value={speak}
                onChange={(e) => setSpeak(Number(e.target.value) || 0)}
                className={inputCls()}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] font-extrabold uppercase text-[#64748b] block mb-1.5">
              Question content
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className={`${inputCls()} resize-none`}
              placeholder="Enter the Speaking question content..."
            />
          </label>
          <div>
            <span className="text-[11px] font-extrabold uppercase text-[#64748b] block mb-1.5">
              Suggested answers (sub-prompts)
            </span>
            <div className="space-y-2">
              {subs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s}
                    onChange={(e) =>
                      setSubs((p) => p.map((x, xi) => (xi === i ? e.target.value : x)))
                    }
                    placeholder="Sub-prompt..."
                    className={`${inputCls()} text-sm`}
                  />
                  <button
                    onClick={() => setSubs((p) => p.filter((_, xi) => xi !== i))}
                    className="w-9 h-9 rounded-xl hover:bg-[#fff1f2] text-[#fb7185] flex items-center justify-center"
                  >
                    🗑
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSubs((p) => [...p, ""])}
                className="text-xs font-extrabold text-[#a855f7] uppercase tracking-wide"
              >
                + Add point
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 border-t-2 border-[#e6e6ed] bg-[#fafafc] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-bold text-[#64748b] hover:text-[#1e1b4b]"
          >
            Cancel
          </button>
          <StackedButton tone="purple" onClick={handleSave}>
            💾 Save question
          </StackedButton>
        </div>
      </div>
    </div>
  );
}

export default SpeakingEditor;
