// ProfileModal.jsx
import React, { useState, useEffect } from "react";
import { X, Camera, User } from "lucide-react";
import { userProfileAPI, updateUserAPI } from "@/services/apiUser";
import { useAuth } from "@/context/authContext";

const ProfileModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
    avatarFile: null,
    gender: "Male", // mặc định
    level: "Low", // mặc định
  });
  const { user } = useAuth();
  const [errors, setErrors] = useState({});

  // ✅ Load thông tin user
  useEffect(() => {
    if (isOpen && user.idUser) {
      userProfileAPI(user.idUser)
        .then((res) => {
          const data = res.data;
          setFormData((prev) => ({
            ...prev,
            fullName: data.nameUser || "",
            email: data.email || "",
            phone: data.phoneNumber || "",
            address: data.address || "",
            avatar: data.avatar || "",
            avatarFile: null,
            gender: data.gender || "Male",
            level: data.level || "Low",
          }));
        })
        .catch((err) => {
          console.error("Lỗi load user:", err);
        });
    }
  }, [isOpen, user.idUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const form = new FormData();
      form.append("nameUser", formData.fullName);
      form.append("email", formData.email);
      form.append("phoneNumber", formData.phone);
      form.append("address", formData.address);
      form.append("gender", formData.gender);
      form.append("level", formData.level);

      if (formData.avatarFile) {
        form.append("avatar", formData.avatarFile);
      }

      await updateUserAPI(user.idUser, form);

      alert("Cập nhật thông tin thành công!");
      onClose();
    } catch (error) {
      console.error("Lỗi cập nhật thông tin:", error);
      console.log("Dữ liệu gửi đi:", formData);
      alert("Có lỗi xảy ra khi cập nhật.");
    }
  };

  // ✅ Avatar preview
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        avatarFile: file,
      }));
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData((prev) => ({
          ...prev,
          avatar: ev.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Thông tin cá nhân
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {formData.avatar ? (
                  <img
                    src={formData.avatar || null}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giới tính
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trình độ
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trình độ
              </label>
              {/* SỬA TẠI ĐÂY: Thay button bằng input */}
              <div className="w-full px-3 py-2 border bg-slate-100 text-gray-600 border-gray-300 rounded-md select-none">
                {formData.level}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
