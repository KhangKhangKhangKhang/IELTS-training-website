# Evaluation Framework — pilot methodology

> **Created:** 2026-09-10
> **Status:** 🟡 Skeleton — sẽ fill chi tiết khi Phase 0.5 bắt đầu
> **Mục đích:** Methodology đo chất lượng model trước khi commit migration

---

## Eval principles

1. **Hybrid approach**: Auto metrics cho objective (score drift, WER, latency), LLM-as-judge cho subjective (Vi naturalness), human spot-check cuối để validate judge.
2. **Sample size minimum**: 30 samples mỗi task (statistical significance), 100+ cho high-stakes task (grading, moderation).
3. **Ground truth**:
   - **Cloud model output** = pseudo-ground-truth cho subjective metrics (chấp nhận rằng Gemini/Groq không hoàn hảo)
   - **Human expert score** = ground truth cho grading (cần 10-20 samples validate cloud có đáng tin làm baseline)
   - **DB admin decision** = ground truth cho moderation (đã có sẵn trong `moderationStatus` column)
4. **A/B protocol**: 50/50 split hoặc shadow mode (10% local, 90% cloud).
5. **Free tier only**: Toàn bộ eval chạy trên free tier — Groq 30K/day, Gemini 1500 RPD.
6. **Off-peak cho Gemini**: Chạy Gemini-heavy eval sau 22:00 VN time để không conflict production.

---

## Per-task rubric

### 1. Writing grading (7B local vs GPT-OSS 120B cloud)

**Test set**:
- 100 essays thật từ production DB (`user_writing_submission` table)
- Cover IELTS band 4-8
- 10-20 essays có human expert score (thuê teacher hoặc dùng admin-reviewed)

**Metrics**:

| Metric | Type | Threshold | Note |
|---|---|---|---|
| `score_drift_task_response` | MAE | ≤0.5 | Mean abs error per criterion |
| `score_drift_coherence` | MAE | ≤0.5 | |
| `score_drift_lexical` | MAE | ≤0.5 | |
| `score_drift_grammar` | MAE | ≤0.5 | |
| `band_agreement` | % match ±0 | ≥85% | |
| `band_within_0.5` | % match ±0.5 | ≥95% | Stricter check |
| `calibration_bias` | mean diff | ∈[-0.1, +0.1] | Avoid systematic skew |
| `correction_precision` | precision | ≥0.7 | Detailed corrections |
| `correction_recall` | recall | ≥0.7 | |
| `latency_p95` | seconds | ≤90 | For 14B hybrid |

### 2. Speaking grading

**Test set**:
- 50 speaking audio files (≤60s typical) từ production DB
- Có transcript Groq baseline làm ground truth (verify 5 samples bằng human)

**Pipeline metrics**:
- **STT step**: WER vs Groq baseline (Phase 1 covers this)
- **Grading step**: same as writing grading rubric

### 3. Chatbot answer (14B local vs Llama 3.3 70B cloud)

**Test set**:
- 100 representative user queries (từ chatbot history, anonymized)
- Mix Vi/En
- Cover 4 tools: grammar explanation, vocab lookup, writing advice, RAG retrieval
- Có expected tool + RAG chunks để verify

**Metrics**:

| Metric | Type | Threshold | Note |
|---|---|---|---|
| `vi_naturalness` | Likert 1-5 (LLM judge) | ≥4.0 | Vietnamese fluency |
| `factual_accuracy` | % (LLM judge) | ≥85% | Statements có trong RAG chunks |
| `helpfulness` | Likert 1-5 (LLM judge) | ≥3.8 | |
| `task_completion` | % | ≥90% | Đúng tool + relevant answer |
| `tool_accuracy` | % | ≥90% | Router chọn đúng tool |
| `latency_p95` | seconds | ≤30 | Acceptable async |
| `user_satisfaction` | Likert 1-5 (human) | ≥cloud-10% | 50 spot-check samples |

### 4. Forum moderation (7B local vs Gemini 2.5 Flash)

