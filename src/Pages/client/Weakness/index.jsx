import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "@/context/authContext";
import { getGrammarWeaknessAPI, getQuestionTypeWeaknessAPI } from "@/services/apiStatistics";

const Weakness = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grammar, setGrammar] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.idUser) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const [g, q] = await Promise.all([
          getGrammarWeaknessAPI(user.idUser).catch(() => null),
          getQuestionTypeWeaknessAPI(user.idUser).catch(() => null),
        ]);
        if (cancelled) return;
        const gData = g?.data ?? g;
        const qData = q?.data ?? q;
        setGrammar(Array.isArray(gData) ? gData : []);
        setQuestions(Array.isArray(qData) ? qData : []);
      } catch (err) {
        console.error("Error loading weakness:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.idUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafc]">
        <Spin size="large" />
      </div>
    );
  }

  const empty = grammar.length === 0 && questions.length === 0;

  return (
    <div className="min-h-screen bg-[#fafafc] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="bg-gradient-to-br from-[#fb7185] via-[#f59e0b] to-[#fbbf24] rounded-3xl p-6 text-white shadow-[0_4px_0_#b45309]">
          <button
            onClick={() => navigate(-1)}
            className="text-xs opacity-90 mb-3 hover:underline"
          >
            ← Quay lại
          </button>
          <h1
            className="text-2xl font-black"
            style={{ fontFamily: "Nunito" }}
          >
            Điểm yếu của tôi
          </h1>
          <p className="text-sm opacity-90 mt-1">
            Hệ thống phát hiện từ lịch sử làm bài. Làm thêm để cập nhật chính xác hơn.
          </p>
        </header>

        {empty ? (
          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-10 text-center">
            <div className="text-6xl mb-3">🦉</div>
            <p className="text-[#64748b] mb-1 font-bold">
              Chưa phát hiện điểm yếu nào.
            </p>
            <p className="text-sm text-[#64748b]">
              Làm thêm bài tập để hệ thống phân tích chính xác hơn.
            </p>
            <button
              onClick={() => navigate("/grammar-practice")}
              className="mt-4 px-5 py-2 rounded-2xl bg-[#eef2ff] text-[#4338ca] font-extrabold text-xs uppercase tracking-wide hover:bg-[#e0e7ff] transition-all"
            >
              Luyện tập ngay →
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-lg font-black text-[#1e1b4b] flex items-center gap-2"
                  style={{ fontFamily: "Nunito" }}
                >
                  <span className="text-2xl">📚</span> Điểm yếu ngữ pháp
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  Top {grammar.length}
                </span>
              </div>
              {grammar.length === 0 ? (
                <p className="text-sm text-[#64748b]">Chưa có dữ liệu.</p>
              ) : (
                <ul className="space-y-2.5">
                  {grammar.map((item, idx) => {
                    const title = item.title || item.name || "Grammar";
                    const errCount =
                      item.violations ?? item.wrongCount ?? item.exercisesWrong ?? 0;
                    return (
                      <li
                        key={item.idGrammar || idx}
                        onClick={() =>
                          navigate(
                            `/grammar-practice?topic=${encodeURIComponent(title)}`
                          )
                        }
                        className="flex items-center justify-between p-3 bg-red-50 rounded-2xl border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-[#1e1b4b] truncate">
                            {title}
                          </div>
                          <div className="text-xs text-[#64748b]">
                            {errCount} lỗi
                            {item.accuracy != null && ` · accuracy ${item.accuracy}%`}
                          </div>
                        </div>
                        <span className="text-red-600 text-lg ml-2">→</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-lg font-black text-[#1e1b4b] flex items-center gap-2"
                  style={{ fontFamily: "Nunito" }}
                >
                  <span className="text-2xl">🎯</span> Dạng câu hay sai
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Top {questions.length}
                </span>
              </div>
              {questions.length === 0 ? (
                <p className="text-sm text-[#64748b]">Chưa có dữ liệu.</p>
              ) : (
                <ul className="space-y-2.5">
                  {questions.map((item, idx) => {
                    const qType = item.questionType || item.type || "—";
                    const skill = item.skillType || item.skill || "";
                    const errorRate =
                      typeof item.errorRate === "number"
                        ? Math.round(item.errorRate * 100)
                        : 0;
                    return (
                      <li
                        key={`${qType}-${idx}`}
                        className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl border border-orange-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-[#1e1b4b] truncate">
                            {qType}
                          </div>
                          {skill && (
                            <div className="text-xs text-[#64748b]">{skill}</div>
                          )}
                        </div>
                        <div className="text-right ml-2 flex-none">
                          <div className="text-sm font-black text-orange-600">
                            {errorRate}%
                          </div>
                          <div className="text-[10px] text-[#64748b]">sai</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Weakness;
