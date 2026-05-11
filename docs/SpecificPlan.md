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

### Research Foundation

**Nguồn:**
- Zimmerman, B.J. (1989). "Self-Regulated Learning and Academic Achievement." *Journal of Educational Psychology*.
- Locke, E.A. & Latham, G.P. (2002). "Building a Practically Useful Theory of Goal Setting." *American Psychologist*.
- Krashen, S.D. (1982). *Principles and Practice in Second Language Acquisition*.

### Core Algorithm: Generate Study Plan

**Input:**
```typescript
interface UserProfile {
  currentBand: { reading: number; listening: number; writing: number; speaking: number }
  targetBand: number
  daysUntilExam: number
  studyHoursPerDay: number
  vocabTier: 1 | 2 | 3  // NEW: from vocabulary placement
  weakSkills: string[]  // NEW: from question type analytics
  preferredScheduleTime: 'morning' | 'afternoon' | 'evening'
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
  // NEW: Research-based additions
  inputOutputBalance: { input: number; output: number }
  difficultyLevel: 'easier' | 'standard' | 'challenging'
  motivationTips: string[]  // Based on SDT
  metacognitivePrompts: string[]  // For self-reflection
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

  // 2. Calculate realistic improvement rate (from research)
  //    Max 0.5 band/month for beginners (<5.5)
  //    0.3 band/month for intermediate (5.5-7.0)
  //    0.2 band/month for advanced (7.0+)
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
      // NEW: Motivation tips based on SDT
      motivationTips: [
        "Đặt mục tiêu vừa sức giúp duy trì động lực (competence need)",
        "Nhớ rằng việc học là hành trình, không phải cuộc đua"
      ]
    };
  }

  // 4. Calculate Four Strands Balance
  const dailyMinutes = studyHoursPerDay * 60;
  const inputTime = Math.round(dailyMinutes * 0.35);  // 35% input
  const outputTime = Math.round(dailyMinutes * 0.35);  // 35% output
  const languageFocusTime = Math.round(dailyMinutes * 0.20);  // 20% vocab/grammar
  const fluencyTime = Math.round(dailyMinutes * 0.10);  // 10% speed practice

  // 5. Determine difficulty level based on i+1 principle
  const difficultyLevel = determineIOneLevel(currentAvg, targetBand);

  // 6. Generate standard plan with all components
  return generateStandardPlan(profile, {
    inputTime, outputTime, languageFocusTime, fluencyTime,
    difficultyLevel,
    motivationTips: generateMotivationTips(profile),
    metacognitivePrompts: generateMetacognitivePrompts(profile)
  });
}

// NEW: i+1 difficulty adjustment
function determineIOneLevel(currentBand: number, targetBand: number): string {
  const gap = targetBand - currentBand;
  if (gap > 1.5) return 'easier';    // Significant gap - need easier materials
  if (gap > 0.5) return 'standard';  // Normal progression
  return 'challenging';              // Small gap - push to harder materials
}

// NEW: SDT-based motivation tips
function generateMotivationTips(profile: UserProfile): string[] {
  const tips = [];
  const { currentBand, targetBand, daysUntilExam } = profile;
  
  // Competence support
  if (daysUntilExam > 90) {
    tips.push("Bạn có thời gian chuẩn bị tốt - hãy tập trung vào tiến bộ ổn định");
  }
  
  // Autonomy support
  tips.push("Bạn có thể chọn thứ tự học từ gợi ý bên dưới - hãy chọn what works best for you");
  
  // Relatedness hint
  tips.push("Tham gia forum để kết nối với người cùng mục tiêu");
  
  return tips;
}

// NEW: Metacognitive prompts for self-reflection
function generateMetacognitivePrompts(profile: UserProfile): string[] {
  return [
    "Sau mỗi bài practice: 'Mình đã hiểu được bao nhiêu % nội dung?'",
    "Cuối tuần: 'Tuần này mình tiến bộ gì? Cần cải thiện gì?'",
    "Khi gặp khó khăn: 'Mình có đang học đúng cách không?' (self-monitoring)"
  ];
}
```

### Metacognitive Self-Regulation Features (Research-Based)

**Based on Zimmerman's SRL Model:**

```
┌─────────────────────────────────────────────────────────────────┐
│              SELF-REGULATED LEARNING PROMPTS                    │
├─────────────────────────────────────────────────────────────────┤
│ FORETHOUGHT (Start of session):                                │
│   → "Hôm nay mình sẽ tập trung vào kỹ năng yếu: [skill]"     │
│   → "Mục tiêu: hoàn thành [X] tasks trong [Y] phút"          │
│                                                                 │
│ PERFORMANCE (During session):                                  │
│   → Timer prompts: "Đã học được 15 phút - tiếp tục!"         │
│   → Self-check: "Mình đang làm tốt không?"                     │
│   → If struggling: "Cần nghỉ 5 phút không?"                    │
│                                                                 │
│ SELF-REFLECTION (End of session):                              │
│   → "Hôm nay học được gì?" (Journal entry)                    │
│   → "Kỹ năng nào vẫn còn yếu?"                               │
│   → "Ngày mai cần tập trung vào đâu?"                         │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation in UI:**
- Start-of-session modal with goal setting prompt
- End-of-session quick reflection (3 questions, < 1 min)
- Weekly summary email with progress visualization

### i+1 Material Recommendation System (NEW)

**Krashen's Input Hypothesis applied:**

```typescript
interface MaterialRecommendation {
  type: 'reading' | 'listening'
  difficulty: 'foundation' | 'intermediate' | 'advanced' | 'expert'
  examples: string[]
  warningThreshold: number  // % unknown words to trigger warning
}

