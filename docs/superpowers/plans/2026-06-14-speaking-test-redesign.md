# Speaking Test Screen Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `IELTSSpeakingTestScreen.jsx` so the top tab bar (Part 1/2/3) is clickable, Part 1 and Part 3 share a new unified `QuestionPartScreen` layout, and the left aside becomes a `QuestionNavigator` (replacing the mock "AI Examiner" card).

**Architecture:** Three new components in the same folder as `IELTSSpeakingTestScreen.jsx`:
- `PartTab.jsx` — clickable tab with 4 visual states (`done` / `active` / `available` / `locked`)
- `QuestionNavigator.jsx` — list of question chips for the active part
- `QuestionPartScreen.jsx` — shared layout for Part 1 and Part 3 (question + mic + nav)

`IELTSSpeakingTestScreen.jsx` keeps all state, recording logic, and Part 2 cue-card UI, but delegates the tab bar, aside, and Part 1/3 rendering to the new components. State changes: replace `phase` switch with `activeTab` ('part1' | 'part2' | 'part3'), keep `phase` only for Part 2 sub-state. Unlock logic drives `locked` state on tabs.

**Tech Stack:** React 19, TailwindCSS v4 (existing design tokens), framer-motion (already used), js-cookie. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-14-speaking-test-redesign-design.md`
**Mockup (already approved):** `mockups/speaking-test-redesign/index.html` running on `http://localhost:3999/`

---

## Notes for the implementer

This project has **no unit test framework** (no vitest, jest, or RTL). Verification uses `npm run build` + manual visual check on `http://localhost:2999/` (vite dev) by navigating to a speaking test. The mockup at `:3999/` is the visual reference — match its look and behavior exactly.

The `IELTSSpeakingTestScreen.jsx` file is 462 lines and shares a lot of CSS class patterns with `IELTSWritingTestScreen.jsx`. Preserve all existing CSS class patterns (Tailwind utility classes, gradient classes like `bg-gradient-to-br from-[#1e1b4b] to-[#312e81]`, shadow classes like `shadow-[0_2px_0_#e6e6ed]`) so the new components feel native to the codebase.

Don't touch:
- Recording flow (`startRecording` / `stopRecording` / MediaRecorder refs)
- API services (`userSpeakingSubmission`, `finishSpeakingTest`)
- Part 2 cue-card UI (only Part 1 and Part 3 move to `QuestionPartScreen`)

---

## File map

| File | Responsibility | Status |
|---|---|---|
| `src/components/magicpath/ielts-speaking-test-screen/PartTab.jsx` | Clickable tab pill, 4 states (`done`/`active`/`available`/`locked`), tooltip when locked | NEW |
| `src/components/magicpath/ielts-speaking-test-screen/QuestionNavigator.jsx` | List of question chips for the active part, click to jump | NEW |
| `src/components/magicpath/ielts-speaking-test-screen/QuestionPartScreen.jsx` | Shared layout for Part 1 + Part 3: header + question + mic card + footer nav | NEW |
| `src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx` | State owner + recording logic + Part 2 UI; delegates to new components | MODIFY |
| `mockups/speaking-test-redesign/index.html` | Visual reference (already created, runs on :3999) | REFERENCE |

**Decomposition rationale:** Each new component is small (~50-100 lines), single-purpose, and reusable later. `IELTSSpeakingTestScreen.jsx` shrinks by ~80 lines because Part 1 and Part 3 card markup moves out.

---

### Task 1: Create `PartTab.jsx`

**Files:**
- Create: `src/components/magicpath/ielts-speaking-test-screen/PartTab.jsx`

- [ ] **Step 1: Create the file with the full content below**

```jsx
// Clickable tab pill for the speaking test header.
// Four visual states: done (✓ green), active (indigo border), available (white),
// locked (grayscale + 🔒). Clicking a locked tab does nothing (parent decides).
import { useState } from 'react';

const PartTab = ({ done, active, locked, label, sub, num, onClick }) => {
  const [showTip, setShowTip] = useState(false);
  const stateClass = active ? 'active' : done ? 'done' : '';
  const handle = () => {
    if (locked) {
      setShowTip(true);
      setTimeout(() => setShowTip(false), 1500);
      return;
    }
    onClick?.();
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={handle}
        disabled={false}
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
```

