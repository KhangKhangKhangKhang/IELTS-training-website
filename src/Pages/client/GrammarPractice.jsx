import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/authContext";
import API from "@/services/axios.custom";
import { ArrowLeft, Check, X } from "lucide-react";
import { getGrammarPracticeByTopicAPI } from "@/services/apiGrammar";

const GrammarPractice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic');
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      let res;
      if (topic) {
        res = await getGrammarPracticeByTopicAPI(topic, 10);
        setExercises(res.data || []);
      } else {
        res = await API.get(`/grammar/practice/random?idUser=${user?.idUser}&count=10`);
        setExercises(res.data?.data || []);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const current = exercises[currentIndex];
    if (!current) return;

    let isCorrect = false;

    if (current.type === 'multiple_choice') {
      isCorrect = selectedChoice === current.content.correct;
    } else {
      // For other types, check if user answer matches correct answer (case-insensitive)
      const correctAnswer = (current.content.correct || current.content.answer || '').toLowerCase().trim();
      isCorrect = userAnswer.toLowerCase().trim() === correctAnswer;
    }

    setAnswers({ ...answers, [current.id]: isCorrect });
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setSelectedChoice(null);
      setShowResult(false);
    } else {
      submitResults();
    }
  };

  const submitResults = async () => {
    const answerList = Object.entries(answers).map(([exerciseId, isCorrect]) => ({
      exerciseId,
      isCorrect
    }));
    try {
      const res = await API.post('/grammar/practice/submit', {
        idUser: user?.idUser,
        answers: answerList
      });
      setSummary(res.data?.summary || { correct: 0, total: 0 });
      setIsCompleted(true);
    } catch (err) {
      console.error(err);
      setIsCompleted(true);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-lg mx-auto bg-white rounded-2xl p-8 shadow-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Hoàn thành!</h2>
          <p className="text-2xl mb-6">
            <span className="text-green-600 font-bold">{summary?.correct || 0}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 font-bold">{summary?.total || 10}</span>
            <span className="text-gray-500 text-lg"> đúng</span>
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/grammar')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
            >
              Quay lại Grammar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
            >
              Luyện tiếp
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = exercises[currentIndex];
  const progress = Object.keys(answers).length;
  const currentAnswer = answers[current?.id];

  if (!current) return <div className="p-6">No exercises available</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/grammar')} className="p-2 bg-white rounded-xl hover:bg-gray-100">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Luyện Grammar</h1>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Câu {currentIndex + 1}/{exercises.length}</span>
            <span>{progress} đã trả lời</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${(currentIndex / exercises.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Exercise */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
          <div className="mb-2">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              {current.type.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-xs text-gray-400 ml-2">{current.title}</span>
          </div>

          {/* error_correction: Show wrong, user types correct */}
          {current.type === 'error_correction' && (
            <div>
              <p className="text-gray-600 mb-4">Sửa câu sau:</p>
              <p className="text-xl font-medium text-red-600 mb-4 line-through">{current.content.wrong}</p>
              {showResult ? (
                <div className={`p-4 rounded-xl ${currentAnswer ? 'bg-green-50' : 'bg-red-50'}`}>
                  {currentAnswer ? (
                    <p className="text-green-600 font-bold">Đúng!</p>
                  ) : (
                    <div>
                      <p className="text-red-600 font-bold mb-2">Sai!</p>
                      <p className="text-sm">Đáp án: <span className="font-bold">{current.content.correct}</span></p>
                      {current.content.explanation && (
                        <p className="text-xs text-gray-500 mt-1">{current.content.explanation}</p>
                      )}
                    </div>
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
                    placeholder="Nhập câu đúng..."
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

          {/* cloze: Fill in the blank */}
          {current.type === 'cloze' && (
            <div>
              <p className="text-gray-600 mb-4">Điền từ vào chỗ trống:</p>
              <p className="text-xl mb-4">
                {current.content.sentence?.replace('___', '______')}
              </p>
              {current.content.hint && (
                <p className="text-xs text-gray-400 mb-2">Gợi ý: {current.content.hint}</p>
              )}
              {showResult ? (
                <div className={`p-4 rounded-xl ${currentAnswer ? 'bg-green-50' : 'bg-red-50'}`}>
                  {currentAnswer ? (
                    <p className="text-green-600 font-bold">Đúng!</p>
                  ) : (
                    <div>
                      <p className="text-red-600 font-bold mb-2">Sai!</p>
                      <p className="text-sm">Đáp án: <span className="font-bold">{current.content.answer}</span></p>
                    </div>
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

          {/* transformation: Transform based on instruction */}
          {current.type === 'transformation' && (
            <div>
              <p className="text-gray-600 mb-2">Chuyển đổi câu:</p>
              <p className="text-lg mb-2">{current.content.prompt}</p>
              <p className="text-sm text-purple-600 mb-4">{current.content.instruction}</p>
              {showResult ? (
                <div className={`p-4 rounded-xl ${currentAnswer ? 'bg-green-50' : 'bg-red-50'}`}>
                  {currentAnswer ? (
                    <p className="text-green-600 font-bold">Đúng!</p>
                  ) : (
                    <div>
                      <p className="text-red-600 font-bold mb-2">Sai!</p>
                      <p className="text-sm">Đáp án: <span className="font-bold">{current.content.correct}</span></p>
                    </div>
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
                    placeholder="Nhập câu..."
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

          {/* multiple_choice: Select from options */}
          {current.type === 'multiple_choice' && (
            <div>
              <p className="text-lg mb-4">{current.content.question}</p>
              <div className="space-y-2">
                {current.content.options?.map((option, idx) => {
                  let buttonClass = 'bg-slate-100 hover:bg-slate-200 border-slate-200';
                  if (showResult) {
                    if (idx === current.content.correct) {
                      buttonClass = 'bg-green-100 border-green-500 text-green-700';
                    } else if (idx === selectedChoice && idx !== current.content.correct) {
                      buttonClass = 'bg-red-100 border-red-500 text-red-700';
                    }
                  } else if (selectedChoice === idx) {
                    buttonClass = 'bg-purple-100 border-purple-500';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!showResult) {
                          setSelectedChoice(idx);
                          setUserAnswer(option);
                        }
                      }}
                      className={`w-full p-3 rounded-xl border-2 text-left ${buttonClass}`}
                      disabled={showResult}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {showResult && (
                <div className={`mt-4 p-3 rounded-xl ${currentAnswer ? 'bg-green-50' : 'bg-red-50'}`}>
                  {currentAnswer ? (
                    <p className="text-green-600 font-bold">Đúng!</p>
                  ) : (
                    <p className="text-red-600">Sai!</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {!showResult ? (
            <button
              onClick={handleSubmit}
              disabled={current.type === 'multiple_choice' ? !selectedChoice : !userAnswer}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
            >
              Kiểm tra
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
            >
              {currentIndex < exercises.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrammarPractice;