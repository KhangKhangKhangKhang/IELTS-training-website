# Merge: vocab-enhancer → fix/ai-grading-notes-and-app-module-merge

Ngày merge: **2026-06-19**
Branch nguồn: `vocab-enhancer`
Branch đích: `fix/ai-grading-notes-and-app-module-merge`
Người thực hiện: garan + Claude (M3)

## Context

Bạn của user chạy `npx prisma generate` trong Docker build, output lỗi `TS18004` ở `ai-workers/grading-worker/src/services/neon.service.ts:186,189` — shorthand `idUser` không tồn tại trong scope (biến thật là `userId`).

Commit `077e7b4` trên branch `vocab-enhancer` đã sửa lỗi này, cùng với 6 commit khác bổ sung các tính năng quan trọng. Quyết định merge vocab-enhancer để vừa fix build vừa lấy luôn các tính năng mới.

## 7 commit đã apply

| # | Commit | Mô tả |
|---|--------|-------|
| 1 | `077e7b4` | Fix TS18004 (`idUser` → `userId` trong neon.service.ts) + bỏ type assertion thừa ở `question-metadata.validator.ts` |
| 2 | `96bac59` | Vocabulary: thêm `getDailySessionWords`, `saveToCollection` — gộp due review + new vocab |
| 3 | `0a8a981` | Grammar tracking: xử lý `correctGrammarUsages` (streak), reset `consecutiveCorrect` khi vi phạm |
| 4 | `0859654` | Grammar service: `getDashboard`, `getPracticeByTopic`, `getDueReviews`, `saveViolation`, `submitExercise`, `recalculateProficiency`. User-test-result: `getSkillStatus`. Tạo `WeaknessModule` mới. |
| 5 | `a92351b` | Proficiency algorithm V2: 4 mức tiếng Việt (hoàn thành / tốt / trung bình / cần cải thiện) dựa trên streak + accuracy + violations |
| 6 | `191e828` | Schema: thêm `correctUsages` field trên `UserGrammarProficiency` |
| 7 | `d974b44` | Study Planner V2: priority weights (40/30/20/10), dynamic grammar % theo stage (25/18/13/10), `historyMonths` filter, `missingSkills` info, dynamic config qua `SystemConfigService` |

## Tính năng mới (cho frontend)

### 1. Vocabulary SM-2 daily session

**Endpoint mới:**
- `GET /vocabulary/daily-session?idUser=...&quota=15` — mix due review + new system vocab
- `POST /vocabulary/save-to-collection` — body `{idUser, vocabId, topicId?}` — copy system vocab vào collection

**Response shape `daily-session`:**
```json
{
  "words": [
    { "idVocab": "...", "word": "...", "phonetic": "...", "meaning": "...", "isNew": false, "status": "learning" }
  ],
  "dueCount": 8,
  "newCount": 7,
  "sessionDate": "2026-06-19T00:00:00.000Z"
}
```

### 2. Grammar proficiency V2

**Endpoint mới:**
- `GET /grammar/dashboard?idUser=...` (public)
- `GET /grammar/:idGrammar/practice?count=10`
- `GET /grammar/:idGrammar/due-reviews?idUser=...`
- `POST /grammar/violation` — body `{idUser, idGrammar, source, userSentence, correctedSentence}`

**Proficiency levels (đổi từ EN sang VI):**
- `"unknown"` — chưa đủ data
- `"hoàn thành"` — streak ≥ 10 hoặc (streak ≥ 5 AND accuracy ≥ 90%)
- `"tốt"` — streak ≥ 5 hoặc (streak ≥ 3 AND accuracy ≥ 80%)
- `"trung bình"` — accuracy ≥ 50% hoặc streak ≥ 3
- `"cần cải thiện"` — có violations chưa fix

**Response per topic trong dashboard:**
```json
{
  "idGrammar": "...",
  "title": "Verb Tenses",
  "proficiency": "tốt",
  "reason": "Streak 5 đúng, accuracy 85%",
  "accuracy": 85,
  "streak": 5,
  "violations": 2,
  "exercisesWrong": 1,
  "exercisesCorrect": 6
}
```

### 3. User skill status

**Endpoint mới:**
- `GET /user-test-result/get-skill-status/:idUser`

