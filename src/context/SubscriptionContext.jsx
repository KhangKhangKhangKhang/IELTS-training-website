import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./authContext";
import { getCurrentSubscriptionAPI } from "../services/apiSubscription";

const SubscriptionContext = createContext({
  subscription: null,
  loading: false,
  refresh: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

const ACTIVE_STATUSES = new Set(["ACTIVE"]);

const isActive = (sub) =>
  !!sub && ACTIVE_STATUSES.has(sub.status) && new Date(sub.expiresAt) > new Date();

export const SubscriptionProvider = ({ children }) => {
  const { isAuth } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuth) {
      setSubscription(null);
      return;
    }
    setLoading(true);
    try {
      const data = await getCurrentSubscriptionAPI();
      setSubscription(isActive(data) ? data : null);
    } catch (e) {
      console.warn("[subscription] refresh failed", e);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [isAuth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ subscription, loading, refresh }),
    [subscription, loading, refresh]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
