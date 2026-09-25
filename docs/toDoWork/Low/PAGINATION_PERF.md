# Pagination & Performance

> **Priority:** 🟢 LOW-MEDIUM
> **Status:** Survey phase · pending fix
> **Severity:** Performance + DX (admin dashboard lag khi data lớn)
> **Effort ước tính:** ~2-3h

---

## MEDIUM: Forum moderation queue thiếu pagination

**File:** `src/module/forum-post/forum-post.service.ts:751-850`

**Code pattern:**
```ts
async getModerationQueue() {
  return this.db.forumPost.findMany({
    where: { moderationStatus: 'PENDING' },
    include: { comments: true, likes: true },  // ← heavy join
    // ← KHÔNG có skip / take
  });
}
```

**Vấn đề:**
- Trả toàn bộ pending posts + comments + likes trong 1 query
- Dashboard moderator lag khi volume tăng
- `getModerationHistory` cùng pattern

**Fix:**
```ts
async getModerationQueue(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [data, total] = await Promise.all([
    this.db.forumPost.findMany({
      where: { moderationStatus: 'PENDING' },
      include: { comments: { take: 5 }, _count: { select: { likes: true } } },
      skip, take: pageSize,
    }),
    this.db.forumPost.count({ where: { moderationStatus: 'PENDING' } }),
  ]);
  return { data, total, page, pageSize };
}
```

**Severity:** MEDIUM (càng tệ khi data lớn)

## MEDIUM: Forum threads findAll không paginate

**File:** `src/module/forum-threads/forum-threads.service.ts:56-89`

**Vấn đề:**
- Trả toàn bộ threads + full forumPost relation
- Trang forum list sẽ chậm khi có N thread

**Fix:** Pagination tương tự.

## LOW: Missing compound index

**File:** `prisma/schema.prisma`

**Query thường gặp:**
- `ForumPost` filter `moderationStatus + idForumThreads` (line 515)
- `ForumPost` filter `idUser + moderationStatus` (my posts)
- `CreditTransaction` filter `creditBalanceIdUser`

Hiện tại:
- Có `@@index([moderationStatus, created_at])` — partial cover
- Có `@@index([idUser, status, finishedAt])` cho UserTestResult
- THIẾU compound cho moderation queue

**Fix:**
```prisma
model ForumPost {
  // ...
  @@index([moderationStatus, idForumThreads])
  @@index([idUser, moderationStatus])
}

model CreditTransaction {
  // ...
  @@index([creditBalanceIdUser, createdAt])
}
```

**Severity:** LOW

## LOW: Snake_case leaking API response

**File:** `forum-threads.service.ts:96,100,143`, `forum-post.service.ts:799,800,859`, `forum-comment.service.ts:70`

**Vấn đề:**
- Mix `createdAt` (camelCase) với `created_at` (snake_case) trong response
- FE phải special-case

**Fix:** Standardize via `@Expose()` ClassSerializerInterceptor hoặc `@Transform()` decorator.

**Severity:** LOW

## LOW: Email send không await

**File:** `src/module/users/users.service.ts:299-318`

**Code pattern:**
```ts
this.mailerService.sendMail({ to: email, html: ... });  // ← không await
```

**Vấn đề:**
- SMTP errors không surface → registration "thành công" dù email fail
- Silent failure UX

**Fix:** `await this.mailerService.sendMail(...)` hoặc catch + log fire-and-forget.

**Severity:** LOW

---

## Files liên quan

- `/home/garan/code/doan1/ielts_training_app/src/module/forum-post/forum-post.service.ts:751-850`
- `/home/garan/code/doan1/ielts_training_app/src/module/forum-threads/forum-threads.service.ts:56-89`
- `/home/garan/code/doan1/ielts_training_app/prisma/schema.prisma`
- `/home/garan/code/doan1/ielts_training_app/src/module/forum-comment/forum-comment.service.ts:70`
- `/home/garan/code/doan1/ielts_training_app/src/module/users/users.service.ts:299-318`

## Effort

| Item | Effort |
|---|---|
| Forum moderation pagination | ~1h |
| Forum threads pagination | ~30 min |
| Compound indexes | ~30 min (migration) |
| Snake_case standardization | ~1h (transform decorator) |
| Email await | ~15 min |
| **Tổng** | **~3h** |

## Out of scope

- Auth/ownership fix — `AUTH_OWNERSHIP_TRUST_FIX.md`
- Vocab refactor — `VOCAB_REFACTOR_CONTENT_STATE_SPLIT.md`
- Race conditions — `RACE_CONDITIONS_ATOMICITY.md`
