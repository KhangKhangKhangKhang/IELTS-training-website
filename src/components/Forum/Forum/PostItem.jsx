// PostItem - Updated with enhanced UI
import React, { useState } from "react";
import { Avatar, Card, Button, Dropdown, Modal, message, Tooltip } from "antd";
import {
  LikeOutlined,
  LikeFilled,
  MessageOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  HeartOutlined,
  HeartFilled,
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
  const [isHovered, setIsHovered] = useState(false);

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

  // Format time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return past.toLocaleDateString("vi-VN");
  };

  return (
    <>
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-300 p-6 mb-5 ${isHovered
          ? "border-blue-200 dark:border-blue-700 shadow-lg shadow-blue-50 dark:shadow-blue-900/20"
          : "border-slate-100 dark:border-slate-700 shadow-sm"
          }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar
                size={52}
                src={post.user?.avatar || null}
                className="border-2 border-blue-100 ring-2 ring-offset-2 ring-blue-50"
              >
                {post.user?.nameUser?.charAt(0)?.toUpperCase()}
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-base hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                {post.user?.nameUser}
              </h4>
              <Tooltip title={new Date(post.created_at).toLocaleString("vi-VN")}>
                <p className="text-sm text-slate-500 dark:text-slate-400 cursor-help">
                  {getTimeAgo(post.created_at)}
                </p>
              </Tooltip>
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
                icon={<MoreOutlined className="text-slate-400 text-lg" />}
                className="hover:bg-slate-100 rounded-xl w-10 h-10"
              />
            </Dropdown>
          )}
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        </div>

        {/* Media */}
        {post.file && (
          <div className="mb-4 rounded-2xl overflow-hidden group relative">
            <img
              src={post.file}
              alt="post"
              className="w-full max-h-[500px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 mb-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-rose-500 flex items-center justify-center">
                <HeartFilled className="text-white text-xs" />
              </div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-500 flex items-center justify-center">
                <LikeFilled className="text-white text-xs" />
              </div>
            </div>
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {likeCount} lượt thích
            </span>
          </div>
          <span
            className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
            onClick={() => setShowComments(!showComments)}
          >
            {comments.length} bình luận
          </span>
        </div>

        {/* Actions */}
        <div className="flex border-t border-b border-slate-100 dark:border-slate-700 py-1">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl transition-all duration-200 font-medium ${liked
              ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
          >
            {liked ? (
              <LikeFilled className="text-lg" />
            ) : (
              <LikeOutlined className="text-lg" />
            )}
            <span>Thích</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl transition-all duration-200 font-medium ${showComments
              ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
          >
            <MessageOutlined className="text-lg" />
            <span>Bình luận</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-5 space-y-4 animate-fadeIn">
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
