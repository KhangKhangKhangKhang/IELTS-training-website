// lib/testEvents.js
// Tiny event bus for cross-page state invalidation.
// When a user submits a test (R/L/W/S), the test page dispatches this event
// and listeners (e.g. HomePage weakness card) refetch their data.
export const TEST_SUBMITTED_EVENT = "test-submitted";

/**
 * Notify all listeners that a test was just submitted.
 * @param {{ skillType?: "READING" | "LISTENING" | "WRITING" | "SPEAKING" }} [detail]
 */
export const notifyTestSubmitted = (detail = {}) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TEST_SUBMITTED_EVENT, { detail }));
};