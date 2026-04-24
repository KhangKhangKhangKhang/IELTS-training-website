# IELTS Personal Learning Platform - Specific Plan

## Context

Dự án IELTS training theo hướng cá nhân hóa, giúp người dùng tự học và cải thiện điểm IELTS thay vì bán khóa học.

**Ràng buộc quan trọng: CHI PHÍ AI**
- AI quá nhiều → chi phí vận hành cao (Forum AI đã là vấn đề)
- Cạnh tranh với Lexibot (45k/unlimited essay grading)
- Study Planner + AI grading là core feature → cần có trong Basic tier

**New Pricing Strategy:**
- Free: 0 VND (tests unlimited, AI limited)
- Basic: 79k VND/tháng (Study Planner + AI grading 20/月)
- Premium: 129k VND/tháng (Study Planner Advanced + AI-generated tips + convenience features)

---

## Current Architecture

### Backend (NestJS)
- **Auth:** JWT + Google OAuth + OTP
- **Database:** PostgreSQL + Prisma
- **AI:** Gemini chatbot + async grading (Writing/Speaking)
- **Queue:** RabbitMQ cho AI tasks
- **Cache:** Redis

### Frontend (React + Vite)
- **UI:** Ant Design + Tailwind CSS
- **AI Study Flow MVP:** LOW_COST/BALANCED/PREMIUM modes (chưa có logic thực)

---

## SUBSCRIPTION PLANS

### Free Tier (Miễn phí)
| Feature | Limit | AI Usage |
|---------|-------|----------|
| Full test (4 skills) | **Unlimited** tests | Rule-based scoring only |
| Vocabulary | 50 words | **5 AI suggestions/month** |
| Grammar | Basic lessons | No AI |
| Forum | Read + Post | No AI reply |
| Progress stats | Basic | - |
| AI Chatbot | - | **5 messages/month** |
| Study Planner | - | **Basic outline only** |

**Purpose:** Thu hút user, demonstrate value. Tests unlimited nhưng AI có giới hạn.

### Basic - 79,000 VND/tháng
| Feature | Limit | AI Usage |
|---------|-------|----------|
| Full test | **Unlimited** | Rule-based scoring |
| Vocabulary | **Unlimited** | AI suggestion **unlimited** (cached) |
| Grammar | Full lessons + **guided practice** | AI error detection **unlimited** |
| Forum | Full access | AI chatbot **50 messages/month** |
| Progress stats | Detailed | Band prediction |
| AI Writing Grading | **20 submissions/month** | AI detailed feedback |
| AI Speaking Grading | **20 submissions/month** | AI detailed feedback |
| **Study Planner** | **Basic** | Daily tasks + milestones |

**Purpose:** Main tier - đủ rẻ cạnh tranh (79k vs Lexibot 45k), đủ features để học hiệu quả. AI limit 20/月 phù hợp với typical usage.

### Premium - 129,000 VND/tháng
| Feature | Limit | AI Usage |
|---------|-------|----------|
| All Basic features | **Same limits** | **Same AI limits** |
| **Offline Mode** | Vocabulary + Flashcards (sync across devices) | - |
| **Weekly Report** | Email với progress summary | AI-generated |
| **Priority Support** | Faster response time | - |
| **"Practice Weaknesses" mode** | **AI micro-drills** based on weak areas | Priority queue |
| **Smart Study Planner** | **Advanced** | AI-generated personalized tips |
| **Compare with Average** | Xem band so với typical test-takers | - |

**Purpose:** Convenience + advanced personalization. Same AI limits như Basic nhưng có AI micro-drills + personalized tips.

### Team/School - 299,000 VND/tháng
| Feature | Limit |
|---------|-------|
| 5 student accounts | + 5 slots |
| Admin dashboard | Track all students |
| Custom tests | Teacher-upload |
| Priority support | - |

---

## AI USAGE OPTIMIZATION STRATEGIES

### 1. Intelligent Caching
- **Kết quả AI grading:** Cache vĩnh viễn, không re-grade cùng 1 bài
- **Vocabulary suggestions:** Cache theo word, reuse cho all users
- **Forum AI replies:** Cache generic topics

### 2. Tiered AI Responses
- **Free:** AI-generated explanation nhưng có cooldown
- **Paid:** Instant AI responses

