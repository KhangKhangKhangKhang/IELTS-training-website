import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { getDailySessionAPI, completeDailyVocabAPI } from "@/services/apiVocab";
import { ArrowLeft, Check, X, RotateCcw, BookOpen, Star, Clock } from "lucide-react";
import SaveWordModal from "@/components/Vocab/SaveWordModal";
import FillInPractice from "@/components/Vocab/FillInPractice";
import MultipleChoicePractice from "@/components/Vocab/MultipleChoicePractice";

const QUOTA_OPTIONS = [5, 10, 15, 20];

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

  const [quota, setQuota] = useState(15);
  const [showQuotaSelector, setShowQuotaSelector] = useState(true);
  const [practiceMode, setPracticeMode] = useState("flashcard");

  const [dueCount, setDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [wordToSave, setWordToSave] = useState(null);

  useEffect(() => {
    // Auto-load when user changes (but start with quota selector)
  }, [user?.idUser]);

  const loadDailyVocab = async () => {
    if (!user?.idUser) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getDailySessionAPI(user.idUser, quota);
      setVocabList(data.words || []);
      setDueCount(data.dueCount || 0);
      setNewCount(data.newCount || 0);
      setCurrentIndex(0);
      setIsFlipped(false);
      setAnswers({});
      setIsCompleted(false);
      setSummary(null);
      setShowQuotaSelector(false);
    } catch (err) {
      console.error("Error loading daily vocab:", err);
      setError("Không thể tải danh sách từ vựng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleAnswer = async (isCorrect) => {
    const currentVocab = vocabList[currentIndex];
    if (!currentVocab) return;

    const quality = isCorrect ? 5 : 1;

    setAnswers(prev => ({
      ...prev,
      [currentVocab.idVocab]: { isCorrect, quality },
    }));

    if (currentIndex < vocabList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      await submitResults();
    }
  };

  const submitResults = async () => {
    if (!user?.idUser) return;

    const answerList = Object.entries(answers).map(([vocabId, data]) => ({
      vocabId,
      isCorrect: data.isCorrect,
    }));

    try {
      const result = await completeDailyVocabAPI(user.idUser, answerList);
      setSummary(result.summary);
      setIsCompleted(true);
    } catch (err) {
      console.error("Error submitting results:", err);
      setError("Không thể lưu kết quả.");
    }
  };

  const handleRestart = () => {
    setShowQuotaSelector(true);
    setVocabList([]);
  };

  const handleSaveWord = (word) => {
    setWordToSave(word);
    setShowSaveModal(true);
  };

  const currentVocab = vocabList[currentIndex];
  const progress = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(a => a.isCorrect).length;

  if (showQuotaSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} className="text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Luyện từ vựng hàng ngày</h1>
            <p className="text-slate-500">Kết hợp ôn từ cũ + học từ mới với SM-2</p>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Chọn số từ mỗi ngày:</p>
            <div className="grid grid-cols-4 gap-3">
              {QUOTA_OPTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => setQuota(q)}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    quota === q
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Chọn chế độ:</p>
            <div className="space-y-2">
              {[
                { id: "flashcard", label: "🃏 Flashcard", desc: "Lật thẻ xem nghĩa" },
                { id: "fill", label: "✏️ Điền từ", desc: "Gõ từ để kiểm tra" },
                { id: "multiple", label: "📝 Trắc nghiệm", desc: "Chọn đáp án đúng" },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setPracticeMode(mode.id)}
                  className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                    practiceMode === mode.id
                      ? "bg-purple-50 border-2 border-purple-600"
                      : "bg-slate-50 border-2 border-transparent hover:border-slate-200"
                  }`}
                >
                  <span className="text-lg">{mode.label.split(" ")[0]}</span>
                  <div>
                    <p className="font-medium text-slate-800">{mode.label.split(" ").slice(1).join(" ")}</p>
                    <p className="text-xs text-slate-500">{mode.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={loadDailyVocab}
            className="w-full py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            Bắt đầu luyện tập
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải từ vựng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => setShowQuotaSelector(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted && summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 mt-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Hoàn thành!</h2>
          <p className="text-slate-500 mb-6">
            {dueCount > 0 && `${dueCount} từ ôn + `}{newCount > 0 && `${newCount} từ mới`}
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600">Đúng:</span>
              <span className="text-green-600 font-semibold">{summary.correct}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600">Sai:</span>
              <span className="text-red-600 font-semibold">{summary.incorrect}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Tổng:</span>
              <span className="text-purple-600 font-semibold">{summary.total}</span>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <RotateCcw size={20} />
            Luyện tập tiếp
          </button>
        </div>
      </div>
    );
  }

  if (practiceMode === "fill") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <button
              onClick={() => setShowQuotaSelector(true)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft size={20} /> Đổi chế độ
            </button>
          </div>
          <FillInPractice
            count={quota}
            vocabList={vocabList}
            onComplete={() => setIsCompleted(true)}
          />
        </div>
      </div>
    );
  }

  if (practiceMode === "multiple") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <button
              onClick={() => setShowQuotaSelector(true)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft size={20} /> Đổi chế độ
            </button>
          </div>
          <MultipleChoicePractice
            count={quota}
            vocabList={vocabList}
            onComplete={() => setIsCompleted(true)}
          />
        </div>
      </div>
    );
  }

  if (!currentVocab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">Không có từ vựng để học hôm nay.</p>
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
      <div className="max-w-md mx-auto mb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowQuotaSelector(true)}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft size={20} /> Đổi
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock size={16} />
            <span>{progress}/{vocabList.length}</span>
          </div>
        </div>

        <div className="w-full bg-white/50 rounded-full h-2 mb-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress / vocabList.length) * 100}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-500">
          <span>Ôn: {dueCount} | Mới: {newCount}</span>
          <span>Đúng: {correctCount}/{progress}</span>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div
          className="relative w-full h-80 cursor-pointer"
          onClick={handleFlip}
        >
          <div
            className={`absolute w-full h-full transition-transform duration-500 ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            <div
              className="absolute w-full h-full bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase">
                {currentVocab.isNew ? "Từ mới" : "Ôn tập"}
              </span>
              <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">
                {currentVocab.word}
              </h2>
              {currentVocab.phonetic && (
                <p className="text-slate-500 text-lg">/{currentVocab.phonetic}/</p>
              )}
              <p className="absolute bottom-4 text-slate-400 text-sm">Tap to flip</p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveWord(currentVocab);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"
              >
                <Star size={20} className="text-yellow-500" />
              </button>
            </div>

            <div
              className="absolute w-full h-full bg-purple-600 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-white"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <h2 className="text-2xl font-bold mb-4 text-center">
                {currentVocab.meaning}
              </h2>
              <p className="text-purple-200 text-sm">Tap to flip back</p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveWord(currentVocab);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-purple-500 rounded-full"
              >
                <Star size={20} className="text-yellow-300" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-red-500 rounded-xl hover:bg-red-50 transition-colors shadow-lg border-2 border-red-100"
          >
            <X size={24} />
            <span className="font-semibold">Chưa nhớ</span>
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg"
          >
            <Check size={24} />
            <span className="font-semibold">Đã nhớ</span>
          </button>
        </div>
      </div>

      <SaveWordModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        word={wordToSave}
        user={user}
      />
    </div>
  );
};

export default VocabDaily;