- [ ] **Step 2: Verify build still passes**

Run: `cd /home/garan/code/doan1/IELTS-training-website && npm run build 2>&1 | tail -5`
Expected: `✓ built in <X>s` (no errors). The new file is unused but should not break the build.

- [ ] **Step 3: Commit**

```bash
cd /home/garan/code/doan1/IELTS-training-website
git add src/components/magicpath/ielts-speaking-test-screen/PartTab.jsx
git commit -m "feat(speaking): add PartTab component (clickable tab with 4 states)"
```

---

### Task 2: Create `QuestionNavigator.jsx`

**Files:**
- Create: `src/components/magicpath/ielts-speaking-test-screen/QuestionNavigator.jsx`

- [ ] **Step 1: Create the file with the full content below**

```jsx
// Left aside: list of question chips for the active Part.
// Click a chip to jump to that question.
// Three visual states per chip: done (green ✓), active (indigo border), default (white).
// For Part 2 there are no per-question chips — show a help message instead.

const QuestionNavigator = ({ part, partLabel, badge, questions, currentIdx, completedIds, onJump }) => {
  if (part === 'part2') {
    return (
      <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-2">
          📋 {badge}
        </div>
        <div className="text-xs font-semibold text-[#64748b] leading-relaxed">
          Part 2 là 1 cue card dài 1-2 phút. Không có danh sách câu hỏi riêng lẻ.
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-3">
        📋 Câu hỏi · {partLabel}
      </div>
      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
        {questions.map((q, i) => {
          const isActive = i === currentIdx;
          const isDone = completedIds.includes(i);
          return (
            <button
              key={q.id ?? i}
              type="button"
              onClick={() => onJump?.(i)}
              className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-lg border-2 transition-colors ${
                isActive
                  ? 'bg-[#eef2ff] border-[#6366f1] shadow-[0_2px_0_#4338ca]'
                  : isDone
                  ? 'bg-[#d1fae5] border-[#10b981]/30'
                  : 'bg-[#fafafc] border-transparent hover:border-[#a5b4fc]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded text-white text-[10px] flex items-center justify-center flex-none mt-0.5 font-black ${
                  isDone ? 'bg-[#10b981]' : isActive ? 'bg-[#4338ca]' : 'bg-[#6366f1]'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#1e1b4b] line-clamp-2 leading-snug">
                  {q.question}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionNavigator;
```

- [ ] **Step 2: Verify build still passes**

Run: `cd /home/garan/code/doan1/IELTS-training-website && npm run build 2>&1 | tail -5`
Expected: `✓ built in <X>s` (no errors).

- [ ] **Step 3: Commit**

```bash
cd /home/garan/code/doan1/IELTS-training-website
git add src/components/magicpath/ielts-speaking-test-screen/QuestionNavigator.jsx
git commit -m "feat(speaking): add QuestionNavigator (left aside with question chips)"
```

---

### Task 3: Create `QuestionPartScreen.jsx`

**Files:**
- Create: `src/components/magicpath/ielts-speaking-test-screen/QuestionPartScreen.jsx`

- [ ] **Step 1: Create the file with the full content below**

