import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Coffee,
  Compass,
  Dumbbell,
  Flower2,
  Heart,
  HelpCircle,
  Mail,
  MapPin,
  Maximize2,
  Navigation,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
  Users,
  Waves,
  Wifi,
  X,
} from "lucide-react";
import HotelCard from "@/components/HotelCard";
import { formatHotelLocation, formatVnd, hotels, hotelSlugToId } from "@/data/hotels";
import { toLocalDateStr } from "@/lib/utils";
import { rooms as fallbackRooms, type RoomType } from "@/data/rooms";
import { fetchRoomsByHotel } from "@/services/roomApi";
import { fetchHotelReviews, type HotelReviewSummary } from "@/services/reviewApi";
import { useLanguage } from "@/lib/i18n";

// Dữ liệu mở rộng ảnh và trải nghiệm đặc sắc cho từng chi nhánh
interface BranchDetailConfig {
  taglineVi: string;
  taglineEn: string;
  storyVi: string;
  storyEn: string;
  architectureVi: string;
  architectureEn: string;
  signatureExperienceVi: string;
  signatureExperienceEn: string;
  curatedGallery: {
    url: string;
    captionVi: string;
    captionEn: string;
    category: "all" | "rooms" | "dining" | "pool" | "wellness" | "architecture";
  }[];
  nearbyLandmarks: {
    nameVi: string;
    nameEn: string;
    distance: string;
    timeVi: string;
    timeEn: string;
    type: "walk" | "car";
  }[];
}

