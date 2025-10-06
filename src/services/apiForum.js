// services/forumApi.js
import API from "./axios.custom";

export const forumApi = {
  // Categories
  getCategories: () => API.get("/forum/categories"),
  getCategory: (id) => API.get(`/forum/categories/${id}`),

  // Threads
  getThreadsByCategory: (categoryId) =>
    API.get(`/forum/threads?category=${categoryId}`),
  getThreadById: (id) => API.get(`/forum/threads/${id}`),
  createThread: (data) => API.post("/forum/threads", data),
  updateThread: (id, data) => API.put(`/forum/threads/${id}`, data),
  deleteThread: (id) => API.delete(`/forum/threads/${id}`),

  // Posts
  createPost: (threadId, content) =>
    API.post(`/forum/threads/${threadId}/posts`, { content }),
  updatePost: (id, content) => API.put(`/forum/posts/${id}`, { content }),
  deletePost: (id) => API.delete(`/forum/posts/${id}`),
  likePost: (postId) => API.post(`/forum/posts/${postId}/like`),

  // Comments
  createComment: (postId, content) =>
    API.post(`/forum/posts/${postId}/comments`, { content }),
  likeComment: (commentId) => API.post(`/forum/comments/${commentId}/like`),
  deleteComment: (commentId) => API.delete(`/forum/comments/${commentId}`),
};

export default forumApi;
