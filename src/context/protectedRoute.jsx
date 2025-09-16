import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { introspectAPI } from "@/services/api"; 

const ProtectedRoute = () => {
  const [isAuth, setIsAuth] = useState(null); 


  useEffect(() => {
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("accessToken");
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
      console.error("Error introspecting token:", error);
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
