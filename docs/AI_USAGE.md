# AI Usage Inventory — IELTS Training System

> **Survey date:** 2026-09-10
> **Scope:** Toàn bộ ứng dụng AI/ML trong hệ thống (BE NestJS + AI workers + FE)
> **Mục đích:** Reference cho onboarding + planning refactor

---

## 1. Tổng quan

Hệ thống dùng AI cho **15 categories** từ grading đến personalization. Tổ chức thành 4 worker độc lập + 1 NestJS-side direct integration.

| | |
|---|---|
| **AI categories** | 15 (chatbot, grading, STT, embeddings, recommendation, SM-2, ...) |
| **AI workers** | 4 (grading, chatbot, embedding, moderation) |
| **Side services** | 1 (Docling cho PDF) |
| **Providers chính** | Google Gemini + Groq (multi-key) |
| **Side providers** | Dictionary API (free), Docling (local CPU), Supabase (vector) |
| **RabbitMQ exchanges** | 5 (grading, chatbot, moderation, vocab, dlx) |
| **Cost control** | Key pool 6 keys · per-key 30 req/30s · 10k/day · FREE_TIER 10 msg/user/day |

## 2. Architecture

### Worker topology

```
BE (NestJS)                    RabbitMQ                  AI Workers
─────────────────────────────────────────────────────────────────
user-writing-submission ──→ grading.exchange   ──→ grading-worker:3001
                          (grading.write)           • write.handler
                                                    • speak.handler (STT)
                                                    • Whisper large-v3

user-speaking-submission ─→ grading.exchange   ──→ grading-worker:3001
                          (grading.speak)           • Groq chat + Whisper STT

chat-bot FE ──────────────→ chatbot.exchange   ──→ chatbot-worker:3002
                          (chatbot.ask)            • 2-step Groq tool-call RAG
                          (chatbot.reply)          • Supabase vector search
                                                    • FREE_TIER 10/user/day

docling-ingest ───────────→ chatbot.exchange   ──→ embedding-worker:3003
                          (chatbot.embed)          • Groq embed-english-v2
                                                    • chunker 1000/200

forum-post ───────────────→ moderation.exchange ──→ moderation-worker (no Docker)
                                                    • Gemini 2.5-flash

vocabulary.suggest ───────→ vocab.exchange     ──→ moderation-worker (chung)
                                                    • Dictionary API + Gemini

PDF exam upload ────────→ (sync via Docling)  ──→ docling-serve:5001
                                                    • PDF → text/markdown
                                                    • Groq refinement
```

### Key shared modules (`ai-workers/shared/src/`)

- `config/ai-pool.ts` — key pool, consecutive-failure tracking, auto-disable sau 3 fail, 60s health check
- `config/rate-limiter.ts` — Redis-backed rate limit + daily quota
- `config/rabbitmq.ts` — RabbitMQ setup + DLX wiring
- `types/messages.ts` — 6 message types (`GradingWriteMessage`, `GradingSpeakMessage`, `ChatbotAskMessage`, `ChatbotEmbedMessage`, `ModerationForumMessage`, `VocabSuggestMessage`)

### API key sources

