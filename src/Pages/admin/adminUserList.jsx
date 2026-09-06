import React, { useEffect, useState } from "react";
import { message } from "antd";
import { IELTSUserManagement } from "@/components/magicpath/ielts-user-management/IELTSUserManagement";
import {
  getAllUserAPI,
  createUserAPI,
  updateUserAPI,
  deleteUserAPI,
} from "@/services/apiUser";

/**
 * adminUserList — admin-only user management backed by the MagicPath
 * `IELTSUserManagement` component. Wires real CRUD APIs and maps the
 * backend User shape to the component's `UserRow` shape.
 *
 * Note: the legacy `userList.jsx` is shared with the teacher role and
 * stays as-is. This admin version is mounted only at /admin/userList.
 */
const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await getAllUserAPI();
      const list = res?.data ?? res?.items ?? res ?? [];
      setUsers(Array.isArray(list) ? list.map(normalize) : []);
    } catch (e) {
      console.error("AdminUserList fetch failed", e);
      message.error("Không tải được danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleAdd = async (data) => {
    try {
      const { password, ...rest } = data;
      if (!password) {
        message.error("Vui lòng nhập mật khẩu cho người dùng");
        throw new Error("Missing password");
      }
      await createUserAPI(toFormData({ ...rest, password }));
      message.success("Đã thêm người dùng");
      fetchAll();
    } catch (e) {
      if (e?.message !== "Missing password") {
        message.error("Thêm người dùng thất bại");
      }
      throw e;
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await updateUserAPI(id, toFormData(data));
      message.success("Đã cập nhật");
      fetchAll();
    } catch (e) {
      message.error("Cập nhật thất bại");
      throw e;
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUserAPI(id);
      message.success("Đã xóa");
      fetchAll();
    } catch (e) {
      message.error("Xóa thất bại");
      throw e;
    }
  };

  // The MagicPath UI exposes a toggle button but no dedicated API for
  // active/inactive; treat it as an in-memory optimistic update for now.
  const handleToggleActive = async (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    );
  };

  return (
    <IELTSUserManagement
      users={users}
      loading={loading}
      onAddUser={handleAdd}
      onUpdateUser={handleUpdate}
      onDeleteUser={handleDelete}
      onToggleActive={handleToggleActive}
    />
  );
};

// Map backend user → MagicPath UserRow shape.
const normalize = (u) => ({
  id: u.idUser ?? u.id,
  name: u.nameUser ?? u.name ?? "—",
  email: u.email ?? "—",
  phone: u.phoneNumber ?? u.phone ?? "",
  role: (u.role ?? "USER").toUpperCase(),
  active: u.isActive !== false,
});

// Build multipart/form-data payload expected by the backend user APIs.
const toFormData = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v != null) fd.append(k, v);
  });
  return fd;
};

export default AdminUserList;
