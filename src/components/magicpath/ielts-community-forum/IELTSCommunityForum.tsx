import React, { useState } from 'react';
import { Card, Avatar } from './forumUI';
import { ThreadSidebar, Thread } from './forumSidebar';
import { PostCard, Post } from './forumPost';
const THREADS: Thread[] = [{
  id: 1,
  title: 'Mẹo đạt band 7.0 Writing Task 2',
  posts: 24,
  hot: true,
  tone: '#6366f1'
}, {
  id: 2,
  title: 'Chia sẻ tài liệu Listening Cambridge',
  posts: 18,
  hot: true,
  tone: '#06b6d4'
}, {
  id: 3,
  title: 'Cách phát âm chuẩn trong Speaking',
  posts: 12,
  tone: '#fb7185'
}, {
  id: 4,
  title: 'Luyện Reading skimming & scanning',
  posts: 9,
  tone: '#a855f7'
}, {
  id: 5,
  title: 'Quản lý thời gian khi làm bài thi',
  posts: 15,
  tone: '#f59e0b'
}];
const POSTS: Record<number, Post[]> = {
  1: [{
    id: 1,
    author: 'Nguyễn Minh Anh',
    tone: '#6366f1',
    time: '2 giờ trước',
    content: 'Mình vừa đạt 7.5 Writing nhờ luyện viết theo cấu trúc rõ ràng: mở bài paraphrase đề, thân bài 2 đoạn mỗi đoạn 1 ý chính + ví dụ, kết bài tóm tắt. Quan trọng nhất là dùng linking words tự nhiên!',
    likes: 42,
    liked: true,
    moderation: {
      label: 'Tự duyệt (AI)',
      tone: 'green',
      score: 92
    },
    comments: [{
      author: 'Trần Khoa',
      tone: '#fb7185',
      text: 'Cảm ơn bạn, rất hữu ích!',
      time: '1 giờ trước'
    }, {
      author: 'Lan Phạm',
      tone: '#a855f7',
      text: 'Bạn có thể chia sẻ bài mẫu không?',
      time: '45 phút trước'
    }]
  }, {
    id: 2,
    author: 'Trần Văn Hùng',
    tone: '#f59e0b',
    time: '5 giờ trước',
    content: 'Một lỗi mình hay mắc là viết quá dài nhưng lan man. Sau khi học cách lập dàn ý 5 phút trước khi viết, band của mình tăng từ 5.5 lên 6.5.',
    likes: 28,
    moderation: {
      label: 'Cần duyệt tay',
      tone: 'amber',
      score: 56
    },
    comments: [{
      author: 'Mai Chi',
      tone: '#06b6d4',
      text: 'Dàn ý đúng là chìa khóa!',
      time: '3 giờ trước'
    }]
  }]
};
export const IELTSCommunityForum = () => {
  const [selected, setSelected] = useState(1);
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const threads = THREADS.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  const posts = POSTS[selected] || [];
  const current = THREADS.find(t => t.id === selected);
  return <div className="min-h-screen w-full bg-gradient-to-br from-[#eff6ff] to-[#eef2ff] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Sidebar */}
          <ThreadSidebar threads={threads} selected={selected} onSelect={setSelected} search={search} setSearch={setSearch} />
          

          {/* Board */}
          <div className="space-y-5 min-w-0">
            <Card className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-black text-[#1e1b4b]">IELTS Forum</h1>
                  <p className="text-sm text-[#64748b] font-medium">
                    Thảo luận và chia sẻ kinh nghiệm học tập
                  </p>
                </div>
                <button onClick={() => setShowCompose(!showCompose)} className="px-5 py-2.5 rounded-2xl bg-[#6366f1] text-white font-extrabold text-sm uppercase tracking-wide shadow-[0_4px_0_#4338ca] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#4338ca] transition-all">
                  
                  + Tạo bài viết
                </button>
              </div>
              {current && <div className="mt-4 flex items-center gap-2 text-sm font-bold text-[#6366f1] bg-[#eef2ff] rounded-2xl px-4 py-2.5 w-fit">
                  <span>📌</span> {current.title}
                </div>}
            </Card>

            {showCompose && <Card className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name="Bạn" tone="#06b6d4" size={44} />
                  <div className="flex-1">
                    <textarea rows={3} placeholder="Chia sẻ kinh nghiệm, đặt câu hỏi..." className="w-full px-4 py-3 rounded-2xl border-2 border-[#e6e6ed] text-sm resize-none focus:border-[#6366f1] outline-none" />
                  
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-2 text-[#94a3b8]">
                        <button className="w-9 h-9 rounded-xl hover:bg-[#f1f1f6]">🖼️</button>
                        <button className="w-9 h-9 rounded-xl hover:bg-[#f1f1f6]">😊</button>
                      </div>
                      <button className="px-5 py-2 rounded-2xl bg-[#06b6d4] text-white font-extrabold text-sm uppercase shadow-[0_3px_0_#0891b2] hover:brightness-110 active:translate-y-[1px]">
                        Đăng bài
                      </button>
                    </div>
                  </div>
                </div>
              </Card>}

            {posts.length > 0 ? posts.map(p => <PostCard key={p.id} post={p} />) : <Card className="p-12 text-center">
                <div className="text-5xl mb-3">💭</div>
                <h3 className="font-extrabold text-[#1e1b4b] mb-1">Chưa có bài viết</h3>
                <p className="text-sm text-[#64748b] font-medium">
                  Hãy là người đầu tiên chia sẻ trong chủ đề này!
                </p>
              </Card>}
          </div>
        </div>
      </div>
    </div>;
};