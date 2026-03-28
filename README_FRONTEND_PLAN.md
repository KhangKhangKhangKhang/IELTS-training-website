# README_FRONTEND_PLAN

## 1. Overview of Major Changes

The backend moved to a stricter metadata-first contract with standardized question handling. The biggest frontend-impacting shifts are:

1. Endpoint contracts changed across auth, tests, answers, forum, vocab, grammar, statistics, and teacher flows, so existing service assumptions are no longer safe.
2. Question logic is now schema-driven (14 question types), with strong validation and stricter payload requirements from [ielts_training_app/docs/metadata/schema-reference.md](../ielts_training_app/docs/metadata/schema-reference.md).
3. Completion questions now require standardized blank placeholders like [1], [2] per [ielts_training_app/docs/metadata/blank-patterns.md](../ielts_training_app/docs/metadata/blank-patterns.md) and [ielts_training_app/docs/question-types/completion-types.md](../ielts_training_app/docs/question-types/completion-types.md).
4. Renderer behavior changed for grouped completion/table/flowchart modes and dual answer input modes, documented in [ielts_training_app/docs/frontend/renderer-guide.md](../ielts_training_app/docs/frontend/renderer-guide.md).
5. Teacher authoring payloads must send metadata correctly per type (no legacy answers-style payload), documented in [ielts_training_app/docs/frontend/teacher-guide.md](../ielts_training_app/docs/frontend/teacher-guide.md).
6. Validation errors are now contract-critical and must be parsed/displayed correctly per [ielts_training_app/docs/api/validation-errors.md](../ielts_training_app/docs/api/validation-errors.md).

## 2. List of Affected Files

### Core service and auth foundation

- [src/services/axios.custom.js](src/services/axios.custom.js)
- [src/services/apiAuth.js](src/services/apiAuth.js)
- [src/context/authContext.jsx](src/context/authContext.jsx)
- [src/context/auth/protectedRoute.jsx](src/context/auth/protectedRoute.jsx)

### Test lifecycle and renderer

- [src/services/apiDoTest.js](src/services/apiDoTest.js)
- [src/services/apiTest.js](src/services/apiTest.js)
- [src/Pages/client/test/testReview.jsx](src/Pages/client/test/testReview.jsx)
- [src/Pages/client/test/testDetail.jsx](src/Pages/client/test/testDetail.jsx)
- [src/components/test/Detail/QuestionRenderer.jsx](src/components/test/Detail/QuestionRenderer.jsx)
- [src/components/test/Detail/RenderFillBlank.jsx](src/components/test/Detail/RenderFillBlank.jsx)
- [src/components/test/Detail/RenderMatching.jsx](src/components/test/Detail/RenderMatching.jsx)
- [src/components/test/Detail/RenderLabeling.jsx](src/components/test/Detail/RenderLabeling.jsx)
- [src/components/test/Detail/RenderMCQ.jsx](src/components/test/Detail/RenderMCQ.jsx)
- [src/components/test/Detail/RenderTFNG.jsx](src/components/test/Detail/RenderTFNG.jsx)
- [src/components/test/Detail/RenderYesNoNotGiven.jsx](src/components/test/Detail/RenderYesNoNotGiven.jsx)
- [src/components/test/Detail/RenderShortAnswer.jsx](src/components/test/Detail/RenderShortAnswer.jsx)
- [src/components/test/type/listening.jsx](src/components/test/type/listening.jsx)
- [src/components/test/type/reading.jsx](src/components/test/type/reading.jsx)
- [src/components/test/type/writing.jsx](src/components/test/type/writing.jsx)
- [src/components/test/type/speaking.jsx](src/components/test/type/speaking.jsx)

### Teacher authoring

