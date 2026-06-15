// Shared per-skill limits for the IELTS editor.
//
// Per the user spec: the only rule that matters at create-time is the
// per-skill **total** question cap. We do NOT enforce per-section / per-part
// minimums or maximums — teachers are free to distribute questions across
// parts however they want (e.g. a Listening test can be 10/10/10/10 OR
// 20/20/0/0 OR anything in between, as long as the total stays ≤ 40).
//
// Source: Cambridge IELTS conventions
//   - Listening: 40 questions across 4 sections
//   - Reading:   40 questions across 3 passages
//   - Writing:   2 tasks (Task 1 ≥150 words, Task 2 ≥250 words)
//   - Speaking:  3 parts
//
// Note: Writing / Speaking are NOT question-count based; Writing validates
// word count per task, Speaking validates part count.

const SKILL_LIMITS = {
  LISTENING: {
    label: "Listening",
    partWord: "Section",
    totalParts: 4,
    totalQuestions: 40,
  },
  READING: {
    label: "Reading",
    partWord: "Part",
    totalParts: 3,
    totalQuestions: 40,
  },
  WRITING: {
    label: "Writing",
    partWord: "Task",
    totalParts: 2,
    totalQuestions: 0, // not applicable
    wordCount: {
      1: 150,  // Task 1 min 150 words
      2: 250,  // Task 2 min 250 words
    },
  },
  SPEAKING: {
    label: "Speaking",
    partWord: "Part",
    totalParts: 3,
    totalQuestions: 0,
  },
};

const getLimits = (skill) => SKILL_LIMITS[skill] || SKILL_LIMITS.READING;

// Validate total question count across the whole test (e.g. Listening ≤ 40).
// Used at create-time to refuse creating a group that would push the test
// past its per-skill cap. Writing/Speaking are not question-count skills →
// no cap.
const validateTotalQuestionCount = (skill, currentTotal) => {
  const lim = getLimits(skill);
  if (lim.totalQuestions === 0) return { ok: true };
  if (currentTotal > lim.totalQuestions) {
    return {
      ok: false,
      message: `${lim.label} has a maximum of ${lim.totalQuestions} questions in total.`,
    };
  }
  return { ok: true };
};

// Validate total part count for the skill (e.g. Listening cannot have 5 sections).
const validateTotalPartCount = (skill, currentPartCount) => {
  const lim = getLimits(skill);
  if (currentPartCount > lim.totalParts) {
    return {
      ok: false,
      message: `${lim.label} has a maximum of ${lim.totalParts} ${lim.partWord.toLowerCase()}s.`,
    };
  }
  return { ok: true };
};

// Validate word count for a Writing task.
const validateWritingTaskWordCount = (taskIdx, wordCount) => {
  if (taskIdx !== 1 && taskIdx !== 2) return { ok: true };
  const min = taskIdx === 1 ? 150 : 250;
  if (!Number.isFinite(wordCount) || wordCount < min) {
    return {
      ok: false,
      message: `Task ${taskIdx} must be at least ${min} words (you have ${wordCount || 0}).`,
    };
  }
  return { ok: true };
};

export {
  SKILL_LIMITS,
  getLimits,
  validateTotalQuestionCount,
  validateTotalPartCount,
  validateWritingTaskWordCount,
};
