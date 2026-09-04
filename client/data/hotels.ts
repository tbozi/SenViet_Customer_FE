export interface Hotel {
  slug: string;
  name: string;
  city: string;
  province: string;
  region: "north" | "central" | "south";
  description: string;
  descriptionEn: string;
  price: number;
  rating: number;
  image: string;
  amenities: string[];
}

export const hotels: Hotel[] = [
  {
    slug: "sen-viet-go-cong",
    name: "Sen Việt Gò Công",
    city: "Gò Công",
    province: "Tiền Giang",
    region: "south",
    description: "Nghỉ dưỡng ven sông giữa miệt vườn Nam Bộ, không gian yên bình sông nước.",
    descriptionEn: "A riverside retreat amid the orchards of the Mekong Delta.",
    price: 890000,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Hồ bơi vô cực", "Nhà hàng sông nước", "Xe đạp miễn phí"],
  },
  {
    slug: "sen-viet-an-nhon",
    name: "Sen Việt An Nhơn",
    city: "An Nhơn",
    province: "Bình Định",
    region: "central",
    description: "Khách sạn boutique giữa lòng phố biển miền Trung, gần các di tích Chăm cổ.",
    descriptionEn: "A boutique stay on the central coast, near ancient Cham towers.",
    price: 950000,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Spa truyền thống", "Tour di sản", "Bữa sáng buffet"],
  },
  {
    slug: "sen-viet-sai-gon",
    name: "Sen Việt Sài Gòn",
    city: "TP. Hồ Chí Minh",
    province: "TP. Hồ Chí Minh",
    region: "south",
    description: "Khách sạn thương gia hiện đại giữa trung tâm sôi động nhất Sài Gòn.",
    descriptionEn: "A modern business hotel in the heart of vibrant Saigon.",
    price: 1450000,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Rooftop bar", "Trung tâm hội nghị", "Gym 24/7"],
  },
  {
    slug: "sen-viet-da-nang",
    name: "Sen Việt Đà Nẵng",
    city: "Đà Nẵng",
    province: "Đà Nẵng",
    region: "central",
    description: "Resort mặt biển Mỹ Khê, lý tưởng cho gia đình và nghỉ dưỡng dài ngày.",
    descriptionEn: "A beachfront resort on My Khe beach, ideal for family getaways.",
    price: 1650000,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Bãi biển riêng", "Hồ bơi trẻ em", "Câu lạc bộ trẻ em"],
  },
  {
    slug: "sen-viet-ha-noi",
    name: "Sen Việt Hà Nội",
    city: "Hà Nội",
    province: "Hà Nội",
    region: "north",
    description: "Boutique hotel trong lòng phố cổ, giao thoa nét cổ kính và hiện đại.",
    descriptionEn: "A boutique hotel in the Old Quarter, blending heritage and modern comfort.",
    price: 1250000,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Lớp học nấu ăn", "Trà đạo", "Đưa đón sân bay"],
  },
  {
    slug: "sen-viet-nha-trang",
    name: "Sen Việt Nha Trang",
    city: "Nha Trang",
    province: "Khánh Hòa",
    region: "central",
    description: "Resort ven vịnh Nha Trang với hồ bơi vô cực hướng biển.",
    descriptionEn: "A bayside resort in Nha Trang with an ocean-view infinity pool.",
    price: 1550000,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Hồ bơi vô cực", "Lặn biển", "Spa hướng biển"],
  },
];

export function formatVnd(amount: number) {
  return amount.toLocaleString("vi-VN") + "₫";
}
