# Đề xuất cải tiến — IELTS Training App

Mục tiêu: xây dựng một phần mềm giúp người dùng tự học IELTS hiệu quả, tối ưu chi phí, và sử dụng AI để sinh lộ trình học cá nhân hoá, theo dõi tiến độ và đưa phản hồi tự động.

---

## 1. Tổng quan giải pháp
- Hệ thống cần có một "Learning Plan Engine" dựa trên AI: nhận đầu vào là profile người dùng (trình độ, thời gian có thể bỏ ra, mục tiêu điểm), kết quả bài kiểm tra đánh giá ban đầu, sau đó sinh lộ trình học hàng tuần/ngày có thời lượng, mục tiêu nhỏ, và tài nguyên học (bài học, video, bài tập).
- Ưu tiên tối ưu chi phí: gợi ý tài nguyên miễn phí, cache nội dung phổ biến, gom batch các tác vụ tốn chi phí (ví dụ: phân tích giọng nói bằng dịch vụ trả phí) để giảm chi phí vận hành.

## 2. Tính năng AI chính (đề xuất)
1. Đánh giá đầu vào (Initial Assessment)
   - Bài test ngắn (adaptive) cho 4 kỹ năng để xác định mức baseline.
   - Tự đánh giá & lịch sử điểm để tăng độ chính xác.
2. Generator lộ trình cá nhân (Plan Generator)
   - Lộ trình tuỳ chỉnh: số giờ/ngày, mục tiêu từng tuần, phân chia kỹ năng.
   - Tùy chọn chi phí: `Low-cost` (chỉ dùng nguồn miễn phí), `Balanced`, `Premium`.
3. Adaptive Scheduler
   - Điều chỉnh lộ trình theo tiến độ: tăng/giảm khối lượng, lặp lại điểm yếu.
   - Dùng SRS (spaced repetition) cho từ vựng và cấu trúc ngữ pháp.
4. Microlearning + Content Retriever
   - Lưu trữ metadata + embedding; dùng vector DB để tìm nội dung tương tự.
5. Phản hồi tự động
   - Chấm viết: rubric + điểm số + highlight lỗi, gợi ý sửa.
   - Đánh giá nói: speech-to-text + scoring (pronunciation, fluency).
6. AI Tutor Chat
   - Giải thích ngữ pháp, đưa ví dụ, gợi ý bài tập tiếp theo.

## 3. Tính năng nên cải tiến (ưu tiên)
- Chuẩn hoá API responses (luôn trả mảng/obj nhất quán).
- Xác thực & phân quyền: chuẩn hoá role checks, cho phép `ADMIN` CRUD user, `GIAOVIEN` có quyền quản lý nội dung và học viên theo lớp.
- UX: sửa lỗi chart height, cải thiện phản hồi lỗi, mobile responsiveness.
- Offline/PWA: cho phép tải bài học, quiz cơ bản để học khi không có mạng.
- Tối ưu chi phí: cache, chọn nguồn miễn phí, batch job.

## 4. Những điểm chưa tốt hiện tại
- API response shapes không nhất quán (gây lỗi ở frontend).
- Một số kiểm tra role được gọi bằng hàm không định nghĩa (vd. `hasTeacherPrivileges`).
- Warning/dep: sử dụng prop deprecated (antd `bordered`) và chart width/height warnings.
- Thiếu engine cá nhân hoá/không có adaptive plan.
- Thiếu monitoring & metrics để đánh giá hiệu quả học tập.

## 5. Kiến trúc & kỹ thuật đề xuất
- Core components:
  - Learning Plan Engine (service) — orchestration + prompt templates.
  - Assessment service — lưu kết quả, chuyển sang embeddings.
  - Vector DB (pgvector / Weaviate / Pinecone) để lưu embedding nội dung.
  - Worker queue (BullMQ + Redis) cho tác vụ nặng (chấm viết, chuyển speech).
  - Cache (Redis) + CDN cho tài nguyên tĩnh.
- Mô hình AI:
  - Embeddings: OpenAI / local embedding model.
  - LLM: OpenAI / Anthropic / self-hosted LLM (tùy chi phí và yêu cầu privacy).

