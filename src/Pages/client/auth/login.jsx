import { Card } from "@/components/ui/card";
import React, { use, useEffect } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import API from "@/services/axios.custom";
import { loginAPI } from "@/services/apiAuth";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/authContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAuth();

  const handleGoogleLogin = () => {
    const baseURL = API.defaults.baseURL; // 👈 lấy lại baseURL
    window.location.href = `${baseURL}/auth/google/login`;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userParam = urlParams.get("user");

    if (token && userParam) {
      const user = JSON.parse(decodeURIComponent(userParam));
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));
      console.log("user:", user);
      console.log("token:", token);

      navigate("/");
      setUser(user);
      setIsAuth(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      const res = await loginAPI({ email, password });
      console.log("Login response:", res);

      const token = res?.data?.data?.access_token;
      const user = res?.data?.data?.user;

      if (token) {
        localStorage.setItem("accessToken", token); // 🚀 thống nhất dùng accessToken
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        setIsAuth(true);
        navigate("/");
        setUser(user);
        setIsAuth(true);
      } else {
        alert("Login thất bại: không tìm thấy token");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
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
              <h2 className="text-3xl font-bold text-gray-800">Đăng nhập</h2>
              <p className="text-gray-600 mt-2">
                Đăng nhập để sử dụng được nhiều tính năng hơn
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              {
                // input email
              }
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
              <div className="space-y-2 ">
                <label className="block text-gray-700 mb-2" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    placeholder="Nhập mật khẩu của bạn"
                    required
                  />
                </div>
              </div>

              <div className=" flex justify-end items-end">
                <p
                  className="text-sm text-gray-600 hover:text-primary hover:underline cursor-pointer"
                  onClick={() => navigate("/forgetPassword")}
                >
                  Quên mật khẩu?
                </p>
              </div>
              <div>
                <Button type="submit" className="w-full h-10">
                  Đăng nhập
                </Button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Hoặc </span>
              </div>
            </div>

            <div>
              <button
                onClick={handleGoogleLogin}
                className="w-full h-10 py-3 bg-white text-primary font-semibold border border-gray-300 rounded-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google Logo"
                  className="w-5 h-5"
                />
                <span>Đăng nhập với Google</span>
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-gray-600">
                Chưa có tài khoản?{" "}
                <span
                  className="text-primary font-semibold hover:underline cursor-pointer"
                  onClick={() => navigate("/signUp")}
                >
                  Đăng ký
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