| Env var | Used by |
|---|---|
| `GEMINI_API_KEY` | chat-bot legacy, forum moderation sync, vocab suggest fallback, embedding fallback |
| `GROQ_API_KEY_1` … `_3` | chatbot-worker (RAG + tool router) |
| `GROQ_API_KEY_4` … `_6` | grading-worker (chat grading + Whisper) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | vector store cho chatbot RAG |
| `AI_MICROSERVICE_SECRET` | guard cho crawler endpoints (nhưng chưa wired — xem Known Issues §6 #3) |

---

## 3. 15 categories AI/ML

### 1. LLM Chatbot (IELTS tutor)

**2 implementation tồn tại song song:**
- **A. NestJS-side (legacy, code còn nhưng worker là live path)** — `chat-bot.service.ts:30-175`. Provider: Google Gemini `gemini-2.0-flash`. Publish `chatbot.ask` queue + subscribe reply queue.
- **B. Worker-side (live)** — `chatbot-worker/`. Provider: Groq 2-step tool-calling RAG. TOOL_ROUTER_MODEL=`llama-3.1-8b-instant`, CHAT_RESPONSE_MODEL=`llama-3.3-70b-versatile`. 4 tools search reading/listening/speaking/writing qua Supabase RPC.

**Data flow:** FE → `POST /chat-bot/send` → BE publish → worker consume → Supabase search → Groq synthesis → publish reply → BE subscribe → Redis history → FE poll.

**Cost:** Gemini paid per token, Groq free tier per key, **FREE_TIER_LIMIT=10/user/day** (`ask-pool.handler.ts:13`). Rate-limit 30 req/30s.

**FE:** `chatBotWidget.jsx` (full UI), `apiChatBot.js`, mount trong `AppTopbar.jsx:656`.

### 2. Writing grading (AI)

**Async qua RabbitMQ → grading-worker.**
- Producer: `user-writing-submission.service.ts:97-110, 192-204`. Set `aiGradingStatus='PENDING'`. Subscription/credit check removed (free cho educational use).
- Worker: `write.handler.ts:13-150`. Provider Groq `openai/gpt-oss-120b` (fallback `gpt-oss-20b`, `qwen3-27b`). JSON-mode response với 4 criteria → average → IELTS 0.5 rounded.
- Save: `aiOverallScore`, `aiDetailedFeedback`, `grammarViolations[]` map sang 10 topic IDs.
- Retry 3× exponential backoff (1s, 2s, 4s). On fail: refund credits + subscription quota.

**Image issue:** `GradingWriteMessage.imageUrl` có trong payload nhưng handler KHÔNG pass sang LLM. Prompt mentions image analysis nhưng không có vision call.

**FE poll:** `IELTSTestResultReview.jsx:77-225, 498-531` polls `aiGradingStatus`.

### 3. Speaking grading (AI)

**Async cùng worker, queue khác.**
- Producer: `user-speaking-submission.service.ts:108-128`.
- Worker: `speak.handler.ts:21-180`. **STT step** download audio (line 14-16) → Groq `whisper-large-v3` (line 32-44) → chat grading với 4 criteria (Fluency, Lexical, Grammar, Pronunciation).
- Aggregate across parts, half-band rounding. Retry 3×.

**Pronunciation score:** chỉ LLM textual estimate từ transcript — KHÔNG có acoustic analysis.

### 4. Listening grading (Deterministic — không AI)

`user-test-result.service.ts:265-460` synchronous transaction. So sánh userAnswer vs metadata.correctAnswer. Type-specific graders: MCQ, TFNG, fill-in, matching (heading/information/features/sentence-endings). IELTS band lookup table tại `:732-785`.

### 5. Reading grading (Deterministic — không AI)

Cùng flow với Listening, khác band table tại `:760-785`.

### 6. Test generation

**KHÔNG có LLM test generation trong repo.** Chỉ có:
- **PDF-exam extraction pipeline** (§13) — IMPORT existing tests từ PDF, không generate mới
- **AI crawler import** — `test.controller.ts:137-156` expose `@Public() POST /test/import-reading-listening`, `/create-writing-test`, `/create-speaking-test`. Comment nói guard bằng `AiMicroserviceGuard` nhưng guard KHÔNG wired (chỉ `@Public()`).
- Manual qua `seed-cambridge-19-reviewed.js` / `seed-cambridge-20-reviewed.js` (offline scripts)

### 7. Recommendation engine (next test) — Heuristic

`recommend-test.service.ts:23-160`. Profile analysis: weakest skill by avg band, current level. Scoring per test: +50 if matches weakest skill, +/- Level diff, +random 0-10. Fisher-Yates shuffle, return top N. Cache Redis `recommend-test:${idUser}` 600s. FE render `homePage.jsx:541-591`.

### 8. Adaptive learning (lộ trình) — Deterministic engine

`study-planner.service.ts` (1487 lines). 4 stages: FOUNDATION → SKILL_BUILDING → INTEGRATION → EXAM_PREP. Transition requires avg band + vocab + grammar + completion + weeks-in-stage. `calculatePlan:224-356` dùng 4-strand theory, Krashen i+1, target-band modelling. **Không có LLM call anywhere** (verified grep).

### 9. Spaced Repetition (SM-2) — Pure code

`vocabulary.service.ts:60-78` Woźniak 1987 algorithm. Quality<3 reset, else interval progression 1→6→interval*easiness. Easiness = max(1.3, e + 0.1 - (5-q)(0.08+(5-q)*0.02)). Schema fields: `timesReviewed, easinessFactor, interval, nextReviewAt, status`.

### 10. Personalization (lộ trình cá nhân hóa)

= §8 study-planner. UI text "Cá nhân hoá theo mục tiêu và tiến độ của bạn". All deterministic rule-based.

### 11. Email/Notification generation

**None.** Templated strings Vietnamese hardcoded. `nodemailer` cho email với templates, không AI body.

### 12. STT / TTS

- **STT:** Whisper large-v3 qua Groq — `grading-worker/src/services/groq.service.ts:92-103`. KHÔNG cap audio length → có thể pull file lớn.
- **TTS:** Không có. Phonetic chỉ text IPA.

### 13. Image / PDF analysis (Test-from-PDF)

**Pipeline:** Docling PDF → text → Groq normalize → DB.
- Controller: `pdf-exam.controller.ts:48-100` `POST /pdf-exam/extract` (multipart).
- Docling: `docling.service.ts:38-200` POST `DOCLING_SERVE_URL` (default `localhost:5001`).
- Groq refinement: `pdf-exam.service.ts:628-820` dùng `groq/compound` model. System prompt strict JSON, "never invent questions". Có `visit_website` tool (Groq) khi có `rawPdfUrl`.
- Save transaction: `pdf-exam.service.ts:1700-1810` tạo Test, Part, Passage, QuestionGroup, Question, WritingTask, SpeakingTask.
- Circuit breaker: 5 fails → 30s cooldown.
- FE: `PdfImportModal.jsx` 4-step Modal.

### 14. Translation / Phonetic / IPA — Vocabulary enrichment

- Controller: `vocabulary.controller.ts:67-77` `POST /vocabulary/suggest` → enqueue `vocab.suggest`.
- Worker: `moderation-worker/vocab.handler.ts:9-60`. Dictionary API (free, no key) → phonetic + example. Gemini 2.5-flash → phonetic IPA + meaning Vietnamese + example + loaiTuVung + level.
- Cache Redis `vocab:${word}` 86400s.

### 15. Vector search / Embeddings — RAG cho chatbot

- Worker: `embedding-worker/`. Consumes `chatbot.embed`. Chunker `chunker.service.ts:10-50` (1000/200 overlap).
- Embedding: Groq `embed-english-v2`.
- Store: Supabase `rag_documents` + skill-scoped (`ielts_reading`, `ielts_listening`, `ielts_speaking`, `ielts_writing`).
- Search: `chatbot-worker/supabase.service.ts:84-220` calls `search_ielts_<skill>` RPC. Fallback `searchBySkillText` (ilike content).

**Embedding dim mismatch risk** — Groq `embed-english-v2` 768 vs Gemini fallback `gemini-embedding-001` 768 (đều 768, may match OK, cần verify schema).

---

## 4. Provider matrix

| Provider | Used by | Models |
|---|---|---|
| **Google Gemini** (`@google/genai`) | chat-bot legacy, forum moderation sync, vocab init, moderation-worker (forum/vocab), chatbot-worker embed fallback | `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-embedding-001` |
| **Groq** (`groq-sdk`) | chatbot-worker (RAG), embedding-worker, grading-worker (chat + STT), pdf-exam refinement | `openai/gpt-oss-120b/20b`, `qwen/qwen3-27b`, `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `embed-english-v2`, `whisper-large-v3`, `groq/compound` |
| **OpenAI** | none | — |
| **Anthropic Claude** | none | — |
| **Dictionary API** (free, no key) | moderation-worker vocab phonetic/example | `api.dictionaryapi.dev/api/v2/entries/en` |
| **Docling** (local CPU ~3GB) | pdf-exam | `quay.io/docling-project/docling-serve:v1.25.0` |
| **Supabase** (vector) | chatbot RAG | `jxaycxjeagmzniqoulc.supabase.co` |

---

## 5. Cost & quota control

- **Chatbot FREE_TIER_LIMIT = 10 messages/day per user** (`ask-pool.handler.ts:13, 117`)
- **Key pool** (`ai-pool.ts`):
  - 3 chatbot keys, 3 grading keys
  - Rate-limit 30 req / 30s window per key
  - Daily quota 10,000/key
  - Auto-disable sau 3 consecutive fails
  - 60s health check interval
- **Refund on failed grading**: credits + subscription quota (`refundCredits`, `refundSubscriptionQuota`)
- **PDF exam circuit breaker**: 5 fails → 30s cooldown, retry 1/2/4s backoff
- **Reading/Listening**: 0 AI cost (deterministic)
- **No cost-monitoring dashboard** — chỉ `/metrics` workers reports pool health

---

## 6. Known issues (11)

1. **Two parallel chatbot implementations** — `chat-bot.service.ts` (BE direct Gemini) + `chatbot-worker`. RabbitMQ reply consumer tồn tại nhưng chỉ producer trong `chat-bot.service.ts` mới chạy. Code path song song.

2. **`imageUrl` không dùng trong writing grader** — payload có `imageUrl` nhưng `write.handler.ts:30-39` chỉ pass `(submissionText, prompt, type)`. Prompt mention image analysis nhưng không có vision call.

3. **`AiMicroserviceGuard` defined nhưng không wired** — `test.controller.ts:137-156` AI crawler endpoints chỉ có `@Public()`. Header auth (`AI_MICROSERVICE_SECRET`) tồn tại tại `auth/passport/ai-microservice.guard.ts` nhưng không dùng → endpoints không auth.

4. **Two moderation implementations race** — `forum-post.service.ts` `scorePostWithGemini` + `moderation-worker/handlers/forum.handler.ts` cùng consume `publishModerationForum`. Có thể 1 cái là dead code, hoặc race update cùng row.

5. **Embedding dimension drift risk** — Groq `embed-english-v2` 768 vs Gemini fallback 768 (cùng dim, may match OK). Cần verify Supabase schema.

6. **Vector store RPCs chưa verify** — `chatbot-worker/supabase.service.ts:88-99` calls `search_ielts_<skill>` RPC. Presence of these RPCs in Supabase project unverified from codebase.

7. **"Free" mode hard-coded** — `user-writing-submission.service.ts:53, 76` + `user-speaking-submission.service.ts:75` notes: "Credit deduction removed — submissions are free for educational use". Refund logic ở workers là dead code in practice.

8. **FE poll vẫn còn** — `IELTSTestResultReview.jsx:77-225` polls `aiGradingStatus` mặc dù `AI_GRADING_NOTES.md:55-65` nói BE giờ self-poll synchronous.

9. **Reading/Listening graders hand-rolled** — không có AI-based answer-tolerant grading. Type coverage: MCQ, TFNG, fill-in, matching. Edge cases (typo, partial match) fail.

10. **No personalization LLM** — study-planner rule-based on (band, vocab, grammar, completion, weeks). Krashen/Nation/Zimmerman chỉ reference trong comments.

11. **WHISPER không cap audio length** — `speak.handler.ts:14-16` cloud download qua `axios.get(audioUrl)`, có thể pull file lớn, cost spike.

---

## 7. File references (quick jump)

### BE core

- `ielts_training_app/src/rabbitmq/rabbitmq.constants.ts:1-37` — exchanges/queues
- `ielts_training_app/src/rabbitmq/rabbitmq.service.ts:98-128` — publishers
- `ielts_training_app/src/auth/passport/ai-microservice.guard.ts:14-87` — guard (not wired)
- `ielts_training_app/.env:21,43-44` — API keys

### Workers

- `ai-workers/shared/src/types/messages.ts:25-80` — all message payloads
- `ai-workers/shared/src/config/ai-pool.ts:9-20` — key pool config
- `ai-workers/shared/src/config/rate-limiter.ts:38-118` — Redis rate limit
- `ai-workers/grading-worker/src/handlers/write.handler.ts:13-150` — writing grading
- `ai-workers/grading-worker/src/handlers/speak.handler.ts:21-180` — speaking grading + STT
- `ai-workers/chatbot-worker/src/handlers/ask-pool.handler.ts:42-180` — chatbot w/ FREE_TIER
- `ai-workers/chatbot-worker/src/handlers/ask.handler.ts:54-150` — 2-step Groq tool-call RAG
- `ai-workers/embedding-worker/src/handlers/embed.handler.ts:13-65` — chunk + embed
- `ai-workers/moderation-worker/src/handlers/forum.handler.ts:11-40` — async moderation
- `ai-workers/moderation-worker/src/handlers/vocab.handler.ts:9-60` — vocab phonetic

### BE services

- `ielts_training_app/src/module/chat-bot/chat-bot.service.ts:30-175` — NestJS chatbot (legacy)
- `ielts_training_app/src/module/chat-bot/chat-bot.controller.ts:12-50`
- `ielts_training_app/src/module/user-writing-submission/user-writing-submission.service.ts:97-110` — write grading publisher
- `ielts_training_app/src/module/user-speaking-submission/user-speaking-submission.service.ts:108-128` — speak grading publisher
- `ielts_training_app/src/module/user-test-result/user-test-result.service.ts:265-460, 732-785, 872-984, 997-1100` — deterministic + async grading
- `ielts_training_app/src/module/recommend-test/recommend-test.service.ts:23-160` — heuristic recommendation
- `ielts_training_app/src/module/study-planner/study-planner.service.ts` — adaptive learning (no LLM)
- `ielts_training_app/src/module/vocabulary/vocabulary.service.ts:60-78, 99-166, 534-690` — SM-2
- `ielts_training_app/src/module/pdf-exam/services/pdf-exam.service.ts` — Docling + Groq pipeline
- `ielts_training_app/src/module/pdf-exam/services/docling.service.ts:38-200`
- `ielts_training_app/src/module/forum-post/forum-post.service.ts:13-100, 183-336, 485, 727` — sync moderation + publish
- `ielts_training_app/src/module/vocabulary/vocabulary.controller.ts:67-77` — vocab suggest

### FE

- `IELTS-training-website/src/components/ui/navBar/chatBotWidget.jsx` — chatbot UI
- `IELTS-training-website/src/services/apiChatBot.js:1-19`
- `IELTS-training-website/src/components/ui/navBar/AppTopbar.jsx:656` — chatbot mount
- `IELTS-training-website/src/components/magicpath/ielts-test-result-review/IELTSTestResultReview.jsx:77-225, 498-531` — async grading poll
- `IELTS-training-website/src/components/test/teacher/PdfImportModal.jsx` — PDF exam UI (4-step Modal)
- `IELTS-training-website/src/services/apiPdfExam.js:1-45`
- `IELTS-training-website/src/components/magicpath/ielts-teacher-grading-queue/queueScoring.jsx:55` — AI band suggestion
- `IELTS-training-website/src/components/magicpath/ielts-community-forum/forumPost.tsx:68` — AI moderation badge
- `IELTS-training-website/src/components/magicpath/ielts-forum-moderation/modUI.jsx:14-17` — moderation status labels
- `IELTS-training-website/src/Pages/client/VocabDaily/index.jsx` — daily vocab UI + phonetic poll
- `IELTS-training-website/src/Pages/client/Weakness/index.jsx` — weakness detection UI
- `IELTS-training-website/src/Pages/client/studyPlanner.jsx` — adaptive lộ trình UI
- `IELTS-training-website/src/Pages/admin/adminDashboard.jsx:106` — moderation policy admin

### Infra

- `docker-compose.yml:108-176` — workers + docling-serve wiring
- `ai-workers/.env:11-13` — `GROQ_API_KEY_*`
- `docling-serve/Dockerfile` — Docling CPU image
- `ai-workers/grading-worker/Dockerfile` — port 3001
- `ai-workers/chatbot-worker/Dockerfile` — port 3002
- `ai-workers/embedding-worker/Dockerfile` — port 3003

---

## 8. Onboarding checklist (khi có dev mới)

- [ ] Đọc file này để hiểu AI footprint
- [ ] Setup local: `docker-compose up` workers + docling + BE + FE
- [ ] Verify env keys trong `ielts_training_app/.env` + `ai-workers/.env`
- [ ] Test chatbot end-to-end (FE → BE → worker → reply → poll)
- [ ] Test PDF exam upload với file test (Cambridge PDF)
- [ ] Test writing/speaking submission + async grading
- [ ] Check `/health`, `/ready`, `/metrics` workers
- [ ] Đọc 11 known issues ở §6 trước khi sửa code liên quan

---

## 9. Cross-references

- `docs/toDoWork/High/SECURITY_HARDENING.md` — `app.enableCors()` wildcard + thiếu helmet + teacher-review admin thiếu @Roles
- `docs/toDoWork/High/INPUT_VALIDATION_AUDIT.md` — chatbot trust idUser từ body + handlers memory leak
- `docs/toDoWork/High/DEAD_CODE_LEAKS.md` — chatbot handlers không cleanup + RabbitMQ OnModuleDestroy thiếu
- `docs/toDoWork/Low/AUTH_OWNERSHIP_TRUST_FIX.md` — 30 endpoint trust client-supplied idUser (overlap với §6 #3)
- `docs/toDoWork/Critical/VOCAB_REFACTOR_CONTENT_STATE_SPLIT.md` — vocab schema tách content/state
