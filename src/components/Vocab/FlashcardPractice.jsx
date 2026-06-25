import React, { useState, useEffect } from "react";
import { getDailyVocabAPI, completeDailyVocabAPI, submitReviewAPI } from "@/services/apiVocab";
import { useAuth } from "@/context/authContext";
import { Check, X } from "lucide-react";
import usePracticeProgress from "@/stores/practiceProgress";

const FlashcardPractice = ({ count = 20, onComplete }) => {
  const { user } = useAuth();
  const [vocabList, setVocabList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState(null);
  const { startSession, recordAnswer, incrementCorrect, setCurrentIndex: setStoreIndex } = usePracticeProgress();

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
      queueMicrotask(() => startSession("flashcard", validList.length));
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAnswer = (isCorrect) => {
    const current = vocabList[currentIndex];
    if (!current) return;

    // Realtime progress (deferred to avoid setState-during-render)
    queueMicrotask(() => {
      recordAnswer("flashcard", current.idVocab, isCorrect);
      if (isCorrect) incrementCorrect("flashcard");
    });

    // Save per-answer: send SM-2 review immediately
    const quality = isCorrect ? 5 : 1;
    submitReviewAPI(current.idVocab, user?.idUser, quality).catch((err) => {
      console.error(`[Flashcard] submitReview failed for ${current.idVocab}:`, err);
    });

    // Use functional setState to avoid stale closure
    setAnswers(prevAnswers => {
      const newAnswers = { ...prevAnswers, [current.idVocab]: isCorrect };

      if (currentIndex < vocabList.length - 1) {
        // Move to next immediately
        const nextIdx = currentIndex + 1;
        setTimeout(() => {
          setCurrentIndex(nextIdx);
          setStoreIndex("flashcard", nextIdx);
          setIsFlipped(false);
        }, 0);
      } else {
        // Last item - submit with new answers
        setTimeout(() => submitResultsInternal(newAnswers), 0);
      }

      return newAnswers;
    });
  };

  // Helper to submit results with specific answers object
  const submitResultsInternal = async (answersToSubmit) => {
    const answerList = Object.entries(answersToSubmit).map(([vocabId, isCorrect]) => ({
      vocabId,
      isCorrect
    }));
    try {
      const result = await completeDailyVocabAPI(user?.idUser, answerList);
      setSummary(result?.summary || { correct: 0, total: 0 });
      setIsCompleted(true);
    } catch (err) {
      console.error(err);
      setIsCompleted(true);
    }
  };

  // NOTE: submitResults removed - use submitResultsInternal instead

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

      {/* Flashcard */}
      {current && (
        <div
          className="flip-card w-full h-64 cursor-pointer mb-6"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`flip-card-inner relative w-full h-full ${isFlipped ? 'flipped' : ''}`}>
            <div className="flip-card-front absolute w-full h-full bg-white rounded-xl p-6 flex flex-col items-center justify-center shadow-lg">
              <span className="text-xs text-purple-500 uppercase mb-2">{current.VocabType || 'noun'}</span>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{current.word}</h2>
              {current.phonetic && <p className="text-gray-500">/{current.phonetic}/</p>}
              <p className="text-gray-400 text-sm mt-4">Nhấn để xem nghĩa</p>
            </div>
            <div className="flip-card-back absolute w-full h-full bg-purple-600 rounded-xl p-6 flex flex-col items-center justify-center shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4">{current.meaning}</h2>
              <p className="text-purple-200 text-sm text-center">{current.example}</p>
            </div>
          </div>
        </div>
      )}

      {/* Answer Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => handleAnswer(true)}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600"
        >
          <Check size={24} /><span className="font-semibold">Đúng</span>
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600"
        >
          <X size={24} /><span className="font-semibold">Sai</span>
        </button>
      </div>
    </div>
  );
};

export default FlashcardPractice;