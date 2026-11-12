---
name: "Sen Việt Luxury Hotels & Resorts Design System"
version: "1.0.0"
spec: "google-labs-design-md/v1"
tokens:
  color:
    brand:
      navy-deep: "#0a192f"      # Tông xanh màn đêm quý tộc
      navy-primary: "#1e3a8a"   # Xanh hoàng gia chủ đạo
      navy-light: "#2563eb"     # Xanh tương tác khi hover
      gold-primary: "#d97706"   # Vàng kim liên hoa (Lotus Gold)
      gold-dark: "#b45309"      # Vàng đồng sang trọng
      gold-light: "#fef3c7"     # Nền vàng nhạt quý phái
    surface:
      canvas: "#fafaf9"         # Nền cát ấm (Warm Pearl Sand)
      card: "#ffffff"           # Nền thẻ trắng tinh khiết
      muted: "#f1f5f9"          # Nền phụ trợ slate
      elevated: "#ffffff"       # Nền modal & dropdown
    text:
      primary: "#0f172a"        # Chữ tiêu đề đen than đá sắc sảo
      secondary: "#334155"      # Chữ thân bài slate đậm dễ đọc
      muted: "#64748b"          # Chữ phụ trợ / chú thích
      inverse: "#ffffff"        # Chữ trắng trên nền tối
      accent: "#b45309"         # Chữ vàng đồng nhấn mạnh
    status:
      success: "#059669"        # Xanh ngọc bảo (còn phòng, thanh toán xong)
      warning: "#d97706"        # Hổ phách (sắp hết phòng, chờ duyệt)
      error: "#dc2626"          # Đỏ ruby (hết phòng, lỗi thanh toán)
      info: "#0284c7"           # Xanh lam thông tin
  typography:
    family:
      serif: "Playfair Display, Merriweather, Georgia, serif"
      sans: "Plus Jakarta Sans, Inter, -apple-system, sans-serif"
      mono: "JetBrains Mono, ui-monospace, monospace"
    scale:
      hero: "clamp(2rem, 4vw, 3.25rem)"
      h1: "2rem"
      h2: "1.5rem"
      h3: "1.25rem"
      body: "0.9375rem"
      caption: "0.8125rem"
  radii:
    card: "1rem"                # 16px bo góc mềm mại
    button: "0.625rem"          # 10px bo nút thanh lịch
    pill: "9999px"              # Bo tròn dạng viên thuốc cho badge
  shadow:
    subtle: "0 2px 8px -2px rgba(15, 25, 47, 0.04)"
    card: "0 8px 24px -4px rgba(15, 25, 47, 0.06)"
    hover: "0 16px 36px -6px rgba(15, 25, 47, 0.12)"
    modal: "0 24px 48px -12px rgba(15, 25, 47, 0.20)"
  motion:
    ease: "cubic-bezier(0.16, 1, 0.3, 1)"
    duration-fast: "150ms"
    duration-normal: "250ms"
    duration-slow: "350ms"
---

# 🌿 SEN VIỆT LUXURY - DESIGN SYSTEM & VISUAL GUIDELINES
<!-- Chuẩn Google Labs DESIGN.md + Taste-Skill (tasteskill.dev) + Impeccable (impeccable.style) -->

Tài liệu này là **nguồn sự thật duy nhất (Single Source of Truth)** về thẩm mỹ và chuẩn thiết kế giao diện cho chuỗi khách sạn **Sen Việt Luxury Hotels & Resorts**.
Bất kỳ AI Coding Agent hoặc lập trình viên nào khi tạo mới hoặc sửa đổi giao diện Frontend (`SenVietHotelManagement` & `KLTN_HotelManagementFE`) **bắt buộc phải tuân thủ** các quy tắc dưới đây.

---

## 1. THIẾT LẬP THẨM MỸ TASTE SKILL (TASTESKILL.DEV SETTINGS)

Taste Skill đóng vai trò **Giám đốc Nghệ thuật (Art Director)**, định hình cảm xúc thị giác và loại bỏ sự rập khuôn của AI:

| Thông số (Slider) | Giá trị cấu hình | Ý nghĩa & Ứng dụng trong Sen Việt |
| :--- | :--- | :--- |
| `DESIGN_VARIANCE` | **HIGH** | Không dùng bố cục 3 cột rập khuôn; tạo nhịp điệu thị giác bất đối xứng (Asymmetrical Rhythm), kết hợp thẻ phòng nổi bật với banner nghỉ dưỡng thực tế. |
| `VISUAL_DENSITY` | **SPACIOUS** | Khoảng thở rộng rãi chuẩn resort 5 sao (`py-12`, `py-16`, `gap-6` đến `gap-8`), không nhồi nhét chữ hoặc icon vụn vặt. |
| `MOTION_INTENSITY` | **SUBTLE** | Chuyển động lướt êm ái với đường cong Bezier `[0.16, 1, 0.3, 1]`, không rung lắc giật cục, mang lại cảm giác bình yên thư thái. |
| `TYPOGRAPHY_PAIRING` | **SERIF + SANS** | Kết hợp hoàng gia: `Playfair Display` cho tiêu đề trang trọng + `Inter` sắc nét cho thân bài và thông số kỹ thuật. |
| `BRAND_ESSENCE` | **HERITAGE LUXURY** | Sự kết hợp tinh tế giữa *kiến trúc Á Đông truyền thống* (hoa sen, vàng kim, gỗ trầm) và *tiêu chuẩn nghỉ dưỡng 5 sao quốc tế*. |

