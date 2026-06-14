# Speaking test screen redesign — tab bar + Part 1/3 layout

## Problem

`IELTSSpeakingTestScreen.jsx` (462 dòng) có 3 vấn đề UX:

1. **Tab bar không hoạt động** — `PhasePill` ở top (line 202-206) chỉ hiển thị visual, không click được. User muốn tab thật để preview UI của mỗi part trong quá trình làm đề.
2. **UI Part 1 & Part 3 chưa có** — code chỉ render Part 1 (khi navigate tới) và Part 3 (cuối), nhưng user muốn layout chung cho cả 2 để consistent.
3. **AI Examiner card giả** (line 221-241) — aside trái render avatar "Mark" với câu hỏi hiện tại. Đây là mock không có API, gây hiểu nhầm (giống như cleanup Plan A ngày 2026-06-13).

User quote: *"hiện tại chưa có UI tab 1 và tab 3, tôi muốn khi làm đề theo thời gian tới phần nào thì part đó được toggle và đồng thời hiển thị UI của part đó"*

## Goal

- Tab bar (Part 1 / Part 2 / Part 3) **click được**, có 4 trạng thái: `done` / `active` / `available` / `locked`
- Part 2 tab phải vượt qua (unlock) trước khi Part 3 mở khóa
- Layout Part 1 + Part 3 thống nhất, dùng chung component `QuestionPartScreen`
- Thay AI Examiner card bằng `QuestionNavigator` (aside trái)
- Tạo mockup HTML/CSS + chạy live server để user review trước khi code

## Approach (Hướng C — đã chọn)

- Click 3 tab tự do, tab sau có icon 🔒 cho đến khi tab trước hoàn thành
- Hoàn thành = `audioBlobs[partN] !== null` (đã ghi âm xong)
- Click tab locked → render UI với grayscale + tooltip "Hoàn thành Part Y trước" (cho phép preview mà không ghi âm)

## Scope

### IN scope
1. **Tab bar refactor**: thêm `activeTab` state ('part1' | 'part2' | 'part3'), `PhasePill` thành `PartTab` click được với 4 trạng thái
2. **`QuestionNavigator`** component mới: aside trái, list chip câu hỏi của part active, click để nhảy câu
3. **`QuestionPartScreen`** component mới: layout chung Part 1 + Part 3 (câu hỏi + mic card + footer nav)
4. **Bỏ AI Examiner card** ở aside trái
5. **Mockup HTML** standalone + Python http.server để user review

### OUT of scope
- Thay đổi recording flow (MediaRecorder, upload audio) — giữ nguyên
- Refactor `cuecard-prep` / `cuecard-talk` UI ở Part 2 — chỉ làm tab bar + aside
- Backend changes
- Plan B (highlight + dict lookup) — đã để riêng

## Design

### Section 1 — Tab bar (`PartTab`)

Trạng thái tab:
- `done`: nền xanh lá (`#d1fae5`), border `#10b981`, ✓ icon
- `active`: nền xanh dương (`#eef2ff`), border `#6366f1`, shadow
- `available`: nền trắng, border xám, click được
- `locked`: grayscale 50%, 🔒 icon, click chỉ hiện tooltip

Unlock logic:
- Part 1: luôn mở khóa
- Part 2: unlock khi `audioBlobs.part1 !== null` HOẶC `part1Questions.length === 0`
- Part 3: unlock khi `audioBlobs.part2 !== null`

State mới:
- `activeTab` ('part1' | 'part2' | 'part3') — default 'part1'
- Giữ `phase` cho Part 2 sub-state (`cuecard-prep` / `cuecard-talk`)

Component: `PartTab({ done, active, available, locked, label, sub, num, onClick })`

### Section 2 — QuestionPartScreen (Part 1 + Part 3)

