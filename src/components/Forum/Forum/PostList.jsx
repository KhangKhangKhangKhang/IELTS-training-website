// PostList - danh sách PostItem, empty state.
import { FixedSizeList } from "react-window";
import PostItem from "./PostItem";

const PostList = ({ posts, onPostUpdated, onPostDeleted }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-indigo-50 flex items-center justify-center mb-4 text-3xl">
          💭
        </div>
        <h3 className="text-slate-700 font-semibold text-lg mb-2">
          Chưa có bài viết nào
        </h3>
        <p className="text-slate-500 text-sm">
          Hãy là người đầu tiên chia sẻ trong chủ đề này!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length > 50 ? (
        <FixedSizeList
          height={600}
          width="100%"
          itemSize={150}
          itemCount={posts.length}
          itemData={{ posts, onPostUpdated, onPostDeleted }}
        >
          {PostRow}
        </FixedSizeList>
      ) : (
        posts.map((p) => (
          <PostItem
            key={p.idForumPost}
            post={p}
            onPostUpdated={onPostUpdated}
            onPostDeleted={onPostDeleted}
          />
        ))
      )}
    </div>
  );
};

const PostRow = ({ index, style, data }) => {
  const post = data.posts[index];
  return (
    <div style={style}>
      <PostItem
        post={post}
        onPostUpdated={data.onPostUpdated}
        onPostDeleted={data.onPostDeleted}
      />
    </div>
  );
};

export default PostList;
