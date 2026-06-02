# BÁO CÁO CẬP NHẬT DỰ ÁN
## Website Luyện Thi IELTS Tích Hợp AI

**Ngày cập nhật:** 2026-06-02
**So sánh với:** Đồ án gốc (DA_23520755_TranDangKhoa_23520683_DuongTrongKhang.docx)

---

## 1. THAY ĐỔI VỀ TECH STACK

### 1.1 Backend - Không thay đổi

| Công nghệ | Trạng thái | Phiên bản |
|-----------|------------|-----------|
| **Framework** | ✅ NestJS | ^11.0.1 |
| **Database** | ✅ PostgreSQL | - |
| **ORM** | ✅ Prisma | 6.19.1 |
| **Cache** | ✅ Redis (cache-manager-redis-store) | ^3.0.1 |
| **Auth** | ✅ JWT (passport-jwt) | ^4.0.1 |
| **Ngôn ngữ** | ✅ TypeScript | ES2023 target |
| **API Docs** | ✅ Swagger | ^11.2.0 |

### 1.2 Frontend - Không thay đổi, có bổ sung

| Công nghệ | Trạng thái | Phiên bản |
|-----------|------------|-----------|
| **Framework** | ✅ ReactJS (React 19) | ^19.1.1 |
| **Build tool** | ✅ Vite | ^7.1.2 |
| **UI Library** | ✅ Ant Design | ^5.29.1 |
| **Styling** | ✅ TailwindCSS | ^4.1.14 |
| **Icons** | ✅ Lucide React | ^0.543.0 |
| **Routing** | ✅ React Router DOM | ^7.8.2 |

**⚠️ LƯU Ý:** Dự án vẫn sử dụng ReactJS, **KHÔNG chuyển sang template engine thuần (Blade/EJS)**. Frontend hoàn toàn là SPA (Single Page Application).

### 1.3 Các thư viện mới được thêm vào

#### Backend (mới so với đồ án):
- `@nestjs/schedule` ^6.0.0 - Cron job scheduling
- `@nestjs/cache-manager` ^3.0.1 - Cache management
- `amqplib` - RabbitMQ message queue
- `@google-cloud/speech` ^7.2.1 - Speech-to-Text
- `@google/genai` ^1.22.0 - Gemini AI (vocabulary, forum moderation, chat-bot backend)
- `groq-sdk` - Groq AI (AI workers: grading, chatbot, embedding)
- `pdfjs-dist` ^4.9.155 - PDF parsing
- `zod` ^3.25.76 - Schema validation
- `date-fns` ^4.1.0 - Date manipulation
- `dayjs` ^1.11.18 - Date manipulation
- `@nestjs/throttler` ^6.5.0 - Rate limiting
- `nodemailer` ^7.0.6 - Email sending
- `@nestjs-modules/mailer` ^2.0.2 - Mail module
- `handlebars` ^4.7.8 - Email templating
- `class-transformer` / `class-validator` - DTO validation
- `cheerio` / `htmlparser2` - HTML parsing
- `axios` - HTTP client

#### Frontend (mới so với đồ án):
- `@radix-ui/*` - UI primitives (dialog, dropdown, radio, etc.)
- `@tinymce/tinymce-react` ^6.3.0 - Rich text editor
- `framer-motion` ^12.23.12 - Animations
- `react-markdown` ^10.1.0 - Markdown rendering
- `recharts` ^3.5.1 - Charts
- `sonner` ^2.0.7 - Toast notifications
- `emoji-picker-react` ^4.16.1 - Emoji picker
- `react-to-print` ^3.1.1 - Print functionality
- `input-otp` ^1.4.2 - OTP input
- `js-cookie` ^3.0.5 - Cookie handling
- `mitt` ^3.0.1 - Event emitter

### 1.4 TypeScript Configuration

**Backend tsconfig.json:**
```json
{
  "strictNullChecks": true,
  "noImplicitAny": false,  // ⚠️ Vẫn cho phép 'any'
  "target": "ES2023",
  "module": "nodenext"
}
```

