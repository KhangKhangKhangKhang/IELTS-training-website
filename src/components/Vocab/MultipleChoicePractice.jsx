import React, { useState, useEffect, useReducer, memo } from "react";
import { getDailyVocabAPI, submitReviewAPI } from "@/services/apiVocab";
import { useAuth } from "@/context/authContext";
import { Check, X } from "lucide-react";

// Per-question state machine. Grouping index + selection + showResult into one
// reducer means a single dispatch always commits atomically — no parent
// subscription can race with these state updates.
const initialState = {
  currentIndex: 0,
  selectedAnswer: null,
  showResult: false,
  answers: {},
  correctCount: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case "SELECT":
      return {
        ...state,
        selectedAnswer: action.option,
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
        selectedAnswer: null,
        showResult: false,
      };
    default:
      return state;
  }
}

const MultipleChoicePractice = ({ count = 20, onComplete }) => {
  const { user } = useAuth();
  const [vocabList, setVocabList] = useState([]);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { currentIndex, selectedAnswer, showResult, answers, correctCount } = state;
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadVocab();
  }, []);

  const loadVocab = async () => {
    try {
      const data = await getDailyVocabAPI(user?.idUser, count);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      const validList = list.filter((w) => w && w.idVocab);
      const withOptions = validList.map((word, idx) => {
        const dummyWords = validList
          .filter((_, i) => i !== idx)
          .slice(0, 3)
          .map(w => w.word);
        const allOptions = [word.word, ...dummyWords].sort(() => Math.random() - 0.5);
        return { ...word, options: allOptions };
      });
      setVocabList(withOptions);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSelect = (option) => {
    if (showResult) return;

    const current = vocabList[currentIndex];
    if (!current) return;
    const isCorrect = option === current.word;
    const quality = isCorrect ? 5 : 1;

    // Best-effort SM-2 review (no UI blocking on failure).
    submitReviewAPI(current.idVocab, user?.idUser, quality).catch((err) => {
      console.error(`[MultipleChoice] submitReview failed for ${current.idVocab}:`, err);
    });

    // Single dispatch commits all per-question state atomically.
    dispatch({
      type: "SELECT",
      option,
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
          <p className="text-xl font-bold text-gray-800 mb-2">{current.meaning}</p>
          {current.example && (
            <p className="text-sm text-gray-400 italic mb-4">"{current.example}"</p>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            {current.options?.map((option, idx) => {
              let buttonClass = 'bg-slate-100 hover:bg-slate-200 border-slate-200';
              if (showResult) {
                if (option === current.word) {
                  buttonClass = 'bg-green-100 border-green-500 text-green-700';
                } else if (option === selectedAnswer && option !== current.word) {
                  buttonClass = 'bg-red-100 border-red-500 text-red-700';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  className={`p-3 rounded-xl border-2 text-left font-medium transition-all ${buttonClass}`}
                  disabled={showResult}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className={`mt-4 p-3 rounded-xl ${currentAnswer?.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`font-bold ${currentAnswer?.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {currentAnswer?.isCorrect ? 'Đúng!' : 'Sai!'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Next Button */}
      {showResult && (
        <button
          onClick={handleNext}
          className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
        >
          {currentIndex < vocabList.length - 1 ? 'Tiếp theo' : 'Hoàn thành'}
        </button>
      )}
    </div>
  );
};

export default memo(MultipleChoicePractice);