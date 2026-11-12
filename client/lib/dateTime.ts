/**
 * Module tiện ích chuẩn hóa định dạng Ngày & Giờ cho toàn bộ hệ thống Sen Việt Luxury
 * Hỗ trợ linh hoạt chuyển đổi giữa Tiếng Việt (DD/MM/YYYY) và Tiếng Anh (DD MMM YYYY)
 */

const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Định dạng ngày hiển thị:
 * - Tiếng Việt: DD/MM/YYYY (ví dụ: 12/11/2026)
 * - Tiếng Anh: DD MMM YYYY (ví dụ: 12 Nov 2026) để tránh nhầm lẫn giữa ngày và tháng
 */
export function formatDisplayDate(dateInput?: string | Date | null, language: string = "vi"): string {
  if (!dateInput) return "";

  let d: Date;
  if (typeof dateInput === "string") {
    // Nếu chuỗi dạng YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split("-").map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = dateInput;
  }

  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, "0");
  const monthNum = d.getMonth();
  const year = d.getFullYear();

  if (language === "en") {
    return `${day} ${MONTHS_EN[monthNum]} ${year}`;
  }

  const month = String(monthNum + 1).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

/**
 * Định dạng ngày giờ hiển thị:
 * - Tiếng Việt: DD/MM/YYYY HH:mm (ví dụ: 12/11/2026 14:00)
 * - Tiếng Anh: DD MMM YYYY, HH:mm (ví dụ: 12 Nov 2026, 14:00)
 */
export function formatDisplayDateTime(dateInput?: string | Date | null, language: string = "vi"): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const datePart = formatDisplayDate(d, language);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  if (language === "en") {
    return `${datePart}, ${hours}:${minutes}`;
  }
  return `${datePart} ${hours}:${minutes}`;
}

/**
 * Định dạng khoảng ngày lưu trú:
 * - Tiếng Việt: 12/11/2026 ➔ 13/11/2026
 * - Tiếng Anh: 12 Nov 2026 ➔ 13 Nov 2026
 */
export function formatStayDates(checkIn?: string, checkOut?: string, language: string = "vi"): string {
  if (!checkIn || !checkOut) return "";
  const inStr = formatDisplayDate(checkIn, language);
  const outStr = formatDisplayDate(checkOut, language);
  return `${inStr} ➔ ${outStr}`;
}
