import API from "./axios.custom";

//Get
export const getAllThreadAPI = async () => {
  const res = await API.get("/forum-threads/get-all-forum-threads");
  return res.data;
};

export const getThreadByIdAPI = async (id) => {
  const res = await API.get(`/forum-threads/get-forumThread/${id}`);
  return res.data;
};

export const getPostByThreadAPI = async (idForumThreads, idUser) => {
  const res = await API.get(
    `/forum-post/get-all-forum-post-byIdForumThread/${idForumThreads}/${idUser}`
  );
  return res.data;
};

export const getPostByIdAPI = async (idForumPost, idUser) => {
  const res = await API.get(
    `/forum-post/get-forum-post/${idForumPost}/${idUser}`
  );
  return res.data;
};

export const getAllCommentsByPostAPI = async (idForumPost) => {
  const res = await API.get(
    `/forum-comment/get-all-by-idForumPost/${idForumPost}`
  );
  return res.data;
};

//Post
export const createThreadAPI = async (data) => {
  const res = await API.post("/forum-threads/create-forum-threads", data);
  return res.data;
};

export const createPostAPI = async (formData) => {
  const res = await API.post("/forum-post/create-forum-post", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const createCommentAPI = async (data) => {
  const res = await API.post("/forum-comment/create-forum-comment", data);
  return res.data;
};

export const togglePostLikeAPI = async (data) => {
  const res = await API.post("/forum-post-likes/toggle", data);
  return res.data;
};

export const toggleCommentLikeAPI = async (data) => {
  const res = await API.post("/forum-comment-likes/toggle", data);
  return res.data;
};

//patch
export const updateThreadAPI = async (idForumThreads, data) => {
  const res = await API.patch(
    `/forum-threads/update-forum-thread/${idForumThreads}`,
    data
  );
  return res.data;
};

export const updatePostAPI = async (idForumPost, formData) => {
  const res = await API.patch(
    `/forum-post/update-forum-post/${idForumPost}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
};

export const updateCommentAPI = async (idForumComment, data) => {
  const res = await API.patch(
    `/forum-comment/update-forum-comment/${idForumComment}`,
    data
  );
  return res.data;
};

//delete
export const deleteThreadAPI = async (idForumThreads) => {
  const res = await API.delete(
    `/forum-threads/delete-forum-thread/${idForumThreads}`
  );
  return res.data;
};

export const deletePostAPI = async (idForumPost) => {
  const res = await API.delete(`/forum-post/delete-forum-post/${idForumPost}`);
  return res.data;
};

export const deleteCommentAPI = async (idForumComment) => {
  const res = await API.delete(
    `/forum-comment/delete-forum-comment/${idForumComment}`
  );
  return res.data;
};
