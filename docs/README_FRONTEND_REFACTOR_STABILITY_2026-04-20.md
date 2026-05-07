# Frontend Refactor README (Stability First)

Ngày: 2026-04-20  
Phạm vi: Chỉ frontend, bám theo các hàm/route backend đang có (không thêm endpoint mới).

## 1. Mục tiêu

Tài liệu này tổng hợp các mismatch đã xác minh giữa frontend và backend để refactor frontend chạy ổn định.

- Chỉ dùng contract backend hiện có.
- Không đề xuất feature mới.
- Chưa sửa code trong tài liệu này, chỉ lập kế hoạch để duyệt trước.

## 2. Kết luận nhanh

Frontend hiện đang trộn 2 contract:

- Contract cũ: `groupOfQuestions`, `answers`, `correct_answers`, `finish-test`, `answer_text`, `submission_text`, ...
- Contract mới backend hiện tại: `questionGroups`, `metadata`, `submit-reading-listening`, `answerPayload`, `submissionText`, ...

Hệ quả: nhiều luồng sẽ gặp 404/400 hoặc parse sai dữ liệu, đặc biệt là submit Reading/Listening, teacher test editor, và result modal.

## 3. Findings đã xác minh (ưu tiên theo mức độ)

## 3.1 Blocking

### B1) Reading/Listening submit đang gọi endpoint đã đổi và payload đã cũ

Bằng chứng:
- FE route cũ: `IELTS-training-website/src/services/apiDoTest.js:5`
- FE route cũ finish-test: `IELTS-training-website/src/services/apiDoTest.js:20`
- FE route cũ lấy answers theo test result: `IELTS-training-website/src/services/apiDoTest.js:36`
- FE route cũ reset-test với 2 param: `IELTS-training-website/src/services/apiDoTest.js:48`
- FE call submit (reading): `IELTS-training-website/src/components/test/type/reading.jsx:399`, `IELTS-training-website/src/components/test/type/reading.jsx:406`
- FE call submit (listening): `IELTS-training-website/src/components/test/type/listening.jsx:423`, `IELTS-training-website/src/components/test/type/listening.jsx:430`
- FE payload cũ (`answerText`, `userAnswerType`, `matching_key`, `matching_value`):
  - `IELTS-training-website/src/components/test/type/reading.jsx:354`
  - `IELTS-training-website/src/components/test/type/reading.jsx:355`
  - `IELTS-training-website/src/components/test/type/reading.jsx:356`
  - `IELTS-training-website/src/components/test/type/listening.jsx:379`
  - `IELTS-training-website/src/components/test/type/listening.jsx:380`
  - `IELTS-training-website/src/components/test/type/listening.jsx:381`
- BE save-progress route: `ielts_training_app/src/module/user-answer/user-answer.controller.ts:16`
- BE submit route mới: `ielts_training_app/src/module/user-test-result/user-test-result.controller.ts:128`
- BE DTO answer mới (`answerType`, `answerPayload`): `ielts_training_app/src/module/user-answer/dto/create-user-answer.dto.ts:17`, `ielts_training_app/src/module/user-answer/dto/create-user-answer.dto.ts:25`
- BE DTO submit mới: `ielts_training_app/src/module/user-test-result/dto/submit-test.dto.ts:63`, `ielts_training_app/src/module/user-test-result/dto/submit-test.dto.ts:81`

Rủi ro:
- 404/400 khi submit bài.
- Dữ liệu answers không được chấm điểm theo pipeline mới.

### B2) Frontend đang phụ thuộc schema câu hỏi cũ, backend đã chuyển sang `metadata`

Bằng chứng:
- FE map schema cũ (`typeQuestion`, `question`, `answer_text`, `correct_answers`):
  - `IELTS-training-website/src/components/test/type/reading.jsx:48`
  - `IELTS-training-website/src/components/test/type/reading.jsx:50`
  - `IELTS-training-website/src/components/test/type/reading.jsx:53`
  - `IELTS-training-website/src/components/test/type/reading.jsx:62`
  - `IELTS-training-website/src/components/test/type/listening.jsx:49`
  - `IELTS-training-website/src/components/test/type/listening.jsx:51`
