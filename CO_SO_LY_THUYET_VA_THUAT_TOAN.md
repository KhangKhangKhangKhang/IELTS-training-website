# CƠ SỞ LÝ THUYẾT VÀ THUẬT TOÁN TRONG DỰ ÁN

## 1. LÝ THUYẾT NGHIÊN CỨU (Research Background)

### 1.1 Các lý thuyết ngôn ngữ được đề cập trong đồ án gốc

| Lý thuyết | Nguồn | Mô tả | Áp dụng trong dự án |
|-----------|-------|-------|---------------------|
| **Krashen's i+1 Hypothesis** | Stephen Krashen | Học viên tiếp thu ngôn ngữ khi nhận được input ở mức i+1 (cao hơn một bậc so với trình độ hiện tại) | Study Planner - đề xuất bài test phù hợp với năng lực |
| **Zimmerman's Self-Regulated Learning** | Barry Zimmerman | Học sinh tự điều chỉnh quá trình học tập thông qua mục tiêu, chiến lược và phản hồi | Study Planner - tự tạo daily tasks, self-monitoring |
| **Nation's Four Strands** | Paul Nation | Tiếp thu ngôn ngữ qua 4 kênh: Input (đọc/nghe), Output (nói/viết), Language-focused, Fluency | Study Planner - phân bổ thời gian theo tỷ lệ |
| **IELTS Scoring Criteria** | British Council | Tiêu chí chấm điểm chuẩn quốc tế cho 4 kỹ năng | AI Grading - rubric cho Writing/Speaking |
| **SM-2 Algorithm** | Piotr Woźniak (1987) | Thuật toán lặp lại ngắt quãng tối ưu thời gian ôn tập | Vocabulary - spaced repetition |

### 1.2 Band Improvement Rates (British Council Research)

| Trình độ hiện tại | Tốc độ cải thiện Band | Ghi chú |
|------------------|---------------------|---------|
| Band < 5.5 | ~0.5/month | Cần foundation vững |
| Band 5.5 - 7.0 | ~0.3/month | Giai đoạn phát triển kỹ năng |
| Band > 7.0 | ~0.2/month | Giai đoạn tinh chỉnh |

*Nguồn: British Council IELTS Official Research - đây là baseline, thực tế phụ thuộc vào thời gian học và phương pháp*

### 1.3 Krashen's 5 Hypotheses

1. **Acquisition-Learning Hypothesis**: Phân biệt giữa "acquisition" (tiếp thu tự nhiên) và "learning" (học có ý thức)
2. **Monitor Hypothesis**: Knowledge về ngữ pháp chỉ đóng vai trò "monitor" (kiểm tra) khi nói/viết
3. **Input Hypothesis (i+1)**: Input phải ở mức cao hơn trình độ hiện tại một bậc
4. **Natural Order Hypothesis**: Cấu trúc ngôn ngữ được học theo thứ tự predictable
5. **Affective Filter Hypothesis**: Động lực, tự tin, lo âu ảnh hưởng đến tiếp thu

### 1.4 Nation's Four Strands

| Strand | Hoạt động | Tỷ lệ đề xuất |
|--------|-----------|---------------|
| **Meaning-focused Input** | Đọc, nghe để hiểu nghĩa | 25-40% |
| **Meaning-focused Output** | Nói, viết để truyền đạt | 25-40% |
| **Language-focused** | Học từ vựng, ngữ pháp có chủ đích | 15-25% |
| **Fluency Development** | Sử dụng ngôn ngữ đã biết một cách tự nhiên | 15-25% |

---

## 2. CÁC THUẬT TOÁN ĐÃ ÁP DỤNG TRONG SOURCE CODE

### 2.1 SM-2 Spaced Repetition Algorithm

**Vị trí:** `ielts_training_app/src/module/vocabulary/vocabulary.service.ts`

**Giới thiệu:** SM-2 là thuật toán lặp lại ngắt quãng được phát triển bởi Piotr Woźniak (1987), tối ưu hóa thời gian ôn tập dựa trên hiệu quả ghi nhớ của người học.

