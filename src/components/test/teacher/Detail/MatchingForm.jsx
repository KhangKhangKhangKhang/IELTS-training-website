import React from "react";
import { Input, Select, InputNumber } from "antd";
import { PlusOutlined } from "@ant-design/icons";

// Generic Matching wrapper that switches sub-type
// Sub-types: MATCHING_HEADING, MATCHING_INFORMATION, MATCHING_FEATURES, MATCHING_SENTENCE_ENDINGS
// Each has its own default metadata shape; the form dispatches by `qType`.

// MATCHING_HEADING
// { headings: [{label, text}], paragraphRef: string, correctHeadingIndex: number }
const MatchingHeadingForm = ({ value, onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const headings = value.headings || [];
  const setHeadingText = (idx, text) => {
    update({ headings: headings.map((h, i) => (i === idx ? { ...h, text } : h)) });
  };
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Paragraph reference (e.g. "Paragraph A")
        </span>
        <Input
          value={value.paragraphRef}
          onChange={(e) => update({ paragraphRef: e.target.value })}
          placeholder="Paragraph A"
        />
      </label>
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Headings (more than paragraphs)
        </span>
        <div className="space-y-1.5">
          {headings.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-extrabold text-[#1e1b4b] w-6 text-center text-xs">
                {h.label}
              </span>
              <Input
                value={h.text}
                onChange={(e) => setHeadingText(i, e.target.value)}
                placeholder="Heading text"
                size="small"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            update({
              headings: [
                ...headings,
                { label: `H${headings.length + 1}`, text: "" },
              ],
            })
          }
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
        >
          <PlusOutlined /> Add heading
        </button>
      </div>
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct heading
        </span>
        <Select
          className="w-full"
          value={value.correctHeadingIndex}
          onChange={(v) => update({ correctHeadingIndex: Number(v) })}
          options={headings.map((h, i) => ({ value: i, label: h.label }))}
          placeholder="Pick the correct heading"
        />
      </div>
    </div>
  );
};

// MATCHING_INFORMATION
// { statement, paragraphLabels: string[], correctParagraph: string }
const MatchingInfoForm = ({ value, onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const labels = value.paragraphLabels || [];
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Statement to match
        </span>
        <Input.TextArea
          value={value.statement}
          onChange={(e) => update({ statement: e.target.value })}
          rows={2}
        />
      </label>
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Paragraph labels (A, B, C…)
        </span>
        <div className="space-y-1.5">
          {labels.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={l}
                onChange={(e) =>
                  update({
                    paragraphLabels: labels.map((x, j) => (i === j ? e.target.value : x)),
                  })
                }
                placeholder="A"
                size="small"
                className="w-24"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            update({
              paragraphLabels: [...labels, String.fromCharCode(65 + labels.length)],
            })
          }
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
        >
          <PlusOutlined /> Add label
        </button>
      </div>
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct paragraph
        </span>
        <Select
          className="w-full"
          value={value.correctParagraph}
          onChange={(v) => update({ correctParagraph: v })}
          options={labels.map((l) => ({ value: l, label: l }))}
          placeholder="Pick the correct paragraph"
        />
      </div>
    </div>
  );
};

// MATCHING_FEATURES
// { statement, features: [{label, text}], correctFeatureLabel: string }
const MatchingFeaturesForm = ({ value, onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const features = value.features || [];
  const setFeatureText = (idx, text) => {
    update({ features: features.map((f, i) => (i === idx ? { ...f, text } : f)) });
  };
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Statement
        </span>
        <Input.TextArea
          value={value.statement}
          onChange={(e) => update({ statement: e.target.value })}
          rows={2}
        />
      </label>
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Features / people
        </span>
        <div className="space-y-1.5">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-extrabold text-[#1e1b4b] w-6 text-center text-xs">
                {f.label}
              </span>
              <Input
                value={f.text}
                onChange={(e) => setFeatureText(i, e.target.value)}
                size="small"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            update({
              features: [
                ...features,
                { label: `F${features.length + 1}`, text: "" },
              ],
            })
          }
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
        >
          <PlusOutlined /> Add feature
        </button>
      </div>
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct feature
        </span>
        <Select
          className="w-full"
          value={value.correctFeatureLabel}
          onChange={(v) => update({ correctFeatureLabel: v })}
          options={features.map((f) => ({ value: f.label, label: f.label }))}
          placeholder="Pick the correct feature"
        />
      </div>
    </div>
  );
};

// MATCHING_SENTENCE_ENDINGS
// { sentenceStem: string, endings: [{label, text}], correctEndingLabel: string }
const MatchingSentenceEndingsForm = ({ value, onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const endings = value.endings || [];
  const setEndingText = (idx, text) => {
    update({ endings: endings.map((e, i) => (i === idx ? { ...e, text } : e)) });
  };
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Sentence stem (beginning)
        </span>
        <Input.TextArea
          value={value.sentenceStem}
          onChange={(e) => update({ sentenceStem: e.target.value })}
          rows={2}
          placeholder="e.g. The capital of France is…"
        />
      </label>
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Possible endings
        </span>
        <div className="space-y-1.5">
          {endings.map((e, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-extrabold text-[#1e1b4b] w-6 text-center text-xs">
                {e.label}
              </span>
              <Input
                value={e.text}
                onChange={(e) => setEndingText(i, e.target.value)}
                size="small"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            update({
              endings: [
                ...endings,
                { label: `E${endings.length + 1}`, text: "" },
              ],
            })
          }
          className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#6366f1] uppercase tracking-wide hover:underline"
        >
          <PlusOutlined /> Add ending
        </button>
      </div>
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct ending
        </span>
        <Select
          className="w-full"
          value={value.correctEndingLabel}
          onChange={(v) => update({ correctEndingLabel: v })}
          options={endings.map((e) => ({ value: e.label, label: e.label }))}
          placeholder="Pick the correct ending"
        />
      </div>
    </div>
  );
};

const MatchingForm = (props) => {
  const { qType, ...rest } = props;
  switch (qType) {
    case "MATCHING_HEADING":
      return <MatchingHeadingForm {...rest} />;
    case "MATCHING_INFORMATION":
      return <MatchingInfoForm {...rest} />;
    case "MATCHING_FEATURES":
      return <MatchingFeaturesForm {...rest} />;
    case "MATCHING_SENTENCE_ENDINGS":
      return <MatchingSentenceEndingsForm {...rest} />;
    default:
      return (
        <div className="text-xs text-[#94a3b8] italic">
          Unsupported matching sub-type: {qType}
        </div>
      );
  }
};

export default MatchingForm;
