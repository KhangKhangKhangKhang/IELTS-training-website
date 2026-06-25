import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSubscription } from "../../context/SubscriptionContext";

const SubscriptionReturn = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useSubscription();
  const [countdown, setCountdown] = useState(3);

  const code = params.get("vnp_ResponseCode");
  const success = code === "00";

  useEffect(() => {
    refresh();
    if (!success) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          navigate("/subscription", { replace: true });
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [success, refresh, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#eef2ff] via-white to-[#fff1f2]">
      <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_5px_0_#e6e6ed] p-8 max-w-md w-full text-center">
        <div className={`text-6xl mb-4 ${success ? "" : "opacity-60"}`}>
          {success ? "✅" : "❌"}
        </div>
        <h1 className="text-2xl font-black text-[#1e1b4b] mb-2">
          {success ? "Thanh toán thành công!" : "Thanh toán thất bại"}
        </h1>
        <p className="text-[#64748b] mb-6">
          {success
            ? "Gói của bạn đã được kích hoạt. Đang chuyển về trang gói..."
            : code
              ? `Mã phản hồi: ${code}. Vui lòng thử lại hoặc liên hệ hỗ trợ.`
              : "Không nhận được phản hồi từ VNPay. Vui lòng kiểm tra trong mục Gói."}
        </p>
        {success ? (
          <div className="text-sm text-[#64748b]">
            Tự chuyển sau {countdown}s...
          </div>
        ) : (
          <div className="flex gap-3 justify-center">
            <Link
              to="/subscription"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-br from-[#fb7185] to-[#f59e0b] text-white font-extrabold text-sm shadow-[0_4px_0_#b45309]"
            >
              Thử lại
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-2xl border-2 border-[#e6e6ed] text-[#1e1b4b] font-extrabold text-sm"
            >
              Về trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionReturn;
