# Input Validation Audit — Inline Body Anti-Pattern

> **Priority:** 🟡 HIGH (primary) / 🟢 MEDIUM (mixed)
> **Folder placement:** High/ — primary concern là chatbot sendMessage (HIGH). Các admin/auth items ở MEDIUM.
> **Status:** Survey phase · pending fix
> **Severity:** Missing DTO → no `class-validator` → no schema enforcement
> **Effort ước tính:** ~2-3h (tạo DTO + thay inline type)

---

## Tổng quan

Nhiều endpoint dùng inline body type (`@Body() body: { ... }`) thay vì DTO class. Không có `class-validator` schema → không enforce type/range/length → bypass global ValidationPipe whitelist.

## Critical: Chat-bot trust idUser từ body

**File:** `src/module/chat-bot/chat-bot.controller.ts:28`
```ts
@Post('send')
async sendMessage(@Body() body: { idUser: string; message: string }) {
  return this.chatbotService.sendMessage(body.idUser, body.message);
}
```

**Vấn đề:**
- `idUser` lấy từ body thay vì `req.user.userId` → attacker impersonate
- Kết hợp với bug chatbotReplyHandlers memory leak → request của victim có thể bị duplicate
- Ai cũng có thể gửi message as victim → log pollution, có thể trigger Gemini cache corruption

**Fix:**
```ts
@Post('send')
@UseGuards(JwtAuthGuard)
async sendMessage(
  @Request() req,
  @Body() dto: SendMessageDto,
) {
  return this.chatbotService.sendMessage(req.user.userId, dto.message);
}
```

**Severity:** HIGH (chat-bot specific) — kết hợp với ownership trust gap

## Medium: Admin endpoints accept any

**File:** `src/module/system-config/system-config.controller.ts:54,128`
```ts
setConfig(@Param('key') key, @Body() value: any)  // ← any
setStudyPlannerConfig(@Body() body: any, @Req() req)  // ← any
```

**Vấn đề:**
- Whitelist global drop unknown fields, nhưng shape không bounded
- Admin có thể nhét deeply nested object → corrupt `SystemConfig.value` JSON
- Không có `class-validator` check type/range

**Fix:** Tạo `SetConfigDto` + `SetStudyPlannerConfigDto` với schema bounded.

**Severity:** MEDIUM

## Medium: Subscription admin grant không validate

**File:** `src/module/subscription/subscription.controller.ts:115`
```ts
adminGrantSubscription(@Body() body: { idUser, idPackage, durationDays }) {
  return this.subscriptionService.adminGrantSubscription(body);
}
```

**Vấn đề:**
- `durationDays:999999` hoặc âm → service tin (`subscription.service.ts:290`)
- Không có `class-validator` constraints
- Admin abuse → cấp subscription vĩnh viễn

**Fix:**
```ts
class AdminGrantSubscriptionDto {
  @IsString() @IsNotEmpty() idUser: string;
  @IsString() @IsNotEmpty() idPackage: string;
  @IsInt() @Min(1) @Max(3650) durationDays: number;  // cap 10 năm
}
```

**Severity:** MEDIUM

## Lower: Auth controller 5 inline shapes

**File:** `src/module/auth/auth.controller.ts:54-90`
- `verifyOtp`, `resendOtp`, `forgotPassword`, `introspectToken`, `refreshToken` — tất cả inline body

**Vấn đề:**
- Có rate-limit nhưng không có schema
- Nếu attacker craft malformed body → có thể crash endpoint hoặc leak error info

**Fix:** Tạo DTO cho mỗi endpoint, dùng `class-validator`.

**Severity:** LOW-MEDIUM (rate-limit đã cover một phần)

## Lower: Vocabulary/Grammar inline body

**File:** `vocabulary.controller.ts:73,146`, `grammar.controller.ts:175`
- `vocabulary.suggestPost(@Body() dto: { word: string })` — không length cap
- `grammar.saveViolation(@Body() body: {...})` — arbitrary sentence

**Fix:** Tạo DTO bounded.

**Severity:** LOW

---

## Files liên quan

- `/home/garan/code/doan1/ielts_training_app/src/module/chat-bot/chat-bot.controller.ts:28`
- `/home/garan/code/doan1/ielts_training_app/src/module/system-config/system-config.controller.ts:54,128`
- `/home/garan/code/doan1/ielts_training_app/src/module/subscription/subscription.controller.ts:115`
- `/home/garan/code/doan1/ielts_training_app/src/module/auth/auth.controller.ts:54-90`
- `/home/garan/code/doan1/ielts_training_app/src/module/vocabulary/vocabulary.controller.ts:73,146`
- `/home/garan/code/doan1/ielts_training_app/src/module/grammar/grammar.controller.ts:175`

## Effort

| Item | Effort |
|---|---|
| Chat-bot sendMessage (HIGH) | ~30 min |
| SystemConfig DTO × 2 | ~30 min |
| Subscription admin grant DTO | ~15 min |
| Auth controller DTO × 5 | ~1h |
| Vocabulary/Grammar DTO | ~30 min |
| **Tổng** | **~3h** |

## Out of scope

- Auth/ownership fix (idUser trust global) — đã có doc riêng
- Security hardening khác — `SECURITY_HARDENING.md`
- Vocab refactor — `VOCAB_REFACTOR_CONTENT_STATE_SPLIT.md`
