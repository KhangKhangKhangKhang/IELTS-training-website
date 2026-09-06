import React from "react";
import { Input, InputNumber, Upload, Checkbox, Select } from "antd";
import { PlusOutlined, UploadOutlined, PictureOutlined } from "@ant-design/icons";

// FE-12b: only revoke when the URL is a blob: URL we created (avoid
// revoking server URLs that may be in imageUrl from props).
const isBlobUrl = (url) => typeof url === "string" && url.startsWith("blob:");

// DIAGRAM_LABELING — covers IELTS Plan / Map / Diagram Labelling.
//
// In IELTS Listening Part 2, a single image (map, plan, or diagram) carries
// multiple fillable points. Each point has its own label (e.g. "1", "A"),
// coordinates on the image, and one or more acceptable answers.
//
// BE metadata:
//   { kind: 'diagram' | 'map' | 'plan',
//     imageUrl: string,
//     labels: [{ label, x, y, correctAnswers[] }],
//     hasWordBank: boolean,
//     wordBank: [{ id, text }] }
//
// Backwards compat: a single `pointLabel` / `labelCoordinate` /
// `correctAnswers` on a saved question is upgraded to `labels: [...]` on load
// (handled in the QuestionQuickForm hydration step).

const KIND_OPTIONS = [
  { value: "diagram", label: "Diagram (machine / process)" },
  { value: "map", label: "Map (area / location)" },
  { value: "plan", label: "Plan (building / room layout)" },
];

const defaultValue = () => ({
  type: "DIAGRAM_LABELING",
  kind: "diagram",
  imageUrl: "",
  labels: [{ label: "1", x: 50, y: 50, correctAnswers: [""] }],
  hasWordBank: false,
  wordBank: [],
});

// Upgrade legacy single-point metadata to the new labels[] shape.
const upgradeLegacy = (raw) => {
  if (!raw) return defaultValue();
  if (Array.isArray(raw.labels) && raw.labels.length > 0) return raw;
  // Legacy: { pointLabel, labelCoordinate, correctAnswers }
  return {
    ...defaultValue(),
    ...raw,
    labels: [
      {
        label: raw.pointLabel || "1",
        x: raw.labelCoordinate?.x ?? 50,
        y: raw.labelCoordinate?.y ?? 50,
        correctAnswers: Array.isArray(raw.correctAnswers) && raw.correctAnswers.length > 0
          ? raw.correctAnswers
          : [""],
      },
    ],
  };
};

