// ThreadItem - Updated
import { Button, Popconfirm, message } from "antd";
import { useAuth } from "@/context/authContext";
import { deleteThreadAPI } from "@/services/apiForum";
import { useState } from "react";
import EditThreadModal from "@/components/Forum/Forum/Modal/EditThreadModal";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const ThreadItem = ({ thread, onClick, setThreads }) => {
  const { user } = useAuth();
  const [openEdit, setOpenEdit] = useState(false);

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
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200 group">
      <div onClick={onClick} className="cursor-pointer mb-2">
        <div className="font-semibold text-slate-900 mb-1">{thread.title}</div>
        <div className="text-sm text-slate-600 line-clamp-2">
          {thread.content}
        </div>
      </div>

      {user?.role === "ADMIN" && (
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setOpenEdit(true)}
            className="text-slate-600 hover:text-slate-900 border-slate-300 rounded-lg"
          >
            Sửa
          </Button>

          <Popconfirm
            title="Bạn chắc chắn muốn xóa?"
            onConfirm={handleDelete}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{
              className: "bg-red-600 border-red-600 rounded-lg",
            }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              className="rounded-lg"
            >
              Xóa
            </Button>
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
