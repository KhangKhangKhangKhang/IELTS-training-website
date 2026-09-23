# Vocabulary Refactor — Content/State Split

> **Priority:** 🔴 CRITICAL
> **Status:** Pending · lên kế hoạch refactor lớn
> **Severity:** Design smell + privacy leak + broken convention + storage waste
> **Effort ước tính:** ~2-3 ngày (BE schema + migration + service refactor + FE update)
> **Lý do CRITICAL:** đây là structural issue ảnh hưởng correctness, performance, và extensibility. Sửa sớm trước khi data tích lũy thêm.

---

## 1. Vấn đề hiện tại

### Schema issue

`Vocabulary` model BẮT BUỘC `idUser` (NOT NULL, không default). SM-2 state NẰM CHUNG row với content:

```prisma
// prisma/schema.prisma:376-420
model Vocabulary {
  idVocab       String  @id @default(uuid())
  word          String
  meaning       String
  // ...static content...
  idUser        String  // ← REQUIRED
  // SM-2 state (per-user, không nên ở đây):
  timesReviewed    Int       @default(0)
  easinessFactor   Float     @default(2.5)
  interval         Int       @default(1)
  nextReviewAt     DateTime?
  status           String    @default("new")
  tier             Int       @default(1)
  user             User      @relation(...)
  @@unique([idUser, word])
}
```

**Hệ quả:**
- Mỗi user có 1 bản copy riêng của từ vựng khi tương tác lần đầu
- N user × N copy cho cùng 1 từ → waste storage
- Static content + dynamic state lẫn lộn → khó maintain, khó scale

### 2 quy ước xung đột cho "system vocab"

| Nơi | Convention | Status |
|---|---|---|
| `seed-cambridge-19-reviewed.js:11685` | real UUID `system@ielts-app.local` | ✓ OK |
| `seed-cambridge-20-reviewed.js:4154` | real UUID, same | ✓ OK |
| `vocabulary.service.ts:702, 718, 857` | empty-string `''` literal | ✗ BROKEN |

**Hệ quả:** `getDailySessionWords` query `idUser: ''` → 0 rows. Cambridge seed insert với real UUID → 2 hệ thống không gặp nhau.

### Privacy leak

`getDailyVocab` (service.ts:534-584):
- Comment line 532: `"idUser IS NULL (system vocab)"`
- Query line 551-557: **KHÔNG filter idUser**
- Trả rows bất kỳ tier-1/2, kể cả user-owned private vocab của người khác

→ User A xem được daily vocab của User B nếu cùng tier.

### Per-user cloning logic

```ts
// vocabulary.service.ts:617-633 (completeDailyVocab)
// vocabulary.service.ts:933-950 (saveToCollection)
// → clone word vào user-owned row
```

Mỗi user tương tác lần đầu với system vocab → tạo row mới. N copy cho cùng word.

---

## 2. Control case: Grammar (thiết kế đúng)

```prisma
// Grammar content: GLOBAL
model Grammar {
  idGrammar   String @id @default(uuid())
  title       String
  explanation String
  // ...
  // KHÔNG có idUser
}

// Per-user state: RIÊNG
model UserGrammarProficiency {
  idUser    String
  idGrammar String
  proficiency String
  // ...
  @@id([idUser, idGrammar])
}

model UserGrammarExerciseSR {
  idUser     String
  idExercise String
  interval   Int
  easeFactor Float
  // ...
  @@unique([idUser, idExercise])
}
```

**Pattern:** shared content + per-user state tách riêng → không duplicate, dễ query, dễ cache.

---

## 3. Đề xuất refactor

### Bước 1: Tách schema

```prisma
// Vocabulary: GLOBAL, không idUser
model Vocabulary {
  idVocab        String    @id @default(uuid())
  word           String    @unique           // global unique
  phonetic       String?
  meaning        String
  example        String?
  VocabType      VocabType
  level          Level?
  idTopic        String?
  frequencyRank  Int?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  topic          Topic?
  userStates     UserVocabularyState[]
  // Bỏ: idUser, timesReviewed, easinessFactor, interval, nextReviewAt,
  //      status, tier (chuyển sang UserVocabularyState), correctStreak, lastReviewed, xp
}

// MỚI: per-user SM-2 state
model UserVocabularyState {
  idUser         String
  idVocab        String
  timesReviewed  Int       @default(0)
  correctStreak  Int       @default(0)
  lastReviewed   DateTime?
  xp             Int       @default(0)
  // SM-2:
  easinessFactor Float     @default(2.5)
  interval       Int       @default(1)
  nextReviewAt   DateTime?
  status         String    @default("new")
  tier           Int       @default(1)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  user           User         @relation(fields: [idUser], references: [idUser], onDelete: Cascade)
  vocabulary     Vocabulary   @relation(fields: [idVocab], references: [idVocab], onDelete: Cascade)
  @@id([idUser, idVocab])
  @@index([idUser, nextReviewAt])
  @@index([idUser, status])
}
```

### Bước 2: Migration script

