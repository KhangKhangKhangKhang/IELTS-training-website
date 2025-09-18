import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./authContext";

const AuthRoute = () => {
  const { isAuth, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  // Nếu đã login thì redirect về trang chủ
  return isAuth ? <Navigate to="/" /> : <Outlet />;
};

export default AuthRoute;
