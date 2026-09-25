# Auth Ownership Trust Fix — Pending

> **Priority:** 🟢 LOW
> **Status:** Deferred · chưa fix · bàn sau khi xong vocab refactor
> **Severity:** Production risk (impersonation attack surface) — nhưng chưa có attacker motivated
> **Effort ước tính:** ~1 working day (BE + FE)
> **Lý do LOW:** app vẫn chạy bình thường cho legit user · chỉ có attack surface cho impersonation · chưa có payment feature nhạy cảm · ưu tiên vocab refactor trước

---

## 1. Vấn đề

BE controller tin `idUser` từ request (path / query / body). Attacker chỉ cần JWT của chính mình + đoán victim userId → impersonate victim, write vào row victim.

**Root cause:** Service layer signature target-only (~64 method chỉ nhận `idUser`, không nhận `requesterId`). Service không có cách nào biết "ai gọi tôi với idUser này".

**Tại sao critical:**
- BandScore + XP + level + streak + study-planner update trong 1 transaction
- Không reversible — victim có thể mất streak 30 ngày vì 1 request của attacker
- Audit log hiển thị victim thực hiện action → khó detect

## 2. 5 attack chain worst-case (ranked)

| # | Severity | Attack | Effect |
|---|---|---|---|
| 1 | critical | Submit Reading/Listening thay victim | set bandScore + XP + level + streak + study-planner + UserAnswer rows trong 1 transaction · không reversible |
| 2 | critical | Submit Writing/Speaking với text/audio attacker | AI grading burn quota + Cloudinary upload + record polluted · quota check removed = free spam |
| 3 | high | Spam POST start-test | spam `UserTestResult` rows cho victim (status: IN_PROGRESS) · cron cleanup 24h |
| 4 | high | Grammar/Vocab practice submit thay victim | UserGrammarProficiency sai + SM-2 state corruption · ảnh hưởng weakness detection |
| 5 | critical | Anonymous full read state | `GET /grammar/dashboard?idUser=victim` · @Public() · no JWT · full read state của victim |

