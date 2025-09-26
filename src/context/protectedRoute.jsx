import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { introspectAPI } from "@/services/apiAuth";
import { useAuth } from "./authContext";
import { Button, Result, Spin } from "antd";

const ProtectedRoute = () => {
  const { isAuth, loading, user } = useAuth();
  const role = user?.role;
  const location = useLocation();

  const path = location.pathname;
  const isAdmin = path.includes("admin");
  const isTeacher = path.includes("teacher");

  const isForbidden =
    (role === "USER" && (isAdmin || isTeacher)) ||
    (role === "GIAOVIEN" && isAdmin);
  if (location.pathname === "/") {
    if (role === "USER") {
      return <Navigate to="/homepage" replace />;
    }
    if (role === "GIAOVIEN") {
      return <Navigate to="/teacher/homepage" replace />;
    }
    if (role === "ADMIN") {
      return <Navigate to="/admin/homepage" replace />;
    }
  }
  if (isAuth === null) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
      </div>
    );
  }
  if (!isAuth) {
    return <Navigate to={"/landingPage"} />;
  }

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
  return <Outlet />;
};

export default ProtectedRoute;