```ts
// scripts/migrate-vocab-to-state-split.ts
async function migrate() {
  // 1. Group by word, dedupe content (giữ row có createdAt sớm nhất làm "global canonical")
  const allVocab = await prisma.vocabulary.findMany();
  const byWord = new Map<string, typeof allVocab>();
  for (const v of allVocab) byWord.set(v.word, [...(byWord.get(v.word) ?? []), v]);

  for (const [word, rows] of byWord) {
    if (rows.length === 1) continue; // system row, không cần xử lý

    // Pick canonical: cũ nhất
    const canonical = rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

    // Update non-canonical: chuyển SM-2 state sang UserVocabularyState, sau đó xóa row
    for (const row of rows) {
      if (row.idVocab === canonical.idVocab) continue;
      await prisma.userVocabularyState.create({
        data: {
          idUser: row.idUser,
          idVocab: canonical.idVocab,
          timesReviewed: row.timesReviewed,
          correctStreak: row.correctStreak,
          lastReviewed: row.lastReviewed,
          xp: row.xp,
          easinessFactor: row.easinessFactor,
          interval: row.interval,
          nextReviewAt: row.nextReviewAt,
          status: row.status,
          tier: row.tier,
        }
      });
      await prisma.vocabulary.delete({ where: { idVocab: row.idVocab } });
    }

    // Canonical: cập nhật content (giữ ý nghĩa từ 1 user, vd: user tạo từ riêng)
    // Nếu canonical thuộc system user → giữ nguyên content
    // Nếu canonical thuộc regular user → cân nhắc: nội dung này nên globalize hay giữ per-user?
    //    → Default: globalize (vì content tĩnh), nhưng flag TODO cho user-created vocab
  }
}
```

### Bước 3: Service refactor

```ts
// vocabulary.service.ts

// getDailyVocab — query global pool, left join user state
async getDailyVocab(idUser, limit = 10) {
  const preferredTiers = [1, 2];
  const vocab = await this.db.vocabulary.findMany({
    where: { tier: { in: preferredTiers } },
    include: {
      userStates: {
        where: { idUser },
        select: { status: true, nextReviewAt: true },
      },
    },
    take: limit,
  });
  // Filter: chưa master hoặc đến hạn review
  return vocab.filter(v => {
    const state = v.userStates[0];
    return !state || state.status !== 'mastered';
  });
}

// completeDailyVocab — chỉ update state, không clone content
async completeDailyVocab(idUser, submissions) {
  for (const sub of submissions) {
    await this.db.userVocabularyState.upsert({
      where: { idUser_idVocab: { idUser, idVocab: sub.vocabId } },
      create: {
        idUser,
        idVocab: sub.vocabId,
        timesReviewed: 1,
        lastReviewed: new Date(),
        // initial SM-2 values
      },
      update: {
        timesReviewed: { increment: 1 },
        lastReviewed: new Date(),
        // updated SM-2 values
      },
    });
  }
}
```

### Bước 4: FE update

- API response shape đổi (vocab object có nested `userState` thay vì flat)
- ~10 file đụng: `apiVocab.js` (28 occurrences) + 5-10 page dùng vocab
- Effort: ~3-4h

---

## 4. Effort ước tính

| Hạng | Effort |
|---|---|
| Schema redesign + migration script | ~3-4h (cẩn thậc data loss) |
| Service refactor (~15 method) | ~4-6h |
| FE update (~10 file) | ~3-4h |
| Test + verify (dev + staging) | ~2h |
| **Tổng** | **~2-3 ngày** |

## 5. Rủi ro

1. **Data migration**: nếu users đã có N copy → merge state phức tạp. Test kỹ trên data thật trước khi apply prod.
2. **Breaking API change**: FE phải đổi. Deploy order: BE trước, FE sau trong vài phút.
3. **Cambridge seed cleanup**: scripts dùng `system@ielts-app.local` UUID. Sau refactor, có thể giữ nguyên (vẫn cần 1 system user để audit ai tạo row khi cần), hoặc đổi sang `idUser: null` (cần schema nullable).
4. **User-created vocab**: hiện tại user có thể tự tạo vocab riêng (createVocabulary với idUser của họ). Sau refactor, vocab là global → user-created content bị globalize. Có thể:
   - Option A: chấp nhận, mọi user-created vocab thành global (có thể có abuse)
   - Option B: tách `PrivateVocabulary` model cho user-created
5. **Scope creep**: refactor này lớn. Nên tách thành nhiều PR nhỏ nếu có thể.

## 6. Quick-win trước khi refactor (option nhỏ)

Nếu chưa sẵn sàng refactor lớn, fix 3 issue trên bằng ~15 phút:

1. **Convention**: thống nhất `SYSTEM_VOCAB_USER_ID` constant, replace `idUser: ''` literal
2. **Privacy leak**: thêm `idUser: SYSTEM_VOCAB_USER_ID` filter vào `getDailyVocab`
3. **Schema alignment**: Cambridge seed giữ nguyên (đã đúng convention)

Effort ~15 min, không migration, không breaking change. Có thể làm trước khi refactor lớn.

## 7. Files liên quan

- `/home/garan/code/doan1/ielts_training_app/prisma/schema.prisma:376-420` — Vocabulary model
- `/home/garan/code/doan1/ielts_training_app/src/module/vocabulary/vocabulary.service.ts:534-693` — daily vocab flow
- `/home/garan/code/doan1/ielts_training_app/seed-cambridge-19-reviewed.js:11646-11696` — seed convention
- `/home/garan/code/doan1/ielts_training_app/seed-cambridge-20-reviewed.js:4134-4157` — seed convention
- `/home/garan/code/doan1/IELTS-training-website/src/services/apiVocab.js` — 28 occurrences

## 8. Out of scope

- Auth/ownership fix — đã có doc riêng (`AUTH_OWNERSHIP_TRUST_FIX.md`, priority LOW)
- study-planner bug #1 — fixed, pending push
- study-planner bug #2-12 — defer
