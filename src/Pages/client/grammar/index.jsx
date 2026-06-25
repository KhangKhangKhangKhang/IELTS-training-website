// src/Pages/client/grammar/index.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getGrammarTopicsAPI, getGrammarRecommendationsAPI } from "@/services/apiGrammar";
import { BookOpen, CheckCircle, AlertTriangle } from "lucide-react";

const GrammarIndex = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsData, recData] = await Promise.allSettled([
          getGrammarTopicsAPI(),
          getGrammarRecommendationsAPI(),
        ]);
        const topics = topicsData.status === "fulfilled" && Array.isArray(topicsData.value)
          ? topicsData.value
          : [];
        const recs = recData.status === "fulfilled" && Array.isArray(recData.value)
          ? recData.value
          : [];
        setTopics(topics);
        setRecommendations(recs);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Ôn ngữ pháp</h1>

        {recommendations.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-orange-700 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5" />
              Gợi ý cho bạn
            </h2>
            <div className="flex flex-wrap gap-2">
              {recommendations.map((rec) => (
                <button
                  key={rec.idGrammar}
                  onClick={() => navigate(`/grammar/${rec.idGrammar}`)}
                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200"
                >
                  {rec.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((topic) => (
            <div
              key={topic.idGrammar}
              onClick={() => navigate(`/grammar/${topic.idGrammar}`)}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{topic.title}</h3>
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {topic.exerciseCount} bài tập
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GrammarIndex;