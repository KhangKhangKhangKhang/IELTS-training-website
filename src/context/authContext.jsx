import { createContext, useContext, useEffect, useState } from "react";
import { introspectAPI } from "@/services/apiAuth";
import Cookies from "js-cookie";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    Cookies.get("user") ? JSON.parse(Cookies.get("user")) : ""
  );
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
          setUser(storedUser ? JSON.parse(storedUser) : null);
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

  return (
    <AuthContext.Provider value={{ user, isAuth, loading, setUser, setIsAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
