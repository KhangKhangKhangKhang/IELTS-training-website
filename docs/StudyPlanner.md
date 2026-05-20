# Study Planner - Adaptive Algorithm Improvement

## Context

User feedback: "most users couldn't study whole day" and "plan should be adjustable, people could choose how many hours a day."

**Research foundation (from researchInfo.md):**
- **Hours Required:** 0.5 band improvement = 100-200 hours total study
- **Improvement rates vary by band level:**
  - <5.5: 0.5 band/month possible (faster learners)
  - 5.5-7.0: 0.3-0.5 band/month
  - >7.0: 0.2-0.3 band/month
- **Nation's Four Strands:** 35% input, 35% output, 20% language, 10% fluency
- **Krashen's i+1:** Materials should be challenging but comprehensible

**Current problems:**
- Fixed 35/35/20/10% strand balance doesn't work at low study times (30 min = 10.5 min sessions, useless)
- Raw minutes input (30-300) not user-friendly
- No warning when daily time is insufficient for the band gap goal (research says 100-200 hours per 0.5 band!)
- Sessions become fragmented tiny chunks at low study times

---

## Plan

### 1. Backend - Research-Based Time Validation (`study-planner.service.ts`)

**Research says:** 0.5 band improvement = 100-200 hours total study (Section 4 in researchInfo.md)

**Current problem:** No validation that user's daily study time can actually achieve their goal.

**Implementation:**

```typescript
// Calculate total hours needed for band gap
totalHoursNeeded = bandGap * 150  // average of 100-200 range
minimumDailyMinutes = (totalHoursNeeded * 60) / daysUntilExam

// Example: 5.0 → 6.0 in 60 days
// bandGap = 1.0, totalHoursNeeded = 150 hours
// minimumDailyMinutes = (150 * 60) / 60 = 150 minutes/day
// If user selects 60 min/day → CRITICAL WARNING
```

**Warning severity levels:**

| Ratio (userTime / requiredTime) | Severity | Action |
|----------------------------------|----------|--------|
| < 50% | Critical | Show cannot achieve warning, suggest adjusted target |
| 50-80% | High | Show tight timeline warning |
| 80-100% | Medium | Show achievable but challenging |
| >= 100% | OK | Proceed normally |

### 2. Backend - Adaptive Strand Ratios (`study-planner.service.ts`)

**Research says:** Nation's Four Strands (35% input, 35% output, 20% language, 10% fluency)

**Problem:** Fixed percentages create useless tiny sessions at low study times.

**Implementation:** Adaptive ratios based on available daily minutes:

| Daily Time | Input | Output | Language | Fluency | Why |
|------------|-------|--------|----------|---------|-----|
| ≤60 min | 40% | 40% | 15% | 5% | Drop fluency - better to do 2 things well |
| 61-90 min | 35% | 35% | 20% | 10% | Standard balance restored |
| 91-150 min | 35% | 35% | 20% | 10% | Full Four Strands |
| 151-210 min | 33% | 33% | 22% | 12% | More language for advanced learners |
| 211-240 min | 30% | 30% | 25% | 15% | Language-focused for mastery |

**Minimum session threshold:** 15 minutes
- If activity can't get 15 min, drop it entirely
- Better 2 meaningful sessions than 5 fragmented ones

### 2. Backend - Adaptive Strand Ratios (`study-planner.service.ts`)

**Research-based adaptive ratios (modified from Nation's Four Strands):**

| Daily Time | Input | Output | Language | Fluency | Strategy |
|------------|-------|--------|----------|---------|----------|
| ≤60 min | 40% | 40% | 15% | 5% | Core skills only |
| 61-90 min | 35% | 35% | 20% | 10% | Standard balance |
| 91-150 min | 35% | 35% | 20% | 10% | Full Four Strands |
| 151-210 min | 33% | 33% | 22% | 12% | Language boost |
| 211-240 min | 30% | 30% | 25% | 15% | Advanced focus |

**Minimum session threshold:** 15 min - if activity can't get 15 min, it doesn't appear.

### 3. Backend - DTO Validation (`calculate-plan.dto.ts`)

- Change `@Min(30)` to `@Min(60)` (1 hour minimum for meaningful sessions)
- Change `@Max(300)` to `@Max(240)` (4 hours max)
- Add optional `studyHoursPerDay?: number` field as alternative input

### 4. Frontend - Hour Selector UI (`studyPlanner.jsx`)

Replace number input with button group:

```jsx
const HOUR_OPTIONS = [
  { value: 60, label: '1 giờ', sessions: '~2 buổi' },
  { value: 90, label: '1.5 giờ', sessions: '~3 buổi' },
  { value: 120, label: '2 giờ', sessions: '~4-5 buổi' },
  { value: 150, label: '2.5 giờ', sessions: '~5 buổi' },
  { value: 180, label: '3 giờ', sessions: '~6 buổi' },
  { value: 210, label: '3.5 giờ', sessions: '~7 buổi' },
  { value: 240, label: '4 giờ', sessions: '~8 buổi' },
];
```

Button group shows visual selection, prevents invalid inputs.

### 5. Frontend - Warning Display (`studyPlanner.jsx`)

Display `timeWarning` from API response as colored alert box (red for critical, orange for high, yellow for medium).

---

## Files to Modify

| File | Changes |
|------|---------|
| `ielts_training_app/src/module/study-planner/study-planner.service.ts` | Time validation, adaptive ratios, min threshold |
| `ielts_training_app/src/module/study-planner/dto/calculate-plan.dto.ts` | New min/max validation (60-240), optional hours |
| `IELTS-training-website/src/Pages/client/studyPlanner.jsx` | Hour button group, warning display |

---

## Verification

1. Start backend: `cd ielts_training_app && npm run start:dev`
2. Start frontend: `cd IELTS-training-website && npm run dev`
3. Test 60 min → should show 2-3 sessions, no tiny fragments
4. Test time warning at 60 min with unrealistic target (5.0 → 8.0 in 30 days) → should show critical warning
5. Test realistic: 120 min, 5.0 → 6.0 in 60 days → should show clean plan