**Công thức cốt lõi:**
```
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
I' = I * EF'

Trong đó:
- EF = Easiness Factor (hệ số dễ, ban đầu = 2.5, min = 1.3, max = 2.5)
- I = Interval (số ngày giữa các lần ôn)
- q = Quality của câu trả lời (0-5)
```

**Code implementation:**
```typescript
sm2(quality: number, repetitions: number, easiness: number, interval: number): SM2Result {
  // quality: 0-5 (0=hoàn toàn sai, 3=đúng với khó khăn, 5=hoàn hảo)
  if (quality < 3) {
    return { repetitions: 0, interval: 1, easiness }; // Reset on wrong answer
  }
  
  if (repetitions === 0) interval = 1;
  else if (repetitions === 1) interval = 6;
  else interval = Math.round(interval * easiness);

  repetitions++;
  easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  return { 
    repetitions, 
    interval: Math.max(1, interval), 
    easiness: Math.max(1.3, easiness) 
  };
}
```

**Trạng thái từ vựng dựa trên interval:**
```
interval >= 21 → 'mastered'    // Đã thành thạo
interval >= 7  → 'review'     // Đang ôn định kỳ
interval >= 1  → 'learning'   // Đang học
nextReviewAt = hôm nay + interval
```

**Đặc điểm:**
- Từ sai → reset về interval = 1 ngày, easiness giảm
- Từ đúng → interval tăng theo cấp số nhân
- Easiness factor đảm bảo từ khó không xuất hiện quá thường xuyên

---

### 2.2 Gamification - XP & Level System

**Vị trí:** `ielts_training_app/src/module/user-test-result/user-test-result.service.ts`

**Công thức XP khi hoàn thành bài thi:**
```
base_xp = band_score × 10

// Multiplier theo độ khó của đề:
Low   → x1.0
Mid   → x1.5
High  → x2.0
Great → x2.5

xpGained = base_xp × multiplier
```

**Chống Spam (Anti-Spam):**
- Nếu bài thi đã có kết quả trước đó → xpGained = 0
- Chỉ cộng XP cho bài thi mới

**Level Up Logic:**
```typescript
while (newXp >= xpToNext) {
  newXp -= xpToNext;
  currentLevel = this.getNextLevel(currentLevel);
  xpToNext = updateXpToNext(currentLevel);
}
// Carry over số dư XP sang level mới
```

**Cấp độ người dùng:** Low → Mid → High → Great

---

### 2.3 Streak System

**Vị trí:** `ielts_training_app/src/module/streak-service/streak-service.service.ts`

**Luồng cập nhật Streak:**
```
1. Lấy lastStudiedAt của user
2. So sánh với ngày hiện tại:
   - Cùng ngày: Giữ nguyên Streak
   - Ngày kế tiếp (lastStudiedAt + 1 ngày = hôm nay):
     → currentStreak += 1
     → longestStreak = max(longestStreak, currentStreak)
   - Cách quãng (>1 ngày):
     → currentStreak = 1 (reset)
3. Cập nhật lastStudiedAt = hôm nay
```

**Mục đích:** Tạo động lực học tập liên tục, duy trì thói quen

---

### 2.4 Study Planner - 4 Stage System

**Vị trí:** `ielts_training_app/src/module/study-planner/study-planner.service.ts`

**Nghiên cứu áp dụng:**
- Band improvement rates (British Council)
- Nation's Four Strands
- Krashen's i+1 Hypothesis
- Zimmerman's Self-Regulated Learning

**4 Giai đoạn (Stages):**

| Stage | Band Range | Min Vocab | Min Grammar | Daily Minutes | Focus |
|-------|-----------|-----------|-------------|---------------|-------|
| **FOUNDATION** | 0 - 5.0 | 0 words | weak | 60-90 | Nền tảng |
| **SKILL_BUILDING** | 5.0 - 6.0 | 50 words | medium | 90-120 | Rèn kỹ năng |
| **INTEGRATION** | 6.0 - 7.0 | 150 words | strong | 120-150 | Tích hợp |
| **EXAM_PREP** | 7.0 - 9.0 | 300 words | strong | 150-180 | Luyện đề |

