// magicpathAdapter.js
// Transform legacy test data shape (từ getDetailInTestAPI sau normalizeTestDataForLegacy)
// → magicpath screen expected shape.
//
// Magicpath screen đọc:
//   testData.parts[i].questionGroups[j].questions[k]
// Mỗi question có: { id, type, prompt, options, answers (word bank), userAnswer, ... }
//
// Sau khi gọi getDetailInTestAPI, response đã có sẵn cả `groupOfQuestions` (legacy)
// và `questionGroups` (alias) — magicpath screen đọc được nhờ flatMap fallback.
// Hàm toMagicpathShape bổ sung: map questionType enum (BE) → legacy key
// (MCQ, FILL_BLANK, MATCHING, LABELING, YES_NO_NOTGIVEN, SHORT_ANSWER, TFNG),
// build options cho MCQ, inject userAnswer từ answersMap.

import {
  mapBackendQuestionTypeToLegacyGroupType,
} from "./contractAdapters";

const SAFE = (v) => (v === null || v === undefined ? "" : String(v));

/**
 * Returns true nếu value trông giống UUID (Prisma).
 * Tránh trường hợp BE trả UUID ở các field title/name mà UI lỡ render raw.
 */
const looksLikeUUID = (v) => {
  if (typeof v !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
};

/**
 * Build { [questionId]: answerValue } từ userAnswers array.
 * userAnswers shape: [{ idQuestion, userAnswerType, matching_key, matching_value, answerText, ... }]
 * → { [qid]: matching_key || answerText || matching_value }
 *
 * @param {Array} userAnswers
 * @returns {Object} { [qid]: string }
 */
export const buildAnswersMapForMagicpath = (userAnswers) => {
  const map = {};
  if (!Array.isArray(userAnswers)) return map;
  for (const ans of userAnswers) {
    const qid = ans?.idQuestion ?? ans?.questionId;
    if (qid === undefined || qid === null) continue;
    const value =
      ans?.matching_key ??
      ans?.answerText ??
      ans?.matching_value ??
      ans?.answer ??
      null;
    if (value !== null) {
      map[SAFE(qid)] = SAFE(value);
    }
  }
  return map;
};

/**
 * Normalize 1 question object từ legacy shape → magicpath shape.
 * Input question có thể có: id, questionType (enum), prompt/content/questionText,
 * answers[] (word bank), options (cho MCQ), userAnswer (string), correct_answers[].
 */
const normalizeQuestion = (q, answersMap) => {
  if (!q) return null;
  const backendType = q.questionType || q.type || "";
  const legacyType = mapBackendQuestionTypeToLegacyGroupType(backendType);

  // ID chuẩn hoá — ưu tiên questionNumber (BE số thứ tự) trước các UUID id
  // để palette render "1, 2, 3" thay vì UUID. Fallback cuối cùng vẫn là q.id
  // nếu test cũ chỉ có id.
  const numericId = Number(q.questionNumber);
  const id = Number.isFinite(numericId) && numericId > 0
    ? numericId
    : (q.id ?? q.idQuestion ?? q.questionId ?? q.questionNumber);

  // Prompt
  const prompt = q.prompt ?? q.content ?? q.questionText ?? q.text ?? "";

  // Options cho MCQ — lấy từ q.options[] hoặc q.answers[].answer_text
  let options = [];
  if (Array.isArray(q.options) && q.options.length > 0) {
    options = q.options.map((opt) => {
      if (typeof opt === "string") return { text: opt, matching_key: opt };
      return {
        text: SAFE(opt.text ?? opt.label ?? opt.answer_text ?? ""),
        matching_key: SAFE(opt.label ?? opt.matching_key ?? opt.text ?? ""),
      };
    });
  } else if (Array.isArray(q.answers) && q.answers.length > 0) {
    options = q.answers.map((a) => ({
      text: SAFE(a.answer_text ?? a.text ?? a.matching_value ?? ""),
      matching_key: SAFE(a.matching_key ?? a.label ?? a.answer_text ?? ""),
    }));
  }

  // Word bank cho MATCHING/LABELING — giữ nguyên q.answers[]
  const answers = Array.isArray(q.answers) ? q.answers : [];

  // User answer từ map (do answersMap build từ userAnswers[])
  const userAnswer =
    answersMap[SAFE(id)] ?? q.userAnswer ?? q.matching_key ?? null;

  return {
    ...q,
    id,
    type: legacyType,
    questionType: backendType,
    prompt,
    options,
    answers,
    userAnswer,
  };
};

/**
 * Normalize 1 part từ legacy shape → magicpath shape.
 * Part có: idPart / id, namePart / title, questionGroups[] hoặc groupOfQuestions[].
 * Mỗi group có: questions[] hoặc question[], imageUrl, instructions.
 */
const normalizePart = (part, answersMap) => {
  if (!part) return null;
  // Magicpath đọc `questionGroups` — sau normalize đã có alias, lấy từ đó trước
  const groups =
    part.questionGroups ||
    part.groupOfQuestions ||
    part.groups ||
    [];
  const normalizedGroups = (Array.isArray(groups) ? groups : []).map((g) => {
    const rawQuestions = g.questions || g.question || [];
    const questions = (Array.isArray(rawQuestions) ? rawQuestions : [])
      .map((q) => normalizeQuestion(q, answersMap))
      .filter(Boolean);
    return {
      ...g,
      id: g.id ?? g.idGroup ?? g.idQuestionGroup,
      instructions: g.instructions ?? g.title ?? g.description ?? "",
      imageUrl: g.imageUrl ?? g.image ?? null,
      questions,
    };
  });

  // Title cho part — bỏ qua nếu BE lỡ để UUID ở field title/name
  const partName = part.namePart ?? part.title ?? "";
  const cleanTitle = looksLikeUUID(partName) ? "" : partName;

  // Passage title cũng có thể bị leak UUID
  const rawPassageTitle =
    part.passage?.title ?? part.passageTitle ?? "";
  const cleanPassageTitle = looksLikeUUID(rawPassageTitle)
    ? ""
    : rawPassageTitle;

  return {
    ...part,
    id: part.id ?? part.idPart,
    title: cleanTitle,
    audioUrl: part.audioUrl ?? part.audio_url ?? part.listeningAudio ?? null,
    passage: part.passage
      ? { ...part.passage, title: cleanPassageTitle }
      : {
          title: cleanPassageTitle,
          content: part.passageContent ?? part.content ?? "",
        },
    questionGroups: normalizedGroups,
    // Keep alias cho cả 2 phía
    groupOfQuestions: normalizedGroups,
  };
};

/**
 * Transform toàn bộ testData từ legacy shape → magicpath shape.
 * @param {Object} testData - raw response từ getDetailInTestAPI
 * @param {Object} [answersMap] - optional answersMap từ buildAnswersMapForMagicpath
 * @returns {Object} testData đã transform
 */
export const toMagicpathShape = (testData, answersMap = {}) => {
  if (!testData) return testData;
  const safeMap = answersMap || {};

  const parts = Array.isArray(testData.parts) ? testData.parts : [];
  const normalizedParts = parts
    .map((p) => normalizePart(p, safeMap))
    .filter(Boolean);

  // Top-level test title — bỏ qua nếu BE lỡ để UUID
  const rawTitle = testData.title ?? testData.name ?? "";
  const cleanTestTitle = looksLikeUUID(rawTitle) ? "" : rawTitle;

  return {
    ...testData,
    title: cleanTestTitle,
    parts: normalizedParts,
  };
};