**⚠️ LƯU Ý:** Backend có `noImplicitAny: false` - nghĩa là vẫn cho phép sử dụng kiểu `any` nhưng không khuyến khích. TypeScript strict mode không được bật hoàn toàn.

**Frontend:** Sử dụng jsconfig.json (không có tsconfig.json), phục vụ cho Vite build.

---

## 2. THAY ĐỔI VỀ NGHIỆP VỤ VÀ USE CASE

### 2.1 Mô hình tự học (Self-study) ✅ ĐÃ TỐI ƯU

Dự án hiện tại **tập trung hoàn toàn vào mô hình tự học**:

| Tính năng | Đồ án gốc | Hiện tại | Ghi chú |
|-----------|-----------|----------|---------|
| AI Grading | ✅ Có | ✅ Có | Tích hợp Gemini AI |
| Chatbot AI | ✅ Có | ⚠️ Module tồn tại | Cần kiểm tra API endpoint |
| Gamification | ✅ Có | ✅ Có | XP, Streak, Level |
| Test Suggestion | ✅ Có (UC-05) | ⚠️ Module tồn tại | recommend-test module |
| Self-study Vocab | ⚠️ Cơ bản | ✅ Nâng cao | SM-2 spaced repetition |
| Study Planner | ❌ Không | ✅ Có | Hoàn toàn mới |
| Teacher Review | ⚠️ Lý thuyết | ✅ Có | Backend + Frontend |

### 2.2 Các module mới được thêm vào

#### Backend Modules (so với đồ án):

| Module | Mô tả | Đồ án gốc |
|--------|--------|-----------|
| `study-planner` | Lộ trình học 4 giai đoạn (Foundation → Skill Building → Integration → Exam Prep) | ❌ Không có |
| `weakness` | Phát hiện điểm yếu dựa trên Grammar + Question Type | ❌ Không có |
| `grammar-tracking` | Theo dõi tiến độ grammar của user | ❌ Không có |
| `question-type-performance` | Tracking performance theo từng question type | ❌ Không có |
| `teacher-review` | Hệ thống chấm bài thủ công bởi giáo viên | ⚠️ Mô tả sơ lược |
| `credits` | Quản lý credit balance | ❌ Không có |
| `payment` | Thanh toán VNPay/MoMo | ❌ Không có |
| `subscription` | Gói subscription | ❌ Không có |
| `system-config` | Cấu hình hệ thống | ❌ Không có |
| `audit-log` | Nhật ký hành động | ❌ Không có |
| `chat-bot` | Chatbot AI với context | ⚠️ Trong UC-06 |

#### Frontend Pages (so với đồ án):

| Page | Đường dẫn | Đồ án gốc |
|------|-----------|-----------|
| `studyPlanner.jsx` | /study-planner | ❌ Không có |
| `GrammarPractice.jsx` | /grammar-practice | ❌ Không có |
| `VocabDaily/` | /vocab-daily | ❌ Không có |
| `statistic.jsx` | /statistic | ⚠️ Mô tả chung |
| `teacherReviewHistory.jsx` | /teacher-review-history | ⚠️ Mô tả chung |
| `teacherQueue.jsx` | /teacher/teacher-queue | ❌ Không có |
| `forumModeration.jsx` | /teacher/forum-moderation | ❌ Không có |
| `adminDashboard.jsx` | /admin/dashboard | ⚠️ Mô tả chung |
| `teacherReviewManager.jsx` | /admin/teacher-review | ❌ Không có |

### 2.3 Luồng nghiệp vụ thay đổi

#### **Study Planner** (HOÀN TOÀN MỚI)
- User nhập target band score, ngày thi, thời gian học/ngày
- Hệ thống tự động tính toán lộ trình dựa trên 4 stages:
  - Foundation: Band 0-5.0
  - Skill Building: Band 5.0-6.0
  - Integration: Band 6.0-7.0
  - Exam Prep: Band 7.0+
- Daily tasks được tạo tự động
- Streak tracking cho việc hoàn thành task

