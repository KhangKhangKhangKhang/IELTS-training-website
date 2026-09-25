# Migration Plan — Cloud AI → Local AI

> **Created:** 2026-09-10
> **Status:** 🟡 Phase 0 pending start
> **Hardware verified:** RTX 4060 8GB VRAM + 24GB system RAM

---

## TL;DR

Migrate từ Gemini + Groq (cloud, free tier đang sát quota) sang Ollama + TEI + faster-whisper (local GPU). 5 phases, eval trước khi commit. Phase 3-4 experimental, có thể fail và rollback.

**Total est API saving** (nếu Phase 1-2 pass):
- Embedding: ~30% chatbot volume
- Router: ~30% chatbot volume
- Whisper: 100% speaking submission
- Vocab + moderation: bounded
- **Giảm risk hết quota Gemini** (currently shared 4 consumers)

**Total est cost**: <$10 one-time eval, $0 ongoing cho Phase 1-2. Phase 3-4 chỉ tốn điện GPU.

---

## Hardware inventory

| Component | Spec | Source |
|---|---|---|
| GPU | NVIDIA RTX 4060 | User confirmed |
| VRAM | 8 GB | User confirmed |
| System RAM | 24 GB | User confirmed |
| CUDA | TBD — verify via `nvidia-smi` | Phase 0 task |
| NVIDIA driver | TBD | Phase 0 task |
| Docker NVIDIA runtime | Not configured | Phase 1 task |

**Capacity matrix** (Q4_K_M quantization):

| Model size | Pure GPU | Hybrid (GPU+RAM offload) |
|---|---|---|
| ≤3B (e.g. router) | ✅ | n/a |
| 7B (e.g. vocab/moderation) | ✅ ~5GB | n/a |
| 14B (e.g. chatbot answer) | ❌ quá lớn | ⚠️ 8GB + ~6GB RAM, slow |
| 32B (e.g. grading budget) | ❌ | ⚠️ 8GB + ~10GB RAM, very slow |
| 70B+ | ❌ | ❌ impractical |

---

## Decision matrix

| Task | Current cloud model | Local target | Viability | Phase |
|---|---|---|---|---|
| Embedding | `embed-english-v2` (Groq) | `bge-m3` via TEI | 5/5 | 1 |
| Chatbot router | `llama-3.1-8b-instant` | `Qwen2.5-3B-Instruct` Q4 | 5/5 | 1 |
| Whisper STT | `whisper-large-v3` (Groq) | `faster-whisper large-v3` int8 | 5/5 (same model, free) | 1 |
| Vocab enrichment | `gemini-2.5-flash` | `Qwen2.5-7B-Instruct` Q4 | 4/5 (Vi risk) | 2 |
| Forum moderation | `gemini-2.5-flash` | `Qwen2.5-7B-Instruct` Q4 | 4/5 (Vi risk) | 2 |
| Chatbot answer | `llama-3.3-70b-versatile` | `Qwen2.5-14B-Instruct` Q4 hybrid | 3/5 (slow + Vi drop) | 3 (opt) |
| Writing grading | `gpt-oss-120b` | `Qwen2.5-14B-Instruct` Q4 hybrid | 3/5 (rubric drift) | 4 (opt) |
| Speaking grading LLM | `gpt-oss-120b` | `Qwen2.5-14B-Instruct` Q4 hybrid | 3/5 | 4 (opt) |
| **PDF exam** | `groq/compound` | — | 2/5 (admin risk) | ❌ Stays cloud |

---

## Phase 0 — Cleanup + measure (week 1, mandatory)

**Mục tiêu**: Biết cost baseline trước khi optimize. Cleanup dead code giảm 1 Gemini consumer.

### Tasks

- [ ] **Verify + delete dead code**:
  - `src/module/chat-bot/chat-bot.service.ts` — delete `generateGeminiReply` (line 107)
  - `src/module/vocabulary/vocabulary.service.ts` — delete unused `GoogleGenAI` import (line 53)
  - `src/module/forum-post/forum-post.service.ts` — verify + delete `scorePostWithGemini` (line 252-353) hoặc document as fallback
  - Audit `publishChatbotEmbed` — delete nếu confirmed uncalled
- [ ] **Add metrics infra**:
  - Add `prom-client` vào 4 workers
  - Track per call: `model_name`, `tokens_in`, `tokens_out`, `latency_ms`, `status`
  - Expose `/metrics` endpoint real (currently only pool key health)
- [ ] **Prompt hardening**:
  - All Gemini calls → enable `responseMimeType: 'application/json'` + JSON schema
  - Files: `forum-post.service.ts:296`, `moderation-worker/handlers/{forum,vocab}.handler.ts`
