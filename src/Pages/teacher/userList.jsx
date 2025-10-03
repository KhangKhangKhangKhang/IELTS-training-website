import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, message } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getAllUserAPI,
  createUserAPI,
  updateUserAPI,
  deleteUserAPI,
} from "@/services/apiUser";

const UserList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // modal add/edit
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);

  // fetch list
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

  // mở modal để thêm user
  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setOpen(true);
  };

  // submit form (tạo hoặc update)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        // update
        await updateUserAPI(editingUser.idUser, values);
        message.success("Cập nhật người dùng thành công");
      } else {
        // create
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

  // edit user
  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  // delete user
  const handleDelete = async (record) => {
    try {
      await deleteUserAPI(record.idUser);
      message.success("Xóa người dùng thành công");
      fetchUser();
    } catch (error) {
      console.log(error);
      message.error("Xóa thất bại");
    }
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      render: (text) =>
        text ? (
          <img src={text} alt="avatar" className="w-10 h-10 rounded-full" />
        ) : (
          "N/A"
        ),
    },
    {
      title: "Tên người dùng",
      dataIndex: "nameUser",
      key: "nameUser",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-3">
          <EditOutlined
            onClick={() => handleEdit(record)}
            style={{ color: "blue" }}
            className="cursor-pointer text-blue-600"
          />
          <DeleteOutlined
            onClick={() => handleDelete(record)}
            style={{ color: "red" }}
            className="cursor-pointer text-red-600"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-center ml-10 mr-10 justify-center p-1">
      <div className="my-4 text-xl font-semibold">Danh sách người dùng</div>

      <div className="flex flex-row justify-end items-end w-full mr-10 my-2">
        <Button type="primary" onClick={handleAdd}>
          Add User
        </Button>
      </div>

      <Table
        bordered
        loading={loading}
        rowKey={"idUser"}
        pagination={{ pageSize: 8 }}
        className="w-full m-5"
        columns={columns}
        dataSource={dataSource}
      />

      {/* Modal form */}
      <Modal
        title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        okText={editingUser ? "Cập nhật" : "Tạo mới"}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Avatar" name="avatar">
            <Input placeholder="http://example.com/avatar.jpg" />
          </Form.Item>
          <Form.Item
            label="Tên người dùng"
            name="nameUser"
            rules={[{ required: true, message: "Nhập tên người dùng" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Nhập mật khẩu" }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item label="Số điện thoại" name="phoneNumber">
            <Input />
          </Form.Item>

          <Form.Item label="Địa chỉ" name="address">
            <Input />
          </Form.Item>

          <Form.Item label="Role" name="role" initialValue="USER">
            <Select
              options={[
                { value: "USER", label: "USER" },
                { value: "ADMIN", label: "ADMIN" },
                { value: "GIAOVIEN", label: "GIAOVIEN" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Account Type"
            name="accountType"
            initialValue="LOCAL"
          >
            <Select
              options={[
                { value: "LOCAL", label: "LOCAL" },
                { value: "GOOGLE", label: "GOOGLE" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