- FE vẫn dùng `groupOfQuestions`: `IELTS-training-website/src/components/test/type/reading.jsx:195`, `IELTS-training-website/src/components/test/type/listening.jsx:206`
- FE renderer phụ thuộc `correct_answers` + `type_question`:
  - `IELTS-training-website/src/components/test/Detail/QuestionRenderer.jsx:50`
  - `IELTS-training-website/src/components/test/Detail/QuestionRenderer.jsx:75`
  - `IELTS-training-website/src/components/test/Detail/QuestionRenderer.jsx:112`
- BE trả `questionGroups` + `metadata`: `ielts_training_app/src/module/test/test.service.ts:375`, `ielts_training_app/src/module/test/test.service.ts:397`
- BE DTO question mới (`idQuestionGroup`, `questionNumber`, `questionType`, `metadata`):
  - `ielts_training_app/src/module/question/dto/create-question.dto.ts:16`
  - `ielts_training_app/src/module/question/dto/create-question.dto.ts:27`
  - `ielts_training_app/src/module/question/dto/create-question.dto.ts:36`
  - `ielts_training_app/src/module/question/dto/create-question.dto.ts:54`

Rủi ro:
- Render sai/không có dữ liệu cho Reading/Listening.
- Submit answer không map đúng về `answerPayload`.

### B3) Teacher test editor đang gửi payload cũ, không khớp question contract mới

Bằng chứng:
- FE payload cũ dùng `idGroupOfQuestions`, `numberQuestion`, `answers[]`:
  - `IELTS-training-website/src/components/test/teacher/Detail/MCQForm.jsx:210`
  - `IELTS-training-website/src/components/test/teacher/Detail/TFNGForm.jsx:124`
  - `IELTS-training-website/src/components/test/teacher/Detail/FillBlankForm.jsx:383`
- FE gọi batch update route không tồn tại ở backend: `IELTS-training-website/src/services/apiTest.js:184`
- BE chỉ có create-many + update-single:
  - `ielts_training_app/src/module/question/question.controller.ts:29`
  - `ielts_training_app/src/module/question/question.controller.ts:46`
- FE gọi `createManyQuestion`/`updateManyQuestionAPI` trên nhiều form:
  - `IELTS-training-website/src/components/test/teacher/Detail/MCQForm.jsx:260`
  - `IELTS-training-website/src/components/test/teacher/Detail/MCQForm.jsx:279`
  - `IELTS-training-website/src/components/test/teacher/Detail/TFNGForm.jsx:144`
  - `IELTS-training-website/src/components/test/teacher/Detail/TFNGForm.jsx:217`

Rủi ro:
- Tạo/sửa question fail toàn bộ sau khi validate metadata.

### B4) Namespace route question group đã đổi (`group-of-questions` -> `question-group`)

Bằng chứng:
- FE route cũ:
  - `IELTS-training-website/src/services/apiTest.js:76`
  - `IELTS-training-website/src/services/apiTest.js:128`
  - `IELTS-training-website/src/services/apiTest.js:145`
  - `IELTS-training-website/src/services/apiTest.js:168`
- BE route mới:
  - `ielts_training_app/src/module/question-group/question-group.controller.ts:19`
  - `ielts_training_app/src/module/question-group/question-group.controller.ts:23`
  - `ielts_training_app/src/module/question-group/question-group.controller.ts:54`
  - `ielts_training_app/src/module/question-group/question-group.controller.ts:90`

Rủi ro:
- 404 ở create/get/update/delete question group.

### B5) Result modal đang parse field cũ (snake_case, singular collections)

Bằng chứng:
- FE lấy writing text cũ: `IELTS-training-website/src/components/test/SimpleResultModal.jsx:356`, `IELTS-training-website/src/components/test/SimpleResultModal.jsx:441`
- FE đọc collection cũ: `IELTS-training-website/src/components/test/SimpleResultModal.jsx:642`, `IELTS-training-website/src/components/test/SimpleResultModal.jsx:643`
- FE đọc điểm cũ: `IELTS-training-website/src/components/test/SimpleResultModal.jsx:725`, `IELTS-training-website/src/components/test/SimpleResultModal.jsx:748`
- FE vẫn đọc `groupOfQuestions`: `IELTS-training-website/src/components/test/SimpleResultModal.jsx:590`
- BE trả `writingSubmissions`, `speakingSubmissions`, `userAnswers`:
  - `ielts_training_app/src/module/user-test-result/user-test-result.service.ts:663`
  - `ielts_training_app/src/module/user-test-result/user-test-result.service.ts:685`
  - `ielts_training_app/src/module/user-test-result/user-test-result.service.ts:698`
