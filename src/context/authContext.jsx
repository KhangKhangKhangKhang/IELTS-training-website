import { createContext, useContext, useEffect, useState } from "react";
import { introspectAPI } from "@/services/apiAuth";
import Cookies from "js-cookie";
const AuthContext = createContext(null);

const parseUserCookie = () => {
  try {
    const rawUser = Cookies.get("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    Cookies.remove("user");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(parseUserCookie());
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
        const isActive =
          res?.data?.active ?? res?.active ?? res?.data?.data?.active;

        if (isActive) {
          setIsAuth(true);
          setUser(parseUserCookie());
        } else {
          setIsAuth(false);
          setUser(null);
          Cookies.remove("accessToken");
          Cookies.remove("user");
          Cookies.remove("refreshToken");
        }
      } catch (error) {
        setIsAuth(false);
        setUser(null);
        Cookies.remove("accessToken");
        Cookies.remove("user");
        Cookies.remove("refreshToken");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuth, loading, setUser, setIsAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
