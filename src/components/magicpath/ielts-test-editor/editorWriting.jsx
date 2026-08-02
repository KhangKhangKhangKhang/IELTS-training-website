import React, { useState, useEffect, useMemo } from "react";
import { message, Upload } from "antd";
import { StackedButton, Field, inputCls } from "./editorUI";
import {
  createWritingTaskAPI,
  updateWritingTaskAPI,
  deleteWritingTaskAPI,
  getAllWritingTasksAPI,
} from "@/services/apiWriting";

export function WritingEditor({ idTest, onChange }) {
  const [task, setTask] = useState("TASK1");
  const [t1, setT1] = useState({
    id: null,
    title: "",
    timeLimit: 20,
    image: null,
    imageUrl: null,
    taskType: "TASK1",
  });
  const [t2, setT2] = useState({
    id: null,
    title: "",
    timeLimit: 40,
    taskType: "TASK2",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!idTest) return;
    (async () => {
      try {
        setLoading(true);
        const res = await getAllWritingTasksAPI(idTest);
        const arr = res?.data || [];
        const next1 = { ...t1 };
        const next2 = { ...t2 };
        arr.forEach((t) => {
          const base = {
            id: t.idWritingTask,
            title: t.title || "",
            timeLimit: t.timeLimit || t.time_limit || 0,
          };
          if ((t.taskType || t.task_type) === "TASK1") {
            next1.id = base.id;
            next1.title = base.title;
            next1.timeLimit = base.timeLimit || 20;
            next1.imageUrl = t.image || t.imageUrl || null;
          } else if ((t.taskType || t.task_type) === "TASK2") {
            next2.id = base.id;
            next2.title = base.title;
            next2.timeLimit = base.timeLimit || t.time_limit || 40;
          }
        });
        setT1(next1);
        setT2(next2);
        onChange?.({
          t1Done: !!next1.title.trim(),
          t2Done: !!next2.title.trim(),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, [idTest]);

  const isT1 = task === "TASK1";
  const current = isT1 ? t1 : t2;
  const setCurrent = isT1 ? setT1 : setT2;

  const updateField = (field, value) => {
    setCurrent((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file) => {
    if (!file) return;
    updateField("image", file);
    updateField("imageUrl", URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!current.title.trim()) {
        message.warning("Enter prompt before saving");
        setSaving(false);
        return;
      }
      const form = new FormData();
      form.append("idTest", idTest);
      form.append("taskType", current.taskType);
      form.append("title", current.title);
      form.append("timeLimit", Number(current.timeLimit) || 0);
      if (isT1 && current.image instanceof File) {
        form.append("image", current.image);
      }
      if (current.id) {
        await updateWritingTaskAPI(current.id, form);
        message.success("Task updated");
      } else {
        const res = await createWritingTaskAPI(form);
        const newId = res?.data?.idWritingTask;
        if (newId) updateField("id", newId);
        message.success("Task created");
      }
      onChange?.({
        t1Done: !!t1.title.trim(),
        t2Done: !!t2.title.trim(),
      });
    } catch (e) {
      console.error(e);
      message.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!current.id) {
      message.info("No task to delete");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteWritingTaskAPI(current.id);
      if (isT1) {
        setT1({ id: null, title: "", timeLimit: 20, image: null, imageUrl: null, taskType: "TASK1" });
      } else {
        setT2({ id: null, title: "", timeLimit: 40, taskType: "TASK2" });
      }
      message.success("Deleted");
    } catch (e) {
      console.error(e);
      message.error("Delete failed");
    }
  };

  const totalTime = (Number(t1.timeLimit) || 0) + (Number(t2.timeLimit) || 0);
  const bothDone = t1.title.trim() && t2.title.trim();

  if (loading) {
    return (
      <div className="text-center text-[#94a3b8] py-12 font-bold">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Task tabs */}
      <div className="flex items-center gap-2">
        {["TASK1", "TASK2"].map((k) => (
          <button
            key={k}
            onClick={() => setTask(k)}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl text-sm font-extrabold transition-all ${
              task === k
                ? "bg-[#fb7185] text-white shadow-[0_4px_0_#e11d48]"
                : "bg-white text-[#64748b] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] hover:border-[#fb7185]"
            }`}
          >
            {k === "TASK1" ? "📊 Task 1" : "🖋️ Task 2"}
            <span className="block text-[10px] font-bold opacity-80 normal-case">
              {k === "TASK1" ? "At least 150 words" : "At least 250 words"}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Form */}
        <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5 space-y-4">
          <h3 className="text-lg font-black text-[#1e1b4b]">
            {current.id ? `Edit ${task}` : `Create ${task}`}
          </h3>

          <Field label="Prompt">
            <textarea
              value={current.title}
              onChange={(e) => updateField("title", e.target.value)}
              rows={5}
              className={`${inputCls()} resize-none leading-relaxed`}
              placeholder="Enter the prompt content..."
            />
          </Field>

          <Field label="Time limit (minutes)">
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateField("timeLimit", Math.max(0, Number(current.timeLimit) - 5))}
                className="w-10 h-10 rounded-xl bg-white border-2 border-[#e6e6ed] font-black text-[#64748b] hover:border-[#fb7185]"
              >
                −
              </button>
              <input
                type="number"
                value={current.timeLimit}
                onChange={(e) => updateField("timeLimit", Number(e.target.value) || 0)}
                className={`${inputCls()} text-center w-24`}
              />
              <button
                onClick={() => updateField("timeLimit", Number(current.timeLimit) + 5)}
                className="w-10 h-10 rounded-xl bg-white border-2 border-[#e6e6ed] font-black text-[#64748b] hover:border-[#fb7185]"
              >
                +
              </button>
            </div>
          </Field>

          {isT1 && (
            <Field label="Image (chart / diagram)" hint="Required for Task 1">
              <Upload
                listType="picture-card"
                maxCount={1}
                beforeUpload={(file) => {
                  handleFileChange(file);
                  return false;
                }}
                onRemove={() => {
                  updateField("image", null);
                  updateField("imageUrl", null);
                }}
                fileList={
                  current.imageUrl
                    ? [
                        {
                          uid: "-1",
                          name: current.image?.name || "image",
                          status: "done",
                          url: current.imageUrl,
                        },
                      ]
                    : []
                }
              >
                {!current.imageUrl && (
                  <div className="text-[#64748b] text-xs font-extrabold">
                    + Upload image
                  </div>
                )}
              </Upload>
            </Field>
          )}
        </div>

        {/* Preview */}
        <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#fb7185] mb-3">
            👁 Preview (student view)
          </div>
          <div className="bg-[#fafafc] rounded-2xl border-2 border-[#e6e6ed] p-4 min-h-[280px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-extrabold uppercase bg-[#fff1f2] text-[#e11d48] px-2 py-0.5 rounded-full">
                {isT1 ? "Writing Task 1" : "Writing Task 2"}
              </span>
              <span className="text-[10px] font-bold text-[#64748b]">
                ⏱ {current.timeLimit || 0} min
              </span>
            </div>
            <p className="text-sm text-[#1e1b4b] leading-relaxed font-medium whitespace-pre-wrap">
              {current.title || <span className="text-[#cbd5e1]">No prompt yet...</span>}
            </p>
            {isT1 && current.imageUrl && (
              <img
                src={current.imageUrl}
                alt="Preview"
                loading="lazy"
                className="mt-4 max-w-full h-auto rounded-lg shadow-md border"
              />
            )}
            <div className="mt-4 border-t-2 border-dashed border-[#e6e6ed] pt-3">
              <div className="text-[10px] text-[#94a3b8] font-bold uppercase">
                Answer input
              </div>
              <div className="mt-1 h-20 rounded-xl bg-white border-2 border-[#e6e6ed]" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-[#fff1f2] border-2 border-[#fecdd3] rounded-2xl px-4 py-3 flex-wrap gap-2">
        <span className="text-xs font-bold text-[#be123c]">
          {bothDone
            ? `✓ Will save both tasks (total ${totalTime} min)`
            : "Enter prompts for both tasks to finish"}
        </span>
        <div className="flex items-center gap-2">
          {current.id && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 rounded-xl text-xs font-extrabold text-[#fb7185] hover:bg-white"
            >
              🗑 Delete
            </button>
          )}
          <StackedButton tone="coral" onClick={handleSave} className={saving ? "opacity-60" : ""}>
            💾 {saving ? "Saving..." : current.id ? "Update" : "Save Writing"}
          </StackedButton>
        </div>
      </div>
    </div>
  );
}

export default WritingEditor;