- [ ] **Verify GPU + driver**:
  - `nvidia-smi` → check CUDA version, driver version
  - `docker info | grep -i nvidia` → check NVIDIA runtime

### Pass criteria

- [ ] Dashboard shows cost baseline ±20% accuracy
- [ ] Dead code removed + tests still pass (`npm run test` in each module)
- [ ] Metrics endpoint returns token count, latency histogram
- [ ] GPU/CUDA verified

### Rollback

Pure cleanup — no functional change. If tests fail → revert commit.

---

## Phase 0.5 — Eval harness + pilots (week 2-3, blocks Phase 1)

**Mục tiêu**: Build harness + chạy pilot trên test set. **Quyết định Phase 1+ có commit hay không dựa trên data, không phải gut feel.**

### Tasks

- [ ] **Build eval harness** (`eval-harness/`):
  - Datasets per task (essays, chat queries, forum posts, vocab words, PDF exams, audio)
  - Runners (Gemini/Groq/Ollama batch scripts)
  - LLM-as-judge for subjective metrics (Vi naturalness, factual)
  - Report generator
- [ ] **Run baseline** (cloud models on test sets) → record metrics
- [ ] **Run pilots** (local 7B/14B on same test sets) → record metrics
- [ ] **Generate eval report** → append vào §Results bên dưới

### Pass criteria (Phase 0.5 → Phase 1)

| Task | Metric | Threshold |
|---|---|---|
| Embedding | recall@10 vs Groq | ≥95% |
| Router | tool-call accuracy vs Groq 8B | ≥95% |
| Whisper | WER vs Groq | ≤+0.5% |
| Vocab | Vi quality Likert vs Gemini | ≥4.0/5 |
| Moderation | decision agreement vs Gemini | ≥90% |

Nếu tất cả pass → Phase 1. Nếu fail → chỉ migrate pass, defer fail.

### Rollback

Không có gì để rollback (chỉ build harness). Nếu fail → defer Phase 1+.

---

## Phase 1 — Embedding + Router + Whisper local (week 3-5, GPU fast)

**Mục tiêu**: Migrate 3 task gọi nhiều nhất, model nhỏ (≤3GB VRAM mỗi cái).

### Tasks

- [ ] **Setup Ollama**: `docker compose up ollama`, pull `qwen2.5:3b-instruct-q4_K_M`
- [ ] **Setup TEI**: `docker compose up tei-embed`, pull `BAAI/bge-m3`
- [ ] **Setup faster-whisper**: `docker compose up whisper-server`, model `Systran/faster-whisper-large-v3`
- [ ] **Embed migration**:
  - Switch `embedding-worker/handlers/embed.handler.ts:35` Groq → TEI
  - **Supabase migration**: `ALTER TABLE rag_documents ALTER COLUMN embedding TYPE vector(1024)` + re-embed script
  - Hoặc: dùng `nomic-embed-text-v1.5` (768-d) để match Gemini fallback dimension
- [ ] **Router migration**:
  - Switch `chatbot-worker/handlers/ask-pool.handler.ts:213` `llama-3.1-8b-instant` → Ollama `qwen2.5:3b`
  - A/B test 50/50 trên 200 chat messages
- [ ] **Whisper migration**:
  - Switch `grading-worker/handlers/speak.handler.ts:34` Groq audio → faster-whisper
  - A/B 50 speaking audio files

### Pass criteria

- Embedding recall@10 ≥95% Groq
- Router tool-call accuracy ≥95%
- Whisper WER ≤cloud +0.5%
- Total GPU memory ≤6GB (còn 2GB headroom)
- Cost reduction measurable trên metrics

### Rollback per task

- Set env var `USE_LOCAL_EMBED=false` → revert Groq
- Set `USE_LOCAL_ROUTER=false` → revert Groq 8B
- Set `USE_LOCAL_WHISPER=false` → revert Groq audio

---

## Phase 2 — Vocab + Moderation local (week 5-7, GPU 7B)

**Mục tiêu**: Share Ollama `qwen2.5:7b-instruct-q4_K_M` cho cả vocab + moderation.

### Tasks

- [ ] **Pull model**: `docker exec ollama ollama pull qwen2.5:7b-instruct-q4_K_M`
- [ ] **Vocab migration**:
  - Switch `moderation-worker/handlers/vocab.handler.ts:39` Gemini → Ollama
  - Shadow mode 1 tuần: 50% local, 50% cloud