### 3. Hybrid Grading (Free tier)
- Sử dụng **rule-based scoring** cho Reading/Listening (đã có band-score tables)
- Chỉ AI grading cho Writing/Speaking paid tiers
- Provide band estimate cho Free tier (dùng rubric template matching)

**Rule-Based Scoring System (cho Reading/Listening):**

| Component | Description | Accuracy |
|-----------|-------------|----------|
| **Band Score Tables** | Đã có sẵn trong `band-score.util.ts` - map raw score → band score theo IELTS official criteria | ~95% accurate so với AI grading |
| **Question Type Weighting** | Mỗi question type có weight khác nhau cho band score | Tương đương real test scoring |
| **Partial Credit** | Multiple choice: đúng/sai rõ ràng; Fill-blank: exact match với variations | ~90% accurate |
| **Time Penalty** | Nếu submit quá sớm/quá muộn so với expected time → warning nhưng không penalty band | N/A - just feedback |

**Rule-based scoring không cần AI** vì:
1. Reading/Listening là objective scoring - đáp án đúng/sai đã xác định sẵn
2. Band score conversion tables đã được validate dựa trên IELTS official criteria
3. AI không làm gì thêm cho Reading/Listening ngoài việc chấm đúng/sai

**Limitation:** Rule-based scoring không detect được nuanced errors như "câu trả lời đúng nhưng reasoning sai" - nhưng không ảnh hưởng đến band score vì đáp án vẫn đúng.

### 4. Batch Processing
- Queue Writing submissions, process off-peak
- Speaking transcripts: reuse AI transcription if quality good enough

---

## FEATURE RECOMMENDATIONS

### Priority 1: Subscription System (Foundation)

**Why first:** Cần có revenue model trước khi scale AI

**Components:**
1. **Subscription Model** (prisma/schema.prisma)
   ```prisma
   model Subscription {
     id             String   @id @default(uuid())
     userId         String   @unique
     planType       PlanType // FREE, BASIC, PREMIUM, TEAM
     status         SubStatus // ACTIVE, EXPIRED, CANCELLED
     startDate      DateTime
     expireDate     DateTime
     aiGradingLeft  Int?    // null = unlimited
     createdAt      DateTime @default(now())
   }
   ```

2. **AI Usage Tracking** (tối ưu chi phí)
   ```prisma
   model AiUsageLog {
     id        String   @id @default(uuid())
     userId    String
     actionType String  // GRADING_WRITING, GRADING_SPEAKING, CHATBOT, VOCAB_SUGGEST
     tokensUsed Int?
     cost      Float?   // tính USD để biết margin
     createdAt DateTime @default(now())
   }
   ```

3. **Payment Integration** (Stripe/VNPay)
   - Stripe checkout cho international
   - VNPay cho local payment
   - Freemium → Paid upgrade flow

**Files to create/modify:**
- `prisma/schema.prisma` - add Subscription, AiUsageLog models
- `src/module/subscription/` - new module
- `src/module/payment/` - new module
- `src/auth/` - protect subscription-gated features

### Priority 2: Question Type Analytics

**Why:** Data-driven practice thay vì AI-intensive

**Features:**
- Track performance per question type (TFNG, MCQ, Fill-blank...)
- Identify weaknesses automatically (không cần AI)
- "Practice Weaknesses" mode - tự động generate practice từ rule-based

**Implementation:**
```prisma
model QuestionTypePerformance {
   id            String @id @default(uuid())
   userId        String
   skillType     SkillType
   questionType  QuestionType
   totalAttempts Int
   correctCount Int
   avgBandScore Float
   lastAttemptAt DateTime
}
```

**No AI needed:** rule-based weakness detection

### Priority 3: Smart Study Planner (Premium)

**AI Usage:** LOW - chỉ gợi ý plan, không generate content

**Features:**
- Calculate daily study targets based on:
  - Current band vs target band gap
  - Days remaining
  - Weak skill areas
- Weekly milestones
- Study time reminders

**Implementation:**
- Pre-defined templates cho different scenarios (e.g., "Need 6.5 in 2 months")
- Rule-based recommendations, not AI-generated
- AI only for: "Generate personalized tip" (paid)

---

## SMART STUDY PLANNER - DETAILED LEARNING PATH

### Core Algorithm: Generate Study Plan

**Input:**
```typescript
interface UserProfile {
  currentBand: { reading: number; listening: number; writing: number; speaking: number }
  targetBand: number
  daysUntilExam: number
  studyHoursPerDay: number
}
```