**Four Strand Balance theo Stage:**
```typescript
FOUNDATION: { input: 40%, output: 30%, language: 20%, fluency: 10% }
SKILL_BUILDING: { input: 35%, output: 35%, language: 20%, fluency: 10% }
INTEGRATION: { input: 30%, output: 40%, language: 20%, fluency: 10% }
EXAM_PREP: { input: 25%, output: 45%, language: 15%, fluency: 15% }
```

**Stage Transition Conditions:**
```typescript
FOUNDATION → SKILL_BUILDING: 
  - minAvgBand: 5.0
  - minVocabMastered: 50
  - minGrammarProficiency: "medium"
  - minCompletionRate: 75%
  - minWeeksInStage: 2

SKILL_BUILDING → INTEGRATION:
  - minAvgBand: 6.0
  - minVocabMastered: 150
  - minGrammarProficiency: "strong"
  - minCompletionRate: 80%
  - minWeeksInStage: 2

INTEGRATION → EXAM_PREP:
  - minAvgBand: 7.0
  - minVocabMastered: 300
  - minGrammarProficiency: "strong"
  - minCompletionRate: 85%
  - minWeeksInStage: 2
```

**Daily Tasks được tạo tự động dựa trên:**
- Target band score
- Ngày thi dự kiến
- Thời gian học mỗi ngày
- Trình độ hiện tại (band, vocab, grammar)
- Stage hiện tại

---

### 2.5 Weakness Detection

**Vị trí:** `ielts_training_app/src/module/weakness/weakness.service.ts`

**Grammar Weakness Detection:**
```typescript
// 1. Lấy tất cả violations của user
// 2. Group by grammar topic (idGrammar)
// 3. Đếm wrongCount theo từng topic
// 4. Sort descending, lấy top 3
```

**Question Type Weakness Detection:**
```typescript
// 1. Lấy QuestionTypePerformance của user
// 2. Filter: totalAttempts >= 3 AND errorRate >= 30%
// 3. Sort by errorRate descending
// 4. Lấy top 3
```

---

## 3. AI SERVICES ARCHITECTURE

### 3.1 Tổng quan Kiến trúc Hybrid

Dự án sử dụng **2 nhà cung cấp AI** song song:

| Nhà cung cấp | Gói SDK | Mục đích | Model |
|-------------|---------|----------|-------|
| **Groq** | groq-sdk | AI Workers (grading, chatbot, embedding) | llama-3.3-70b-versatile, whisper-large-v3 |
| **Gemini** | @google/genai | Backend services (vocab suggest, forum moderation, chat) | gemini-2.5-flash, gemini-2.0-flash |

### 3.2 AI Workers (Groq - Docker Containers)

**3 AI Workers chạy trên Groq:**

| Worker | Port | Mục đích | Groq Model |
|--------|------|----------|------------|
| **grading-worker** | 3001 | Chấm điểm Writing/Speaking | llama-3.3-70b-versatile |
| **chatbot-worker** | 3002 | AI Chatbot hỗ trợ học tập | llama-3.3-70b-versatile |
| **embedding-worker** | 3003 | Tạo embeddings cho search | embed-english-v2.5 |

**Groq SDK Usage:**
```typescript
// ai-workers/*/src/services/groq.service.ts
import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Chat completion
const response = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: prompt }],
});

// Audio transcription (Speaking)
const transcript = await groq.audio.transcriptions.create({
  file: audioBuffer,
  model: 'whisper-large-v3',
});

// Embeddings
const embedding = await groq.embeddings.create({
  model: 'embed-english-v2.5',
  input: text,
});
```

**AI Pool Management (Shared):**
```typescript
// ai-workers/shared/src/config/ai-pool.ts
import Groq from 'groq-sdk';

// Multi-key support với circuit breaker pattern
```

**Circuit Breaker Pattern:**
```typescript
private groqFailureCount = 0;
private readonly GROQ_CIRCUIT_BREAKER_THRESHOLD = 5;
private readonly GROQ_CIRCUIT_BREAKER_RESET_MS = 30000;

// Tự động ngắt kết nối khi fail quá nhiều
// Reset sau 30 giây
```

---

### 3.3 Backend AI Services (Gemini - Direct API)