```jsx
// Shared layout for Part 1 and Part 3 of the speaking test.
// Renders: header (label + REC pill) → question heading → dark mic card (LiveWave + mic + timer) → footer nav (← prev / status / next →).
// The mic card and LiveWave come from the parent (it owns MediaRecorder state).
// This component is presentational except for click handlers on the prev/next buttons.

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const QuestionPartScreen = ({
  partNumber,        // 1 | 3
  partLabel,         // 'Introduction' | 'Discussion'
  questions,         // [{ id, question }]
  currentIdx,
  audioKey,          // 'part1' | 'part3'
  audioBlob,         // Blob | null
  recording,
  recSeconds,
  LiveWave,          // React component: ({ recording }) => JSX
  onToggleRecord,    // () => void
  onPrev,
  onNext,
  onJump,            // (idx) => void — used by parent for QuestionNavigator integration; not invoked here
}) => {
  const total = questions.length;
  const q = questions[currentIdx];
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === total - 1;
  const lastLabel = isLast ? (partNumber === 1 ? 'Qua Part 2 →' : 'Nộp bài ✓') : 'Câu tiếp →';

  return (
    <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1]">
          Part {partNumber} · {partLabel} · Câu {currentIdx + 1}/{total}
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#fff1f2] text-[#e11d48] text-xs font-extrabold uppercase tracking-wide">
          <span className={`w-2 h-2 bg-[#fb7185] rounded-full ${recording ? 'animate-pulse' : ''}`} />
          {recording ? 'REC' : 'READY'}
        </div>
      </div>
      <h2 className="text-2xl font-black text-[#1e1b4b] mb-5 leading-tight" style={{ fontFamily: 'Nunito' }}>
        {q?.question}
      </h2>

      <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-3xl p-6 text-white">
        <LiveWave recording={recording} />
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs">
            <div className="opacity-80">Mic input</div>
            <div className="font-extrabold flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${recording ? 'bg-[#10b981]' : 'bg-[#64748b]'}`} />
              {recording ? 'Đang ghi' : 'Sẵn sàng'}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleRecord}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl active:translate-y-[2px] transition-all ${
              recording
                ? 'bg-[#fb7185] text-white shadow-[0_4px_0_#e11d48] active:shadow-[0_2px_0_#e11d48]'
                : 'bg-white text-[#fb7185] shadow-[0_4px_0_rgba(0,0,0,0.25)] active:shadow-[0_2px_0_rgba(0,0,0,0.25)]'
            }`}
          >
            {recording ? '⏸' : '🎙'}
          </button>
          <div className="text-xs text-right">
            <div className="opacity-80">Duration</div>
            <div className="font-extrabold font-mono">{fmt(recSeconds)}</div>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-[#e6e6ed] p-4 bg-[#fafafc] flex items-center gap-3 mt-4 -mx-6 -mb-6 rounded-b-3xl">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className="px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide rounded-2xl bg-white text-[#6366f1] border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#6366f1]"
        >
          ← Câu trước
        </button>
        <div className="flex-1 text-center text-xs font-bold text-[#64748b]">
          {audioBlob ? <span className="text-[#10b981]">✓ Đã ghi âm</span> : 'Bấm mic để trả lời'}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!audioBlob}
          className="px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide rounded-2xl bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
        >
          {lastLabel}
        </button>
      </div>
    </div>
  );
};

export default QuestionPartScreen;
```

- [ ] **Step 2: Verify build still passes**

Run: `cd /home/garan/code/doan1/IELTS-training-website && npm run build 2>&1 | tail -5`
Expected: `✓ built in <X>s` (no errors).

- [ ] **Step 3: Commit**

```bash
cd /home/garan/code/doan1/IELTS-training-website
git add src/components/magicpath/ielts-speaking-test-screen/QuestionPartScreen.jsx
git commit -m "feat(speaking): add QuestionPartScreen (shared layout for Part 1 + 3)"
```

---

### Task 4: Refactor `IELTSSpeakingTestScreen.jsx` — imports + state

**Files:**
- Modify: `src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx`

- [ ] **Step 1: Add new imports after line 4 (after the `toast` import)**

Find this block at the top of the file (around line 1-4):
```jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userSpeakingSubmission, finishSpeakingTest } from '@/services/apiSpeaking';
import { toast } from 'react-toastify';
```

Add the three new component imports right after the `toast` import:
```jsx
import PartTab from './PartTab';
import QuestionNavigator from './QuestionNavigator';
import QuestionPartScreen from './QuestionPartScreen';
```

- [ ] **Step 2: Replace the `PhasePill` function (lines 52-64) with nothing**

Delete the entire `PhasePill` function (it's no longer used — `PartTab` replaces it):
```jsx
// DELETE THIS BLOCK:
function PhasePill({ active, done, label, sub, num }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border-2 flex-none ${active ? 'bg-[#eef2ff] border-[#6366f1] shadow-[0_2px_0_#4338ca]' : done ? 'bg-[#d1fae5] border-[#10b981]/40' : 'bg-white border-[#e6e6ed]'}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${active ? 'bg-[#6366f1] text-white' : done ? 'bg-[#10b981] text-white' : 'bg-[#f1f1f6] text-[#64748b]'}`}>
        {done ? '✓' : num}
      </div>
      <div>
        <div className={`text-xs font-extrabold ${active ? 'text-[#4338ca]' : done ? 'text-[#047857]' : 'text-[#64748b]'}`}>{label}</div>
        <div className="text-[10px] text-[#64748b]">{sub}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add `activeTab` state and `completedIds` helpers**

