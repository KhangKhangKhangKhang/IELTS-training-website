import { togglePostLikeAPI } from "@/services/apiForum";
import { message } from "antd";
import { useAuth } from "@/context/authContext";

const PostActions = ({ post, onCommentClick }) => {
  const { user } = useAuth();

  const handleLike = async () => {
    await togglePostLikeAPI({
      idForumPost: post.idForumPost,
      idUser: user.idUser,
    });
    message.success("Đã xử lý");
  };

  return (
    <div className="flex gap-4 text-sm mt-2 cursor-pointer">
      <span onClick={handleLike}>👍 Thích</span>
      <span onClick={onCommentClick}>💬 Bình luận</span>
    </div>
  );
};

export default PostActions;