**Test set**:
- 200 forum posts từ production DB
- Có admin decision thật trong `moderationStatus` (APPROVED/REJECTED/NEEDS_REVIEW)

**Metrics**:

| Metric | Type | Threshold | Note |
|---|---|---|---|
| `decision_agreement` | % | ≥90% | Match admin decision |
| `autoApprove_precision` | precision | ≥95% | Trong approve, bao nhiêu admin cũng approve |
| `autoReject_precision` | precision | ≥95% | |
| `false_negative_rate` | % | ≤2% | Toxic posts mà local approve |
| `false_positive_rate` | % | ≤5% | Safe posts mà local reject |
| `reason_quality` | Likert 1-5 (LLM judge) | ≥3.5 | Vi tự nhiên + chính xác |
| `latency_p95` | seconds | ≤5 | Worker prefetch=4 |

### 5. Vocab enrichment (7B local vs Gemini)

**Test set**:
- 200 từ thật user đã suggest từ production logs
- Cover A1-C2 + common words + technical/rare

**Metrics**:

| Metric | Type | Threshold | Note |
|---|---|---|---|
| `vi_meaning_quality` | Likert 1-5 (LLM judge) | ≥4.0 | |
| `pos_accuracy` | % | ≥90% | loaiTuVung exact match |
| `cefr_accuracy_strict` | % | ≥70% | level exact match |
| `cefr_accuracy_loose` | % | ≥85% | level ±1 |
| `consistency` | variance | ≤0.5 | Same word × 3 calls |
| `latency_p95` | seconds | ≤3 | |

### 6. PDF exam refinement (70B+ — local NOT viable)

**Verdict**: Skip migration. Nếu user vẫn muốn test:
- 50 PDF exams với verified parser output
- Field accuracy ≥95%
- Schema compliance ≥99%
- **Risk**: admin-facing test data, hallucination = hỏng đề → keep cloud.

### 7. Whisper STT (local vs Groq)

