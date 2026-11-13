# HƯỚNG DẪN SỬ DỤNG WEBSITE ĐẶT PHÒNG KHÁCH SẠN SEN VIỆT LUXURY (SONG NGỮ VI / EN)

---

## PHẦN 1: TIẾNG VIỆT (VIETNAMESE USER GUIDE)

### 1. Giới thiệu chung
Website Khách hàng **Sen Việt Luxury** (cổng `http://localhost:8080`) cho phép quý khách tìm kiếm phòng trống theo thời gian thực tại **8 chi nhánh** trên toàn quốc (Sài Gòn, Hà Nội, Đà Nẵng, Nha Trang, Đà Lạt, Gò Công, An Nhơn, Quy Nhơn), đặt phòng & dịch vụ đi kèm, thanh toán nhanh qua **VietQR PayOS**, theo dõi lịch sử đơn đặt phòng và trò chuyện trực tiếp với **Trợ lý AI Sen Việt** hoặc **Lễ tân chi nhánh / Tổng đài CSKH**.

---

### 2. Đăng ký & Đăng nhập tài khoản
1. Bấm nút **Đăng nhập / Đăng ký** ở góc trên bên phải thanh điều hướng.
2. Điền thông tin cá nhân (Họ tên, Email, Số điện thoại, Mật khẩu) để tạo tài khoản thành viên.
3. **Quyền lợi thành viên:**
   - Lưu giữ lịch sử đặt phòng, xuất hóa đơn điện tử (`/invoices`).
   - Lưu và áp dụng mã khuyến mãi (`/loyalty` / `/account`).
   - Đặt phòng trực tiếp hoặc qua Trợ lý AI (Khách vãng lai chưa đăng nhập chỉ xem được thông tin phòng/giá/chính sách và cần đăng nhập trước khi chốt giữ phòng).

---

### 3. Tìm kiếm & Đặt phòng trực tuyến
1. Tại **Trang chủ** hoặc mục **Khách sạn (`/hotels`)**, chọn **Chi nhánh**, **Ngày nhận phòng (Check-in)**, **Ngày trả phòng (Check-out)** và **Số khách**.
2. Xem danh sách các hạng phòng còn trống (`Standard`, `Deluxe`, `Suite`, `Family`), kiểm tra sức chứa tối đa (tối đa 4 người lớn/phòng), tiện nghi đi kèm và bảng giá theo ngày.
3. Bấm **Chọn phòng** → chọn thêm **Dịch vụ bổ sung** (Đưa đón sân bay, Spa, Ăn sáng, Giặt ủi...).
4. Tại màn hình **Xác nhận đặt phòng (`/checkout`)**:
   - Kiểm tra thông tin người đại diện, chi tiết từng phòng, phụ phí nhận sớm/trả muộn (nếu có) và áp dụng **Mã khuyến mãi**.
   - Bấm xác nhận để hệ thống **giữ phòng tạm thời trong 5 phút** (`holdUntil`).

---

### 4. Thanh toán VietQR PayOS & Theo dõi đơn hàng
1. Tại trang **Đơn đặt phòng (`/booking-success/:id`)**, chọn phương thức thanh toán **Chuyển khoản VietQR (PayOS)** hoặc **Thanh toán tại khách sạn**.
2. Với VietQR PayOS: Quét mã QR bằng ứng dụng ngân hàng bất kỳ trong vòng **5 phút** trước khi hết thời gian giữ phòng. Hệ thống tự động xác nhận trạng thái **Đã thanh toán** ngay khi giao dịch hoàn tất.
3. Nếu quá 5 phút chưa thanh toán, đơn giữ chỗ sẽ tự động hủy để giải phóng phòng cho khách khác.

---

### 5. Chính sách Nhận/Trả phòng & Hủy phòng
- **Giờ nhận phòng (Check-in):** Từ `14:00` | **Giờ trả phòng (Check-out):** Trước `12:00`.
- **Chính sách hủy phòng áp dụng đồng nhất:**
  - **Trước giờ Check-in >= 72 giờ (3 ngày):** Hoàn **100%** tiền phòng (0% phí phạt).
  - **Từ 24 đến dưới 72 giờ (1–3 ngày):** Phạt **50%** tiền phòng (Hoàn 50% tiền phòng).
  - **Dưới 24 giờ hoặc không đến (No-show):** Phạt **100%** tiền phòng (Không hoàn tiền phòng).
  - **Dịch vụ đi kèm đã thanh toán:** Hoàn **100%** (phí phạt chỉ tính trên tiền phòng). Thời gian hoàn tiền qua ngân hàng: `1–3 ngày làm việc`.

