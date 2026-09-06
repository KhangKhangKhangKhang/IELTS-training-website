import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSubscription } from "../../context/SubscriptionContext";
import { useAuth } from "../../context/authContext";

const daysRemaining = (iso) => {
  if (!iso) return 0;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
};

const SubscriptionNavbarButton = () => {
  const navigate = useNavigate();
  const { isAuth } = useAuth();
  const { subscription, loading } = useSubscription();

  if (!isAuth) return null;

  const goToSubscription = () => navigate("/subscription");

  if (loading && !subscription) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-400 text-sm font-extrabold uppercase tracking-wide"
      >
        Pro
      </button>
    );
  }

  if (subscription) {
    const n = daysRemaining(subscription.expiresAt);
    return (
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ y: 1 }}
        onClick={goToSubscription}
        className="px-4 py-2 rounded-2xl bg-gradient-to-br from-[#fb7185] to-[#f59e0b] shadow-[0_4px_0_#b45309] text-white text-sm font-extrabold flex items-center gap-2"
        title="Quản lý gói Pro"
      >
        <span className="leading-none">🔥</span>
        <span className="leading-none">Pro · còn {n} ngày</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ y: 1 }}
      onClick={goToSubscription}
      className="px-5 py-2.5 rounded-2xl bg-gradient-to-br from-[#fb7185] to-[#f59e0b] shadow-[0_4px_0_#b45309] text-white text-sm font-extrabold uppercase tracking-wide"
    >
      Nâng cấp Pro
    </motion.button>
  );
};

export default SubscriptionNavbarButton;