---

## 2. BỘ QUY TẮC CHỐNG "AI SLOP" THEO IMPECCABLE (IMPECCABLE.STYLE)

Khi AI sinh mã giao diện, thường mắc các lỗi thẩm mỹ rập khuôn (AI Slop). Impeccable đóng vai trò **Kỷ luật trưởng Thiết kế (Design Lead & Code Inspector)** thực thi các lệnh cấm tuyệt đối:

### 🚫 NHỮNG ĐIỀU BỊ CẤM (STRICTLY FORBIDDEN)
1. **Cấm Card lồng Card (Card Inception):** Tuyệt đối không bao bọc một thẻ card có viền bên trong một thẻ card có viền khác. Hãy phân tách bằng khoảng trống (negative space), nền `bg-slate-50/50` hoặc đường kẻ siêu mảnh `border-slate-100`.
2. **Cấm Gradient dạ quang / tím xanh Web3:** Không dùng màu neon rực rỡ. Toàn bộ bảng màu tuân thủ gam Trầm Quý Tộc: Xanh hoàng gia Royal Navy (`#0a192f`, `#1e3a8a`), Vàng kim liên hoa Lotus Gold (`#d97706`, `#fef3c7`), Đá phiến Slate (`#334155`).
3. **Cấm nút bấm đen thô hoặc xanh bẹt:** Nút CTA chính phải có độ nảy xúc giác (`active:scale-95`), viền bo thanh thoát (`rounded-xl`), hiệu ứng hover chuyển sắc êm (`transition-all duration-200`).
4. **Cấm Hero Section căn giữa đơn điệu:** Tránh việc mọi trang đều dùng tiêu đề căn giữa cùng cỡ chữ khổng lồ thiếu điểm nhấn.
5. **Cấm chữ xám nhạt thiếu tương phản:** Mọi đoạn văn bản phải đạt chuẩn tương phản cao **WCAG AAA** ($\ge 4.5:1$). Tuyệt đối không dùng `text-gray-400` trên nền trắng.

### ✨ NHỮNG ĐIỀU BẮT BUỘC (IMPECCABLE QUALITY GATES)
1. **Tabular Numbers (`tabular-nums`):** Mọi vị trí hiển thị giá tiền (`₫`, `VND`), số phòng, ngày tháng bắt buộc có class `tabular-nums` để số liệu căn thẳng hàng, không bị lệch nhịp thị giác.
2. **Viền siêu mảnh (Hairline Borders):** Dùng `border-slate-100` hoặc `border-amber-100/60` thay vì các đường viền dày thô cứng `border-gray-300`.
3. **Phản hồi xúc giác (Haptic Micro-interactions):** Mọi nút bấm, thẻ phòng tương tác phải có cảm giác nảy nhẹ khi click (`active:scale-[0.98]` hoặc `active:scale-95`).
4. **Bóng đổ đa tầng (Multi-layer Soft Shadows):** Dùng bóng mờ dịu mắt `0 8px 24px -4px rgba(15, 25, 47, 0.06)`, tránh bóng đen đậm làm giao diện bị đục.

---

## 3. QUY CHUẨN THÀNH PHẦN (COMPONENT SPECIFICATIONS)

### A. Thẻ phòng khách sạn (Room Card)
- **Hình ảnh:** Tỷ lệ `aspect-[16/10]`, góc bo `rounded-t-2xl` hoặc `rounded-2xl`, zoom nhẹ (`scale-105`) khi hover kèm transition `duration-300`.
- **Huy hiệu diện tích & tiện ích:** Thẻ nhỏ bo tròn (`rounded-full bg-slate-100/80 px-3 py-1 text-xs text-slate-700 font-medium`).
- **Khối giá & Đặt phòng:** Giá hiển thị nổi bật với màu xanh hoàng gia hoặc vàng đồng, nút *"Chọn phòng này"* có hiệu ứng bấm nảy (`active:scale-95`).

### B. Thanh lọc khách sạn theo Miền & Tỉnh thành (Location Filter Bar)
- Các nút tab Miền (Tất cả, Miền Bắc, Miền Trung, Miền Nam) dạng viên thuốc (`rounded-full`).
- Tab active: Nền `bg-blue-900 text-white shadow-sm`.
- Tab inactive: Nền `bg-white text-slate-600 hover:bg-slate-100 border border-slate-200`.

### C. Hộp thoại Trợ lý AI (Chat Widget)
- **Header:** Nền xanh Navy hoàng gia `bg-gradient-to-r from-blue-950 to-blue-900 text-white`, logo Sen Việt đính kèm huy hiệu trạng thái online (chấm xanh lá đập nhẹ).
- **Tin nhắn Khách hàng:** Nền `bg-blue-900 text-white rounded-2xl rounded-tr-none`.
- **Tin nhắn Trợ lý AI:** Nền `bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none shadow-sm`.
- **Card Đặt phòng / Gợi ý nhanh (Quick Chips):** Viền mảnh màu hổ phách `border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-amber-900 transition-all`.

---

## 4. CHUYỂN ĐỘNG & MOTION (INSPIRED BY ANIMATE UI)
- Mọi tương tác mở modal hoặc dropdown dùng hiệu ứng phóng nhẹ: `scale-95 opacity-0 -> scale-100 opacity-100` trong `200ms` với `ease-out`.
- Các danh sách phòng khi lọc chuyển trạng thái mượt mà (Fade & Slide up `translate-y-2 -> translate-y-0`).
