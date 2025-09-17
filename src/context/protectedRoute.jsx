import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { introspectAPI } from "@/services/apiAuth"; 
import { useAuth } from "./authContext";

const ProtectedRoute = () => {
  const { isAuth, loading,user } = useAuth();  
  const role = user?.role; 


const path = location.pathname;
const isUser = path.includes("user");
const isAdmin = path.includes("admin");
const isTeacher = path.includes("teacher");


  if (isAuth === null) {
    return <p>Loading...</p>; // hoặc spinner
  }

  return isAuth ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
