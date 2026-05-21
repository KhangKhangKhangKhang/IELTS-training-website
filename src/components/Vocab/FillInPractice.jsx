import React, { useState, useEffect } from "react";
import { getDailyVocabAPI, completeDailyVocabAPI } from "@/services/apiVocab";
import { useAuth } from "@/context/authContext";
import { Check, X, ArrowRight } from "lucide-react";

const FillInPractice = ({ count = 20, onComplete }) => {
  const { user } = useAuth();
  const [vocabList, setVocabList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
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

  const handleSubmit = () => {
    const current = vocabList[currentIndex];
    if (!current) return;

    const isCorrect = userAnswer.trim().toLowerCase() === current.word.trim().toLowerCase();
    setAnswers({ ...answers, [current.idVocab]: isCorrect });
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < vocabList.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setShowResult(false);
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
            <div className={`p-4 rounded-xl ${currentAnswer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {currentAnswer ? (
                  <Check className="text-green-600" size={24} />
                ) : (
                  <X className="text-red-600" size={24} />
                )}
                <span className={`font-bold ${currentAnswer ? 'text-green-600' : 'text-red-600'}`}>
                  {currentAnswer ? 'Đúng!' : 'Sai!'}
                </span>
              </div>
              {!currentAnswer && (
                <p className="text-sm">Đáp án đúng: <span className="font-bold">{current.word}</span></p>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
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
    </div>
  );
};

export default FillInPractice;