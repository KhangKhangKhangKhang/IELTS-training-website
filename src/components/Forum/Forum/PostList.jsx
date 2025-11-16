import PostItem from "./PostItem";

const PostList = ({ posts, onPostUpdated, onPostDeleted }) => {
  if (posts.length === 0)
    return <p className="text-center text-gray-500">Chưa có bài viết</p>;

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
