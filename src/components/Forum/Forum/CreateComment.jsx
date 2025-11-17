// CreateComment - Updated
import { useState } from "react";
import { createCommentAPI } from "@/services/apiForum";
import { Input, Button, message } from "antd";
import { useAuth } from "@/context/authContext";

const CreateComment = ({ idForumPost, onCommentCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComment = async () => {
    if (!content.trim()) return;

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3 p-4 bg-white rounded-xl border border-slate-200">
      <Input
        placeholder="Viết bình luận của bạn..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="rounded-lg border-slate-300"
        onPressEnter={handleComment}
      />
      <Button
        onClick={handleComment}
        loading={loading}
        className="bg-slate-900 hover:bg-slate-800 border-slate-900 hover:border-slate-800 text-white rounded-lg"
      >
        Gửi
      </Button>
    </div>
  );
};

export default CreateComment;
