// ForumHeader - Updated
const ForumHeader = ({ thread }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{thread.title}</h2>
      <p className="text-slate-600">{thread.content}</p>
    </div>
  );
};

export default ForumHeader;