## 6. Roadmap & Ưu tiên (MVP → mở rộng)
- Ngắn hạn (0–6 tuần, Effort: Low → Med):
  - Chuẩn hoá API responses, sửa bugs frontend (role checks, chart sizing), cập nhật antd props. (Impact: High)
  - Thêm bài test đánh giá ban đầu (MVP assessment). (Impact: High)
- Trung hạn (1–3 tháng, Effort: Med):
  - Xây Learning Plan Generator (LLM prompt + templates).
  - Basic progress tracking + teacher dashboard.
  - Tối ưu chi phí: cache + ưu tiên tài nguyên miễn phí.
- Dài hạn (3–9 tháng, Effort: High):
  - Auto-grader writing + speech scoring.
  - Adaptive scheduler + SRS.
  - PWA / offline mode; local inference để giảm chi phí.

## 7. Chỉ số đánh giá thành công (KPIs)
- Tăng retention 7-day lên +X%.
- Tiến bộ điểm trung bình (benchmark test) > Y điểm sau 4 tuần.
- Cost per active user giảm Z% so với baseline.
- Tỷ lệ completion cho lộ trình mục tiêu (ví dụ: hoàn thành 70% bài tập) ≥ 60%.

## 8. Rủi ro & biện pháp giảm thiểu
- Rủi ro model hallucination: đảm bảo LLM kèm nguồn tham chiếu, validation rules.
- Dữ liệu nhạy cảm: mã hoá, chỉ lưu metadata cho mô hình; xin opt-in khi dùng dữ liệu dùng để fine-tune.
- Chi phí inference cao: dùng hybrid (open/free models) và batching.

## 9. Quick wins (có thể làm ngay)
1. Chuẩn hoá tất cả API client (`axios`) trả `res.data` hoặc `res` nhất quán.
2. Thay `hasTeacherPrivileges(...)` bằng kiểm tra role trực tiếp. (Đã làm)
3. Sửa chart container: đặt `height` cố định hoặc minHeight, hoặc dùng `<ResponsiveContainer height={300}>`.
4. Thay `bordered` (antd) bằng `variant` theo tài liệu mới.
5. Thêm endpoint `GET /assessment/template` và `POST /assessment/submit` (MVP).

## 10. Next steps đề xuất
1. Xác nhận ưu tiên: MVP assessment + plan generator hay sửa bugs frontend trước?
2. Nếu đồng ý, tôi có thể:
   - Tạo issue/PR cho từng quick-win (API shape, role checks, charts).
   - Scaffold service `learning-plan` với prompt templates và unit tests.

---
Hãy cho tôi biết bạn muốn ưu tiên việc nào — tôi sẽ bắt đầu với PR cho quick-wins hoặc scaffold AI plan engine.

## 11. AI-powered Forum Moderation — Duyệt bài tự động (đề xuất)

Mục tiêu: giảm khối lượng duyệt thủ công cho giáo viên, tăng chất lượng nội dung, chặn spam/tác động xấu, và giữ trải nghiệm người dùng mượt mà.

### 11.1 Tổng quan
- Khi người dùng đăng bài, hệ thống đánh giá chất lượng/nguy cơ bằng pipeline AI (nhanh → sâu) và trả về một `moderation_score` (0..100) kèm `explanation` ngắn.
- Quy tắc quyết định (configurable):
   - score >= 80 → Tự động duyệt (auto-approve, publish)
   - score <= 20 → Tự động loại (auto-reject / hide)
   - 20 < score < 80 → Gửi vào queue để giáo viên duyệt thủ công (needs_review)

### 11.2 Workflow đề xuất (modern, scalable)
1. Submit: user gửi bài → lưu trạng thái `pending` + trả nhanh client (UX: hiển thị chờ duyệt hoặc tạm ẩn tuỳ policy).
2. Fast checks (sync): spam heuristics, blocked-words, rate-limit → nếu fail nặng thì auto-reject.
3. Enqueue scoring (async): push job vào worker queue (BullMQ/Redis).
4. Scoring pipeline (worker):
    - Lightweight classifier (fast, cheap) cho spam/toxicity.
    - Grammar & fluency scorer (smaller model) và relevance classifier.
    - Optional LLM step (summary + explainability) — chỉ chạy nếu confidence thấp hoặc teacher-request.
    - Plagiarism/similarity check via embeddings & vector DB.
    - Aggregate thành `moderation_score` và `reasons`.
