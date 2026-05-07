# Plan: Admin Dashboard Enhancement - Backend Policy + Audit + UI

## Context

The admin dashboard (`adminDashboard.jsx`) currently has:

1. **Moderation Policy** - stored in localStorage only, with hardcoded thresholds (80/20) in `forum-post.service.ts`
2. **Audit Trail** - stored in localStorage only (localStorage MVP)
3. **Commission Config** - already has backend API
4. **UI** - basic card-based layout with no visualizations

**User Requirements**:

1. Improve UI with better charts and more intuitive workflow
2. Comprehensive audit log covering ALL admin actions (not just policy + moderation)

The README_IMPROVEMENTS.md (section 11-12) outlines that moderation thresholds should be configurable and audit log API is needed for admin action tracking.

## Overview of Changes

### Phase 1: Database - Add AuditLog Model

**File**: `ielts_training_app/prisma/schema.prisma`

Add `AuditLog` model for immutable admin action tracking:

- actorId, actorName, actorRole, action, targetType, targetId
- beforeValue/afterValue (JSON) for change snapshots
- metadata (JSON) for extra context
- timestamps with indexes for query performance

### Phase 2: Backend - Moderation Policy via SystemConfig

**Files**:

- `ielts_training_app/src/module/system-config/system-config.service.ts` - Add `getModerationPolicy()` / `setModerationPolicy()`
- `ielts_training_app/src/module/system-config/system-config.controller.ts` - Add GET/PUT `/system-config/moderation/policy` endpoints
- `ielts_training_app/src/module/forum-post/forum-post.service.ts` - Remove hardcoded `AUTO_APPROVE_THRESHOLD = 80`, `AUTO_REJECT_THRESHOLD = 20`, `BLOCKED_TERMS` - read from SystemConfig instead
- `ielts_training_app/src/module/forum-post/forum-post.module.ts` - Import `SystemConfigModule`

### Phase 3: Backend - Audit Log System (Comprehensive)

**New Files** (in `ielts_training_app/src/module/audit-log/`):

- `audit-log.module.ts`
- `audit-log.service.ts` - Create entries + query with filters + helper methods for common admin actions
- `audit-log.controller.ts` - GET `/audit-log` with pagination + filters

**Modified Files**:

- `ielts_training_app/src/app.module.ts` - Import `AuditLogModule`
- Integration points for comprehensive audit across:
  - `SystemConfigService` (policy + commission changes)
  - `ForumPostService` (review actions)
  - `UsersService` (user CRUD, role changes)
  - `TeacherReviewService` (ticket management)
  - `SubscriptionService` (grant/revoke)
  - `CreditsService` (credit adjustments)

### Phase 4: Frontend - Connect to Real APIs + UI Enhancement

**Files**:

- `IELTS-training-website/src/services/apiTeacherReview.js` - Add `getModerationPolicyAPI()`, `updateModerationPolicyAPI()`
- `IELTS-training-website/src/services/apiAuditLog.js` (NEW) - `getAuditLogsAPI()`
- `IELTS-training-website/src/services/apiStatistics.js` - Add backend stats API if needed
- `IELTS-training-website/src/Pages/admin/adminDashboard.jsx`:
  - Remove localStorage references for policy/audit
  - Fetch policy from backend on mount
  - Fetch audit logs from backend on mount
  - Save policy calls backend API
  - **UI ENHANCEMENTS** (see below)

### Phase 4b: Admin Dashboard UI Improvements

**Layout enhancements**:

1. Replace 4 equal cards with asymmetric grid: overview takes 2 cols, alerts takes full width
2. Add line/area charts for: tests over time, user growth, band score trends
3. Add skill breakdown radar chart or bar chart for LISTENING/READING/WRITING/SPEAKING averages
4. Add quick action cards with better visual hierarchy and status indicators
5. Add recent activity feed with timestamps
6. Improve alert section with dismissible toasts
7. Add refresh button and last-updated timestamp
8. Responsive design improvements for mobile

**Charts to add** (using Recharts which may already be installed or use AntD charts):

- Test submission trend (last 7 days/weeks)
- User registration trend
- Band score distribution
- Skill performance breakdown
- Ticket resolution time (if data available)