**3 Module Backend dùng Gemini trực tiếp:**

| Module | Mục đích | Gemini Model |
|--------|----------|-------------|
| **vocabulary.service.ts** | Gợi ý nghĩa từ vựng | gemini-2.5-flash |
| **forum-post.service.ts** | Forum moderation | gemini-2.5-flash |
| **chat-bot.service.ts** | Chatbot reply generation | gemini-2.0-flash |

**Gemini SDK Usage:**
```typescript
// src/module/vocabulary/vocabulary.service.ts
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

private ai: GoogleGenAI | null = null;

initialize() {
  const apiKey = this.configService.get<string>('GEMINI_API_KEY');
  this.ai = new GoogleGenAI({ apiKey });
}

// Sử dụng
const response = await this.ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt,
});
```

---

## 4. AI GRADING IMPLEMENTATION

### 4.1 AI Grading cho Writing (Groq Worker)

**Vị trí:** `ai-workers/grading-worker/src/handlers/write.handler.ts`

**Flow:**
```
1. User nộp bài → Backend lưu submission
2. Backend publish message → RabbitMQ grading queue
3. grading-worker nhận message → Groq LLM grading
4. Result được lưu vào database
```

**Prompt Engineering cho Writing:**
```typescript
const prompt = `
Bạn là giám khảo IELTS chuyên nghiệp.
Chấm bài viết theo tiêu chí:
- Task Achievement: 0-9
- Coherence and Cohesion: 0-9
- Lexical Resource: 0-9
- Grammatical Range and Accuracy: 0-9

[Task Type]: ${taskType}
[Câu hỏi]: ${prompt}
[Bài viết của học sinh]: ${submissionText}

Trả về JSON với điểm chi tiết và feedback.
`;

const responseText = await groq.chatcompletion(prompt);
```

**Response Structure:**
```json
{
  "overallScore": 6.5,
  "taskResponse": { "score": 6, "comment": "..." },
  "coherence": { "score": 7, "comment": "..." },
  "lexical": { "score": 6, "comment": "..." },
  "grammar": { "score": 6, "comment": "..." },
  "generalFeedback": "..."
}
```

---

### 4.2 AI Grading cho Speaking (Groq Worker)

**Vị trí:** `ai-workers/grading-worker/src/handlers/speak.handler.ts`

**Quy trình:**
1. Upload audio → Cloudinary
2. Transcription bằng Groq Whisper
3. Chấm điểm bằng Groq LLM

```typescript
// Transcription bằng Groq Whisper
transcript = await groq.transcribeAudio(audioBuffer);

// Grading prompt
const prompt = `
Bạn là giám khảo IELTS Speaking.
Chấm theo tiêu chí:
- Fluency and Coherence: 0-9
- Lexical Resource: 0-9
- Grammatical Range and Accuracy: 0-9
- Pronunciation: 0-9

[Question]: ${question}
[Transcript]: ${transcript.text}

Trả về JSON điểm chi tiết.
`;

const responseText = await groq.chatcompletion(prompt);
```

---

## 5. AI CHATBOT IMPLEMENTATION

### 5.1 Chatbot Worker (Groq)

**Vị trí:** `ai-workers/chatbot-worker/src/handlers/ask.handler.ts`

```typescript
// Groq là primary trong worker
const groq = createGroqService();
const response = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: prompt }],
});
```

### 5.2 Chatbot Backend (Gemini)

**Vị trí:** `src/module/chat-bot/chat-bot.service.ts`

```typescript
// Gemini 2.0-flash là primary trong backend
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: prompt,
});
```

### 5.3 Context Management (Redis)

```typescript
// Lưu chat history trong Redis
// Key: chat:{idUser}
// TTL: 1 ngày

// Prompt structure:
const prompt = `
Bạn là IELTS Assistant.
Ngữ cảnh hội thoại trước đó:
{chatHistory}

Câu hỏi hiện tại: {newMessage}
`;
```

---

## 6. AI EMBEDDING IMPLEMENTATION

### 6.1 Embedding Worker (Groq)

**Vị trí:** `ai-workers/embedding-worker/src/handlers/embed.handler.ts`