- [src/components/test/teacher/Detail/FillBlankForm.jsx](src/components/test/teacher/Detail/FillBlankForm.jsx)
- [src/components/test/teacher/Detail/MCQForm.jsx](src/components/test/teacher/Detail/MCQForm.jsx)
- [src/components/test/teacher/Detail/MatchingForm.jsx](src/components/test/teacher/Detail/MatchingForm.jsx)
- [src/components/test/teacher/Detail/LabelingForm.jsx](src/components/test/teacher/Detail/LabelingForm.jsx)
- [src/components/test/teacher/Detail/TFNGForm.jsx](src/components/test/teacher/Detail/TFNGForm.jsx)
- [src/components/test/teacher/Detail/YesNoNotGivenForm.jsx](src/components/test/teacher/Detail/YesNoNotGivenForm.jsx)
- [src/Pages/teacher/test/testCreate.jsx](src/Pages/teacher/test/testCreate.jsx)
- [src/Pages/teacher/test/testEdit.jsx](src/Pages/teacher/test/testEdit.jsx)
- [src/Pages/teacher/test/testManager.jsx](src/Pages/teacher/test/testManager.jsx)

### Feature modules and dashboard

- [src/services/apiStatistics.js](src/services/apiStatistics.js)
- [src/Pages/client/homePage.jsx](src/Pages/client/homePage.jsx)
- [src/services/apiVocab.js](src/services/apiVocab.js)
- [src/Pages/client/vocabulary.jsx](src/Pages/client/vocabulary.jsx)
- [src/components/Vocab/FlashcardModal.jsx](src/components/Vocab/FlashcardModal.jsx)
- [src/services/apiGrammar.js](src/services/apiGrammar.js)
- [src/Pages/client/grammar.jsx](src/Pages/client/grammar.jsx)
- [src/services/apiForum.js](src/services/apiForum.js)
- [src/Pages/client/statistic.jsx](src/Pages/client/statistic.jsx)
- [src/components/Forum/Forum/ForumBoard.jsx](src/components/Forum/Forum/ForumBoard.jsx)
- [src/components/Forum/Forum/PostItem.jsx](src/components/Forum/Forum/PostItem.jsx)
- [src/components/Forum/Forum/CommentList.jsx](src/components/Forum/Forum/CommentList.jsx)
- [src/services/apiUser.js](src/services/apiUser.js)
- [src/components/ui/navBar/profileModal.jsx](src/components/ui/navBar/profileModal.jsx)
- [src/components/ui/navBar/StreakWidget.jsx](src/components/ui/navBar/StreakWidget.jsx)
- [src/components/ui/navBar/xPWidget.jsx](src/components/ui/navBar/xPWidget.jsx)
- [src/Pages/teacher/userList.jsx](src/Pages/teacher/userList.jsx)

## 3. Implementation Plan (Phases)

### Phase 1: Contract Baseline + Core API Services

**Objective:** Make the app contract-safe at service level before touching UI logic.

**Files to modify and detailed changes:**

1. Update endpoint paths, payload shapes, and response mapping in service files:
   - [src/services/apiAuth.js](src/services/apiAuth.js)
   - [src/services/apiDoTest.js](src/services/apiDoTest.js)
   - [src/services/apiTest.js](src/services/apiTest.js)
   - [src/services/apiStatistics.js](src/services/apiStatistics.js)
   - [src/services/apiVocab.js](src/services/apiVocab.js)
   - [src/services/apiForum.js](src/services/apiForum.js)
   - [src/services/apiGrammar.js](src/services/apiGrammar.js)
   - [src/services/apiUser.js](src/services/apiUser.js)
2. Harden token refresh/introspect assumptions in:
   - [src/services/axios.custom.js](src/services/axios.custom.js)
   - [src/context/authContext.jsx](src/context/authContext.jsx)
   - [src/context/auth/protectedRoute.jsx](src/context/auth/protectedRoute.jsx)
3. Add a temporary compatibility mapper in service return values to keep old UI running while later phases migrate components.

**Testing checklist after Phase 1:**

1. App boots and routes render without blocking errors.
2. Login, refresh-token retry, logout, and protected route access all work.
3. At least one GET call and one mutation per major service family returns parsed data without runtime exceptions.
4. Validation error payloads from backend show stable user-facing messages.

### Phase 2: Renderer + Teacher Form Foundations

**Objective:** Align question rendering/submission and authoring payloads with new metadata rules.

**Files to modify and detailed changes:**

