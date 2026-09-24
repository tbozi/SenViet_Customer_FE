export interface Hotel {
  id?: number;
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

export const hotelSlugToId: Record<string, number> = {
  "sen-viet-sai-gon": 1,
  "sen-viet-ha-noi": 2,
  "sen-viet-da-nang": 3,
  "sen-viet-nha-trang": 4,
  "sen-viet-da-lat": 5,
  "sen-viet-go-cong": 6,
  "sen-viet-an-nhon": 7,
};

export const hotels: Hotel[] = [
  {
    id: 1,
    slug: "sen-viet-sai-gon",
    name: "Sen Việt Sài Gòn",
    city: "Quận 1, TP. Hồ Chí Minh",
    province: "TP. Hồ Chí Minh",
    region: "south",
    description: "Tọa lạc kiêu hãnh giữa trái tim hoa lệ Quận 1, Sen Việt Sài Gòn là biểu tượng nghỉ dưỡng thượng lưu, giao thoa hoàn mỹ giữa nét duyên dáng Á Đông và kiến trúc đương đại đẳng cấp quốc tế. Sở hữu tầm nhìn panorama triệu đô ôm trọn sông Sài Gòn, hồ bơi vô cực dát vàng trên tầng thượng, spa thảo dược hoa sen độc bản và nhà hàng fine-dining chuẩn sao Michelin, khách sạn là chốn dừng chân hoàn hảo của các chính khách, doanh nhân tinh hoa và những thượng khách sành điệu nhất.",
    descriptionEn: "Standing proudly in the vibrant heart of District 1, Sen Việt Saigon is a masterclass in modern luxury, marrying oriental elegance with world-class cosmopolitan flair. Featuring million-dollar panoramic river views, a rooftop gold-accented infinity pool, signature lotus botanical spa and Michelin-inspired fine dining, it is the prestigious retreat of choice for discerning global travelers.",
    price: 1850000,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Hồ bơi vô cực tầng thượng", "Rooftop Sky Lounge", "Spa thảo dược độc bản", "Phòng yến tiệc hoàng gia", "Gym 24/7 & Sauna"],
  },
  {
    slug: "sen-viet-ha-noi",
    name: "Sen Việt Hà Nội",
    city: "Hoàn Kiếm, Hà Nội",
    province: "Hà Nội",
    region: "north",
    description: "Nằm kề bên Hồ Gươm huyền thoại và khu Phố Cổ ngàn năm văn hiến, Sen Việt Hà Nội là kiệt tác kiến trúc Đông Dương (Indochine) tráng lệ, tái hiện vẻ đẹp quý tộc hoàng gia Thăng Long xưa. Từng đường nét chạm khắc gỗ lim quý phái, ban công ngắm trọn tháp Rùa cổ kính, sảnh đón thơm ngát hương sen Tây Hồ và trà thất thượng hạng sẽ đưa quý khách vào một hành trình đắm chìm trong di sản, tôn quý và sự chăm chút tinh tế đến từng giác quan.",
    descriptionEn: "Set beside legendary Hoan Kiem Lake, Sen Việt Hanoi is an Indochine architectural masterpiece reviving the regal grandeur of ancient Hanoi. With exquisite ironwood craftsmanship, balconies overlooking Turtle Tower, delicate West Lake lotus scents and an imperial tea lounge, every stay is an unforgettable journey of heritage, nobility and unrivaled bespoke hospitality.",
    price: 1650000,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Trà thất cung đình", "Nhà hàng ẩm thực Thăng Long", "Ban công view Hồ Gươm", "Dịch vụ quản gia cá nhân", "Đưa đón Limousine"],
  },
  {
    slug: "sen-viet-da-nang",
    name: "Sen Việt Đà Nẵng",
    city: "Ngũ Hành Sơn, Đà Nẵng",
    province: "Đà Nẵng",
    region: "central",
    description: "Tựa mình trên bờ biển Mỹ Khê huyền thoại – một trong những bãi biển quyến rũ nhất hành tinh, Sen Việt Đà Nẵng là thiên đường nghỉ dưỡng nhiệt đới 5 sao thượng hạng. Nổi bật với bãi cát trắng mịn riêng biệt, hồ bơi nước mặn tràn bờ uốn lượn bên rặng dừa xanh mướt, biệt thự hướng biển đón trọn bình minh bán đảo Sơn Trà và trung tâm chăm sóc sức khỏe đá muối Himalaya, resort mang đến kỳ nghỉ viên mãn, tái sinh nguồn năng lượng tươi mới.",
    descriptionEn: "Nestled along legendary My Khe Beach – acclaimed as one of the planet's most seductive coastlines, Sen Việt Da Nang is a premier 5-star tropical sanctuary. Featuring a private powdery white-sand beach, a sprawling lagoon saltwater pool, oceanfront villas framing Son Tra Peninsula sunrises and a Himalayan salt-stone wellness haven, your stay is an elevated journey of rejuvenation.",
    price: 2150000,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Bãi biển cát trắng riêng", "Hồ bơi vô cực nước mặn", "Himalaya Wellness Spa", "Câu lạc bộ du thuyền", "Kids Club lâu đài cát"],
  },
  {
    slug: "sen-viet-nha-trang",
    name: "Sen Việt Nha Trang",
    city: "Nha Trang, Khánh Hòa",
    province: "Khánh Hòa",
    region: "central",
    description: "Vươn mình kiêu hãnh trên cung đường biển vàng Trần Phú, Sen Việt Nha Trang là 'viên ngọc đại dương' lấp lánh giữa vịnh biển thơ mộng. 100% phòng nghỉ và suite đều sở hữu ban công kính tràn viền hướng ra làn nước xanh ngọc bích, bồn tắm ngâm thảo dược ngắm hoàng hôn vịnh biển, cùng Sky Bar cao nhất thành phố đón gió đại dương, mang đến trải nghiệm nghỉ dưỡng xa hoa đỉnh cao không thể nào quên.",
    descriptionEn: "Rising majestically along Tran Phu's golden coastal boulevard, Sen Việt Nha Trang is a shimmering jewel on picturesque Nha Trang Bay. All guest rooms and penthouses boast glass-front balconies embracing crystal turquoise waters, botanical soak tubs overlooking the bay sunset, and the city's highest open-air Sky Bar for a taste of pure coastal opulence.",
    price: 1950000,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop",
    amenities: ["100% phòng view biển", "Sky Bar ngắm toàn cảnh vịnh", "Bể bơi kính vô cực", "Lặn biển san hô tư nhân", "Hải sản tươi sống cao cấp"],
  },
  {
    slug: "sen-viet-da-lat",
    name: "Sen Việt Đà Lạt",
    city: "Đà Lạt, Lâm Đồng",
    province: "Lâm Đồng",
    region: "central",
    description: "Ẩn mình giữa ngàn thông reo và thung lũng sương mây bồng bềnh của thành phố ngàn hoa, Sen Việt Đà Lạt mang đến không gian cổ tích lãng mạn đậm chất quý tộc Pháp cổ điển. Với lò sưởi ấm cúng trong từng gian phòng, ban công ngập tràn hoa hồng môn nhìn xuống hồ sương mù, tiệc trà chiều hoàng gia bên lò nướng bánh gỗ và vườn dâu tây sinh thái riêng, resort là chốn an yên tuyệt đối để chữa lành tâm hồn và tận hưởng khí hậu cao nguyên thanh khiết.",
    descriptionEn: "Concealed amidst whispering pine hills and the floating mist of the City of Eternal Spring, Sen Việt Da Lat is a romantic French-heritage sanctuary. Featuring wood-burning fireplaces in every suite, rose-clad verandas admiring tranquil mountain lakes, British afternoon teas and an organic berry garden, it offers an idyllic retreat for deep restoration and poetic solitude.",
    price: 1750000,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Lò sưởi phòng khách", "Trà chiều quý tộc Pháp", "Vườn hoa hồng Pháp & Dâu tây", "Xông hơi tinh dầu thông", "Xe đạp địa hình"],
  },
  {
    slug: "sen-viet-go-cong",
    name: "Sen Việt Gò Công",
    city: "Gò Công, Tiền Giang",
    province: "Tiền Giang",
    region: "south",
    description: "Nép mình bên dòng sông Tiền êm đềm giữa những rặng dừa nước và miệt vườn Nam Bộ trù phú, Sen Việt Gò Công là bản hòa tấu thanh bình của thiên nhiên sông nước Cửu Long. Khách sạn kết hợp hài hòa nét mộc mạc dân dã của xứ lụa Tân Châu với dịch vụ nghỉ dưỡng cao cấp, mang đến cho du khách những buổi sớm ngắm bình minh trên sông nước, thưởng thức đờn ca tài tử và các món ngon đồng nội đậm đà tình quê.",
    descriptionEn: "Resting gently on the tranquil banks of the Tien River amidst lush tropical fruit orchards, Sen Việt Go Cong captures the timeless romance of the Mekong Delta. Combining authentic Southern river charm with refined boutique indulgence, guests enjoy sunrise boat excursions, traditional folk music recitals and exquisite delta gastronomy.",
    price: 990000,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Hồ bơi hướng sông Tiền", "Ẩm thực miệt vườn Nam Bộ", "Du thuyền ngắm hoàng hôn", "Đờn ca tài tử Nam Bộ", "Xe đạp khám phá làng nghề"],
  },
  {
    slug: "sen-viet-an-nhon",
    name: "Sen Việt An Nhơn",
    city: "An Nhơn, Bình Định",
    province: "Bình Định",
    region: "central",
    description: "Tọa lạc trên mảnh đất địa linh nhân kiệt Bình Định, Sen Việt An Nhơn là cầu nối văn hóa tôn vinh hào khí Tây Sơn và tinh hoa tháp Chăm ngàn năm rực rỡ. Với nội thất gốm nung và đá sa thạch tinh xảo, hồ sen thơm ngát giữa khuôn viên tĩnh lặng và các tour trải nghiệm võ cổ truyền Bình Định, nơi đây mở ra một không gian nghỉ dưỡng đậm đà bản sắc hào sảng miền Trung.",
    descriptionEn: "Situated in the historic cradle of martial arts and ancient Cham heritage, Sen Việt An Nhon celebrates the rich cultural legacy of Central Vietnam. Adorned with sandstone sculptures and terra-cotta artistry, a serene lotus pavilion and curated martial arts heritage tours, it offers an enriching and culturally profound escape.",
    price: 1100000,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop",
    amenities: ["Vườn sen thiền định", "Tour di sản Champa & Tây Sơn", "Ẩm thực đặc sản Bình Định", "Hồ bơi nhiệt đới", "Lớp học trà sen"],
  },
];

export function formatVnd(amount: number) {
  if (typeof amount !== "number" || isNaN(amount)) return "0₫";
  return amount.toLocaleString("vi-VN") + "₫";
}
