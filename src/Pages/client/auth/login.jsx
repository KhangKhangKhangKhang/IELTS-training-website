// Pages/client/auth/login.jsx
// UI adapted from MagicPath "IELTS Auth Screens" · Logic/API calls preserved as-is.
import React, { useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import API from "@/services/axios.custom";
import { loginAPI } from "@/services/apiAuth";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/authContext";
import Cookies from "js-cookie";
import AuthShell from "@/components/auth/AuthShell";
import { AuthInput, AuthButton, SocialButton } from "@/components/auth/AuthPrimitives";

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
      if (refreshToken) {
        Cookies.set("refreshToken", refreshToken);
      }
      setUser(user);
      setIsAuth(true);
      navigate("/");
    }
  }, [navigate, setIsAuth, setUser]);

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
    <AuthShell title="Bước 1 · Login flow" icon="📘">
      <Motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="space-y-5">
          <div>
            <h1
              className="text-3xl font-black text-[#1e1b4b] mb-1"
              style={{ fontFamily: "Nunito" }}
            >
              Chào mừng quay lại!
            </h1>
            <p className="text-sm text-[#64748b]">
              Đăng nhập để tiếp tục giữ streak 🔥
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <AuthInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4 text-[#64748b]" />}
              value={email}
              onChange={setEmail}
            />

            <AuthInput
              label="Mật khẩu"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4 text-[#64748b]" />}
              value={password}
              onChange={setPassword}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 text-[#64748b] hover:text-[#1e1b4b]"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="w-4 h-4 rounded-md bg-[#6366f1] flex items-center justify-center text-white text-[10px]">
                  ✓
                </div>
                <span className="font-bold text-[#1e1b4b]">Ghi nhớ tôi</span>
              </label>
              <button
                type="button"
                onClick={() => navigate("/forgetPassword")}
                className="font-extrabold text-[#6366f1] hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <AuthButton tone="indigo" size="lg" type="submit" className="w-full">
              🚀 Đăng nhập
            </AuthButton>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#e6e6ed]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                Hoặc
              </span>
              <div className="flex-1 h-px bg-[#e6e6ed]" />
            </div>

            <div className="flex gap-2">
              <SocialButton
                icon={
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    loading="lazy"
                    className="w-5 h-5"
                  />
                }
                label="Google"
                onClick={handleGoogleLogin}
              />
              <SocialButton icon="📘" label="Facebook" />
            </div>

            <div className="text-center text-xs text-[#64748b] pt-2">
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="font-extrabold text-[#6366f1] hover:underline"
              >
                Đăng ký miễn phí
              </button>
            </div>
          </form>
        </div>
      </Motion.div>
    </AuthShell>
  );
};

export default Login;
