import { useState } from "react";
import { Avatar, Button, Modal, Input, message } from "antd";
import { LikeOutlined, LikeFilled } from "@ant-design/icons";
import { toggleCommentLikeAPI, updateCommentAPI } from "@/services/apiForum";
import { useAuth } from "@/context/authContext";

const CommentItem = ({ comment, onUpdated }) => {
  const { user } = useAuth();

  const [liked, setLiked] = useState(comment.isCommentLikedByCurrentUser);
  const [count, setCount] = useState(comment.commentLikeCount);

  const [openEdit, setOpenEdit] = useState(false);
  const [newContent, setNewContent] = useState(comment.content);

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

      // cập nhật UI real-time lên CommentList/PostItem
      onUpdated && onUpdated(newContent);

      message.success("Đã cập nhật bình luận!");
      setOpenEdit(false);
    } catch {
      message.error("Cập nhật thất bại!");
    }
  };

  return (
    <div className="p-2 bg-gray-100 rounded flex gap-2 items-start">
      <Avatar size={30} src={comment.user?.avatar || null} />

      <div className="flex-1">
        <div className="text-sm font-semibold">{comment.user?.nameUser}</div>
        <div className="text-sm">{comment.content}</div>

        <div className="flex gap-2 items-center mt-1">
          <Button
            size="small"
            type="text"
            icon={
              liked ? (
                <LikeFilled style={{ color: "#1677ff" }} />
              ) : (
                <LikeOutlined />
              )
            }
            onClick={handleLike}
          >
            {count}
          </Button>

          {(user?.idUser === comment.idUser || user?.role === "ADMIN") && (
            <Button size="small" type="text" onClick={() => setOpenEdit(true)}>
              Sửa
            </Button>
          )}
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
        />
      </Modal>
    </div>
  );
};

export default CommentItem;
