// ForumBoard - Updated with enhanced UI
import { useEffect, useState } from "react";
import ForumHeader from "./ForumHeader";
import CreatePost from "./CreatePost";
import PostList from "./PostList";
import { getThreadByIdAPI, getPostByThreadAPI } from "@/services/apiForum";
import { Spin } from "antd";
import { useAuth } from "@/context/authContext";
import { LoadingOutlined } from "@ant-design/icons";

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
      <div className="flex flex-col justify-center items-center h-96 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-b-blue-500 animate-spin animation-delay-150" />
        </div>
        <p className="text-slate-500 mt-4 font-medium">Đang tải bài viết...</p>
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
