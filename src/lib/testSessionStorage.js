const TEST_SESSION_STORAGE_KEY = "active_test_session_v1";

const isBrowser = () => typeof window !== "undefined";

export const saveActiveTestSession = (session) => {
  if (!isBrowser()) return;
  if (!session?.idTest || !session?.testType) return;

  const payload = {
    idTest: session.idTest,
    testType: session.testType,
    duration: Number(session.duration) || 0,
    initialTestResult: session.initialTestResult || null,
    savedAt: Date.now(),
  };

  window.localStorage.setItem(TEST_SESSION_STORAGE_KEY, JSON.stringify(payload));
};

export const getActiveTestSession = () => {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(TEST_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.idTest || !parsed?.testType) return null;

    return parsed;
  } catch {
    return null;
  }
};

export const clearActiveTestSession = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TEST_SESSION_STORAGE_KEY);
};