#### **Teacher Review** (MỚI)
- Học viên yêu cầu GV chấm sau khi hoàn thành Writing/Speaking
- Tốn credit để tạo ticket
- GV nhận bài, chấm điểm, viết feedback
- Trạng thái: PENDING → CLAIMED → IN_PROGRESS → COMPLETED

#### **Credits & Payment** (MỚI)
- User mua credit package (VNPay/MoMo)
- Sử dụng credit cho Writing/Speaking AI grading
- Subscription packages với billing cycle

#### **SM-2 Spaced Repetition** (NÂNG CẤP)
- Vocabulary sử dụng thuật toán SM-2 thay vì simple flashcard
- Fields mới: `easinessFactor`, `interval`, `nextReviewAt`, `timesReviewed`, `status`
- Auto-scheduling review dựa trên performance

### 2.4 Các tính năng bị cắt bỏ hoặc thay đổi

| Tính năng | Đồ án | Hiện tại | Ghi chú |
|-----------|-------|----------|---------|
| WritingTask.word_limit | Có | ❌ Không | Đã bị loại bỏ |
| Vocabulary.correctStreak | Có đơn giản | ✅ SM-2 | Đã nâng cấp |
| Chatbot AI detailed flow | Đầy đủ | ⚠️ Module tồn tại | Cần verify |
| Test Suggestion algorithm | Chi tiết | ⚠️ Module tồn tại | Cần verify |

---

## 3. THAY ĐỔI VỀ DATABASE SCHEMA

### 3.1 Các bảng MỚI được thêm vào

| Bảng | Mô tả | Mục đích |
|------|-------|----------|
| `CreditPackage` | Gói credit có giá | Payment |
| `CreditBalance` | Số dư credit của user | Payment |
| `CreditTransaction` | Lịch sử giao dịch credit | Payment |
| `SubscriptionPackage` | Gói subscription | Payment |
| `UserSubscription` | Subscription của user | Payment |
| `PaymentTransaction` | Giao dịch thanh toán VNPay/MoMo | Payment |
| `TeacherReviewTicket` | Ticket yêu cầu GV chấm | Teacher Review |
| `SystemConfig` | Cấu hình hệ thống | Admin |
| `AuditLog` | Nhật ký hành động | Admin |
| `QuestionTypePerformance` | Performance theo question type | Analytics |
| `UserDailyTaskCompletion` | Task completion tracking | Study Planner |
| `UserStudyPreference` | Preferences cho study planner | Study Planner |
| `GrammarExercise` | Bài tập grammar | Grammar |
| `UserGrammarProficiency` | Proficiency tracking | Grammar |
| `UserGrammarViolation` | Lỗi grammar của user | Grammar |
| `UserGrammarExerciseResult` | Kết quả bài tập | Grammar |
| `UserGrammarExerciseSR` | SM-2 cho grammar exercise | Grammar |
| `GrammarsOnCategories` | Junction table | Grammar |
| `ForumPost.moderationStatus` | Trạng thái moderation | Forum |

### 3.2 Các bảng đã bị loại bỏ

| Bảng | Lý do |
|------|-------|
| Không có bảng nào bị loại bỏ hoàn toàn | Các bảng cũ được giữ lại và mở rộng |

### 3.3 Các trường quan trọng được THÊM vào bảng cũ

#### **User table** - Thêm 6 trường mới:
```prisma
targetBandScore      Float?        // Mục tiêu band
targetExamDate       DateTime?     // Ngày thi dự kiến
creditBalance        CreditBalance?// Liên kết credit
paymentTransactions   PaymentTransaction[]
subscriptions        UserSubscription[]
userDailyTaskCompletions UserDailyTaskCompletion[]
userStudyPreference  UserStudyPreference?
```

#### **Vocabulary table** - Thêm SM-2 fields:
```prisma
timesReviewed        Int       @default(0)
easinessFactor      Float     @default(2.5)
interval            Int       @default(1)
nextReviewAt        DateTime?
status              String    @default("new")  // new|learning|review|mastered
tier                Int       @default(1)       // 1: 3k, 2: AWL, 3: specialized
frequencyRank       Int?
```

