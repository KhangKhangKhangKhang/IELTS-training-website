// PostItem - Updated
import React, { useState } from "react";
import { Avatar, Card, Button, Dropdown, Modal, message } from "antd";
import {
  LikeOutlined,
  LikeFilled,
  MessageOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { togglePostLikeAPI, deletePostAPI } from "@/services/apiForum";
import CreateComment from "./CreateComment";
import CommentList from "./CommentList";
import { useAuth } from "@/context/authContext";
import EditPostModal from "./Modal/EditPostModal";

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
          onPostDeleted && onPostDeleted(post.idForumPost);
        } catch (err) {
          message.error("Xóa thất bại");
        }
      },
    });
  };
  const handleCommentDeleted = (idForumComment) => {
    setComments((prev) =>
      prev.filter((c) => c.idForumComment !== idForumComment)
    );
  };

  const menuItems = [
    {
      key: "edit",
      label: "Chỉnh sửa",
      icon: <EditOutlined />,
      onClick: () => setOpenEdit(true),
    },
    {
      key: "delete",
      label: "Xóa bài viết",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <Avatar
              size={48}
              src={post.user?.avatar || null}
              className="border border-slate-300"
            />
            <div>
              <h4 className="font-semibold text-slate-900">
                {post.user?.nameUser}
              </h4>
              <p className="text-sm text-slate-500">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {isOwner && (
            <Dropdown
              menu={{ items: menuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreOutlined className="text-slate-400" />}
                className="hover:bg-slate-100 rounded-lg"
              />
            </Dropdown>
          )}
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        </div>

        {/* Media */}
        {post.file && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img
              src={post.file}
              alt="post"
              className="w-full max-h-96 object-cover rounded-xl"
            />
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-slate-500 mb-4">
          <span>{likeCount} lượt thích</span>
          <span>{comments.length} bình luận</span>
        </div>

        {/* Actions */}
        <div className="flex border-t border-b border-slate-200 py-2">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 hover:cursor-pointer py-2 rounded-lg transition-colors ${
              liked
                ? "text-blue-600 bg-blue-50"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {liked ? <LikeFilled /> : <LikeOutlined />}
            <span>Thích</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex-1 flex items-center justify-center hover:cursor-pointer gap-2 py-2 rounded-lg transition-colors ${
              showComments
                ? "text-slate-900 bg-slate-50"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <MessageOutlined />
            <span>Bình luận</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-4">
            <CommentList
              comments={comments}
              onCommentDeleted={handleCommentDeleted}
            />
            <CreateComment
              idForumPost={post.idForumPost}
              onCommentCreated={(newCmt) =>
                setComments((prev) => [...prev, newCmt])
              }
            />
          </div>
        )}
      </div>

      <EditPostModal
        post={post}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onUpdated={onPostUpdated}
      />
    </>
  );
};

export default PostItem;
