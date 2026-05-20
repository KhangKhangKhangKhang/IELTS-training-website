# Study Planner - Updates Summary

**Date:** 2026-05-20

## Overview

Documenting all changes made to Study Planner feature.

## BACKEND CHANGES

### study-planner.service.ts

- Nullable types: `currentBand: number | null`, `targetBand: number | null`
- Removed fake defaults
- Fixed userId in weekly plan
- Redis caching implemented
- 7 queries → 1 query for completion

### calculate-plan.dto.ts

```typescript
currentBand?: number | null;
targetBand?: number | null;
```

## FRONTEND CHANGES

```jsx
{plan.currentBand ?? 'Chưa có'}
{plan.targetBand ?? 'Chưa đặt mục tiêu'}
```

## PERFORMANCE

| Before | After |
|--------|-------|
| 7 queries | 1 query |
| No cache | Redis cache |

## BUGS FIXED

1. throw Error() → NotFoundException()
2. User existence check
3. Fake defaults removed
4. Empty userId fixed
5. Redis caching
6. Null placeholders

## TODO

- Database indexes
- Onboarding flow
- Week navigation
