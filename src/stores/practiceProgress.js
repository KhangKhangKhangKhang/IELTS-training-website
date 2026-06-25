import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

/**
 * Store for tracking practice progress in real time.
 * Each "mode" (multiple, fill, flashcard) has its own session with
 * { correct, total, currentIndex, answers }.
 *
 * Components that need realtime progress (e.g. /vocabulary tab "Luyện tập")
 * use the exported hooks below, which wrap Zustand with `useShallow` so that
 * selector returns are reference-stable across renders. This avoids the
 * "Cannot update a component while rendering a different component" warning
 * raised by React when a Zustand selector returns a fresh object each time.
 */
const usePracticeProgressStore = create((set, get) => ({
  sessions: {},

  startSession: (mode, total) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [mode]: { correct: 0, total, currentIndex: 0, answers: {} },
      },
    })),

  incrementCorrect: (mode) =>
    set((state) => {
      const session = state.sessions[mode];
      if (!session) return state;
      return {
        sessions: {
          ...state.sessions,
          [mode]: { ...session, correct: session.correct + 1 },
        },
      };
    }),

  setCurrentIndex: (mode, idx) =>
    set((state) => {
      const session = state.sessions[mode];
      if (!session) return state;
      return {
        sessions: {
          ...state.sessions,
          [mode]: { ...session, currentIndex: idx },
        },
      };
    }),

  recordAnswer: (mode, vocabId, isCorrect) =>
    set((state) => {
      const session = state.sessions[mode];
      if (!session) return state;
      return {
        sessions: {
          ...state.sessions,
          [mode]: {
            ...session,
            answers: { ...session.answers, [vocabId]: { isCorrect } },
          },
        },
      };
    }),

  endSession: (mode) =>
    set((state) => {
      if (!state.sessions[mode]) return state;
      const next = { ...state.sessions };
      delete next[mode];
      return { sessions: next };
    }),

  getSession: (mode) => get().sessions[mode] ?? null,
}));

// Stable hooks — `useShallow` ensures the returned object/array reference
// is stable when its fields are unchanged, so React doesn't tear down/rebuild
// the component tree on every store update.
export const usePracticeProgress = () => {
  const startSession = usePracticeProgressStore((s) => s.startSession);
  const incrementCorrect = usePracticeProgressStore((s) => s.incrementCorrect);
  const setCurrentIndex = usePracticeProgressStore((s) => s.setCurrentIndex);
  const recordAnswer = usePracticeProgressStore((s) => s.recordAnswer);
  const endSession = usePracticeProgressStore((s) => s.endSession);
  return useShallow({
    startSession,
    incrementCorrect,
    setCurrentIndex,
    recordAnswer,
    endSession,
  });
};

export const useSession = (mode) =>
  usePracticeProgressStore((s) => s.sessions[mode] ?? null);

export const useAllSessions = () =>
  usePracticeProgressStore(useShallow((s) => s.sessions));

// Imperative access for non-React callers (event handlers, async code).
export const getPracticeProgress = usePracticeProgressStore.getState;

export default usePracticeProgress;