#### **UserWritingSubmission** - Thêm grading fields:
```prisma
aiGradingStatus     GradingStatus  @default(PENDING)
aiOverallScore       Float?
aiDetailedFeedback   Json?
gradedAt            DateTime?
idCreditTransaction  String?
```

#### **UserSpeakingSubmission** - Thêm grading fields:
```prisma
aiGradingStatus     GradingStatus  @default(PENDING)
aiOverallScore       Float?
aiDetailedFeedback   Json?
gradedAt            DateTime?
idCreditTransaction  String?
```

#### **ForumPost** - Thêm moderation fields:
```prisma
moderationStatus    ForumModerationStatus @default(PENDING)
moderationScore     Int?
moderationMeta      Json?
reviewedBy          String?
reviewedAt          DateTime?
```

### 3.4 Cấu trúc enum MỚI

```prisma
// Payment related
enum PaymentStatus { PENDING, SUCCESS, FAILED, EXPIRED, REFUNDED }
enum PaymentPackageType { CREDIT, SUBSCRIPTION }
enum CreditTransType { PURCHASE, USED_WRITING, USED_SPEAKING, REFUND, EXPIRY, BONUS, ADMIN_ADJUST }
enum CreditTransStatus { PENDING, COMPLETED, FAILED, CANCELLED }
enum BillingCycle { MONTHLY, ANNUAL }
enum SubscriptionStatus { ACTIVE, EXPIRED, CANCELLED, SUSPENDED }
enum PaymentMethod { MOMO, VNPAY, STRIPE, BANK_TRANSFER, ADMIN_CREDIT }

// Forum
enum ForumModerationStatus { PENDING, AUTO_APPROVED, NEEDS_REVIEW, AUTO_REJECTED, APPROVED, REJECTED, CHANGES_REQUESTED }

// Teacher Review
enum ReviewType { WRITING, SPEAKING }
enum TeacherReviewStatus { PENDING, CLAIMED, IN_PROGRESS, COMPLETED, CANCELLED }

// AI Grading
enum GradingStatus { PENDING, GRADING, COMPLETED, FAILED }

// Vocab
enum VocabType { NOUN, VERB, ADJECTIVE, ADVERB, PHRASE, IDIOM, PREPOSITION, CONJUNCTION, INTERJECTION }
```

---

## 4. THAY ĐỔI VỀ GIAO DIỆN VÀ KIẾN TRÚC THƯ MỤC

### 4.1 Backend - Cấu trúc thư mục

```
ielts_training_app/src/
├── module/                    # 41 modules (tăng từ ~15)
│   ├── study-planner/        # MỚI
│   ├── weakness/             # MỚI
│   ├── grammar-tracking/     # MỚI
│   ├── question-type-performance/  # MỚI
│   ├── teacher-review/       # MỚI
│   ├── credits/              # MỚI
│   ├── payment/              # MỚI
│   ├── subscription/          # MỚI
│   ├── system-config/         # MỚI
│   ├── audit-log/            # MỚI
│   ├── chat-bot/             # MỚI
│   └── (các module cũ giữ nguyên)
├── auth/
├── common/
├── core/
├── database/
├── helpers/
├── types/
├── decorator/
├── cloudinary/
├── rabbitmq/
└── main.ts
```

**Số lượng modules:**
- Đồ án gốc: ~15 modules (Auth, Test, User, Vocabulary, Grammar, Forum, etc.)
- Hiện tại: **41 modules**

### 4.2 Frontend - Cấu trúc thư mục

