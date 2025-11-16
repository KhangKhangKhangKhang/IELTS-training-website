import { useEffect } from "react";
import ThreadItem from "./ThreadItem";
import { getAllThreadAPI } from "@/services/apiForum";
import { Spin } from "antd";
import { useState } from "react";

const ThreadSidebar = ({ onSelect, threads, setThreads }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const res = await getAllThreadAPI();
      setThreads(res.data); // ✅ lấy từ cha
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[260px] border-r p-4 space-y-3">
      <h2 className="font-bold text-lg mb-3">Chủ đề</h2>

      {loading && <Spin />}

      {!loading &&
        threads?.map((t) => (
          <ThreadItem
            key={t.idForumThreads}
            thread={t}
            onClick={() => onSelect(t)}
            setThreads={setThreads}
          />
        ))}

      {threads.length === 0 && !loading && (
        <p className="text-gray-400 text-sm">Chưa có chủ đề</p>
      )}
    </div>
  );
};

export default ThreadSidebar;