5. Decision: apply thresholds → publish / reject / needs_review.
6. Teacher Review UI: list các bài `needs_review` có: score, highlighted issues, suggested edits, action buttons (Approve / Reject / Edit & Request Changes). Hỗ trợ batch actions và filters.
7. Post-action: cập nhật trạng thái bài, notify user, cập nhật reputation.

### 11.3 Gợi ý features tương tự / mở rộng
- Reputation & Trust: người dùng có điểm uy tín cao có thể bypass review hoặc có threshold thấp hơn.
- Suggest Edits: trước khi nộp vào queue, gửi gợi ý sửa lỗi ngữ pháp/format cho user (client-side or server pre-submit) — giúp giảm tải review.
- Community moderation: cho phép trusted peers vote/flag; dùng signals này kết hợp với model score.
- Granular thresholds: khác nhau theo loại nội dung (question/answer/resource) hoặc theo category.
- Human-in-the-loop Active Learning: lưu các quyết định giáo viên làm labeled data để retrain classifier định kỳ.
- Appeals & audit: cho user kháng nghị, lưu audit log (model outputs + reviewer actions).
- Multimodal checks: kiểm duyệt hình ảnh/attachment (NSFW, copyrighted content).

### 11.4 Kỹ thuật & triển khai
- DB: thêm `moderation_status`, `moderation_score`, `moderation_meta` vào bảng `forum_posts`.
- Queue: BullMQ + Redis; workers chạy scoring pipeline.
- Model infra: kết hợp fast classifier (e.g., LightGBM / small transformer) + optional LLM for explanation. Lưu kết quả model và confidence.
- Vector DB: Weaviate / pgvector / Pinecone cho similarity/plagiarism.
- API: endpoints để lấy queue, submit review action, fetch explanation.
- UI: Teacher Review Dashboard (paginated, filterable, with inline diff/suggested-fixes).

### 11.5 Monitoring & KPIs
- Tỷ lệ tự động duyệt (%) vs manual review.
- False positive / negative rate (qua feedback teacher/appeals).
- Thời gian trung bình để review manual.
- Giảm workload giáo viên (số bài review / ngày).

### 11.6 Privacy, safety & cost
- Lưu dữ liệu dùng cho training chỉ khi có consent; ẩn PII khi gửi cho LLM bên thứ ba.
- Bắt đầu bằng pipeline hybrid (cheap classifiers first, LLM có điều kiện) để kiểm soát chi phí.

### 11.7 Quick implementation plan (MVP)
1. DB migration: thêm trường moderation_*.
2. Worker skeleton + fake scorer (returns random or rule-based score) → end-to-end flow.
3. Teacher Review UI (list + actions) + API endpoints.
4. Replace fake scorer với real model + explainability.

---

Nếu bạn muốn, tôi có thể:
- tạo PR scaffold worker + DB migration + simple teacher-review UI, hoặc
- chỉ tạo issue list chi tiết từng bước để bạn/đội dev làm.

## 12. Tách nghiệp vụ Admin khỏi Teacher (đề xuất bổ sung)

Mục tiêu: làm rõ vai trò vận hành hệ thống của Admin, tránh trùng lặp với Teacher và tạo nền để mở rộng moderation, governance, monitoring.

### 12.1 Vấn đề hiện tại
- Route và giao diện Admin đang dùng lại nhiều thành phần của Teacher, khiến nghiệp vụ bị pha trộn.
- Một số check role chưa nhất quán giữa `GIAOVIEN` và `TEACHER`, dễ gây sai quyền hiển thị/chỉnh sửa.
- Một số luồng điều hướng quản lý đề còn hard-code theo đường dẫn Teacher.
- Quyền CRUD user đã có nhưng cần đóng gói thành màn hình quản trị hệ thống thay vì nằm chung luồng giáo viên.

