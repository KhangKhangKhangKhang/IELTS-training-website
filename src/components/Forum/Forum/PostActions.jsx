// PostActions - Updated
import { togglePostLikeAPI } from "@/services/apiForum";
import { message } from "antd";
import { useAuth } from "@/context/authContext";
import { LikeOutlined, LikeFilled, MessageOutlined } from "@ant-design/icons";

const PostActions = ({ post, onCommentClick }) => {
  const { user } = useAuth();

  const handleLike = async () => {
    try {
      await togglePostLikeAPI({
        idForumPost: post.idForumPost,
        idUser: user.idUser,
      });
      message.success("Đã thích bài viết");
    } catch (error) {
      message.error("Thất bại");
    }
  };

  return (
    <div className="flex gap-6 text-sm mt-2">
      <button
        onClick={handleLike}
        className="flex items-center gap-1 text-slate-600 hover:cursor-pointer hover:text-blue-600 transition-colors"
      >
        {post.isLikedByCurrentUser ? (
          <LikeFilled className="text-blue-600" />
        ) : (
          <LikeOutlined />
        )}
        <span>Thích</span>
      </button>
      <button
        onClick={onCommentClick}
        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <MessageOutlined />
        <span>Bình luận</span>
      </button>
    </div>
  );
};

export default PostActions;
