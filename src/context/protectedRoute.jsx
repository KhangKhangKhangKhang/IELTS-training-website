import { Navigate, Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { introspectAPI } from "@/services/apiAuth"; 
import { useAuth } from "./authContext";
import { Button, Result } from "antd";


const ProtectedRoute = () => {
  const { isAuth, loading, user } = useAuth();  
  const role = user?.role; 

const path = location.pathname;
const isUser = path.includes("user");
const isAdmin = path.includes("admin");
const isTeacher = path.includes("teacher");

const isForbidden =
(role === "user" && (isAdmin || isTeacher)) ||
(role === "teacher" && isAdmin);

if (isForbidden) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary">
            <Link to="/">Back Home</Link>
          </Button>
        }
      />
    );
  }
if (isAuth === null) {
    return <p>Loading...</p>; // hoặc spinner
  }

  
  return isAuth ?  <Outlet /> : <Navigate to={"/login"}/> ;
};

export default ProtectedRoute;
