import React, { useEffect, useState, useRef } from "react";
import { Flame, Trophy, CalendarDays, X } from "lucide-react";
import { getStreakAPI } from "@/services/apiUser";
import { useAuth } from "@/context/authContext";

const StreakWidget = () => {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    isActive: false, // True nếu đã học hôm nay
    loading: true,
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  // Xử lý click ra ngoài để đóng popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hàm gọi API lấy dữ liệu Streak
  const fetchStreak = async () => {
    if (!user || !user.idUser) {
      setStreakData((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      const res = await getStreakAPI(user.idUser);

      if (res && res.data) {
        const { lastStudiedAt, currentStreak, longestStreak } = res.data;

        // Logic so sánh ngày (bỏ qua giờ phút)
        const lastStudyDate = lastStudiedAt
          ? new Date(lastStudiedAt).toDateString()
          : "";
        const today = new Date().toDateString();
        const isStudiedToday = lastStudyDate === today;

        setStreakData({
          currentStreak: currentStreak || 0,
          longestStreak: longestStreak || 0,
          isActive: isStudiedToday,
          loading: false,
        });
      } else {
        setStreakData((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Failed to fetch streak:", error);
      setStreakData((prev) => ({ ...prev, loading: false }));
    }
  };

  // Effect chính: Gọi API lần đầu & Lắng nghe sự kiện update từ Reading.jsx
  useEffect(() => {
    // 1. Gọi ngay khi mount
    fetchStreak();

    // 2. Hàm xử lý khi bắt được sự kiện "streak-update"
    const handleStreakUpdate = () => {
      console.log(
        "🔥 StreakWidget: Nhận tín hiệu nộp bài xong, đang cập nhật..."
      );
      fetchStreak();
    };

    // 3. Đăng ký lắng nghe
    window.addEventListener("streak-update", handleStreakUpdate);

    // 4. Dọn dẹp
    return () => {
      window.removeEventListener("streak-update", handleStreakUpdate);
    };
  }, [user]); // Chạy lại nếu user thay đổi

  // Render Skeleton khi đang tải
  if (streakData.loading) {
    return (
      <div className="animate-pulse bg-slate-800 h-9 w-16 rounded-full border border-slate-700 mx-2" />
    );
  }

  // Nếu chưa login thì ẩn
  if (!user) return null;

  return (
    <div className="relative mx-2" ref={dropdownRef}>
      {/* --- BUTTON CHÍNH (LỬA) --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full border transition-all duration-300 relative z-50 ${
          streakData.isActive
            ? "bg-orange-950/30 border-orange-500/50 text-orange-500 hover:bg-orange-900/40 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
            : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        }`}
      >
        <div className="relative">
          <Flame
            className={`h-5 w-5 transition-all duration-500 ${
              streakData.isActive
                ? "fill-orange-500 text-orange-600 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse"
                : "fill-transparent text-slate-500"
            }`}
          />
          {streakData.isActive && (
            <span className="absolute -top-1 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
            </span>
          )}
        </div>
        <span
          className={`font-bold text-sm ${
            streakData.isActive ? "text-orange-400" : "text-slate-400"
          }`}
        >
          {streakData.currentStreak}
        </span>
      </button>

      {/* --- POPUP CHI TIẾT --- */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-0 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-white/10">
          {/* Header */}
          <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-slate-200 font-semibold text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-400" />
              Thành tích học tập
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Hàng 1: Chuỗi hiện tại */}
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700/50 group hover:border-orange-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    streakData.isActive ? "bg-orange-500/20" : "bg-slate-700"
                  }`}
                >
                  <Flame
                    className={`h-6 w-6 ${
                      streakData.isActive
                        ? "text-orange-500 fill-orange-500"
                        : "text-slate-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    Hiện tại
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      streakData.isActive ? "text-orange-400" : "text-slate-300"
                    }`}
                  >
                    {streakData.currentStreak} ngày
                  </p>
                </div>
              </div>
            </div>

            {/* Hàng 2: Chuỗi dài nhất */}
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700/50 group hover:border-yellow-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <Trophy className="h-6 w-6 text-yellow-500 fill-yellow-500/50" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    Kỷ lục
                  </p>
                  <p className="text-lg font-bold text-yellow-400">
                    {streakData.longestStreak} ngày
                  </p>
                </div>
              </div>
            </div>

            {/* Thông điệp */}
            <div
              className={`text-center text-xs py-2 px-3 rounded-md ${
                streakData.isActive
                  ? "bg-green-500/10 text-green-400"
                  : "bg-slate-800 text-slate-400 italic"
              }`}
            >
              {streakData.isActive
                ? "Tuyệt vời! Bạn đã hoàn thành mục tiêu hôm nay. 🎉"
                : "Hãy ôn tập ngay để giữ lửa không bị tắt nhé! 🔥"}
            </div>
          </div>

          {/* Mũi tên trang trí */}
          <div className="absolute -top-1.5 right-4 w-3 h-3 bg-slate-800 border-t border-l border-slate-700 rotate-45 z-0"></div>
        </div>
      )}
    </div>
  );
};

export default StreakWidget;