## Critical Files

### Backend

| File                                                                      | Action                                          |
| ------------------------------------------------------------------------- | ----------------------------------------------- |
| `ielts_training_app/prisma/schema.prisma`                                 | Add AuditLog model                              |
| `ielts_training_app/src/module/system-config/system-config.service.ts`    | Add moderation policy methods                   |
| `ielts_training_app/src/module/system-config/system-config.controller.ts` | Add moderation policy endpoints                 |
| `ielts_training_app/src/module/forum-post/forum-post.service.ts`          | Replace hardcoded thresholds with config lookup |
| `ielts_training_app/src/module/forum-post/forum-post.module.ts`           | Import SystemConfigModule                       |
| `ielts_training_app/src/module/audit-log/` (new dir)                      | Create module, service, controller              |
| `ielts_training_app/src/app.module.ts`                                    | Import AuditLogModule                           |
| `ielts_training_app/src/module/users/users.service.ts`                    | Add audit logging for user CRUD/role changes    |
| `ielts_training_app/src/module/subscription/subscription.service.ts`      | Add audit logging                               |
| `ielts_training_app/src/module/credits/credits.service.ts`                | Add audit logging                               |
| `ielts_training_app/src/module/teacher-review/teacher-review.service.ts`  | Add audit logging                               |

### Frontend

| File                                                        | Action                           |
| ----------------------------------------------------------- | -------------------------------- |
| `IELTS-training-website/src/services/apiTeacherReview.js`   | Add policy API functions         |
| `IELTS-training-website/src/services/apiAuditLog.js`        | NEW file for audit API           |
| `IELTS-training-website/src/services/apiStatistics.js`      | Check for stats API              |
| `IELTS-training-website/src/Pages/admin/adminDashboard.jsx` | Connect to backend + UI redesign |

## Comprehensive Audit Actions to Track

| Action Key                 | Description                     | Target       |
| -------------------------- | ------------------------------- | ------------ | --- |
| `MODERATION_POLICY_UPDATE` | Threshold/blocked words changed | SystemConfig |
| `COMMISSION_UPDATE`        | Commission rates changed        | SystemConfig |
| `ASSIGN_MODE_UPDATE`       | Auto/manual mode changed        | SystemConfig |
| `FORUM_POST_REVIEW`        | Post approved/rejected/changed  | ForumPost    |
| `USER_CREATE`              | New user created                | User         | z   |
| `USER_UPDATE`              | User details updated            | User         |
| `USER_DELETE`              | User deleted                    | User         |
| `USER_ROLE_CHANGE`         | User role changed               | User         |
| `USER_DISABLE`             | User account disabled           | User         |
| `USER_ENABLE`              | User account enabled            | User         |
| `TICKET_CANCEL`            | Ticket cancelled by admin       | Ticket       |
| `SUBSCRIPTION_GRANT`       | Subscription granted            | Subscription |
| `CREDIT_ADJUST`            | Credit balance adjusted         | Credit       |

## Verification

1. `GET /system-config/moderation/policy` returns defaults `{ autoApproveThreshold: 80, autoRejectThreshold: 20, blockedWords: [...], reviewSlaHours: 24 }`
2. `PUT /system-config/moderation/policy` persists and returns success
3. Forum post auto-moderation uses configurable thresholds (test by changing threshold to 90 and verifying posts score 85 get `needs_review` instead of `auto_approved`)
4. `GET /audit-log` returns paginated entries
5. Admin dashboard loads policy and audit from backend (not localStorage)
6. Dashboard shows charts with real data
7. Audit log shows entries for user create/update/delete, role changes, etc.

## Dependencies

- Prisma migration: `npx prisma migrate dev --name add_audit_log`
- Backend must be restarted after schema changes
- Frontend API calls use existing `axios.custom` pattern
- Recharts or AntD charts for visualizations

## Effort Estimate

- Phase 1 (DB): Low - single model addition
- Phase 2 (Backend Policy): Medium - service + controller methods, forum-post refactor
- Phase 3 (Backend Audit): Medium - new module + integration across multiple services
- Phase 4 (Frontend): Medium - API additions + component redesign with charts

**Total**: ~8-10 hours of work across both frontend and backend
