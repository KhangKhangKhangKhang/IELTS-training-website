# QuestionType-based Practice System Plan

**Date:** 2026-05-28  
**Status:** Draft - Lưu lại để chỉnh sửa sau

---

## 1. Database Schema Changes

### 1.1 Question Model - Thêm difficulty

```prisma
model Question {
  idQuestion       String      @id @default(uuid())
  idQuestionGroup  String
  questionType     QuestionType
  content          String
  difficulty       Int         @default(1)  // 1-5 scale (1=easy, 5=hard)
  estimatedMinutes Int         @default(2)  // Thời gian ước tính làm câu này
  
  questionGroup    QuestionGroup @relation(fields: [idQuestionGroup], references: [idQuestionGroup])
}
```

### 1.2 UserQuestionTypeHistory - Track chi tiết hơn

```prisma
model UserQuestionTypeHistory {
  id              String   @id @default(uuid())
  idUser          String
  skillType       String   // "READING" | "LISTENING"
  questionType    String   // QuestionType enum
  partPracticed   String?  // "PART1" | "PART2" | null
  testId          String?  // null nếu là practice
  
  totalAttempts   Int      @default(0)
  correctCount    Int      @default(0)
  avgTimeSeconds  Int      @default(0)
  
  lastAttemptAt   DateTime?
  
  user            User     @relation(fields: [idUser], references: [idUser])
  
  @@unique([idUser, skillType, questionType, partPracticed, testId])
}
```

---

## 2. API Changes

### 2.1 Get Tests với Filter

```typescript
// GET /test/practice-filter
{
  skillType?: "READING" | "LISTENING" | "WRITING" | "SPEAKING"
  questionTypes?: string[]  // ["TRUE_FALSE_NOT_GIVEN", "FILL_IN_BLANK"]
  difficulty?: number       // 1-5
  part?: string            // "PART1" | "PART2"
  limit?: number           // Số câu muốn practice
}

// Response
{
  tests: [
    {
      idTest: "...",
      title: "Listening PART1 - SHORT_ANSWER Practice",
      questionTypes: ["SHORT_ANSWER", "FILL_IN_BLANK"],
      totalQuestions: 10,
      difficulty: 2,
      estimatedMinutes: 20
    }
  ]
}
```

### 2.2 Submit Practice với QuestionType

```typescript
// POST /user-test-result/submit-practice
{
  idUser: "...",
  idTest: "...",
  practiceMode: true,
  answers: [
    { idQuestion: "q1", questionType: "SHORT_ANSWER", correct: true, timeSeconds: 45 },
    { idQuestion: "q2", questionType: "FILL_IN_BLANK", correct: false, timeSeconds: 120 }
  ],
  partialInfo: {
    partPracticed: "PART1",
    questionTypes: ["SHORT_ANSWER", "FILL_IN_BLANK"]
  }
}
```

---

## 3. Backend Logic

### 3.1 Filter Questions by QuestionType

```typescript
async getQuestionsByType(
  skillType: string,
  questionTypes: string[],
  difficulty: number,
  limit: number
) {
  const questions = await this.db.question.findMany({
    where: {
      questionGroup: {
        part: {
          test: { testType: skillType }
        },
        questionType: { in: questionTypes }
      },
      difficulty: difficulty ? { lte: difficulty } : undefined
    },
    take: limit,
    orderBy: { difficulty: 'asc' }
  });
  
  return questions;
}
```

### 3.2 Band Calculation cho Partial + QuestionType

```typescript
async calculateBandForPartial(
  results: { questionType: string, correct: boolean, difficulty: number }[]
) {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  for (const r of results) {
    const weight = r.difficulty;  // 1-5
    const score = r.correct ? 1 : 0;
    totalWeightedScore += score * weight;
    totalWeight += weight;
  }
  
  const percentage = (totalWeightedScore / totalWeight) * 100;
  return this.percentageToBand(percentage);
}
```

### 3.3 Recommendation Engine

```typescript
async getQuestionTypeRecommendation(idUser: string) {
  const weaknesses = await this.db.userQuestionTypeHistory.findMany({
    where: { idUser, errorRate: { gte: 0.3 } },
    orderBy: { errorRate: 'desc' },
    take: 5
  });
  
  const userLevel = await this.getUserLevel(idUser);
  
  return weaknesses.map(w => ({
    questionType: w.questionType,
    errorRate: w.errorRate,
    suggestedDifficulty: this.getNextDifficulty(w, userLevel),
    practiceCount: w.totalAttempts,
    reason: this.generateReason(w)
  }));
}
```

