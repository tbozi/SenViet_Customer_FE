export interface ServiceCatalogItem {
  id: string;
  category: "restaurant" | "meeting" | "hotel";
  name: string;
  image: string;
  hours: string;
  detail: string;
  price: number;
  unit: string;
}

export const services: ServiceCatalogItem[] = [
  {
    id: "basil",
    category: "restaurant",
    name: "Basil",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?q=80&w=700&auto=format&fit=crop",
    hours: "10:00 đến 22:00",
    detail: "Ẩm thực địa phương và quốc tế",
    price: 350000,
    unit: "suất",
  },
  {
    id: "peppercorns",
    category: "restaurant",
    name: "Peppercorns",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=700&auto=format&fit=crop",
    hours: "10:00 đến 22:00",
    detail: "Nhà hàng phong cách gia đình",
    price: 450000,
    unit: "suất",
  },
  {
    id: "cilantro",
    category: "restaurant",
    name: "Cilantro",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828?q=80&w=700&auto=format&fit=crop",
    hours: "06:00 đến 22:00",
    detail: "Buffet sáng và quầy bar",
    price: 250000,
    unit: "người",
  },
  {
    id: "daffodil",
    category: "meeting",
    name: "Daffodil",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=700&auto=format&fit=crop",
    hours: "Tầng 4",
    detail: "Không gian hội nghị linh hoạt",
    price: 1800000,
    unit: "buổi",
  },
  {
    id: "lavender",
    category: "meeting",
    name: "Lavender",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=700&auto=format&fit=crop",
    hours: "Tầng 4",
    detail: "Phòng họp riêng cao cấp",
    price: 2500000,
    unit: "buổi",
  },
  {
    id: "grand-hall",
    category: "meeting",
    name: "Grand Hall",
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=700&auto=format&fit=crop",
    hours: "Tầng 2",
    detail: "Tiệc cưới và sự kiện",
    price: 5000000,
    unit: "buổi",
  },
  {
    id: "spa",
    category: "hotel",
    name: "Savanna Spa & Massage",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=700&auto=format&fit=crop",
    hours: "10:00 - 24:00",
    detail: "Trị liệu thư giãn",
    price: 600000,
    unit: "lượt",
  },
  {
    id: "fitness",
    category: "hotel",
    name: "Fitness Center",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=700&auto=format&fit=crop",
    hours: "10:00 - 22:00",
    detail: "Phòng tập hiện đại",
    price: 150000,
    unit: "người",
  },
  {
    id: "concierge",
    category: "hotel",
    name: "Dịch vụ concierge",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=700&auto=format&fit=crop",
    hours: "06:00 - 22:00",
    detail: "Hỗ trợ concierge 24/7",
    price: 300000,
    unit: "yêu cầu",
  },
];

export const serviceTabs = [
  ["restaurant", "Nhà hàng & Bar"],
  ["meeting", "Phòng họp & Hội nghị"],
  ["hotel", "Dịch vụ khách sạn"],
] as const;
