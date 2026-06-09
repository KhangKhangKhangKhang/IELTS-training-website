import { ModStatus } from './modUI';
export type ModPost = {
  id: number;
  author: string;
  tone: string;
  thread: string;
  content: string;
  score: number;
  status: ModStatus;
  reason: string;
  time: string;
};
export const SEED: ModPost[] = [{
  id: 1,
  author: 'Trần Văn Hùng',
  tone: '#f59e0b',
  thread: 'Mẹo Writing Task 2',
  content: 'Mọi người cho mình hỏi cách viết introduction sao cho ấn tượng với giám khảo? Mình hay bị bí ở phần mở bài.',
  score: 88,
  status: 'auto_approved',
  reason: 'Nội dung tích cực, đúng chủ đề học tập.',
  time: '10 phút trước'
}, {
  id: 2,
  author: 'Người dùng ẩn',
  tone: '#94a3b8',
  thread: 'Chia sẻ tài liệu',
  content: 'Mua tài liệu IELTS giá rẻ liên hệ ngay hotline 09xxx, cam kết band 8.0 trong 1 tháng!!!',
  score: 12,
  status: 'auto_rejected',
  reason: 'Phát hiện dấu hiệu spam/quảng cáo và cam kết phi thực tế.',
  time: '25 phút trước'
}, {
  id: 3,
  author: 'Lê Thu Hà',
  tone: '#06b6d4',
  thread: 'Luyện Speaking',
  content: 'Bài này hơi dở, giáo viên chấm không công bằng lắm. Mình thấy band của mình phải cao hơn mới đúng.',
  score: 54,
  status: 'needs_review',
  reason: 'Có thể chứa nội dung tiêu cực, cần người duyệt đánh giá.',
  time: '1 giờ trước'
}, {
  id: 4,
  author: 'Phạm Quốc Bảo',
  tone: '#a855f7',
  thread: 'Quản lý thời gian',
  content: 'Chia sẻ lịch học 3 tháng của mình giúp tăng từ 5.5 lên 7.0, hy vọng hữu ích cho mọi người!',
  score: 92,
  status: 'auto_approved',
  reason: 'Nội dung chia sẻ tích cực, hữu ích cho cộng đồng.',
  time: '2 giờ trước'
}, {
  id: 5,
  author: 'Đỗ Mai Chi',
  tone: '#fb7185',
  thread: 'Reading skimming',
  content: 'Có ai biết kỹ thuật scanning hiệu quả không? Mình luôn thiếu thời gian ở passage 3.',
  score: 67,
  status: 'needs_review',
  reason: 'Điểm AI ở mức trung bình, nên kiểm tra thủ công.',
  time: '3 giờ trước'
}];