---

### 6. Sử dụng Trợ lý AI & Chat với Nhân viên
- Bấm nút **Liên hệ** ở góc màn hình (có thể kéo thả để di chuyển vị trí nút):
  - **Chat với Trợ lý AI Sen Việt** (hoặc mở toàn trang tại `/chat`): Hỏi giá phòng, phòng trống, dịch vụ, mã ưu đãi, nội quy bằng Tiếng Việt hoặc Tiếng Anh, hỗ trợ nhập liệu bằng **giọng nói (Micro)** và đặt phòng trực tiếp qua thẻ tương tác.
  - **Chat với Nhân viên:** Chọn chi nhánh cụ thể hoặc **Tổng đài CSKH Toàn hệ thống** để trao đổi trực tiếp 2 chiều theo thời gian thực với Lễ tân / CSKH.

---

## PART 2: ENGLISH USER GUIDE

### 1. Overview
The **Sen Việt Luxury Customer Portal** (`http://localhost:8080`) enables guests to search real-time room availability across **8 branches** in Vietnam (Saigon, Hanoi, Da Nang, Nha Trang, Da Lat, Go Cong, An Nhon, Quy Nhon), book rooms and add-on services, pay via **PayOS VietQR**, manage reservations, and chat with the **Sen Việt AI Assistant** or **Live Front Desk / Customer Support**.

---

### 2. Account Registration & Sign-In
1. Click **Sign In / Register** at the top-right navigation bar.
2. Complete your profile (Full name, Email, Phone number, Password).
3. **Member Benefits:** Access booking history & invoices, save and apply promo codes, and complete reservations (unauthenticated guests can browse rooms, rates, and policies, and will be prompted to sign in before locking a booking).

---

### 3. Searching & Booking Rooms
1. On the **Home** or **Hotels (`/hotels`)** page, select your **Branch**, **Check-in / Check-out dates**, and **Guest count**.
2. Browse available room categories (`Standard`, `Deluxe`, `Suite`, `Family`) with real-time availability, capacity (up to 4 adults per room), amenities, and daily rates.
3. Select rooms and optional **Add-on Services** (Airport transfer, Spa, Breakfast, Laundry).
4. On the **Checkout (`/checkout`)** page, verify guest contact details, apply any **Promo Code**, and confirm to lock a **5-minute temporary room hold**.

---

### 4. PayOS VietQR Payment & Order Tracking
1. On the **Booking Summary (`/booking-success/:id`)** page, choose **PayOS VietQR** or **Pay at Hotel**.
2. For PayOS VietQR: Scan the dynamic QR code with any Vietnamese banking app within **5 minutes**. Your booking status updates automatically upon payment confirmation.
3. Unpaid holds expire automatically after 5 minutes to release rooms back to inventory.

---

### 5. Check-In / Check-Out & Cancellation Policy
- **Standard Check-in:** From `14:00` | **Standard Check-out:** Before `12:00`.
- **Unified Cancellation Policy:**
  - **>= 72 hours (3 days) before Check-in:** **100%** room refund (0% penalty).
  - **24 to < 72 hours (1–3 days):** **50%** room penalty (50% room refund).
  - **< 24 hours or No-show:** **100%** room penalty (no room refund).
  - **Prepaid add-on services:** **100% refunded** (cancellation fees apply only to room charges). Bank refunds are processed within `1–3 business days`.

---

### 6. AI Assistant & Live Staff Chat
- Click the draggable **Support** button on the screen:
  - **Sen Việt AI Assistant** (or full-page `/chat`): Check availability, rates, promotions, and policies in Vietnamese or English, with continuous **voice input (Mic)** and interactive booking cards.
  - **Live Front Desk Chat:** Select a specific branch or **System-wide Customer Support** to chat in real time with hotel staff.
