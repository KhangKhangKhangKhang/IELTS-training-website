import React from "react";
import { Input } from "antd";

// TRUE_FALSE_NOT_GIVEN
// BE metadata: { statement: string, correctAnswer: 'TRUE' | 'FALSE' | 'NOT_GIVEN' }
const OPTIONS = ["TRUE", "FALSE", "NOT_GIVEN"];

const defaultValue = () => ({
  statement: "",
  correctAnswer: "TRUE",    type: "TRUE_FALSE_NOT_GIVEN",
  });

const TFNGForm = ({ value = defaultValue(), onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Statement (question text)
        </span>
        <Input.TextArea
          value={value.statement}
          onChange={(e) => update({ statement: e.target.value })}
          rows={2}
          placeholder="The statement the student must judge as TRUE / FALSE / NOT GIVEN"
        />
      </label>
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] block mb-1.5">
          Correct answer
        </span>
        <div className="flex gap-2">
          {OPTIONS.map((opt) => {
            const selected = value.correctAnswer === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => update({ correctAnswer: opt })}
                className={`flex-1 px-3 py-2 rounded-xl border-2 text-xs font-extrabold uppercase transition-all ${
                  selected
                    ? "border-[#10b981] bg-[#d1fae5] text-[#047857]"
                    : "border-[#e6e6ed] text-[#64748b] hover:border-[#c7d2fe]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TFNGForm;
