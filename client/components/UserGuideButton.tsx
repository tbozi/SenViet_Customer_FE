import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, HelpCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";

type GuideSection = {
  title: [string, string];
  imageVi?: string;
  imageEn?: string;
  imageAlt?: [string, string];
  route?: string;
  steps: [string, string][];
  tip?: [string, string];
};

const guideSections: GuideSection[] = [
  {
    title: ["1. Tìm khách sạn", "1. Find a hotel"],
    route: "/hotels",
    steps: [
      ["Từ trang chủ chọn Khách sạn hoặc nhập điểm đến trong thanh tìm kiếm. Có thể tìm theo tên khách sạn hoặc địa điểm.", "From the home page, choose Hotels or enter a destination in the search bar. Search by hotel name or location."],
      ["Chọn ngày nhận phòng, ngày trả phòng, số phòng và số khách. Kiểm tra ngày trước khi tìm vì kết quả phòng phụ thuộc ngày lưu trú.", "Select check-in/check-out dates, room count, and guest count. Verify dates before searching because room availability depends on the stay."],
      ["Nhấn Tìm phòng/Tìm khách sạn để xem kết quả. Dùng bộ lọc khu vực và sắp xếp nếu có để thu hẹp danh sách.", "Select Search to see results. Use region filters and sorting, when available, to narrow the list."],
      ["Trên thẻ khách sạn, xem tên, địa chỉ, giá từ và thông tin hiển thị. Mở chi tiết khách sạn rồi chọn Xem phòng để tiếp tục.", "On a hotel card, review the name, address, starting price, and displayed details. Open the hotel and select View rooms to continue."],
    ],
    tip: ["Giá bắt đầu là giá tham khảo; giá cuối cùng phụ thuộc ngày, loại phòng, số khách và ưu đãi.", "Starting prices are indicative; the final price depends on dates, room type, guest count, and promotions."],
  },
  {
    title: ["2. Chọn ngày và phòng", "2. Choose dates and rooms"],
    route: "/hotels",
    steps: [
      ["Trên trang phòng khách sạn, chọn ngày nhận/trả phòng và giờ dự kiến nếu biểu mẫu yêu cầu. Ngày trả phòng phải sau ngày nhận.", "On the hotel's rooms page, select check-in/check-out dates and estimated arrival time if requested. Check-out must be after check-in."],
      ["Xem thông báo ngày tạm đóng của khách sạn. Ngày bị đóng hoặc phòng hết chỗ không thể dùng cho kỳ lưu trú đó; chọn ngày khác nếu cần.", "Review hotel closure notices. Closed dates or sold-out rooms cannot be used for that stay; choose different dates if necessary."],
      ["Mở chi tiết loại phòng để xem sức chứa, tiện nghi, giá theo ngày và điều kiện. Chọn số phòng phù hợp với số khách.", "Open room details to review capacity, amenities, date-based rates, and conditions. Select a room quantity that fits your guests."],
      ["Kiểm tra tổng giá ước tính và thông tin từng phòng/khách. Tiếp tục đến dịch vụ khi lựa chọn đã chính xác.", "Review the estimated total and each room/guest assignment. Continue to services once your selection is correct."],
    ],
    tip: ["Nếu đi nhiều phòng hoặc số khách vượt sức chứa, kiểm tra phân bổ khách cho từng phòng và phụ thu trước khi tiếp tục.", "For multiple rooms or guests exceeding capacity, verify guest allocation per room and any surcharge before continuing."],
  },
  {
    title: ["3. Dịch vụ, thông tin khách và thanh toán", "3. Services, guest details, and payment"],
    route: "/hotels",
    steps: [
      ["Ở bước dịch vụ, xem các dịch vụ tùy chọn, số lượng, giá và thời điểm sử dụng. Chỉ thêm dịch vụ bạn muốn đặt.", "On the services step, review optional services, quantity, price, and usage time. Add only the services you want."],
      ["Tại thanh toán, điền chính xác họ tên, email và số điện thoại người liên hệ; cung cấp thông tin khách lưu trú theo từng phòng nếu được yêu cầu.", "At checkout, enter the contact's name, email, and phone accurately; provide each room guest's details if requested."],
      ["Nhập mã ưu đãi nếu có rồi kiểm tra mã còn hiệu lực và đủ điều kiện áp dụng. Xem lại ngày, phòng, dịch vụ, chính sách hủy và tổng tiền.", "Enter a promotion code if available and verify that it is valid and eligible. Review dates, rooms, services, cancellation policy, and total."],
      ["Chọn phương thức thanh toán đang được cung cấp và làm theo hướng dẫn. Không gửi thông tin thẻ/mật khẩu cho người khác qua chat.", "Select an available payment method and follow its instructions. Never send card details or passwords to someone via chat."],
      ["Sau khi xác nhận, chờ trang kết quả và lưu mã booking. Nếu trạng thái chưa rõ, kiểm tra lịch sử booking trước khi thử thanh toán lại.", "After confirming, wait for the result page and save the booking reference. If the status is unclear, check booking history before trying to pay again."],
    ],
    tip: ["Đọc kỹ chính sách và kiểm tra lại tổng tiền cuối cùng trước khi nhấn xác nhận.", "Read the policy and verify the final total before confirming."],
  },
  {
    title: ["4. Tài khoản, booking và hóa đơn", "4. Account, bookings, and invoices"],
    route: "/bookings",
    steps: [
      ["Mở Đăng nhập/Đăng ký từ biểu tượng tài khoản. Dùng email và mật khẩu; nếu quên mật khẩu, chọn Quên mật khẩu và hoàn tất xác thực theo hướng dẫn.", "Open Sign in/Register from the account menu. Use your email and password; if forgotten, select Forgot password and complete verification."],
      ["Vào Đặt phòng của tôi/Lịch sử đặt phòng để xem booking, mã đặt phòng và trạng thái. Mở booking để xem nội dung chi tiết.", "Open My bookings/Booking history to review reservations, references, and status. Select a booking for details."],
      ["Vào Hóa đơn để xem hóa đơn liên quan. Đối chiếu mã booking và số tiền khi liên hệ hỗ trợ.", "Open Invoices to view related invoices. Have the booking reference and amount ready when contacting support."],
      ["Mục Hồ sơ/Tài khoản cho phép xem hoặc cập nhật thông tin tài khoản theo chức năng hiển thị. Đăng xuất sau khi dùng thiết bị công cộng.", "Profile/Account lets you review or update account details where available. Sign out after using a shared device."],
      ["Các trang lịch sử, hóa đơn, hồ sơ và quyền lợi thành viên cần đăng nhập; nếu dữ liệu chưa xuất hiện, làm mới trang hoặc kiểm tra trạng thái booking.", "Booking history, invoices, profile, and loyalty features require sign-in. If data is missing, refresh or check the booking status."],
    ],
    tip: ["Giữ mã booking để nhân viên hỗ trợ tra cứu nhanh; không đăng công khai mã hoặc thông tin cá nhân.", "Keep your booking reference for support; do not post it or personal information publicly."],
  },
  {
    title: ["5. Ưu đãi, dịch vụ, đánh giá và hỗ trợ", "5. Offers, services, reviews, and support"],
    route: "/contact",
    steps: [
      ["Mở Ưu đãi hoặc Dịch vụ từ menu để xem nội dung đang được giới thiệu. Kiểm tra thời hạn và điều kiện trước khi áp dụng.", "Open Offers or Services from the menu to browse available items. Check validity and conditions before applying."],
      ["Nếu booking đủ điều kiện đánh giá, mở luồng đánh giá được liên kết với booking và gửi nhận xét theo biểu mẫu.", "If a booking is eligible for a review, open its review flow and submit feedback using the form."],
      ["Nhấn nút Liên hệ/Trợ giúp ở góc dưới để mở các kênh hỗ trợ. Chọn chat hoặc kênh liên hệ phù hợp.", "Select Contact/Support in the lower corner to open support channels. Choose chat or another suitable contact method."],
      ["Khi nhờ hỗ trợ booking, cung cấp mã booking và mô tả vấn đề; không gửi mật khẩu, OTP hoặc dữ liệu thanh toán nhạy cảm.", "When requesting booking help, provide the booking reference and explain the issue; never send passwords, OTPs, or sensitive payment data."],
      ["Dùng nút VI/EN trên thanh đầu để đổi ngôn ngữ. Tên khách sạn, địa chỉ, tên phòng/dịch vụ và nội dung do người dùng nhập có thể giữ nguyên ngôn ngữ gốc.", "Use the VI/EN control in the header to change language. Hotel names, addresses, room/service names, and user-entered content may remain in their original language."],
    ],
    tip: ["Nhân viên không bao giờ cần mật khẩu hoặc mã OTP của bạn để tra cứu booking.", "Staff never need your password or OTP to look up a booking."],
  },
];

