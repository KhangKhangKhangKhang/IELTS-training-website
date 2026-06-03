// ForumBoard - container load thread + posts
// Bỏ Antd Spin, dùng spinner CSS Tailwind.
// Không render ForumHeader (trùng page header ở statistic.jsx).
import { useEffect, useState } from "react";
import CreatePost from "./CreatePost";
import PostList from "./PostList";
import { getThreadByIdAPI, getPostByThreadAPI } from "@/services/apiForum";
import { useAuth } from "@/context/authContext";

const isVisibleApprovedPost = (post) => {
  const status = post?.moderation?.status;
  return status === "auto_approved" || status === "approved";
};

const ForumBoard = ({ idForumThreads, onThreadLoaded, showComposer = false }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const postRes = await getPostByThreadAPI(idForumThreads, user?.idUser);
      setPosts(postRes.data);
    } catch (error) {
      console.error("Error loading forum board:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idForumThreads) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idForumThreads]);

  // Filter ra các post đã bị từ chối (auto_rejected/rejected) — các trạng thái
  // khác (pending/needs_review/auto_approved/approved/changes_requested) đều hiển thị
  // để user thấy bài mình vừa đăng ngay.
  const visiblePosts = posts.filter((p) => {
    const s = p?.moderation?.status;
    return s !== "auto_rejected" && s !== "rejected";
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-white border-2 border-[#e6e6ed] rounded-2xl">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
        <p className="text-slate-500 mt-4 text-sm font-medium">
          Đang tải bài viết...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showComposer && (
        <CreatePost
          idForumThreads={idForumThreads}
          onSuccess={(newPost) => {
            // Luôn hiển thị post mới (trừ auto_rejected/rejected) để user thấy ngay.
            const s = newPost?.moderation?.status;
            if (s !== "auto_rejected" && s !== "rejected") {
              setPosts((prev) => [newPost, ...prev]);
            }
            // Reload để chắc chắn sync với server.
            loadData();
          }}
        />
      )}
      <PostList
        posts={visiblePosts}
        onPostUpdated={(updatedPost) =>
          setPosts((prev) =>
            prev.map((x) =>
              x.idForumPost === updatedPost.idForumPost ? updatedPost : x,
            ),
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
