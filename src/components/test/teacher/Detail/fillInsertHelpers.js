// Pure helpers for the FILL family shared editor.
// No React imports. Safe to unit-test in node or browser console.

// Which BE sub-types belong to the FILL family? Mirrors the FAMILY_OF map
// in editorReadingListening.jsx — keep them in sync.
const FILL_SUBTYPES = new Set([
  "SENTENCE_COMPLETION",
  "SUMMARY_COMPLETION",
  "NOTE_COMPLETION",
  "TABLE_COMPLETION",
  "FLOW_CHART_COMPLETION",
]);

// FILL family check.
export const isFillFamily = (qType) => FILL_SUBTYPES.has(qType);

// Map sub-type → which BE metadata field holds the shared text. The table
// sub-type doesn't use a string field — it stores the grid as HTML in the
// question's top-level `content` field, so this returns null.
export const getSharedField = (qType) => {
  switch (qType) {
    case "SENTENCE_COMPLETION":
      return "sentenceWithBlank";
    case "SUMMARY_COMPLETION":
      return "fullParagraph";
    case "NOTE_COMPLETION":
      return "fullNoteText";
    case "FLOW_CHART_COMPLETION":
      return "fullFlowText";
    case "TABLE_COMPLETION":
      return null; // table: HTML lives in `content`, not `metadata`
    default:
      return null;
  }
};

// Map sub-type → which BE metadata field holds the per-blank label
// (the [N] that appears in the prompt). For SENTENCE the label is implicit
// (the question's number), so it returns null.
export const getBlankLabelField = (qType) => {
  switch (qType) {
    case "SUMMARY_COMPLETION":
      return "blankLabel";
    case "NOTE_COMPLETION":
      return "blankLabel";
    case "FLOW_CHART_COMPLETION":
      return "stepLabel";
    case "SENTENCE_COMPLETION":
    case "TABLE_COMPLETION":
    default:
      return null;
  }
};

// Insert `text` at the current cursor position of an HTMLTextAreaElement.
// Mutates the element's value, restores focus, and puts the caret right
// after the inserted text. Returns the new full value.
//
// Use a ref to your textarea, then call:
//   insertAtCursor(textareaRef.current, "___");
//   // afterwards, drive your React state from e.target.value via onChange
export const insertAtCursor = (textareaEl, text) => {
  if (!textareaEl) return "";
  const start = textareaEl.selectionStart ?? textareaEl.value.length;
  const end = textareaEl.selectionEnd ?? textareaEl.value.length;
  const before = textareaEl.value.slice(0, start);
  const after = textareaEl.value.slice(end);
  const next = before + text + after;
  textareaEl.value = next;
  const caret = start + text.length;
  textareaEl.focus();
  textareaEl.setSelectionRange(caret, caret);
  return next;
};

// Build an HTML table string from a 2D grid. Used for TABLE_COMPLETION
// questions — the result is stored in `content` (not metadata).
//
//   const grid = [
//     ["[1]", "Description"],
//     ["[2]", "Other detail"],
//   ];
//   generateTableHTML(grid) // → "<table>...</table>"
export const generateTableHTML = (grid) => {
  if (!Array.isArray(grid) || grid.length === 0) return "";
  const cellStyle =
    "padding: 8px; border: 1px solid #ddd; text-align: left;";
  const rows = grid
    .map((row, rIdx) => {
      const bg = rIdx === 0 ? "background-color: #f2f2f2;" : "";
      const cells = (row || [])
        .map((cell) => `<td style="${cellStyle} ${bg}">${cell ?? ""}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table border="1" style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">${rows}</table>`;
};

// Parse an HTML table string back into a 2D grid. Returns
//   { grid: string[][], rows: number, cols: number }
// or null if the input doesn't look like a table.
export const parseTableHTML = (html) => {
  if (typeof html !== "string" || !html.includes("<table")) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const table = doc.querySelector("table");
    if (!table) return null;
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) return null;
    const grid = [];
    let maxCols = 0;
    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll("td, th"));
      const rowData = cells.map((cell) => cell.innerHTML ?? "");
      grid.push(rowData);
      if (rowData.length > maxCols) maxCols = rowData.length;
    });
    return { grid, rows: grid.length, cols: maxCols };
  } catch {
    return null;
  }
};

// Default empty grid (3 rows × 2 cols) for a new TABLE_COMPLETION group.
export const defaultTableGrid = (rows = 3, cols = 2) => {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push("");
    grid.push(row);
  }
  return grid;
};

// Resize an existing grid to a new (rows, cols), preserving data in the
// overlap. Cells outside the overlap are blank.
export const resizeTableGrid = (grid, newRows, newCols) => {
  const next = [];
  for (let r = 0; r < newRows; r++) {
    const row = [];
    for (let c = 0; c < newCols; c++) {
      row.push(grid?.[r]?.[c] ?? "");
    }
    next.push(row);
  }
  return next;
};

// Default value for fillShared state at the group level. Used when the
// group has no questions yet and no draft.
export const defaultSharedForQType = (qType) => ({
  fullText: "",
  maxWords: 1,
  hasWordBank: false,
  wordBank: [],
  tableGrid: qType === "TABLE_COMPLETION" ? defaultTableGrid() : null,
  tableRows: 3,
  tableCols: 2,
  focusedCell: { r: 0, c: 0 },
});
