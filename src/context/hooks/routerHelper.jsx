import { useAuth } from "../authContext";
const [user] = useAuth();
const role = user.role;
export const roleBasePath = {
  USER: "",
  TEACHER: "/teacher",
  ADMIN: "/admin",
  SUPERADMIN: "/superadmin",
};

export const getBasePath = (role) => roleBasePath[role] ?? "";
