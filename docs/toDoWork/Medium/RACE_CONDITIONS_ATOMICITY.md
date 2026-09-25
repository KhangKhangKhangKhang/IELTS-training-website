# Race Conditions & Atomicity Audit

> **Priority:** 🟢 MEDIUM
> **Status:** Survey phase · pending fix
> **Severity:** Lost-update + non-atomic state changes
> **Effort ước tính:** ~2-3h

---

## Tổng quan

Nhiều service method dùng read-modify-write không có `$transaction`. 2 request song song cho cùng user có thể conflict.

## 1. StreakService.updateStreak — lost-update

**File:** `src/module/streak-service/streak-service.service.ts:9-59`

**Code pattern:**
```ts
const streak = await this.db.user.findUnique({ where: { idUser } });  // read
const newStreak = streak.currentStreak + 1;                              // modify
await this.db.user.update({ where: { idUser }, data: { currentStreak: newStreak } });  // write
```

**Vấn đề:**
- 2 `finishTest` song song cho cùng user
- Cả 2 đọc `currentStreak = 5`
- Cả 2 increment lên `6`
- Last write wins → request thứ 2 bị mất
- User chỉ nhận +1 streak thay vì +2 (hoặc ngược lại)

**Fix:**
```ts
await this.db.$transaction(async (tx) => {
  await tx.user.update({
    where: { idUser },
    data: { currentStreak: { increment: 1 } },
  });
});
```

**Severity:** MEDIUM

## 2. XP/Level calculation không atomic với test result

**File:** `src/module/user-test-result/user-test-result.service.ts:391-410`

**Vấn đề:**
- `userLevelUpdate` chạy ngoài transaction với test result update
- Nếu XP/level update fail sau khi test result đã persist → state drift
- User có thể có test FINISHED nhưng XP chưa được cộng

**Fix:** Wrap cả 2 trong một `$transaction`.

**Severity:** MEDIUM

## 3. Audit log không atomic với system config change

**File:** `src/module/system-config/system-config.service.ts:86-97, 173-183, 219-228`

**Code pattern:**
```ts
await this.setConfig(key, value);        // ← write 1
await this.auditLogService.createEntry(...);  // ← write 2
```

**Vấn đề:**
- 2 awaits, không `$transaction`
- Nếu audit write fail (DB blip) sau khi config persisted → không có record ai đổi commission/policy/assign-mode
- Compliance risk cho audit trail

**Fix:**
```ts
await this.db.$transaction(async (tx) => {
  await tx.systemConfig.update(...);
  await tx.auditLog.create(...);
});
```

**Severity:** MEDIUM

---

## Files liên quan

- `/home/garan/code/doan1/ielts_training_app/src/module/streak-service/streak-service.service.ts:9-59`
- `/home/garan/code/doan1/ielts_training_app/src/module/user-test-result/user-test-result.service.ts:391-410`
- `/home/garan/code/doan1/ielts_training_app/src/module/system-config/system-config.service.ts:86-228`

## Effort

| Item | Effort |
|---|---|
| 1. StreakService update | ~30 min |
| 2. XP/Level atomic | ~1h |
| 3. Audit log atomic | ~1h |
| **Tổng** | **~2.5h** |

## Out of scope

- study-planner cache.del (bug #2) — sửa riêng
- study-planner Task ID `Date.now()` collision (workstate §5 #6) — sửa riêng