Layout center card:
```
┌────────────────────────────────────────────────────────────┐
│ Part 1 · Câu 1/5                              [● REC 0:23] │ ← header
├────────────────────────────────────────────────────────────┤
│                                                            │
│   What do you usually do in your free time?                │ ← câu hỏi to
│                                                            │
│   ┌──────────────────────────────────────────────────┐   │
│   │ LiveWave (48 bars)                                │   │
│   │                                                  │   │
│   │  Mic input          [ 🎙 ]           Duration   │   │ ← mic row
│   │  ● Đang ghi                          0:23       │   │
│   └──────────────────────────────────────────────────┘   │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  [← Câu trước]   ✓ Đã ghi âm          [Câu tiếp →]       │ ← footer nav
└────────────────────────────────────────────────────────────┘
```

Props:
- `partNumber` (1 | 3)
- `partLabel` ('Introduction' | 'Discussion')
- `questions`: array of `{id, question}`
- `currentIdx`: number
- `audioKey` ('part1' | 'part3')
- `onPrev` / `onNext` / `onJump(idx)` / `onComplete`
- `audioBlobs[audioKey]`
- `recording` / `recSeconds` / `startRecording` / `stopRecording`

Khác biệt Part 1 vs Part 3: chỉ `partNumber` + `partLabel`. Layout giống 100%.

### Section 3 — QuestionNavigator (aside trái)

Thay thế AI Examiner card. Render:
- Title: "📋 Câu hỏi · Part 1" (đổi theo `activeTab`)
- List chip dọc, mỗi chip:
  - Câu đã ghi âm: nền `#d1fae5`, ✓ xanh lá, số câu
  - Câu đang active: border `#6366f1` đậm, nền `#eef2ff`
  - Câu chưa ghi âm: nền trắng
- Click chip → `onJump(idx)`
- Max-height + overflow-y-auto nếu > 6 câu

Props: `part` ('part1' | 'part2' | 'part3'), `questions`, `currentIdx`, `audioBlobs`, `onJump`

## Files to change

| File | Loại | Mô tả |
|------|------|--------|
| `src/components/magicpath/ielts-speaking-test-screen/IELTSSpeakingTestScreen.jsx` | sửa | Refactor state, thay PhasePill → PartTab, render aside mới, dùng QuestionPartScreen |
| `src/components/magicpath/ielts-speaking-test-screen/PartTab.jsx` | **tạo** | Pill click được, 4 trạng thái |
| `src/components/magicpath/ielts-speaking-test-screen/QuestionNavigator.jsx` | **tạo** | Aside trái mới |
| `src/components/magicpath/ielts-speaking-test-screen/QuestionPartScreen.jsx` | **tạo** | Layout chung Part 1 + Part 3 |
| `mockups/speaking-test-redesign/index.html` | **tạo** | Mockup standalone cho review |
| `mockups/speaking-test-redesign/server.log` | log | Output từ http.server |

**Tổng:** 4 file sửa/tạo trong source + 1 mockup HTML.

## Mockup + Live server

- Folder: `mockups/speaking-test-redesign/`
- File: `index.html` (1 file, vanilla HTML/CSS/JS, inline styles dùng design tokens giống source)
- Server: `python3 -m http.server 3999` chạy từ folder đó
- User mở `http://localhost:3999/`
- Demo controls ở footer: button "✓ Đánh dấu Part 1 xong" / "✓ Đánh dấu Part 2 xong" để test tab unlock

Câu hỏi giả:
- Part 1: 4 câu (free time, books vs movies, hometown, food)
- Part 2: cue card giả "Describe a memorable journey"
- Part 3: 4 câu (technology & free time, outdoor activities, future of travel)

## Verification

1. `npm run build` pass, không lỗi
2. Vite dev :2999 — vào `/test/doTest` Speaking → click 3 tab đều render UI đúng
3. Click tab locked → grayscale + tooltip
4. Click câu trong QuestionNavigator → center card nhảy đúng câu
5. Recording vẫn hoạt động (mic + LiveWave + upload)
6. Mockup ở `http://localhost:3999/` render đúng 3 part

## Open items (deferred)

- E2E test retake flow + Yêu cầu chấm (từ Plan A)
- Plan B (highlight + dict lookup)
- Refactor Part 2 UI — chưa nằm trong scope này