**Output:**
```typescript
interface StudyPlan {
  isRealistic: boolean
  warning?: string           // "Band gap too large for timeline"
  adjustedTarget?: number   // Realistic target
  weeklyPlan: WeeklyPlan[]
  dailyMinutes: number
  recommendation: string
}
```

**Algorithm:**

```typescript
function generateStudyPlan(profile: UserProfile): StudyPlan {
  const { currentBand, targetBand, daysUntilExam, studyHoursPerDay } = profile;

  // 1. Calculate band gap
  const currentAvg = average([currentBand.reading, currentBand.listening,
                              currentBand.writing, currentBand.speaking]);
  const bandGap = targetBand - currentAvg;

  // 2. Calculate realistic improvement rate
  //    Max sustainable improvement: 0.5 band per month for beginners
  //    0.3 band per month for intermediate (5.5-6.5)
  //    0.2 band per month for advanced (7.0+)
  const maxMonthlyGain = currentAvg < 5.5 ? 0.5
                       : currentAvg < 7.0 ? 0.3
                       : 0.2;
  const monthsUntilExam = daysUntilExam / 30;
  const maxPossibleGain = maxMonthlyGain * monthsUntilExam;

  // 3. EDGE CASE: Unrealistic target
  if (bandGap > maxPossibleGain * 1.5) {
    return {
      isRealistic: false,
      warning: `Với band hiện tại ${currentAvg.toFixed(1)} và ${daysUntilExam} ngày, mục tiêu band ${targetBand} không thực tế.`,
      adjustedTarget: Math.min(targetBand, currentAvg + maxPossibleGain),
      recommendation: `Gợi ý: Kéo dài ngày thi thêm ${Math.ceil((bandGap - maxPossibleGain) / maxMonthlyGain * 30)} ngày, hoặc giảm mục tiêu band xuống ${(currentAvg + maxPossibleGain).toFixed(1)}`
    };
  }

  // 4. EDGE CASE: Very short timeline
  if (daysUntilExam <= 14) {
    return generateIntensiveTwoWeekPlan(profile);
  }

  // 5. EDGE CASE: Very long timeline
  if (daysUntilExam >= 180) {
    return generateSixMonthPlan(profile);
  }

  // 6. Normal path: Generate phased plan
  return generateStandardPlan(profile);
}
```

### EDGE CASE HANDLING

#### Case 1: Band 5.0 → 9.0 in 2 weeks
```
WARNING_DISPLAY:
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Mục tiêu không thực tế                               │
├─────────────────────────────────────────────────────────┤
│  Bạn đặt mục tiêu band 9.0 trong 14 ngày                │
│  Band hiện tại: 5.0                                     │
│  Band gap: 4.0                                          │
│                                                         │
│  Thực tế: Trung bình cần 8 tháng để tăng 1.0 band       │
│                                                         │
│  Gợi ý:                                                 │
│  1. Kéo dài ngày thi thêm 240 ngày để đạt 9.0           │
│  2. Giảm mục tiêu band xuống 5.5 (khả thi trong 14 ngày) │
│  3. Tham gia khóa học IELTS cấp tốc (không khuyến khích) │
└─────────────────────────────────────────────────────────┘
```

#### Case 2: Band 5.0 → 6.5 in 2 weeks
```
STATUS: CHALLENGING but possible
RECOMMENDATION:
- Intensive study: 4h/day
- Focus on weakest skill only (not all 4)
- Target: 6.0 realistic, 6.5 if lucky
```

#### Case 3: Band 6.5 → 7.5 in 30 days
```
STATUS: MODERATELY REALISTIC
RECOMMENDATION:
- Study 2h/day
- Focus on Writing (hardest to improve)
- Target: 7.0 realistic, 7.5 if excellent performance
```

### Phased Learning Path (Standard Cases)

#### Phase 1: Assessment (Week 1)
**Mục tiêu:** Xác định trình độ, thiết lập baseline

```
Day 1-2: Placement Test
  → Full IELTS mock (no AI grading, rule-based scoring)
  → Reading (1h), Listening (30ph), Writing (1h), Speaking (15ph)

Day 3-4: Analysis
  → Skill breakdown per question type
  → Identify top 3 weakest areas

Day 5-7: Plan Generation
  → Calculate realistic target
  → Generate personalized schedule
  → Set up reminders & milestones
```

