import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Spin } from "antd";
import { toast } from "react-toastify";
import {
  getPackagesAPI,
  subscribeAPI,
  cancelSubscriptionAPI,
} from "../../services/apiSubscription";
import { useSubscription } from "../../context/SubscriptionContext";

const formatVND = (n) =>
  new Intl.NumberFormat("vi-VN").format(n) + "đ";

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { subscription, refresh } = useSubscription();
  const [packages, setPackages] = useState([]);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getPackagesAPI();
        if (alive) setPackages(data);
      } catch {
        toast.error("Không tải được danh sách gói");
      } finally {
        if (alive) setLoadingPkgs(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleSubscribe = async (pkg) => {
    setPending(pkg);
    try {
      const { paymentUrl } = await subscribeAPI({ idPackage: pkg.idPackage });
      if (!paymentUrl) throw new Error("No paymentUrl");
      window.location.href = paymentUrl;
    } catch (e) {
      toast.error("Không thể tạo thanh toán, thử lại");
      setPending(null);
    }
  };

  const handleCancel = async () => {
    Modal.confirm({
      title: "Huỷ gói Pro?",
      content: "Gói sẽ bị huỷ ngay. Bạn vẫn dùng được đến hết chu kỳ hiện tại.",
      okText: "Huỷ gói",
      cancelText: "Đóng",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelSubscriptionAPI();
          toast.success("Đã huỷ gói");
          await refresh();
        } catch {
          toast.error("Huỷ thất bại, thử lại");
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-white to-[#fff1f2] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl lg:text-5xl font-black text-[#1e1b4b] mb-2">Chọn gói phù hợp với bạn</h1>
        <p className="text-[#64748b] mb-10">Mở khoá toàn bộ đề Cambridge, AI Speaking với band realtime và hơn thế nữa.</p>

        {loadingPkgs ? (
          <div className="flex justify-center py-20"><Spin size="large" /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {packages.map((pkg) => {
              const isCurrent = subscription?.idPackage === pkg.idPackage;
              const hasOther = !!subscription && !isCurrent;
              const isLoading = pending?.idPackage === pkg.idPackage;
              return (
                <div
                  key={pkg.idPackage}
                  className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_5px_0_#e6e6ed] p-6 flex flex-col"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-1">
                    {pkg.billingCycle === "MONTHLY" ? "Hàng tháng" : "Hàng năm"}
                  </div>
                  <div className="text-2xl font-black text-[#1e1b4b] mb-1">{pkg.name}</div>
                  {pkg.description && (
                    <div className="text-sm text-[#64748b] mb-4">{pkg.description}</div>
                  )}
                  <div className="text-3xl font-black text-[#1e1b4b] mb-1">{formatVND(pkg.price)}</div>
                  <div className="text-xs text-[#64748b] mb-4">
                    {pkg.creditsQuota} credits / chu kỳ
                  </div>
                  {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                    <ul className="space-y-2 mb-6 flex-1">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#1e1b4b]">
                          <span className="text-[#10b981] font-black">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    disabled={isCurrent || hasOther || isLoading}
                    onClick={() => handleSubscribe(pkg)}
                    className={`w-full px-4 py-3 rounded-2xl font-extrabold uppercase tracking-wide text-sm transition-all ${
                      isCurrent
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : hasOther
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-br from-[#fb7185] to-[#f59e0b] text-white shadow-[0_4px_0_#b45309] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#b45309]"
                    }`}
                  >
                    {isLoading ? "Đang chuyển..." : isCurrent ? "Đang dùng" : hasOther ? "Huỷ gói hiện tại để đổi" : "Đăng ký"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {subscription && (
          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_5px_0_#e6e6ed] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1]">
                  Gói hiện tại
                </div>
                <div className="text-2xl font-black text-[#1e1b4b]">
                  🔥 {subscription.package?.name ?? "Pro"}
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-2xl border-2 border-[#fb7185] text-[#fb7185] font-extrabold text-sm hover:bg-[#fff1f2]"
              >
                Huỷ gói
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-[#64748b] text-xs font-bold uppercase">Bắt đầu</div>
                <div className="font-extrabold text-[#1e1b4b]">
                  {new Date(subscription.startedAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
              <div>
                <div className="text-[#64748b] text-xs font-bold uppercase">Hết hạn</div>
                <div className="font-extrabold text-[#1e1b4b]">
                  {new Date(subscription.expiresAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
              <div>
                <div className="text-[#64748b] text-xs font-bold uppercase">Credits</div>
                <div className="font-extrabold text-[#1e1b4b]">
                  {subscription.creditsUsedThisPeriod} / {subscription.creditsQuotaThisPeriod}
                </div>
                <div className="mt-2 h-2 bg-[#eef2ff] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#fb7185] to-[#f59e0b]"
                    style={{
                      width: `${Math.min(100, Math.round(
                        (subscription.creditsUsedThisPeriod / Math.max(1, subscription.creditsQuotaThisPeriod)) * 100
                      ))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;