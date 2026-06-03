# Student Homepage (Refactor)

Component lưu từ MagicPath `nice-ocean-8804` (IELTS Student Homepage), convert từ `.tsx` → `.jsx`.

## Files
- `IELTSStudentHomepage.jsx` — component chính, mock data tĩnh.

## Source
- MagicPath: `nice-ocean-8804` (project IELTS)
- Inspect: `npx -y magicpath-ai inspect nice-ocean-8804 -o json`
- Cập nhật gốc: 2026-05-29

## Mock data
Toàn bộ data hiện đang hardcode (streak 12, XP 1240, 7/24 badge, 4 skills...). Cần nối API khi build:
- Streak → `User.currentStreak` / `longestStreak` (DB có sẵn)
- Weekly XP → cần thêm table `UserXpHistory`
- Today Plan (5 lesson) → cần thêm model `StudyPlan`
- Achievements (badge) → cần 2 table mới
- 4 Skills, Recommended, Recent activity → API có sẵn

## Cấu trúc component
- `StackedButton` — button style "stacked" (3D-ish) tone/size variants
- `SkillCard` — card 4 kỹ năng với progress bar
- `LessonRow` — 1 dòng trong Today Plan (done/current/locked)
- `IELTSStudentHomepage` — layout chính: header + 2-col (main + right rail)

## Dependencies
- `framer-motion` (đã có trong package.json)
- Tailwind CSS (đã có)
- Font `Nunito` — chưa load, cần thêm vào `index.html` hoặc `index.css`
