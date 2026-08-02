import React, { useState, useEffect, useReducer, memo } from "react";
import { getDailyVocabAPI, submitReviewAPI } from "@/services/apiVocab";
import { useAuth } from "@/context/authContext";
import { Check, X, ArrowRight, Star } from "lucide-react";
import SaveWordModal from "./SaveWordModal";

// Per-question state machine. Grouping index + userAnswer + showResult into one
// reducer means a single dispatch always commits atomically — no parent
// subscription can race with these state updates.
const initialState = {
  currentIndex: 0,
  userAnswer: "",
  showResult: false,
  answers: {},
  correctCount: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_ANSWER":
      return { ...state, userAnswer: action.value };
    case "SUBMIT":
      return {
        ...state,
        showResult: true,
        answers: {
          ...state.answers,
          [action.idVocab]: { isCorrect: action.isCorrect, quality: action.quality },
        },
        correctCount: state.correctCount + (action.isCorrect ? 1 : 0),
      };
    case "NEXT":
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        userAnswer: "",
        showResult: false,
      };
    default:
      return state;
  }
}

const FillInPractice = ({ count = 20, onComplete }) => {
  const { user } = useAuth();
  const [vocabList, setVocabList] = useState([]);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { currentIndex, userAnswer, showResult, answers, correctCount } = state;
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentWordForSave, setCurrentWordForSave] = useState(null);

  useEffect(() => {
    loadVocab();
  }, []);

  const loadVocab = async () => {
    try {
      const data = await getDailyVocabAPI(user?.idUser, count);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      const validList = list.filter((w) => w && w.idVocab);
      setVocabList(validList);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const current = vocabList[currentIndex];
    if (!current) return;

    const isCorrect = userAnswer.trim().toLowerCase() === current.word.trim().toLowerCase();
    const quality = isCorrect ? 5 : 1;

    // Best-effort SM-2 review (no UI blocking).
    submitReviewAPI(current.idVocab, user.idUser, quality).catch(err => {
      console.error(`[FillIn] Failed to submit review for ${current.idVocab}:`, err);
    });

    dispatch({
      type: "SUBMIT",
      idVocab: current.idVocab,
      isCorrect,
      quality,
    });

    if (currentIndex === vocabList.length - 1) {
      const totalCorrect = correctCount + (isCorrect ? 1 : 0);
      setSummary({ correct: totalCorrect, total: vocabList.length });
      setIsCompleted(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < vocabList.length - 1) {
      dispatch({ type: "NEXT" });
    } else {
      setSummary({ correct: correctCount, total: vocabList.length });
      setIsCompleted(true);
    }
  };

  const handleOpenSaveModal = () => {
    setCurrentWordForSave(vocabList[currentIndex]);
    setShowSaveModal(true);
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (isCompleted) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Hoàn thành!</h2>
        <p className="text-lg">{summary?.correct || 0}/{summary?.total || count} đúng</p>
        <button
          onClick={onComplete}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
        >
          Tiếp tục
        </button>
      </div>
    );
  }

  const current = vocabList[currentIndex];
  const progress = Object.keys(answers).length;
  const currentAnswer = answers[current?.idVocab];

  return (
    <div className="p-6">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Tiến độ</span>
          <span>{progress}/{vocabList.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${(progress / vocabList.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      {current && (
        <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
          <p className="text-lg text-gray-600 mb-4">{current.meaning}</p>
          {current.example && (
            <p className="text-sm text-gray-400 italic mb-4">"{current.example}"</p>
          )}

          {showResult ? (
            <div className={`p-4 rounded-xl ${currentAnswer?.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {currentAnswer?.isCorrect ? (
                    <Check className="text-green-600" size={24} />
                  ) : (
                    <X className="text-red-600" size={24} />
                  )}
                  <span className={`font-bold ${currentAnswer?.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {currentAnswer?.isCorrect ? 'Đúng!' : 'Sai!'}
                  </span>
                </div>
                <button
                  onClick={handleOpenSaveModal}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-yellow-500"
                  title="Lưu từ"
                >
                  <Star size={20} />
                </button>
              </div>
              {!currentAnswer?.isCorrect && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  <p className="text-sm text-slate-600">Đáp án đúng: <span className="font-bold text-slate-800">{current.word}</span></p>
                  {current.phonetic && (
                    <p className="text-xs text-slate-400 mt-1">/{current.phonetic}/</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => dispatch({ type: "SET_ANSWER", value: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                placeholder="Nhập từ..."
                autoFocus
              />
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
              >
                Kiểm tra
              </button>
            </div>
          )}
        </div>
      )}

      {/* Next Button */}
      {showResult && (
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
        >
          {currentIndex < vocabList.length - 1 ? 'Tiếp theo' : 'Hoàn thành'}
          <ArrowRight size={20} />
        </button>
      )}

      {/* Save Word Modal */}
      {showSaveModal && currentWordForSave && (
        <SaveWordModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          word={currentWordForSave}
          user={user}
          onSaved={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("vocab-saved"));
            }
          }}
        />
      )}
    </div>
  );
};

export default memo(FillInPractice);