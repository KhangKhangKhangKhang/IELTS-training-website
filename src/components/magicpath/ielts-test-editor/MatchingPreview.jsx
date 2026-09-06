import React from "react";

// Card style for the student's view. `selected` = the correct answer.
const PreviewCard = ({ label, text, selected }) => (
  <div
    className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-xs transition-all ${
      selected
        ? "border-[#10b981] bg-[#d1fae5] text-[#047857]"
        : "border-[#e6e6ed] bg-white text-[#1e1b4b]"
    }`}
  >
    <span className="font-mono font-extrabold w-6 text-center flex-none">
      {label}
    </span>
    <span className="flex-1 min-w-0">
      {text || <span className="italic text-[#94a3b8]">—</span>}
    </span>
    {selected && <span className="flex-none">✓</span>}
  </div>
);

const HeadingPreview = ({ metadata }) => {
  const headings = metadata?.headings || [];
  const paraLabel = metadata?.paragraphLabel || "?";
  const correctIdx = Number(metadata?.correctHeadingIndex);
  return (
    <div className="space-y-3">
      <div className="text-sm text-[#1e1b4b] font-semibold leading-relaxed">
        Choose the correct heading for <b>Paragraph {paraLabel}</b>.
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {headings.map((h, i) => (
          <PreviewCard
            key={i}
            label={h.label}
            text={h.text}
            selected={i === correctIdx}
          />
        ))}
      </div>
    </div>
  );
};

const InformationPreview = ({ metadata, content }) => {
  const labels = metadata?.paragraphLabels || [];
  const correct = metadata?.correctParagraph;
  return (
    <div className="space-y-3">
      <div className="text-sm text-[#1e1b4b] font-semibold leading-relaxed">
        {metadata?.statement || content || "(statement not set)"}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        {labels.map((l) => (
          <PreviewCard
            key={l}
            label={l}
            text=""
            selected={l === correct}
          />
        ))}
      </div>
    </div>
  );
};

const FeaturesPreview = ({ metadata, content }) => {
  const features = metadata?.features || [];
  const correct = metadata?.correctFeatureLabel;
  return (
    <div className="space-y-3">
      <div className="text-sm text-[#1e1b4b] font-semibold leading-relaxed">
        {metadata?.statement || content || "(statement not set)"}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {features.map((f) => (
          <PreviewCard
            key={f.label}
            label={f.label}
            text={f.text}
            selected={f.label === correct}
          />
        ))}
      </div>
    </div>
  );
};

const EndingsPreview = ({ metadata, content }) => {
  const endings = metadata?.endings || [];
  const correct = metadata?.correctEndingLabel;
  return (
    <div className="space-y-3">
      <div className="text-sm text-[#1e1b4b] font-semibold leading-relaxed">
        {metadata?.sentenceStem || content || "(sentence stem not set)"}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {endings.map((e) => (
          <PreviewCard
            key={e.label}
            label={e.label}
            text={e.text}
            selected={e.label === correct}
          />
        ))}
      </div>
    </div>
  );
};

export default function MatchingPreview({ qType, metadata, content }) {
  const renderBody = () => {
    switch (qType) {
      case "MATCHING_HEADING":
        return <HeadingPreview metadata={metadata} />;
      case "MATCHING_INFORMATION":
        return <InformationPreview metadata={metadata} content={content} />;
      case "MATCHING_FEATURES":
        return <FeaturesPreview metadata={metadata} content={content} />;
      case "MATCHING_SENTENCE_ENDINGS":
        return <EndingsPreview metadata={metadata} content={content} />;
      default:
        return (
          <div className="text-xs text-[#94a3b8] italic">
            No preview available for {qType}
          </div>
        );
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-[#6366f1] bg-[#fafafc] p-3">
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4338ca] mb-2">
        👀 Student sees
      </div>
      {renderBody()}
    </div>
  );
}