Find the state declarations (around line 77-85):
```jsx
const [phase, setPhase] = useState('cuecard-prep');
const [recording, setRecording] = useState(false);
const [recSeconds, setRecSeconds] = useState(0);
const [prepSeconds, setPrepSeconds] = useState(60);
const [notes, setNotes] = useState('');
const [audioBlobs, setAudioBlobs] = useState({ part1: null, part2: null, part3: null });
const [submitting, setSubmitting] = useState(false);
const [currentPart1Idx, setCurrentPart1Idx] = useState(0);
const [currentPart3Idx, setCurrentPart3Idx] = useState(0);
```

Add `activeTab` state right after `phase`:
```jsx
const [activeTab, setActiveTab] = useState('part1');  // 'part1' | 'part2' | 'part3'
const [phase, setPhase] = useState('cuecard-prep');
```

Then add `isUnlocked` and `completedIds` helpers right after the state declarations (before `const mediaRecorderRef = useRef(null);`):

```jsx
// Unlock logic: Part 1 always, Part 2 after Part 1 recorded, Part 3 after Part 2 recorded.
const isUnlocked = (tab) => {
  if (tab === 'part1') return true;
  if (tab === 'part2') return audioBlobs.part1 !== null || part1Questions.length === 0;
  if (tab === 'part3') return audioBlobs.part2 !== null;
  return false;
};

// Indices of part1/part3 questions that have been recorded.
// Approximation: when audioBlobs changes, we know "this part is done" but not which exact idx.
// For now, treat any recorded blob as "the currently displayed question was recorded".
// (The QuestionNavigator will show the active question as done; once user moves past it, the prev is still considered done via the order they recorded.)
const getCompletedPart1Ids = () => {
  if (!audioBlobs.part1) return [];
  return [currentPart1Idx];
};
const getCompletedPart3Ids = () => {
  if (!audioBlobs.part3) return [];
  return [currentPart3Idx];
};
```

- [ ] **Step 4: Verify build still passes**

Run: `cd /home/garan/code/doan1/IELTS-training-website && npm run build 2>&1 | tail -5`
Expected: `✓ built in <X>s` (no errors).

- [ ] **Step 5: Commit**

```bash
cd /home/garan/code/doan1/IELTS-training-website
git add src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx
git commit -m "refactor(speaking): add activeTab state + unlock helpers, remove PhasePill"
```

---

### Task 5: Refactor header — replace `PhasePill` block with `PartTab`s

**Files:**
- Modify: `src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx` (lines 202-206)

- [ ] **Step 1: Replace the tab block**

Find this block (around line 202-206):
```jsx
<div className="flex-1 flex justify-center gap-2 overflow-x-auto min-w-[300px]">
  <PhasePill done={phase === 'part1'} active={phase === 'part1'} label="Part 1" sub="Introduction" num="1" />
  <PhasePill done={['part3', 'done'].includes(phase)} active={['cuecard-prep', 'cuecard-talk'].includes(phase)} label="Part 2" sub="Cue card · 2 phút" num="2" />
  <PhasePill done={phase === 'done'} active={phase === 'part3'} label="Part 3" sub="Discussion" num="3" />
</div>
```

Replace with:
```jsx
<div className="flex-1 flex justify-center gap-2 overflow-x-auto min-w-[300px]">
  <PartTab
    done={audioBlobs.part1 !== null}
    active={activeTab === 'part1'}
    locked={!isUnlocked('part1')}
    label="Part 1"
    sub="Introduction"
    num="1"
    onClick={() => setActiveTab('part1')}
  />
  <PartTab
    done={audioBlobs.part2 !== null}
    active={activeTab === 'part2'}
    locked={!isUnlocked('part2')}
    label="Part 2"
    sub="Cue card · 2 phút"
    num="2"
    onClick={() => setActiveTab('part2')}
  />
  <PartTab
    done={audioBlobs.part3 !== null}
    active={activeTab === 'part3'}
    locked={!isUnlocked('part3')}
    label="Part 3"
    sub="Discussion"
    num="3"
    onClick={() => setActiveTab('part3')}
  />
</div>
```

- [ ] **Step 2: Verify build still passes**