- BE dùng camelCase score fields (`bandScore`, `totalCorrect`):
  - `ielts_training_app/src/module/user-test-result/user-test-result.service.ts:333`
  - `ielts_training_app/src/module/user-test-result/user-test-result.service.ts:334`

Rủi ro:
- Modal hiển thị sai hoặc trạng thái rỗng dù đã có kết quả.

## 3.2 High

### H1) Writing finish payload key sai: `submission_text` -> phải là `submissionText`

Bằng chứng:
- FE: `IELTS-training-website/src/components/test/type/writing.jsx:324`
- BE DTO: `ielts_training_app/src/module/user-test-result/dto/finish-test-writing.dto.ts:19`
- BE xử lý theo key mới: `ielts_training_app/src/module/user-test-result/user-test-result.service.ts:760`

Rủi ro:
- Writing submissions bị bỏ qua khi finish.

### H2) Create writing submission route thiếu `idTestResult`

Bằng chứng:
- FE: `IELTS-training-website/src/services/apiWriting.js:15`
- BE: `ielts_training_app/src/module/user-writing-submission/user-writing-submission.controller.ts:22`

Rủi ro:
- 404 nếu API này được dùng.

### H3) Speaking task list route mismatch

Bằng chứng:
- FE: `IELTS-training-website/src/services/apiSpeaking.js:23`
- BE: `ielts_training_app/src/module/speaking-task/speaking-task.controller.ts:26`

Rủi ro:
- 404 với function fetch speaking tasks (hiện tại có thể chưa được gọi trực tiếp).

### H4) Users delete route mismatch

Bằng chứng:
- FE: `IELTS-training-website/src/services/apiUser.js:27`
- BE: `ielts_training_app/src/module/users/users.controller.ts:87`

Rủi ro:
- Xóa user thất bại ở trang user list.

### H5) Forum delete cần `idUser` trong body, frontend không gửi

Bằng chứng:
- FE delete endpoints:
  - `IELTS-training-website/src/services/apiForum.js:104`
  - `IELTS-training-website/src/services/apiForum.js:110`
  - `IELTS-training-website/src/services/apiForum.js:116`
- FE call sites không truyền body:
  - `IELTS-training-website/src/components/Forum/ThreadSidebar/ThreadItem.jsx:22`
  - `IELTS-training-website/src/components/Forum/Forum/PostItem.jsx:75`
  - `IELTS-training-website/src/components/Forum/Forum/CommentItem.jsx:78`
- BE controllers lấy `idUser` từ body:
  - `ielts_training_app/src/module/forum-threads/forum-threads.controller.ts:49`
  - `ielts_training_app/src/module/forum-post/forum-post.controller.ts:124`
  - `ielts_training_app/src/module/forum-comment/forum-comment.controller.ts:49`

Rủi ro:
- 403/400 khi delete dù user là owner.

### H6) Auth resend OTP type mismatch

Bằng chứng:
- FE call không có type hoặc type sai enum (`RESET_PASSWORD`):
  - `IELTS-training-website/src/Pages/client/auth/OTP.jsx:52`
  - `IELTS-training-website/src/Pages/client/auth/OTP.jsx:54`
- BE contract: `type: 'OTP' | 'RESET_LINK'`:
  - `ielts_training_app/src/auth/auth.controller.ts:58`
- BE service có branch theo enum, có thể trả `otpRecord` undefined nếu type sai:
  - `ielts_training_app/src/auth/auth.service.ts:107`
  - `ielts_training_app/src/auth/auth.service.ts:131`

Rủi ro:
- Luồng resend OTP reset password không ổn định.

### H7) Google callback không trả `refreshToken` query, FE vẫn lưu giá trị này