#### Phase 2: Foundation (Week 2-4)
**Mục tiêu:** Vocabulary + Grammar + Basic strategies

| Week | Morning (30ph) | Afternoon (30ph) | Evening (1h) |
|------|---------------|------------------|-------------|
| Week 2 | Vocab flashcards (10 words) | Grammar (1 topic) | Listening practice |
| Week 3 | Vocab review | Grammar practice | Reading passage |
| Week 4 | Vocab + Idiom | Sentence structures | Writing Task 1 template |

**Daily Template:**
```javascript
const standardDailySchedule = {
  vocabulary: 30,    // Spaced repetition
  grammar: 30,       // 1 grammar point
  skillPractice: 60, // Rotate: L → R → W → S
  totalMinutes: 120  // 2 hours
};
```

#### Phase 3: Skill Building (Week 5-8)
**Mục tiêu:** Nâng cao từng skill

| Week | Focus | Tasks |
|------|-------|-------|
| Week 5 | Listening Advanced | Map, table completions |
| Week 6 | Reading Advanced | Matching, Yes/No/Not Given |
| Week 7 | Writing Task 1 | All chart types + templates |
| Week 8 | Writing Task 2 | Essay structures + arguments |

#### Phase 4: Integration (Week 9-12)
**Mục tiêu:** Full tests + Error analysis

| Week | Schedule |
|------|----------|
| Week 9 | Full mock test + review |
| Week 10 | Focus on weak areas |
| Week 11 | Full mock test + compare |
| Week 12 | Light review, mental prep |

#### Phase 5: Pre-Exam (Week 13-14)
**Mục tiêu:** Không burnout, tự tin

```
Week 13: Light practice only, no new topics
Week 14: Rest + confidence building
```

### Study Plan Output Examples

#### Example 1: Realistic (5.0 → 6.5 in 60 days)
```json
{
  "isRealistic": true,
  "currentBand": 5.0,
  "targetBand": 6.5,
  "daysUntilExam": 60,
  "studyHoursPerDay": 2,
  "weeklyPlan": [
    { "week": 1, "theme": "Assessment", "focus": "Placement test + analysis" },
    { "week": 2, "theme": "Foundation", "focus": "Vocab 10/day + Grammar basics" },
    { "week": 3, "theme": "Foundation", "focus": "Listening strategies" },
    { "week": 4, "theme": "Foundation", "focus": "Reading strategies" },
    { "week": 5, "theme": "Skill Building", "focus": "Writing Task 1" },
    { "week": 6, "theme": "Skill Building", "focus": "Writing Task 2" },
    { "week": 7, "theme": "Skill Building", "focus": "Speaking Part 1+2" },
    { "week": 8, "theme": "Integration", "focus": "Mock test + review" },
    { "week": 9-10", "theme": "Integration", "focus": "Focus on weakest" }
  ],
  "dailyBreakdown": {
    "monday": { "vocab": 30, "grammar": 30, "listening": 60 },
    "tuesday": { "vocab": 30, "grammar": 30, "reading": 60 },
    "wednesday": { "vocab": 30, "grammar": 30, "writing": 60 },
    "thursday": { "vocab": 30, "grammar": 30, "speaking": 60 },
    "friday": { "vocab": 30, "grammar": 30, "review": 60 },
    "saturday": { "fullTest": 180 },
    "sunday": { "rest": 0 }
  },
  "milestones": [
    { "week": 4, "targetBand": 5.5, "check": "Achieved?" },
    { "week": 8, "targetBand": 6.0, "check": "Achieved?" },
    { "week": 12, "targetBand": 6.5, "check": "Achieved?" }
  ],
  "aiTips": "Your TFNG accuracy needs work. Focus on keyword identification..."
}
```

#### Example 2: Unrealistic (5.0 → 9.0 in 14 days)
```json
{
  "isRealistic": false,
  "warning": "Band gap 4.0 trong 14 ngày không khả thi. Max possible gain: 0.2 band",
  "adjustedTarget": 5.5,
  "recommendation": {
    "option1": "Dời ngày thi sang 240 ngày sau để đạt 9.0",
    "option2": "Giữ ngày thi, giảm mục tiêu band xuống 5.5",
    "option3": "Book khóa học cấp tốc (không khuyến khích)"
  }
}
```

### Algorithm Summary

