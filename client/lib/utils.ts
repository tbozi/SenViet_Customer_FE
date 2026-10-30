import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Chuyển đổi đối tượng Date sang chuỗi 'YYYY-MM-DD' theo giờ địa phương (local timezone),
 * tránh lỗi lệch múi giờ (UTC+7) khi dùng toISOString().slice(0, 10).
 */
export function toLocalDateStr(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
