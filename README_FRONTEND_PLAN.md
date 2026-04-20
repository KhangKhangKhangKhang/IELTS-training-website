# Kế hoạch Frontend cho Nền tảng IELTS Tự học dùng AI

## 1. Mục tiêu sản phẩm

- Chuyển trải nghiệm từ mô hình lớp học truyền thống sang mô hình tự học cá nhân hóa.
- Đặt AI làm trung tâm cho các luồng học tập: gợi ý lộ trình, chấm Writing/Speaking tức thì, theo dõi tiến độ.
- Tích hợp rõ cơ chế Credits/Packages để người dùng hiểu chi phí và giá trị trước khi sử dụng tính năng nâng cao.
- Bổ sung luồng "On-Demand Review Ticket" để người dùng mua chấm chữa thủ công từ giáo viên freelance.

## 2. Định vị giao diện

- Hướng tới trải nghiệm "Self-Study Command Center":
  - Ưu tiên dashboard cá nhân theo mục tiêu band.
  - Luồng thao tác ngắn, rõ, ít rào cản.
  - Mọi trang quan trọng đều thể hiện trạng thái tín dụng (credits), tiến độ và gợi ý bước tiếp theo.

## 3. Nhóm người dùng và nhu cầu

### USER (học viên tự học)

- Cần biết học gì hôm nay, học bao lâu, ưu tiên kỹ năng nào.
- Cần phản hồi nhanh sau khi nộp bài.
- Cần minh bạch credits trước khi chấm AI nâng cao hoặc gọi giáo viên chấm lại.

### TEACHER (freelance reviewer/moderator)

- Cần bảng hàng đợi ticket toàn cục dễ lọc và dễ nhận việc.
- Cần trang xử lý ticket nhanh, có rubric rõ, hỗ trợ nhập feedback chuẩn hóa.
- Cần theo dõi thu nhập và lịch sử ticket đã hoàn tất.

### ADMIN

- Cần trang cấu hình gói dịch vụ, credits, quy tắc moderation.
- Cần dashboard giám sát chất lượng chấm, tỷ lệ khiếu nại, và hiệu suất thị trường ticket.

## 4. Luồng cốt lõi cần ưu tiên triển khai

1. Luồng tự học bằng AI
- Từ Dashboard -> Nhận kế hoạch ngày/tuần -> Làm bài -> Nhận chấm tức thì -> Cập nhật tiến độ.

2. Luồng mua và dùng credits
- Từ trang Pricing/Credits -> Chọn gói -> Thanh toán -> Cập nhật số dư -> Dùng vào tính năng cao cấp.

3. Luồng On-Demand Review Ticket
- Sau khi AI chấm -> Người dùng bấm yêu cầu chấm lại -> Trừ credits -> Tạo ticket -> Theo dõi trạng thái ticket.

4. Luồng nhận và xử lý ticket của TEACHER
- Teacher mở Global Queue -> Nhận ticket -> Chấm theo rubric -> Gửi feedback -> Hoàn tất và ghi nhận commission.

## 5. Danh sách màn hình frontend

- Dashboard tự học (USER)
- Trang làm bài Writing/Speaking
- Trang kết quả AI + lịch sử phản hồi
- Trang Pricing, Subscription và Credits
- Trang tạo và theo dõi On-Demand Review Ticket
- Teacher Global Queue
- Teacher Review Workspace
- Teacher Earnings
- Admin Control Panel (gói cước, moderation, analytics)

## 6. Kế hoạch triển khai theo giai đoạn

### Giai đoạn 1: Nền tảng tự học

- Hoàn thiện dashboard tự học và trang lịch sử tiến độ.
- Chuẩn hóa UI cho nộp bài Writing/Speaking và hiển thị kết quả AI.
- Hoàn tất quản lý trạng thái loading/error/empty cho các trang chính.

### Giai đoạn 2: Monetization

- Xây trang Pricing và Credits Wallet.
- Tích hợp kiểm tra entitlement theo gói Freemium/Pro.
- Thêm cảnh báo trước khi tiêu credits ở các thao tác premium.

### Giai đoạn 3: Marketplace giáo viên

- Xây luồng tạo ticket từ bài AI đã chấm.
- Xây Global Queue cho TEACHER và trang xử lý ticket.
- Bổ sung trạng thái ticket đầy đủ: mới, đã nhận, đang xử lý, hoàn tất, khiếu nại.

### Giai đoạn 4: Vận hành và tối ưu

- Hoàn thiện trang quản trị cho ADMIN.
- Bổ sung dashboard chất lượng chấm và KPI doanh thu.
- Tối ưu UX mobile cho các luồng chính.

## 7. KPI đề xuất cho frontend

- Tỷ lệ hoàn thành phiên học tự đề xuất bởi AI.
- Tỷ lệ chuyển đổi từ Freemium sang Pro.
- Tỷ lệ người dùng mua credits lần 2.
- Thời gian trung bình từ tạo ticket đến lúc hoàn tất review.
- Mức độ hài lòng của người dùng sau khi nhận feedback từ AI và từ giáo viên.

## 8. Tiêu chí hoàn thành

- Người dùng mới có thể bắt đầu học trong dưới 3 phút.
- Luồng mua credits và dùng credits không gây nhầm lẫn.
- Luồng tạo ticket và theo dõi ticket hoạt động xuyên suốt trên desktop và mobile.
- Teacher có thể xử lý ticket với thao tác tối giản và phản hồi đúng rubric.

