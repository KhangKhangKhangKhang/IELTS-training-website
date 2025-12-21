import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, BookOpen, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import API from "@/services/axios.custom";
import { loginAPI } from "@/services/apiAuth";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/authContext";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAuth();

  const handleGoogleLogin = () => {
    const baseURL = API.defaults.baseURL;
    window.location.href = `${baseURL}/auth/google/login`;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userParam = urlParams.get("user");
    const refreshToken = urlParams.get("refreshToken");

    if (token && userParam) {
      const user = JSON.parse(decodeURIComponent(userParam));
      Cookies.set("accessToken", token);
      Cookies.set("user", JSON.stringify(user));
      Cookies.set("refreshToken", refreshToken);
      setUser(user);
      setIsAuth(true);
      navigate("/");
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
      const token = res?.data?.data?.access_token;
      const user = res?.data?.data?.user;

      if (token) {
        Cookies.set("accessToken", token);
        Cookies.set("user", JSON.stringify(user));
        Cookies.set("refreshToken", res?.data?.data?.refresh_token);
        setUser(user);
        setIsAuth(true);
        navigate("/");
      } else {
        alert("Login thất bại: không tìm thấy token");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4"
          >
            <BookOpen className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">AIELTS</h1>
          <p className="text-slate-400 text-sm">Đăng nhập để tiếp tục học tập</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Đăng nhập</h2>
            <p className="text-slate-400 mt-1 text-sm">
              Chào mừng bạn quay trở lại!
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-medium">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="pl-10 pr-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <span
                className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
                onClick={() => navigate("/forgetPassword")}
              >
                Quên mật khẩu?
              </span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
            >
              Đăng nhập
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-800/50 px-3 text-slate-400">Hoặc</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full h-11 bg-white hover:bg-gray-100 text-slate-800 font-medium rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Đăng nhập với Google
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-slate-400 mt-6">
            Chưa có tài khoản?{" "}
            <span
              className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition-colors"
              onClick={() => navigate("/signUp")}
            >
              Đăng ký ngay
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
