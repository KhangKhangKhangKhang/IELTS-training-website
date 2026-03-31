export const isTeacherRole = (role) =>
  role === "TEACHER" ;

export const hasTeacherPrivileges = (role) =>
  role === "ADMIN" || isTeacherRole(role);
