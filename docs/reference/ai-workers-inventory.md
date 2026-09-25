# AI Workers Inventory — 9 call sites reference

> **Survey date:** 2026-09-10
> **Mục đích:** Single source of truth cho mọi AI call site. Mỗi entry có model, SDK, file path, prompt shape, quota.

---

## Overview table

| # | Call site | Model | Provider | SDK | File:line | Sync/Async |
|---|---|---|---|---|---|---|
| 1 | Forum moderation (worker) | `gemini-2.5-flash` | Google | `@google/genai` | `ai-workers/moderation-worker/src/handlers/forum.handler.ts:16` | Async via `moderation.forum` |
| 2 | Forum moderation (BE sync, dead code) | `gemini-2.5-flash` | Google | `@google/genai` | `ielts_training_app/src/module/forum-post/forum-post.service.ts:296` | **Dead — to delete** |
| 3 | Vocab enrichment (worker) | `gemini-2.5-flash` + Dictionary API | Google + free | `@google/genai` + `axios` | `ai-workers/moderation-worker/src/handlers/vocab.handler.ts:39` | Async via `vocab.suggest` |
| 4 | Writing grading (worker legacy) | `openai/gpt-oss-120b` | Groq | `groq-sdk` | `ai-workers/grading-worker/src/handlers/write.handler.ts:29` | Async via `grading.write` |
| 5 | Writing grading (worker pool) | `llama-3.3-70b-versatile` | Groq | `groq-sdk` | `ai-workers/grading-worker/src/handlers/grading-pool.handler.ts:85` | Async, 3-key pool |
| 6 | Speaking grading — STT | `whisper-large-v3` | Groq | `groq-sdk` (`audio.transcriptions.create`) | `ai-workers/grading-worker/src/handlers/speak.handler.ts:34` | Async |
| 7 | Speaking grading — LLM | `openai/gpt-oss-120b` | Groq | `groq-sdk` | `ai-workers/grading-worker/src/handlers/speak.handler.ts:96` | Async |
| 8 | Chatbot tool router | `llama-3.1-8b-instant` | Groq | `groq-sdk` | `ai-workers/chatbot-worker/src/handlers/ask-pool.handler.ts:213` | Async |
| 9 | Chatbot response (LLM) | `llama-3.3-70b-versatile` | Groq | `groq-sdk` | `ai-workers/chatbot-worker/src/handlers/ask-pool.handler.ts:270` | Async |
| 10 | Chatbot response (legacy, dead code) | `gemini-2.0-flash` | Google | `@google/genai` | `ielts_training_app/src/module/chat-bot/chat-bot.service.ts:107` | **Dead — to delete** |
| 11 | Embedding primary | `embed-english-v2` (1536-d) | Groq | `groq-sdk` (`embeddings.create`) | `ai-workers/embedding-worker/src/handlers/embed.handler.ts:35` | Async |
| 12 | Embedding fallback | `gemini-embedding-001` (768-d) | Google | raw `fetch` REST | `ai-workers/chatbot-worker/src/services/supabase.service.ts:75` | Sync within chatbot RAG |
| 13 | PDF exam refinement | `groq/compound` | Groq | raw `fetch` REST + `visit_website` tool | `ielts_training_app/src/module/pdf-exam/services/pdf-exam.service.ts:683` | Sync (30s timeout, circuit breaker) |

---

## Per-worker deep dive

### 1. Forum moderation (worker async — runtime path)

**File**: `ielts_training_app/ai-workers/moderation-worker/src/handlers/forum.handler.ts`

**AI client**: `gemini.client.ts:3` — singleton `new GoogleGenAI({ apiKey: GEMINI_API_KEY })`

**Call** (line 16):
```ts
ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt })
```

**Prompt builder**: `forum.util.ts:1-16` (English-only)
- Input: `content` + `threadTitle` + `hasAttachment`
- Output JSON: `{ score, confidence, reasons, suggested_edits }`

**Decision threshold** (line 29, **hardcoded**):
```
score >= 70  → APPROVED
score >= 40  → NEEDS_REVIEW
else         → REJECTED
```

**Worker config** (`index.ts`):
- Prefetch: 4 concurrent (line 32)
- DLX on failure: `ch.nack(msg, false, false)` (line 55-58)
- **NOT in docker-compose** — must run via `npm start`

