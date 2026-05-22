import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { getDailyVocabAPI, completeDailyVocabAPI } from "@/services/apiVocab";
import { ArrowLeft, Check, X, RotateCcw, BookOpen } from "lucide-react";

const VocabDaily = () => {
  const { user } = useAuth();
  const [vocabList, setVocabList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadDailyVocab();
  }, [user?.idUser]);

  const loadDailyVocab = async () => {
    if (!user?.idUser) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getDailyVocabAPI(user.idUser, 10);
      setVocabList(data.data || data);
      setCurrentIndex(0);
      setIsFlipped(false);
      setAnswers({});
      setIsCompleted(false);
      setSummary(null);
    } catch (err) {
      console.error("Error loading daily vocab:", err);
      setError("Không thể tải danh sách từ vựng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (isCorrect) => {
    const currentVocab = vocabList[currentIndex];
    if (!currentVocab) return;

    setAnswers((prev) => ({
      ...prev,
      [currentVocab.idVocab]: isCorrect,
    }));

    // Move to next card
    if (currentIndex < vocabList.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // All words answered, submit results
      await submitResults();
    }
  };

  const submitResults = async () => {
    if (!user?.idUser) return;

    const answerList = Object.entries(answers).map(([vocabId, isCorrect]) => ({
      vocabId,
      isCorrect,
    }));

    // Include the last answered word if not already answered
    const currentVocab = vocabList[currentIndex];
    if (currentVocab && !answers[currentVocab.idVocab]) {
      // This shouldn't happen since we handle answer in handleAnswer
    }

    try {
      const result = await completeDailyVocabAPI(user.idUser, answerList);
      setSummary(result.summary);
      setIsCompleted(true);
    } catch (err) {
      console.error("Error submitting results:", err);
      setError("Không thể lưu kết quả. Vui lòng thử lại.");
    }
  };

  const handleRestart = () => {
    loadDailyVocab();
  };

  const currentVocab = vocabList[currentIndex];
  const progress = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải từ vựng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDailyVocab}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted && summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 mt-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Hoàn thành!</h2>
            <p className="text-gray-600">Bạn đã học {vocabList.length} từ hôm nay</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Đúng:</span>
              <span className="text-green-600 font-semibold">{summary.correct}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Sai:</span>
              <span className="text-red-600 font-semibold">{summary.incorrect}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng cộng:</span>
              <span className="text-indigo-600 font-semibold">{summary.total}</span>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 mb-6">
            <p className="text-indigo-800 text-sm text-center">
              {(summary.correct / summary.total) * 100 >= 80
                ? "Tuyệt vời! Bạn làm rất tốt! ✨"
                : (summary.correct / summary.total) * 100 >= 60
                ? "Khá tốt! Cố gắng hơn nữa nhé! 💪"
                : "Cần luyện tập thêm! 📚"}
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <RotateCcw size={20} />
            Học lại
          </button>
        </div>
      </div>
    );
  }

  if (!currentVocab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">Không có từ vựng để học hôm nay.</p>
          <p className="text-gray-500 text-sm">Hãy quay lại sau nhé!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-800">Luyện từ vựng</h1>
          <span className="text-sm text-gray-500">
            {progress}/{vocabList.length} từ
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress / vocabList.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
          Bạn đã học {progress}/{vocabList.length} từ hôm nay
        </p>
      </div>

      {/* Flashcard */}
      <div className="max-w-md mx-auto">
        <div
          className="relative w-full h-80 cursor-pointer perspective-1000"
          onClick={handleFlip}
        >
          <div
            className={`absolute w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front - Word */}
            <div
              className="absolute w-full h-full bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center backface-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-xs text-indigo-500 uppercase tracking-wide mb-2">
                {currentVocab.VocabType}
              </span>
              <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
                {currentVocab.word}
              </h2>
              {currentVocab.phonetic && (
                <p className="text-gray-500 text-lg">/{currentVocab.phonetic}/</p>
              )}
              <p className="text-gray-400 text-sm mt-4">Nhấn để xem nghĩa</p>
            </div>

            {/* Back - Meaning */}
            <div
              className="absolute w-full h-full bg-indigo-600 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                {currentVocab.meaning}
              </h2>
              <p className="text-indigo-200 text-sm">Nhấn để xem lại từ</p>
            </div>
          </div>
        </div>

        {/* Answer Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg"
          >
            <Check size={24} />
            <span className="font-semibold">Đúng</span>
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
          >
            <X size={24} />
            <span className="font-semibold">Sai</span>
          </button>
        </div>

        {/* Current score */}
        {progress > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Điểm hiện tại: {correctCount}/{progress}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabDaily;