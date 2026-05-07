# Frontend Plan: Import đề thi từ PDF (Backend đã có sẵn)

Ngày cập nhật: 2026-04-21  
Phạm vi: Frontend (teacher flow), dùng lại API backend hiện có, không tạo endpoint mới.

## 1. Mục tiêu

- Tìm và xác nhận chức năng extract PDF đề thi ở backend.
- Lập kế hoạch tích hợp vào frontend theo flow: Upload PDF -> Review/Edit -> Save DB -> Mở trang chỉnh sửa đề.
- Giữ tối đa tương thích với code frontend hiện tại (service layer + teacher test pages).

## 2. Chức năng backend đã tìm thấy

## 2.1 Module và endpoint

Backend đã có module riêng cho PDF exam:

- Module: `ielts_training_app/src/module/pdf-exam/`
- Controller route gốc: `/pdf-exam`

Endpoint chính:

1. `POST /pdf-exam/extract`

- Multipart form-data
- Fields: `file` (PDF), `testType` (`LISTENING|READING|WRITING|SPEAKING`), optional `title`, optional `level`
- Trả về: `ExtractionResultDto` có `idSession`, `rawData`, `status`, `confidence`, `warnings`, `rawPdfUrl`

2. `GET /pdf-exam/session/:idSession`

- Lấy lại dữ liệu session extraction để tiếp tục review.

3. `PATCH /pdf-exam/session/:idSession`

- Update dữ liệu đã extract sau khi teacher sửa tay.
- Body: `UpdateSessionDto` (`data`, optional `status`).

4. `POST /pdf-exam/save/:idSession`

- Lưu session vào DB thành test thật.
- Body: `{ idUser: string }`
- Trả về: `SaveResultDto` có `idTest` và thống kê record được tạo.

5. `DELETE /pdf-exam/session/:idSession`

- Hủy/discard session.

## 2.2 Auth và điều kiện gọi API

- Endpoint PDF extract đang được bảo vệ bởi JWT guard.
- Frontend cần gửi access token (đã được interceptor trong `axios.custom.js` xử lý).

## 2.3 Luồng BE extract PDF chi tiết (từ request đến tạo đề)

## Tầng 1: Controller nhận request

1. FE gọi `POST /pdf-exam/extract` (multipart/form-data) với:

- `file` (PDF)
- `testType`
- optional `title`, optional `level`

2. `PdfExamController.extract()`:

- log metadata request/file
- chuyển request xuống `PdfExamService.uploadAndExtract(file, dto)`

## Tầng 2: Khởi tạo session và upload file gốc

3. `uploadAndExtract()` tạo:

- `correlationId` (để trace log)
- `idSession` (UUID)

4. Validate file qua `validateFile()`:

- phải có file
- MIME phải là `application/pdf`
- kích thước phải <= 20MB

5. Upload file lên Cloudinary:

- folder: `pdf-exams`
- resource type: `raw`
- lấy `rawPdfUrl`

6. Tạo `ExtractionSession` trong memory map:

- `status = PROCESSING`
- `confidence = 0`
- giữ `testType`, `rawPdfUrl`, timestamps

## Tầng 3: Parse PDF (Docling trước, pdfjs-dist fallback)

7. Hệ thống thử parse theo thứ tự:

7.1 Nhánh Docling (ưu tiên)

- check `doclingService.isDoclingAvailable()`
- nếu available: gọi `/v1/convert/file`
- options chính: OCR bật (`tesseract`), table mode `accurate`
- output Docling (`text`, `markdown`) được convert về format parser nội bộ qua `convertDoclingToParsedData()`

  7.2 Nhánh fallback pdfjs-dist

- nếu Docling unavailable hoặc throw error: fallback `pdfParserService.parsePdf()`
- parser pdfjs:
  - đọc từng page
  - gom text block (heading/paragraph/question/option/...)
  - build profile tài liệu: density, multi-column, artifacts lặp
  - tính confidence parse theo mật độ text

