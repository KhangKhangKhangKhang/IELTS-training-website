# Phân tích chuẩn hoá NF3+ — Schema Database

> **Phạm vi:** Repo `ielts_training_app` (NestJS + Prisma + PostgreSQL + Supabase/pgvector)
> **Ngày phân tích:** 2026-07-21
> **Nguồn:** `prisma/schema.prisma` (1071 dòng, 26 models, 16 enums) + 14 migrations Prisma + 2 migrations Supabase

Frontend repo này không chứa schema — chỉ là client REST. Tài liệu này mô tả trạng thái schema backend kèm khuyến nghị chuẩn hoá.

---

## Tổng quan hệ thống

### Models chính (26)
- **User & Auth:** `User`, `VerificationCode`
- **Test:** `Test`, `Part`, `Passage`, `QuestionGroup`, `Question`
- **Writing:** `WritingTask`, `UserWritingSubmission`
- **Speaking:** `SpeakingTask`, `SpeakingQuestion`, `UserSpeakingSubmission`
- **Kết quả:** `UserTestResult`, `UserAnswer`
- **Vocabulary:** `Vocabulary`, `Topic` (SM-2 spaced repetition)
- **Grammar:** `GrammarCategory`, `Grammar`, `GrammarsOnCategories`, `GrammarExercise`, `UserGrammarProficiency`, `UserGrammarExerciseSR`, `UserGrammarViolation`, `UserGrammarExerciseResult`
- **Forum:** `ForumThreads`, `ForumPost`, `ForumComment`, `ForumPostLikes`, `ForumCommentLikes`
- **Thanh toán:** `CreditPackage`, `CreditBalance`, `CreditTransaction`, `SubscriptionPackage`, `UserSubscription`, `PaymentTransaction`
- **Khác:** `TeacherReviewTicket`, `SystemConfig`, `AuditLog`, `QuestionTypePerformance`, `UserDailyTaskCompletion`, `UserStudyPreference`

### Enums (16)
`Role`, `AccountType`, `Gender`, `OTPType`, `Level`, `TestType`, `TestStatus`, `AssignMode`, `QuestionType` (14 loại), `WritingTaskType`, `SpeakingPartType`, `GradingStatus`, `ForumModerationStatus`, `VocabType`, `ReviewType`, `TeacherReviewStatus`, `PaymentStatus`, `PaymentPackageType`, `CreditTransType`, `CreditTransStatus`, `BillingCycle`, `SubscriptionStatus`, `PaymentMethod`.

### Schema Supabase (pgvector + RAG)
- Bảng `rag_documents`, `chat_sessions` — embedding 768 chiều
- Bảng `ielts_reading/listening/speaking/writing` — content + metadata + embedding

---

## Vi phạm 3NF (Transitive Dependency)

### Nghiêm trọng — nên sửa

**1. `Vocabulary.frequencyRank` — vi phạm 3NF**
- Phụ thuộc vào `word`, không phải PK `(idVocab, idUser)`
- Cùng 1 word có rank giống nhau cho mọi user
- **Fix:** Tách `WordFrequency(word PK, frequencyRank, level)` global, join khi cần

**2. `QuestionTypePerformance.errorRate` — derived column**
- `errorRate = 1 - correctCount/totalAttempts`
- Lưu cột trùng với tính toán
- **Fix:** Bỏ cột, generated column hoặc tính query time

**3. `UserGrammarProficiency` nhiều derived fields**
- `wrongCount = totalAttempts - correctCount`
- `correctUsages`, `consecutiveCorrect`, `violations` aggregate từ bảng khác
- **Fix:** Document denormalized cho perf, hoặc trigger đồng bộ

**4. `UserSubscription.creditsUsedThisPeriod` + `creditsQuotaThisPeriod`**
- Derived từ `CreditTransaction` + `SubscriptionPackage.creditsQuota`
- **Fix:** Snapshot tại query time