**Quota**: single `GEMINI_API_KEY`, no rotation, no pool. Free tier 15 RPM / 1500 RPD per key.

### 2. Forum moderation (BE sync — DEAD CODE, to delete)

**File**: `ielts_training_app/src/module/forum-post/forum-post.service.ts:252-353`

**Function**: `scorePostWithGemini()`

**Decision threshold** (lines 238-250, **DB-driven**):
```
autoApproveThreshold (default 80) → APPROVED
autoRejectThreshold (default 20)  → REJECTED
else                              → NEEDS_REVIEW
```

**Threshold source**: `system-config.service.ts:16-29`, cached 5 min, admin-editable.

**Status**: Defined + fully wired, but **no controller caller** exists. Worker is the only production path. To delete in Phase 0.

### 3. Vocab enrichment (worker)

**File**: `ielts_training_app/ai-workers/moderation-worker/src/handlers/vocab.handler.ts`

**Pipeline**:
1. **Dictionary API** (free): `https://api.dictionaryapi.dev/api/v2/entries/en/${word}` — returns `phonetic` + English `example`. 5s timeout.
2. **Gemini 2.5 Flash**: enriches Vietnamese `meaning` + `loaiTuVung` + `level` (CEFR).
3. **Merge**: Dictionary wins for `phonetic` + English `example`; Gemini wins for `meaning` + `loaiTuVung` + `level`.
4. **Redis cache**: `vocab:<word>` 86400s (24h) + `vocab-job:<word>:<jobId>` 300s.

**Output** (line 51-58):
```ts
{
  word, phonetic, example,
  meaning (Vi),
  loaiTuVung: 'NOUN'|'VERB'|'ADJ'|'ADV',
  level: 'A1'..'C2' | null
}
```

**Volume**: User-triggered only, low. Cache hit rate ~unknown.

### 4-5. Writing grading (worker, 2 modes)

**Mode A — Legacy** (`write.handler.ts`):
- Model: `openai/gpt-oss-120b` with fallbacks `[gpt-oss-20b, qwen3-27b, llama-3.3-70b-versatile]`
- Direct Groq SDK call (no pool)
- Backoff: 1/2/3/4s retries
- Used when `USE_GRADING_POOL` env = false

**Mode B — Pool** (`grading-pool.handler.ts`):
- Model: `llama-3.3-70b-versatile`
- 3-key Groq pool via `ai-pool.ts`, 30 req/30s, 10k/day/key
- Auto-disable key after 3 consecutive fails
- Used when `USE_GRADING_POOL=true`

**Prompt**: `writing.prompt.ts:42-87` — essay + IELTS rubric prompt (1.5-3K tokens).

**Output JSON**:
```ts
{
  taskResponse: { score, feedback },
  coherence:    { score, feedback },
  lexical:      { score, feedback },
  grammar:      { score, feedback },
  overallBand: number,
  generalFeedback: string,
  detailedCorrections: [{ original, corrected, explanation }]
}
```

**BE poll timeout**: 60s (`AI_GRADING_NOTES.md:43`). Plan tăng lên 180s cho Phase 4.

### 6-7. Speaking grading (worker)

**STT** (`speak.handler.ts:34`):
- Model: `whisper-large-v3` via `groq.audio.transcriptions.create`
- Audio input: ≤20 MB

**LLM** (`speak.handler.ts:96`):
- Same model + pool as writing grading
- Input: Whisper transcript + IELTS rubric prompt

**Pipeline**: STT first → transcript → LLM grading (sequential).

### 8. Chatbot tool router

**File**: `ai-workers/chatbot-worker/src/handlers/ask-pool.handler.ts:213`

**Model**: `llama-3.1-8b-instant` (Groq)

**Function**: Classify user intent → chọn 1 trong 4 tools (`IELTS_TOOLS`).

**Output**: Tool call JSON hoặc empty `content`.

### 9. Chatbot response (LLM)

**File**: `ai-workers/chatbot-worker/src/handlers/ask-pool.handler.ts:270`

**Model**: `llama-3.3-70b-versatile` (Groq)

**Input**: System prompt + conversation history + RAG top-K chunks + tool results.

**Output**: Free-text Vietnamese answer (200-1500 chars).

**FREE_TIER**: `FREE_TIER_LIMIT = 10` per user per day (Redis key `chatbot-reply:` cache 24h, line 13).

### 10. Chatbot response (legacy BE — DEAD CODE, to delete)