### 12.2 Mục tiêu phân vai rõ ràng
- `ADMIN`: quản trị hệ thống, phân quyền, kiểm duyệt nội dung, giám sát chất lượng dữ liệu và vận hành.
- `GIAOVIEN`: quản lý nội dung học thuật, theo dõi học viên, hỗ trợ chuyên môn.
- `USER`: học tập, làm bài, theo dõi tiến độ cá nhân.

### 12.3 Nhóm chức năng riêng cho Admin
1. System Dashboard (vận hành hệ thống)
   - Tổng users theo vai trò, tăng trưởng theo tuần/tháng.
   - Tổng bài test đã nộp, tỉ lệ hoàn thành, phân bố band score toàn hệ thống.
   - Cảnh báo chất lượng: tỉ lệ lỗi API, tỉ lệ fail chấm bài AI, hàng đợi moderation.
2. User Governance
   - Quản lý tài khoản tập trung: tạo/sửa/xóa user, đổi role, khoá/mở tài khoản.
   - Bộ lọc theo role, level, trạng thái active.
   - Batch actions: cập nhật role theo nhóm, xoá mềm hoặc vô hiệu hoá tài khoản.
3. Content Governance
   - Quản trị kho đề/grammar/vocabulary ở cấp hệ thống.
   - Luồng duyệt trước publish cho nội dung quan trọng.
   - Theo dõi ai tạo/sửa nội dung gần nhất (audit cơ bản).
4. Forum Moderation Center
   - Hàng đợi bài viết `needs_review` với score, reasons, confidence.
   - Batch approve/reject, lọc theo loại vi phạm.
   - Nhật ký quyết định để phục vụ active learning và khiếu nại.
5. Audit & Configuration
   - Cấu hình ngưỡng moderation theo category.
   - Quản lý blocked words/rules và rate-limit policy.
   - Lưu audit log cho thao tác quản trị nhạy cảm.

### 12.4 Quick wins có thể làm ngay (Frontend + API hiện có)
1. Tách `AdminLayout` và `AdminNavbar` khỏi Teacher layout.
2. Tách route `/admin/*` dùng component riêng, không dùng lại `TeacherDashboard`.
3. Chuẩn hoá role constants toàn frontend về một nguồn duy nhất (`ADMIN`, `GIAOVIEN`, `USER`).
4. Sửa các điều hướng hard-code `/teacher/...` trong luồng admin thành base path động theo role.
5. Chuẩn hoá API user (đặc biệt endpoint xóa user) để đồng bộ với backend contract.

### 12.5 API có thể tận dụng ngay
- Dashboard: `GET /dashboard/overview`, `GET /dashboard/top-performers`, `GET /dashboard/top-streaks`, `GET /dashboard/skills`.
- Users: `GET /users/get-all`, `POST /users/create-user`, `PATCH /users/update-user/:idUser`, `DELETE /users/delete-user/:idUser`.
- Forum: CRUD threads/posts/comments hiện đã đủ để dựng moderation thủ công giai đoạn đầu.
- Test results: `GET /user-test-result/get-all-test-results` phục vụ thống kê vận hành.

### 12.6 API nên bổ sung (để Admin đúng nghĩa)
- Moderation queue API: lọc theo trạng thái, score range, assignee.
- Review actions API: approve/reject/request-changes kèm lý do và người duyệt.
- Audit log API: truy vết thao tác quản trị và lịch sử thay đổi role.
- System settings API: ngưỡng moderation, policy và feature flags.

### 12.7 Roadmap triển khai
1. Giai đoạn 1 (0-2 tuần)
   - Tách layout/routes admin.
   - Chuẩn hoá role checks và fix mismatch endpoint user.
   - Dựng Admin Dashboard bản đầu dùng API sẵn có.
2. Giai đoạn 2 (2-6 tuần)
   - Dựng User Governance đầy đủ + batch actions.
   - Dựng Forum Moderation Center bản manual review.
   - Thêm audit log tối thiểu.
