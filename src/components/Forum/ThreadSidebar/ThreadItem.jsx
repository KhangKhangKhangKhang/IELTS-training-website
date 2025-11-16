import { Button, Popconfirm } from "antd";
import { useAuth } from "@/context/authContext";
import { deleteThreadAPI } from "@/services/apiForum";
import { message } from "antd";
import { useState } from "react";
import EditThreadModal from "@/components/Forum/Forum/Modal/EditThreadModal";

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
    <div className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition">
      <div onClick={onClick} className="cursor-pointer">
        <div className="font-medium">{thread.title}</div>
        <div className="text-xs text-gray-500">{thread.content}</div>
      </div>

      {/* ✅ Chỉ hiện khi user là người tạo */}
      {user?.role === "ADMIN" && (
        <div className="flex gap-2 mt-2">
          <Button size="small" onClick={() => setOpenEdit(true)}>
            Sửa
          </Button>

          <Popconfirm
            title="Bạn chắc chắn muốn xóa?"
            onConfirm={handleDelete}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </div>
      )}

      {/* ✅ Modal chỉnh sửa */}
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