8. Nếu FE truyền `title`/`level` thì override kết quả detect tự động.

## Tầng 4: Chuẩn hóa source text cho bước AI verify

9. Build `sourceText` bằng `buildVerificationSource()`:

- normalize whitespace/newline
- truncate tối đa 50,000 ký tự
- nếu cắt ngắn sẽ gắn marker `[TRUNCATED FOR VERIFICATION]`

## Tầng 5: Phân tích cấu trúc đề (rule-based)

10. Gọi `structureAnalyzerService.analyze(parsedData, testType)`:

10.1 Base

- base confidence = 0.8
- gom `warnings[]`

  10.2 Reading/Listening

- preprocess raw text
- split section/part
- build `parts -> questionGroups -> questions`
- fallback nếu không detect được part/group
- quality gate: - cảnh báo low question coverage (ví dụ < 30/40) - cảnh báo duplicate question number - cảnh báo option set rỗng ở nhóm multiple choice - cảnh báo layout multi-column

  10.3 Writing

- regex tách Task 1 / Task 2
- trích title/instructions/time limit
- nếu fail detect: tạo fallback task + warning manual entry

  10.4 Speaking

- regex tách Part 1 / 2 / 3
- trích danh sách câu hỏi theo part
- nếu fail detect: tạo fallback part + warning manual entry

  10.5 Confidence analyzer

- nếu có warning: trừ dần theo số warning
- floor tối thiểu: 0.45

## Tầng 6: AI refinement (Groq) + sanitize schema

11. Gọi `refineExtractionWithGroq()`:

11.1 Nếu thiếu `GROQ_API_KEY`

- bỏ qua AI
- giữ parser output
- thêm warning `AI refinement skipped`

  11.2 Nếu có API key

- gọi `runGroqExtractionRefinement()` với:
  - circuit breaker: threshold 5 fail, reset 30 giây
  - timeout request: 30 giây
  - retry: tối đa 4 lần (attempt 0..3), backoff 1s -> 2s -> 4s
- prompt bắt model trả đúng JSON schema backend
- nếu có `rawPdfUrl`, yêu cầu tool `visit_website` để kiểm tra PDF gốc

  11.3 Parse và chuẩn hóa output AI

- parse JSON bằng `extractJsonObject()`
- normalize/sanitize bằng `normalizeVerifiedData()`
- ép về shape hợp lệ theo `testType` để tránh field lạ/sai schema

  11.4 Confidence AI

- 0.92 nếu xác nhận có dùng `visit_website`
- 0.82 nếu không dùng visit tool
- nếu fail toàn bộ AI: fallback parser output + warning

## Tầng 7: Chốt session và trả kết quả cho FE

12. Service cập nhật session:

- `rawData = analysisResult.data`
- `verifiedData = aiRefinement.verifiedData`
- `confidence = max(analysisConfidence, aiConfidence)`
- `warnings = parsedWarnings + analysisWarnings + aiWarnings`
- `status = READY_FOR_REVIEW`

13. Response `ExtractionResultDto` trả về FE:

- `idSession`
- `rawData` (ưu tiên `verifiedData`, fallback `rawData`)
- `status`, `confidence`, `warnings`, `rawPdfUrl`, `createdAt`

## 2.4 Luồng sau extract: review -> save -> discard

14. `GET /pdf-exam/session/:idSession`

- lấy lại snapshot session hiện tại
- ưu tiên trả `verifiedData` nếu có

15. `PATCH /pdf-exam/session/:idSession`

- FE sửa tay dữ liệu trước khi save
- nếu session có `verifiedData` thì patch vào `verifiedData`
- ngược lại patch vào `rawData`
- có thể cập nhật `status`

16. `POST /pdf-exam/save/:idSession`

- điều kiện save:
  - session tồn tại
  - status phải là `READY_FOR_REVIEW` hoặc `REVIEWED`
  - phải có data để lưu