3. Giai đoạn 3 (6-10 tuần)
   - Kết nối AI moderation pipeline (score + reasons).
   - Cấu hình policy/threshold theo category.
   - Bổ sung KPI và cảnh báo vận hành thời gian thực.

### 12.8 KPI cho khối Admin
- Giảm thời gian duyệt nội dung trung bình (MTTR moderation).
- Giảm tỉ lệ nội dung vi phạm lọt qua kiểm duyệt.
- Giảm thời gian xử lý yêu cầu quản trị user.
- Tăng độ nhất quán phân quyền (giảm lỗi role-based access trên frontend).

### 12.9 Ma trận quyền chính thức sau cập nhật (RBAC v1)

Vai trò chuẩn duy nhất trong hệ thống:
- `ADMIN`
- `GIAOVIEN`
- `USER` (student)

| Nhóm quyền | ADMIN | GIAOVIEN | USER (Student) |
|---|---|---|---|
| Truy cập route | `/admin/*` | `/teacher/*` | `/` (user app) |
| Truy cập route vai trò khác | Không | Không | Không |
| Dashboard | Toàn hệ thống | Theo phạm vi học viên được phụ trách | Cá nhân |
| Quản lý người dùng | CRUD toàn bộ user | Chỉ xem danh sách học viên thuộc phạm vi phụ trách | Không |
| Đổi role user | Có | Không | Không |
| Khoá/Mở khoá tài khoản | Có | Không | Không |
| Quản trị đề thi (test/part/question) | CRUD toàn hệ thống | CRUD trong phạm vi nghiệp vụ giảng dạy | Chỉ làm bài |
| Quản trị grammar/vocab hệ thống | CRUD toàn hệ thống | CRUD nội dung chuyên môn trong phạm vi được cấp | Chỉ học/lưu cá nhân |
| Forum moderation | Duyệt toàn cục, batch approve/reject, cấu hình policy | Duyệt các mục được phân công | Không |
| Forum posting | Có | Có | Có |
| Sửa/Xóa bài người khác trên forum | Có | Có (chỉ theo phạm vi moderation) | Không |
| Quản lý cấu hình hệ thống (threshold/rules/feature flags) | Có | Không | Không |
| Xem audit log | Có | Chỉ log liên quan nghiệp vụ của mình | Không |
| Hồ sơ cá nhân | Có | Có | Có |

Quy tắc cưỡng chế bắt buộc:
1. Deny-by-default: endpoint nào chưa khai báo quyền thì mặc định từ chối.
2. Chuẩn role duy nhất: chỉ dùng `ADMIN`, `GIAOVIEN`, `USER`; loại bỏ hoàn toàn `TEACHER` trên frontend/backend.
3. Tách route theo vai trò: admin không dùng lại teacher layout/components cho nghiệp vụ chính.
4. API user nhạy cảm (`create/update/delete/role change`) chỉ `ADMIN` được phép.
5. Teacher không có quyền cấp hệ thống: không đổi role, không đổi policy, không xem audit log toàn cục.

Phạm vi endpoint áp dụng ngay (theo contract hiện có):
1. User management: `GET /users/get-all`, `POST /users/create-user`, `PATCH /users/update-user/:idUser`, `DELETE /users/delete-user/:idUser`.
2. Dashboard: `GET /dashboard/overview`, `GET /dashboard/top-performers`, `GET /dashboard/top-streaks`, `GET /dashboard/skills`.
3. Test governance: nhóm endpoint `/test/*`, `/part/*`, `/question/*`, `/question-group/*`, `/passage/*`.
4. Forum governance: nhóm endpoint `/forum-threads/*`, `/forum-post/*`, `/forum-comment/*`.

### 12.10 Giải thích chi tiết phạm vi quyền giáo viên và mở rộng quyền admin

#### 12.10.1 `CRUD nội dung chuyên môn trong phạm vi được cấp` (bên giáo viên)

Định nghĩa `phạm vi được cấp` theo 4 chiều bắt buộc:
1. Theo đối tượng học viên: lớp/nhóm/khóa mà giáo viên phụ trách.
2. Theo domain nội dung: Reading/Listening/Writing/Speaking/Grammar/Vocabulary.
3. Theo ownership: nội dung do chính giáo viên tạo hoặc được admin assign.
4. Theo trạng thái nội dung: draft, pending_review, published, archived.