---

## 4. Frontend Changes

### 4.1 Practice Filter UI

```jsx
// /doTest Page
<div className="practice-filters">
  <select onChange={(e) => setSkillType(e.target.value)}>
    <option value="">All Skills</option>
    <option value="READING">Reading</option>
    <option value="LISTENING">Listening</option>
  </select>
  
  <select onChange={(e) => setQuestionTypes(e.target.value)}>
    <option value="">All Question Types</option>
    <option value="TRUE_FALSE_NOT_GIVEN">True/False/Not Given</option>
    <option value="FILL_IN_BLANK">Fill in Blank</option>
    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
  </select>
  
  <select onChange={(e) => setDifficulty(e.target.value)}>
    <option value="">Any Difficulty</option>
    <option value="1-2">Easy</option>
    <option value="2-3">Medium</option>
    <option value="4-5">Hard</option>
  </select>
  
  <input 
    type="number" 
    placeholder="Số câu (10, 20, 30)"
    value={questionCount}
    onChange={(e) => setQuestionCount(e.target.value)}
  />
  
  <button onClick={startPractice}>Bắt đầu Practice</button>
</div>
```

### 4.2 Practice Mode Indicator

```jsx
{isPracticeMode && (
  <div className="practice-banner">
    <span>🎯 Practice Mode: {questionTypes.join(", ")}</span>
    <span>{currentIndex + 1}/{totalQuestions} câu</span>
    <span>Độ khó: {difficulty}/5</span>
  </div>
)}
```

### 4.3 Weakness Dashboard

```jsx
<div className="weakness-report">
  <h3>📊 Question Types cần cải thiện</h3>
  
  {weakQuestionTypes.map(w => (
    <div key={w.questionType} className="weakness-item">
      <span>{w.questionType}</span>
      <span>Error: {(w.errorRate * 100).toFixed(0)}%</span>
      <span>Attempts: {w.totalAttempts}</span>
      <button onClick={() => practiceQuestionType(w.questionType)}>
        Luyện ngay
      </button>
    </div>
  ))}
</div>
```

---

## 5. Data Flow

```
1. User vào /doTest
   ↓
2. Chọn filter (READING + TRUE_FALSE_NOT_GIVEN + 20 câu)
   ↓
3. Frontend gọi API: GET /test/practice-filter?skillType=READING&questionTypes=TRUE_FALSE_NOT_GIVEN&limit=20
   ↓
4. Backend query questions + tạo practice test
   ↓
5. User làm bài → Submit
   ↓
6. Backend:
   a. Grade answers (bình thường)
   b. Update band score (percentage-based)
   c. Update QuestionTypePerformance (cho từng questionType)
   d. Update UserQuestionTypeHistory (chi tiết)
   ↓
7. Frontend hiện kết quả + weakness suggestions
```

---

## 6. Complexity Matrix

| Feature | Code Change | Test Cases | Risk | Notes |
|---------|-------------|------------|------|-------|
| DB: Add difficulty field | Thấp | 2-3 | Thấp | Migration đơn giản |
| DB: New history table | Trung bình | 5-8 | Trung bình | Cần unique constraint |
| API: Practice filter | Trung bình | 8-10 | Trung bình | Nhiều edge cases |
| Band calculation new | Cao | 10-15 | Cao | Có thể break existing |
| Recommendation engine | Cao | 15-20 | Cao | Thuật toán phức tạp |
| Frontend: Filter UI | Trung bình | 5-8 | Thấp | Standard form |
| Frontend: Practice mode | Trung bình | 10-12 | Trung bình | State management |

**Total Effort:** ~15-20 days

---

## 7. Open Questions

1. **Difficulty field** - Ai sẽ set difficulty? (Admin? AI? Default?)
2. **Question count** - Giới hạn practice tối đa bao nhiêu câu?
3. **Practice có tính XP không?**
4. **Partial test vs full test** - Khi nào là partial, khi nào là full?
5. **Recommendation engine** - Dựa trên error rate hay band gap?