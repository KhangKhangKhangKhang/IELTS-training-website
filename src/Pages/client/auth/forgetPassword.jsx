// Pages/client/auth/forgetPassword.jsx
// UI adapted from MagicPath "IELTS Auth Screens" (forgot-email screen)
// Logic/API calls preserved.
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { forgetPasswordAPI } from "@/services/apiAuth";
import { useNavigate } from "react-router";
import AuthShell from "@/components/auth/AuthShell";
import {
  AuthInput,
  AuthButton,
  ProgressDots,
} from "@/components/auth/AuthPrimitives";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleForgetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      alert("Vui lòng nhập email");
      return;
    }
    try {
      const res = await forgetPasswordAPI({ email });
      if (res) {
        navigate("/otp", { state: { email, mode: "RESET_LINK" } });
      }
    } catch (error) {
      console.error("Error sending reset email:", error);
    }
  };

  return (
    <AuthShell title="Bước 1/3 · Quên mật khẩu" icon="🔑">
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
              🔑 Quên mật khẩu?
            </h1>
            <p className="text-sm text-[#64748b]">
              Nhập email — chúng tôi sẽ gửi mã OTP để đặt lại
            </p>
          </div>

          <ProgressDots current={0} total={3} />

          <form onSubmit={handleForgetPassword} className="space-y-4">
            <AuthInput
              label="Email đã đăng ký"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4 text-[#64748b]" />}
              value={email}
              onChange={setEmail}
              autoFocus
            />

            <AuthButton
              tone="indigo"
              size="lg"
              type="submit"
              className="w-full"
              disabled={!email}
            >
              Gửi mã OTP →
            </AuthButton>

            <div className="text-center text-xs text-[#64748b]">
              Nhớ mật khẩu rồi?{" "}
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

export default ForgetPassword;