const branchConfigs: Record<string, BranchDetailConfig> = {
  "sen-viet-sai-gon": {
    taglineVi: "Kiệt tác thượng lưu giữa trái tim Sài Gòn phồn hoa",
    taglineEn: "A masterclass in luxury at the vibrant pulse of Saigon",
    storyVi:
      "Tọa lạc tại vị trí độc tôn Quận 1 với tầm nhìn ôm trọn sông Sài Gòn và trung tâm đô thị rực rỡ, Sen Việt Sài Gòn hòa quyện hoàn hảo giữa sự thanh tao của hoa sen Á Đông và chuẩn mực nghỉ dưỡng xa hoa đương đại. Khách sạn sở hữu hồ bơi vô cực dát vàng trên tầng thượng, trung tâm Lotus Botanical Spa độc quyền và chuỗi nhà hàng ẩm thực chuẩn sao.",
    storyEn:
      "Standing proudly in the prestigious heart of District 1 with sweeping panoramas of the Saigon River, Sen Việt Saigon marries oriental lotus elegance with contemporary five-star indulgence. Guests relish a gold-accented rooftop infinity pool, the signature Lotus Botanical Spa, and gourmet Michelin-inspired culinary venues.",
    architectureVi: "Kiến trúc Art Deco kết hợp họa tiết hoa sen điêu khắc gỗ tinh xảo",
    architectureEn: "Art Deco architecture blended with intricate handcrafted lotus timber motifs",
    signatureExperienceVi: "Thưởng thức cocktail hoàng hôn tại Rooftop Sky Lounge tầng 28 ngắm trọn vẹn skyline Sài Gòn",
    signatureExperienceEn: "Sunset signature cocktails at the 28th-floor Rooftop Sky Lounge overlooking the city skyline",
    curatedGallery: [
      {
        url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1400&auto=format&fit=crop",
        captionVi: "Toàn cảnh mặt tiền sang trọng Sen Việt Sài Gòn",
        captionEn: "Grand exterior facade of Sen Việt Saigon",
        category: "architecture",
      },
      {
        url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Phòng Suite Hoàng Gia với tầm nhìn sông Sài Gòn",
        captionEn: "Royal Suite with panoramic Saigon River views",
        category: "rooms",
      },
      {
        url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Hồ bơi vô cực tầng thượng dát vàng",
        captionEn: "Gold-accented rooftop infinity pool",
        category: "pool",
      },
      {
        url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Nhà hàng Fine Dining Lotus & Sky Bar",
        captionEn: "Lotus Fine Dining & Sky Bar",
        category: "dining",
      },
      {
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Lotus Botanical Spa & Thảo dược trị liệu",
        captionEn: "Lotus Botanical Spa & Herbal Sanctuary",
        category: "wellness",
      },
      {
        url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Phòng Executive Lounge đẳng cấp doanh nhân",
        captionEn: "Executive Business Lounge",
        category: "rooms",
      },
      {
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Đại sảnh đón tiếp phong cách cung đình Á Đông",
        captionEn: "Grand Palace Arrival Lobby",
        category: "architecture",
      },
      {
        url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Ban công riêng tư ngắm toàn cảnh trung tâm",
        captionEn: "Private city-view balcony",
        category: "rooms",
      },
    ],
    nearbyLandmarks: [
      { nameVi: "Chợ Bến Thành", nameEn: "Ben Thanh Market", distance: "800 m", timeVi: "5 phút đi bộ", timeEn: "5 min walk", type: "walk" },
      { nameVi: "Phố đi bộ Nguyễn Huệ", nameEn: "Nguyen Hue Walking Street", distance: "1.2 km", timeVi: "7 phút đi bộ", timeEn: "7 min walk", type: "walk" },
      { nameVi: "Nhà hát Thành phố", nameEn: "Saigon Opera House", distance: "1.5 km", timeVi: "5 phút đi xe", timeEn: "5 min drive", type: "car" },
      { nameVi: "Dinh Độc Lập & Nhà thờ Đức Bà", nameEn: "Independence Palace & Notre Dame", distance: "1.8 km", timeVi: "6 phút đi xe", timeEn: "6 min drive", type: "car" },
      { nameVi: "Sân bay Quốc tế Tân Sơn Nhất", nameEn: "Tan Son Nhat International Airport", distance: "7.5 km", timeVi: "25 phút đi xe", timeEn: "25 min drive", type: "car" },
    ],
  },

  "sen-viet-ha-noi": {
    taglineVi: "Kiệt tác Indochine bên bờ Hồ Gươm ngàn năm văn hiến",
    taglineEn: "Indochine elegance beside legendary Hoan Kiem Lake",
    storyVi:
      "Chỉ cách tháp Rùa và bờ Hồ Gươm vài bước chân, Sen Việt Hà Nội tái hiện vẻ đẹp quý tộc hoàng gia Thăng Long xưa qua ngôn ngữ kiến trúc Đông Dương hoài cổ. Với trà thất cung đình phục vụ trà sen Tây Hồ ướp sớm mai, ban công ngắm trọn tán cây cổ thụ và dịch vụ quản gia tận tụy, mỗi khoảnh khắc tại đây là một hành trình đậm đà văn hóa thủ đô.",
    storyEn:
      "Just footsteps from Turtle Tower and Hoan Kiem Lake, Sen Việt Hanoi revives Thang Long's regal grace through poetic Indochine architecture. Featuring an imperial tea salon serving fresh West Lake lotus tea, heritage balconies shaded by centennial trees, and bespoke butler care, every stay is an immersive cultural voyage.",
    architectureVi: "Kiến trúc Pháp - Đông Dương cổ điển với sàn gỗ lim và gạch bông thủ công",
    architectureEn: "French-Indochine colonial charm with ironwood parquetry and handcrafted encaustic tiles",
    signatureExperienceVi: "Thưởng thức Trà chiều Hoàng cung với mứt sen Tây Hồ tại Trà Thất Sen Vàng",
    signatureExperienceEn: "Imperial Royal Afternoon Tea with West Lake candied lotus seeds at the Golden Lotus Salon",
    curatedGallery: [
      {
        url: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=1400&auto=format&fit=crop",
        captionVi: "Mặt tiền cổ điển Pháp - Đông Dương Sen Việt Hà Nội",
        captionEn: "French-Indochine heritage facade of Sen Việt Hanoi",
        category: "architecture",
      },
      {
        url: "https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Phòng Indochine Suite hướng Hồ Gươm",
        captionEn: "Indochine Suite overlooking Hoan Kiem Lake",
        category: "rooms",
      },
      {
        url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Trà thất cung đình Thăng Long",
        captionEn: "Imperial Thang Long Tea Lounge",
        category: "dining",
      },
      {
        url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Nhà hàng di sản ẩm thực Hà Thành",
        captionEn: "Hanoi Heritage Gastronomy Restaurant",
        category: "dining",
      },
      {
        url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Hồ sen thanh tịnh giữa sân vườn nội khu",
        captionEn: "Tranquil courtyard lotus pavilion",
        category: "wellness",
      },
      {
        url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Ban công ngắm nhìn phố cổ Hà Nội",
        captionEn: "Balcony overlooking Hanoi Old Quarter",
        category: "rooms",
      },
    ],
    nearbyLandmarks: [
      { nameVi: "Hồ Hoàn Kiếm & Đền Ngọc Sơn", nameEn: "Hoan Kiem Lake & Ngoc Son Temple", distance: "300 m", timeVi: "4 phút đi bộ", timeEn: "4 min walk", type: "walk" },
      { nameVi: "Phố Cổ 36 Phố Phường", nameEn: "Hanoi Old Quarter 36 Streets", distance: "200 m", timeVi: "3 phút đi bộ", timeEn: "3 min walk", type: "walk" },
      { nameVi: "Nhà Hát Lớn Hà Nội", nameEn: "Hanoi Opera House", distance: "900 m", timeVi: "4 phút đi xe", timeEn: "4 min drive", type: "car" },
      { nameVi: "Văn Miếu - Quốc Tử Giám", nameEn: "Temple of Literature", distance: "2.5 km", timeVi: "8 phút đi xe", timeEn: "8 min drive", type: "car" },
      { nameVi: "Sân bay Quốc tế Nội Bài", nameEn: "Noi Bai International Airport", distance: "28 km", timeVi: "35 phút đi xe", timeEn: "35 min drive", type: "car" },
    ],
  },

  "sen-viet-da-nang": {
    taglineVi: "Thiên đường nghỉ dưỡng biển nhiệt đới bên bờ Mỹ Khê",
    taglineEn: "Five-star coastal sanctuary on breathtaking My Khe Beach",
    storyVi:
      "Tựa mình bên bờ cát trắng mịn màng của bãi biển Mỹ Khê – một trong sáu bãi biển quyến rũ nhất hành tinh do Forbes bình chọn, Sen Việt Đà Nẵng mở ra không gian nghỉ dưỡng nhiệt đới ngập tràn nắng gió đại dương. Resort sở hữu hồ bơi nước mặn tràn bờ dài 80m, trung tâm chăm sóc sức khỏe đá muối Himalaya và chuỗi nhà hàng hải sản cao cấp bắt trọn hoàng hôn vịnh Đà Nẵng.",
    storyEn:
      "Nestled along the powdery white sands of My Khe Beach – acclaimed as one of the world's most charming coastlines by Forbes, Sen Việt Da Nang offers a sun-drenched tropical oasis. Featuring an 80-meter beachfront saltwater lagoon pool, Himalayan salt-stone wellness sanctuary, and oceanfront dining framing breathtaking sunsets.",
    architectureVi: "Kiến trúc nhiệt đới đương đại mở rộng tối đa tầm nhìn biển và bán đảo Sơn Trà",
    architectureEn: "Contemporary tropical architecture framing endless ocean horizons and Son Tra Peninsula",
    signatureExperienceVi: "Yoga đón bình minh trên bãi cát riêng và tiệc nướng hải sản cao cấp bên bờ sóng",
    signatureExperienceEn: "Sunrise beachfront yoga and private sunset coastal barbecue beneath the palms",
    curatedGallery: [
      {
        url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1400&auto=format&fit=crop",
        captionVi: "Toàn cảnh khu nghỉ dưỡng bên bãi biển Mỹ Khê",
        captionEn: "Aerial view of the resort along My Khe coastline",
        category: "architecture",
      },
      {
        url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Hồ bơi nước mặn tràn bờ hướng biển",
        captionEn: "Beachfront saltwater infinity lagoon pool",
        category: "pool",
      },
      {
        url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Biệt thự hướng biển cao cấp",
        captionEn: "Premier Oceanfront Villa",
        category: "rooms",
      },
      {
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Bãi cát trắng mịn riêng tư của khu nghỉ dưỡng",
        captionEn: "Private powdery white-sand beach",
        category: "pool",
      },
      {
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Trung tâm phục hồi sức khỏe đá muối Himalaya",
        captionEn: "Himalayan Salt-Stone Rejuvenation Spa",
        category: "wellness",
      },
      {
        url: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Nhà hàng hải sản tươi sống bên biển",
        captionEn: "Oceanfront Fresh Catch Grill & Bar",
        category: "dining",
      },
    ],
    nearbyLandmarks: [
      { nameVi: "Bãi biển Mỹ Khê", nameEn: "My Khe Beach", distance: "150 m", timeVi: "2 phút đi bộ", timeEn: "2 min walk", type: "walk" },
      { nameVi: "Cầu Rồng & Cầu Tình Yêu", nameEn: "Dragon Bridge & Love Lock Pier", distance: "2.8 km", timeVi: "5 phút đi xe", timeEn: "5 min drive", type: "car" },
      { nameVi: "Danh thắng Ngũ Hành Sơn", nameEn: "Marble Mountains", distance: "4.5 km", timeVi: "7 phút đi xe", timeEn: "7 min drive", type: "car" },
      { nameVi: "Bán đảo Sơn Trà & Chùa Linh Ứng", nameEn: "Son Tra Peninsula & Linh Ung Pagoda", distance: "8.0 km", timeVi: "12 phút đi xe", timeEn: "12 min drive", type: "car" },
      { nameVi: "Sân bay Quốc tế Đà Nẵng", nameEn: "Da Nang International Airport", distance: "5.5 km", timeVi: "10 phút đi xe", timeEn: "10 min drive", type: "car" },
    ],
  },

  "sen-viet-nha-trang": {
    taglineVi: "Viên ngọc đại dương rực rỡ trên cung đường vàng Trần Phú",
    taglineEn: "The glittering oceanic jewel on Tran Phu Golden Avenue",
    storyVi:
      "Vươn mình kiêu hãnh trên cung đường biển đẹp nhất Việt Nam, Sen Việt Nha Trang mang đến trải nghiệm nghỉ dưỡng xa hoa với 100% phòng nghỉ và suite sở hữu tầm nhìn trực diện vịnh ngọc. Quý khách có thể thư giãn tại hồ bơi kính vô cực lưng chừng trời, đắm mình trong bồn ngâm thảo dược ngắm hoàng hôn vịnh biển và thưởng thức hải sản thượng hạng tại Sky Lounge cao nhất vịnh.",
    storyEn:
      "Rising majestically along Vietnam's premier coastal boulevard, Sen Việt Nha Trang offers ultimate coastal luxury with 100% of rooms and suites framing unobstructed turquoise bay views. Indulge in an elevated glass-bottom infinity pool, herbal soaking tubs overlooking ocean sunsets, and premier seafood at the panoramic sky lounge.",
    architectureVi: "Kiến trúc du thuyền tương lai với kính cong tràn viền đón trọn ánh sáng vịnh biển",
    architectureEn: "Futuristic yacht-inspired architecture with curved floor-to-ceiling glass embracing bay panoramas",
    signatureExperienceVi: "Thưởng thức tiệc champagne và hàu vịnh Nha Trang trên Sky Bar tầng 32 đón gió biển",
    signatureExperienceEn: "Champagne & fresh Nha Trang oysters at the 32nd-floor Sky Bar catching oceanic breezes",
    curatedGallery: [
      {
        url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1400&auto=format&fit=crop",
        captionVi: "Tòa tháp Sen Việt Nha Trang hướng trọn vịnh biển",
        captionEn: "Sen Việt Nha Trang Tower embracing the bay",
        category: "architecture",
      },
      {
        url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Suite Ocean View với ban công kính tràn viền",
        captionEn: "Ocean View Suite with seamless glass balcony",
        category: "rooms",
      },
      {
        url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Bể bơi vô cực nhìn ra đảo Hòn Tre",
        captionEn: "Infinity pool gazing across Hon Tre island",
        category: "pool",
      },
      {
        url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Ocean Sky Bar tầng 32 cao nhất cung đường",
        captionEn: "Ocean Sky Bar on the 32nd floor",
        category: "dining",
      },
      {
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Spa thư giãn khoáng nóng thảo mộc",
        captionEn: "Herbal & Mineral Hot Spring Spa",
        category: "wellness",
      },
    ],
    nearbyLandmarks: [
      { nameVi: "Bãi biển Trần Phú", nameEn: "Tran Phu Beach", distance: "80 m", timeVi: "1 phút đi bộ", timeEn: "1 min walk", type: "walk" },
      { nameVi: "Quảng trường 2/4 & Tháp Trầm Hương", nameEn: "2/4 Square & Agarwood Tower", distance: "600 m", timeVi: "7 phút đi bộ", timeEn: "7 min walk", type: "walk" },
      { nameVi: "Tháp Bà Ponagar cổ kính", nameEn: "Ancient Ponagar Cham Towers", distance: "3.5 km", timeVi: "8 phút đi xe", timeEn: "8 min drive", type: "car" },
      { nameVi: "Cảng cáp treo Vinpearl Nha Trang", nameEn: "Vinpearl Cable Car Terminal", distance: "5.2 km", timeVi: "10 phút đi xe", timeEn: "10 min drive", type: "car" },
      { nameVi: "Sân bay Quốc tế Cam Ranh", nameEn: "Cam Ranh International Airport", distance: "34 km", timeVi: "35 phút đi xe", timeEn: "35 min drive", type: "car" },
    ],
  },

  "sen-viet-da-lat": {
    taglineVi: "Chốn thần tiên cổ tích giữa ngàn thông reo và thung lũng mây",
    taglineEn: "A fairy-tale sanctuary amidst whispering pines and rolling mist",
    storyVi:
      "Ẩn hiện giữa những đồi thông nguyên sinh và sương mây bồng bềnh của cao nguyên Langbiang, Sen Việt Đà Lạt là kiệt tác biệt thự Pháp cổ điển đầy lãng mạn. Với lò sưởi ấm cúng trong mỗi căn phòng, ban công ngập tràn hoa hồng môn nhìn ra hồ nước tĩnh lặng và tiệc trà chiều hoàng gia bên vườn dâu sinh thái, đây là thiên đường chữa lành tâm hồn tuyệt đối.",
    storyEn:
      "Concealed within ancient pine ridges and floating morning mist of the Langbiang highlands, Sen Việt Da Lat embodies romantic French manor grandeur. Boasting wood-burning fireplaces in every room, rose-draped verandas overlooking serene lakes, and British high tea in organic berry gardens, it is a haven for pure rejuvenation.",
    architectureVi: "Biệt thự kiến trúc Pháp cổ điển với mái ngói đỏ, đá bazan và lò sưởi củi tự nhiên",
    architectureEn: "French vintage manor architecture with basalt stone walls and genuine wood fireplaces",
    signatureExperienceVi: "Tiệc trà chiều phong cách quý tộc Anh bên lò sưởi hoa cúc và dâu tây tươi hái tại vườn",
    signatureExperienceEn: "Aristocratic English afternoon tea by the crackling fireplace with garden-picked berries",
    curatedGallery: [
      {
        url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1400&auto=format&fit=crop",
        captionVi: "Biệt thự Sen Việt Đà Lạt giữa rừng thông thơ mộng",
        captionEn: "Sen Việt Da Lat Manor nestled in pine woods",
        category: "architecture",
      },
      {
        url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Phòng nghỉ ấm áp với lò sưởi và ban công hoa",
        captionEn: "Cozy fireplace room with floral balcony",
        category: "rooms",
      },
      {
        url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Vườn hoa hồng Pháp và đồi dâu tây sinh thái",
        captionEn: "French rose gardens and organic strawberry hills",
        category: "wellness",
      },
      {
        url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Tiệc trà chiều hoàng gia bên hồ sương mù",
        captionEn: "Royal afternoon tea beside the misty lake",
        category: "dining",
      },
      {
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Xông hơi tinh dầu thông tự nhiên phục hồi thể lực",
        captionEn: "Natural pine essential oil therapeutic sauna",
        category: "wellness",
      },
    ],
    nearbyLandmarks: [
      { nameVi: "Hồ Xuân Hương & Vườn Hoa Thành Phố", nameEn: "Xuan Huong Lake & City Flower Park", distance: "1.5 km", timeVi: "4 phút đi xe", timeEn: "4 min drive", type: "car" },
      { nameVi: "Chợ Đêm Đà Lạt & Phố Hòa Bình", nameEn: "Da Lat Night Market & Hoa Binh Area", distance: "2.2 km", timeVi: "6 phút đi xe", timeEn: "6 min drive", type: "car" },
      { nameVi: "Ga Đà Lạt cổ kính", nameEn: "Historic Da Lat Railway Station", distance: "2.8 km", timeVi: "7 phút đi xe", timeEn: "7 min drive", type: "car" },
      { nameVi: "Quảng trường Lâm Viên", nameEn: "Lam Vien Square (Wild Sunflower)", distance: "1.8 km", timeVi: "5 phút đi xe", timeEn: "5 min drive", type: "car" },
      { nameVi: "Thung lũng Tình Yêu", nameEn: "Valley of Love", distance: "5.0 km", timeVi: "12 phút đi xe", timeEn: "12 min drive", type: "car" },
    ],
  },

  "sen-viet-go-cong": {
    taglineVi: "Bản giao hưởng miệt vườn và sông nước Cửu Long thanh bình",
    taglineEn: "A serene symphony of Mekong Delta orchards and gentle waterways",
    storyVi:
      "Tọa lạc bên dòng sông Tiền êm đềm giữa những rặng dừa nước và miệt vườn trù phú của vùng đất Gò Công lịch sử, Sen Việt Gò Công là nơi quý khách tìm về sự an nhiên tuyệt đối. Hòa mình vào các tour du thuyền hoàng hôn, thưởng thức đờn ca tài tử Nam Bộ và tinh hoa ẩm thực đồng nội trứ danh.",
    storyEn:
      "Resting along the peaceful Tien River amidst lush water coconut groves and fruit-laden orchards in historic Go Cong, Sen Việt Go Cong invites you to slow down. Experience romantic sunset boat tours, traditional Don Ca Tai Tu folk music, and mouth-watering Mekong riverbank delicacies.",
    architectureVi: "Kiến trúc nhà rường Nam Bộ kết hợp hồ cảnh quan sinh thái và gỗ tự nhiên",
    architectureEn: "Southern timber estate architecture paired with ecological lotus waterways",
    signatureExperienceVi: "Du thuyền ngắm hoàng hôn sông Tiền và thưởng thức bánh xèo giòn rụm bên bờ sông",
    signatureExperienceEn: "Sunset riverboat cruise on the Tien River with authentic crispy Mekong pancakes",
    curatedGallery: [
      {
        url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1400&auto=format&fit=crop",
        captionVi: "Toàn cảnh khu nghỉ dưỡng sinh thái Sen Việt Gò Công",
        captionEn: "Ecological resort view of Sen Việt Go Cong",
        category: "architecture",
      },
      {
        url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Hồ bơi sinh thái hướng sông Tiền hiền hòa",
        captionEn: "Eco pool overlooking peaceful Tien River",
        category: "pool",
      },
      {
        url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Gian phòng nghỉ thoáng đãng hướng vườn dừa",
        captionEn: "Spacious suite opening to coconut gardens",
        category: "rooms",
      },
      {
        url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Nhà hàng ẩm thực đồng nội Nam Bộ",
        captionEn: "Mekong Delta Authentic Cuisine Pavilion",
        category: "dining",
      },
    ],
    nearbyLandmarks: [
      { nameVi: "Lăng Hoàng Gia Gò Công", nameEn: "Go Cong Royal Mausoleum", distance: "3.2 km", timeVi: "6 phút đi xe", timeEn: "6 min drive", type: "car" },
      { nameVi: "Chợ Gò Công truyền thống", nameEn: "Traditional Go Cong Market", distance: "1.8 km", timeVi: "4 phút đi xe", timeEn: "4 min drive", type: "car" },
      { nameVi: "Bãi biển phù sa Tân Thành & Cầu tàu", nameEn: "Tan Thanh Beach & Long Pier", distance: "12 km", timeVi: "18 phút đi xe", timeEn: "18 min drive", type: "car" },
      { nameVi: "Làng nghề tủ thờ Gò Công", nameEn: "Go Cong Master Woodcraft Village", distance: "4.5 km", timeVi: "8 phút đi xe", timeEn: "8 min drive", type: "car" },
    ],
  },

  "sen-viet-an-nhon": {
    taglineVi: "Hào khí Tây Sơn và tinh hoa tháp Chăm ngàn năm di sản",
    taglineEn: "The heroic martial spirit and thousand-year Cham heritage",
    storyVi:
      "Tọa lạc trên vùng đất địa linh nhân kiệt Bình Định, Sen Việt An Nhơn là điểm hẹn văn hóa tôn vinh hào khí Tây Sơn và di sản tháp Chăm cổ kính. Với khuôn viên hồ sen bát ngát, lớp học võ cổ truyền và các tour khám phá thành Đồ Bàn xưa, khách sạn mang lại chuyến đi sâu sắc và giàu trải nghiệm.",
    storyEn:
      "Situated in the legendary cradle of heroic Tay Son emperors and ancient Champa dynasties, Sen Việt An Nhon bridges culture and hospitality. Enjoy fragrant lotus pavilions, traditional Binh Dinh martial arts sessions, and curated expeditions to historic Do Ban Citadel.",
    architectureVi: "Đá sa thạch, gốm nung và họa tiết cánh sen Champa tinh xảo",
    architectureEn: "Sandstone carvings, terra-cotta earthenware and delicate lotus petal motifs",
    signatureExperienceVi: "Biểu diễn võ cổ truyền Bình Định và tiệc đặc sản chim mía, chả ram tôm đất",
    signatureExperienceEn: "Binh Dinh martial arts showcase and indigenous Central Vietnam gourmet banquet",
    curatedGallery: [
      {
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1400&auto=format&fit=crop",
        captionVi: "Khuôn viên kiến trúc sa thạch Sen Việt An Nhơn",
        captionEn: "Sandstone architectural grounds of Sen Việt An Nhon",
        category: "architecture",
      },
      {
        url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Hồ sen ngát hương giữa hoa viên tĩnh lặng",
        captionEn: "Aromatic lotus pond inside tranquil gardens",
        category: "wellness",
      },
      {
        url: "https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Phòng nghỉ nội thất gỗ quý và gốm Bình Định",
        captionEn: "Boutique suite adorned with local ceramics",
        category: "rooms",
      },
      {
        url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200&auto=format&fit=crop",
        captionVi: "Hồ bơi nhiệt đới xanh mát",
        captionEn: "Cool tropical oasis pool",
        category: "pool",
      },
    ],
    nearbyLandmarks: [
      { nameVi: "Tháp Cánh Tiên & Thành Đồ Bàn cổ", nameEn: "Canh Tien Tower & Ancient Do Ban Citadel", distance: "3.5 km", timeVi: "7 phút đi xe", timeEn: "7 min drive", type: "car" },
      { nameVi: "Bảo tàng Quang Trung", nameEn: "Quang Trung Emperor Museum", distance: "18 km", timeVi: "25 phút đi xe", timeEn: "25 min drive", type: "car" },
      { nameVi: "Tháp Bánh Ít tráng lệ", nameEn: "Banh It Cham Towers", distance: "11 km", timeVi: "15 phút đi xe", timeEn: "15 min drive", type: "car" },
      { nameVi: "Kỳ Co - Eo Gió Quy Nhơn", nameEn: "Ky Co - Eo Gio Coastal Wonder", distance: "28 km", timeVi: "35 phút đi xe", timeEn: "35 min drive", type: "car" },
      { nameVi: "Sân bay Phù Cát", nameEn: "Phu Cat Airport", distance: "12 km", timeVi: "15 phút đi xe", timeEn: "15 min drive", type: "car" },
    ],
  },
};

