import { Card } from "@/components/ui/card";
import React from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { signupAPI } from "@/services/apiAuth";
import { useNavigate } from "react-router";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSIgnUp = async (e) => {
    e.preventDefault(); // 🚀 chặn reload trang
    if (!email || !password || !confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      alert("Mật khẩu không khớp");
      return;
    }
    try {
      const res = await signupAPI({ email, password, confirmPassword });
      if (res) {
        navigate("/otp", { state: { email } });
      }
    } catch (error) {
      console.error("Sign up failed:", error);
    }
  };
  return (
    <>
      <div className="flex justify-center items-center  min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md "
        >
          <div className="bg-white p-8 rounded-lg shadow-xl space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Đăng ký</h2>
              <p className="text-gray-600 mt-2">
                Đăng ký để tạo tài khoản mới.
              </p>
            </div>
            <form onSubmit={handleSIgnUp} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  required
                ></Input>
              </div>
              {
                // input password
              }
              {/* Password */}
              <div className="space-y-2">
                <label className="block text-gray-700 mb-2" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label
                  className="block text-gray-700 mb-2"
                  htmlFor="confirm-password"
                >
                  Nhập lại mật khẩu
                </label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu của bạn"
                    required
                  />
                </div>
              </div>

              {
                // link đăng nhập
              }
              <div className=" flex justify-end items-end">
                <p
                  className="text-sm text-gray-600 hover:text-primary hover:underline cursor-pointer"
                  onClick={() => navigate("/login")}
                >
                  Đã có tài khoản?
                </p>
              </div>
              <div>
                {
                  // button đăng ký
                }
                <Button type="submit" className="w-full h-10">
                  Đăng ký
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
};
export default SignUp;
