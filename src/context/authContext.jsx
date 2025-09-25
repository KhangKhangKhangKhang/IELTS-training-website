import { createContext, useContext, useEffect, useState } from "react";
import { introspectAPI } from "@/services/apiAuth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
const [user, setUser] = useState(
  localStorage.getItem("user") 
    ? JSON.parse(localStorage.getItem("user")) 
    : ""
);  const [isAuth, setIsAuth] = useState(null); 
  const [loading, setLoading] = useState(true);
  useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsAuth(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await introspectAPI(token);
      if (res?.data?.active) {
        const storedUser = localStorage.getItem("user");
        setIsAuth(true);
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } else {
        setIsAuth(false);
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
    } catch (error) {
      setIsAuth(false);
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
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