1. Update renderer pipeline in:
   - [src/components/test/Detail/QuestionRenderer.jsx](src/components/test/Detail/QuestionRenderer.jsx)
   - [src/components/test/Detail/RenderFillBlank.jsx](src/components/test/Detail/RenderFillBlank.jsx)
   - Other question detail renderers
   to parse standardized [n] placeholders and grouped content modes.
2. Update answer capture in:
   - [src/components/test/type/listening.jsx](src/components/test/type/listening.jsx)
   - [src/components/test/type/reading.jsx](src/components/test/type/reading.jsx)
   - [src/components/test/type/writing.jsx](src/components/test/type/writing.jsx)
   - [src/components/test/type/speaking.jsx](src/components/test/type/speaking.jsx)
   to support dual-mode answerText and matching_key behavior.
3. Refactor teacher forms in:
   - [src/components/test/teacher/Detail/FillBlankForm.jsx](src/components/test/teacher/Detail/FillBlankForm.jsx)
   - [src/components/test/teacher/Detail/MCQForm.jsx](src/components/test/teacher/Detail/MCQForm.jsx)
   - [src/components/test/teacher/Detail/MatchingForm.jsx](src/components/test/teacher/Detail/MatchingForm.jsx)
   - [src/components/test/teacher/Detail/LabelingForm.jsx](src/components/test/teacher/Detail/LabelingForm.jsx)
   - [src/components/test/teacher/Detail/TFNGForm.jsx](src/components/test/teacher/Detail/TFNGForm.jsx)
   - [src/components/test/teacher/Detail/YesNoNotGivenForm.jsx](src/components/test/teacher/Detail/YesNoNotGivenForm.jsx)
   to emit metadata-first payloads with client-side pre-validation.

**Testing checklist after Phase 2:**

1. Teacher can create one question each for MCQ, matching, completion, diagram, TFNG/YNNG, short answer with valid metadata.
2. Student renderer can display and submit those created questions.
3. Submission payload includes correct answer shape by input mode.
4. App remains fully runnable for non-test areas.

### Phase 3: Isolated Feature Tracks (Parallel, Independent)

**Objective:** Migrate low-coupling modules while preserving app stability.

**Files to modify and detailed changes:**

1. Vocabulary track:
   - [src/services/apiVocab.js](src/services/apiVocab.js)
   - [src/Pages/client/vocabulary.jsx](src/Pages/client/vocabulary.jsx)
   - [src/components/Vocab/FlashcardModal.jsx](src/components/Vocab/FlashcardModal.jsx)
2. Grammar track:
   - [src/services/apiGrammar.js](src/services/apiGrammar.js)
   - [src/Pages/client/grammar.jsx](src/Pages/client/grammar.jsx)
3. Forum track:
   - [src/services/apiForum.js](src/services/apiForum.js)
   - [src/Pages/client/statistic.jsx](src/Pages/client/statistic.jsx)
   - [src/components/Forum/Forum/ForumBoard.jsx](src/components/Forum/Forum/ForumBoard.jsx)
   - [src/components/Forum/Forum/PostItem.jsx](src/components/Forum/Forum/PostItem.jsx)
   - [src/components/Forum/Forum/CommentList.jsx](src/components/Forum/Forum/CommentList.jsx)

**Testing checklist after Phase 3:**

1. Vocabulary CRUD and AI suggestion fallback work.
2. Grammar category/item CRUD works.
3. Forum thread/post/comment/like flows including multipart post updates work.
4. App is still runnable and testable even if test module is not yet fully migrated.

### Phase 4: User Surface + Statistics Aggregation

**Objective:** Migrate profile/admin/dashboard cross-read logic before final test lifecycle migration.

**Files to modify and detailed changes:**

1. Update profile/streak/xp/user admin assumptions in:
   - [src/services/apiUser.js](src/services/apiUser.js)
   - [src/components/ui/navBar/profileModal.jsx](src/components/ui/navBar/profileModal.jsx)
   - [src/components/ui/navBar/StreakWidget.jsx](src/components/ui/navBar/StreakWidget.jsx)
   - [src/components/ui/navBar/xPWidget.jsx](src/components/ui/navBar/xPWidget.jsx)
   - [src/Pages/teacher/userList.jsx](src/Pages/teacher/userList.jsx)
