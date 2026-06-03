// CommentList - list comment + empty state thuần Tailwind
import CommentItem from "./CommentItem";

const CommentList = ({ comments, onCommentDeleted, onCommentUpdated }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
        <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 flex items-center justify-center mb-3 text-2xl">
          💬
        </div>
        <p className="text-slate-500 text-sm">Chưa có bình luận nào</p>
        <p className="text-slate-400 text-xs mt-1">
          Hãy là người đầu tiên bình luận!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {comments.map((c) => (
        <CommentItem
          key={c.idForumComment}
          comment={c}
          onUpdated={onCommentUpdated}
          onDeleted={onCommentDeleted}
        />
      ))}
    </div>
  );
};

export default CommentList;
