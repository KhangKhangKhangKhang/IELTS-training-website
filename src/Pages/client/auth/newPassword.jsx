// Pages/client/auth/newPassword.jsx
// UI adapted from MagicPath "IELTS Auth Screens" (forgot-reset screen)
// Logic/API calls preserved.
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";
import { resetPasswordAPI } from "@/services/apiAuth";
import { useNavigate, useLocation } from "react-router";
import AuthShell from "@/components/auth/AuthShell";
import {
  AuthInput,
  AuthButton,
  ProgressDots,
} from "@/components/auth/AuthPrimitives";

const scorePassword = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

const NewPassword = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const otp = location.state?.otp || "";

  const handleNewPassword = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      alert("Mật khẩu không khớp");
      return;
    }
    try {
      const res = await resetPasswordAPI({
        email,
        otp,
        password,
        confirmPassword,
      });
      if (res) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const score = scorePassword(password);
  const rules = [
    { ok: password.length >= 8, label: "Ít nhất 8 ký tự" },
    {
      ok: /[A-Z]/.test(password) && /[a-z]/.test(password),
      label: "Chữ hoa và chữ thường",
    },
    { ok: /\d/.test(password), label: "Có số" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "Ký tự đặc biệt (!@#$)" },
  ];
  const canSubmit =
    password && password === confirmPassword && score >= 2;

  return (
    <AuthShell title="Bước 3/3 · Đặt mật khẩu mới" icon="🔐">
      <motion.div
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
              🔐 Đặt mật khẩu mới
            </h1>
            <p className="text-sm text-[#64748b]">
              Tạo mật khẩu mạnh, dễ nhớ
            </p>
          </div>

          <ProgressDots current={2} total={3} />

          <form onSubmit={handleNewPassword} className="space-y-4">
            <AuthInput
              label="Mật khẩu mới"
              type={showPassword ? "text" : "password"}
              placeholder="Tối thiểu 8 ký tự"
              icon={<Lock className="w-4 h-4 text-[#64748b]" />}
              value={password}
              onChange={setPassword}
              autoFocus
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
              placeholder="Nhập lại"
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

            <div className="bg-[#eef2ff] border-2 border-[#a5b4fc]/40 rounded-2xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#4338ca] mb-2">
                Yêu cầu
              </div>
              <ul className="space-y-1 text-xs">
                {rules.map((r) => (
                  <li
                    key={r.label}
                    className={`flex items-center gap-2 font-bold ${
                      r.ok ? "text-[#047857]" : "text-[#64748b]"
                    }`}
                  >
                    <span>{r.ok ? "✓" : "○"}</span>
                    <span>{r.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <AuthButton
              tone="indigo"
              size="lg"
              type="submit"
              className="w-full"
              disabled={!canSubmit}
            >
              🔐 Đặt lại mật khẩu
            </AuthButton>
          </form>
        </div>
      </motion.div>
    </AuthShell>
  );
};

export default NewPassword;
