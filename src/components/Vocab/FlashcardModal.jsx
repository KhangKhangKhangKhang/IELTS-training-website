// components/FlashcardModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  RotateCw,
  Check,
  X as XIcon,
  ArrowRightLeft,
  Trophy,
  Loader2,
} from "lucide-react";
import { postVocabStreakAPI, userProfileAPI } from "@/services/apiUser";
import { message } from "antd";
import LevelUpModal from "@/components/ui/LevelUpModal";

const FlashcardModal = ({ isOpen, onClose, vocabularies, user }) => {
  // --- STATE ---
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState("EN_VI"); // 'EN_VI' (Anh-Việt) or 'VI_EN' (Việt-Anh)
  const [results, setResults] = useState([]); // Lưu kết quả từng câu
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading khi gọi API

  // State cho Level Up Modal
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ oldLevel: null, newLevel: null });

  // --- EFFECT: KHỞI TẠO ---
  useEffect(() => {
    if (isOpen && vocabularies.length > 0) {
      // Shuffle mảng (Fisher-Yates shuffle tốt hơn sort random)
      const shuffled = [...vocabularies];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setQueue(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
      setResults([]);
      setIsFinished(false);
      setIsSubmitting(false);
    }
  }, [isOpen, vocabularies]);

  // --- LOGIC: XỬ LÝ TRẢ LỜI ---
  const handleFlip = useCallback(() => {
    if (!isFinished) setIsFlipped((prev) => !prev);
  }, [isFinished]);

  const handleAnswer = useCallback(
    async (isCorrect) => {
      if (isSubmitting || isFinished) return;

      const currentVocab = queue[currentIndex];
      const newResult = {
        idVocab: currentVocab.idVocab,
        isCorrect: isCorrect,
      };

      // Cập nhật state results
      const updatedResults = [...results, newResult];
      setResults(updatedResults);

      // Nếu chưa phải câu cuối -> Chuyển câu
      if (currentIndex < queue.length - 1) {
        setIsFlipped(false);
        // Delay nhỏ để tạo cảm giác mượt mà khi chuyển thẻ
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 200);
      } else {
        // Nếu là câu cuối -> Kết thúc phiên
        await finishSession(updatedResults);
      }
    },
    [queue, currentIndex, results, isSubmitting, isFinished]
  );

  // --- LOGIC: GỌI API VÀ CẬP NHẬT STREAK ---
  const finishSession = async (finalResults) => {
    setIsSubmitting(true);

    // Lấy level hiện tại trước khi gọi API
    let oldLevel = null;
    try {
      const userRes = await userProfileAPI(user?.idUser);
      oldLevel = userRes?.data?.level;
    } catch (e) {
      console.error("Failed to get current level:", e);
    }

    // Payload gửi lên server
    const payload = {
      idUser: user?.idUser,
      answers: finalResults,
    };

    try {
      // 1. Gọi API lưu kết quả
      const response = await postVocabStreakAPI(payload);

      // 2. 🔥 QUAN TRỌNG: Bắn sự kiện để StreakWidget cập nhật ngay lập tức
      window.dispatchEvent(new Event("streak-update"));

      // 3. Kiểm tra xem có lên level không
      const newLevel = response?.data?.level;
      if (oldLevel && newLevel && oldLevel !== newLevel) {
        // Hiển thị modal chúc mừng lên level!
        setLevelUpData({ oldLevel, newLevel });
        setShowLevelUp(true);
      }

      // 4. Hiển thị màn hình kết thúc
      setIsFinished(true);
    } catch (error) {
      console.error("Failed to save streak:", error);
      message.error("Không thể lưu kết quả học tập. Vui lòng thử lại!");
      // Vẫn hiện màn hình kết thúc để user biết kết quả bài làm
      setIsFinished(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EFFECT: PHÍM TẮT BÀN PHÍM ---
  useEffect(() => {
    if (!isOpen || isFinished) return;

    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault(); // Ngăn cuộn trang
        handleFlip();
      } else if (e.code === "ArrowLeft") {
        handleAnswer(false); // Chưa nhớ
      } else if (e.code === "ArrowRight") {
        handleAnswer(true); // Đã nhớ
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFinished, handleFlip, handleAnswer]);

  if (!isOpen) return null;

  // --- RENDER: MÀN HÌNH KẾT THÚC ---
  if (isFinished) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const percentage = Math.round((correctCount / queue.length) * 100);

    return (
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center transform transition-all scale-100">
          <div className="mx-auto bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
            <Trophy size={40} className="text-yellow-600" />
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Hoàn thành! 🎉
          </h2>
          <p className="text-slate-500 mb-6">
            Bạn vừa hoàn thành phiên ôn tập.
          </p>

          <div className="flex justify-center items-end gap-2 mb-8">
            <span className="text-6xl font-black text-blue-600">
              {percentage}%
            </span>
            <span className="text-lg text-slate-400 font-medium mb-2">
              chính xác
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <p className="text-green-600 text-sm font-bold">Đã thuộc</p>
              <p className="text-2xl font-bold text-green-700">
                {correctCount}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
              <p className="text-red-600 text-sm font-bold">Cần ôn lại</p>
              <p className="text-2xl font-bold text-red-700">
                {queue.length - correctCount}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-95"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: FLASHCARD ---
  if (queue.length === 0) return null;

  const currentCard = queue[currentIndex];
  const isEnVi = mode === "EN_VI"; // True nếu Anh -> Việt

  // Nội dung hiển thị
  const frontText = isEnVi ? currentCard.word : currentCard.meaning;

  // Mặt sau (Đáp án)
  const BackSideContent = () => (
    <div className="flex flex-col items-center text-center">
      {isEnVi ? (
        <>
          <p className="text-2xl font-bold text-slate-800 mb-2">
            {currentCard.meaning}
          </p>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">
              {currentCard.VocabType}
            </span>
            <span className="text-slate-500 italic font-serif">
              /{currentCard.phonetic}/
            </span>
          </div>
          {currentCard.example && (
            <div className="mt-4 p-4 bg-white/60 rounded-lg border border-blue-100 w-full">
              <p className="text-slate-600 text-sm italic">
                "{currentCard.example}"
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-3xl font-bold text-slate-800 mb-3">
            {currentCard.word}
          </p>
          <span className="text-slate-500 italic font-serif text-lg">
            /{currentCard.phonetic}/
          </span>
          <span className="mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">
            {currentCard.VocabType}
          </span>
        </>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-[650px] flex flex-col p-4">
        {/* Header Controls */}
        <div className="flex justify-between items-center text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium border border-white/10 backdrop-blur-md">
              {currentIndex + 1} / {queue.length}
            </div>
            {/* Progress Bar */}
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${(currentIndex / queue.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMode((prev) => (prev === "EN_VI" ? "VI_EN" : "EN_VI"));
                setIsFlipped(false);
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
              title="Đổi chế độ (Anh-Việt / Việt-Anh)"
            >
              <ArrowRightLeft size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors text-slate-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Card Container */}
        <div
          className="flex-1 perspective-1000 relative group cursor-pointer mb-8"
          onClick={handleFlip}
        >
          <div
            className={`relative w-full h-full duration-500 preserve-3d transition-all transform ease-in-out ${isFlipped ? "rotate-y-180" : ""
              }`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* --- FRONT SIDE --- */}
            <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 border-b-[6px] border-slate-200">
              <span className="absolute top-6 left-6 text-xs font-bold text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-1 rounded">
                Question
              </span>
              <h3 className="text-4xl md:text-5xl font-bold text-slate-800 text-center leading-tight">
                {frontText}
              </h3>
              <p className="absolute bottom-6 text-slate-400 text-xs font-medium uppercase tracking-wide animate-pulse flex items-center gap-1">
                <RotateCw size={12} /> Click hoặc nhấn Space để lật
              </p>
            </div>

            {/* --- BACK SIDE --- */}
            <div
              className="absolute inset-0 backface-hidden bg-blue-50/80 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 border-b-[6px] border-blue-200"
              style={{ transform: "rotateY(180deg)" }}
            >
              <span className="absolute top-6 left-6 text-xs font-bold text-blue-500 uppercase tracking-widest border border-blue-200 bg-white px-2 py-1 rounded">
                Answer
              </span>
              <BackSideContent />
            </div>
          </div>
        </div>

        {/* Controls Buttons */}
        <div
          className={`grid grid-cols-2 gap-6 transition-all duration-500 transform ${isFlipped
            ? "opacity-100 translate-y-0"
            : "opacity-50 translate-y-4 pointer-events-none grayscale"
            }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAnswer(false);
            }}
            disabled={isSubmitting}
            className="group flex items-center justify-center gap-3 py-4 rounded-2xl bg-white text-red-600 font-bold text-lg shadow-lg border-b-4 border-red-100 active:border-b-0 active:translate-y-1 hover:bg-red-50 transition-all"
          >
            <div className="p-1 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
              <XIcon size={20} />
            </div>
            Chưa nhớ
            <span className="hidden md:inline text-xs font-normal text-red-400 bg-red-100/50 px-1.5 py-0.5 rounded border border-red-200">
              ←
            </span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAnswer(true);
            }}
            disabled={isSubmitting}
            className="group flex items-center justify-center gap-3 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 hover:bg-blue-500 transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <div className="p-1 bg-white/20 rounded-full">
                  <Check size={20} />
                </div>
                Đã nhớ
                <span className="hidden md:inline text-xs font-normal text-blue-200 bg-blue-700 px-1.5 py-0.5 rounded border border-blue-500">
                  →
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Level Up Celebration Modal */}
      <LevelUpModal
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        oldLevel={levelUpData.oldLevel}
        newLevel={levelUpData.newLevel}
      />
    </div>
  );
};

export default FlashcardModal;