Quyền cụ thể của giáo viên:
1. Create:
   - Được tạo nội dung mới trong domain được cấp.
   - Nội dung mới mặc định vào `draft` hoặc `pending_review` (không publish thẳng nếu policy yêu cầu duyệt).
2. Read:
   - Được xem nội dung công khai và nội dung thuộc phạm vi được gán.
   - Không đọc dữ liệu nhạy cảm ngoài phạm vi lớp/nhóm phụ trách.
3. Update:
   - Được sửa nội dung do mình tạo hoặc được assign.
   - Không sửa metadata hệ thống (policy flags, global thresholds, role mappings).
4. Delete:
   - Chỉ xóa mềm (soft delete) nội dung `draft`/`pending_review` trong phạm vi.
   - Nội dung đã `published` nên chuyển sang `request_archive` để admin duyệt.

Các vấn đề cần khóa chặt ở phía giáo viên:
1. Không lấy `idUser` từ payload để quyết định quyền; backend phải lấy từ JWT.
2. Không chỉ chặn bằng UI; endpoint backend phải kiểm tra role + scope đầy đủ.
3. Không cho quyền sửa/xóa nội dung ngoài phạm vi dù đoán được ID.
4. Cần audit log cho mọi thao tác update/delete để truy vết.
5. Cần optimistic lock/version để tránh 2 giáo viên ghi đè cùng một nội dung.

#### 12.10.2 Quyền admin có thể bổ sung thêm (ngoài ma trận hiện tại)

1. Permission Templates:
   - Tạo bộ quyền mẫu theo khoa/bộ môn và gán hàng loạt cho giáo viên.
2. Delegation Controls:
   - Giao quyền tạm thời (time-bound) cho giáo viên trưởng nhóm.
3. Content Lifecycle Controls:
   - Force publish/unpublish, archive/restore theo batch.
4. Moderation Override:
   - Ghi đè quyết định AI moderation kèm lý do bắt buộc.
5. Policy Sandbox:
   - Môi trường thử rule trước khi áp dụng production.
6. Incident Actions:
   - Tạm khóa tính năng theo module (feature kill switch) khi có sự cố.
7. Compliance Export:
   - Xuất báo cáo audit và lịch sử thay đổi policy theo kỳ.

#### 12.10.3 Admin sửa rules hệ thống có bị gò không?

Có. Admin được sửa rule nhưng trong khung bảo vệ bắt buộc (guardrails):

1. Nhóm rule admin được sửa:
   - Moderation thresholds.
   - Blocked words / spam patterns.
   - Rate-limit policy cấp ứng dụng.
   - Feature flags và rollout rules.

2. Nhóm rule admin không được sửa trực tiếp:
   - Cơ chế auth cốt lõi (JWT/refresh flow).
   - Secret keys và cấu hình hạ tầng nhạy cảm.
   - Nguyên tắc RBAC nền tảng (deny-by-default, role enum chuẩn).

3. Guardrails bắt buộc khi sửa rule:
   - Validation biên giá trị (ví dụ threshold chỉ nhận 0..100).
   - Versioning + diff cho mọi thay đổi policy.
   - Bắt buộc nhập lý do thay đổi (reason code).
   - Hỗ trợ rollback về version trước trong 1 click.
   - Rule nhạy cảm áp dụng cơ chế 4-eyes (2 người duyệt).
   - Audit log bất biến (ai sửa, sửa gì, lúc nào, trước/sau).

4. Nguyên tắc vận hành:
   - `fail-safe defaults`: rule lỗi thì quay về ngưỡng an toàn mặc định.
   - `least privilege`: chỉ admin được ủy quyền mới có quyền sửa từng nhóm rule.
   - `progressive rollout`: áp dụng dần theo nhóm nhỏ trước khi bật toàn hệ thống.

---

Nếu cần, bước tiếp theo có thể là tách ngay `AdminLayout/AdminNavbar` và tạo `AdminDashboard` riêng để thay thế phần đang dùng chung với Teacher.

