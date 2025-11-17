// ForumBoard - Updated
import { useEffect, useState } from "react";
import ForumHeader from "./ForumHeader";
import CreatePost from "./CreatePost";
import PostList from "./PostList";
import { getThreadByIdAPI, getPostByThreadAPI } from "@/services/apiForum";
import { Spin } from "antd";
import { useAuth } from "@/context/authContext";

const ForumBoard = ({ idForumThreads }) => {
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const threadRes = await getThreadByIdAPI(idForumThreads);
      setThread(threadRes.data);

      const postRes = await getPostByThreadAPI(idForumThreads, user?.idUser);
      setPosts(postRes.data);
    } catch (error) {
      console.error("Error loading forum board:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [idForumThreads]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ForumHeader thread={thread} />
      <CreatePost
        idForumThreads={idForumThreads}
        onSuccess={(newPost) => setPosts([newPost, ...posts])}
      />
      <PostList
        posts={posts}
        onPostUpdated={(updatedPost) =>
          setPosts((prev) =>
            prev.map((x) =>
              x.idForumPost === updatedPost.idForumPost ? updatedPost : x
            )
          )
        }
        onPostDeleted={(deletedId) =>
          setPosts((prev) => prev.filter((x) => x.idForumPost !== deletedId))
        }
      />
    </div>
  );
};

export default ForumBoard;
