import { useAuth } from "../authContext";
const { user } = useAuth();

const role = user.role;
export const roleBasePath = {
  USER: "",
  GIAOVIEN: "/teacher",
  ADMIN: "/admin",
};

export const getBasePath = (role) => roleBasePath[role] ?? "";
