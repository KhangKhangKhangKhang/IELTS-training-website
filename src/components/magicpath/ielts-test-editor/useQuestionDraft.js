import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useQuestionDraft — persist in-progress question form data to localStorage.
 *
 * Key shape: ielts:draft:group:<groupId>:<draftKey>
 *   - draftKey is "new" for a fresh create, or the BE question id for an edit.
 *
 * Auto-saves `formData` after a 500ms idle debounce.
 * Re-hydrates on mount (and when draftKey changes) by calling `onHydrate(draft)`.
 *
 * @param {object} opts
 * @param {string} opts.groupId       - group id (used in storage key)
 * @param {string} opts.draftKey      - "new" or an existing question id
 * @param {object} opts.formData      - the data to persist
 * @param {function} [opts.onHydrate] - called once with the stored draft (or null)
 * @param {boolean} [opts.enabled]    - if false, skip persistence
 * @returns {{ savedAt: number|null, clearDraft: function, hasDraft: boolean }}
 */
export default function useQuestionDraft({
  groupId,
  draftKey,
  formData,
  onHydrate,
  enabled = true,
}) {
  const [savedAt, setSavedAt] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
  const hydratedRef = useRef(false);
  const timerRef = useRef(null);
  const lastSerializedRef = useRef(null);

  const storageKey = `ielts:draft:group:${groupId || "unknown"}:${draftKey || "new"}`;

  // Hydrate once on mount / when key changes
  useEffect(() => {
    hydratedRef.current = false;
    setSavedAt(null);
    setHasDraft(false);
    if (!enabled) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setHasDraft(true);
        setSavedAt(parsed.__savedAt || null);
        if (onHydrate) onHydrate(parsed.data ?? null);
      } else if (onHydrate) {
        onHydrate(null);
      }
    } catch {
      if (onHydrate) onHydrate(null);
    }
    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, enabled]);

  // Debounced persist
  useEffect(() => {
    if (!enabled) return;
    if (!hydratedRef.current) return;
    if (typeof window === "undefined") return;
    if (!formData) return;

    const serialized = JSON.stringify(formData);
    if (serialized === lastSerializedRef.current) return;
    lastSerializedRef.current = serialized;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const payload = { data: formData, __savedAt: Date.now() };
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
        setSavedAt(payload.__savedAt);
        setHasDraft(true);
      } catch {
        // quota / disabled / private mode — fail silently
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [formData, storageKey, enabled]);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setSavedAt(null);
    setHasDraft(false);
    lastSerializedRef.current = null;
  }, [storageKey]);

  return { savedAt, clearDraft, hasDraft };
}
