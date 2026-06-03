// Pages/client/auth/signUp.jsx
// UI adapted from MagicPath "IELTS Auth Screens" · Logic/API calls preserved.
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { signupAPI } from "@/services/apiAuth";
import { useNavigate } from "react-router";
import AuthShell from "@/components/auth/AuthShell";
import { AuthInput, AuthButton } from "@/components/auth/AuthPrimitives";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
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
    <AuthShell title="Bước 2 · Signup flow" icon="🎉">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-xs font-bold text-[#64748b] hover:text-[#1e1b4b] flex items-center gap-1"
          >
            ← Quay lại đăng nhập
          </button>

          <div>
            <h1
              className="text-3xl font-black text-[#1e1b4b] mb-1"
              style={{ fontFamily: "Nunito" }}
            >
              Bắt đầu hành trình 🎉
            </h1>
            <p className="text-sm text-[#64748b]">
              7 ngày dùng thử miễn phí · Không cần thẻ
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
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
              placeholder="Tạo mật khẩu mạnh"
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

            <AuthInput
              label="Xác nhận mật khẩu"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              icon={<Lock className="w-4 h-4 text-[#64748b]" />}
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={
                confirmPassword && confirmPassword !== password
                  ? "Mật khẩu không khớp"
                  : undefined
              }
              hint={
                confirmPassword && confirmPassword === password
                  ? "Mật khẩu khớp ✓"
                  : undefined
              }
            />

            <label className="flex items-start gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setAgreed(!agreed)}
                className={`w-4 h-4 rounded-md flex items-center justify-center text-white text-[10px] mt-0.5 flex-none transition-colors ${
                  agreed ? "bg-[#6366f1]" : "bg-white border-2 border-[#e6e6ed]"
                }`}
              >
                {agreed && "✓"}
              </button>
              <span className="text-xs text-[#64748b] leading-relaxed">
                Tôi đồng ý với{" "}
                <a className="font-extrabold text-[#6366f1] hover:underline cursor-pointer">
                  Điều khoản
                </a>{" "}
                và{" "}
                <a className="font-extrabold text-[#6366f1] hover:underline cursor-pointer">
                  Chính sách bảo mật
                </a>
              </span>
            </label>

            <AuthButton
              tone="coral"
              size="lg"
              type="submit"
              className="w-full"
              disabled={!agreed}
            >
              🎉 Tạo tài khoản &amp; gửi OTP
            </AuthButton>

            <div className="text-center text-xs text-[#64748b]">
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-extrabold text-[#6366f1] hover:underline"
              >
                Đăng nhập
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </AuthShell>
  );
};

export default SignUp;
