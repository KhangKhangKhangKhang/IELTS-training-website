const ForumHeader = ({ thread }) => {
  return (
    <div className="p-3 bg-white rounded shadow">
      <h2 className="text-xl font-bold">{thread.title}</h2>
      <p className="text-gray-600">{thread.content}</p>
    </div>
  );
};

export default ForumHeader;
