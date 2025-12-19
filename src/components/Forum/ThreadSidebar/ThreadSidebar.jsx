// ThreadSidebar - Updated với scroll độc lập và enhanced UI
import { useEffect } from "react";
import ThreadItem from "./ThreadItem";
import { getAllThreadAPI } from "@/services/apiForum";
import { Spin, Input } from "antd";
import { useState } from "react";
import { SearchOutlined, MessageOutlined, FireOutlined } from "@ant-design/icons";

const ThreadSidebar = ({ onSelect, threads, setThreads }) => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const res = await getAllThreadAPI();
      setThreads(res.data);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = threads.filter((thread) =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden h-fit sticky top-6">
      {/* Header với gradient */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-6 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
            <MessageOutlined className="text-xl text-blue-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Chủ đề thảo luận</h2>
            <p className="text-white/70 text-xs">{threads.length} chủ đề</p>
          </div>
        </div>

        <div className="relative">
          <Input
            placeholder="Tìm kiếm chủ đề..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl border-0 bg-white/90 backdrop-blur-sm shadow-lg h-10 pl-10"
          />
        </div>
      </div>

      {/* Trending badge */}
      <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-2 text-amber-700">
          <FireOutlined className="text-orange-500" />
          <span className="text-sm font-medium">Thảo luận nổi bật</span>
        </div>
      </div>

      {/* Danh sách có thể scroll */}
      <div className="h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            </div>
            <p className="text-slate-500 text-sm mt-3">Đang tải...</p>
          </div>
        )}

        <div className="p-4 space-y-3">
          {!loading &&
            filteredThreads.map((t, index) => (
              <ThreadItem
                key={t.idForumThreads}
                thread={t}
                onClick={() => onSelect(t)}
                setThreads={setThreads}
                isFirst={index === 0}
              />
            ))}
          {!loading && filteredThreads.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-100 to-blue-100 flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <p className="text-slate-600 font-medium mb-1">Không tìm thấy chủ đề</p>
              <p className="text-slate-400 text-sm">Thử tìm kiếm với từ khóa khác</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadSidebar;