**File**: `ielts_training_app/src/module/chat-bot/chat-bot.service.ts:107`

**Function**: `generateGeminiReply()` — `ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt })`

**Status**: Defined but **no caller**. Controller route qua `handleUserMessage` → RabbitMQ → worker (Groq path). To delete in Phase 0.

### 11. Embedding primary

**File**: `ai-workers/embedding-worker/src/handlers/embed.handler.ts:35`

**Model**: `embed-english-v2` (Groq, 1536-dim)

**Pipeline**: chunk text 1000 chars (200 overlap) → embed → store Supabase `rag_documents.embedding vector(1536)`.

**Retry**: 3× backoff 1/2/4s.

### 12. Embedding fallback

**File**: `ai-workers/chatbot-worker/src/services/supabase.service.ts:75`

**Model**: `gemini-embedding-001` (Google, 768-dim via `outputDimensionality: 768`)

**Trigger**: Groq key missing or rate-limit hit.

**Schema mismatch risk**: 1536-d vs 768-d → pgvector column phải flexible hoặc tách bảng.

### 13. PDF exam refinement

**File**: `ielts_training_app/src/module/pdf-exam/services/pdf-exam.service.ts:683`

**Model**: `groq/compound` (Groq proprietary, supports `visit_website` tool)

**Input**: Parser JSON + raw extracted text (≤50K chars) + optional `rawPdfUrl`.

**Output JSON** (`max_completion_tokens: 4096`):
```ts
{ verifiedData, changes: [...] }
```

**Sync**, in-request path. Timeout 30s, 4 retries 1/2/4s, circuit breaker 5 fails / 30s open.

**Risk if migrate**: `visit_website` capability không có ở OSS model — phải rely 100% vào Docling output.

---

## Provider matrix

| Provider | Models dùng | Env var | Free tier | Used by |
|---|---|---|---|---|
| Google Gemini | `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-embedding-001` | `GEMINI_API_KEY` | 15 RPM / 1500 RPD | moderation, vocab, chatbot legacy (dead), embed fallback |
| Groq | `gpt-oss-120b/20b`, `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `whisper-large-v3`, `embed-english-v2`, `groq/compound` | `GROQ_API_KEY_1..6` (6 keys) | 30 req/30s + 10K/day per key | grading, chatbot, embedding, Whisper, PDF |
| Dictionary API | (English dict) | none | unlimited (free) | vocab enrichment |
| Docling (local) | docling-serve:v1.25.0 | none (CPU container) | offline | PDF exam extraction |

---

## Quota summary

| Worker | Pool | Per-key limit | Daily cap | FREE_TIER per user |
|---|---|---|---|---|
| Grading | 3 Groq keys | 30 req/30s | 10K/day/key | ❌ |
| Chatbot (router + answer) | 3 Groq keys | 30 req/30s | 10K/day/key | ✅ 10 msg/day |
| Embedding | ❌ single Groq key | n/a | n/a | ❌ |
| Moderation (forum + vocab) | ❌ single Gemini key | 15 RPM | 1500 RPD | ❌ |
| Chatbot legacy (dead code) | ❌ single Gemini key | shared | shared | ❌ |
| PDF exam | ❌ single Groq key | n/a | n/a | ❌ |

**Bottleneck**: Gemini shared 4 consumers → bad actor spam moderation = exhaust quota cho cả hệ.

---

## Dead code registry (Phase 0 cleanup)

| File | Function | Status | Action |
|---|---|---|---|
| `src/module/chat-bot/chat-bot.service.ts:107` | `generateGeminiReply` | Defined, unreferenced | **Delete** |
| `src/module/vocabulary/vocabulary.service.ts:53` | `this.ai = new GoogleGenAI(...)` | Imported, never called | **Delete import + unused field** |
| `src/module/forum-post/forum-post.service.ts:296` | `scorePostWithGemini` | Wired but no controller caller | **Verify + delete** (or document as fallback-only) |
| `ai-workers/shared/src/types/messages.ts` | `ChatbotEmbedMessage` | Type defined but `publishChatbotEmbed` has no caller | **Audit + remove if confirmed dead** |

**Verify dead code với grep trước khi delete:**
```bash
grep -rn "generateGeminiReply\|scorePostWithGemini\|publishChatbotEmbed" \
  /home/garan/code/doan1/ielts_training_app/src \
  --include="*.ts"
```