2. Migrate dashboard aggregation in:
   - [src/services/apiStatistics.js](src/services/apiStatistics.js)
   - [src/Pages/client/homePage.jsx](src/Pages/client/homePage.jsx)
   with partial-failure handling for multi-call loads.

**Testing checklist after Phase 4:**

1. Profile fetch/update works and navbar widgets do not crash.
2. Teacher user list CRUD works.
3. Dashboard cards/charts/targets load correctly with graceful fallback if one endpoint fails.
4. Recommendation clicks navigate safely (even if test flow final migration is pending).

### Phase 5: Test Lifecycle (Sequential, High-Risk Core)

**Objective:** Complete the full student and teacher test flows with no session-breaking gaps.

**Files to modify and detailed changes:**

1. Subphase 5A (list + start):
   - [src/Pages/client/test/testReview.jsx](src/Pages/client/test/testReview.jsx)
   - [src/services/apiTest.js](src/services/apiTest.js)
   - [src/services/apiDoTest.js](src/services/apiDoTest.js)
   Persist and safely restore test session identity to avoid refresh-loss blockers.
2. Subphase 5B (runner + submit):
   - [src/Pages/client/test/testDetail.jsx](src/Pages/client/test/testDetail.jsx)
   - Test type components
   - Renderer detail components
   - Answer serialization paths
3. Subphase 5C (review replay):
   - [src/components/test/SimpleResultModal.jsx](src/components/test/SimpleResultModal.jsx)
   - Question review rendering paths
   - Result-and-answers mapping
4. Subphase 5D (teacher create/edit):
   - [src/Pages/teacher/test/testCreate.jsx](src/Pages/teacher/test/testCreate.jsx)
   - [src/Pages/teacher/test/testEdit.jsx](src/Pages/teacher/test/testEdit.jsx)
   - [src/Pages/teacher/test/testManager.jsx](src/Pages/teacher/test/testManager.jsx)
   - Teacher detail forms

**Testing checklist after Phase 5:**

1. Student path: list tests -> start -> answer -> submit -> view score -> open review.
2. Teacher path: create/edit/delete test with nested entities and multiple question types.
3. Test session survives refresh/re-entry without unrecoverable state.
4. No blocking UI/runtime errors remain in test and dashboard integration.

### Phase 6: Hardening + Cutover Cleanup

**Objective:** Remove transitional compatibility logic and certify release-readiness.

**Files to modify and detailed changes:**

1. Remove temporary compatibility adapters introduced in Phase 1 from service modules.
2. Clean dead code paths and normalize response parsing across components.
3. Finalize migration documentation in the plan appendix and release checklist.

**Testing checklist after Phase 6:**

1. Full regression of auth, vocab, grammar, forum, profile/admin, statistics, test-taking, and teacher authoring.
2. Validation-error UX review across all create/update forms.
3. Smoke test on production-like environment variables and network latency scenarios.

## 4. Risks & Notes

1. Highest risk area is test execution and answer serialization in [src/services/apiDoTest.js](src/services/apiDoTest.js) and [src/services/apiTest.js](src/services/apiTest.js); small contract drift here can break core flows.
2. Refresh-token response shape drift in [src/services/axios.custom.js](src/services/axios.custom.js) can cause global auth failure.
3. Grouped completion rendering and [n] placeholder parsing errors in [src/components/test/Detail/RenderFillBlank.jsx](src/components/test/Detail/RenderFillBlank.jsx) can silently corrupt answer capture.
4. Teacher form payload mismatches (especially MCQ indexes, TFNG/YNNG enums, diagram coordinates) are likely to trigger frequent 400s unless pre-validation is added.
5. Statistics page is multi-endpoint and tightly coupled to test data; partial failure handling is required to keep [src/Pages/client/homePage.jsx](src/Pages/client/homePage.jsx) runnable during staged migration.
6. Session continuity for active tests should be explicitly decided early; using only navigation state is fragile.