- save bằng Prisma transaction:
  - tạo `test`
  - Reading/Listening: tạo `part`, `passage`, `questionGroup`, `question`
  - Writing: tạo `writingTask`
  - Speaking: tạo `speakingTask`, `speakingQuestion`
- save xong: session -> `APPROVED`
- trả `idTest` + số lượng bản ghi đã tạo

17. `DELETE /pdf-exam/session/:idSession`

- set trạng thái `DISCARDED`
- hẹn xóa session khỏi memory sau 1 giờ

## 2.5 State machine session BE

Các trạng thái đã khai báo:

- `PENDING`
- `PROCESSING`
- `READY_FOR_VERIFICATION`
- `NEEDS_MANUAL_ENTRY`
- `READY_FOR_REVIEW`
- `REVIEWED`
- `APPROVED`
- `DISCARDED`

Flow thực tế đang dùng nhiều nhất hiện tại:

- `PROCESSING` -> `READY_FOR_REVIEW` -> `APPROVED`
- hoặc `PROCESSING` -> `READY_FOR_REVIEW` -> `DISCARDED`

## 2.6 Lưu ý kỹ thuật quan trọng

- Session đang lưu bằng in-memory `Map`, chưa persist Redis/DB cho session extract.
- Backend restart là mất session extract chưa save.
- `save` endpoint yêu cầu FE gửi `idUser` trong body.
- Có khác biệt giới hạn file:
  - Multer module cho phép tới 50MB
  - nhưng service validate cứng 20MB (giới hạn thực thi cuối cùng).

## 3. Điểm chèn frontend để tích hợp

Frontend hiện tại có flow quản lý đề thi cho teacher tại:

- `src/Pages/teacher/test/testManager.jsx`
- `src/Pages/teacher/test/testCreate.jsx`
- `src/Pages/teacher/test/testEdit.jsx`
- Service API test hiện tại: `src/services/apiTest.js`

Để tích hợp PDF import mà ít ảnh hưởng code cũ, đề xuất:

1. Thêm 1 route mới cho teacher:

- Ví dụ: `/teacher/testManager/testImportPdf`

2. Tạo service API mới cho pdf-exam:

- File: `src/services/apiPdfExam.js`
- Tách riêng khỏi `apiTest.js` để tránh trộn nghiệp vụ.

3. Từ `testManager`, thêm nút "Import PDF" cạnh nút "Tạo đề thi mới".

4. Sau khi save thành công (`idTest`), điều hướng sang:

- `/teacher/testManager/testEdit/{idTest}` (route hiện tại dùng param `:id`)

Hướng này giữ được workflow teacher quen thuộc (sửa tiếp trong editor hiện có).

## 4. API contract frontend cần dùng

## 4.1 Service functions đề xuất

Trong `src/services/apiPdfExam.js`, đề xuất các hàm:

1. `extractPdfExamAPI({ file, testType, title, level })`

- POST `/pdf-exam/extract`
- multipart/form-data

2. `getPdfExamSessionAPI(idSession)`

- GET `/pdf-exam/session/:idSession`

3. `updatePdfExamSessionAPI(idSession, payload)`

- PATCH `/pdf-exam/session/:idSession`
- payload: `{ data, status? }`

4. `savePdfExamSessionAPI(idSession, idUser)`

- POST `/pdf-exam/save/:idSession`
- body: `{ idUser }`

5. `deletePdfExamSessionAPI(idSession)`

- DELETE `/pdf-exam/session/:idSession`

## 4.2 Shape dữ liệu cần quản lý ở UI

State tối thiểu trong trang import:

- `file`
- `testType`
- `title`, `level`
- `idSession`
- `extractedData` (rawData)
- `status`
- `confidence`
- `warnings[]`
- `saving`, `extracting`, `error`

## 5. Luồng UI đề xuất (wizard 3 bước)

## Bước 1: Upload

