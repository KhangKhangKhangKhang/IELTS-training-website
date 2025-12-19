// PostList - Updated with enhanced UI
import PostItem from "./PostItem";
import { FileTextOutlined } from "@ant-design/icons";

const PostList = ({ posts, onPostUpdated, onPostDeleted }) => {
  if (posts.length === 0)
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-100 to-blue-100 flex items-center justify-center mb-4">
          <FileTextOutlined className="text-3xl text-blue-400" />
        </div>
        <h3 className="text-slate-700 font-semibold text-lg mb-2">
          Chưa có bài viết nào
        </h3>
        <p className="text-slate-500 text-sm">
          Hãy là người đầu tiên chia sẻ trong chủ đề này!
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <PostItem
          key={p.idForumPost}
          post={p}
          onPostUpdated={onPostUpdated}
          onPostDeleted={onPostDeleted}
        />
      ))}
    </div>
  );
};

export default PostList;
