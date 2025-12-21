import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Shield, RefreshCw } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { verifyOtpAPI, resendOtpAPI, resetPasswordOTP } from "@/services/apiAuth";
import { Button } from "@/components/ui/button";

const OTP = () => {
  const [otp, setOtp] = useState("");
  const [isResending, setIsResending] = useState(false);
  const location = useLocation();
  const email = location.state?.email || "";
  const mode = location.state?.mode || "OTP";
  const navigate = useNavigate();

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
        await resendOtpAPI({ email, type: "RESET_PASSWORD" });
      }
      alert("Đã gửi lại mã OTP!");
    } catch (error) {
      console.error("Error resending OTP:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsResending(false);
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
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Xác thực OTP</h1>
          <p className="text-slate-400 text-sm">Bảo mật tài khoản của bạn</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">Nhập mã xác thực</h2>
            <p className="text-slate-400 mt-1 text-sm">
              Mã OTP 6 số đã được gửi đến email
            </p>
            <p className="text-blue-400 text-sm font-medium mt-1">{email}</p>
          </div>

          {/* OTP Input */}
          <div className="flex justify-center mb-6">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
              className="gap-2"
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="w-12 h-14 text-xl font-bold bg-slate-900/50 border-slate-600 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleVerifyOtp}
            disabled={otp.length !== 6}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận
          </Button>

          {/* Resend OTP */}
          <div className="text-center mt-6">
            <p className="text-slate-400 text-sm">
              Chưa nhận được mã?{" "}
              <button
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {isResending && <RefreshCw className="w-4 h-4 animate-spin" />}
                Gửi lại
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OTP;
