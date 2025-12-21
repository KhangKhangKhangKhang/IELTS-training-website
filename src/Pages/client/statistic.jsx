import React, { useState } from "react";
import ThreadSidebar from "@/components/Forum/ThreadSidebar/ThreadSidebar";
import ForumBoard from "@/components/Forum/Forum/ForumBoard";
import { Button } from "antd";
import CreateThread from "@/components/Forum/Forum/CreateThread";
import { useAuth } from "@/context/authContext";

const Statistic = () => {
  const [selectedThread, setSelectedThread] = useState(null);
  const [threads, setThreads] = useState([]);
  const [openCreateThread, setOpenCreateThread] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <ThreadSidebar
              onSelect={(thread) => setSelectedThread(thread)}
              threads={threads}
              setThreads={setThreads}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    IELTS Forum
                  </h1>
                  <p className="text-slate-600">
                    Thảo luận và chia sẻ kinh nghiệm học tập
                  </p>
                </div>

                {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
                  <Button
                    type="primary"
                    size="large"
                    className="bg-slate-900 hover:bg-slate-800 border-slate-900 hover:border-slate-800"
                    onClick={() => setOpenCreateThread(true)}
                  >
                    + Tạo chủ đề
                  </Button>
                )}
              </div>
            </div>

            {selectedThread ? (
              <ForumBoard idForumThreads={selectedThread.idForumThreads} />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="text-slate-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Chọn một chủ đề
                </h3>
                <p className="text-slate-600">
                  Chọn chủ đề từ danh sách bên trái để xem bài viết
                </p>
              </div>
            )}

            <CreateThread
              open={openCreateThread}
              onClose={() => setOpenCreateThread(false)}
              setThreads={setThreads}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistic;
