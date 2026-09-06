// Pages/client/auth/OTP.jsx
// UI adapted from MagicPath "IELTS Auth Screens" · Logic/API calls preserved.
// Used by both signup-flow (mode="OTP") and forgot-flow (mode="RESET_LINK").
import React, { useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import {
  verifyOtpAPI,
  resendOtpAPI,
  resetPasswordOTP,
} from "@/services/apiAuth";
import AuthShell from "@/components/auth/AuthShell";
import {
  AuthButton,
  OtpBoxes,
  ProgressDots,
  maskEmail,
  fmtTime,
} from "@/components/auth/AuthPrimitives";

const OTP = () => {
  const [otp, setOtp] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendIn, setResendIn] = useState(18);
  const [expiresIn, setExpiresIn] = useState(263);
  const location = useLocation();
  const email = location.state?.email || "";
  const mode = location.state?.mode || "OTP";
  const navigate = useNavigate();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  useEffect(() => {
    if (expiresIn <= 0) return;
    const t = setInterval(
      () => setExpiresIn((r) => Math.max(0, r - 1)),
      1000
    );
    return () => clearInterval(t);
  }, [expiresIn]);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      alert("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    if (mode === "OTP") {
      try {
        const response = await verifyOtpAPI({ email, otp });
        console.log("OTP verified successfully:", response);
        navigate("/login");
      } catch (error) {
        console.error("Error verifying OTP:", error);
        alert("OTP không hợp lệ. Vui lòng thử lại.");
      }
    } else {
      try {
        const response = await resetPasswordOTP({ email, otp });
        navigate("/newpassword", { state: { email, otp } });
        console.log("Reset OTP verified successfully:", response);
      } catch (error) {
        console.error("Error verifying reset OTP:", error);
        alert("OTP không hợp lệ. Vui lòng thử lại.");
      }
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      if (mode === "OTP") {
        await resendOtpAPI({ email });
      } else {
        await resendOtpAPI({ email, type: "RESET_LINK" });
      }
      alert("Đã gửi lại mã OTP!");
      setResendIn(18);
    } catch (error) {
      console.error("Error resending OTP:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsResending(false);
    }
  };

  const title =
    mode === "OTP"
      ? "Bước 3 · Xác minh email sau signup"
      : "Bước 2/3 · Nhập OTP";
  const icon = mode === "OTP" ? "📬" : "🔑";
  const backTarget = mode === "OTP" ? "/signup" : "/forgetPassword";

  return (
    <AuthShell title={title} icon={icon}>
      <Motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => navigate(backTarget)}
            className="text-xs font-bold text-[#64748b] hover:text-[#1e1b4b] flex items-center gap-1"
          >
            ← {mode === "OTP" ? "Đổi email khác" : "Đổi email"}
          </button>

          <div className="text-center">
            <Motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-5xl inline-block mb-3"
            >
              {icon}
            </Motion.div>
            <h1
              className="text-3xl font-black text-[#1e1b4b] mb-1"
              style={{ fontFamily: "Nunito" }}
            >
              {mode === "OTP" ? "Kiểm tra email" : "Nhập mã OTP"}
            </h1>
            <p className="text-sm text-[#64748b]">
              Mã 6 chữ số đã gửi tới
              <br />
              <span className="font-extrabold text-[#1e1b4b]">
                {maskEmail(email)}
              </span>
            </p>
          </div>

          {mode !== "OTP" && <ProgressDots current={1} total={3} />}

          <div className="space-y-4">
            <OtpBoxes value={otp} onChange={setOtp} maxLength={6} />

            <div className="bg-[#fef3c7] border-2 border-[#f59e0b]/30 rounded-2xl p-3 flex items-center gap-2.5">
              <div className="text-xl">⏰</div>
              <div className="flex-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309]">
                  Mã hết hạn sau
                </div>
                <div className="font-mono font-black text-sm text-[#1e1b4b]">
                  {fmtTime(expiresIn)}
                </div>
              </div>
            </div>

            <AuthButton
              tone="indigo"
              size="lg"
              className="w-full"
              disabled={otp.length !== 6}
              onClick={handleVerifyOtp}
            >
              ✓ Xác minh
            </AuthButton>

            <div className="text-center text-xs">
              <span className="text-[#64748b]">
                Không nhận được mã?{" "}
              </span>
              {resendIn > 0 || isResending ? (
                <span className="font-bold text-[#94a3b8] inline-flex items-center gap-1">
                  {isResending && (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  )}
                  Gửi lại sau 0:{String(resendIn).padStart(2, "0")}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-extrabold text-[#6366f1] hover:underline"
                >
                  Gửi lại mã
                </button>
              )}
            </div>
          </div>
        </div>
      </Motion.div>
    </AuthShell>
  );
};

export default OTP;