```
IELTS-training-website/src/
├── Pages/
│   ├── client/
│   │   ├── auth/          # Login, Register, OTP
│   │   ├── grammar/      # Grammar pages
│   │   ├── VocabDaily/   # MỚI - Daily vocabulary
│   │   ├── test/         # Test detail, review
│   │   ├── grammar.jsx   # Main grammar page
│   │   ├── GrammarPractice.jsx  # MỚI
│   │   ├── homePage.jsx
│   │   ├── studyPlanner.jsx    # MỚI
│   │   ├── vocabulary.jsx
│   │   ├── statistic.jsx       # MỚI
│   │   └── teacherReviewHistory.jsx
│   ├── admin/
│   │   ├── adminDashboard.jsx  # MỚI
│   │   └── teacherReviewManager.jsx  # MỚI
│   ├── teacher/
│   │   ├── teacherDashboard.jsx
│   │   ├── teacherQueue.jsx    # MỚI
│   │   ├── forumModeration.jsx # MỚI
│   │   └── userList.jsx
│   ├── landingPage.jsx
│   └── StartingPage.jsx
├── components/
│   ├── Forum/
│   ├── Vocab/
│   ├── common/
│   ├── landingPage/
│   ├── onboarding/
│   ├── test/
│   └── ui/
├── services/
├── context/
├── lib/
└── main.jsx
```

### 4.3 Các màn hình mới trong Frontend

| Màn hình | URL | Mô tả |
|----------|-----|-------|
| Study Planner | /study-planner | Lập kế hoạch học tập |
| Grammar Practice | /grammar-practice | Luyện tập ngữ pháp |
| Vocab Daily | /vocab-daily | Ôn từ hàng ngày (SM-2) |
| Statistics | /statistic | Xem biểu đồ & thống kê |
| Teacher Queue | /teacher/teacher-queue | Hàng chờ chấm bài |
| Forum Moderation | /teacher/forum-moderation | Duyệt bài viết |
| Admin Dashboard | /admin/dashboard | Quản lý hệ thống |
| Teacher Review Manager | /admin/teacher-review | Quản lý review |
| Teacher Review History | /teacher-review-history | Lịch sử yêu cầu |

### 4.4 Các màn hình đã THAY ĐỔI

| Màn hình | Thay đổi |
|----------|----------|
| Trang chủ | Thêm lblEditTarget (thay đổi ngày thi & mục tiêu) |
| Vocabulary | Thêm SM-2, flashcard, daily practice |
| Grammar | Thêm system/user tabs, practice |
| Test | Thêm AI grading status, credit deduction |

---

## 5. TỔNG KẾT CÁC ĐIỂM THAY ĐỔI

### 5.1 Tech Stack - Không thay đổi lớn
- Vẫn sử dụng React + NestJS + PostgreSQL + Prisma
- Thêm nhiều thư viện mới (AI, payment, scheduling)
- TypeScript config không strict mode

### 5.2 Nghiệp vụ - Có nhiều thay đổi lớn

| Nhóm tính năng | Thay đổi |
|----------------|----------|
| **Study Planner** | HOÀN TOÀN MỚI - 4 stages, daily tasks, streak |
| **Credits & Payment** | HOÀN TOÀN MỚI - VNPay/MoMo integration |
| **Teacher Review** | MỚI - Ticket system, GV chấm bài |
| **SM-2 Vocabulary** | NÂNG CẤP - Spaced repetition algorithm |
| **Grammar Exercises** | MỚI - Grammar exercise system |
| **Weakness Detection** | MỚI - Phân tích điểm yếu |
| **Question Type Performance** | MỚI - Tracking theo question type |

### 5.3 Database - Mở rộng lớn

| Thống kê | Đồ án | Hiện tại |
|----------|-------|----------|
| Số bảng | 27 | ~40+ |
| Số enum | ~10 | 20+ |
| Modules backend | ~15 | 41 |

### 5.4 UI/UX - Bổ sung nhiều trang mới

- 9 trang mới được thêm
- Study Planner, Grammar Practice, Statistics
- Teacher Queue, Forum Moderation
- Admin Dashboard, Payment pages

---

## 6. CÁC TÍNH NĂNG CẦN KIỂM TRA THÊM

1. **Chatbot AI** - Module tồn tại nhưng chưa verify API endpoint
2. **Test Suggestion** - Module tồn tại nhưng chưa verify algorithm
3. **AI Grading Workers** - Cần verify đang chạy hay có lỗi
4. **Payment Integration** - Cần verify VNPay/MoMo flow
5. **Subscription** - Cần verify billing cycle logic

---

*Báo cáo này tập trung vào những thay đổi và điểm mới so với đồ án gốc.*