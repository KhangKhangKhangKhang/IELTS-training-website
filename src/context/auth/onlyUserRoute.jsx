import { Navigate } from "react-router-dom";
import { useAuth } from "../authContext";

const OnlyUserRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== "USER") {
    return <Navigate to="/homepage" replace />;
  }

  return children;
};

export default OnlyUserRoute;