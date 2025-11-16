import React, { useState } from "react";
import ThreadSidebar from "@/components/Forum/ThreadSidebar/ThreadSidebar";
import ForumBoard from "@/components/Forum/Forum/ForumBoard";
import { Button } from "antd";
import CreateThread from "@/components/Forum/Forum/CreateThread";
import { useAuth } from "@/context/authContext";

const Statistic = () => {
  const [selectedThread, setSelectedThread] = useState(null);

  // ✅ thêm state để chứa danh sách thread
  const [threads, setThreads] = useState([]);

  const [openCreateThread, setOpenCreateThread] = useState(false);
  const { user } = useAuth();

  return (
    <div className="w-full flex gap-4 p-4">
      {/* ✅ truyền threads và setThreads xuống Sidebar */}
      <ThreadSidebar
        onSelect={(thread) => setSelectedThread(thread)}
        threads={threads}
        setThreads={setThreads}
      />

      <div className="flex-1">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">IELTS Forum</h1>

          {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
            <Button type="primary" onClick={() => setOpenCreateThread(true)}>
              + Tạo chủ đề
            </Button>
          )}
        </div>

        {selectedThread ? (
          <ForumBoard idForumThreads={selectedThread.idForumThreads} />
        ) : (
          <div className="text-center text-gray-500 p-10">
            Chọn 1 chủ đề bên trái để xem bài viết
          </div>
        )}

        <CreateThread
          open={openCreateThread}
          onClose={() => setOpenCreateThread(false)}
          setThreads={setThreads} // ✅ giờ mới có đủ
        />
      </div>
    </div>
  );
};

export default Statistic;
