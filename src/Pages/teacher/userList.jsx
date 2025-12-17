import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Tag,
  Space,
  Avatar,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  ManOutlined,
  WomanOutlined,
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
  const { user } = useAuth();

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
      // values sẽ tự động bao gồm: nameUser, email, gender, ... từ Form
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
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa người dùng "${record.nameUser}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
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

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "red";
      case "GIAOVIEN":
        return "blue";
      default:
        return "green";
    }
  };

  const getAccountTypeColor = (type) => {
    return type === "GOOGLE" ? "orange" : "gray";
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      align: "center",
      width: 80,
      render: (avatar) => (
        <Avatar
          size="large"
          src={avatar}
          icon={<UserOutlined />}
          className="border border-gray-300"
        />
      ),
    },
    {
      title: "Tên người dùng",
      dataIndex: "nameUser",
      key: "nameUser",
      sorter: (a, b) => a.nameUser.localeCompare(b.nameUser),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      align: "center",
      width: 100,
      render: (gender) => {
        if (gender === "MALE")
          return (
            <Tag color="blue" icon={<ManOutlined />}>
              Nam
            </Tag>
          );
        if (gender === "FEMALE")
          return (
            <Tag color="magenta" icon={<WomanOutlined />}>
              Nữ
            </Tag>
          );
        return <Tag>Khác</Tag>;
      },
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      align: "center",
      render: (role) => (
        <Tag color={getRoleColor(role)} className="font-semibold">
          {role}
        </Tag>
      ),
      filters: [
        { text: "ADMIN", value: "ADMIN" },
        { text: "USER", value: "USER" },
        { text: "GIAOVIEN", value: "GIAOVIEN" },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: "Loại tài khoản",
      dataIndex: "accountType",
      key: "accountType",
      align: "center",
      render: (type) => <Tag color={getAccountTypeColor(type)}>{type}</Tag>,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (phone) => phone || "Chưa có",
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
      render: (address) => address || "Chưa có",
    },
    ...(user.role === "ADMIN"
      ? [
          {
            title: "Thao tác",
            key: "actions",
            align: "center",
            width: 120,
            render: (_, record) => (
              <Space size="middle">
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  className="text-blue-500"
                />
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record)}
                />
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card
        className="shadow-lg rounded-xl border-0"
        bodyStyle={{ padding: 0 }}
      >
        <div className="bg-white rounded-xl p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Quản lý người dùng
              </h1>
              <p className="text-gray-600">
                Tổng số người dùng: {dataSource.length}
              </p>
            </div>
            {user.role === "ADMIN" && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                size="large"
                className="bg-blue-600 hover:bg-blue-700 border-0 shadow-md"
              >
                Thêm người dùng
              </Button>
            )}
          </div>

          {/* Table */}
          <Table
            bordered
            loading={loading}
            rowKey={"idUser"}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} người dùng`,
            }}
            columns={columns}
            dataSource={dataSource}
            className="rounded-lg overflow-hidden"
            scroll={{ x: 1200 }}
          />
        </div>
      </Card>

      {/* Modal form */}
      <Modal
        title={
          <div className="text-xl font-semibold">
            {editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
          </div>
        }
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        okText={editingUser ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        width={700}
        styles={{
          body: { padding: "24px 0" },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          className="px-4" // Tăng padding ngang để form thoáng hơn
          requiredMark="optional"
        >
          {/* Hàng 1: Tên và Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Tên người dùng"
              name="nameUser"
              rules={[
                { required: true, message: "Vui lòng nhập tên người dùng" },
              ]}
            >
              <Input size="large" placeholder="Nhập tên người dùng" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Email không hợp lệ",
                },
              ]}
            >
              <Input size="large" placeholder="Nhập địa chỉ email" />
            </Form.Item>
          </div>

          {/* Hàng 2: Password (chỉ hiện khi tạo mới) */}
          {!editingUser && (
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password size="large" placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}

          {/* Hàng 3: SĐT và Giới tính (MỚI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Số điện thoại" name="phoneNumber">
              <Input size="large" placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              label="Giới tính"
              name="gender"
              rules={[{ required: true, message: "Vui lòng chọn giới tính" }]} // Giá trị mặc định
            >
              <Select size="large" placeholder="Chọn giới tính">
                <Option value="Male">Nam</Option>
                <Option value="Female">Nữ</Option>
              </Select>
            </Form.Item>
          </div>

          {/* Hàng 4: Địa chỉ (Full width để nhập cho thoải mái) */}
          <Form.Item label="Địa chỉ" name="address">
            <Input size="large" placeholder="Nhập địa chỉ thường trú" />
          </Form.Item>

          {/* Hàng 5: Vai trò và Loại tài khoản */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Vai trò" name="role" initialValue="USER">
              <Select size="large">
                <Option value="USER">USER</Option>
                <Option value="ADMIN">ADMIN</Option>
                <Option value="GIAOVIEN">GIÁO VIÊN</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Loại tài khoản"
              name="accountType"
              initialValue="LOCAL"
            >
              <Select size="large">
                <Option value="LOCAL">LOCAL</Option>
                <Option value="GOOGLE">GOOGLE</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Level"
            name="level"
            rules={[{ required: true, message: "Vui lòng chọn level" }]}
          >
            <Select size="large">
              <Option value="Low">Low</Option>
              <Option value="Mid">Mid</Option>
              <Option value="High">High</Option>
            </Select>
          </Form.Item>

          {/* Hàng 7: Avatar */}
          <Form.Item label="Avatar URL" name="avatar">
            <Input size="large" placeholder="https://example.com/avatar.jpg" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