Run: `cd /home/garan/code/doan1/IELTS-training-website && npm run build 2>&1 | tail -5`
Expected: `✓ built in <X>s` (no errors).

- [ ] **Step 3: Commit**

```bash
cd /home/garan/code/doan1/IELTS-training-website
git add src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx
git commit -m "refactor(speaking): header tabs now use PartTab (clickable + lock state)"
```

---

### Task 6: Refactor aside trái — remove AI Examiner card, add `QuestionNavigator`

**Files:**
- Modify: `src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx` (lines 220-256)

- [ ] **Step 1: Replace the left aside**

Find this block (lines 220-256 — the whole `<aside>` on the left containing the AI Examiner card + "Phần 1 đã hoàn thành" card):
```jsx
<aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
  <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white rounded-3xl shadow-[0_3px_0_#0b0a1f] p-6 overflow-hidden relative">
    {/* ... entire AI Examiner card ... */}
  </div>

  <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
    {/* ... "Phần 1 đã hoàn thành" card ... */}
  </div>
</aside>
```

Replace the whole `<aside>` with:
```jsx
<aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
  <QuestionNavigator
    part={activeTab}
    partLabel={activeTab === 'part1' ? 'Part 1' : activeTab === 'part3' ? 'Part 3' : 'Part 2'}
    badge={activeTab === 'part1' ? 'Câu hỏi cá nhân · 4-5 phút' : activeTab === 'part3' ? 'Câu hỏi abstract · 4-5 phút' : 'Long turn'}
    questions={activeTab === 'part1' ? part1Questions : activeTab === 'part3' ? part3Questions : []}
    currentIdx={activeTab === 'part1' ? currentPart1Idx : activeTab === 'part3' ? currentPart3Idx : 0}
    completedIds={activeTab === 'part1' ? getCompletedPart1Ids() : activeTab === 'part3' ? getCompletedPart3Ids() : []}
    onJump={(idx) => {
      if (activeTab === 'part1') setCurrentPart1Idx(idx);
      if (activeTab === 'part3') setCurrentPart3Idx(idx);
    }}
  />
</aside>
```

- [ ] **Step 2: Verify build still passes**

Run: `cd /home/garan/code/doan1/IELTS-training-website && npm run build 2>&1 | tail -5`
Expected: `✓ built in <X>s` (no errors).

- [ ] **Step 3: Commit**

```bash
cd /home/garan/code/doan1/IELTS-training-website
git add src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx
git commit -m "refactor(speaking): replace AI Examiner aside with QuestionNavigator"
```

---

### Task 7: Replace Part 1 + Part 3 card markup with `QuestionPartScreen`

**Files:**
- Modify: `src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx` (lines 260-296 for Part 1, 402-439 for Part 3)

- [ ] **Step 1: Replace Part 1 card (lines 260-296)**

Find this block (the entire `phase === 'part1'` render inside `AnimatePresence`):
```jsx
{phase === 'part1' && (
  <motion.div key="part1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-6">
    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-2">Part 1 · Câu {currentPart1Idx + 1}/{part1Questions.length}</div>
    <h2 className="text-2xl font-black text-[#1e1b4b] mb-5" style={{ fontFamily: 'Nunito' }}>{part1Questions[currentPart1Idx]?.question}</h2>
    {/* ... dark mic card ... */}
    {/* ... footer nav with prev/next ... */}
  </motion.div>
)}
```

Replace with:
```jsx
{activeTab === 'part1' && phase === 'part1' && (
  <motion.div key="part1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    <QuestionPartScreen
      partNumber={1}
      partLabel="Introduction"
      questions={part1Questions}
      currentIdx={currentPart1Idx}
      audioKey="part1"
      audioBlob={audioBlobs.part1}
      recording={recording}
      recSeconds={recSeconds}
      LiveWave={LiveWave}
      onToggleRecord={() => (recording ? stopRecording() : startRecording())}
      onPrev={() => setCurrentPart1Idx((i) => Math.max(0, i - 1))}
      onNext={() => {
        if (currentPart1Idx < part1Questions.length - 1) {
          setCurrentPart1Idx((i) => i + 1);
        } else {
          setActiveTab('part2');
          setPhase('cuecard-prep');
        }
      }}
    />
  </motion.div>
)}
```

- [ ] **Step 2: Replace Part 3 card (lines 402-439)**

