export const isTeacherRole = (role) =>
  role === "TEACHER" || role === "GIAOVIEN";

export const hasTeacherPrivileges = (role) =>
  role === "ADMIN" || isTeacherRole(role);
