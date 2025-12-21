// ThreadItem - Updated with enhanced UI
import { Button, Popconfirm, message, Tooltip } from "antd";
import { useAuth } from "@/context/authContext";
import { deleteThreadAPI } from "@/services/apiForum";
import { useState } from "react";
import EditThreadModal from "@/components/Forum/Forum/Modal/EditThreadModal";
import {
  EditOutlined,
  DeleteOutlined,
  MessageOutlined,
  FireFilled,
  RightOutlined,
} from "@ant-design/icons";

const ThreadItem = ({ thread, onClick, setThreads, isFirst }) => {
  const { user } = useAuth();
  const [openEdit, setOpenEdit] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteThreadAPI(thread.idForumThreads);
      message.success("Xóa thành công!");
      setThreads((prev) =>
        prev.filter((t) => t.idForumThreads !== thread.idForumThreads)
      );
    } catch (error) {
      message.error("Xóa thất bại!");
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden ${isHovered
        ? "bg-gradient-to-r from-blue-50 via-blue-50 to-pink-50 dark:from-blue-900/30 dark:via-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 shadow-md"
        : "bg-slate-50 dark:bg-slate-700/50 border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-600"
        }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Trending badge cho item đầu tiên */}
      {isFirst && (
        <div className="absolute -top-1 -right-1">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-blue-400 rounded-bl-xl flex items-center justify-center shadow-lg">
            <FireFilled className="text-white text-xs" />
          </div>
        </div>
      )}

      <div onClick={onClick} className="mb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 dark:text-white mb-1.5 line-clamp-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
              {thread.title}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {thread.content}
            </div>
          </div>
          <RightOutlined
            className={`text-slate-300 dark:text-slate-500 transition-all duration-300 flex-shrink-0 mt-1 ${isHovered ? "text-blue-500 dark:text-blue-400 translate-x-1" : ""
              }`}
          />
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <MessageOutlined />
            <span>Thảo luận</span>
          </div>
        </div>
      </div>

      {user?.role === "ADMIN" && (
        <div
          className={`flex gap-2 transition-all duration-300 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            }`}
        >
          <Tooltip title="Chỉnh sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setOpenEdit(true);
              }}
              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg"
            >
              Sửa
            </Button>
          </Tooltip>

          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn chắc chắn muốn xóa chủ đề này?"
            onConfirm={handleDelete}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{
              className: "bg-red-600 border-red-600 rounded-lg",
            }}
          >
            <Tooltip title="Xóa chủ đề">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg"
              >
                Xóa
              </Button>
            </Tooltip>
          </Popconfirm>
        </div>
      )}

      <EditThreadModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        thread={thread}
        setThreads={setThreads}
      />
    </div>
  );
};

export default ThreadItem;
