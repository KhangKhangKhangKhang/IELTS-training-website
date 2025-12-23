// ProfileModal.jsx
import React, { useState, useEffect } from "react";
import {
  X,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  CheckCircle,
  Loader2, // Icon xoay khi loading
} from "lucide-react";
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
    gender: "Male",
    level: "Low",
  });

  const { user } = useAuth();
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Load thông tin user khi mở modal
  useEffect(() => {
    if (isOpen && user?.idUser) {
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
  }, [isOpen, user?.idUser]);

  // ✅ Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // --- LOGIC PHONE: Chỉ số & 9-12 ký tự ---
    if (name === "phone") {
      // 1. Chỉ lấy số
      const numericValue = value.replace(/[^0-9]/g, "");

      // 2. Chặn nhập quá 12 số (Input không thay đổi nếu quá 12)
      if (numericValue.length > 12) return;

      newValue = numericValue;
    }
    // ----------------------------------------

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Xóa lỗi ngay khi người dùng nhập lại
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Validate trước khi submit
  const validateForm = () => {
    const newErrors = {};

    // Validate Email
    if (!formData.email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // Validate Phone (Độ dài tối thiểu 9)
    if (formData.phone && formData.phone.length < 9) {
      newErrors.phone = "Số điện thoại phải từ 9 đến 12 số";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true); // Bắt đầu loading

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
      alert("Có lỗi xảy ra khi cập nhật.");
    } finally {
      setIsLoading(false); // Tắt loading dù thành công hay thất bại
    }
  };

  // ✅ Avatar preview
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Vui lòng chọn file ảnh hợp lệ");
        return;
      }
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

  if (!isOpen) return null;

  return (
    // Backdrop mờ
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto transform transition-all scale-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Thông tin cá nhân
            </h2>
            <p className="text-sm text-gray-500">Cập nhật hồ sơ của bạn</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <User className="h-14 w-14" />
                  </div>
                )}
              </div>

              <label
                htmlFor="avatar-upload"
                className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-all hover:scale-110 active:scale-95 border-2 border-white"
                title="Đổi ảnh đại diện"
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

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Nhập họ tên"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Email & Phone - Grid 2 cột */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <span className="mr-1">⚠</span> {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text" // Dùng text để regex hoạt động mượt hơn number
                    name="phone"
                    placeholder="9-12 số"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.phone
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <span className="mr-1">⚠</span> {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Địa chỉ
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Gender & Level - Grid 2 cột */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Giới tính
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Hạng thành viên
                </label>
                <div className="w-full px-4 py-2.5 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg flex items-center font-medium select-none">
                  <Award className="h-5 w-5 mr-2 text-blue-600" />
                  {formData.level}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm disabled:opacity-70"
            >
              Huỷ bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