// Material database based on difficulty
const readingMaterials = {
  foundation: [
    "BBC Learning English (Beginner)",
    "IELTS Foundation Reading Materials",
    "Simple Wikipedia articles"
  ],
  intermediate: [
    "IELTS Cambridge Practice Tests",
    "National Geographic (Simple articles)",
    "BBC News (Learning English section)"
  ],
  advanced: [
    "The Economist articles",
    "Academic journals (simplified)",
    "Cambridge academic word list materials"
  ],
  expert: [
    "Native English newspapers (FT, WSJ)",
    "Academic papers in your field",
    "Documentaries with subtitles"
  ]
};

// Auto-adjust based on user performance
function recommendMaterial(user, skillType) {
  const recentAccuracy = calculateRecentAccuracy(user, skillType);
  const currentBand = getUserOverallBand(user);
  
  if (recentAccuracy < 0.6) {
    return materials[currentBand].easier;  // i+1: slightly below level
  } else if (recentAccuracy > 0.85) {
    return materials[currentBand].harder;  // Push to challenge
  }
  return materials[currentBand].current;  // Stay at appropriate level
}
```
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

### Research Foundation

**Nguồn:** Nation, I.S.P. (2013). *Learning Vocabulary in Another Language*. Cambridge University Press.

**Lexical Coverage Research:**
| Coverage | Word Families | Context |
|----------|--------------|---------|
| 85% | ~1,000 | Casual conversation |
| 90% | ~3,000 | Basic communication |
| 95% | ~5,000 | Reading newspapers, IELTS |
| 98% | ~8,000-9,000 | Novels/literature |

**Target:** 5,000 word families = minimum for IELTS reading (95% coverage)

**Coxhead's Academic Word List (AWL):**
- 570 word families
- Covers ~10% of academic texts
- **Priority for band 6.5+ users**

### Current Problem
- User có thể thêm từ vựng nhưng **không tích hợp vào learning flow**
- Không có **spaced repetition** thực sự
- AI suggestion chỉ là lookup, không có **active learning**
- **Không có ưu tiên theo tần suất** - user học từ random, không phải high-value words

### Solution: Integrated Vocabulary Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    VOCABULARY FLOW                         │
├─────────────────────────────────────────────────────────────┤
│  1. Learn    │  2. Practice    │  3. Review    │  4. Master │
│  (High-freq) │  (In context)  │  (Spaced rep) │  (In tests)│
└─────────────────────────────────────────────────────────────┘
```

### Stage 0: Priority Ranking (NEW)

**High-Frequency Word Priority based on research:**