| Scenario | Input | Output |
|----------|-------|--------|
| Normal | 5.0 → 6.5, 60 days | Standard 12-week plan |
| Short + Realistic | 5.5 → 6.0, 30 days | 4-week intensive plan |
| Short + Unrealistic | 5.0 → 9.0, 14 days | Warning + adjusted target |
| Long | 5.0 → 6.5, 180 days | 6-month relaxed plan |

**Key Rules:**
- Max 0.5 band/month for beginners (<5.5)
- Max 0.3 band/month for intermediate (5.5-7.0)
- Max 0.2 band/month for advanced (>7.0)
- Always suggest realistic alternative when gap too large

---

## VOCABULARY IMPROVEMENT STRATEGY

### Current Problem
- User có thể thêm từ vựng nhưng **không tích hợp vào learning flow**
- Không có **spaced repetition** thực sự
- AI suggestion chỉ là lookup, không có **active learning**

### Solution: Integrated Vocabulary Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    VOCABULARY FLOW                         │
├─────────────────────────────────────────────────────────────┤
│  1. Learn    │  2. Practice    │  3. Review    │  4. Master │
│  (New word) │  (In context)   │  (Spaced rep) │  (In tests)│
└─────────────────────────────────────────────────────────────┘
```

### Stage 1: Learn (Input)
**How:**
- User thêm từ manually
- AI suggest từ mới dựa trên reading/listening transcripts
- Topic-based vocabulary lists (Education, Environment, Technology...)

**Data Model:**
```typescript
interface VocabWord {
  id: string
  word: string
  phonetic: string
  meaning: string
  example: string
  level: Level          // Low, Mid, High
  topic: string
  relatedQuestionTypes: QuestionType[]  // để link vào practice
  timesReviewed: number
  lastReviewedAt: Date
  nextReviewAt: Date    // SM-2 algorithm
  correctCount: number
  incorrectCount: number
  status: 'new' | 'learning' | 'review' | 'mastered'
}
```

### Stage 2: Practice (Contextual Usage)
**How:**
- **Flashcard Mode:** Show word → User recalls meaning → Check
- **Fill-in-blank:** Insert word into sentence
- **Listening integration:** Dictation với từ đã học
- **Reading integration:** Passage với từ highlighted

**Practice Types:**
```javascript
const vocabPracticeTypes = [
  { type: 'flashcard', duration: 5, cards: 10 },
  { type: 'fill_blank', duration: 10, questions: 5 },
  { type: 'dictation', duration: 10, words: 10 },
  { type: 'context', duration: 15, passage: 1 }
];
```

**AI Enhancement:**
- Suggest words dựa trên user's weak question types
- Example sentences từ actual IELTS passages

### Stage 3: Spaced Repetition (SM-2 Algorithm)
**SM-2 Formula:**
```javascript
function sm2(quality, repetitions, easiness, interval) {
  // quality: 0-5 (0=wrong, 5=perfect)
  if (quality < 3) {
    return { repetitions: 0, interval: 1, easiness };
  }
  if (repetitions === 0) interval = 1;
  else if (repetitions === 1) interval = 6;
  else interval = Math.round(interval * easiness);

  repetitions++;
  easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  return { repetitions, interval: Math.max(1, interval), easiness: Math.max(1.3, easiness) };
}
```

**Review Schedule:**
| Status | Review Frequency |
|--------|-----------------|
| New | After 1 day |
| Learning | After 3 days |
| Review | After 7 days |
| Mastered | After 30 days |

**Integration với test:**
- Khi làm Reading/Listening test, từ vựng đã "mastered" được coi là đã biết
- Từ mới sai trong test → auto-add vào vocabulary list

### Stage 4: Active Deployment
**How:**
- Writing test → Highlight words từ vocabulary đã học
- Speaking test → Prompt user dùng specific vocabulary
- Chatbot → Encourage dùng từ mới

---

## GRAMMAR IMPROVEMENT STRATEGY

### Current Problem
- Grammar module hiện tại **tách rời** với test flow
- User học grammar riêng nhưng **không áp dụng** vào Writing/Speaking
- Không có **error tracking** từ AI grading

### Solution: Integrated Grammar Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    GRAMMAR FLOW                            │
├─────────────────────────────────────────────────────────────┤
│  1. Learn    │  2. Error Detect │  3. Practice │  4. Fix  │
│  (Rules)     │  (From AI)       │  (Targeted)   │  (Retry) │
└─────────────────────────────────────────────────────────────┘
```

