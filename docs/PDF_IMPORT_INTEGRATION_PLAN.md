# Plan: Integrate PDF Import into Test Content Creation

**Date:** 2026-04-22
**Status:** ✅ Phase 1, 2, and 4 COMPLETED
**Goal:** Add "Import PDF" button in test content creation page (`testEdit.jsx`) that creates a new test from PDF content.

## Implementation Summary

### Completed Files

| File | Status |
|------|--------|
| `src/services/apiPdfExam.js` | ✅ Created |
| `src/components/test/teacher/PdfImportModal.jsx` | ✅ Created |
| `src/Pages/teacher/test/testEdit.jsx` | ✅ Modified |

### Flow After Implementation

```
User clicks "Import PDF" button (top-right corner of testEdit.jsx)
    ↓
PdfImportModal opens (2-step wizard)
    ↓
Step 1: Upload PDF
  - Dragger for PDF file (max 20MB)
  - Select test type (LISTENING/READING/WRITING/SPEAKING)
  - Select level (Low/Mid/High/Great)
  - Optional title input
    ↓
POST /pdf-exam/extract (multipart/form-data)
    ↓
Returns { idSession, rawData, confidence, warnings, status }
    ↓
Step 2: Review & Save
  - Shows confidence score (color-coded: green/orange/red)
  - Shows warnings if any
  - Toggle edit mode to modify JSON directly
  - "Lưu vào đề thi" button → POST /pdf-exam/save/:idSession
    ↓
Creates NEW test in DB with extracted content
    ↓
Navigate to /teacher/testManager/testEdit/:newIdTest
```

### Backend Behavior Note

The backend `POST /pdf-exam/save/:idSession` creates a **NEW test** with a new `idTest`. It does NOT import into the existing test. After saving, the user is navigated to the newly created test's edit page.

This is the expected behavior based on backend implementation.

### Key Design Decisions

1. **Navigation after save**: Navigate to the newly created test's edit page (`/teacher/testManager/testEdit/:idTest`)
2. **Edit capability**: JSON editor in modal allows direct editing before saving
3. **Confidence display**: Color-coded tag (green ≥80%, orange ≥60%, red <60%)
4. **Warning display**: List of warnings from backend extraction

### Files Created/Modified

**NEW: `src/services/apiPdfExam.js`**
```javascript
export const extractPdfExamAPI({ file, testType, title, level })
export const getPdfExamSessionAPI(idSession)
export const updatePdfExamSessionAPI(idSession, payload)
export const savePdfExamSessionAPI(idSession, idUser)
export const deletePdfExamSessionAPI(idSession)
```

**NEW: `src/components/test/teacher/PdfImportModal.jsx`**
- 2-step wizard modal
- Step 1: Upload PDF with test type/level selector
- Step 2: Review/edit extracted data, save or discard

**MODIFIED: `src/Pages/teacher/test/testEdit.jsx`**
- Added "Import PDF" button (top-right, absolute positioned)
- Integrated PdfImportModal
- Added showPdfImportModal state

### Remaining Items (Future Enhancement)

1. **Phase 3 (Parse & Map to existing test)**: Currently backend creates a NEW test. If user wants to IMPORT into EXISTING test (append parts to current test), additional work needed:
   - Backend would need a different endpoint, OR
   - Frontend would call createPartAPI, createQuestionGroupAPI, etc. after extraction

2. **Review Table Component**: Instead of raw JSON display, could create a structured review table component (`PdfImportReviewTable.jsx`) for better UX

3. **Auth Integration**: Currently using placeholder `"system"` for idUser - should use actual user from auth context

### API Service Layer

The service layer (`apiPdfExam.js`) provides:
- `extractPdfExamAPI` - POST /pdf-exam/extract
- `getPdfExamSessionAPI` - GET /pdf-exam/session/:idSession
- `updatePdfExamSessionAPI` - PATCH /pdf-exam/session/:idSession
- `savePdfExamSessionAPI` - POST /pdf-exam/save/:idSession
- `deletePdfExamSessionAPI` - DELETE /pdf-exam/session/:idSession