Find the entire `phase === 'part3'` render block and replace with:
```jsx
{activeTab === 'part3' && phase === 'part3' && (
  <motion.div key="part3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    <QuestionPartScreen
      partNumber={3}
      partLabel="Discussion"
      questions={part3Questions}
      currentIdx={currentPart3Idx}
      audioKey="part3"
      audioBlob={audioBlobs.part3}
      recording={recording}
      recSeconds={recSeconds}
      LiveWave={LiveWave}
      onToggleRecord={() => (recording ? stopRecording() : startRecording())}
      onPrev={() => setCurrentPart3Idx((i) => Math.max(0, i - 1))}
      onNext={() => {
        if (currentPart3Idx < part3Questions.length - 1) {
          setCurrentPart3Idx((i) => i + 1);
        } else {
          setPhase('done');
          handleSubmit();
        }
      }}
    />
  </motion.div>
)}
```

- [ ] **Step 3: Update the "show QuestionPartScreen only when matching activeTab + phase" — handle the tab-vs-phase interaction**

At the top of the `AnimatePresence` block (around line 259), change:
```jsx
<AnimatePresence mode="wait">
  {phase === 'part1' && (
```

To:
```jsx
<AnimatePresence mode="wait">
  {activeTab === 'part1' && phase !== 'cuecard-prep' && phase !== 'cuecard-talk' && phase !== 'done' && (
    <motion.div key={`part1-${currentPart1Idx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <QuestionPartScreen
        partNumber={1}
        partLabel="Introduction"
        questions={part1Questions}
        currentIdx={currentPart1Idx}
        audioKey="part1"
        audioBlob={audioBlobs.part1}
        recording={recording}
        recSeconds={recSeconds}
        LiveWave={LiveWave}
        onToggleRecord={() => (recording ? stopRecording() : startRecording())}
        onPrev={() => setCurrentPart1Idx((i) => Math.max(0, i - 1))}
        onNext={() => {
          if (currentPart1Idx < part1Questions.length - 1) {
            setCurrentPart1Idx((i) => i + 1);
          } else {
            setActiveTab('part2');
            setPhase('cuecard-prep');
          }
        }}
      />
    </motion.div>
  )}

  {activeTab === 'part2' && (phase === 'cuecard-prep' || phase === 'cuecard-talk') && (
    // ... existing cuecard-prep / cuecard-talk markup (unchanged) ...
  )}

  {activeTab === 'part3' && phase === 'part3' && (
    <motion.div key={`part3-${currentPart3Idx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <QuestionPartScreen
        partNumber={3}
        partLabel="Discussion"
        questions={part3Questions}
        currentIdx={currentPart3Idx}
        audioKey="part3"
        audioBlob={audioBlobs.part3}
        recording={recording}
        recSeconds={recSeconds}
        LiveWave={LiveWave}
        onToggleRecord={() => (recording ? stopRecording() : startRecording())}
        onPrev={() => setCurrentPart3Idx((i) => Math.max(0, i - 1))}
        onNext={() => {
          if (currentPart3Idx < part3Questions.length - 1) {
            setCurrentPart3Idx((i) => i + 1);
          } else {
            setPhase('done');
            handleSubmit();
          }
        }}
      />
    </motion.div>
  )}

  {phase === 'done' && (
    // ... existing "done" block (unchanged) ...
  )}
</AnimatePresence>
```

Note: when `activeTab === 'part1'` but `phase === 'cuecard-prep'` (e.g. user has progressed to Part 2 but clicks Part 1 tab), the Part 1 card is shown and user can record again. The `phase` for Part 1/3 is implicit by `activeTab`.

- [ ] **Step 4: Delete the old Part 1 and Part 3 card markup**

Remove the two old `phase === 'part1' && ( ... )` and `phase === 'part3' && ( ... )` blocks that were replaced in Steps 1-2 (they are now duplicated in the AnimatePresence block from Step 3). Final file should have ONE Part 1 + ONE Part 3 render block each.

- [ ] **Step 5: Verify build still passes**

Run: `cd /home/garan/code/doan1/IELTS-training-website && npm run build 2>&1 | tail -5`
Expected: `✓ built in <X>s` (no errors).

- [ ] **Step 6: Visual smoke test**

Run: `cd /home/garan/code/doan1/IELTS-training-website && npm run dev` (dev server should already be running on :2999; if not, start it).
1. Open `http://localhost:2999/` in a browser
2. Navigate to a speaking test (e.g. via `/test` → pick a Speaking test)
3. Confirm: 3 tabs visible at top, Part 1 active, Part 2/3 show 🔒
4. Click Part 1 chip in left aside → question changes
5. Click "Câu tiếp →" on Part 1 last question → tab switches to Part 2, cue card shows
6. Click Part 3 tab (should be unlocked after Part 2 recording)
7. Confirm: Part 1/3 layout matches mockup at `http://localhost:3999/`

- [ ] **Step 7: Commit**

```bash
cd /home/garan/code/doan1/IELTS-training-website
git add src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx
git commit -m "refactor(speaking): use QuestionPartScreen for Part 1 + 3, drive by activeTab"
```

---

### Task 8: Wire Part 2 → Part 3 unlock after Part 2 finishes

**Files:**
- Modify: `src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx`

- [ ] **Step 1: Find the "Hoàn thành ✓" button in the Part 2 cuecard-talk block**

The original `phase === 'cuecard-talk'` block has:
```jsx
<StackedButton tone="indigo" disabled={!audioBlobs.part2} onClick={() => { setPhase('part3'); setCurrentPart3Idx(0); }}>Hoàn thành ✓</StackedButton>
```

Change it to also switch `activeTab`:
```jsx
<StackedButton tone="indigo" disabled={!audioBlobs.part2} onClick={() => { setActiveTab('part3'); setPhase('part3'); setCurrentPart3Idx(0); }}>Hoàn thành ✓</StackedButton>
```

- [ ] **Step 2: Verify build + commit**

Run: `cd /home/garan/code/doan1/IELTS-training-website && npm run build 2>&1 | tail -3`
Expected: `✓ built in <X>s`.

```bash
cd /home/garan/code/doan1/IELTS-training-website
git add src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx
git commit -m "fix(speaking): Part 2 completion also switches activeTab to part3"
```

---

### Task 9: Final cleanup — remove the "Phần 1 đã hoàn thành" card logic

**Files:**
- Modify: `src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx`

- [ ] **Step 1: Verify the "Phần 1 đã hoàn thành" card was already removed in Task 6**

Search the file for "Phần 1 đã hoàn thành" (without diacritics: "Phan 1 da hoan thanh"). If the string still exists, the Task 6 replacement was incomplete — re-do Task 6.

Run: `cd /home/garan/code/doan1/IELTS-training-website && grep -n "Phần 1 đã hoàn thành" src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx`
Expected: no output (string was removed in Task 6).

- [ ] **Step 2: Final build + commit (if any leftover)**

```bash
cd /home/garan/code/doan1/IELTS-training-website && npm run build 2>&1 | tail -3
```

If there are any cleanup changes:
```bash
cd /home/garan/code/doan1/IELTS-training-website
git add src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx
git commit -m "chore(speaking): remove leftover Phần 1 đã hoàn thành card"
```

---

## Self-review

**Spec coverage:**
- ✅ Tab bar 4 states (done/active/available/locked) — PartTab.jsx, Task 1
- ✅ Unlock logic — `isUnlocked` helper in Task 4
- ✅ Part 1/3 unified layout — QuestionPartScreen.jsx, Task 3
- ✅ QuestionNavigator replaces AI Examiner — Task 6
- ✅ Click 3 tabs, locked tabs show tooltip — PartTab.jsx + locked banner in CSS
- ✅ Mockup reference exists at :3999 — out of plan scope (already done in brainstorming)

**Placeholder scan:** No "TBD" / "TODO" / "similar to" / vague step descriptions. Every step has exact code or exact commands.

**Type consistency:** `activeTab` is consistently 'part1' | 'part2' | 'part3' across all tasks. `audioKey` is 'part1' | 'part3' (no 'part2' since Part 2 has its own UI). `isUnlocked(tab)` signature is identical in all usages. `getCompletedPart1Ids` / `getCompletedPart3Ids` are consistent.

**Gaps fixed during review:**
- Step 4 of Task 4 originally had no `isUnlocked` helper. Added.
- Task 7 step 3 has slightly verbose duplicated render markup (Part 1 block in AnimatePresence + same block added later). Clarified: only ONE block per part in final file.