### Stage 1: Learn (Grammar Lessons)
**Current:** Generic grammar lessons (tenses, clauses, etc.)

**Improved: Topic-based + Context**
```javascript
const grammarTopics = [
  { topic: 'Verb Tenses',        contexts: ['present', 'past', 'future'] },
  { topic: 'Conditional',        contexts: ['zero', 'first', 'second', 'third'] },
  { topic: 'Passive Voice',      contexts: ['simple', 'continuous', 'perfect'] },
  { topic: 'Complex Sentences',  contexts: ['relative', 'subordinate', 'compound'] },
  { topic: 'Cohesive Devices',   contexts: ['however', 'furthermore', 'consequently'] }
];
```

### Stage 2: Error Detection (AI-Powered)
**How:**
- AI grading Writing/Speaking → detect grammar errors
- Auto-categorize errors → Grammar category

**Error Types Tracked:**
```typescript
interface GrammarError {
  userId: string
  category: GrammarCategory    // Tense, Subject-Verb, Article, etc.
  errorCount: number
  examples: string[]            // user's actual wrong sentences
  lastOccurrredAt: Date
  improvementRate: number       // decreasing = improving
}
```

**AI Detection Flow:**
```
User submits Writing
  → AI Grading processes
  → Extract grammar errors
  → Categorize + Store in GrammarError
  → Link to Grammar lesson
  → Suggest practice
```

### Stage 3: Targeted Practice
**Based on errors:**
```javascript
// Example: User makes 5 Subject-Verb errors in last 10 writings
if (grammarError['SUBJECT_VERB'] > 3) {
  recommendPractice('subject-verb-agreement', 5);
}
```

**Practice Types:**
| Practice | Duration | Focus |
|----------|----------|-------|
| Error correction | 10 min | Identify + fix errors |
| Sentence transformation | 15 min | Rewrite with correct grammar |
| Error detection in passage | 10 min | Find errors in text |

### Stage 4: Mastery Check
**Integration với Writing:**
- AI check for repeated errors → If improved, mark as "resolved"
- Band impact: Each error category can affect 0.5 band

**Grammar + Vocabulary Combo:**
- Passage reading: Highlight grammar structures + vocabulary
- User learns both simultaneously

---

## VOCABULARY + GRAMMAR INTEGRATION WITH STUDY PLANNER

### Daily Study Schedule (with Vocab + Grammar)

```json
{
  "standardDay": {
    "morning": {
      "time": "7:00 - 7:30",
      "activity": "Vocabulary Review (Spaced Repetition)",
      "method": "Flashcard 10 words",
      "ai": "Suggest next words to review"
    },
    "afternoon": {
      "time": "12:00 - 12:30",
      "activity": "Grammar Focus",
      "method": "1 grammar topic + 5 practice questions",
      "ai": "Detect weak areas from past errors"
    },
    "evening": {
      "time": "19:00 - 20:30",
      "activity": "Skill Practice (Rotate)",
      "method": "Listening/Reading/Writing/Speaking",
      "ai": "Generate targeted questions"
    },
    "beforeSleep": {
      "time": "22:00 - 22:15",
      "activity": "Vocabulary Preview",
      "method": "Look at tomorrow's 5 new words"
    }
  }
}
```

### Weekly Integration

| Day | Vocab | Grammar | Skill Focus |
|-----|-------|---------|-------------|
| Mon | Review 10 | Verb Tenses | Listening |
| Tue | Review 10 | Conditionals | Reading |
| Wed | Review 10 | Passive Voice | Writing Task 1 |
| Thu | Review 10 | Complex Sentences | Writing Task 2 |
| Fri | Review 10 | Cohesive Devices | Speaking |
| Sat | Full Test | Light review | All |
| Sun | Rest | Rest | Rest |

---

## PRICING STRATEGY NOTES

### Final Pricing Structure

| Tier | Price | Key Features |
|------|-------|--------------|
| Free | 0 VND | Unlimited tests (rule-based), 5 AI chatbot msg/month |
| Basic | 79,000 VND | Full AI grading (20/month), Study Planner, Vocab + Grammar |
| Premium | 129,000 VND | Basic + Offline Mode, Weekly Report, Priority Support, Practice Weaknesses, Advanced Planner |

