import axiosInstance from "@/lib/axiosInstance";

export interface ReviewItem {
  id: number;
  bookingId: number;
  customerId: number;
  customerName: string;
  hotelId: number;
  hotelName: string;
  roomTypeName?: string;
  rating: number;
  cleanlinessRating?: number;
  serviceRating?: number;
  facilitiesRating?: number;
  locationRating?: number;
  title?: string;
  comment: string;
  createdAt: string;
}

export interface HotelReviewSummary {
  hotelId: number;
  hotelName: string;
  averageRating: number;
  totalReviews: number;
  avgCleanliness: number;
  avgService: number;
  avgFacilities: number;
  avgLocation: number;
  starCounts: Record<string | number, number>;
  reviews: ReviewItem[];
}

export interface CreateReviewPayload {
  bookingId: number | string;
  rating: number;
  cleanlinessRating?: number;
  serviceRating?: number;
  facilitiesRating?: number;
  locationRating?: number;
  title?: string;
  comment?: string;
}

// Fallback reviews nếu server đang khởi động lại
const FALLBACK_REVIEWS: Record<number, HotelReviewSummary> = {
  1: {
    hotelId: 1,
    hotelName: "Sen Việt Sài Gòn",
    averageRating: 4.9,
    totalReviews: 3,
    avgCleanliness: 5.0,
    avgService: 4.8,
    avgFacilities: 4.8,
    avgLocation: 5.0,
    starCounts: { 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 },
    reviews: [
      {
        id: 1,
        bookingId: 601,
        customerId: 202,
        customerName: "Nguyễn Văn An",
        hotelId: 1,
        hotelName: "Sen Việt Sài Gòn",
        roomTypeName: "Phòng Suite Ban Công Triệu Đô",
        rating: 5,
        cleanlinessRating: 5,
        serviceRating: 5,
        facilitiesRating: 5,
        locationRating: 5,
        title: "Trải nghiệm thượng lưu ngắm trọn sông Sài Gòn",
        comment:
          "Khách sạn có tầm nhìn panorama sông Sài Gòn tuyệt đẹp, hồ bơi vô cực dát vàng trên tầng thượng rất đẳng cấp. Nhân viên phục vụ chu đáo, trà sen chào đón thơm ngát.",
        createdAt: "08/09/2026 14:30",
      },
      {
        id: 2,
        bookingId: 602,
        customerId: 203,
        customerName: "Trần Thị Bích",
        hotelId: 1,
        hotelName: "Sen Việt Sài Gòn",
        roomTypeName: "Phòng Deluxe Hướng Phố Hoa Lệ",
        rating: 5,
        cleanlinessRating: 5,
        serviceRating: 5,
        facilitiesRating: 4,
        locationRating: 5,
        title: "Vị trí đắc địa ngay trung tâm Quận 1",
        comment:
          "Nằm ngay trung tâm nên rất tiện đi dạo phố đi bộ và mua sắm. Phòng ốc cực kỳ sạch sẽ, cách âm hoàn hảo, giường nằm êm ái ngủ rất ngon giấc.",
        createdAt: "11/09/2026 10:15",
      },
      {
        id: 3,
        bookingId: 603,
        customerId: 204,
        customerName: "Lê Hoàng Cường",
        hotelId: 1,
        hotelName: "Sen Việt Sài Gòn",
        roomTypeName: "Phòng Standard Thanh Lịch",
        rating: 4,
        cleanlinessRating: 5,
        serviceRating: 4,
        facilitiesRating: 4,
        locationRating: 5,
        title: "Dịch vụ chuẩn 5 sao, đồ ăn sáng phong phú",
        comment:
          "Khách sạn rất đẹp, buffet sáng đa dạng các món Á - Âu ngon miệng. Chỉ có thang máy vào giờ cao điểm hơi đông một chút nhưng nhân viên điều phối rất nhanh nhẹn.",
        createdAt: "15/09/2026 09:40",
      },
    ],
  },
};

export async function fetchHotelReviews(hotelId: number): Promise<HotelReviewSummary> {
  try {
    const res = await axiosInstance.get(`/reviews/hotels/${hotelId}`);
    return res.data.result;
  } catch {
    return {
      hotelId,
      hotelName: "",
      averageRating: 0,
      totalReviews: 0,
      avgCleanliness: 0,
      avgService: 0,
      avgFacilities: 0,
      avgLocation: 0,
      starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      reviews: [],
    };
  }
}

export async function fetchBookingReview(bookingId: number | string): Promise<ReviewItem | null> {
  try {
    const res = await axiosInstance.get(`/reviews/booking/${bookingId}`);
    return res.data.result;
  } catch {
    return null;
  }
}

export async function submitReview(payload: CreateReviewPayload): Promise<ReviewItem> {
  const res = await axiosInstance.post("/reviews", payload);
  return res.data.result;
}
