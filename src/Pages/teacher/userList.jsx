import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Avatar,
  Tooltip,
  Dropdown,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  ManOutlined,
  WomanOutlined,
  SearchOutlined,
  TeamOutlined,
  CrownOutlined,
  BookOutlined,
  MoreOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  LockOutlined,
  GoogleOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  getAllUserAPI,
  createUserAPI,
  updateUserAPI,
  deleteUserAPI,
} from "@/services/apiUser";
import { useAuth } from "@/context/authContext";

const { Option } = Select;

const UserList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { user } = useAuth();

  // Stats computed from data
  const stats = useMemo(() => {
    return {
      total: dataSource.length,
      admin: dataSource.filter((u) => u.role === "ADMIN").length,
      teacher: dataSource.filter((u) => u.role === "GIAOVIEN").length,
      user: dataSource.filter((u) => u.role === "USER").length,
    };
  }, [dataSource]);

  // Filtered data
  const filteredData = useMemo(() => {
    let filtered = dataSource;
    if (searchText) {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nameUser?.toLowerCase().includes(lower) ||
          u.email?.toLowerCase().includes(lower) ||
          u.phoneNumber?.includes(searchText)
      );
    }
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    return filtered;
  }, [dataSource, searchText, roleFilter]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await getAllUserAPI();
      if (res && res.data) {
        setDataSource(res.data);
      }
    } catch (error) {
      console.log(error);
      message.error("Lấy danh sách người dùng thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        await updateUserAPI(editingUser.idUser, values);
        message.success("Cập nhật người dùng thành công");
      } else {
        await createUserAPI(values);
        message.success("Thêm người dùng thành công");
      }
      setOpen(false);
      fetchUser();
    } catch (error) {
      console.log(error);
      message.error("Thao tác thất bại");
    }
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Xác nhận xóa người dùng",
      content: (
        <div className="py-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Avatar
              size={40}
              src={record.avatar}
              icon={<UserOutlined />}
              className="border border-slate-200"
            />
            <div>
              <p className="font-medium text-slate-800">{record.nameUser}</p>
              <p className="text-sm text-slate-500">{record.email}</p>
            </div>
          </div>
          <p className="mt-3 text-slate-600 text-sm">
            Hành động này không thể hoàn tác.
          </p>
        </div>
      ),
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await deleteUserAPI(record.idUser);
          message.success("Xóa người dùng thành công");
          fetchUser();
        } catch (error) {
          console.log(error);
          message.error("Xóa thất bại");
        }
      },
    });
  };

  const getRoleTag = (role) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
            <CrownOutlined />
            Admin
          </span>
        );
      case "GIAOVIEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
            <BookOutlined />
            Giáo viên
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
            <UserOutlined />
            Học viên
          </span>
        );
    }
  };

  const columns = [
    {
      title: "Người dùng",
      key: "user",
      width: 280,
      render: (_, record) => (
        <div className="flex items-center gap-3 py-1">
          <Avatar
            size={42}
            src={record.avatar}
            icon={<UserOutlined />}
            className="border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 truncate">
              {record.nameUser}
            </p>
            <p className="text-sm text-slate-500 truncate">{record.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      align: "center",
      width: 90,
      render: (gender) => {
        if (gender === "Male")
          return (
            <span className="inline-flex items-center gap-1 text-blue-600 text-sm">
              <ManOutlined />
              Nam
            </span>
          );
        if (gender === "Female")
          return (
            <span className="inline-flex items-center gap-1 text-pink-600 text-sm">
              <WomanOutlined />
              Nữ
            </span>
          );
        return <span className="text-slate-400">—</span>;
      },
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      align: "center",
      width: 120,
      render: (role) => getRoleTag(role),
    },
    {
      title: "Loại TK",
      dataIndex: "accountType",
      key: "accountType",
      align: "center",
      width: 100,
      render: (type) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${type === "GOOGLE"
              ? "bg-orange-50 text-orange-600"
              : "bg-slate-100 text-slate-600"
            }`}
        >
          {type === "GOOGLE" ? <GoogleOutlined /> : <LockOutlined />}
          {type}
        </span>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 140,
      render: (phone) => (
        <span className="text-slate-600">
          {phone || <span className="text-slate-400 italic">Chưa có</span>}
        </span>
      ),
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      align: "center",
      width: 80,
      render: (level) => {
        const colors = {
          Low: "bg-yellow-100 text-yellow-700",
          Mid: "bg-blue-100 text-blue-700",
          High: "bg-purple-100 text-purple-700",
        };
        return (
          <span
            className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[level] || "bg-slate-100 text-slate-600"
              }`}
          >
            {level || "—"}
          </span>
        );
      },
    },
    ...(user.role === "ADMIN"
      ? [
        {
          title: "",
          key: "actions",
          align: "center",
          width: 50,
          render: (_, record) => (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "edit",
                    icon: <EditOutlined />,
                    label: "Chỉnh sửa",
                    onClick: () => handleEdit(record),
                  },
                  { type: "divider" },
                  {
                    key: "delete",
                    icon: <DeleteOutlined />,
                    label: "Xóa",
                    danger: true,
                    onClick: () => handleDelete(record),
                  },
                ],
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                className="hover:bg-slate-100 rounded-lg"
              />
            </Dropdown>
          ),
        },
      ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - giống Forum */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-2xl shadow-lg p-8 border border-slate-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
                  <TeamOutlined className="text-2xl text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Quản lý người dùng
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Tổng số:{" "}
                    <span className="text-blue-400 font-semibold">
                      {stats.total}
                    </span>{" "}
                    người dùng
                  </p>
                </div>
              </div>

              {user.role === "ADMIN" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                  size="large"
                  className="bg-blue-600 hover:bg-blue-500 border-0 shadow-lg shadow-blue-600/30 rounded-xl h-11 px-6"
                >
                  Thêm người dùng
                </Button>
              )}
            </div>

            {/* Stats inline */}
            <div className="flex flex-wrap items-center gap-6 mt-6 pt-5 border-t border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <CrownOutlined className="text-red-400" />
                <span>
                  Admin:{" "}
                  <span className="text-white font-medium">{stats.admin}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <BookOutlined className="text-blue-400" />
                <span>
                  Giáo viên:{" "}
                  <span className="text-white font-medium">{stats.teacher}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <UserOutlined className="text-emerald-400" />
                <span>
                  Học viên:{" "}
                  <span className="text-white font-medium">{stats.user}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 w-full">
              <Input
                placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="large"
                className="rounded-lg"
                allowClear
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                size="large"
                className="w-full sm:w-40"
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">Tất cả</Option>
                <Option value="ADMIN">Admin</Option>
                <Option value="GIAOVIEN">Giáo viên</Option>
                <Option value="USER">Học viên</Option>
              </Select>
              <Tooltip title="Làm mới">
                <Button
                  icon={<ReloadOutlined />}
                  size="large"
                  onClick={fetchUser}
                  loading={loading}
                  className="rounded-lg"
                />
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <Table
            loading={loading}
            rowKey={"idUser"}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} người dùng`,
              className: "px-4 py-3",
            }}
            columns={columns}
            dataSource={filteredData}
            scroll={{ x: 900 }}
            rowClassName="hover:bg-slate-50 transition-colors"
          />
        </div>
      </div>

      {/* Modal form */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              {editingUser ? (
                <EditOutlined className="text-lg text-blue-600" />
              ) : (
                <PlusOutlined className="text-lg text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
              </h3>
              <p className="text-sm text-slate-500">
                {editingUser
                  ? "Cập nhật thông tin người dùng"
                  : "Điền thông tin để tạo tài khoản"}
              </p>
            </div>
          </div>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button size="large" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {editingUser ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        }
        width={650}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          className="pt-4"
          requiredMark="optional"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Tên người dùng"
              name="nameUser"
              rules={[
                { required: true, message: "Vui lòng nhập tên người dùng" },
              ]}
            >
              <Input
                size="large"
                placeholder="Nhập tên người dùng"
                prefix={<UserOutlined className="text-slate-400" />}
              />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input
                size="large"
                placeholder="Nhập email"
                prefix={<MailOutlined className="text-slate-400" />}
              />
            </Form.Item>
          </div>

          {!editingUser && (
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                size="large"
                placeholder="Nhập mật khẩu"
                prefix={<LockOutlined className="text-slate-400" />}
              />
            </Form.Item>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Số điện thoại" name="phoneNumber">
              <Input
                size="large"
                placeholder="Nhập số điện thoại"
                prefix={<PhoneOutlined className="text-slate-400" />}
              />
            </Form.Item>

            <Form.Item
              label="Giới tính"
              name="gender"
              rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
            >
              <Select size="large" placeholder="Chọn giới tính">
                <Option value="Male">Nam</Option>
                <Option value="Female">Nữ</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Địa chỉ" name="address">
            <Input
              size="large"
              placeholder="Nhập địa chỉ"
              prefix={<HomeOutlined className="text-slate-400" />}
            />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item label="Vai trò" name="role" initialValue="USER">
              <Select size="large">
                <Option value="USER">Học viên</Option>
                <Option value="ADMIN">Admin</Option>
                <Option value="GIAOVIEN">Giáo viên</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Loại tài khoản"
              name="accountType"
              initialValue="LOCAL"
            >
              <Select size="large">
                <Option value="LOCAL">Local</Option>
                <Option value="GOOGLE">Google</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Level"
              name="level"
              rules={[{ required: true, message: "Vui lòng chọn level" }]}
            >
              <Select size="large" placeholder="Chọn level">
                <Option value="Low">Low</Option>
                <Option value="Mid">Mid</Option>
                <Option value="High">High</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Avatar URL" name="avatar">
            <Input size="large" placeholder="https://example.com/avatar.jpg" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
