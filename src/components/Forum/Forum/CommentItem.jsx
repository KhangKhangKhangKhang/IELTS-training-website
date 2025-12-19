// CommentItem - Updated with enhanced UI
import { useState } from "react";
import { Avatar, Button, Modal, Input, message, Tooltip } from "antd";
import {
  LikeOutlined,
  LikeFilled,
  EditOutlined,
  DeleteOutlined,
  HeartFilled,
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
  const [isHovered, setIsHovered] = useState(false);

  // Kiểm tra quyền: ADMIN hoặc chính chủ comment
  const canAction =
    user?.role === "ADMIN" || (user && user.idUser === comment.idUser);

  // Format time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins}p`;
    if (diffHours < 24) return `${diffHours}h`;
    return past.toLocaleDateString("vi-VN");
  };

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
    <div
      className={`p-4 rounded-2xl transition-all duration-300 ${isHovered
          ? "bg-gradient-to-r from-blue-50 to-blue-50 border-2 border-blue-100"
          : "bg-slate-50 border-2 border-transparent"
        }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-3">
        <Avatar
          size={40}
          src={comment.user?.avatar || null}
          className="border-2 border-white shadow-sm flex-shrink-0"
        >
          {comment.user?.nameUser?.charAt(0)?.toUpperCase()}
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Comment bubble */}
          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900 text-sm hover:text-blue-600 cursor-pointer transition-colors">
                {comment.user?.nameUser}
              </span>
              <Tooltip
                title={new Date(comment.created_at).toLocaleString("vi-VN")}
              >
                <span className="text-xs text-slate-400 cursor-help">
                  • {getTimeAgo(comment.created_at)}
                </span>
              </Tooltip>
            </div>

            <p className="text-slate-700 text-sm leading-relaxed">
              {comment.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 items-center mt-2 ml-1">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-200 ${liked
                  ? "text-blue-500"
                  : "text-slate-500 hover:text-blue-500"
                }`}
            >
              {liked ? (
                <HeartFilled className="text-sm" />
              ) : (
                <LikeOutlined className="text-sm" />
              )}
              <span>{count > 0 ? count : "Thích"}</span>
            </button>

            {canAction && (
              <>
                <button
                  onClick={() => setOpenEdit(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <EditOutlined className="text-sm" />
                  <span>Sửa</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors"
                >
                  <DeleteOutlined className="text-sm" />
                  <span>Xóa</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        title={
          <span className="text-slate-900 font-semibold">
            Chỉnh sửa bình luận
          </span>
        }
        open={openEdit}
        onCancel={() => setOpenEdit(false)}
        onOk={handleUpdate}
        okText="Lưu"
        cancelText="Hủy"
        className="rounded-2xl"
        okButtonProps={{
          className:
            "bg-gradient-to-r from-blue-600 to-blue-600 border-0 rounded-lg",
        }}
        cancelButtonProps={{
          className: "rounded-lg",
        }}
      >
        <Input.TextArea
          rows={4}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="rounded-xl border-slate-200 mt-4 focus:border-blue-300"
          placeholder="Nhập nội dung bình luận..."
        />
      </Modal>
    </div>
  );
};

export default CommentItem;
