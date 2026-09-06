import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { introspectAPI } from "@/services/apiAuth";
import Cookies from "js-cookie";
const AuthContext = createContext(null);

const safeParseCookie = (key) => {
  try {
    const v = Cookies.get(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => safeParseCookie("user") ?? "");
  const [isAuth, setIsAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("accessToken");
      if (!token) {
        setIsAuth(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await introspectAPI(token);
        if (res?.data?.active) {
          const storedUser = Cookies.get("user");
          setIsAuth(true);
          setUser(storedUser ? safeParseCookie("user") : null);
        } else {
          setIsAuth(false);
          setUser(null);
          Cookies.remove("accessToken");
          Cookies.remove("user");
        }
      } catch (error) {
        setIsAuth(false);
        setUser(null);
        Cookies.remove("accessToken");
        Cookies.remove("user");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value = useMemo(
    () => ({ user, isAuth, loading, setUser, setIsAuth }),
    [user, isAuth, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