**Test set**:
- 50 speaking audio files (cùng set as #2)

**Metrics**:

| Metric | Type | Threshold | Note |
|---|---|---|---|
| `wer` | % | ≤Groq+0.5% | Word Error Rate |
| `latency_p95` | seconds | ≤5 | per 60s audio |

---

## Test set spec

### Format: JSONL

```jsonl
{"id": "essay_001", "prompt": "...", "ground_truth": {...}, "cloud_output": {...}, "local_output": {...}}
```

### Storage location

```
eval-harness/
├── datasets/
│   ├── grading-essays-100.jsonl       # essay + expert spot-check + 120B pseudo-label
│   ├── chat-queries-100.jsonl          # query + expected tool + RAG chunks
│   ├── forum-posts-200.jsonl           # post + admin decision
│   ├── vocab-words-200.jsonl           # word + Gemini baseline + human spot-check
│   ├── pdf-exams-50.jsonl              # PDF + verified JSON (skip nếu not migrating)
│   └── speaking-audio-50/              # audio files + Groq transcript ground truth
```

### Data collection

1. Query DB production lấy sample (anonymize user_id)
2. Lọc theo criteria (e.g. essays band 4-8, posts có admin decision)
3. Human spot-check 10-20 samples mỗi task để validate cloud làm pseudo-ground-truth
4. Lưu JSONL + raw audio

---

## Harness architecture

```
eval-harness/
├── datasets/                           # Test sets (above)
├── runners/
│   ├── run-gemini-flash.ts             # Gemini 2.5 Flash batch
│   ├── run-gptoss120b.ts               # Groq GPT-OSS 120B batch
│   ├── run-llama70b-chatbot.ts         # Groq Llama 3.3 70B batch
│   ├── run-whisper-groq.ts             # Groq Whisper baseline
│   ├── run-qwen7b-ollama.ts            # Ollama 7B Q4 batch
│   ├── run-qwen14b-ollama.ts           # Ollama 14B Q4 hybrid batch
│   ├── run-bge-m3-tei.ts               # TEI embed batch
│   └── run-faster-whisper.ts           # faster-whisper batch
├── judges/
│   ├── score-drift.ts                  # Numeric diff (grading)
│   ├── band-agreement.ts               # Band match (grading)
│   ├── llm-judge-naturalness.ts        # Vi naturalness Likert (LLM-as-judge)
│   ├── llm-judge-factual.ts            # Factual accuracy vs RAG chunks
│   ├── llm-judge-helpfulness.ts        # Helpfulness Likert
│   └── human-eval-template.html        # Blind A/B form cho reviewer
├── reports/
│   └── generate-report.ts              # Markdown table summary
├── run-pilot.sh                        # Main runbook
└── README.md                           # How to run
```

---

## Runbook

### Quick start

```bash
cd eval-harness
npm install

# 1. Run cloud baseline
./run-pilot.sh --task=grading --model=cloud --output=baseline.jsonl
./run-pilot.sh --task=chatbot --model=cloud --output=baseline.jsonl
./run-pilot.sh --task=moderation --model=cloud --output=baseline.jsonl
./run-pilot.sh --task=vocab --model=cloud --output=baseline.jsonl
./run-pilot.sh --task=whisper --model=cloud --output=baseline.jsonl

# 2. Run local candidate
./run-pilot.sh --task=grading --model=local-qwen14b --output=candidate.jsonl
./run-pilot.sh --task=chatbot --model=local-qwen14b --output=candidate.jsonl
./run-pilot.sh --task=moderation --model=local-qwen7b --output=candidate.jsonl
./run-pilot.sh --task=vocab --model=local-qwen7b --output=candidate.jsonl
./run-pilot.sh --task=whisper --model=local-faster-whisper --output=candidate.jsonl

# 3. Generate diff report
./run-pilot.sh --task=grading --compare=baseline,candidate
./run-pilot.sh --task=all --compare=baseline,candidate --output=eval-report.md
```

### Off-peak rule (Gemini)

```bash
# Chạy sau 22:00 VN time
./run-pilot.sh --task=moderation --model=cloud --off-peak
./run-pilot.sh --task=vocab --model=cloud --off-peak
```

---

## Report template

Mỗi phase tạo report `eval-report-{task}-{date}.md`:

```markdown
# Eval Report — {Task} — {Date}

## Summary
- Cloud baseline: {model}
- Local candidate: {model}
- Pass: ✅ / ❌
- Recommended action: migrate / defer / rollback

## Metrics
| Metric | Cloud | Local | Threshold | Pass |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## Failures analysis
- 10 worst samples + diagnosis

## Latency comparison
| Percentile | Cloud | Local |
|---|---|---|
| p50 | Xs | Ys |
| p95 | Xs | Ys |

## Recommendation
- ...
```

---

## Decision gates per phase

| Phase → Next | Gate |
|---|---|
| 0 → 0.5 | Metrics endpoint live + dead code deleted |
| 0.5 → 1 | All 5 metrics pass threshold (embedding/router/whisper/vocab/moderation) |
| 1 → 2 | Embedding + router + Whisper production stable 1 tuần |
| 2 → 3 | Vocab + moderation production stable 2 tuần |
| 3 → 4 | Chatbot answer A/B pass OR skip 3 |
| 4 → Done | Grading A/B pass OR defer + accept cloud cost |

---

## Quota budget cho eval (free tier)

| API | Eval calls per task | Tasks | Total | % of free quota |
|---|---|---|---|---|
| Groq (grading + chatbot + whisper) | 200 + 200 + 50 | ×3 models | ~1350 | 4.5% of 30K/day |
| Gemini (moderation + vocab) | 200 + 200 | ×1 model | ~400 | 27% of 1500 RPD |

**Total eval cost**: <$10 one-time. **All on free tier.**

---

## Status

- [ ] Datasets collected
- [ ] Harness built
- [ ] Cloud baselines run
- [ ] Local pilots run
- [ ] Reports generated
- [ ] Decision gates evaluated

---

## Cross-references

- [migration-plan.md](./migration-plan.md) — Phase 0.5 owner + timeline
- [ai-workers-inventory.md](./ai-workers-inventory.md) — call sites + prompts
