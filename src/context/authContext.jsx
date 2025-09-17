import { createContext, useContext, useEffect, useState } from "react";
import { introspectAPI } from "@/services/apiAuth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // lưu thông tin user
  const [isAuth, setIsAuth] = useState(false); 
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
          setIsAuth(true);
          setUser(res.data.user); // giả sử API introspect trả về thông tin user
        } else {
          setIsAuth(false);
          setUser(null);
          localStorage.removeItem("accessToken");
        }
      } catch (error) {
        console.error("Error introspecting:", error);
        setIsAuth(false);
        setUser(null);
        localStorage.removeItem("accessToken");
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

// custom hook
export const useAuth = () => useContext(AuthContext);