**Sử dụng Groq embed-english-v2.5:**
```typescript
const embedding = await groq.embeddings.create({
  model: 'embed-english-v2.5',
  input: text,
});
```

**Vector Storage:** Supabase pg_vector

---

## 7. VOCABULARY & FORUM AI

### 7.1 Vocabulary Suggestion (Gemini)

**Vị trí:** `src/module/vocabulary/vocabulary.service.ts`

**Dùng Gemini 2.5-flash để suggest nghĩa:**
```typescript
const response = await this.ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt, // Yêu cầu JSON với meaning, example, phonetic, level
});

const parsed = JSON.parse(response.text);
phonetic = parsed.phonetic;
example = parsed.example;
meaning = parsed.meaning;
```

---

### 7.2 Forum Moderation (Gemini)

**Vị trí:** `src/module/forum-post/forum-post.service.ts`

**Dùng Gemini 2.5-flash để moderate posts:**
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: moderationPrompt,
});

// Moderation result: APPROVED, NEEDS_REVIEW, AUTO_REJECTED
```

---

## 8. TEST SUGGESTION ALGORITHM

### 8.1 Vị trí
`ielts_training_app/src/module/recommend-test/`

### 8.2 Scoring Algorithm
```typescript
// 1. Phân tích hồ sơ năng lực:
//    - Tính band score trung bình theo kỹ năng
//    - Xác định kỹ năng yếu nhất

// 2. Scoring:
//    +50 cho đề thuộc kỹ năng yếu nhất
//    +30 cùng level với user
//    +15/+5 chênh lệch thấp
//    -20 chênh lệch cao
//    +0-10 yếu tố ngẫu nhiên

// 3. Selection:
//    - Sắp xếp theo điểm giảm dần
//    - Lấy top candidates
//    - Fisher-Yates shuffle để tránh lặp lại giao diện
```

---

## 9. GRAMMAR PROFICIENCY TRACKING

### 9.1 Vị trí
`ielts_training_app/src/module/grammar-tracking/`

### 9.2 Theo dõi
- Total attempts
- Correct count / Wrong count
- Violations (lỗi sai cụ thể)
- Consecutive correct streaks

---

## 10. CÁC LÝ THUYẾT MỚI SAU ĐỒ ÁN

### 10.1 Credit-based Economy

| Khái niệm | Mô tả |
|-----------|-------|
| Credit Package | Gói credit có giá (VNPay/MoMo) |
| Credit Balance | Số dư credit của user |
| Credit Transaction | Lịch sử giao dịch |
| Usage | Writing AI grading: ~X credits, Speaking AI grading: ~Y credits |

### 10.2 Teacher Review Ticket System

**Workflow:**
```
Student submit → PENDING → Teacher claim → IN_PROGRESS → COMPLETED
                                    ↓
                              CANCELLED (nếu hủy)
```

**Ticket chứa:**
- idTestResult
- Loại (WRITING/SPEAKING)
- AI band score (tham khảo)
- Teacher band score (chấm thủ công)
- Teacher feedback chi tiết

### 10.3 Forum Moderation System

**Trạng thái moderation:**
```
PENDING → AUTO_APPROVED (nếu score cao)
PENDING → NEEDS_REVIEW (nếu score trung bình)
PENDING → AUTO_REJECTED (nếu score thấp)
```

---

## 11. TÀI LIỆU THAM KHẢO

### 11.1 Lý thuyết ngôn ngữ
1. Krashen, S. D. (1982). *Principles and Practice in Second Language Acquisition*
2. Nation, I.S.P. (2007). *The Four Strands*
3. Zimmerman, B. J. (2002). *Self-Regulated Learning and Academic Achievement*
4. British Council. *IELTS Scoring Criteria*

### 11.2 Thuật toán
1. Woźniak, P. (1990). *Optimization of Repetition Spacing*
2. SuperMemo. *SM-2 Algorithm Documentation*

### 11.3 AI Services
1. Groq SDK Documentation
2. Google Gemini AI Documentation

### 11.4 Công nghệ
1. NestJS Documentation
2. Prisma ORM Documentation
3. React Documentation

---

*Cập nhật: 2026-06-02*
