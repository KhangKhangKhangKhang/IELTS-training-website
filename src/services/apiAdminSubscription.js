import API from "./axios.custom";

export const adminListPackagesAPI = () =>
  API.get("/subscriptions/admin/packages").then((r) => r.data);

export const adminCreatePackageAPI = (payload) =>
  API.post("/subscriptions/packages", payload).then((r) => r.data);

export const adminUpdatePackageAPI = (idPackage, payload) =>
  API.put(`/subscriptions/admin/packages/${idPackage}`, payload).then(
    (r) => r.data
  );

export const adminTogglePackageActiveAPI = (idPackage, isActive) =>
  API.patch(
    `/subscriptions/admin/packages/${idPackage}/active`,
    { isActive }
  ).then((r) => r.data);

export const adminDeletePackageAPI = (idPackage) =>
  API.delete(`/subscriptions/admin/packages/${idPackage}`).then((r) => r.data);
