// Clickable tab pill for the speaking test header.
// Four visual states: done (✓ green), active (indigo border), available (white),
// locked (grayscale + 🔒). Clicking a locked tab does nothing (parent decides).
import { useState, useRef, useEffect } from 'react';

const PartTab = ({ done, active, available, locked, label, sub, num, onClick }) => {
  void available; // spec signature includes available; not consumed here
  const [showTip, setShowTip] = useState(false);
  const tipTimerRef = useRef(null);
  useEffect(() => () => {
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
  }, []);
  const stateClass = active ? 'active' : done ? 'done' : '';
  const handle = () => {
    if (locked) {
      setShowTip(true);
      if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
      tipTimerRef.current = setTimeout(() => setShowTip(false), 1500);
      return;
    }
    onClick?.();
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={handle}
        aria-disabled={locked}
        className={`flex items-center gap-3 px-4 py-2 rounded-2xl border-2 flex-none font-[inherit] text-[inherit] ${
          stateClass === 'active'
            ? 'bg-[#eef2ff] border-[#6366f1] shadow-[0_2px_0_#4338ca]'
            : stateClass === 'done'
            ? 'bg-[#d1fae5] border-[#10b981]/40'
            : 'bg-white border-[#e6e6ed]'
        } ${locked ? 'grayscale opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-[#6366f1]/50'}`}
        style={{ background: locked ? '#fff' : undefined }}
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
            stateClass === 'active'
              ? 'bg-[#6366f1] text-white'
              : stateClass === 'done'
              ? 'bg-[#10b981] text-white'
              : 'bg-[#f1f1f6] text-[#64748b]'
          }`}
        >
          {stateClass === 'done' ? '✓' : locked ? '🔒' : num}
        </div>
        <div>
          <div
            className={`text-xs font-extrabold ${
              stateClass === 'active'
                ? 'text-[#4338ca]'
                : stateClass === 'done'
                ? 'text-[#047857]'
                : 'text-[#64748b]'
            }`}
          >
            {label}
          </div>
          <div className="text-[10px] text-[#64748b]">{sub}</div>
        </div>
      </button>
      {showTip && locked && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-40 px-3 py-1.5 rounded-lg bg-[#1e1b4b] text-white text-[10px] font-extrabold whitespace-nowrap shadow-[0_3px_0_#0b0a1f]">
          Hoàn thành part trước
        </div>
      )}
    </div>
  );
};

export default PartTab;
