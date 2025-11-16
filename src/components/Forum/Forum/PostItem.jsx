import React, { useState } from "react";
import {
  Avatar,
  Card,
  Typography,
  Button,
  Divider,
  Dropdown,
  Modal,
  message,
} from "antd";
import {
  LikeOutlined,
  LikeFilled,
  MessageOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { togglePostLikeAPI, deletePostAPI } from "@/services/apiForum";
import CreateComment from "./CreateComment";
import CommentList from "./CommentList";
import { useAuth } from "@/context/authContext";
import EditPostModal from "./Modal/EditPostModal";

const { Text, Paragraph } = Typography;

const PostItem = ({ post, onPostUpdated, onPostDeleted }) => {
  const { user } = useAuth();
  const isOwner =
    user?.role === "ADMIN" ||
    user?.role === "TEACHER" ||
    (user && post?.idUser === user.idUser);

  const [liked, setLiked] = useState(post.isLikedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.forumComment || []);

  const [openEdit, setOpenEdit] = useState(false);

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    await togglePostLikeAPI({
      idForumPost: post.idForumPost,
      idUser: user.idUser,
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Xóa bài viết",
      content: "Bạn chắc chắn muốn xóa bài viết này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deletePostAPI(post.idForumPost);
          message.success("Đã xóa bài viết");
          onPostDeleted && onPostDeleted(post.idForumPost); // ✅ realtime
        } catch (err) {
          message.error("Xóa thất bại");
        }
      },
    });
  };

  const menuItems = [
    { key: "edit", label: "Chỉnh sửa", onClick: () => setOpenEdit(true) },
    {
      key: "delete",
      label: "Xóa bài viết",
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <>
      <Card
        className="mb-4 shadow-md hover:shadow-lg transition-all duration-200"
        style={{ borderRadius: 12 }}
      >
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <Avatar size={45} src={post.user?.avatar || null} />
            <div>
              <Text strong>{post.user?.nameUser}</Text>
              <div className="text-gray-500 text-xs">
                {new Date(post.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {isOwner && (
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          )}
        </div>

        <Paragraph className="mt-3 mb-2 text-base">{post.content}</Paragraph>

        {post.file && (
          <img
            src={post.file}
            alt="post"
            className="rounded-md mt-2 max-h-60 object-cover"
          />
        )}

        <Divider />

        <div className="flex justify-around text-gray-600">
          <Button
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
            {likeCount}
          </Button>

          <Button
            type="text"
            icon={<MessageOutlined />}
            onClick={() => setShowComments(!showComments)}
          >
            Bình luận ({comments.length})
          </Button>
        </div>

        {showComments && (
          <div className="mt-3">
            <CommentList comments={comments} />
            <Divider />
            <CreateComment
              idForumPost={post.idForumPost}
              onCommentCreated={(newCmt) =>
                setComments((prev) => [...prev, newCmt])
              }
            />
          </div>
        )}
      </Card>

      {/* ✅ Popup chỉnh sửa */}
      {openEdit && (
        <EditPostModal
          post={post}
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          onUpdated={(updatedPost) => onPostUpdated(updatedPost)}
        />
      )}
    </>
  );
};

export default PostItem;