- [ ] **Moderation migration**:
  - Switch `moderation-worker/handlers/forum.handler.ts:16` Gemini → Ollama
  - **Threshold unification**: chọn 1 bộ (80/20 vs 70/40) — recommend 70/40 worker hardcode, hoặc read từ DB
  - Shadow mode 2 tuần: 10% local, 90% cloud

### Pass criteria

- Vocab Vi quality ≥4.0/5 vs Gemini baseline
- Moderation decision agreement ≥95% vs Gemini
- autoApprove/autoReject drift ≤2%
- VRAM ≤5GB (share với Phase 1 services — tổng ≤6GB)

### Rollback per task

- `USE_LOCAL_VOCAB=false` → revert Gemini vocab
- `USE_LOCAL_MODERATION=false` → revert Gemini moderation

---

## Phase 3 — Chatbot answer local (week 7-10, EXPERIMENTAL)

**Mục tiêu**: Thử `Qwen2.5-14B-Instruct` Q4 hybrid offload. Có thể fail.

### Tasks

- [ ] **Pull model**: `docker exec ollama ollama pull qwen2.5:14b-instruct-q4_K_M`
- [ ] **Config offload**: Ollama config để chỉ ~6 layers trên GPU, còn lại offload RAM
- [ ] **A/B test**:
  - 50/50 split: 14B local vs Llama 3.3 70B cloud
  - 300 messages, mixed Vi/En, cover 4 tools
  - Metrics: user satisfaction (👍/👎), task completion, Vi quality
- [ ] **Human spot-check**: 50 samples, 3 reviewers, blind

### Pass criteria

- User satisfaction ≥cloud -10%
- Task completion rate ≥90%
- Vi quality Likert ≥3.8/5
- Latency p95 ≤30s

### If fail

Rollback to cloud Llama 3.3 70B. Focus optimization khác:
- Increase FREE_TIER cache hit rate
- Skip router call khi cache hit (giảm 2 calls/turn xuống 1)

---

## Phase 4 — Grading local (week 10+, EXPERIMENTAL + HIGH RISK)

**Mục tiêu**: IELTS rubric scoring local. Rủi ro cao nhất. Có thể fail hoàn toàn.

### Tasks

- [ ] **Pull 14B**: same as Phase 3
- [ ] **BE poll timeout bump**: 60s → 180s (`AI_GRADING_NOTES.md:43`)
- [ ] **A/B test**:
  - 100 essays, 7B local vs GPT-OSS 120B cloud
  - 10-20 essays có human expert score thật để validate 120B làm ground truth
- [ ] **Metrics**:
  - Score drift per criterion (MAE)
  - Band agreement (±0)
  - Detailed correction precision/recall

### Pass criteria

- Score drift per criterion ≤0.5 band
- Band agreement ≥85%
- Latency p95 ≤90s (acceptable cho async)

### If fail

Rollback to cloud GPT-OSS 120B. Grading là core business value — drop quality = mất uy tín. **Accept rằng grading là expensive by design.**

---

## GPU upgrade path (optional, sau 3 tháng)

Nếu Phase 3-4 fail vì latency/quality + cloud spend vẫn cao:

**Option A — Mua used GPU**:
- 1× RTX 3090 / 4090 (24GB VRAM) ~$700-1000 used
- Chạy 32B Q4 pure GPU
- 70B Q4 partial offload nhẹ hơn nhiều

**Option B — Thuê cloud GPU**:
- A100/H100 rental $1.5-3/hour
- Chỉ rẻ hơn cloud API khi volume >1000 calls/day

**Don't mua trước** — wait until Phase 1-2 done + actual cost saving measurable.

---

## Results (sẽ update khi phase chạy)

_(empty — fill in sau khi chạy pilot)_

---

## Status table

| Phase | Status | Started | Completed | Owner | Next action |
|---|---|---|---|---|---|
| 0 | 🟡 Pending start | — | — | TBD | Verify CUDA, delete dead code |
| 0.5 | ⏸ Blocked | — | — | TBD | Build eval harness |
| 1 | ⏸ Blocked | — | — | TBD | Setup Ollama + TEI + Whisper |
| 2 | ⏸ Blocked | — | — | TBD | Pull 7B model |
| 3 | ⏸ Optional | — | — | TBD | A/B test 14B chatbot |
| 4 | ⏸ Optional | — | — | TBD | A/B test 14B grading |

---

## Cross-references

- [ai-workers-inventory.md](./ai-workers-inventory.md) — 9 call sites reference
- [evaluation-framework.md](./evaluation-framework.md) — eval methodology
- [local-ai-ops-guide.md](./local-ai-ops-guide.md) — setup + troubleshoot
- Plan file: `/home/garan/.claude/plans/hi-n-t-i-ang-d-ng-optimized-zephyr.md`
