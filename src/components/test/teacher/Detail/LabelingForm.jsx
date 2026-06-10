import React from "react";
import { Input, InputNumber, Upload, Checkbox } from "antd";
import { PlusOutlined, UploadOutlined, PictureOutlined } from "@ant-design/icons";

// DIAGRAM_LABELING
// BE metadata: { imageUrl, labelCoordinate: {x, y}, pointLabel, hasWordBank, wordBank?, correctAnswers[] }
const defaultValue = () => ({
  type: "DIAGRAM_LABELING",
  imageUrl: "",
  labelCoordinate: { x: 50, y: 50 },
  pointLabel: "",
  hasWordBank: false,
  wordBank: [],
  correctAnswers: [""],
});

const LabelingForm = ({ value = defaultValue(), onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });

  const setAnswer = (idx, text) => {
    update({
      correctAnswers: value.correctAnswers.map((a, i) => (i === idx ? text : a)),
    });
  };

  const addWord = () => {
    update({
      wordBank: [...(value.wordBank || []), { id: `w${Date.now()}`, text: "" }],
    });
  };

  const updateWord = (idx, text) => {
    update({
      wordBank: value.wordBank.map((w, i) => (i === idx ? { ...w, text } : w)),
    });
  };

  const removeWord = (idx) => {
    update({ wordBank: value.wordBank.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Diagram image
        </span>
        {value.imageUrl ? (
          <div className="flex items-center gap-2">
            <img
              src={value.imageUrl}
              alt="diagram"
              className="w-24 h-24 object-cover rounded-xl border-2 border-[#e6e6ed]"
            />
            <button
              onClick={() => update({ imageUrl: "" })}
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
              // For demo: use object URL. In production, upload to BE and store URL.
              const url = URL.createObjectURL(file);
              update({ imageUrl: url });
              return false;
            }}
            onRemove={() => update({ imageUrl: "" })}
            showUploadList={false}
            accept="image/*"
          >
            <button className="px-4 py-2 rounded-xl border-2 border-dashed border-[#c7d2fe] text-[#6366f1] text-xs font-extrabold uppercase tracking-wide hover:bg-[#eef2ff] flex items-center gap-2">
              <UploadOutlined /> <PictureOutlined /> Upload image
            </button>
          </Upload>
        )}
        <p className="text-[10px] text-[#94a3b8] mt-1">
          Or paste a URL below. Image URL is stored in the question metadata.
        </p>
        <Input
          value={value.imageUrl}
          onChange={(e) => update({ imageUrl: e.target.value })}
          placeholder="https://example.com/diagram.png"
          size="small"
        />
      </div>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Point label on image (e.g. "1", "A")
        </span>
        <Input
          value={value.pointLabel}
          onChange={(e) => update({ pointLabel: e.target.value })}
          placeholder="1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            X position (% of image width)
          </span>
          <InputNumber
            min={0}
            max={100}
            value={value.labelCoordinate?.x ?? 50}
            onChange={(v) =>
              update({ labelCoordinate: { ...value.labelCoordinate, x: Number(v) || 0 } })
            }
            className="w-full"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Y position (% of image height)
          </span>
          <InputNumber
            min={0}
            max={100}
            value={value.labelCoordinate?.y ?? 50}
            onChange={(v) =>
              update({ labelCoordinate: { ...value.labelCoordinate, y: Number(v) || 0 } })
            }
            className="w-full"
          />
        </label>
      </div>

      <Checkbox
        checked={value.hasWordBank}
        onChange={(e) =>
          update({
            hasWordBank: e.target.checked,
            wordBank: e.target.checked && !value.wordBank?.length
              ? [{ id: "w1", text: "" }]
              : value.wordBank,
          })
        }
      >
        Use word bank
      </Checkbox>

      {value.hasWordBank && (
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
            Word bank
          </span>
          <div className="space-y-1.5">
            {value.wordBank.map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={w.text}
                  onChange={(e) => updateWord(i, e.target.value)}
                  size="small"
                />
                <button
                  onClick={() => removeWord(i)}
                  className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addWord}
            className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
          >
            <PlusOutlined /> Add word
          </button>
        </div>
      )}

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct answer(s) for this label
        </span>
        <div className="space-y-1.5">
          {value.correctAnswers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={ans}
                onChange={(e) => setAnswer(i, e.target.value)}
                size="small"
              />
              {value.correctAnswers.length > 1 && (
                <button
                  onClick={() =>
                    update({
                      correctAnswers: value.correctAnswers.filter((_, j) => j !== i),
                    })
                  }
                  className="w-7 h-7 rounded-lg hover:bg-[#fff1f2] text-[#fb7185] text-xs shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => update({ correctAnswers: [...value.correctAnswers, ""] })}
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
        >
          <PlusOutlined /> Add answer
        </button>
      </div>
    </div>
  );
};

export default LabelingForm;