Bằng chứng:
- FE đọc query `refreshToken`: `IELTS-training-website/src/Pages/client/auth/login.jsx:28`
- FE set cookie refreshToken từ query: `IELTS-training-website/src/Pages/client/auth/login.jsx:34`
- BE redirect chỉ có token + user: `ielts_training_app/src/auth/auth.controller.ts:131`

Rủi ro:
- Cookie refresh token có thể rỗng/invalid sau login Google.

## 3.3 Medium

### M1) Param mismatch trên route testEdit

Bằng chứng:
- Route dùng `:id`: `IELTS-training-website/src/main.jsx:95`
- Page đọc `idTest`: `IELTS-training-website/src/Pages/teacher/test/testEdit.jsx:11`
- Có navigate sai path ở 1 nút: `IELTS-training-website/src/Pages/teacher/test/testCreate.jsx:45`

Rủi ro:
- Vào trang edit không lấy được test id trong một số flow.

### M2) API stale không còn contract backend

Bằng chứng:
- FE stale endpoints:
  - `IELTS-training-website/src/services/apiTest.js:93` (`/option/create-many-option`)
  - `IELTS-training-website/src/services/apiTest.js:98` (`/answer/create-answer`)
  - `IELTS-training-website/src/services/apiTest.js:103` (`/user-test/upsert-user-test`)
- Không tìm thấy controller tương ứng trong backend modules hiện tại.

Rủi ro:
- Hàm để lại gây nhầm lẫn, dễ bị gọi nhầm khi mở rộng tính năng.

### M3) Add vocabulary to topic đang post không body

Bằng chứng:
- FE: `IELTS-training-website/src/services/apiVocab.js:44`
- BE cần body DTO: `ielts_training_app/src/module/vocabulary/vocabulary.controller.ts:52`, `ielts_training_app/src/module/vocabulary/vocabulary.controller.ts:55`

Rủi ro:
- 400 nếu hàm được sử dụng.

## 4. Mapping contract cần chuyển (frontend)

| Tính năng | Frontend hiện tại | Backend hiện tại (đúng) |
|---|---|---|
| Save progress R/L | `POST /user-answer/create-many-user-answers/:idUser/:idTestResult` | `POST /user-answer/save-progress/:idUser/:idTestResult` |
| Submit R/L | `PATCH /user-test-result/finish-test/:idUser/:idTestResult` | `POST /user-test-result/submit-reading-listening/:idUser` |
| Reset test | `DELETE /user-test-result/reset-test/:idUser/:idTestResult` | `DELETE /user-test-result/reset-test/:idTestResult` |
| Question group base | `/group-of-questions/*` | `/question-group/*` |
| Speaking task list | `/speaking-task/find-all-speaking-tasks/:idTest` | `/speaking-task/find-all-speaking-tasks-in-test/:idTest` |
| Writing submission create | `/user-writing-submission/create-writing-submission` | `/user-writing-submission/create-writing-submission/:idTestResult` |
| User delete | `DELETE /users/:id` | `DELETE /users/delete-user/:idUser` |

## 5. Payload/field mapping cần chuyển

## 5.1 Reading/Listening answer item

Frontend cũ (đang dùng):
- `idQuestion`
- `answerText`
- `userAnswerType`
- `matching_key`
- `matching_value`

Backend mới (bắt buộc):
- `idQuestion`
- `answerType`
- `answerPayload`

Gợi ý mapping theo question type (dựa trên `metadata.type`):
- `MULTIPLE_CHOICE` -> `{ type: 'MULTIPLE_CHOICE', selectedIndexes: number[] }`
- `TRUE_FALSE_NOT_GIVEN` -> `{ type: 'TRUE_FALSE_NOT_GIVEN', answer: 'TRUE'|'FALSE'|'NOT_GIVEN' }`
- `YES_NO_NOT_GIVEN` -> `{ type: 'YES_NO_NOT_GIVEN', answer: 'YES'|'NO'|'NOT_GIVEN' }`
- Matching types -> `{ type: ..., selectedLabel: string }`
- Fill/short/diagram -> `{ type: ..., answerText: string }`

Reference schema:
- `ielts_training_app/src/module/user-test-result/dto/submit-test.dto.ts:53`
- `ielts_training_app/src/module/question/dto/create-question.dto.ts:54`

