import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { introspectAPI } from "@/services/api"; 

const ProtectedRoute = () => {
  const [isAuth, setIsAuth] = useState(null); 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setIsAuth(false);
          return;
        }
        const res = await introspectAPI(token);
        if (res?.data?.active) {
          setIsAuth(true);
        } else {
          setIsAuth(false);
        }
      } catch (error) {
        setIsAuth(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuth === null) {
    return <p>Loading...</p>; // hoặc spinner
  }

  return isAuth ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
