import CommentItem from "./CommentItem";

const CommentList = ({ comments }) => {
  if (!comments || comments.length === 0)
    return <p className="text-gray-500 text-sm ml-5">Chưa có bình luận</p>;

  return (
    <div className="space-y-2 pl-5">
      {comments.map((c) => (
        <CommentItem
          key={c.idForumComment}
          comment={c}
          onUpdated={(newContent) => (c.content = newContent)}
        />
      ))}
    </div>
  );
};

export default CommentList;
