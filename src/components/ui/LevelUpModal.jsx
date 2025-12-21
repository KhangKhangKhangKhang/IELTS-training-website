import React, { useEffect, useState } from "react";
import { Trophy, Star, Sparkles, X } from "lucide-react";

const LevelUpModal = ({ isOpen, onClose, newLevel, oldLevel }) => {
    const [showConfetti, setShowConfetti] = useState(false);

    const levelConfig = {
        Low: {
            label: "Khởi đầu",
            color: "text-slate-600",
            bg: "from-slate-400 to-slate-600",
            emoji: "🌱"
        },
        Mid: {
            label: "Trung cấp",
            color: "text-blue-600",
            bg: "from-blue-400 to-blue-600",
            emoji: "⭐"
        },
        High: {
            label: "Cao cấp",
            color: "text-purple-600",
            bg: "from-purple-400 to-purple-600",
            emoji: "🔥"
        },
        Great: {
            label: "Xuất sắc",
            color: "text-amber-600",
            bg: "from-amber-400 to-amber-600",
            emoji: "👑"
        },
    };

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            // Tự động đóng sau 5 giây
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const config = levelConfig[newLevel] || levelConfig.Low;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Confetti Animation */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-10%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                            }}
                        >
                            <div
                                className="w-3 h-3 rounded-sm"
                                style={{
                                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][Math.floor(Math.random() * 8)],
                                    transform: `rotate(${Math.random() * 360}deg)`,
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Content */}
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 animate-in zoom-in-95 duration-500">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Stars Animation */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <div className="relative">
                        <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
                        <Star className="absolute -left-8 top-2 w-6 h-6 text-yellow-300 animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <Star className="absolute -right-8 top-2 w-6 h-6 text-yellow-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                </div>

                {/* Trophy Icon */}
                <div className={`mx-auto w-24 h-24 rounded-full bg-gradient-to-br ${config.bg} flex items-center justify-center mb-6 shadow-lg animate-bounce`}>
                    <Trophy className="w-12 h-12 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-black text-center text-slate-800 mb-2">
                    🎉 Chúc mừng! 🎉
                </h2>
                <p className="text-center text-slate-500 mb-6">
                    Bạn đã lên cấp mới!
                </p>

                {/* Level Display */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-center gap-4">
                        {/* Old Level */}
                        <div className="text-center opacity-50">
                            <p className="text-sm text-slate-400 mb-1">Cấp cũ</p>
                            <p className="text-xl font-bold text-slate-500">
                                {levelConfig[oldLevel]?.label || oldLevel}
                            </p>
                        </div>

                        {/* Arrow */}
                        <div className="text-3xl animate-pulse">→</div>

                        {/* New Level */}
                        <div className="text-center">
                            <p className="text-sm text-slate-400 mb-1">Cấp mới</p>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl">{config.emoji}</span>
                                <p className={`text-2xl font-black ${config.color}`}>
                                    {config.label}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message */}
                <p className="text-center text-slate-600 text-sm mb-6">
                    Tiếp tục học tập để mở khóa thêm nhiều thành tựu mới! 💪
                </p>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all active:scale-95 shadow-lg shadow-blue-500/30"
                >
                    Tuyệt vời! 🚀
                </button>
            </div>

            {/* CSS for Confetti Animation */}
            <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
        </div>
    );
};

export default LevelUpModal;