**Response:**
```json
{
  "data": {
    "skills": {
      "READING": { "band": 6.5, "lastAssessed": "2026-06-15T..." },
      "LISTENING": { "band": null, "lastAssessed": null },
      "WRITING": { "band": 6.0, "lastAssessed": "2026-06-10T..." },
      "SPEAKING": { "band": null, "lastAssessed": null }
    },
    "assessedCount": 2,
    "missingSkills": ["LISTENING", "SPEAKING"]
  }
}
```

### 4. Weakness module (mới hoàn toàn)

**Endpoints:**
- `GET /weakness/grammar?idUser=...` — top 3 grammar topic có nhiều violations nhất
- `GET /weakness/question-types?idUser=...` — top 3 question type có errorRate ≥ 30%

### 5. Study Planner V2

**Endpoint mới:**
- `GET /system-config/study-planner/config` — dynamic config
- `PUT /system-config/study-planner/config` (admin) — update config
- `GET /study-planner/plan?idUser=...&historyMonths=6` — thêm param `historyMonths` (3, 6, 12)

**Response thêm field:**
```json
{
  "missingSkills": ["LISTENING", "SPEAKING"],
  "missingSkillsWarning": "Cần làm đủ 4 đề để có lộ trình chuẩn...",
  "assessedSkills": [
    { "skill": "READING", "band": 6.5 },
    { "skill": "WRITING", "band": 6.0 }
  ]
}
```

**Algorithm thay đổi:**
- 4-strand balance giờ phân bổ theo skill yếu nhất (40% yếu nhất, 30%, 20%, 10% mạnh nhất)
- Grammar % theo stage: FOUNDATION 25%, SKILL_BUILDING 18%, INTEGRATION 13%, EXAM_PREP 10%
- Vocab mặc định 8 phút/ngày, grammar tối thiểu 5 phút
- Admin có thể override qua `PUT /system-config/study-planner/config`

## Schema changes (cần migration)

**Bảng `UserGrammarProficiency` — thêm 3 field:**
- `correctUsages Int @default(0)`
- `consecutiveCorrect Int @default(0)`
- `violations Int @default(0)`

**Bảng mới `UserGrammarExerciseSR`:**
- `id String @id @default(uuid())`
- `idUser`, `idExercise`
- `interval Int @default(1)`
- `nextReviewAt DateTime`
- `easeFactor Float @default(2.5)`
- `@@unique([idUser, idExercise])`

## Cách verify

```bash
cd ielts_training_app
npx prisma generate          # OK
npx tsc --noEmit             # 0 lỗi liên quan merge
                            # (1 lỗi pre-existing ở pdf-exam.service.spec.ts, bỏ qua)
```

**Lỗi pre-existing (KHÔNG liên quan merge, bỏ qua):**
- `@ai-workers/shared/*` — node_modules thiếu
- `groq-sdk`, `ioredis`, `@supabase/supabase-js` — chưa install
- `grading-pool.handler.ts:189` Buffer type
- `pdf-exam.service.spec.ts:15` test signature
- `question-metadata.validator.spec.ts` test case

## Files KHÔNG copy từ vocab-enhancer

- Tất cả `*.json` raw data, seed scripts, crawl scripts
- `docker-compose.yml`, `.env.example`, `run-crawl.sh`
- `WORK_STATE-2026-05-21.md`, `AI_GRADING_NOTES.md`, `docs/RemainingPlan.md`
- Tất cả file `.md` gốc của vocab project (chỉ ghi summary này vào frontend)

## Migration cần chạy trên production

Trước khi deploy:
```bash
npx prisma migrate dev --name add_grammar_sr_and_violations_and_streak
# Sau đó: npx prisma migrate deploy (trên prod)
```

## Commit

```
feat(vocab-enhancer): merge SM-2 vocab, grammar V2 proficiency, study planner V2
```

---

# Phần tiếp theo — 2026-06-20: Hoàn thiện UI cho 3 tính năng mới

## Tổng quan

Ngày 2026-06-20 build UI cho 3/7 tính năng còn thiếu sau merge backend. Làm việc trên cùng branch `fix/ai-grading-notes-and-app-module-merge`.

## Thay đổi backend

### Fix bug: `saveViolation` không reset `consecutiveCorrect`

**File:** `ielts_training_app/src/module/grammar/grammar.service.ts` (method `saveViolation`, line ~649-665)

