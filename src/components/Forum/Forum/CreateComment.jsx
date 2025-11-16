import { useState } from "react";
import { createCommentAPI } from "@/services/apiForum";
import { Input, Button, message } from "antd";
import { useAuth } from "@/context/authContext";

const CreateComment = ({ idForumPost, onCommentCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");

  const handleComment = async () => {
    if (!content.trim()) return;

    try {
      const res = await createCommentAPI({
        idForumPost,
        idUser: user.idUser,
        content,
      });
      setContent("");
      message.success("Đã bình luận");
      if (onCommentCreated) onCommentCreated(res.data);
    } catch (error) {
      message.error("Lỗi khi bình luận");
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Viết bình luận..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button onClick={handleComment}>Gửi</Button>
    </div>
  );
};

export default CreateComment;
