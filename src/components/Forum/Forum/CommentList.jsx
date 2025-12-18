import CommentItem from "./CommentItem";

const CommentList = ({ comments, onCommentDeleted }) => {
  if (!comments || comments.length === 0)
    return (
      <div className="text-center py-6">
        <p className="text-slate-500 text-sm">Chưa có bình luận</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <CommentItem
          key={c.idForumComment}
          comment={c}
          onUpdated={(newContent) => (c.content = newContent)}
          onDeleted={onCommentDeleted}
        />
      ))}
    </div>
  );
};

export default CommentList;
