import React, { useEffect, useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, ClipboardCheck, TrendingUp, Flame } from "lucide-react";
import { useTheme } from "@/context/themeContext";
import {
  getDashboardOverviewAPI,
  getDashboardSkillPerformanceAPI,
  getDashboardTopStreaksAPI,
  getDashboardTopPerformersAPI,
} from "@/services/apiTeacherDashboard";

const TeacherDashboard = () => {
  const [overview, setOverview] = useState({
    totalStudents: 0,
    testsThisMonth: 0,
    avgBandScore: 0,
  });
  const [skills, setSkills] = useState({
    LISTENING: 0,
    READING: 0,
    WRITING: 0,
    SPEAKING: 0,
  });
  const [topStreaks, setTopStreaks] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isDark } = useTheme();

  const radarValueLabel = ({ value, x, y }) => {
    if (value == null || x == null || y == null) {
      return null;
    }

    return (
      <text
        x={x}
        y={y - 10}
        fill={isDark ? "#e2e8f0" : "#1e293b"}
        fontSize={12}
        fontWeight={700}
        textAnchor="middle"
      >
        {Number(value).toFixed(1)}
      </text>
    );
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const [overviewData, skillsData, topStreaksData, topPerformersData] =
          await Promise.all([
            getDashboardOverviewAPI(),
            getDashboardSkillPerformanceAPI(),
            getDashboardTopStreaksAPI(),
            getDashboardTopPerformersAPI(),
          ]);

        if (!isMounted) {
          return;
        }

        setOverview(overviewData);
        setSkills(skillsData);
        setTopStreaks(topStreaksData);
        setTopPerformers(topPerformersData);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const radarData = useMemo(
    () => [
      { skill: "Nghe", diem: skills.LISTENING },
      { skill: "Đọc", diem: skills.READING },
      { skill: "Viết", diem: skills.WRITING },
      { skill: "Nói", diem: skills.SPEAKING },
    ],
    [skills],
  );

  const metricCards = [
    {
      title: "Tổng học viên",
      value: overview.totalStudents.toLocaleString("vi-VN"),
      icon: Users,
      tone: "from-indigo-100 to-blue-100 text-indigo-700",
      ring: "ring-indigo-200",
      darkTone: "dark:from-indigo-500/20 dark:to-blue-500/20 dark:text-indigo-300",
      darkRing: "dark:ring-indigo-500/40",
    },
    {
      title: "Bài test tháng này",
      value: overview.testsThisMonth.toLocaleString("vi-VN"),
      icon: ClipboardCheck,
      tone: "from-sky-100 to-cyan-100 text-sky-700",
      ring: "ring-sky-200",
      darkTone: "dark:from-sky-500/20 dark:to-cyan-500/20 dark:text-sky-300",
      darkRing: "dark:ring-sky-500/40",
    },
    {
      title: "Điểm band trung bình",
      value: overview.avgBandScore.toFixed(1),
      icon: TrendingUp,
      tone: "from-slate-100 to-indigo-100 text-slate-700",
      ring: "ring-slate-200",
      darkTone: "dark:from-slate-500/20 dark:to-indigo-500/20 dark:text-slate-200",
      darkRing: "dark:ring-slate-500/40",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/85 dark:bg-slate-800/95 p-5 shadow-sm backdrop-blur-sm md:p-6 transition-colors duration-300">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white md:text-3xl">
            Bảng điều khiển giáo viên
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 md:text-base">
            Theo dõi nhanh tình hình học tập và hiệu suất IELTS của học viên.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {metricCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:shadow-slate-900/30 ${loading ? "animate-pulse" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">{card.value}</p>
                  </div>

                  <div
                    className={`rounded-xl bg-gradient-to-br p-2.5 ring-1 ${card.tone} ${card.ring} ${card.darkTone} ${card.darkRing}`}
                  >
                    <Icon size={20} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm xl:col-span-8 md:p-5 transition-colors duration-300">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white md:text-xl">
                Phân tích hiệu suất kỹ năng
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Trung bình điểm theo 4 kỹ năng IELTS.
              </p>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke={isDark ? "#475569" : "#cbd5e1"} />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: isDark ? "#cbd5e1" : "#475569", fontSize: 13, fontWeight: 600 }}
                  />
                  <Tooltip
                    formatter={(value) => [Number(value).toFixed(1), "Điểm"]}
                    contentStyle={{
                      borderRadius: 10,
                      border: isDark ? "1px solid #475569" : "1px solid #cbd5e1",
                      backgroundColor: isDark ? "#1e293b" : "#ffffff",
                      color: isDark ? "#e2e8f0" : "#0f172a",
                    }}
                    labelStyle={{ color: isDark ? "#e2e8f0" : "#0f172a" }}
                  />
                  <Radar
                    name="Điểm trung bình"
                    dataKey="diem"
                    stroke="#4f46e5"
                    fill="#6366f1"
                    fillOpacity={0.35}
                    strokeWidth={2.5}
                    dot={{
                      r: 5,
                      fill: "#4f46e5",
                      stroke: isDark ? "#0f172a" : "#ffffff",
                      strokeWidth: 2,
                    }}
                    label={radarValueLabel}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm xl:col-span-4 md:p-5 transition-colors duration-300">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white md:text-xl">
                Dẫn đầu chuỗi học tập
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Top 5 học viên giữ nhịp học ổn định nhất.</p>
            </div>

            <ul className="space-y-3">
              {topStreaks.map((student, index) => (
                <li
                  key={student.idUser}
                  className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-700/40 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      #{index + 1} {student.nameUser}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-500/20 px-3 py-1 text-sm font-semibold text-orange-700 dark:text-orange-300">
                    <Flame size={14} />
                    {student.currentStreak} ngày 🔥
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm md:p-5 transition-colors duration-300">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white md:text-xl">Học viên xuất sắc</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Xếp hạng theo điểm trung bình trên tất cả bài đã hoàn thành.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-sm text-slate-500 dark:text-slate-300">
                  <th className="px-2 py-2.5 font-medium">Hạng</th>
                  <th className="px-2 py-2.5 font-medium">Tên học viên</th>
                  <th className="px-2 py-2.5 font-medium">Điểm trung bình</th>
                  <th className="px-2 py-2.5 font-medium">Tổng bài test</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((student, index) => (
                  <tr key={student.idUser} className="border-b border-slate-100 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200">
                    <td className="px-2 py-3 font-semibold text-indigo-600 dark:text-indigo-300">#{index + 1}</td>
                    <td className="px-2 py-3 font-medium text-slate-800 dark:text-slate-100">{student.nameUser}</td>
                    <td className="px-2 py-3">{Number(student.averageBandScore).toFixed(1)}</td>
                    <td className="px-2 py-3">{student.totalTestsTaken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TeacherDashboard;
