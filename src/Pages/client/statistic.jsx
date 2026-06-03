// Trang forum (route /statistic, /teacher/statistic, /admin/statistic)
// Layout 2-col grid Tailwind, header có nút "+ Tạo bài viết" toggle composer
// theo MagicPath mockup.
import { useState } from "react";
import ThreadSidebar from "@/components/Forum/ThreadSidebar/ThreadSidebar";
import ForumBoard from "@/components/Forum/Forum/ForumBoard";
import CreateThread from "@/components/Forum/Forum/CreateThread";
import { useAuth } from "@/context/authContext";
import Card from "@/components/Forum/UI/Card";
import Badge from "@/components/Forum/UI/Badge";

const Statistic = () => {
  const [selectedThread, setSelectedThread] = useState(null);
  const [threads, setThreads] = useState([]);
  const [openCreateThread, setOpenCreateThread] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const { user } = useAuth();

  const canCreate = user?.role === "ADMIN" || user?.role === "GIAOVIEN";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Sidebar */}
        <ThreadSidebar
          onSelect={(thread) => setSelectedThread(thread)}
          threads={threads}
          setThreads={setThreads}
          selectedThreadId={selectedThread?.idForumThreads}
        />

        {/* Main */}
        <main className="min-w-0 space-y-5">
          {/* Page header */}
          <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 rounded-2xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] p-6 text-white relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                {selectedThread ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1">
                      Đang xem
                    </p>
                    <h1 className="text-2xl md:text-3xl font-bold truncate">
                      {selectedThread.title}
                    </h1>
                    {selectedThread.content && (
                      <p className="text-sm text-white/80 mt-1 line-clamp-2 max-w-2xl">
                        {selectedThread.content}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl md:text-3xl font-bold">IELTS Forum</h1>
                    <p className="text-sm text-white/80 mt-1">
                      Thảo luận và chia sẻ kinh nghiệm học tập
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {canCreate && (
                  <button
                    onClick={() => setOpenCreateThread(true)}
                    className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur text-white border-2 border-white/30 hover:bg-white/25 font-bold text-sm transition-all"
                  >
                    + Tạo chủ đề
                  </button>
                )}
                <button
                  onClick={() => setShowComposer((v) => !v)}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-sm active:translate-y-[1px] transition-all ${
                    showComposer
                      ? "bg-white text-slate-700 hover:bg-slate-100 shadow-[0_3px_0_rgba(0,0,0,0.2)]"
                      : "bg-white text-indigo-700 hover:bg-indigo-50 shadow-[0_3px_0_rgba(0,0,0,0.2)]"
                  }`}
                >
                  {showComposer ? "✕ Đóng" : "+ Tạo bài viết"}
                </button>
              </div>
            </div>
          </div>

          {/* Board hoặc empty state */}
          {selectedThread ? (
            <ForumBoard
              key={selectedThread.idForumThreads}
              idForumThreads={selectedThread.idForumThreads}
              showComposer={showComposer}
            />
          ) : (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 text-3xl">
                💬
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Chọn một chủ đề
              </h3>
              <p className="text-sm text-slate-500">
                Chọn chủ đề từ danh sách bên trái để xem bài viết
              </p>
              {threads.length === 0 && (
                <div className="mt-4 inline-flex items-center gap-2">
                  <Badge tone="slate">Chưa có chủ đề nào</Badge>
                </div>
              )}
            </Card>
          )}
        </main>
      </div>

      <CreateThread
        open={openCreateThread}
        onClose={() => setOpenCreateThread(false)}
        setThreads={setThreads}
      />
    </div>
  );
};

export default Statistic;