### AI Cost Estimate (Basic tier, $0.05/writing):
-假设user làm 20 bài writing/tháng = $1/month
-假设user làm 20 bài speaking/tháng = $1/month
-假设user chat 50 messages/tháng = $0.5/month
-Total AI cost: ~$2.5/user/month
-Margin at 79k VND (~$3 USD): ~20% margin - chấp nhận được

### Marketing Notes:
- Basic 79k là **main revenue tier** - đủ rẻ để cạnh tranh, đủ features để học hiệu quả
- Premium 129k khác biệt ở **convenience** (offline, weekly report) không phải AI
- User không làm đề hàng ngày → actual AI usage thấp hơn estimate

---

## IMPLEMENTATION ROADMAP

### Phase 1: Subscription Foundation (2-3 weeks)
- [ ] Add Subscription model to schema
- [ ] Add AiUsageLog model
- [ ] Create subscription module (NestJS)
- [ ] Create payment module (Stripe/VNPay integration)
- [ ] Add subscription-gated guards to existing endpoints
- [ ] Frontend: upgrade modal, plan comparison page

### Phase 2: Question Analytics (1-2 weeks)
- [ ] Add QuestionTypePerformance tracking
- [ ] Implement rule-based weakness detection
- [ ] "Practice Weaknesses" mode UI
- [ ] Analytics dashboard improvements

### Phase 3: Cost Optimization (1 week)
- [ ] AI grading cache (hash-based dedup)
- [ ] Vocabulary suggestion cache
- [ ] AI usage monitoring dashboard (admin)
- [ ] Set up cost alerts

### Phase 4: Smart Planner (2 weeks)
- [ ] Study plan templates database
- [ ] Rule-based planner logic
- [ ] Frontend: planner UI + reminders
- [ ] Push notification for reminders

### Phase 5: Premium Features (2-3 weeks)
- [ ] Actionable feedback templates
- [ ] Micro-learning question banks
- [ ] Offline vocabulary sync
- [ ] Band score prediction model

---

## Verification Plan

1. Test subscription flow: Free → Basic upgrade
2. Verify AI usage logging accurate
3. Test weakness detection matches manual review
4. Verify cost tracking works (Stripe webhooks)
5. Load test: AI queue processing capacity

---

## IMPORTANT NOTES & CONTEXT FOR FUTURE AGENTS

### Project Structure
- **Backend:** `c:\Users\Garan\Desktop\Đồ án 2\ielts_training_app` (NestJS)
- **Frontend:** `c:\Users\Garan\Desktop\Đồ án 2\IELTS-training-website` (React + Vite)

### Critical Constraints
1. **AI Cost is CRITICAL** - Forum AI already caused high costs. Every AI feature needs cost optimization
2. **Lexibot competition:** 45k VND for unlimited essay grading. Our Basic at 79k must compete with that
3. **Basic tier MUST include Study Planner** - it's a core learning feature, not a premium add-on
4. **Premium differs by convenience, NOT AI limits** - same AI limits for Basic and Premium

### Band Improvement Rules
- Max 0.5 band/month for beginners (<5.5)
- Max 0.3 band/month for intermediate (5.5-7.0)
- Max 0.2 band/month for advanced (>7.0)
- **Always warn user when target is unrealistic** and suggest alternatives

### Key Technologies Used
- Backend: NestJS, Prisma, PostgreSQL, Redis, RabbitMQ, Gemini AI
- Frontend: React 19, Vite, Ant Design, Tailwind CSS, Recharts
- File Storage: Cloudinary
- Auth: JWT, Google OAuth, OTP

### Features Needing Implementation
- Subscription system (Subscription + AiUsageLog models)
- Study Planner logic (rule-based, not AI-generated)
- Vocabulary SM-2 spaced repetition integration
- Grammar error tracking from AI grading
- Question type performance analytics

### Files to Modify for Subscription
- `prisma/schema.prisma` - add Subscription, AiUsageLog, QuestionTypePerformance, GrammarError models
- `src/module/subscription/` - new NestJS module
- `src/module/payment/` - new NestJS module

### Existing Features to Preserve
- Full 4-skill test flow (L/R/W/S)
- AI chatbot with Gemini
- AI async grading via RabbitMQ
- XP and Streak gamification
- Vocabulary with AI suggestions

### Competition Analysis
- **Lexibot:** 45k/month, unlimited writing AI grading only
- **Our advantage:** 4 skills instead of 1, Study Planner included in Basic
- **Our challenge:** Need to balance AI costs while competing on price