const defaultBranchConfig: BranchDetailConfig = {
  taglineVi: "Không gian nghỉ dưỡng 5 sao tiêu chuẩn quốc tế của Sen Việt",
  taglineEn: "World-class 5-star hospitality from Sen Việt Hotels & Resorts",
  storyVi:
    "Mang tinh thần hiếu khách chân thành của người Việt, khách sạn là chốn dừng chân hoàn hảo kết hợp dịch vụ cao cấp và nét đẹp văn hóa địa phương độc đáo.",
  storyEn:
    "Infused with genuine Vietnamese warmth, our hotel offers an extraordinary retreat uniting premier five-star luxury with authentic local heritage.",
  architectureVi: "Kiến trúc giao thoa phong cách Á Đông truyền thống và hiện đại",
  architectureEn: "Harmonious blend of traditional Asian finesse and modern luxury",
  signatureExperienceVi: "Dịch vụ trà chiều và ẩm thực đặc sản tinh hoa",
  signatureExperienceEn: "Signature afternoon tea and artisanal local gastronomy",
  curatedGallery: [
    {
      url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1400&auto=format&fit=crop",
      captionVi: "Mặt tiền khách sạn",
      captionEn: "Hotel facade",
      category: "architecture",
    },
    {
      url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
      captionVi: "Phòng nghỉ sang trọng",
      captionEn: "Luxury guest room",
      category: "rooms",
    },
    {
      url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200&auto=format&fit=crop",
      captionVi: "Hồ bơi vô cực",
      captionEn: "Infinity pool",
      category: "pool",
    },
    {
      url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
      captionVi: "Nhà hàng ẩm thực cao cấp",
      captionEn: "Fine dining restaurant",
      category: "dining",
    },
  ],
  nearbyLandmarks: [],
};