```
VOCABULARY PRIORITY TIERS:
┌─────────────────────────────────────────────────────────────┐
│ TIER 1 (Week 1-4): High-frequency general service words    │
│   → 1,000 most common words (90% coverage)                  │
│   → Priority for: Band < 5.5 learners                      │
├─────────────────────────────────────────────────────────────┤
│ TIER 2 (Week 5-12): Academic Word List                     │
│   → 570 word families (10% academic texts)                  │
│   → Priority for: Band 5.5-6.5 learners                    │
├─────────────────────────────────────────────────────────────┤
│ TIER 3 (Week 13+): Specialized/Technical vocabulary        │
│   → Topic-specific words (environment, education, etc.)    │
│   → Priority for: Band 6.5+ learners                       │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
- User takes vocabulary placement test (50 common words assessment)
- System determines starting tier based on current band
- AI suggestions prioritize current tier words first
- Auto-progress to next tier when 80% mastery of current tier achieved

**Vocabulary Placement Test (NEW):**
```typescript
interface VocabPlacementTest {
  id: string
  userId: string
  totalQuestions: 50
  correctCount: number
  estimatedTier: 'TIER_1' | 'TIER_2' | 'TIER_3'
  recommendedStartingPoint: number  // word family index
}
```

### Stage 1: Learn (Input)

**How:**
- User thêm từ manually
- AI suggest từ mới dựa trên reading/listening transcripts
- **Topic-based vocabulary lists prioritized by current tier**
- AI suggests words from current tier that user hasn't learned yet

**Smart Word Suggestion Algorithm:**
```javascript
function suggestNextWord(user) {
  const currentTier = user.vocabTier;  // 1, 2, or 3
  const knownWords = user.learnedWordIds;
  
  // Get words from current tier not yet learned
  const candidateWords = getWordsFromTier(currentTier)
    .filter(w => !knownWords.includes(w.id))
    .sortByFrequency();  // Most frequent first
  
  // Prioritize words that appear in user's recent practice tests
  const recentTestVocab = getRecentTestVocab(user);
  const prioritized = candidateWords
    .filter(w => recentTestVocab.includes(w.word))
    .concat(candidateWords.filter(w => !recentTestVocab.includes(w.word));
  
  return prioritized[0];
}
```

**Data Model (Updated):**
```typescript
interface VocabWord {
  id: string
  word: string
  phonetic: string
  meaning: string
  example: string
  level: Level          // Low, Mid, High
  topic: string
  tier: 1 | 2 | 3       // NEW: frequency tier
  frequencyRank: number // NEW: position in frequency list
  relatedQuestionTypes: QuestionType[]
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

### Research Foundation

**Nguồn:** Nation, I.S.P. (2013). *Learning Vocabulary in Another Language*. Cambridge University Press.

**Key insight:** Grammar structures follow a "Natural Order" (Krashen) - some structures are acquired before others.

**Grammar Categories by IELTS Band Target:**

| Band Target | Essential Grammar Focus | Advanced Grammar |
|-------------|------------------------|-------------------|
| 5.0-5.5 | Verb tenses, Subject-verb agreement, Basic sentence structure | Simple passives |
| 6.0-6.5 | Complex tenses, Clause structure, Relative clauses | Advanced passives, Nominalization |
| 7.0+ | Complex sentences, Paragraph coherence, Discourse markers | Academic style, Subjunctive |

### Current Problem
- Grammar module hiện tại **tách rời** với test flow
- User học grammar riêng nhưng **không áp dụng** vào Writing/Speaking
- Không có **error tracking** từ AI grading
- **Grammar không gắn với band target** - học random không có priority

### Solution: Integrated Grammar Pipeline with Error Intelligence

```
┌─────────────────────────────────────────────────────────────┐
│                    GRAMMAR FLOW                            │
├─────────────────────────────────────────────────────────────┤
│  1. Learn    │  2. Error Detect │  3. Practice │  4. Master │
│  (Band-based)│  (From AI)       │  (Targeted)   │  (In output)│
└─────────────────────────────────────────────────────────────┘
```

### Stage 0: Grammar Placement Assessment (NEW)

**Assessment to determine starting point based on current band:**

```typescript
interface GrammarPlacementTest {
  id: string
  userId: string
  sections: {
    verbTenses: number      // score 0-10
    sentenceStructure: number
    clauseTypes: number
    coherenceCohesion: number
  }
  recommendedFocus: GrammarCategory[]
  estimatedBandLevel: number
}
```

**Question sampling by band:**
- Band < 5.0: Focus on basic verb tenses, simple sentences
- Band 5.0-6.0: Add complex tenses, relative clauses
- Band 6.0+: Add discourse markers, paragraph structure

### Stage 1: Learn (Grammar Lessons - Band-Prioritized)

**Topic-based + Context + Band Priority:**

```javascript
const grammarTopics = [
  // Tier 1: Essential for Band 5.0-5.5
  { topic: 'Verb Tenses',        contexts: ['present', 'past', 'future'], bandTarget: 5.0 },
  { topic: 'Subject-Verb Agreement', contexts: ['singular', 'plural'], bandTarget: 5.0 },
  { topic: 'Simple Sentences',    contexts: ['declarative', 'question'], bandTarget: 5.0 },

  // Tier 2: For Band 5.5-6.5
  { topic: 'Conditional',        contexts: ['zero', 'first', 'second', 'third'], bandTarget: 5.5 },
  { topic: 'Passive Voice',      contexts: ['simple', 'continuous', 'perfect'], bandTarget: 5.5 },
  { topic: 'Relative Clauses',    contexts: ['defining', 'non-defining'], bandTarget: 5.5 },
  { topic: 'Complex Sentences',  contexts: ['subordinate', 'coordinate'], bandTarget: 6.0 },

  // Tier 3: For Band 6.5+
  { topic: 'Cohesive Devices',   contexts: ['however', 'furthermore', 'consequently'], bandTarget: 6.5 },
  { topic: 'Advanced Passives',   contexts: ['causative', 'modal'], bandTarget: 7.0 },
  { topic: 'Academic Style',      contexts: ['nominalization', 'formal register'], bandTarget: 7.5 }
];

// System recommends grammar topics based on user's target band
function getRecommendedGrammarTopics(targetBand: number): GrammarTopic[] {
  return grammarTopics.filter(t => t.bandTarget <= targetBand);
}
```

### Stage 2: Error Detection (AI-Powered + Research-Based Error Categories)

**Based on research:** Each grammar error category has measurable band impact.

**Error Categories with Band Impact:**

| Error Type | Band Impact | AI Detection Priority |
|------------|-------------|---------------------|
| Verb tense errors | -0.5 band | HIGH (most common) |
| Subject-verb agreement | -0.5 band | HIGH |
| Missing articles | -0.5 band | MEDIUM (common for non-native speakers) |
| Word order | -0.5 band | HIGH |
| Preposition errors | -0.25 band | MEDIUM |
| Cohesive device misuse | -0.5 band | HIGH (critical for coherence) |
| Sentence fragment | -0.25 band | MEDIUM |
| Run-on sentence | -0.25 band | MEDIUM |

**Error Types Tracked (Updated):**
```typescript
interface GrammarError {
  userId: string
  category: GrammarCategory
  errorCount: number
  bandImpact: number          // Estimated band score impact
  examples: string[]          // user's actual wrong sentences
  lastOccurrredAt: Date
  improvementRate: number     // decreasing = improving
  linkedLesson: string       // Grammar topic to review
}
```

**AI Detection Flow with Band Impact:**
```
User submits Writing
  → AI Grading processes
  → Extract grammar errors with band impact estimation
  → Categorize + Store in GrammarError
  → Link to Grammar lesson (band-prioritized)
  → Show band impact: "This error type could cost you 0.5 band"
  → Generate targeted practice
```

### Stage 3: Targeted Practice (Error-Focused with Band Context)

**Based on error patterns + band target:**

```javascript
// Example: User targeting Band 6.0, has 5 Subject-Verb errors
if (grammarError['SUBJECT_VERB'] > 3 && user.targetBand >= 6.0) {
  recommendPractice({
    topic: 'subject-verb-agreement',
    exercises: 5,
    focus: 'advanced: complex subjects with prepositional phrases',
    bandContext: 'Band 6.0 requires 90%+ accuracy on S-V agreement'
  });
}
```

**Practice Types with Band Context:**

| Practice | Duration | Band Relevance |
|----------|----------|----------------|
| Error correction | 10 min | Essential for 5.5+ |
| Sentence transformation | 15 min | Required for 6.0+ |
| Error detection in passage | 10 min | Critical for 6.5+ |
| Coherence analysis | 15 min | Essential for 7.0+ |

### Stage 4: Mastery Check (Output Integration with Band Scoring)

**Integration với Writing:**
- AI check for repeated errors → If improved, mark as "resolved"
- Each resolved error type = potential 0.25-0.5 band improvement

**Band Progress Tracking:**
```typescript
interface GrammarBandProgress {
  userId: string
  categories: {
    [category: string]: {
      attempts: number
      accuracyRate: number
      bandContribution: number  // How much this affects overall band
      isBlockingProgress: boolean  // TRUE if error prevents band upgrade
    }
  }
  overallGrammarBandEstimate: number
  blockingErrors: GrammarError[]  // Errors preventing band improvement
}
```

**Grammar + Vocabulary Combo (Four Strands Integration):**
- Passage reading: Highlight grammar structures + vocabulary
- User learns both simultaneously
- Output: Use new vocabulary in grammatically correct sentences

### Affective Filter in Grammar Learning (NEW)

**Krashen's Affective Filter Hypothesis applied:**

```
GRAMMAR ANXIETY REDUCTION STRATEGIES:
┌─────────────────────────────────────────────────────────────┐
│ 1. Progressive complexity: Start easy, build confidence     │
│ 2. Positive framing: "You've mastered 8 grammar points"      │
│ 3. Error as learning: "This error is common, let's fix"    │
│ 4. Low-pressure practice: Timed exercises only in mock tests │
│ 5. Celebrate progress: Grammar accuracy improvement = band   │
└─────────────────────────────────────────────────────────────┘
```

**UI Implementation:**
- Grammar exercises show: "You're improving! 80% accuracy → potential +0.25 band"
- If user struggles: "Let's try an easier topic first"
- Gamification: Grammar badges for mastering each category

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

### Daily Schedule with 4-Strand Balance (Research-Based)

**Nation's Four Strands Applied:**

| Strand | % Time | Activities | Example |
|--------|--------|-----------|---------|
| **Meaning-focused input** | 35% | Reading/Listening comprehension | IELTS reading passages, podcasts |
| **Meaning-focused output** | 35% | Speaking/Writing production | Speaking practice, essay writing |
| **Language-focused learning** | 20% | Vocabulary/Grammar drills | SRS flashcard, grammar exercises |
| **Fluency development** | 10% | Speed practice, review | Timed reading, shadowing |

**Daily Template (with 4-Strand Balance):**
```javascript
const standardDailySchedule = {
  morning: {
    time: "7:00 - 7:30",
    strand: "Language-focused",  // SRS for vocabulary
    activity: "Vocabulary Review (10 words, SM-2)",
    duration: 30,
    method: "Active recall flashcard"
  },
  afternoon: {
    time: "12:00 - 12:35",
    strand: "Meaning-focused input",  // 35 min = 35% of 100 min
    activity: "Reading OR Listening practice",
    duration: 35,
    method: "Passage with comprehension questions"
  },
  evening: {
    time: "19:00 - 19:35",
    strand: "Meaning-focused output",  // 35 min = 35% of 100 min
    activity: "Speaking OR Writing (rotate daily)",
    duration: 35,
    method: "Speaking: Part 1-3 practice | Writing: Task 1/2"
  },
  beforeSleep: {
    time: "22:00 - 22:15",
    strand: "Fluency development",
    activity: "Quick review / dictation",
    duration: 15,
    method: "Listen to today's vocabulary in context"
  }
};

// For users studying 2+ hours/day:
const extendedDailySchedule = {
  // Add extra skill practice session (45 min)
  afternoon2: {
    time: "15:00 - 15:45",
    strand: "Rotating skill focus",
    activity: "Weak skill practice OR full mock section",
    duration: 45
  }
};
```

**Rotation Pattern for Output (Meaning-focused output):**
```
Week pattern (prevent burnout from same skill):
  Mon: Writing Task 1
  Tue: Speaking Part 1-2
  Wed: Writing Task 2
  Thu: Speaking Part 3
  Fri: Writing (any) / Speaking (any) - user's choice
  Sat: Full Test (all 4 skills)
  Sun: Rest
```

### Weekly Integration with Metacognitive Prompts

| Day | Strand Focus | Metacognitive Prompt |
|-----|-------------|---------------------|
| Monday | Input heavy (Reading) | "What did you learn about reading strategies this week?" |
| Tuesday | Output heavy (Writing) | "How did you apply feedback from last writing?" |
| Wednesday | Language focus (Vocab/Grammar) | "Which new words will you use this week?" |
| Thursday | Output heavy (Speaking) | "What topic was most challenging in speaking?" |
| Friday | Fluency focus | "Review: What 3 things will you do differently?" |
| Saturday | Full test | "Analyze: Where did you lose points and why?" |
| Sunday | Rest + reflection | "Weekly Review: Progress toward band goal?" |

**Weekly Self-Reflection Template (Sunday):**
```
1. Band progress: Current avg vs target - am I on track?
2. Strongest skill this week: [skill] - why?
3. Weakest skill this week: [skill] - what to focus next week?
4. Vocabulary mastered: X new words
5. Grammar area improved: [topic]
6. Next week's priority: [specific goal]
```

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

### Phase 1: Subscription System + Foundation (2-3 weeks)
- [ ] Add Subscription model to schema
- [ ] Add AiUsageLog model
- [ ] Create subscription module (NestJS)
- [ ] Create payment module (Stripe/VNPay integration)
- [ ] Add subscription-gated guards to existing endpoints
- [ ] Frontend: upgrade modal, plan comparison page
- [ ] **NEW: VocabPlacementTest model + API** - determine user's vocabulary tier

### Phase 2: Research-Based Study Planner (2-3 weeks) [ENHANCED]
- [ ] Study plan templates database with 4-strand balance
- [ ] **Rule-based planner with i+1 difficulty adjustment**
- [ ] **Vocabulary tier system (Tier 1/2/3)**
- [ ] **Grammar placement assessment**
- [ ] **Metacognitive prompts (Zimmerman's SRL)**
- [ ] **Motivation tips based on SDT**
- [ ] Frontend: planner UI with self-regulation prompts
- [ ] Push notification for daily study reminders
- [ ] **Weekly self-reflection email (Premium)**

### Phase 3: Intelligent Vocabulary System (2 weeks) [ENHANCED]
- [ ] SM-2 algorithm implementation
- [ ] **High-frequency word priority (Tier 1/2/3)**
- [ ] **AI suggestions based on current tier**
- [ ] **Vocabulary placement test flow**
- [ ] Auto-progress to next tier at 80% mastery
- [ ] **Four strands integration for vocabulary**
- [ ] Vocabulary analytics dashboard

### Phase 4: Grammar Error Intelligence (2 weeks) [ENHANCED]
- [ ] **Grammar placement test**
- [ ] **Band-prioritized grammar topics**
- [ ] AI error detection with band impact estimation
- [ ] **Coherent error tracking system**
- [ ] Targeted practice generator
- [ ] **Grammar progress with band contribution**
- [ ] Affective filter anxiety reduction UI

### Phase 5: Question Analytics + Weakness Detection (1-2 weeks)
- [ ] Add QuestionTypePerformance tracking
- [ ] Implement rule-based weakness detection
- [ ] "Practice Weaknesses" mode UI
- [ ] Analytics dashboard improvements
- [ ] **Material difficulty recommendation system (i+1)**

### Phase 6: Cost Optimization (1 week)
- [ ] AI grading cache (hash-based dedup)
- [ ] Vocabulary suggestion cache
- [ ] AI usage monitoring dashboard (admin)
- [ ] Set up cost alerts

### Phase 7: Premium Features (2-3 weeks)
- [ ] Actionable feedback templates
- [ ] Micro-learning question banks
- [ ] Offline vocabulary sync
- [ ] Band score prediction model
- [ ] **Compare with Average feature (SDT relatedness)**
- [ ] **Weekly Report with AI-generated insights (Premium)**

---

## IMMEDIATE NEXT WEEK PLAN (Week of 2026-05-11)

### Research Foundation

**Lý thuyết nền tảng:**

1. **SM-2 Algorithm** (Woźniak, 1987):
   - Ebbinghaus Forgetting Curve: trí nhớ giảm theo hàm mũ nếu không ôn tập
   - Meta-analyses 2021-2024: SRS hiệu quả hơn massed practice ~60-80%
   - Công thức: Lần 1 = 1 ngày, Lần 2 = 6 ngày, sau = interval × easiness
   - Quality rating: 0-5 (3 = ngưỡng chuyển interval)

2. **Nation's Vocabulary Acquisition** (2013):
   - 5,000 word families = 95% reading coverage (ngưỡng cho IELTS)
   - 3,000 word families = 90% coverage (cơ bản)
   - Coxhead's AWL (570 words) = ~10% bài IELTS, cần cho band 6.5+

3. **Band Improvement Research** (British Council, IELTS.org):
   - <5.5: max 0.5 band/tháng
   - 5.5-7.0: max 0.3 band/tháng
   - >7.0: max 0.2 band/tháng

4. **Nation's Four Strands** (2001):
   - 35% input (đọc/nghe)
   - 35% output (viết/nói)
   - 20% language-focused (vocab/grammar)
   - 10% fluency

### Day 1-2: Vocabulary Model với SM-2 + Tier System

**Tasks:**
```typescript
// 1. Thêm fields vào Vocabulary model (schema.prisma)
model Vocabulary {
  // ... existing fields ...
  timesReviewed: Int @default(0)
  easinessFactor: Float @default(2.5)
  interval: Int @default(1)  // days
  nextReviewAt: DateTime?
  tier: Int @default(1)  // 1: general, 2: AWL, 3: specialized
  status: String @default("new")  // new|learning|review|mastered
}

// 2. SM-2 Algorithm trong service
function sm2(quality: number, repetitions: number, easiness: number, interval: number) {
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

// 3. APIs cần tạo:
// GET /vocabulary/due-review?userId=xxx
// POST /vocabulary/review {vocabId, quality}
```

**API Example:**
```typescript
// GET /vocabulary/due-review
// Response: [{id, word, meaning, nextReviewAt, status}]

// POST /vocabulary/review
// Body: {vocabId: string, quality: 0-5}
// Response: {nextReviewAt, interval, status}
```

### Day 3-4: Vocabulary Tier Progression Logic

**Tasks:**
```typescript
// 1. Tier Recommendation
function getRecommendedTier(currentBand: number): 1 | 2 | 3 {
  if (currentBand < 5.5) return 1;  // 3,000 words (90% coverage)
  if (currentBand < 6.5) return 2;  // AWL 570 words (academic)
  return 3;  // Specialized vocabulary
}

// 2. Tier Progression Check (80% mastery)
function checkTierProgression(userId: string): {
  shouldProgress: boolean,
  currentTier: number,
  masteredCount: number,
  totalInTier: number
}

// 3. Word suggestion by tier
function getNextWordForUser(userId: string): VocabWord {
  const tier = getRecommendedTier(getUserBand(userId));
  const knownWords = getUserLearnedWords(userId);
  return getWordsFromTier(tier)
    .filter(w => !knownWords.includes(w.id))
    .sortByFrequency()[0];
}
```

**Vocabulary Priority Tiers:**
```
TIER 1 (Band < 5.5): 3,000 high-frequency words → 90% coverage
TIER 2 (Band 5.5-6.5): Coxhead's AWL 570 words → academic texts
TIER 3 (Band 6.5+): Specialized/technical vocabulary
```

### Day 5: Study Planner với Band Gap Algorithm

**Tasks:**
```typescript
// 1. Calculate Realistic Target
function calculateRealisticTarget(currentBand: number, daysUntilExam: number): {
  maxPossibleGain: number,
  isRealistic: boolean,
  warning?: string,
  adjustedTarget?: number
}

// Band improvement rates from research:
const maxMonthlyRate = currentBand < 5.5 ? 0.5
                     : currentBand < 7.0 ? 0.3
                     : 0.2;

const maxPossibleGain = maxMonthlyRate * (daysUntilExam / 30);

// 2. Daily Schedule Generator (4-Strand Balance)
function generateDailyPlan(
  targetBand: number,
  currentBand: number,
  dailyMinutes: number
): DailySchedule {
  return {
    input: Math.round(dailyMinutes * 0.35),   // Reading/Listening
    output: Math.round(dailyMinutes * 0.35),  // Writing/Speaking
    languageFocus: Math.round(dailyMinutes * 0.20),  // Vocab/Grammar
    fluency: Math.round(dailyMinutes * 0.10)  // Review
  };
}

// 3. Warning Examples:
// - "5.0 → 8.0 trong 30 ngày: max possible gain = 0.3 band, suggest 5.5"
// - "Bạn có 90 ngày, với band 5.0 target 6.5 là realistic (0.5/month possible)"
```

### Day 6: AI Grammar Error Extraction

**Tasks:**
```typescript
// 1. Grammar Error Model (schema.prisma)
model GrammarError {
  id: String @id
  userId: String
  category: String  // VERB_TENSE|SUBJECT_VERB|ARTICLE|WORD_ORDER|PREPOSITION|COHESIVE
  example: String  // user's wrong sentence
  correction: String  // suggested fix
  bandImpact: Float  // -0.25 to -0.5
  linkedLesson: String  // grammar topic to review
  createdAt: DateTime
}

// 2. AI Response Parser
function extractGrammarErrors(aiResponse: string): GrammarError[] {
  // Parse từ AI grading response
  // Extract: category, example, correction
  // Estimate band impact per error type
}

// 3. Error Categories with Band Impact:
const errorBandImpact = {
  VERB_TENSE: -0.5,         // HIGH priority
  SUBJECT_VERB: -0.5,
  WORD_ORDER: -0.5,
  COHESIVE_DEVICE: -0.5,    // Critical for coherence
  ARTICLE: -0.25,
  PREPOSITION: -0.25,
  SENTENCE_FRAGMENT: -0.25
};

// 4. Band-Prioritized Grammar Topics:
const grammarTopics = [
  // Tier 1: Band 5.0-5.5
  { topic: 'Verb Tenses', bandTarget: 5.0 },
  { topic: 'Subject-Verb Agreement', bandTarget: 5.0 },
  // Tier 2: Band 5.5-6.5
  { topic: 'Conditional', bandTarget: 5.5 },
  { topic: 'Passive Voice', bandTarget: 5.5 },
  { topic: 'Relative Clauses', bandTarget: 5.5 },
  // Tier 3: Band 6.5+
  { topic: 'Cohesive Devices', bandTarget: 6.5 },
  { topic: 'Advanced Passives', bandTarget: 7.0 }
];
```

### Day 7: Weak Areas Detection + Recommendation

**Tasks:**
```typescript
// 1. Weak Skill Detection
function getWeakSkills(userId: string): SkillWeakness[] {
  const performances = await getQuestionTypePerformances(userId);
  // Group by skill, calculate avg score
  // Sort by avg ascending → weakest first
  return performances
    .groupBy(p => p.skillType)
    .map(g => ({
      skill: g.key,
      avgScore: g.values.avg(s => s.score),
      questionTypes: g.values.map(v => v.questionType)
    }))
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 2);  // Top 2 weakest
}

// 2. Practice Weaknesses Mode
function generateWeakPractice(userId: string): PracticeSet {
  const weakSkills = getWeakSkills(userId);
  // Rule-based: generate practice từ existing question bank
  // Không cần AI - dùng question type đã có trong system
  return {
    focus: weakSkills.map(s => s.skill).join(', '),
    questions: getQuestionsBySkill(weakSkills[0].skill)
               .filter(q => q.difficulty <= getUserBand(userId))
               .slice(0, 10)
  };
}

// 3. Metacognitive Prompts (Zimmerman's SRL)
const selfReflectionPrompts = [
  "Sau mỗi bài practice: 'Mình đã hiểu được bao nhiêu % nội dung?'",
  "Cuối tuần: 'Tuần này mình tiến bộ gì? Cần cải thiện gì?'",
  "Khi gặp khó khăn: 'Mình có đang học đúng cách không?'"
];
```

### Week Summary

| Day | Task | Research Base | Output |
|-----|------|---------------|--------|
| 1-2 | Vocab SM-2 + Tier model | Woźniak SM-2, Nation lexical coverage | Vocab model, SM-2 service, due-review API |
| 3-4 | Vocab tier progression | Nation Tier system (90%/95% coverage) | tier recommendation, progression check |
| 5 | Study Planner algorithm | British Council band rates, 4 Strands | realistic target, daily schedule generator |
| 6 | Grammar error AI extraction | Band impact categories, Krashen order | GrammarError model, AI parser |
| 7 | Weak areas detection | Zimmerman's SRL, self-evaluation | weak skill detection, practice recommendation |

---

## Verification Plan

### Research-Based Validation Checklist

**Vocabulary System:**
- [ ] SM-2 intervals correctly calculated (verify with known test cases)
- [ ] Tier progression at 80% mastery threshold works
- [ ] High-frequency words prioritized over low-frequency

**Study Planner:**
- [ ] 4-strand balance (35/35/20/10) correctly distributed
- [ ] i+1 difficulty adjustment triggers at correct thresholds (60%/85%)
- [ ] Unrealistic target warnings appear for impossible band gaps
- [ ] Metacognitive prompts appear at correct times

**Grammar System:**
- [ ] Grammar placement test correctly determines starting point
- [ ] Error detection categorizes correctly
- [ ] Band impact estimation matches IELTS rubric
- [ ] Targeted practice recommendations are relevant

**General:**
- [ ] Test subscription flow: Free → Basic upgrade
- [ ] Verify AI usage logging accurate
- [ ] Verify weakness detection matches manual review
- [ ] Verify cost tracking works (Stripe webhooks)
- [ ] Load test: AI queue processing capacity

---

## ALIGNMENT SUMMARY: Research vs Implementation

| Research Finding | SpecificPlan.md Implementation | Status |
|-----------------|---------------------------------|--------|
| **SM-2 Algorithm** (Woźniak) | SM-2 formula in vocabulary system | ✅ Implemented |
| **0.5 band/month max** (British Council) | Band improvement algorithm rules | ✅ Implemented |
| **Nation's 4 Strands** | Daily schedule with 35/35/20/10 balance | ✅ Implemented |
| **Krashen's i+1** | Material difficulty recommendation system | ✅ Added |
| **Zimmerman's SRL** | Metacognitive prompts in planner | ✅ Added |
| **Locke & Latham SMART Goals** | Target band with timeline algorithm | ✅ Implemented |
| **Deci & Ryan SDT** | Motivation tips, gamification for competence | ✅ Added |
| **Lexical Coverage 95%** (Nation) | 5,000 word families target | ✅ Added |
| **Coxhead's AWL** | Tier 2 vocabulary for band 5.5+ | ✅ Added |
| **Grammar Natural Order** (Krashen) | Band-prioritized grammar topics | ✅ Added |

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

### Research-Based Band Improvement Rules (Verified)
- Max 0.5 band/month for beginners (<5.5)
- Max 0.3 band/month for intermediate (5.5-7.0)
- Max 0.2 band/month for advanced (>7.0)
- **Always warn user when target is unrealistic** and suggest alternatives

### Research-Based Study Balance
- 35% Meaning-focused input (Reading/Listening)
- 35% Meaning-focused output (Speaking/Writing)
- 20% Language-focused (Vocabulary/Grammar)
- 10% Fluency development

### Research-Based Foundation

#### Krashen's Input Hypothesis (i+1) Applied to IELTS

**Nguồn:** Krashen, S.D. (1982). *Principles and Practice in Second Language Acquisition*.

**Principle:** Language acquisition occurs when learners receive comprehensible input slightly beyond their current level (i+1).

**Implementation in Study Planner:**

| User Band | Recommended Input Level | Examples |
|-----------|------------------------|----------|
| 4.0-5.0 | Simplified with visual support | BBC Learning English, IELTS Foundation materials |
| 5.0-6.0 | Standard with some unknown words | Native materials with dictionary support |
| 6.0-7.0 | Near-native, academic context | The Economist, academic papers, native podcasts |
| 7.0+ | Fully native materials | News, documentaries, academic texts |

**Auto-adjustment logic:**
- If user scores <60% on a skill's practice → suggest easier materials
- If user scores >85% consistently → prompt to increase difficulty
- Material difficulty tracked via: avg unknown words per passage, speed metrics

#### Nation's Four Strands Applied to Daily Schedule

**Nguồn:** Nation, I.S.P. (2001). *Learning Vocabulary in Another Language*.

**Four strands that must be balanced:**

1. **Meaning-focused input** (Reading/Listening) - 35% of study time
2. **Meaning-focused output** (Speaking/Writing) - 35% of study time
3. **Language-focused learning** (Vocabulary/Grammar drills) - 20% of study time
4. **Fluency development** (Speed practice, review) - 10% of study time

**Daily schedule must include all 4 strands:**

```
STUDY BALANCE ALGORITHM:
dailyMinutes = user-selected study time

inputTime = dailyMinutes × 0.35  // Reading/Listening
outputTime = dailyMinutes × 0.35  // Speaking/Writing
languageFocusTime = dailyMinutes × 0.20  // Vocab/Grammar
fluencyTime = dailyMinutes × 0.10  // Speed review

Rotate output activities: W1 → S1 → W2 → S2 pattern
Never skip input OR output for more than 2 days
```

#### Self-Determination Theory (Deci & Ryan) Applied to Engagement

**Nguồn:** Deci & Ryan (1985). *Intrinsic Motivation and Self-Determination*.

**Three basic needs to satisfy:**

| Need | Implementation | Feature |
|------|----------------|---------|
| **Autonomy** | User chooses what to study, when | Flexible schedule, topic selection |
| **Competence** | Clear progress feedback | Band score tracking, streak rewards |
| **Relatedness** | Social connection | Forum, compare with average |

**Gamification based on SDT:**
- XP system designed for mastery (competence), not competition
- Streak for consistency, not intensity
- Leaderboards are optional, not mandatory (preserve autonomy)

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