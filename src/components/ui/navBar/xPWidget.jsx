import React, { useEffect, useState, useRef } from "react";
import { Zap, TrendingUp, Star, X } from "lucide-react";
import { userProfileAPI } from "@/services/apiUser";
import { useAuth } from "@/context/authContext";

const XpWidget = () => {
    const [xpData, setXpData] = useState({
        xp: 0,
        xpToNext: 100,
        level: "Low",
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

    // Hàm gọi API lấy dữ liệu XP
    const fetchXp = async () => {
        if (!user || !user.idUser) {
            setXpData((prev) => ({ ...prev, loading: false }));
            return;
        }

        try {
            const res = await userProfileAPI(user.idUser);

            if (res && res.data) {
                const { xp, xpToNext, level } = res.data;

                setXpData({
                    xp: xp || 0,
                    xpToNext: xpToNext || 100,
                    level: level || "Low",
                    loading: false,
                });
            } else {
                setXpData((prev) => ({ ...prev, loading: false }));
            }
        } catch (error) {
            console.error("Failed to fetch XP:", error);
            setXpData((prev) => ({ ...prev, loading: false }));
        }
    };

    // Effect: Gọi API lần đầu & Lắng nghe sự kiện update
    useEffect(() => {
        fetchXp();

        const handleXpUpdate = () => {
            console.log("⚡ XpWidget: Nhận tín hiệu update XP");
            fetchXp();
        };

        window.addEventListener("xp-update", handleXpUpdate);
        window.addEventListener("streak-update", handleXpUpdate);

        return () => {
            window.removeEventListener("xp-update", handleXpUpdate);
            window.removeEventListener("streak-update", handleXpUpdate);
        };
    }, [user]);

    // Tính phần trăm XP
    const xpPercentage = Math.min(
        100,
        Math.round((xpData.xp / xpData.xpToNext) * 100)
    );

    // Level colors
    const levelConfig = {
        Low: { color: "text-slate-400", bg: "bg-slate-500", label: "Khởi đầu" },
        Mid: { color: "text-blue-400", bg: "bg-blue-500", label: "Trung cấp" },
        High: { color: "text-purple-400", bg: "bg-purple-500", label: "Cao cấp" },
        Great: { color: "text-amber-400", bg: "bg-amber-500", label: "Xuất sắc" },
    };

    const currentLevelConfig = levelConfig[xpData.level] || levelConfig.Low;

    // Render Skeleton khi đang tải
    if (xpData.loading) {
        return (
            <div className="animate-pulse bg-slate-800 h-9 w-20 rounded-full border border-slate-700 mx-2" />
        );
    }

    // Nếu chưa login thì ẩn
    if (!user) return null;

    return (
        <div className="relative mx-2" ref={dropdownRef}>
            {/* --- BUTTON CHÍNH (XP BAR) --- */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />

                {/* Mini Progress Bar */}
                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${currentLevelConfig.bg} transition-all duration-500`}
                        style={{ width: `${xpPercentage}%` }}
                    />
                </div>

                <span className={`text-xs font-bold ${currentLevelConfig.color}`}>
                    {xpData.level}
                </span>
            </button>

            {/* --- POPUP CHI TIẾT --- */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-0 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-white/10">
                    {/* Header */}
                    <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex justify-between items-center">
                        <h3 className="text-slate-200 font-semibold text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-400" />
                            Kinh nghiệm & Cấp độ
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Level hiện tại */}
                        <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${currentLevelConfig.bg}/20`}>
                                    <Star className={`h-6 w-6 ${currentLevelConfig.color} fill-current`} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                                        Cấp độ
                                    </p>
                                    <p className={`text-lg font-bold ${currentLevelConfig.color}`}>
                                        {currentLevelConfig.label}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* XP Progress */}
                        <div className="p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                                    Kinh nghiệm
                                </span>
                                <span className="text-sm font-bold text-amber-400">
                                    {xpData.xp} / {xpData.xpToNext} XP
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${currentLevelConfig.bg} transition-all duration-500 rounded-full`}
                                    style={{ width: `${xpPercentage}%` }}
                                />
                            </div>

                            <p className="text-xs text-slate-500 mt-2 text-center">
                                Còn {xpData.xpToNext - xpData.xp} XP để lên level tiếp theo
                            </p>
                        </div>

                        {/* Thông điệp */}
                        <div className="text-center text-xs py-2 px-3 rounded-md bg-blue-500/10 text-blue-400">
                            Hoàn thành bài tập và ôn từ vựng để nhận thêm XP! ⚡
                        </div>
                    </div>

                    {/* Mũi tên trang trí */}
                    <div className="absolute -top-1.5 right-4 w-3 h-3 bg-slate-800 border-t border-l border-slate-700 rotate-45 z-0"></div>
                </div>
            )}
        </div>
    );
};

export default XpWidget;
