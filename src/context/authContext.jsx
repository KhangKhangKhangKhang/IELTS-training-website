import { createContext, useContext, useEffect, useState } from "react";
import { introspectAPI } from "@/services/apiAuth";
import Cookies from "js-cookie";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const u = Cookies.get("user");
    return u ? JSON.parse(u) : null;
  });
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
          setIsAuth(true);
        } else {
          setIsAuth(false);
        }
      } catch {
        // Không xóa token ở đây, để axios tự xử lý
        setIsAuth(false);
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