Tất cả cần JWT hợp lệ (trừ #5), không cần biết mật khẩu victim.

## 3. Audit kết quả

| Pattern | Count | Trạng thái |
|---|---|---|
| 🟢 JWT-derived (`req.user.userId`) | ~10 method | đã đúng · mẫu để copy |
| 🟡 Cross-check bypassable | ~14 method | so idUser ≠ requester |
| 🔴 Guarded + body/path trust | ~30 endpoint | attacker impersonate |
| 🔴 Unguarded `grammar.controller.ts:152` | 1 | anonymous full read |

## 4. Defense hiện có — chỉ 3 chỗ

| Vị trí | Cơ chế | Cover |
|---|---|---|
| `teacher-review.controller.ts:38` | `assertRequestUser(req, idUser)` | 8 endpoint teacher-review |
| `user-test-result.controller.ts:76-81` | inline check `requesterId !== idUser` | 1 endpoint (getBestBandByTest) |
| RolesGuard per-controller | `@Roles(Role.ADMIN)` | 6 admin endpoint |

Tất cả controller khác bypassable.

## 5. Đề xuất fix

### Guard stack (theo thứ tự)

```
1. JwtAuthGuard        (global)         skip nếu @Public()
2. RolesGuard          (per-method)     check @Roles()
3. PermissionsGuard    (per-method)     check @RequirePermission()  ← MỚI
4. OwnershipInterceptor (global)         check idUser fields          ← MỚI
                                        bypass ADMIN
                                        hoặc @BypassOwnership()
```

**Quan trọng:** OwnershipInterceptor bypass chỉ `ADMIN` (không bypass GIAOVIEN). Teacher có ownership cho data của teacher, chỉ access student qua endpoint có `@BypassOwnership()`.

### Role × Permission matrix

USER = student, GIAOVIEN = teacher, ADMIN = admin

| Permission | USER | GIAOVIEN | ADMIN |
|---|:-:|:-:|:-:|
| `profile:read:own` / `write:own` | ✓ | ✓ | ✓ |
| `profile:read:any` / `write:any` | ✗ | ✗ | ✓ |
| `test:browse` | ✓ | ✓ | ✓ |
| `test:start:own` / `submit:own` | ✓ | ✗ | ✓ |
| `submission:grade` / `review` | ✗ | ✓ | ✓ |
| `planner:read:own` / `write:own` | ✓ | ✗ | ✓ |
| `subscription:manage:own` | ✓ | ✗ | ✓ |
| `credits:read:own` | ✓ | ✗ | ✓ |
| `credits:manage:any` | ✗ | ✗ | ✓ |
| `forum:read` | ✓ | ✓ | ✓ |
| `forum:write:own` | ✓ | ✓ | ✓ |
| `forum:moderate` | ✗ | ✓ | ✓ |
| `chat:use:own` | ✓ | ✗ | ✓ |
| `notifications:read:own` | ✓ | ✓ | ✓ |
| `grammar:practice:own` | ✓ | ✗ | ✓ |
| `vocab:practice:own` | ✓ | ✗ | ✓ |
| `system:config:read` / `write` | ✗ | ✗ | ✓ |
| `audit:read` | ✗ | ✗ | ✓ |

### Per-module guard plan

| Module | @Public() endpoints | @Roles | @RequirePermission | Ownership |
|---|---|---|---|---|
| auth | 7 (login/register/reset/google/...) | — | — | bypass (no JWT) |
| app (health) | 1 | — | — | bypass |
| test (browse) | 4 (list/get) | — | `test:browse` | bypass |
| payment | 2 webhook (Stripe/IPN) | — | — | bypass (signed) |
| subscription | 1 webhook | — | — | bypass |
| credits | 1 (callback?) | ADMIN cho manage | `credits:read:own` / `:manage:any` | enforced |
| grammar | 1 (bỏ — bug #5) | — | `grammar:practice:own` | enforced |
| vocab | — | — | `vocab:practice:own` | enforced |
| chat-bot | — | — | `chat:use:own` | enforced |
| notifications | — | — | `notifications:read:own` | enforced |
| forum-post/threads | — | — | `forum:read` / `:write:own` | enforced cho write |
| study-planner | — | — | `planner:read:own` / `:write:own` | enforced |
| dashboard | — | — | `profile:read:own` | enforced |
| user-test-result | — | 1 ADMIN endpoint | `test:start:own` / `:submit:own` | enforced (+ `@BypassOwnership` cho teacher-grade action) |
| teacher-review | — | GIAOVIEN+ADMIN | `submission:review` | `@BypassOwnership()` (teacher reviews student's) |
| users | — | ADMIN | `profile:read:any` / `:write:any` | bypass (ADMIN) |
| system-config | — | ADMIN | `system:config:read` / `:write` | bypass |
| audit-log | — | ADMIN | `audit:read` | bypass |

### Implementation order

1. **Bước 1 (5 min):** bỏ `@Public()` ở `grammar.controller.ts:152` — bug #5 audit
2. **Bước 2 (~30 min):** tạo `OwnershipInterceptor` global, register `APP_INTERCEPTOR`, bypass chỉ ADMIN. Sweep ~30 endpoint bypassable
3. **Bước 3 (~45 min):** tạo `@RequirePermission()` decorator + `PermissionsGuard`. Thêm `ROLE_PERMISSIONS` map. Thay `@Roles(Role.ADMIN)` → `@Roles(Role.ADMIN)` + `@RequirePermission(...)` cho explicit
4. **Bước 4 (~30 min):** thêm `@BypassOwnership()` ở `teacher-review` + nơi cần cross-user access
5. **Bước 5 (cleanup):** xoá inline check `user-test-result:76-81` vì PermissionsGuard + OwnershipInterceptor cover

## 6. FE impact (khi fix)

**493 occurrences trong 20 file** — lớn. Cần sweep.

3 pattern phải đổi:

```js
// 1. path param — bỏ luôn
API.get(`/statistics/get-target/${idUser}`) → API.get(`/statistics/get-target`)

// 2. query string — bỏ luôn
API.get(`/grammar/dashboard?idUser=${idUser}`) → API.get(`/grammar/dashboard`)

// 3. body — bỏ field
API.post(`/pdf-exam/save/${idSession}`, { idUser, ... }) → API.post(`/pdf-exam/save/${idSession}`, { ... })
```

Top file theo số `idUser`:

| File | Count |
|---|---|
| `apiVocab.js` | 28 |
| `apiGrammar.js` | 28 |
| `apiForum.js` | 28 |
| `apiStatistics.js` | 21 |
| `apiStudyPlanner.js` | 16 |
| `apiDoTest.js` | 16 |
| `apiTeacherReview.js` | 5 |
| `apiQuestionTypePerformance.js` | 4 |
| `apiUser.js` | 3 |
| `apiWriting.js` | 2 |

**Effort ước tính:**
- BE: ~3-4h (interceptor + sweep 30 endpoint + test)
- FE: ~3-4h (sweep 493 chỗ + test 20 page)
- Tổng: 1 working day

## 7. Câu hỏi cần user quyết trước khi fix

1. Sửa cả BE + FE trong 1 PR lớn, hay tách 2 PR (BE trước → merge → FE sau)?
2. `submission:grade` cần permission riêng, hay `@Roles(Role.GIAOVIEN, Role.ADMIN)` đủ?
3. `forum:moderate` — GIAOVIEN có được moderate không, hay chỉ ADMIN?
4. Teacher xem data student ngoài `teacher-review` (vd: progress student) — cần permission riêng `student:read:assigned` không?
5. Rate limit per-role (USER throttle chặt, ADMIN không) hay để infra riêng?

## 8. Câu trả lời đã có

- ✅ Auth/ownership fix KHÔNG ảnh hưởng business logic — chỉ đổi trust source từ request → JWT
- ✅ Không fix vẫn chạy được (legit user thấy bình thường) — chỉ có impersonation attack surface
- ✅ Bug #1 taskType (functional) không liên quan auth fix — fix riêng
- ✅ Auth/ownership fix là **optional** theo nghĩa "không fix vẫn chạy", **bắt buộc** theo nghĩa production-ready
- ✅ Đã chốt: **defer** · ưu tiên study-planner flow trước

## 9. Files liên quan

- `/home/garan/code/doan1/diagrams/auth-trust-map.html` — diagram đầy đủ (4 figure: trust funnel, attack ranking, defense, interceptor pseudocode)
- `/home/garan/code/doan1/WORK_STATE-2026-09-08-study-planner-controller-auth-fix.md` §9 — audit details
- `/home/garan/code/doan1/ielts_training_app/src/auth/passport/jwt.strategy.ts` — JWT validate
- `/home/garan/code/doan1/ielts_training_app/src/common/guards/roles.guard.ts` — RolesGuard hiện có
- `/home/garan/code/doan1/ielts_training_app/src/common/decorators/roles.decorator.ts` — `@Roles()` decorator
- `/home/garan/code/doan1/ielts_training_app/prisma/schema.prisma` — `enum Role { USER, ADMIN, GIAOVIEN }`
- 15 file `IELTS-training-website/src/services/api*.js` — FE sweep target

## 10. Memory refs

- `[[feedback-no-master-push]]` — không push master, hỏi trước
- `[[feedback-copy-to-llm]]` — viết `copypaste.md` nếu cần handoff cho LLM khác
