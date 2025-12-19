// ForumHeader - Updated with enhanced UI
import { MessageOutlined, TeamOutlined } from "@ant-design/icons";

const ForumHeader = ({ thread }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-2xl shadow-lg p-8 border border-slate-700">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
            <MessageOutlined className="text-2xl text-blue-400" />
          </div>
          <span className="px-3 py-1 bg-blue-500/20 backdrop-blur-sm text-blue-400 text-sm font-medium rounded-full">
            Diễn đàn
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 drop-shadow-sm">
          {thread.title}
        </h2>

        <p className="text-slate-300 text-base leading-relaxed max-w-2xl">
          {thread.content}
        </p>

        <div className="flex items-center gap-4 mt-5 pt-5 border-t border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <TeamOutlined />
            <span>Thảo luận cộng đồng</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumHeader;