const LabelingForm = ({ value, onChange }) => {
  const v = upgradeLegacy(value);
  const update = (patch) => onChange({ ...v, ...patch });

  const setKind = (kind) => update({ kind });
  const setImage = (url) => {
    // FE-12b: revoke previous blob URL before swapping
    if (isBlobUrl(v.imageUrl)) URL.revokeObjectURL(v.imageUrl);
    update({ imageUrl: url });
  };

  const setLabelField = (idx, patch) => {
    update({
      labels: v.labels.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    });
  };

  const addLabel = () => {
    const nextNum = String(v.labels.length + 1);
    update({
      labels: [
        ...v.labels,
        { label: nextNum, x: 50, y: 50, correctAnswers: [""] },
      ],
    });
  };

  const removeLabel = (idx) => {
    if (v.labels.length <= 1) return;
    update({ labels: v.labels.filter((_, i) => i !== idx) });
  };

  const setAnswer = (lIdx, aIdx, text) => {
    const target = v.labels[lIdx];
    const nextAnswers = (target.correctAnswers || [""]).map((a, i) =>
      i === aIdx ? text : a
    );
    setLabelField(lIdx, { correctAnswers: nextAnswers });
  };

  const addAnswer = (lIdx) => {
    const target = v.labels[lIdx];
    setLabelField(lIdx, {
      correctAnswers: [...(target.correctAnswers || [""]), ""],
    });
  };

  const removeAnswer = (lIdx, aIdx) => {
    const target = v.labels[lIdx];
    if ((target.correctAnswers || []).length <= 1) return;
    setLabelField(lIdx, {
      correctAnswers: (target.correctAnswers || []).filter((_, i) => i !== aIdx),
    });
  };

  // Word bank (optional, group-shared via the matching pattern if you want
  // to promote it later — for now it lives on each question).
  const addWord = () => {
    update({
      wordBank: [...(v.wordBank || []), { id: `w${Date.now()}`, text: "" }],
    });
  };
  const updateWord = (idx, text) => {
    update({
      wordBank: (v.wordBank || []).map((w, i) => (i === idx ? { ...w, text } : w)),
    });
  };
  const removeWord = (idx) => {
    update({ wordBank: (v.wordBank || []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      {/* Kind selector */}
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Labelling type
        </span>
        <Select
          value={v.kind || "diagram"}
          onChange={setKind}
          options={KIND_OPTIONS}
          className="w-full"
        />
      </div>

      {/* Image upload */}
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Image (map / plan / diagram)
        </span>
        {v.imageUrl ? (
          <div className="flex items-center gap-2">
            <img
              src={v.imageUrl}
              alt="labeling"
              loading="lazy"
              className="w-24 h-24 object-cover rounded-xl border-2 border-[#e6e6ed]"
            />
            <button
              onClick={() => setImage("")}
              className="px-3 py-1.5 rounded-xl border-2 border-[#e6e6ed] text-[#64748b] hover:border-[#ef4444] hover:text-[#ef4444] text-xs font-extrabold"
            >
              Remove
            </button>
          </div>
        ) : (
          <Upload
            listType="picture"
            maxCount={1}
            beforeUpload={(file) => {
              // FE-12b: revoke previous blob URL if any, then create new one
              if (isBlobUrl(v.imageUrl)) URL.revokeObjectURL(v.imageUrl);
              const url = URL.createObjectURL(file);
              update({ imageUrl: url });
              return false;
            }}
            onRemove={() => {
              if (isBlobUrl(v.imageUrl)) URL.revokeObjectURL(v.imageUrl);
              update({ imageUrl: "" });
            }}
            showUploadList={false}
            accept="image/*"
          >
            <button
              type="button"
              className="px-4 py-2 rounded-xl border-2 border-dashed border-[#c7d2fe] text-[#6366f1] text-xs font-extrabold uppercase tracking-wide hover:bg-[#eef2ff] flex items-center gap-2"
            >
              <UploadOutlined /> <PictureOutlined /> Upload image
            </button>
          </Upload>
        )}
        <p className="text-[10px] text-[#94a3b8] mt-1">
          Or paste a URL below. Image URL is stored in the question metadata.
        </p>
        <Input
          value={v.imageUrl || ""}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/map.png"
          size="small"
        />
      </div>

      {/* Labels list */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b]">
            Labels on image ({v.labels.length})
          </span>
        </div>
        <div className="space-y-2">
          {v.labels.map((l, i) => (
            <div
              key={i}
              className="rounded-xl border-2 border-[#e6e6ed] bg-white p-2.5 space-y-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-7 h-7 rounded-lg bg-[#f59e0b] text-white flex items-center justify-center text-xs font-black flex-none">
                  {i + 1}
                </span>
                <Input
                  value={l.label || ""}
                  onChange={(e) => setLabelField(i, { label: e.target.value })}
                  placeholder='Label text (e.g. "1", "A")'
                  size="small"
                  className="!w-32"
                />
                <span className="text-[10px] text-[#94a3b8] font-bold">
                  position (% of image)
                </span>
                <InputNumber
                  min={0}
                  max={100}
                  value={l.x ?? 50}
                  onChange={(val) => setLabelField(i, { x: Number(val) || 0 })}
                  size="small"
                  className="!w-16"
                />
                <InputNumber
                  min={0}
                  max={100}
                  value={l.y ?? 50}
                  onChange={(val) => setLabelField(i, { y: Number(val) || 0 })}
                  size="small"
                  className="!w-16"
                />
                {v.labels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLabel(i)}
                    className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] text-xs flex-none ml-auto"
                    title="Remove label"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#94a3b8] block mb-1">
                  Correct answer(s)
                </span>
                <div className="space-y-1">
                  {(l.correctAnswers || [""]).map((ans, ai) => (
                    <div key={ai} className="flex items-center gap-2">
                      <Input
                        value={ans}
                        onChange={(e) => setAnswer(i, ai, e.target.value)}
                        size="small"
                        placeholder="e.g. Library"
                      />
                      {(l.correctAnswers || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAnswer(i, ai)}
                          className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] text-xs flex-none"
                          title="Remove answer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addAnswer(i)}
                  className="mt-1 text-[10px] font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
                >
                  + Add acceptable answer
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLabel}
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
        >
          <PlusOutlined /> Add label
        </button>
      </div>

      {/* Word bank */}
      <Checkbox
        checked={!!v.hasWordBank}
        onChange={(e) =>
          update({
            hasWordBank: e.target.checked,
            wordBank:
              e.target.checked && !(v.wordBank || []).length
                ? [{ id: "w1", text: "" }]
                : v.wordBank || [],
          })
        }
      >
        Use word bank
      </Checkbox>

      {v.hasWordBank && (
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Word bank
          </span>
          <div className="space-y-1.5">
            {(v.wordBank || []).map((w, i) => (
              <div key={w.id || i} className="flex items-center gap-2">
                <Input
                  value={w.text}
                  onChange={(e) => updateWord(i, e.target.value)}
                  size="small"
                />
                <button
                  type="button"
                  onClick={() => removeWord(i)}
                  className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] text-xs flex-none"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addWord}
            className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
          >
            <PlusOutlined /> Add word
          </button>
        </div>
      )}
    </div>
  );
};

export default LabelingForm;
