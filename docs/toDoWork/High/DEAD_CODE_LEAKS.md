# Dead Code & Memory Leaks

> **Priority:** 🟡 HIGH (primary) / 🟢 LOW (mixed)
> **Folder placement:** High/ — primary concern là chatbot handlers memory leak (HIGH). Cron/PDF/empty catch ở LOW-MEDIUM.
> **Status:** Survey phase · pending fix
> **Severity:** Production reliability + silent failures
> **Effort ước tính:** ~1-2h

---

## HIGH: Chatbot handlers memory leak

**File:** `src/module/chat-bot/chat-bot.service.ts:24-28`, `src/rabbitmq/rabbitmq.service.ts:35-37, 91-96`

**Code pattern:**
```ts
// chat-bot.service.ts:24-28
private chatbotReplyHandlers = new Set<Function>();

onModuleInit() {
  this.rabbitmqService.onReply((msg) => {
    for (const handler of this.chatbotReplyHandlers) handler(msg);
  });
  // ← KHÔNG bao giờ remove handler
  // ← KHÔNG có clear/cleanup API
}
```

**Vấn đề:**
- `chatbotReplyHandlers` chỉ có `.add()`, không có `removeHandler` / `clear`
- Khi Nest hot-reload hoặc test → `onModuleInit` chạy lại → closure mới append
- Mỗi reply RabbitMQ được handle N lần (N = số lần hot-reload)
- Duplicate Gemini cache writes + double handling

**RabbitMQ service** cũng không có `OnModuleDestroy` cleanup cho consumer tag.

**Fix:**
```ts
// chat-bot.service.ts
private chatbotReplyHandlers = new Set<Function>();

addReplyHandler(handler: Function) { this.chatbotReplyHandlers.add(handler); }
removeReplyHandler(handler: Function) { this.chatbotReplyHandlers.delete(handler); }

// rabbitmq.service.ts
async onModuleDestroy() {
  await this.channel?.cancel(this.consumerTag);
  await this.channel?.close();
  await this.connection?.close();
}
```

**Severity:** HIGH — bug chỉ phát hiện sau nhiều lần hot-reload; trên prod thường ổn nhưng trên dev/CI rất khó chịu

## LOW: PDF exam timer cleanup không tracking ID

**File:** `src/module/pdf-exam/services/pdf-exam.service.ts:534-540`

**Code pattern:**
```ts
discardSession(idSession) {
  setTimeout(() => this.db.pdfExamSession.delete({ where: { idSession } }), 3_600_000);
  // ← timer ID không lưu, không có registry
}
```

**Vấn đề:**
- Sau restart process → timer không fire → session leak trong DB
- Nếu cùng `idSession` reuse → timer cũ vẫn giữ closure

**Fix:** Map<idSession, NodeJS.Timeout> + cleanup on session reuse, hoặc dùng `@Cron` job scan expired sessions.

**Severity:** LOW

## LOW: Dead cron task không registered

**File:** `src/helpers/cronjob.ts:15-28` (`DeleteInactiveUsersTask`)

**Vấn đề:**
- Class exported, dùng `@Cron` decorator
- Nhưng `app.module.ts` và `users.module.ts` không include trong `providers`
- Handler `handleCron` (xóa user chưa activate > 1 ngày) không bao giờ chạy trong production
- Silent dead code

**Fix:** Thêm vào providers hoặc xóa nếu không cần.

**Severity:** LOW (silent cleanup miss)

## LOW: Empty catch swallowing errors

**File:** `src/module/study-planner/study-planner.service.ts:242, 249, 252, 253, 416`

**Code pattern:**
```ts
await this.db.user.update(...).catch(() => null);  // ← swallow
```

**Vấn đề:**
- Update fail (FK violation, connection drop) → silent fail
- Cache invalidation vẫn chạy → downstream reads stale data
- Không log

**Fix:** Catch + log error hoặc rethrow với context.

**Severity:** MEDIUM (silent data corruption risk)

---

## Files liên quan

- `/home/garan/code/doan1/ielts_training_app/src/module/chat-bot/chat-bot.service.ts:24-28`
- `/home/garan/code/doan1/ielts_training_app/src/rabbitmq/rabbitmq.service.ts:35-96`
- `/home/garan/code/doan1/ielts_training_app/src/module/pdf-exam/services/pdf-exam.service.ts:534-540`
- `/home/garan/code/doan1/ielts_training_app/src/helpers/cronjob.ts:15-28`
- `/home/garan/code/doan1/ielts_training_app/src/module/study-planner/study-planner.service.ts:242-416`

## Effort

| Item | Effort |
|---|---|
| Chatbot handlers cleanup | ~1h |
| PDF timer registry | ~30 min |
| Register cron task | ~5 min |
| Empty catch logging | ~15 min |
| **Tổng** | **~2h** |

## Out of scope

- study-planner bug #1 (đã fix, pending push)
- study-planner bug #2-12 (defer)
- Race conditions — `RACE_CONDITIONS_ATOMICITY.md`
