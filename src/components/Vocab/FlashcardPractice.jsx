import React, { useState, useEffect } from "react";
import { getDailyVocabAPI, completeDailyVocabAPI } from "@/services/apiVocab";
import { useAuth } from "@/context/authContext";
import { Check, X } from "lucide-react";

const FlashcardPractice = ({ count = 20, onComplete }) => {
  const { user } = useAuth();
  const [vocabList, setVocabList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadVocab();
  }, []);

  const loadVocab = async () => {
    try {
      const data = await getDailyVocabAPI(user?.idUser, count);
      setVocabList(data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAnswer = (isCorrect) => {
    const current = vocabList[currentIndex];
    if (!current) return;

    setAnswers({ ...answers, [current.idVocab]: isCorrect });

    if (currentIndex < vocabList.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      submitResults();
    }
  };

  const submitResults = async () => {
    const answerList = Object.entries(answers).map(([vocabId, isCorrect]) => ({
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