const today = new Date();
const dateValue = (date: Date) => toLocalDateStr(date);
const nextDay = new Date(today.getTime() + 86400000);

export default function HotelDetails() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const isEn = language === "en";
  const hotel = hotels.find((item) => item.slug === slug || String(item.id) === String(slug));

  // States
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [savedWishlist, setSavedWishlist] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedRoomModal, setSelectedRoomModal] = useState<RoomType | null>(null);

  // Reservation form states
  const [checkIn, setCheckIn] = useState(dateValue(today));
  const [checkOut, setCheckOut] = useState(dateValue(nextDay));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomsCount, setRoomsCount] = useState(1);
  const [promo, setPromo] = useState("");

  const [roomList, setRoomList] = useState<RoomType[]>(fallbackRooms);

  useEffect(() => {
    let isMounted = true;
    if (slug) {
      fetchRoomsByHotel(slug, checkIn, checkOut).then((rooms) => {
        if (isMounted && rooms && rooms.length > 0) {
          setRoomList(rooms);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [slug, checkIn, checkOut]);

  const [reviewSummary, setReviewSummary] = useState<HotelReviewSummary | null>(null);
  const [starFilter, setStarFilter] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const hotelId = (hotel as any)?.id || (slug ? hotelSlugToId[slug] : undefined) || 1;
    fetchHotelReviews(hotelId).then((res) => {
      if (isMounted && res) {
        setReviewSummary(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [slug, hotel]);

  const branchConfig = useMemo(() => {
    if (!slug) return defaultBranchConfig;
    return branchConfigs[slug] || defaultBranchConfig;
  }, [slug]);

  const allGalleryItems = useMemo(() => {
    const list = [...branchConfig.curatedGallery];
    if (hotel?.image && !list.some((item) => item.url === hotel.image)) {
      list.unshift({
        url: hotel.image,
        captionVi: `Toàn cảnh khách sạn ${hotel.name}`,
        captionEn: `Panoramic view of ${hotel.name}`,
        category: "architecture",
      });
    }
    return list;
  }, [branchConfig, hotel]);

  const filteredGallery = useMemo(() => {
    if (selectedGalleryCategory === "all") return allGalleryItems;
    return allGalleryItems.filter((item) => item.category === selectedGalleryCategory);
  }, [allGalleryItems, selectedGalleryCategory]);

  const sortedRooms = useMemo(() => [...roomList].sort((a, b) => a.price - b.price), [roomList]);

  const filteredReviews = useMemo(() => {
    if (!reviewSummary?.reviews) return [];
    if (starFilter === 0) return reviewSummary.reviews;
    return reviewSummary.reviews.filter((r) => r.rating === starFilter);
  }, [reviewSummary, starFilter]);

  // Handle keyboard shortcuts in lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredGallery.length - 1));
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < filteredGallery.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredGallery.length]);

  if (!hotel) {
    return (
      <main className="container flex min-h-[60vh] items-center justify-center py-16">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Sen Việt Hotels & Resorts</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-primary">
            {isEn ? "Hotel Not Found" : "Không tìm thấy khách sạn"}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {isEn
              ? "The hotel you are looking for does not exist or has been relocated."
              : "Địa chỉ bạn truy cập không còn tồn tại hoặc khách sạn chưa được cập nhật."}
          </p>
          <Link
            to="/hotels"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" /> {isEn ? "Browse all hotels" : "Xem danh sách khách sạn"}
          </Link>
        </div>
      </main>
    );
  }

  const bookingQuery = new URLSearchParams({
    checkIn,
    checkOut,
    adults: String(adults),
    children: String(children),
    rooms: String(roomsCount),
    promo,
  }).toString();
  const bookingHref = `/hotels/${hotel.slug}?${bookingQuery}`;
  const similarHotels = hotels.filter((item) => item.slug !== hotel.slug).slice(0, 3);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const faqs = [
    {
      qVi: "Giờ nhận phòng và trả phòng tiêu chuẩn là khi nào?",
      qEn: "What are the standard check-in and check-out times?",
      aVi: "Giờ nhận phòng tiêu chuẩn là từ 14:00 và giờ trả phòng là trước 12:00 trưa. Khách sạn hỗ trợ nhận phòng sớm hoặc trả phòng muộn tùy thuộc vào tình trạng phòng thực tế (có thể áp dụng phụ thu nhẹ).",
      aEn: "Standard check-in begins at 14:00 and check-out is prior to 12:00 noon. Early check-in or late check-out can be arranged subject to availability (nominal surcharges may apply).",
    },
    {
      qVi: "Khách sạn có dịch vụ đưa đón sân bay không?",
      qEn: "Does the hotel provide airport transfer services?",
      aVi: "Có, Sen Việt cung cấp dịch vụ xe Limousine riêng đưa đón từ sân bay quốc tế đến khách sạn với đội ngũ tài xế chuyên nghiệp. Quý khách có thể yêu cầu đặt dịch vụ trực tiếp khi hoàn tất đặt phòng hoặc liên hệ lễ tân trước 24 giờ.",
      aEn: "Yes, Sen Việt provides private luxury Limousine transfers with professional chauffeurs. You can reserve this service during booking or contact our 24/7 concierge at least 24 hours in advance.",
    },
    {
      qVi: "Chính sách hủy phòng và hoàn tiền của khách sạn như thế nào?",
      qEn: "What is the hotel cancellation and refund policy?",
      aVi: "Hầu hết các hạng phòng tại Sen Việt đều hỗ trợ hủy miễn phí và hoàn tiền 100% nếu quý khách thông báo trước 7 ngày so với ngày nhận phòng. Với các trường hợp hủy sát ngày, mức hoàn tiền sẽ được tính toán linh hoạt theo chính sách bảo lưu.",
      aEn: "Most reservations enjoy free cancellation with a 100% refund when cancelled at least 7 days before check-in. For late cancellations, flexible credit vouchers or partial refunds are provided under our guest assurance policy.",
    },
    {
      qVi: "Khách sạn có bãi đỗ xe ô tô và trạm sạc xe điện không?",
      qEn: "Does the hotel have parking and EV charging stations?",
      aVi: "Tất cả các chi nhánh Sen Việt đều có bãi đỗ xe ô tô tầng hầm an ninh 24/7 hoàn toàn miễn phí cho khách lưu trú, tích hợp trạm sạc điện EV chuẩn nhanh.",
      aEn: "All Sen Việt properties feature complimentary secure underground parking for registered guests, equipped with high-speed EV charging stations.",
    },
  ];

  return (
    <main className="container py-6 pb-20 md:py-10">
      {/* ====== Breadcrumb & Top Bar Navigation ====== */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="transition hover:text-primary">
            {isEn ? "Home" : "Trang chủ"}
          </Link>
          <span>/</span>
          <Link to="/hotels" className="transition hover:text-primary">
            {isEn ? "Hotels" : "Khách sạn"}
          </Link>
          <span>/</span>
          <span className="font-semibold text-primary">{hotel.name}</span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm transition hover:border-gold hover:text-gold"
            title={isEn ? "Share this hotel" : "Chia sẻ khách sạn"}
          >
            <Share2 className="h-3.5 w-3.5" />
            {copiedLink ? (isEn ? "Link copied!" : "Đã sao chép link!") : isEn ? "Share" : "Chia sẻ"}
          </button>

          <button
            type="button"
            onClick={() => setSavedWishlist(!savedWishlist)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition shadow-sm ${
              savedWishlist
                ? "border-rose-400 bg-rose-50 text-rose-600"
                : "border-border bg-white text-primary hover:border-rose-300 hover:text-rose-600"
            }`}
            title={isEn ? "Save to wishlist" : "Lưu vào danh sách yêu thích"}
          >
            <Heart className={`h-3.5 w-3.5 ${savedWishlist ? "fill-rose-500 text-rose-500" : ""}`} />
            {savedWishlist ? (isEn ? "Saved" : "Đã lưu") : isEn ? "Wishlist" : "Yêu thích"}
          </button>

          <a
            href="tel:18006888"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-3.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-secondary"
          >
            <Phone className="h-3.5 w-3.5 text-gold" />
            {isEn ? "Concierge Hotline: 1800 6888" : "Tổng đài: 1800 6888"}
          </a>
        </div>
      </div>

      {/* ====== Hotel Header: Title, Star Rating, Badges ====== */}
      <section className="mt-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            {isEn ? "Sen Việt Luxury Collection · 5-Star" : "Bộ sưu tập Sen Việt 5 Sao Quốc Tế"}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Award className="h-3.5 w-3.5 text-amber-600" />
            {isEn ? "TripAdvisor Travelers' Choice 2026 Winner" : "Top 1% Khách sạn xuất sắc 2026"}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            {isEn ? "Best Rate Guarantee" : "Cam kết giá trực tiếp tốt nhất"}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl lg:text-5xl">
            {hotel.name}
          </h1>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 fill-gold text-gold" />
              ))}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-primary">{hotel.rating}</span>
              <span className="text-xs font-medium text-muted-foreground">/ 5</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {isEn ? "Exceptional" : "Tuyệt hảo (98% hài lòng)"}
            </span>
          </div>
        </div>

        <p className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-gold" />
          <span>{formatHotelLocation(hotel)}</span>
          <span className="hidden sm:inline text-muted-foreground/60">•</span>
          <button
            type="button"
            onClick={() => {
              document.getElementById("location-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-xs font-semibold text-primary underline underline-offset-4 hover:text-gold"
          >
            {isEn ? "View on map & landmarks" : "Xem vị trí & điểm đến lân cận"}
          </button>
        </p>

        <p className="mt-2 text-sm italic text-gold font-medium">
          "{isEn ? branchConfig.taglineEn : branchConfig.taglineVi}"
        </p>
      </section>

      {/* ====== Luxury Photo Mosaic Grid & Interactive Lightbox ====== */}
      <section className="mt-6">
        <div className="relative grid grid-cols-1 gap-2.5 overflow-hidden rounded-3xl md:h-[480px] md:grid-cols-4 md:grid-rows-2">
          {/* Main feature hero image (spans 2 cols & 2 rows) */}
          <div
            onClick={() => setLightboxIndex(0)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl md:col-span-2 md:row-span-2"
          >
            <img
              src={allGalleryItems[0]?.url || hotel.image}
              alt={isEn ? allGalleryItems[0]?.captionEn : allGalleryItems[0]?.captionVi}
              className="h-[280px] w-full object-cover transition duration-700 ease-out group-hover:scale-105 md:h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition duration-300 group-hover:opacity-60" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="rounded-full bg-gold/90 px-3 py-1 text-xs font-bold text-primary shadow">
                {isEn ? "Featured View" : "Góc nhìn nổi bật"}
              </span>
              <p className="mt-2 font-display text-lg font-bold">
                {isEn ? allGalleryItems[0]?.captionEn : allGalleryItems[0]?.captionVi}
              </p>
            </div>
          </div>

          {/* 4 mosaic secondary photos */}
          {allGalleryItems.slice(1, 5).map((img, idx) => (
            <div
              key={img.url + idx}
              onClick={() => setLightboxIndex(idx + 1)}
              className="group relative hidden cursor-pointer overflow-hidden rounded-2xl md:block"
            >
              <img
                src={img.url}
                alt={isEn ? img.captionEn : img.captionVi}
                className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 transition duration-300 group-hover:opacity-100" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="line-clamp-1 text-xs font-semibold text-white drop-shadow">
                  {isEn ? img.captionEn : img.captionVi}
                </p>
              </div>
            </div>
          ))}

          {/* Floating 'View All Photos' Button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 text-xs font-bold text-primary shadow-xl backdrop-blur transition hover:bg-gold hover:text-primary-foreground"
          >
            <Maximize2 className="h-4 w-4" />
            {isEn ? `View all photos (${allGalleryItems.length})` : `Xem tất cả ${allGalleryItems.length} ảnh`}
          </button>
        </div>

        {/* Thumbnail quick preview on mobile */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {allGalleryItems.slice(0, 6).map((img, idx) => (
            <button
              key={img.url + idx}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-border"
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </section>

      {/* ====== Main Content Layout: Left 2/3 Content, Right 1/3 Sticky Booking ====== */}
      <section className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="space-y-12">
          {/* Part A: Story & Signature Experiences */}
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">
              {isEn ? "The Heritage Story" : "Câu chuyện di sản & kiến trúc"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary md:text-3xl">
              {isEn ? "An Elevated Sanctuary of Timeless Grace" : "Không gian nghỉ dưỡng hòa quyện nét di sản"}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {isEn ? branchConfig.storyEn : branchConfig.storyVi}
            </p>

            <div className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <Flower2 className="mt-1 h-6 w-6 shrink-0 text-gold" />
                <div>
                  <h4 className="font-semibold text-primary">
                    {isEn ? "Signature Sen Việt Lotus Touch" : "Dấu ấn hoa sen độc bản Sen Việt"}
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {isEn ? branchConfig.signatureExperienceEn : branchConfig.signatureExperienceVi}
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Pillars of Luxury */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:border-gold/50">
                <Building2 className="h-6 w-6 text-gold" />
                <h4 className="mt-3 font-display text-base font-bold text-primary">
                  {isEn ? "Architectural Masterpiece" : "Kiến trúc độc bản"}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {isEn ? branchConfig.architectureEn : branchConfig.architectureVi}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:border-gold/50">
                <Utensils className="h-6 w-6 text-gold" />
                <h4 className="mt-3 font-display text-base font-bold text-primary">
                  {isEn ? "Michelin-Inspired Dining" : "Ẩm thực thượng hạng"}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {isEn
                    ? "Bespoke culinary journey pairing native flavors with international haute cuisine."
                    : "Hành trình vị giác tinh tế kết hợp phong vị bản địa và kỹ nghệ ẩm thực đỉnh cao."}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:border-gold/50">
                <Waves className="h-6 w-6 text-gold" />
                <h4 className="mt-3 font-display text-base font-bold text-primary">
                  {isEn ? "Holistic Botanical Wellness" : "Hồ bơi vô cực & Thảo dược Spa"}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {isEn
                    ? "Rejuvenating therapies using natural lotus extracts, mineral waters, and Himalayan salt."
                    : "Thư giãn tuyệt đối với hồ bơi view toàn cảnh và liệu trình xông hơi thảo dược hoa sen."}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:border-gold/50">
                <Clock3 className="h-6 w-6 text-gold" />
                <h4 className="mt-3 font-display text-base font-bold text-primary">
                  {isEn ? "24/7 Bespoke Concierge" : "Quản gia & Dịch vụ 24/7"}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {isEn
                    ? "Seamless attention from Limousine transfers to private itinerary curations."
                    : "Chăm chút từng chi tiết từ đưa đón sân bay Limousine đến tour trải nghiệm cá nhân hóa."}
                </p>
              </div>
            </div>
          </section>

          {/* Part B: Categorized 5-Star Amenities */}
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">
                  {isEn ? "5-Star Standard Facilities" : "Tiện nghi 5 sao toàn diện"}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-primary md:text-3xl">
                  {isEn ? "Every Detail Crafted for Perfection" : "Tận hưởng đặc quyền lưu trú trọn vẹn"}
                </h2>
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {/* Category 1: Wellness */}
              <div className="rounded-2xl border border-border bg-white p-5">
                <div className="flex items-center gap-2.5 font-bold text-primary">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Waves className="h-4 w-4" />
                  </span>
                  <span>{isEn ? "Wellness & Relaxation" : "Nghỉ dưỡng & Sức khỏe"}</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "Panoramic Heated Infinity Pool" : "Hồ bơi vô cực nước ấm tầm nhìn panorama"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "Lotus Botanical Rejuvenation Spa" : "Lotus Spa & Liệu trình thảo mộc độc bản"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "Himalayan Salt Sauna & Herbal Steam" : "Xông hơi đá muối Himalaya & thảo dược"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "24/7 Technogym Fitness Center" : "Phòng tập Gym Technogym 24/7 view thoáng"}</span>
                  </li>
                </ul>
              </div>

              {/* Category 2: Dining */}
              <div className="rounded-2xl border border-border bg-white p-5">
                <div className="flex items-center gap-2.5 font-bold text-primary">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Utensils className="h-4 w-4" />
                  </span>
                  <span>{isEn ? "Dining & Sky Lounge" : "Ẩm thực & Thư giãn"}</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{isEn ? "Lotus Fine Dining Restaurant" : "Nhà hàng ẩm thực cao cấp Sen Việt"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{isEn ? "Sunset Rooftop Sky Bar & Lounge" : "Quầy Bar tầng thượng ngắm hoàng hôn"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{isEn ? "24/7 In-Room Gourmet Dining" : "Phục vụ ẩm thực tại phòng 24/24"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{isEn ? "Royal Afternoon Tea Ceremony" : "Nghi thức trà chiều cung đình thượng hạng"}</span>
                  </li>
                </ul>
              </div>

              {/* Category 3: Concierge & Privileges */}
              <div className="rounded-2xl border border-border bg-white p-5">
                <div className="flex items-center gap-2.5 font-bold text-primary">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Car className="h-4 w-4" />
                  </span>
                  <span>{isEn ? "VIP Services & Mobility" : "Dịch vụ & Tiện ích đặc quyền"}</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{isEn ? "Private Limousine Airport Chauffeur" : "Đưa đón sân bay bằng xe Limousine riêng"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{isEn ? "Secure Basement Parking with EV Chargers" : "Bãi đỗ xe hầm an ninh & trạm sạc xe điện EV"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{isEn ? "24/7 Multilingual Concierge Desk" : "Lễ tân đa ngôn ngữ & bảo vệ an ninh 24/7"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{isEn ? "Same-Day Express Laundry & Valet" : "Dịch vụ giặt ủi cao cấp lấy nhanh trong ngày"}</span>
                  </li>
                </ul>
              </div>

              {/* Category 4: Room Comforts */}
              <div className="rounded-2xl border border-border bg-white p-5">
                <div className="flex items-center gap-2.5 font-bold text-primary">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Wifi className="h-4 w-4" />
                  </span>
                  <span>{isEn ? "In-Suite Comfort & Tech" : "Tiện nghi phòng nghỉ thông minh"}</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                    <span>{isEn ? "Ultra-fast WiFi 6 Mesh Coverage" : "WiFi 6 tốc độ cao phủ sóng toàn khu"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                    <span>{isEn ? "55-65\" 4K Smart TV with Netflix" : "Smart TV 55-65 inch 4K giải trí đa kênh"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                    <span>{isEn ? "Deep Soaking Marble Tub & Rain Shower" : "Bồn tắm nằm ngâm mình view kính & vòi sen mưa"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                    <span>{isEn ? "Electronic Safe, Minibar & Coffee Machine" : "Két sắt an toàn điện tử & máy pha cà phê"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Part C: Rooms & Suites Showcase */}
          <section id="rooms" className="scroll-mt-8 space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">
                {isEn ? "Accommodation Collection" : "Bộ sưu tập phòng nghỉ"}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-primary md:text-3xl">
                {isEn ? "Select Your Luxurious Suite" : "Chọn không gian nghỉ dưỡng lý tưởng"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isEn
                  ? "Four bespoke room classes curated for discerning travelers. Direct bookings include complimentary high-speed WiFi and pool access."
                  : "Bốn hạng phòng đẳng cấp được bài trí tinh tế, tiện nghi 5 sao, mang đến giấc ngủ an lành tuyệt đối."}
              </p>
            </div>

            <div className="space-y-6">
              {sortedRooms.map((room) => (
                <article
                  key={room.id}
                  className="group overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition duration-300 hover:border-gold/50 hover:shadow-lg"
                >
                  <div className="grid md:grid-cols-[280px_minmax(0,1fr)_220px]">
                    {/* Room Image */}
                    <div className="relative h-60 w-full overflow-hidden md:h-full">
                      <img
                        src={room.image}
                        alt={room.nameVi}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 rounded-full bg-primary/90 px-3 py-1 text-[11px] font-bold text-primary-foreground backdrop-blur">
                        {room.size}
                      </div>
                      <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-primary shadow">
                        {room.bedsVi}
                      </div>
                    </div>

                    {/* Room Content */}
                    <div className="p-5 sm:p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gold">
                              {room.name}
                            </span>
                            <h3 className="font-display text-xl font-bold text-primary sm:text-2xl">
                              {isEn ? room.name : room.nameVi}
                            </h3>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {isEn ? "Free Cancellation" : "Hủy miễn phí trước 7 ngày"}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs text-muted-foreground">
                          <p className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span>
                              {isEn ? `Tower ${room.building} · Floor ${room.floor}` : `Tòa ${room.building} · Tầng ${room.floor}`}
                            </span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span>
                              {isEn
                                ? `${room.capacity.adults} Adults · ${room.capacity.children} Children`
                                : `${room.capacity.adults} Người lớn · ${room.capacity.children} Trẻ em`}
                            </span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <BedDouble className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span>{room.bedsVi}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Navigation className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span>{room.size}</span>
                          </p>
                        </div>

                        <p className="mt-3.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {room.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedRoomModal(room)}
                          className="text-xs font-semibold text-primary underline underline-offset-4 hover:text-gold"
                        >
                          {isEn ? "View room amenities & details" : "Xem tiện nghi & chi tiết phòng"}
                        </button>
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {isEn ? `Only ${room.inventory} rooms left` : `Còn ${room.inventory} phòng trống`}
                        </span>
                      </div>
                    </div>

                    {/* Room Price & Action */}
                    <div className="flex flex-col justify-between border-t border-border bg-secondary/30 p-5 md:border-t-0 md:border-l sm:p-6">
                      <div>
                        <p className="text-xs text-muted-foreground">{isEn ? "Starting from" : "Giá chỉ từ"}</p>
                        <p className="mt-1 font-display text-2xl font-bold text-primary">
                          {formatVnd(room.price)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{isEn ? "/ night · Tax included" : "/ đêm · Đã gồm thuế phí"}</p>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Link
                          to={`/hotels/${hotel.slug}?${new URLSearchParams({
                            checkIn,
                            checkOut,
                            adults: String(adults),
                            children: String(children),
                            rooms: "1",
                            room: room.id,
                          }).toString()}`}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow transition hover:bg-primary/90"
                        >
                          {isEn ? "Select Room" : "Chọn phòng này"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Part D: Curated Local Exploration & Nearby Landmarks */}
          <section id="location-section" className="scroll-mt-8 rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">
              {isEn ? "Neighborhood & Attractions" : "Điểm đến & Khám phá lân cận"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary md:text-3xl">
              {isEn ? `Explore ${hotel.city} & Landmarks` : `Khám phá các danh thắng quanh ${hotel.name}`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isEn
                ? "Ideally positioned near cultural treasures, shopping meccas, and transportation hubs."
                : "Vị trí đắc địa dễ dàng kết nối tới các biểu tượng văn hóa, trung tâm giải trí và sân bay."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {branchConfig.nearbyLandmarks.map((lm) => (
                <div
                  key={lm.nameVi}
                  className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 transition hover:border-gold/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {lm.type === "walk" ? <Users className="h-4 w-4" /> : <Car className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-primary">{isEn ? lm.nameEn : lm.nameVi}</p>
                      <p className="text-xs text-muted-foreground">{isEn ? lm.timeEn : lm.timeVi}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                    {lm.distance}
                  </span>
                </div>
              ))}
            </div>

            {/* Simulated Interactive Map Display */}
            <div className="relative mt-8 h-52 overflow-hidden rounded-2xl border border-primary/20 bg-[#16589a]">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(28deg, transparent 46%, #cfe5ff 47%, #cfe5ff 49%, transparent 50%), linear-gradient(112deg, transparent 43%, #cfe5ff 44%, #cfe5ff 46%, transparent 47%), linear-gradient(0deg, transparent 69%, #cfe5ff 70%, #cfe5ff 72%, transparent 73%)",
                  backgroundSize: "140px 110px, 180px 130px, 100% 80px",
                }}
              />
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                <div className="flex h-12 w-12 animate-bounce items-center justify-center rounded-full bg-gold text-primary shadow-xl">
                  <MapPin className="h-6 w-6 fill-primary" />
                </div>
                <span className="mt-2 rounded-full bg-primary/95 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur">
                  {hotel.name}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-primary shadow backdrop-blur">
                📍 {formatHotelLocation(hotel)}
              </div>
            </div>
          </section>

          {/* Part E: Hotel Policies & Interactive FAQs */}
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">
              {isEn ? "Guest Information" : "Chính sách lưu trú & Câu hỏi thường gặp"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary md:text-3xl">
              {isEn ? "Frequently Asked Questions" : "Mọi điều quý khách cần biết"}
            </h2>

            {/* Quick Policy Badges */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-white p-4">
                <Clock3 className="h-5 w-5 text-gold" />
                <p className="mt-2 text-xs text-muted-foreground">{isEn ? "Check-in / Check-out" : "Giờ nhận & trả phòng"}</p>
                <p className="mt-1 text-sm font-bold text-primary">{isEn ? "In: 14:00 · Out: 12:00" : "Nhận: 14:00 · Trả: 12:00"}</p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-4">
                <Users className="h-5 w-5 text-gold" />
                <p className="mt-2 text-xs text-muted-foreground">{isEn ? "Family & Children" : "Lưu trú gia đình"}</p>
                <p className="mt-1 text-sm font-bold text-primary">{isEn ? "Children welcome" : "Trẻ em luôn được chào đón"}</p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-4">
                <ShieldCheck className="h-5 w-5 text-gold" />
                <p className="mt-2 text-xs text-muted-foreground">{isEn ? "Cancellation" : "Chính sách hủy phòng"}</p>
                <p className="mt-1 text-sm font-bold text-primary">{isEn ? "Free before 7 days" : "Hủy miễn phí trước 7 ngày"}</p>
              </div>
            </div>

            {/* FAQ Accordion */}
            <div className="mt-6 space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={faq.qVi}
                    className="overflow-hidden rounded-2xl border border-border bg-white transition hover:border-gold/40"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-4 text-left font-semibold text-primary transition"
                    >
                      <span className="flex items-center gap-2.5 text-sm sm:text-base">
                        <HelpCircle className="h-4 w-4 text-gold shrink-0" />
                        {isEn ? faq.qEn : faq.qVi}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-gold shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="border-t border-border/50 bg-secondary/20 p-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {isEn ? faq.aEn : faq.aVi}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Part F: Verified Guest Reviews */}
          <section id="reviews" className="scroll-mt-8 rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">
              {isEn ? "Ratings & Feedback" : "Xếp hạng & Đánh giá"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary md:text-3xl">
              {isEn ? "Real Guest Experiences" : "Đánh giá chân thực từ khách hàng"}
            </h2>

            {reviewSummary && (
              <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
                {/* Left: Overall stats & score breakdown */}
                <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-5xl font-extrabold text-primary">
                      {reviewSummary.averageRating}
                    </span>
                    <div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s <= Math.round(reviewSummary.averageRating)
                                ? "fill-gold text-gold"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {isEn
                          ? `Based on ${reviewSummary.totalReviews} verified reviews`
                          : `Dựa trên ${reviewSummary.totalReviews} đánh giá đã xác thực`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 border-t border-border pt-5">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-primary">
                        <span>{isEn ? "Cleanliness & Sanitization" : "Vệ sinh & Sạch sẽ"}</span>
                        <span className="font-bold text-gold">{reviewSummary.avgCleanliness} / 5</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${(reviewSummary.avgCleanliness / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-primary">
                        <span>{isEn ? "Staff & Hospitality" : "Thái độ & Phục vụ"}</span>
                        <span className="font-bold text-gold">{reviewSummary.avgService} / 5</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${(reviewSummary.avgService / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-primary">
                        <span>{isEn ? "Room Facilities" : "Tiện nghi phòng nghỉ"}</span>
                        <span className="font-bold text-gold">{reviewSummary.avgFacilities} / 5</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${(reviewSummary.avgFacilities / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-primary">
                        <span>{isEn ? "Location & Scenery" : "Vị trí & Cảnh quan"}</span>
                        <span className="font-bold text-gold">{reviewSummary.avgLocation} / 5</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${(reviewSummary.avgLocation / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Star Filter */}
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {isEn ? "Filter by stars" : "Lọc theo số sao"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setStarFilter(0)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          starFilter === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-primary hover:bg-secondary/80"
                        }`}
                      >
                        {isEn ? "All" : "Tất cả"} ({reviewSummary.totalReviews})
                      </button>
                      {[5, 4, 3].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setStarFilter(star)}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                            starFilter === star
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-primary hover:bg-secondary/80"
                          }`}
                        >
                          {star} <Star className="h-3 w-3 fill-gold text-gold" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Reviews List */}
                <div className="space-y-4">
                  {filteredReviews.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                      {isEn ? "No reviews match this filter." : "Chưa có đánh giá nào cho mức lọc này."}
                    </div>
                  ) : (
                    filteredReviews.map((rev) => (
                      <article
                        key={rev.id}
                        className="rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:shadow-md"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-base font-bold text-primary">{rev.customerName}</h4>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                <ShieldCheck className="h-3 w-3" />
                                {isEn ? "Verified Stay" : "Đã xác thực kỳ nghỉ"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {rev.roomTypeName || "Phòng nghỉ Sen Việt"} · {rev.createdAt}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${
                                  s <= rev.rating ? "fill-gold text-gold" : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {rev.title && <h5 className="mt-3 font-semibold text-primary">{rev.title}</h5>}

                        {rev.comment && rev.comment.trim().length > 0 && (
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                            {rev.comment}
                          </p>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ====== Sticky Direct Booking Sidebar (Right 1/3 Column) ====== */}
        <aside className="rounded-3xl border border-primary/20 bg-white p-6 shadow-xl shadow-primary/10 lg:sticky lg:top-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-gold">
                {isEn ? "Direct Reservation" : "Đặt phòng trực tiếp"}
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold text-primary">
                {isEn ? "Book Your Stay" : "Khởi đầu kỳ nghỉ"}
              </h3>
            </div>
            <CalendarDays className="h-6 w-6 text-primary shrink-0" />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {isEn
              ? "Guaranteed best rates with Sen Việt. Complimentary high-speed WiFi & pool access."
              : "Giá trực tiếp tốt nhất từ Sen Việt, minh bạch và cam kết không phí ẩn."}
          </p>

          <div className="mt-5 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-primary">
                {isEn ? "Check-in Date" : "Ngày nhận phòng"}
              </label>
              <input
                type="date"
                min={dateValue(today)}
                value={checkIn}
                onChange={(event) => {
                  const next = event.target.value;
                  setCheckIn(next);
                  if (checkOut <= next) {
                    const following = new Date(`${next}T12:00:00`);
                    following.setDate(following.getDate() + 1);
                    setCheckOut(dateValue(following));
                  }
                }}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary">
                {isEn ? "Check-out Date" : "Ngày trả phòng"}
              </label>
              <input
                type="date"
                min={checkIn}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-primary">
                  {isEn ? "Adults" : "Người lớn"}
                </label>
                <select
                  value={adults}
                  onChange={(event) => setAdults(Number(event.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-2.5 py-2.5 text-xs font-medium outline-none focus:border-primary"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {isEn ? (n === 1 ? "adult" : "adults") : "người"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary">
                  {isEn ? "Children" : "Trẻ em"}
                </label>
                <select
                  value={children}
                  onChange={(event) => setChildren(Number(event.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-2.5 py-2.5 text-xs font-medium outline-none focus:border-primary"
                >
                  {[0, 1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n} {isEn ? (n === 1 ? "child" : "children") : "trẻ"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary">
                  {isEn ? "Rooms" : "Phòng"}
                </label>
                <select
                  value={roomsCount}
                  onChange={(event) => setRoomsCount(Number(event.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-2.5 py-2.5 text-xs font-medium outline-none focus:border-primary"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {isEn ? (n === 1 ? "room" : "rooms") : "phòng"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary">
                {isEn ? "Promo Code" : "Mã ưu đãi (nếu có)"}
              </label>
              <input
                value={promo}
                onChange={(event) => setPromo(event.target.value)}
                placeholder={isEn ? "e.g. SENVIET2026" : "Ví dụ: SENVIET2026"}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs font-medium uppercase outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">{isEn ? "Rates from" : "Giá chỉ từ"}</p>
                <p className="font-display text-2xl font-extrabold text-primary">
                  {formatVnd(sortedRooms[0]?.price || hotel.price)}
                </p>
                <p className="text-[11px] text-muted-foreground">{isEn ? "/ night · Tax included" : "/ đêm · Đã bao gồm thuế phí"}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                {isEn ? "Best Rate" : "Giá tốt nhất"}
              </span>
            </div>

            <Link
              to={bookingHref}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              {isEn ? "Check Availability" : "Kiểm tra phòng trống"}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => {
                document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-3 flex w-full items-center justify-center text-xs font-bold text-primary underline underline-offset-4 hover:text-gold"
            >
              {isEn ? "View all room classes" : "Xem tất cả hạng phòng"}
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2.5 text-xs font-bold text-primary">
              <Phone className="h-4 w-4 text-gold" />
              <span>{isEn ? "Need booking assistance?" : "Cần hỗ trợ đặt phòng?"}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isEn
                ? "Our reservation team is ready 24/7 to personalize your stay."
                : "Đội ngũ chăm sóc khách hàng Sen Việt luôn sẵn sàng tư vấn chu đáo."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <a
                href="tel:18006888"
                className="font-bold text-primary underline underline-offset-2 hover:text-gold"
              >
                📞 1800 6888
              </a>
              <span className="text-muted-foreground">•</span>
              <a
                href="mailto:hello@senviet.vn"
                className="font-bold text-primary underline underline-offset-2 hover:text-gold"
              >
                ✉️ hello@senviet.vn
              </a>
            </div>
          </div>
        </aside>
      </section>

      {/* ====== Similar Sister Hotels in the Collection ====== */}
      <section className="mt-20 border-t border-border pt-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">
            {isEn ? "More from Sen Việt" : "Bộ sưu tập điểm đến"}
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary md:text-3xl">
            {isEn ? "Discover Other Sen Việt Destinations" : "Khám phá thêm các khách sạn cùng hệ thống"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEn
              ? "Each destination brings an authentic, distinct perspective on Vietnam's natural beauty and hospitality."
              : "Mỗi khách sạn mang một sắc thái riêng của non nước Việt Nam, thống nhất bởi chuẩn mực phục vụ 5 sao."}
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {similarHotels.map((item) => (
            <HotelCard hotel={item} key={item.slug} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/hotels"
            className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-2.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            {isEn ? "Explore all 7 hotels" : "Xem toàn bộ 7 chi nhánh Sen Việt"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ====== Fullscreen Interactive Photo Lightbox Modal ====== */}
      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md text-white transition-opacity duration-300"
        >
          {/* Top Bar inside Lightbox */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-gold text-lg">{hotel.name}</span>
              <span className="text-xs text-white/60">
                {lightboxIndex + 1} / {filteredGallery.length}
              </span>
            </div>

            {/* Category Filter Tabs inside Lightbox */}
            <div className="hidden sm:flex items-center gap-1.5">
              {[
                { id: "all", labelVi: "Tất cả", labelEn: "All" },
                { id: "architecture", labelVi: "Kiến trúc", labelEn: "Architecture" },
                { id: "rooms", labelVi: "Phòng nghỉ", labelEn: "Rooms" },
                { id: "pool", labelVi: "Hồ bơi", labelEn: "Pool & Beach" },
                { id: "dining", labelVi: "Ẩm thực", labelEn: "Dining" },
                { id: "wellness", labelVi: "Spa", labelEn: "Wellness" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedGalleryCategory(tab.id);
                    setLightboxIndex(0);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    selectedGalleryCategory === tab.id
                      ? "bg-gold text-primary font-bold"
                      : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  {isEn ? tab.labelEn : tab.labelVi}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              title={isEn ? "Close (Esc)" : "Đóng (Esc)"}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Image Viewport */}
          <div className="relative flex flex-1 items-center justify-center p-4">
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : filteredGallery.length - 1
                )
              }
              className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-gold hover:text-primary"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="max-h-[75vh] max-w-5xl overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={filteredGallery[lightboxIndex]?.url}
                alt={
                  isEn
                    ? filteredGallery[lightboxIndex]?.captionEn
                    : filteredGallery[lightboxIndex]?.captionVi
                }
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev !== null && prev < filteredGallery.length - 1 ? prev + 1 : 0
                )
              }
              className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-gold hover:text-primary"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Bottom Caption & Thumbnail Strip */}
          <div className="border-t border-white/10 px-6 py-3">
            <p className="text-center text-sm font-semibold text-white drop-shadow">
              {isEn
                ? filteredGallery[lightboxIndex]?.captionEn
                : filteredGallery[lightboxIndex]?.captionVi}
            </p>

            <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
              {filteredGallery.map((img, idx) => (
                <button
                  key={img.url + idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg transition ${
                    lightboxIndex === idx
                      ? "ring-2 ring-gold scale-105"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====== Room Details Modal ====== */}
      {selectedRoomModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gold">
                  {selectedRoomModal.name}
                </span>
                <h3 className="font-display text-2xl font-bold text-primary">
                  {isEn ? selectedRoomModal.name : selectedRoomModal.nameVi}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoomModal(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary transition hover:bg-secondary/80"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl">
              <img
                src={selectedRoomModal.image}
                alt={selectedRoomModal.nameVi}
                className="h-64 w-full object-cover"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-secondary/40 p-4 text-xs font-medium text-primary sm:grid-cols-4">
              <div>
                <p className="text-[11px] text-muted-foreground">{isEn ? "Room Size" : "Diện tích"}</p>
                <p className="font-bold">{selectedRoomModal.size}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{isEn ? "Bed Configuration" : "Loại giường"}</p>
                <p className="font-bold">{selectedRoomModal.bedsVi}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{isEn ? "Max Capacity" : "Sức chứa"}</p>
                <p className="font-bold">
                  {selectedRoomModal.capacity.adults} {isEn ? "adults" : "người lớn"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{isEn ? "Location" : "Vị trí"}</p>
                <p className="font-bold">
                  {isEn
                    ? `Tower ${selectedRoomModal.building} · Fl ${selectedRoomModal.floor}`
                    : `Tòa ${selectedRoomModal.building} · Tầng ${selectedRoomModal.floor}`}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {selectedRoomModal.description}
            </p>

            <div className="mt-5 border-t border-border pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                {isEn ? "Included In-Room Amenities" : "Tiện nghi trang bị trong phòng"}
              </h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                {(selectedRoomModal.amenities || [
                  "Điều hòa không khí 2 chiều",
                  "WiFi 6 tốc độ cao miễn phí",
                  "Smart TV 55 inch 4K",
                  "Két an toàn điện tử",
                  "Tủ lạnh Minibar & Nước khoáng",
                  "Bồn tắm nằm & Vòi sen đứng",
                  "Áo choàng tắm sợi bông & Máy sấy tóc",
                  "Bộ ấm đun nước & Trà sen hảo hạng",
                ]).map((am, i) => (
                  <p key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-gold shrink-0" />
                    <span>{am}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
              <div>
                <p className="text-xs text-muted-foreground">{isEn ? "Rate per night" : "Giá phòng / đêm"}</p>
                <p className="font-display text-2xl font-bold text-primary">
                  {formatVnd(selectedRoomModal.price)}
                </p>
              </div>
              <Link
                to={`/hotels/${hotel.slug}?${new URLSearchParams({
                  checkIn,
                  checkOut,
                  adults: String(adults),
                  children: String(children),
                  rooms: "1",
                  room: selectedRoomModal.id,
                }).toString()}`}
                onClick={() => setSelectedRoomModal(null)}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow transition hover:bg-primary/90"
              >
                {isEn ? "Select This Room" : "Chọn phòng này ngay"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
