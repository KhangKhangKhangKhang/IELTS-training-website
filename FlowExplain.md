# Flow Explain

## 1) Current status: run dev and run build

I fixed the blocking build problem.

Root cause:
- Vite config was set to use terser minification.
- terser package was missing from devDependencies.

Fix applied:
- Installed terser as dev dependency in frontend project.

Validation:
- npm run build: passed successfully.
- npm run dev: started successfully at http://localhost:3001.

Notes:
- Build still shows large chunk warnings only. This is not a blocking error.

## 2) Why apiDoTest changed a lot

Short answer: backend contract changed significantly, while current UI code still sends and reads legacy answer shapes.

So apiDoTest was turned into a temporary compatibility adapter (service layer bridge) to avoid breaking UI pages during phased migration.

Without this adapter, frontend would fail because:
- Old answer save endpoint no longer matches backend flow.
- Old finish test endpoint was replaced by submit-reading-listening flow.
- Backend now expects typed answerPayload per question type, not legacy flat fields.
- Review response now returns userAnswers in new format, while current review UI expects old userAnswer fields.

This follows the migration plan Phase 1 objective: make service layer contract-safe before touching many UI components.

## 3) What each apiDoTest function is doing now

### Public API functions used by UI

1. createManyAnswersAPI(idUser, idTestResult, data)
- Receives legacy frontend answer shape.
- Converts to backend SubmitAnswerItem format (idQuestion, answerType, answerPayload).
- Calls save-progress endpoint.
- Stores a local draft cache by idTestResult so submit can still work even if caller only sends empty body later.

2. StartTestAPI(idUser, idTest, data)
- Starts a test session.
- Keeps original behavior.

3. FinistTestAPI(idTestResult, idUser, data)
- Uses cached draft answers (or provided answers) and converts them to new backend submit format.
- Calls submit-reading-listening endpoint.
- Maps bandScore to legacy field names expected by current UI.
- Clears draft cache after successful submit.

4. FinishTestWritingAPI(idTestResult, idUser, data)
- Keeps writing submit flow unchanged.

5. getManyAnswersAPI(idTestResult, idUser)
- Reads from test-result-and-answers endpoint (new reliable source).

6. getDetailInTestAPI(idTest)
- Keeps fetching test detail.

7. ResetTestAPI(idUser, idTestResult)
- Uses current backend reset endpoint shape.
- Clears local draft cache.

8. DeleteTestResultAPI(idTestResult)
- Deletes a test result.

9. getTestResultByIdAPI(idTestResult)
- Gets single test result.

10. getTestAnswerAPI(idTest)
- Gets official answers in a test.

11. getTestResultAndAnswersAPI(idTestResult)
- Gets review payload from backend.
- If backend returns modern userAnswers only, it creates legacy userAnswer mapping so existing review components keep working.

### Internal helper groups

A) Type mapping helpers
- LEGACY_TO_BACKEND_TYPE and BACKEND_TO_LEGACY_TYPE map old UI answer labels to backend enum question types and vice versa.

B) Payload conversion helpers
- buildAnswerPayload and convertLegacyAnswersToModern convert flat legacy answers into typed answerPayload objects.

C) Question type resolution helpers
- getQuestionTypeMap resolves question type by reading test result and test detail so conversion can be more accurate.

D) Draft cache helpers
- saveDraftAnswers, getDraftAnswers, clearDraftAnswers use localStorage to preserve answer drafts through existing call flow.

E) Legacy response compatibility helpers
- withLegacyBandScore and mapModernUserAnswerToLegacy keep old UI fields available temporarily.

## 4) Is this permanent design

No. This is temporary migration support.

Planned cleanup direction:
- After renderer and submit UI are fully migrated to new metadata-first shape, most compatibility adapters in apiDoTest should be removed.
- Final state should pass backend payloads directly with minimal transformation.

This is consistent with the Hardening and Cutover Cleanup phase in the migration plan.

## 5) Why service layer is the right place for this now

Service layer is the safest place to absorb contract drift because:
- It avoids large, risky changes across many UI components at once.
- It keeps feature pages running during phased rollout.
- It centralizes backend contract changes in one boundary.

That is why apiDoTest changed more than a normal route-only service file for this phase.
