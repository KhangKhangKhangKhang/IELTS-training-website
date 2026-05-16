// src/Pages/client/grammar/[idGrammar].jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getNextExerciseAPI, submitGrammarAnswerAPI } from "@/services/apiGrammar";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

const GrammarPractice = () => {
  const navigate = useNavigate();
  const { idGrammar } = useParams();
  const [exercise, setExercise] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    loadNextExercise();
  }, [idGrammar]);

  const loadNextExercise = async () => {
    setLoading(true);
    setResult(null);
    setUserAnswer("");
    setShowHint(false);
    try {
      const data = await getNextExerciseAPI(idGrammar);
      setExercise(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userAnswer) return;
    try {
      const data = await submitGrammarAnswerAPI(exercise.idExercise, userAnswer);
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleNext = () => {
    loadNextExercise();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Không còn bài tập nào!</p>
          <button onClick={() => navigate("/grammar")} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate("/grammar")} className="p-2 hover:bg-slate-200 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">{exercise.title}</h1>
            <p className="text-sm text-slate-500">
              Bài {exercise.progress.done + 1}/{exercise.progress.total}
            </p>
          </div>
          <button
            onClick={() => navigate("/grammar")}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Danh sách
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Tiến độ</span>
            <span>{Math.round(((exercise.progress.done + 1) / exercise.progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((exercise.progress.done + 1) / exercise.progress.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Exercise Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {exercise.type === 'error_correction' ? 'Sửa lỗi sai' :
             exercise.type === 'transformation' ? 'Biến đổi câu' :
             exercise.type === 'cloze' ? 'Điền chỗ trống' : 'Trắc nghiệm'}
          </span>

          {/* Error Correction */}
          {exercise.type === 'error_correction' && (
            <div className="mt-4">
              <p className="text-red-500 line-through mb-4">{exercise.content.wrong}</p>
              {exercise.content.hint && !showHint && (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 mb-2"
                >
                  Hiện gợi ý 💡
                </button>
              )}
              {showHint && exercise.content.hint && (
                <p className="text-sm text-green-600 mb-2 bg-green-50 p-2 rounded border border-green-200">
                  💡 {exercise.content.hint}
                </p>
              )}
              <p className="text-slate-600 mb-2">Sửa lại:</p>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Nhập từ đúng..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Cloze */}
          {exercise.type === 'cloze' && (
            <div className="mt-4">
              <p className="text-lg mb-4">
                {exercise.content.sentence.replace('___', '___')}
              </p>
              {exercise.content.hint && !showHint && (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 mb-2"
                >
                  Hiện gợi ý 💡
                </button>
              )}
              {showHint && exercise.content.hint && (
                <p className="text-sm text-green-600 mb-2 bg-green-50 p-2 rounded border border-green-200">
                  💡 {exercise.content.hint}
                </p>
              )}
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Nhập từ..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Transformation */}
          {exercise.type === 'transformation' && (
            <div className="mt-4">
              <p className="text-slate-700 mb-2">{exercise.content.prompt}</p>
              <p className="text-sm text-blue-600 mb-4">Instruction: {exercise.content.instruction}</p>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Viết câu mới..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 h-24"
              />
            </div>
          )}

          {/* Multiple Choice */}
          {exercise.type === 'multiple_choice' && (
            <div className="mt-4">
              <p className="text-slate-700 mb-4">{exercise.content.question}</p>
              <div className="space-y-2">
                {exercise.content.options.map((opt, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                      userAnswer === String(idx) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="option"
                      value={String(idx)}
                      checked={userAnswer === String(idx)}
                      onChange={() => setUserAnswer(String(idx))}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`mt-4 p-4 rounded-lg ${result.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                  {result.isCorrect ? 'Đúng!' : 'Sai rồi'}
                </span>
              </div>
              {!result.isCorrect && (
                <p className="text-sm text-slate-600">
                  Đáp án đúng: {result.correctAnswer}
                </p>
              )}
              {result.explanation && (
                <p className="text-sm text-slate-500 mt-2">{result.explanation}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {!result ? (
              <button
                onClick={handleSubmit}
                disabled={!userAnswer}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Kiểm tra
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Tiếp tục
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrammarPractice;