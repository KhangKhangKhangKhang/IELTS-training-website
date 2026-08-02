// ThreadSidebar - refactor theo MagicPath mockup
// Header gradient indigo, search input thuần Tailwind, hot strip, scrollable list.
import { useEffect, useState } from "react";
import { FixedSizeList } from "react-window";
import ThreadItem from "./ThreadItem";
import { getAllThreadAPI } from "@/services/apiForum";

const ThreadSidebar = ({ onSelect, threads, setThreads, selectedThreadId }) => {
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

  const filteredThreads = (threads || []).filter((thread) =>
    (thread.title || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <aside className="bg-white border-2 border-[#e6e6ed] rounded-2xl shadow-[0_2px_0_#e6e6ed] overflow-hidden h-fit sticky top-6">
      {/* Header gradient indigo */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
            💬
          </div>
          <div>
            <h2 className="font-bold text-base text-white leading-tight">
              Chủ đề thảo luận
            </h2>
            <p className="text-white/70 text-xs">
              {(threads || []).length} chủ đề
            </p>
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm chủ đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-indigo-200 border-0"
          />
        </div>
      </div>

      {/* Hot strip */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border-b border-amber-200">
        <span>🔥</span>
        <span className="text-xs font-bold text-amber-700">
          Thảo luận nổi bật
        </span>
      </div>

      {/* List scrollable */}
      <div className="p-3 max-h-[560px]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <p className="text-slate-500 text-sm mt-3">Đang tải...</p>
          </div>
        )}

        {!loading && filteredThreads.length > 50 && (
          <FixedSizeList
            height={560}
            width="100%"
            itemSize={72}
            itemCount={filteredThreads.length}
            itemData={{
              threads: filteredThreads,
              onClick: onSelect,
              setThreads,
              isFirst: (i) => i === 0,
              isSelected: (t) => t.idForumThreads === selectedThreadId,
            }}
          >
            {ThreadRow}
          </FixedSizeList>
        )}

        {!loading && filteredThreads.length <= 50 && filteredThreads.length > 0 && (
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "560px" }}>
            {filteredThreads.map((t, index) => (
              <ThreadItem
                key={t.idForumThreads}
                thread={t}
                onClick={() => onSelect?.(t)}
                setThreads={setThreads}
                isFirst={index === 0}
                isSelected={t.idForumThreads === selectedThreadId}
              />
            ))}
          </div>
        )}

        {!loading && filteredThreads.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 flex items-center justify-center mb-3 text-2xl">
              🔍
            </div>
            <p className="text-slate-600 font-medium mb-1">
              Không tìm thấy chủ đề
            </p>
            <p className="text-slate-400 text-sm">
              Thử tìm kiếm với từ khóa khác
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

const ThreadRow = ({ index, style, data }) => {
  const thread = data.threads[index];
  return (
    <div style={style}>
      <ThreadItem
        thread={thread}
        index={index}
        onClick={() => data.onClick?.(thread)}
        setThreads={data.setThreads}
        isFirst={data.isFirst(index)}
        isSelected={data.isSelected(thread)}
      />
    </div>
  );
};

export default ThreadSidebar;
