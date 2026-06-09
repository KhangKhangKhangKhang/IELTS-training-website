import React from "react";
import { Input } from "antd";
import MatchingPreview from "@/components/magicpath/ielts-test-editor/MatchingPreview";

// Clickable answer card — used for the correct-answer picker.
const AnswerCard = ({ active, label, text, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-left text-xs transition-all ${
      disabled
        ? "border-[#e6e6ed] bg-[#fafafc] text-[#94a3b8] cursor-not-allowed"
        : active
          ? "border-[#6366f1] bg-[#eef2ff] text-[#4338ca] shadow-[0_2px_0_#4338ca]"
          : "border-[#e6e6ed] bg-white text-[#1e1b4b] hover:border-[#c7d2fe]"
    }`}
  >
    <span className="font-mono font-extrabold w-6 text-center flex-none">{label}</span>
    <span className="flex-1 min-w-0">
      {text || <span className="italic text-[#94a3b8]">—</span>}
    </span>
    {active && <span className="flex-none text-[#10b981]">✓</span>}
  </button>
);

// MATCHING_HEADING — per-question: just pick the correct heading index.
const MatchingHeadingForm = ({ value = {}, onChange, pool = {}, questionIndex = 0 }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const headings = pool.headings || [];
  const correctIdx = Number.isInteger(value.correctHeadingIndex) ? value.correctHeadingIndex : -1;
  const paraLabel = String.fromCharCode(65 + questionIndex); // A, B, C…
  return (
    <div className="space-y-3">
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct heading (click to pick)
        </span>
        {headings.length === 0 ? (
          <div className="text-[10px] text-[#be123c] italic font-bold">
            ⚠ Add headings in the matching pool above first.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {headings.map((h, i) => (
              <AnswerCard
                key={`${h.label}-${i}`}
                label={h.label}
                text={h.text}
                active={i === correctIdx}
                onClick={() => update({ correctHeadingIndex: i })}
              />
            ))}
          </div>
        )}
      </div>

      <MatchingPreview
        qType="MATCHING_HEADING"
        metadata={{ ...value, headings, paragraphLabel: paraLabel }}
        content={value.statement || ""}
      />
    </div>
  );
};

// MATCHING_INFORMATION — per-question: statement + correctParagraph
const MatchingInfoForm = ({ value = {}, onChange, pool = {} }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const labels = pool.paragraphLabels || [];
  const correct = value.correctParagraph;
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Statement (what the student reads)
        </span>
        <Input.TextArea
          value={value.statement}
          onChange={(e) => update({ statement: e.target.value })}
          rows={2}
          placeholder="e.g. The author mentions renewable energy sources in…"
        />
      </label>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct paragraph (click to pick)
        </span>
        {labels.length === 0 ? (
          <div className="text-[10px] text-[#be123c] italic font-bold">
            ⚠ Add paragraph labels in the matching pool above first.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {labels.map((l) => (
              <AnswerCard
                key={l}
                label={l}
                text=""
                active={l === correct}
                onClick={() => update({ correctParagraph: l })}
              />
            ))}
          </div>
        )}
      </div>

      <MatchingPreview
        qType="MATCHING_INFORMATION"
        metadata={{ ...value, paragraphLabels: labels }}
        content={value.statement || ""}
      />
    </div>
  );
};

// MATCHING_FEATURES — per-question: statement + correctFeatureLabel
const MatchingFeaturesForm = ({ value = {}, onChange, pool = {} }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const features = pool.features || [];
  const correct = value.correctFeatureLabel;
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Statement (which feature is being described)
        </span>
        <Input.TextArea
          value={value.statement}
          onChange={(e) => update({ statement: e.target.value })}
          rows={2}
          placeholder="e.g. proposed the theory of evolution"
        />
      </label>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct feature (click to pick)
        </span>
        {features.length === 0 ? (
          <div className="text-[10px] text-[#be123c] italic font-bold">
            ⚠ Add features in the matching pool above first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {features.map((f) => (
              <AnswerCard
                key={f.label}
                label={f.label}
                text={f.text}
                active={f.label === correct}
                onClick={() => update({ correctFeatureLabel: f.label })}
              />
            ))}
          </div>
        )}
      </div>

      <MatchingPreview
        qType="MATCHING_FEATURES"
        metadata={{ ...value, features }}
        content={value.statement || ""}
      />
    </div>
  );
};

// MATCHING_SENTENCE_ENDINGS — per-question: sentenceStem + correctEndingLabel
const MatchingSentenceEndingsForm = ({ value = {}, onChange, pool = {} }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const endings = pool.endings || [];
  const correct = value.correctEndingLabel;
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Sentence stem (incomplete sentence)
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
          Correct ending (click to pick)
        </span>
        {endings.length === 0 ? (
          <div className="text-[10px] text-[#be123c] italic font-bold">
            ⚠ Add endings in the matching pool above first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {endings.map((e) => (
              <AnswerCard
                key={e.label}
                label={e.label}
                text={e.text}
                active={e.label === correct}
                onClick={() => update({ correctEndingLabel: e.label })}
              />
            ))}
          </div>
        )}
      </div>

      <MatchingPreview
        qType="MATCHING_SENTENCE_ENDINGS"
        metadata={{ ...value, endings }}
        content={value.sentenceStem || ""}
      />
    </div>
  );
};

const MatchingForm = (props) => {
  const { qType, pool, ...rest } = props;
  switch (qType) {
    case "MATCHING_HEADING":
      return <MatchingHeadingForm {...rest} pool={pool} />;
    case "MATCHING_INFORMATION":
      return <MatchingInfoForm {...rest} pool={pool} />;
    case "MATCHING_FEATURES":
      return <MatchingFeaturesForm {...rest} pool={pool} />;
    case "MATCHING_SENTENCE_ENDINGS":
      return <MatchingSentenceEndingsForm {...rest} pool={pool} />;
    default:
      return (
        <div className="text-xs text-[#94a3b8] italic">
          Unsupported matching sub-type: {qType}
        </div>
      );
  }
};

export default MatchingForm;
