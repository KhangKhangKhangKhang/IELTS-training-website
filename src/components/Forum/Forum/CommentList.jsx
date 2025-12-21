// CommentList - Updated with enhanced UI
import CommentItem from "./CommentItem";
import { MessageOutlined } from "@ant-design/icons";

const CommentList = ({ comments, onCommentDeleted }) => {
  if (!comments || comments.length === 0)
    return (
      <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-blue-100 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/30 flex items-center justify-center mb-3">
          <MessageOutlined className="text-xl text-blue-400" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Chưa có bình luận nào</p>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Hãy là người đầu tiên bình luận!</p>
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