## 5.2 Writing finish

Frontend cũ:
- `writingSubmissions[].submission_text`

Backend mới:
- `writingSubmissions[].submissionText`

Reference:
- `IELTS-training-website/src/components/test/type/writing.jsx:324`
- `ielts_training_app/src/module/user-test-result/dto/finish-test-writing.dto.ts:19`

## 5.3 Result fields

Frontend parser cũ:
- `band_score`, `total_correct`, `writingSubmission`, `speakingSubmission`, `submission_text`

Backend mới:
- `bandScore`, `totalCorrect`, `writingSubmissions`, `speakingSubmissions`, `submissionText`

Reference:
- `IELTS-training-website/src/components/test/SimpleResultModal.jsx:642`
- `IELTS-training-website/src/components/test/SimpleResultModal.jsx:725`
- `ielts_training_app/src/module/user-test-result/user-test-result.service.ts:663`
- `ielts_training_app/src/module/user-test-result/user-test-result.service.ts:685`

## 6. Kế hoạch refactor (thực hiện sau khi duyệt)

### Phase 1 - Service layer alignment (1 source of truth)

- Update `apiDoTest.js` theo contract mới:
  - Đổi route save-progress.
  - Bỏ route finish-test cũ.
  - Thêm hàm submit-reading-listening theo DTO mới.
  - Fix reset-test param.
- Update `apiTest.js`:
  - Đổi `group-of-questions` -> `question-group`.
  - Đánh dấu deprecated cho `option`, `answer`, `user-test/upsert-user-test`, `update-many-questions`.
- Update `apiWriting.js`, `apiSpeaking.js`, `apiUser.js`, `apiForum.js`, `apiVocab.js` theo findings.

### Phase 2 - Reading/Listening runtime migration

- Refactor builder answer payload -> `answerType` + `answerPayload`.
- Chuyển luồng submit sang `submit-reading-listening`.
- Dùng schema `questionGroups/questions/metadata` thay cho `groupOfQuestions/question/answers`.
- Đảm bảo không swap tham số khi gọi API.

### Phase 3 - Teacher test editor migration

- Chuyển payload create/update question sang schema mới (`idQuestionGroup`, `questionNumber`, `questionType`, `metadata`).
- Bỏ phụ thuộc answer endpoints cũ.
- Đổi batch update: dùng loop `update-question/:idQuestion` (vì backend không có `update-many`).

### Phase 4 - Result modal normalization

- Viết normalizer cho reading/listening/writing/speaking từ response mới.
- Update field map camelCase.
- Giữ parser tương thích ngược cho dữ liệu cũ (nếu cần).

### Phase 5 - Auth/User/Forum hardening

- Fix enum OTP resend (`OTP`/`RESET_LINK`).
- Google login: không set refresh token từ query nếu không có.
- Fix route xóa user.
- Forum delete thêm `{ data: { idUser } }` trong `API.delete`.

## 7. Checklist test sau refactor

Reading/Listening:
- Start test -> save progress -> submit -> xem result modal.
- Không 404 ở submit/save-progress/reset.
- Band score hiển thị đúng.

Teacher test editor:
- Tạo/sửa/xóa question group.
- Tạo/sửa question cho ít nhất 3 loại: MCQ, TFNG, FILL.
- Không gọi route cũ `/answer/*`, `/option/*`, `/group-of-questions/*`.

Writing/Speaking:
- Writing finish gửi `submissionText` và nhận submissions có score.
- Speaking finish và xem result modal.

Auth/User/Forum:
- Resend OTP cả register và reset password.
- Login Google không tạo refresh token rỗng.
- Delete user/forum thành công khi đúng owner.

## 8. Gate để bắt đầu code refactor

Nếu bạn đồng ý, bước tiếp theo là:

1. Tạo PR refactor service layer trước (không đụng vào UI renderer).
2. Refactor Reading/Listening + Result modal.
3. Refactor Teacher editor.
4. Chạy manual checklist mục 7.

---

Nếu cần, mình có thể tách thành 2 PR:
- PR-A: API services + auth/user/forum fixes.
- PR-B: Reading/Listening + Teacher editor + Result modal migration.