**5. `CreditBalance.totalCredits/usedCredits/frozenCredits`**
- Đều derived từ `CreditTransaction`
- **Fix:** Materialized view hoặc tính runtime

**6. `User` gamification fields**
- `xp`, `xpToNext`, `currentStreak`, `longestStreak`, `lastStudiedAt`, `targetBandScore`, `targetExamDate`
- **Fix:** Tách `UserGamification(idUser PK FK)` — clean separation

### Chấp nhận được (state machine denormalized)

**7. `Vocabulary` SR fields:** `correctStreak`, `status`, `tier`, `easinessFactor`, `interval`, `nextReviewAt`, `timesReviewed`
- Cần snapshot để SM-2 chạy nhanh, không nên join mỗi review
- **Đề xuất:** Document là intentional denormalization

---

## Vấn đề cấu trúc / BCNF

**8. `Question` có cả `idQuestionGroup` VÀ `idPart`**
- `idPart` redundant — derive qua `QuestionGroup.idPart`
- Vi phạm BCNF: `idQuestionGroup → idPart`
- **Fix:** Bỏ `idPart` ở `Question`, join khi query

**9. `GrammarCategory.idUser` nullable + `Unique(idUser, name)`**
- Cho phép cả global (null) và per-user
- Ambiguous khi FK từ `GrammarsOnCategories`
- **Fix:** Tách `GrammarCategory(idCategory, name)` global + `UserGrammarCategoryAccess(idUser, idCategory)`

**10. `PaymentTransaction` exclusive arc**
- `idCreditPackage` và `idSubscriptionPackage` đều nullable
- Phân biệt bằng `packageType` — Postgres không enforce được
- **Fix:**
  ```sql
  ALTER TABLE "PaymentTransaction"
    ADD CONSTRAINT payment_pkg_xor CHECK (
      (packageType = 'CREDIT'      AND "idCreditPackage" IS NOT NULL AND "idSubscriptionPackage" IS NULL) OR
      (packageType = 'SUBSCRIPTION' AND "idSubscriptionPackage" IS NOT NULL AND "idCreditPackage" IS NULL)
    );
  ```

**11. `UserWritingSubmission` / `UserSpeakingSubmission` ↔ `CreditTransaction`**
- Circular FK nullable (`idCreditTransaction` 2 chiều)
- **Fix:** Giữ FK 1 bên (CreditTransaction), bên kia query relation

---

## Vi phạm 1NF (Polymorphic JSONB)

**12. `Question.metadata (JsonB)` + `UserAnswer.answerPayload (JsonB)`**
- Payload đa hình theo `questionType` (14 loại)
- Khó validate, index, query
- **Trade-off:** Nếu không query sâu thì chấp nhận được

**13. `UserWritingSubmission.aiDetailedFeedback` / `UserSpeakingSubmission.aiDetailedFeedback`**
- Lưu criteria scores, comments, errors
- **Fix nếu cần:** `AIFeedbackCriterion(submissionId, criterion, score, comment)`

**14. `ForumPost.moderationMeta (JsonB)`**
- Lưu toxicity scores, categories
- **Fix nếu cần:** `ModerationScore(postId, category, score)`

---

## Tổng kết mức độ

| Mức | Vấn đề | Số |
|---|---|---|
| **Nghiêm trọng** (nên fix) | frequencyRank, errorRate, derived fields, `Question.idPart` redundant | 6 |
| **Trung bình** (cân nhắc) | exclusive arc, JSONB feedback, circular FK | 5 |
| **Thấp** (design choice OK) | SR state, gamification JSON, audit log | 4 |

---

## Next step đề xuất

1. Viết migration sửa các vi phạm nghiêm trọng (frequencyRank, errorRate)
2. Thêm CHECK constraint cho exclusive arc ở `PaymentTransaction`
3. Verify cascade rule ở các FK (đặc biệt `ForumPost` khi xóa thread)
4. Cân nhắc bỏ `Question.idPart`, derive qua join
