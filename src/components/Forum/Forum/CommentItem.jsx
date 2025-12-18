import { useState } from "react";
import { Avatar, Button, Modal, Input, message } from "antd";
// Thêm DeleteOutlined vào đây
import {
  LikeOutlined,
  LikeFilled,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  toggleCommentLikeAPI,
  updateCommentAPI,
  deleteCommentAPI,
} from "@/services/apiForum";
import { useAuth } from "@/context/authContext";

const CommentItem = ({ comment, onUpdated, onDeleted }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(comment.isCommentLikedByCurrentUser);
  const [count, setCount] = useState(comment.commentLikeCount);
  const [openEdit, setOpenEdit] = useState(false);
  const [newContent, setNewContent] = useState(comment.content);

  // Kiểm tra quyền: ADMIN hoặc chính chủ comment
  const canAction =
    user?.role === "ADMIN" || (user && user.idUser === comment.idUser);

  const handleLike = async () => {
    setLiked(!liked);
    setCount((prev) => (liked ? prev - 1 : prev + 1));
    await toggleCommentLikeAPI({
      idForumComment: comment.idForumComment,
      idUser: user.idUser,
    });
  };

  const handleUpdate = async () => {
    try {
      const body = {
        idForumPost: comment.idForumPost,
        idUser: user.idUser,
        content: newContent,
      };
      await updateCommentAPI(comment.idForumComment, body);
      onUpdated && onUpdated(newContent);
      message.success("Đã cập nhật bình luận!");
      setOpenEdit(false);
    } catch {
      message.error("Cập nhật thất bại!");
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Xóa bình luận",
      content: "Bạn có chắc chắn muốn xóa bình luận này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteCommentAPI(comment.idForumComment);
          message.success("Đã xóa bình luận!");
          // Gọi callback để cha xóa khỏi state
          onDeleted && onDeleted(comment.idForumComment);
        } catch (error) {
          message.error("Xóa thất bại!");
        }
      },
    });
  };

  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex gap-3">
        <Avatar
          size={40}
          src={comment.user?.avatar || null}
          className="border border-slate-300"
        />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900">
              {comment.user?.nameUser}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>

          <p className="text-slate-700 mb-2">{comment.content}</p>

          <div className="flex gap-4 items-center">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-sm ${
                liked ? "text-blue-600" : "text-slate-600"
              } hover:text-blue-600 hover:cursor-pointer transition-colors`}
            >
              {liked ? <LikeFilled /> : <LikeOutlined />}
              <span>Thích</span>
            </button>

            {canAction && (
              <div className="flex gap-3">
                <button
                  onClick={() => setOpenEdit(true)}
                  className="flex hover:cursor-pointer items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <EditOutlined />
                  <span>Sửa</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex hover:cursor-pointer items-center gap-1 text-sm text-slate-600 hover:text-red-600 transition-colors"
                >
                  <DeleteOutlined />
                  <span>Xóa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        title="Chỉnh sửa bình luận"
        open={openEdit}
        onCancel={() => setOpenEdit(false)}
        onOk={handleUpdate}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Input.TextArea
          rows={4}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="rounded-lg border-slate-300 mt-4"
        />
      </Modal>
    </div>
  );
};

export default CommentItem;
