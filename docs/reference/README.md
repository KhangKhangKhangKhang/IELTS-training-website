# Reference Docs — Local AI Migration

> **Created:** 2026-09-10
> **Owner:** Backend / DevOps
> **Mục đích:** Single source of truth cho việc migrate từ cloud AI (Gemini + Groq) sang local AI (Ollama + TEI + faster-whisper) trên hardware RTX 4060 8GB + 24GB RAM

---

## Quick links

| Doc | Mục đích | Status |
|---|---|---|
| [AI Usage Inventory (canonical)](../AI_USAGE.md) | 15 AI categories, 4 workers, provider matrix — **file gốc** | ✅ Done |
| [ai-workers-inventory.md](./ai-workers-inventory.md) | 9 AI call sites reference (model, file path, prompt, quota) | ✅ Done |
| [migration-plan.md](./migration-plan.md) | 5 phases + status table + rollback procedure | ✅ Done (Phase 0) |
| [evaluation-framework.md](./evaluation-framework.md) | Per-task rubric + harness + decision gates | 🟡 Skeleton |
| [local-ai-ops-guide.md](./local-ai-ops-guide.md) | Setup, troubleshoot, fallback strategy | 🟡 Skeleton |

---

## TL;DR

**Hardware verified:** RTX 4060 8GB VRAM + 24GB system RAM.

**Strategy:** Migrate theo phase, eval trước khi commit.

| Phase | What | Risk | Status |
|---|---|---|---|
| 0 | Cleanup dead code + add metrics | 0 | 🟡 Pending start |
| 0.5 | Build eval harness + pilots | thấp | ⏸ Blocked by 0 |
| 1 | Embedding + Router + Whisper → local GPU | thấp | ⏸ Blocked by 0.5 |
| 2 | Vocab + Moderation → local 7B GPU | thấp-trung bình | ⏸ Blocked by 1 |
| 3 | Chatbot answer → local 14B hybrid | trung bình (experimental) | ⏸ Optional |
| 4 | Grading → local 14B hybrid | trung bình-cao (experimental) | ⏸ Optional |

**Stays cloud (forever):** PDF exam refinement (admin risk, cần 70B+, low volume).

---

## Vai trò của từng doc (theo câu hỏi của user)

| Nếu bạn muốn biết... | Đọc doc |
|---|---|
| Có bao nhiêu AI call sites, model gì, ở đâu? | [ai-workers-inventory.md](./ai-workers-inventory.md) |
| Lộ trình migrate thế nào, bao lâu, bao nhiêu tiền? | [migration-plan.md](./migration-plan.md) |
| Làm sao biết 7B có đủ tốt không? | [evaluation-framework.md](./evaluation-framework.md) |
| Setup Ollama / TEI / Whisper thế nào? | [local-ai-ops-guide.md](./local-ai-ops-guide.md) |
| Tổng quan toàn hệ thống AI? | [AI Usage Inventory gốc](../AI_USAGE.md) |

---

## Bắt đầu thế nào (quickstart)

1. **Đọc plan**: Mở `migration-plan.md`, đọc TL;DR + Phase 0
2. **Verify current state**: Mở `ai-workers-inventory.md`, tra cứu file paths thực tế trong code
3. **Bắt đầu Phase 0**: 
   - Delete dead code (3 file theo Phase 0)
   - Add `prom-client` vào 4 workers
   - Verify metrics endpoint expose cost baseline
4. **Sau Phase 0**: chuyển sang Phase 0.5 (build eval harness)
5. **Sau Phase 0.5**: nếu eval pass → Phase 1 (migrate embed/router/whisper)

---

## Cross-references

- Workstate gốc: `/home/garan/code/doan1/WORK_STATE-2026-09-10-bug1-study-planner-survey.md`
- Plan file: `/home/garan/.claude/plans/hi-n-t-i-ang-d-ng-optimized-zephyr.md`
- toDoWork docs: `/home/garan/code/doan1/IELTS-training-website/docs/toDoWork/`

---

## Conventions trong docs này

- **File paths**: dùng absolute path (`/home/garan/code/doan1/ielts_training_app/...`) hoặc repo-relative
- **Line numbers**: `path:line` format — clickable trong IDE
- **Model names**: exact string (`gemini-2.5-flash`, `llama-3.3-70b-versatile`)
- **Quota numbers**: thực tế từ env config + provider docs, không estimate
- **Status**: ✅ Done · 🟡 In progress · 🟠 Blocked · ⏸ Pending · ❌ Won't do

---

## Update policy

| Khi nào | Cập nhật gì |
|---|---|
| Mỗi phase start | Update `migration-plan.md` status table |
| Mỗi phase done | Append eval report vào `migration-plan.md` §Results |
| Setup thay đổi | Update `local-ai-ops-guide.md` |
| Worker model thay đổi | Update `ai-workers-inventory.md` |
| Eval rubric thay đổi | Update `evaluation-framework.md` |
