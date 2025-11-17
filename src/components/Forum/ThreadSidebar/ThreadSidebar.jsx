// ThreadSidebar - Updated với scroll độc lập
import { useEffect } from "react";
import ThreadItem from "./ThreadItem";
import { getAllThreadAPI } from "@/services/apiForum";
import { Spin, Input } from "antd";
import { useState } from "react";
import { SearchOutlined } from "@ant-design/icons";

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
    <div className="w-80 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
      {/* Header cố định */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="font-bold text-xl text-slate-900 mb-4">
          Chủ đề thảo luận
        </h2>
        <Input
          placeholder="Tìm kiếm chủ đề..."
          prefix={<SearchOutlined className="text-slate-400" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-lg border-slate-300"
        />
      </div>

      {/* Danh sách có thể scroll */}
      <div className="mt-4 h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
        {loading && (
          <div className="flex justify-center py-4">
            <Spin />
          </div>
        )}

        <div className="space-y-3 pr-2">
          {" "}
          {/* Thêm padding-right để tránh bị scrollbar che */}
          {!loading &&
            filteredThreads.map((t) => (
              <ThreadItem
                key={t.idForumThreads}
                thread={t}
                onClick={() => onSelect(t)}
                setThreads={setThreads}
              />
            ))}
          {!loading && filteredThreads.length === 0 && (
            <div className="text-center py-8">
              <div className="text-slate-400 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <p className="text-slate-500">Không tìm thấy chủ đề</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadSidebar;