export default function UserGuideButton() {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isEn = language === "en";
  const text = (vi: string, en: string) => isEn ? en : vi;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-full"
        onClick={() => setOpen(true)}
        aria-label={text("Mở hướng dẫn sử dụng", "Open user guide")}
        title={text("Hướng dẫn chi tiết", "Detailed user guide")}
      >
        <HelpCircle className="h-4 w-4 text-primary" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle className="text-xl">{text("Hướng dẫn đặt phòng và sử dụng website", "Booking and website user guide")}</DialogTitle>
            <DialogDescription>
              {text("Mở từng mục để xem các bước thực hiện và lưu ý quan trọng. Ảnh chụp giao diện sẽ được bổ sung khi có môi trường đăng nhập phù hợp.", "Expand a section for step-by-step instructions and important tips. Real interface screenshots will be added when a suitable signed-in environment is available.")}
            </DialogDescription>
          </DialogHeader>
          <a
            href="/user-guide/USER_GUIDE_VI_EN.pdf"
            download="Sen-Viet-User-Guide-VI-EN.pdf"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-4 w-4" />
            {text("Tải tài liệu tham khảo (PDF)", "Download reference guide (PDF)")}
          </a>
          <div className="space-y-3">
            {guideSections.map((section, index) => (
              <details key={section.title[0]} open={index === 0} className="group rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-foreground marker:hidden">
                  <span>{text(section.title[0], section.title[1])}</span>
                  <span className="text-sm text-primary transition group-open:rotate-180">⌄</span>
                </summary>
                <div className="space-y-4 border-t border-border p-4">
                  {(isEn ? section.imageEn : section.imageVi) && section.imageAlt && (
                    <figure>
                      <img src={isEn ? section.imageEn : section.imageVi} alt={text(section.imageAlt[0], section.imageAlt[1])} className="w-full rounded-lg border border-border bg-muted" />
                      <figcaption className="mt-1 text-center text-xs text-muted-foreground">
                        {text("Ảnh chụp giao diện thật.", "Real application screenshot.")}
                      </figcaption>
                    </figure>
                  )}
                  <ol className="space-y-3">
                    {section.steps.map(([vi, en], stepIndex) => (
                      <li key={vi} className="flex items-start gap-3 text-sm leading-6 text-foreground/90">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{stepIndex + 1}</span>
                        <span>{text(vi, en)}</span>
                      </li>
                    ))}
                  </ol>
                  {section.tip && (
                    <p className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm leading-5 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <span><strong>{text("Lưu ý: ", "Tip: ")}</strong>{text(section.tip[0], section.tip[1])}</span>
                    </p>
                  )}
                  {section.route && (
                    <Link to={section.route} onClick={() => setOpen(false)} className="inline-flex rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                      {text("Mở trang này", "Open this page")}
                    </Link>
                  )}
                </div>
              </details>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
