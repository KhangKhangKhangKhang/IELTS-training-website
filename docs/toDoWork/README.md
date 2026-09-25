# toDoWork — Pending Refactor & Fixes

> Backlog ưu tiên theo mức độ. Mỗi file đặt trong folder theo **priority chính**.

## Cấu trúc folder

```
docs/toDoWork/
├── Critical/    🔴 Refactor lớn, schema change, cần làm sớm
├── High/        🟡 Security/reliability gap cần fix trước khi scale
├── Medium/      🟢 Correctness/perf, ảnh hưởng UX/data
├── Low/         🟢 Cleanup/DX, có thể defer
└── README.md
```

## Quy tắc

- File được đặt trong folder theo **priority chính** (cao nhất trong các issue được nêu)
- Nếu doc có nhiều mức priority (mixed), note ngay đầu file ghi rõ "primary: X, contains Y items"
- Mỗi file có đầy đủ: vấn đề, file:line tham chiếu, fix đề xuất, effort ước tính

## Backlog hiện tại (2026-09-09)

### 🔴 Critical (1 file)

| File | Effort |
|---|---|
| [VOCAB_REFACTOR_CONTENT_STATE_SPLIT.md](./Critical/VOCAB_REFACTOR_CONTENT_STATE_SPLIT.md) | 2-3 ngày |

### 🟡 High (3 file)

| File | Effort | Note |
|---|---|---|
| [SECURITY_HARDENING.md](./High/SECURITY_HARDENING.md) | 4-5h | 4 items: CORS, helmet, JWT fail-fast, teacher-review @Roles |
| [INPUT_VALIDATION_AUDIT.md](./High/INPUT_VALIDATION_AUDIT.md) | 3h | primary HIGH (chatbot), còn MEDIUM items (admin/auth) |
| [DEAD_CODE_LEAKS.md](./High/DEAD_CODE_LEAKS.md) | 2h | primary HIGH (chatbot handlers), còn LOW items (cron, PDF timer, empty catch) |

### 🟢 Medium (1 file)

| File | Effort |
|---|---|
| [RACE_CONDITIONS_ATOMICITY.md](./Medium/RACE_CONDITIONS_ATOMICITY.md) | 2.5h |

### 🟢 Low (2 file)

| File | Effort |
|---|---|
| [AUTH_OWNERSHIP_TRUST_FIX.md](./Low/AUTH_OWNERSHIP_TRUST_FIX.md) | 1 ngày |
| [PAGINATION_PERF.md](./Low/PAGINATION_PERF.md) | 3h |

## Đề xuất thứ tự xử lý

1. **Critical** vocab refactor (structural, làm trước data tích lũy)
2. **High** chatbot (security active leak)
3. **High** teacher-review @Roles (quick win 15 min)
4. **High** CORS + helmet (quick win 1h)
5. **Medium** race conditions
6. **Low** cleanup/DX

## Lưu ý

- study-planner bug #1 đã fix (pending push), bug #2-12 chưa document — xem xét tạo `STUDY_PLANNER_REMAINING_BUGS.md`
- Mỗi doc tự chứa đủ context để handoff LLM khác nếu cần
- Khi fix xong → chuyển file sang folder `Done/` (chưa tạo, tạo khi cần)
