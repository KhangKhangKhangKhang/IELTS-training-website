// CommentList - Updated
import CommentItem from "./CommentItem";

const CommentList = ({ comments }) => {
  if (!comments || comments.length === 0)
    return (
      <div className="text-center py-6">
        <div className="text-slate-400 mb-2">
          <svg
            className="w-8 h-8 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
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
        />
      ))}
    </div>
  );
};

export default CommentList;