**So sánh với `submitExercise` (line 671-682):**
- `submitExercise` khi user sai → reset `consecutiveCorrect = 0` ✓
- `saveViolation` (cũ) → CHỈ `increment violations`, KHÔNG reset streak ✗

**Hệ quả:** User bị violation thủ công mà streak vẫn giữ → `calculateProficiency` (line 157-190) vẫn return "hoàn thành" → data không phản ánh tiến độ thật.

**Fix:** Thêm `consecutiveCorrect: 0` vào cả `update` (increment path) và `create` (new row) của `saveViolation`. Consistency với `submitExercise`.

## Thay đổi frontend

### File mới: `src/Pages/client/Weakness/index.jsx`

Trang `/weakness` riêng. Reuse pattern từ `homePage.jsx` (MagicPath style):
- Header gradient (orange-pink)
- 2 card: Grammar weakness (red) + Question type (orange)
- Empty state có CTA "Luyện tập ngay" → `/grammar-practice`
- Click grammar topic → `/grammar-practice?topic=<title>`

### Edit: `src/Pages/client/grammar/[idGrammar].jsx`

Tích hợp `getGrammarDueReviewsAPI` (mới, SM-2 spaced repetition):
- State `dueCount` + `dueMode`
- useEffect `loadDueCount()` khi mount
- Function `loadDueExercise()` lấy 1 bài due đầu tiên
- Render badge "🔔 Có N bài cần ôn" ở header
- Sau khi submit due → `handleNext` reload count

### Edit: `src/Pages/client/homePage.jsx`

- Add 2 API calls (`getGrammarWeaknessAPI`, `getQuestionTypeWeaknessAPI`) vào `Promise.allSettled`
- Đổi link "Chi tiết →" ở section "4 kỹ năng" từ `/statistic` → `/weakness`
- Add section "Điểm yếu của bạn" giữa "Kế hoạch học hôm nay" và "Đề xuất cho bạn"
- Hiển thị top 3 grammar + top 3 question types

### Edit: `src/main.jsx`

**Routes mới:**
- `/weakness` (USER + teacher + admin) → render `Weakness` component
- `/grammar/:idGrammar` (USER + teacher + admin) → render `GrammarTopic` component (đã có sẵn file `[idGrammar].jsx` nhưng route bị thiếu — click "Luyện ngay" ở `grammar.jsx:489` sẽ fail trước đó)

**Route đổi tên:**
- `/statistic` → `/forum` (USER + teacher + admin) — vì `forum.jsx` map vào `/statistic` gây nhầm lẫn

**Lazy imports thêm:**
- `Weakness` → `./Pages/client/Weakness`
- `GrammarTopic` → `./Pages/client/grammar/[idGrammar]`

## Defer

- **FE-4: Violation manual UI** — endpoint `POST /grammar/violation` đã có sẵn, nhưng chưa wire vào UI. Sẽ gắn vào `testResultReview.jsx` (writing/speaking) trong session sau.

## Verify

### Backend
```bash
cd ielts_training_app
npx tsc --noEmit    # 0 lỗi grammar.service
```

### Frontend
```bash
cd IELTS-training-website
npm run build       # nếu có script
# hoặc test thủ công: login, vào /, /weakness, /grammar/<id>, /forum
```

### Manual test flow
1. Login `seed@ielts.dev` (admin) hoặc `trandangkhoa091005@gmail.com`
2. Vào `/` → thấy 2 weakness card (nếu có data)
3. Click "Chi tiết →" ở "4 kỹ năng" → vào `/weakness`
4. Vào `/forum` (đổi từ `/statistic`) → vẫn render forum bình thường
5. Vào `/grammar` → click "🎯 Luyện ngay" ở weak area → vào `/grammar/<id>` → thấy badge "Có N bài cần ôn" (nếu có SR record)
6. Test API:
```bash
TOKEN=<jwt>
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/weakness/grammar?idUser=<idUser>
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/weakness/question-types?idUser=<idUser>
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/grammar/<idGrammar>/due-reviews?idUser=<idUser>"
```

## Commit

```
fix(grammar): reset consecutiveCorrect on manual saveViolation
feat(frontend): add weakness page + due-reviews badge + homepage weakness cards + rename /statistic to /forum
```
