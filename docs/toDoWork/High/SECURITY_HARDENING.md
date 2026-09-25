# Security Hardening Audit — Multi-Item

> **Priority:** 🟡 HIGH
> **Status:** Survey phase · pending fix
> **Severity:** Nhiều security gap cần fix trước khi scale hoặc audit compliance
> **Effort ước tính:** ~1-2 ngày

---

## Tổng quan

Survey 2026-09-09 phát hiện nhiều security gap ngoài scope auth/ownership. Gom nhóm 4 issue dưới đây.

## 1. CORS wildcard + thiếu security headers

**File:** `src/main.ts:10`
```ts
app.enableCors();  // ← mặc định allow tất cả origin
```

**Vấn đề:**
- Cho phép bất kỳ origin nào gọi API (kể cả admin endpoint)
- Không có `helmet` → thiếu CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Không `compression`
- `X-Powered-By` không bị strip → lộ stack

**Fix:**
```ts
import helmet from 'helmet';

app.enableCors({
  origin: configService.get('CORS_ALLOWED_ORIGINS').split(','),
  credentials: true,
});
app.use(helmet());
app.use(compression());
```

**Severity:** HIGH

## 2. Teacher review admin endpoints thiếu @Roles

**File:** `src/module/teacher-review/teacher-review.controller.ts:258-294`
```ts
@UseGuards(JwtAuthGuard)  // ← không có RolesGuard
@Get('all')
async getAllTickets() { ... }

@UseGuards(JwtAuthGuard)
@Get('stats')
async getStats() { ... }
```

**Vấn đề:**
- Bất kỳ user authenticated nào (kể cả `USER` role) hit được `/teacher-review/all` và `/teacher-review/stats`
- Service không có check role
- Lộ moderation queue, commission stats cho user thường

**Fix:**
```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Get('all')
async getAllTickets() { ... }
```

**Severity:** HIGH

## 3. Rate limit quá loose cho non-auth endpoint

**File:** `src/app.module.ts:65-69`
```ts
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])  // 100 req/min global
```

**Vấn đề:**
- Chỉ `/auth/*` có per-endpoint `@Throttle`
- Endpoints nặng không bị throttle: `GET /test/get-detail/:idTest`, `GET /test/get-answers/:idTest`, AI import endpoints, public `/study-planner/calculate`
- Chat-bot không throttle → spam Gemini API → burn quota

**Fix:**
- Thêm `@Throttle({ default: { limit: 10, ttl: 60000 } })` cho resource-heavy endpoints
- Auth endpoints giữ nguyên hoặc giảm limit (OTP enumeration risk)
- Add `@SkipThrottle()` cho health/read endpoints OK

**Severity:** HIGH

## 4. JWT secret fallback không fail-fast

**File:** `src/auth/auth.service.ts:54-63, 189-191, 218, 228`
```ts
const secret = this.configService.get<string>('JWT_SECRET');  // ← có thể undefined
return this.jwtService.sign(payload, { secret });  // ← sign với undefined secret
```

**Vấn đề:**
- `jwt.strategy.ts` enforce `JWT_SECRET` lúc boot (OK)
- `auth.service.ts` không fail-fast → nếu runtime missing → sign với undefined secret
- Library-dependent: có thể throw hoặc sign với empty secret
- `introspectToken` + `refreshTokens` iterate over nhiều secret không fail-fast

**Fix:**
```ts
const secret = this.configService.getOrThrow<string>('JWT_SECRET');
```

`/auth/reset-token` (controller:141) cũng là `@Public()` — bất kỳ ai có refresh token đều call được → leaked refresh token sống 7 ngày không có revocation list.

**Severity:** MEDIUM

---

## Files liên quan

- `/home/garan/code/doan1/ielts_training_app/src/main.ts:10`
- `/home/garan/code/doan1/ielts_training_app/src/app.module.ts:65-69`
- `/home/garan/code/doan1/ielts_training_app/src/module/teacher-review/teacher-review.controller.ts:258-294`
- `/home/garan/code/doan1/ielts_training_app/src/auth/auth.service.ts:54-228`
- `/home/garan/code/doan1/ielts_training_app/src/auth/auth.controller.ts:141`

## Effort

| Item | Effort |
|---|---|
| 1. CORS + helmet + compression | ~1h |
| 2. Teacher review @Roles | ~15 min |
| 3. Rate limit per-endpoint | ~2h (cần identify heavy endpoints + thêm decorator) |
| 4. JWT fail-fast + reset-token revoke | ~1h |
| **Tổng** | **~4-5h** |

## Out of scope

- Auth/ownership (idUser trust) — đã có doc riêng (`AUTH_OWNERSHIP_TRUST_FIX.md`, priority LOW)
- Vocab refactor — đã có doc riêng (priority CRITICAL)
- Inline body validation — doc riêng (`INPUT_VALIDATION_AUDIT.md`)