- Chọn PDF + testType + optional title/level.
- Bấm "Extract".
- Hiển thị loading và progress text.

## Bước 2: Review/Edit

- Render dữ liệu theo `testType`:

1. Reading/Listening: parts -> groups -> questions
2. Writing: writingTasks
3. Speaking: speakingTasks -> questions

- Hiển thị `warnings` và `confidence` để teacher quyết định mức độ sửa tay.
- Cho phép sửa JSON-aware form (không nên cho text area thường để tránh vỡ schema).
- Bấm "Save session update" gọi PATCH.

## Bước 3: Save to DB

- Bấm "Save as Test" gọi `/pdf-exam/save/:idSession` với `idUser`.
- Thành công: lấy `idTest`, thông báo success, navigate sang `testEdit/:idTest`.
- Thất bại: hiển thị lý do + cho retry.

Thêm hành động phụ:

- "Discard session" -> DELETE session -> reset wizard.

## 6. Kế hoạch implement theo phase

## Phase 1: API + route skeleton

- Tạo `apiPdfExam.js`.
- Tạo page `testImportPdf.jsx` + route trong `main.jsx`.
- Thêm nút "Import PDF" trong `testManager.jsx`.
- Hoàn thành upload + extract + hiển thị raw JSON read-only.

Done when:

- Có thể upload PDF và nhận `idSession`, `rawData` trên UI.

## Phase 2: Review editor

- Tạo component review theo từng testType.
- Validate input trước khi PATCH session.
- Hiển thị warnings/confidence rõ ràng.

Done when:

- Teacher sửa dữ liệu trên UI và PATCH thành công.

## Phase 3: Save flow + handoff sang editor hiện tại

- Tích hợp nút save session.
- Gọi save với `idUser` từ `useAuth()`.
- Navigate sang `testEdit/{idTest}` theo route hiện tại.

Done when:

- Test được tạo trong DB và mở được trang test edit ngay sau import.

## Phase 4: Hardening

- Xử lý lỗi đầy đủ (file quá lớn, sai mime, timeout, 401, 500).
- Confirm dialog trước discard.
- Tự động recover session (nếu còn `idSession` trong URL/query).

Done when:

- Flow ổn định với cả trường hợp thành công và thất bại thường gặp.

## 7. Rủi ro và giải pháp

1. Session extraction là in-memory

- Rủi ro: mất session nếu backend restart.
- Giải pháp UI: cảnh báo người dùng, ưu tiên save sớm, có nút re-extract nhanh.

2. PDF layout phức tạp

- Rủi ro: parser sai cấu trúc một số nhóm câu hỏi.
- Giải pháp UI: review step bắt buộc, cho edit trước khi save.

3. Docling có thể không chạy trong môi trường hiện tại

- Rủi ro: chất lượng extract giảm nếu fallback pdfjs.
- Giải pháp UI: hiển thị warnings từ backend rõ ràng, cho phép upload lại/đổi file.

4. Frontend teacher forms có contract riêng

- Rủi ro: dữ liệu import đúng schema backend nhưng render ở một số form custom có thể cần normalize thêm.
- Giải pháp: sau save, dùng flow `get-detail-in-test` hiện có để frontend adapter xử lý nhất quán.

## 8. Checklist QA đề nghị

- Upload được file PDF hợp lệ cho cả 4 testType.
- Reject đúng khi upload file không phải PDF.
- Hiển thị warnings/confidence sau extract.
- PATCH session thành công sau khi sửa tay.
- Save thành công tạo `idTest` và navigate đúng trang edit.
- Session delete/discard hoạt động đúng.
- F5 trang import vẫn tải lại được session nếu còn `idSession`.

## 9. Kết luận

Backend đã có đầy đủ chức năng extract PDF đề thi với session lifecycle rõ ràng. Frontend chỉ cần thêm một import flow riêng cho teacher (service + route + review UI + save handoff) là có thể đưa tính năng vào sử dụng mà không cần đổi API backend.
