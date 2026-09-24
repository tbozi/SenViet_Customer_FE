import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type Language = "vi" | "en" | "zh" | "ko" | "ja";

export interface LanguageMeta {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: "vi", name: "Tiếng Việt", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
];

const dictionaries = {
  vi: {
    nav: {
      home: "Trang chủ",
      hotels: "Khách sạn",
      offers: "Ưu đãi",
      services: "Dịch vụ",
      about: "Về chúng tôi",
      contact: "Liên hệ",
      admin: "Quản lý chuỗi",
      login: "Đăng nhập",
      register: "Đăng ký",
      profile: "Hồ sơ cá nhân",
      account: "Tài khoản của tôi",
      loyalty: "Loyalty",
      myBookings: "Đặt phòng của tôi",
      logout: "Đăng xuất",
    },
    hero: {
      badge: "Chuỗi khách sạn hàng đầu Việt Nam",
      title: "Sen Việt Hotels & Resorts",
      subtitle:
        "6 khách sạn trải dài từ Bắc chí Nam, cùng trợ lý AI tư vấn đặt phòng và chăm sóc khách hàng 24/7.",
      ctaPrimary: "Khám phá khách sạn",
      ctaSecondary: "Đặt phòng ngay",
      statHotels: "khách sạn",
      statProvinces: "tỉnh thành",
      statSupport: "hỗ trợ AI",
      statGuests: "khách hàng hài lòng",
    },
    hotels: {
      sectionTitle: "Hệ thống khách sạn Sen Việt",
      sectionSubtitle:
        "Từ miền sông nước Tiền Giang đến phố biển Bình Định, mỗi khách sạn mang một dấu ấn riêng.",
      viewAll: "Xem tất cả khách sạn",
      viewDetail: "Xem chi tiết",
      book: "Đặt phòng",
      from: "Chỉ từ",
      night: "/đêm",
      filterAll: "Tất cả",
      filterNorth: "Miền Bắc",
      filterCentral: "Miền Trung",
      filterSouth: "Miền Nam",
      pageTitle: "Khách sạn của chúng tôi",
      pageSubtitle:
        "6 điểm dừng chân sang trọng, rải khắp Việt Nam, sẵn sàng đón bạn.",
      regionsTitle: "Khám phá theo khu vực",
      searchLocation: "Địa điểm",
      searchCheckIn: "Ngày nhận",
      searchCheckOut: "Ngày trả",
      searchRooms: "Số phòng",
      searchPromo: "Mã khuyến mãi",
      searchButton: "Tìm phòng",
      statHotels: "khách sạn",
      roomLabel: "phòng",
    },
    ai: {
      badge: "Trợ lý AI thông minh",
      title: "AI Agent luôn sẵn sàng tư vấn cho bạn",
      subtitle:
        "Từ gợi ý phòng phù hợp đến hỗ trợ sau khi đặt phòng, trợ lý AI của Sen Việt đồng hành cùng bạn mọi lúc.",
      point1Title: "Tư vấn đặt phòng thông minh",
      point1Desc: "Gợi ý khách sạn và loại phòng phù hợp với nhu cầu, ngân sách.",
      point2Title: "Hỗ trợ 24/7",
      point2Desc: "Trả lời mọi thắc mắc về đặt phòng, chính sách, ưu đãi bất kỳ lúc nào.",
      point3Title: "Chăm sóc sau đặt phòng",
      point3Desc: "Nhắc lịch, hỗ trợ đổi/huỷ và giải đáp khi lưu trú.",
      cta: "Trò chuyện với trợ lý AI",
      widgetTitle: "Trợ lý AI Sen Việt",
      widgetGreeting:
        "Xin chào! Tôi là Trợ lý AI Sen Việt. Tôi có thể tư vấn phòng, gợi ý giá tốt và hỗ trợ bạn bằng nhiều ngôn ngữ. Bạn cần giúp gì hôm nay?",
      placeholder: "Nhập câu hỏi của bạn bằng bất kỳ ngôn ngữ nào...",
      quickBook: "Tôi muốn đặt phòng",
      quickOffer: "Ưu đãi hiện có",
      quickLocation: "Vị trí các chi nhánh",
      quickSupport: "Chính sách nhận & trả phòng",
      genericReply:
        "Cảm ơn bạn đã liên hệ Sen Việt Hotels! Tôi luôn sẵn sàng hỗ trợ tư vấn đặt phòng, giá phòng và các tiện ích theo yêu cầu của bạn.",
    },
    cta: {
      title: "Chủ động đăng ký để nhận ưu đãi riêng",
      subtitle: "Thành viên Sen Việt nhận ưu đãi giá phòng và tích điểm mỗi lần lưu trú.",
      button: "Đăng ký ngay",
    },
    testimonials: {
      title: "Khách hàng nói gì về chúng tôi",
    },
    footer: {
      tagline: "Chuỗi khách sạn Việt, chăm sóc bằng công nghệ AI.",
      explore: "Khám phá",
      company: "Công ty",
      contact: "Liên hệ",
      rights: "Đã đăng ký bản quyền.",
    },
    auth: {
      loginTitle: "Đăng nhập tài khoản",
      loginSubtitle: "Chào mừng quay lại Sen Việt Hotels.",
      registerTitle: "Tạo tài khoản mới",
      registerSubtitle: "Đăng ký để đặt phòng và nhận ưu đãi thành viên.",
      name: "Họ và tên",
      cccd: "Số CCCD",
      email: "Email",
      password: "Mật khẩu",
      confirmPassword: "Xác nhận mật khẩu",
      loginButton: "Đăng nhập",
      registerButton: "Đăng ký",
      noAccount: "Chưa có tài khoản?",
      hasAccount: "Đã có tài khoản?",
      registerLink: "Đăng ký ngay",
      loginLink: "Đăng nhập",
      requireLoginTitle: "Vui lòng đăng nhập để đặt phòng",
      requireLoginDesc: "Bạn cần đăng nhập hoặc tạo tài khoản trước khi hoàn tất đặt phòng.",
    },
    profile: {
      title: "Hồ sơ cá nhân",
      personalInfo: "Thông tin cá nhân",
      bookingHistory: "Lịch sử đặt phòng",
      noBookings: "Bạn chưa có đặt phòng nào.",
      bookNow: "Đặt phòng ngay",
      save: "Lưu thay đổi",
      phone: "Số điện thoại",
    },
    placeholder: {
      title: "Trang đang được xây dựng",
      desc: "Nội dung chi tiết cho trang này sẽ sớm được hoàn thiện. Hãy tiếp tục yêu cầu để bổ sung nội dung.",
      back: "Về trang chủ",
    },
    common: {
      language: "Ngôn ngữ",
      theme: "Giao diện",
      lightMode: "Chế độ sáng",
      darkMode: "Chế độ tối",
    },
  },
  en: {
    nav: {
      home: "Home",
      hotels: "Hotels",
      offers: "Offers",
      services: "Services",
      about: "About",
      contact: "Contact",
      admin: "Chain Management",
      login: "Log in",
      register: "Sign up",
      profile: "Profile",
      account: "My account",
      loyalty: "Loyalty",
      myBookings: "My bookings",
      logout: "Log out",
    },
    hero: {
      badge: "Vietnam's leading luxury hotel chain",
      title: "Sen Việt Hotels & Resorts",
      subtitle:
        "6 boutique hotels spanning the country, backed by an AI agent for booking advice and 24/7 customer care.",
      ctaPrimary: "Explore hotels",
      ctaSecondary: "Book now",
      statHotels: "hotels",
      statProvinces: "provinces",
      statSupport: "AI support",
      statGuests: "happy guests",
    },
    hotels: {
      sectionTitle: "Sen Việt Hotel Collection",
      sectionSubtitle:
        "From the waterways of Tiền Giang to the coastal streets of Bình Định, each hotel carries its own soul.",
      viewAll: "View all hotels",
      viewDetail: "View details",
      book: "Book room",
      from: "From",
      night: "/night",
      filterAll: "All",
      filterNorth: "Northern",
      filterCentral: "Central",
      filterSouth: "Southern",
      pageTitle: "Our Hotels",
      pageSubtitle:
        "6 luxury destinations across Vietnam, ready to welcome you.",
      regionsTitle: "Explore by region",
      searchLocation: "Destination",
      searchCheckIn: "Check-in",
      searchCheckOut: "Check-out",
      searchRooms: "Rooms",
      searchPromo: "Promo code",
      searchButton: "Search rooms",
      statHotels: "hotels",
      roomLabel: "rooms",
    },
    ai: {
      badge: "Intelligent AI Assistant",
      title: "Your 24/7 AI Concierge",
      subtitle:
        "From bespoke room recommendations to post-booking care, Sen Việt's AI companion is with you at every step.",
      point1Title: "Smart booking advice",
      point1Desc: "Find hotels and rooms tailored to your preferences and budget.",
      point2Title: "24/7 instant support",
      point2Desc: "Instant answers for room details, policies, and offers whenever you need.",
      point3Title: "Post-booking care",
      point3Desc: "Stay reminders, modification assistance, and in-stay support.",
      cta: "Chat with AI Assistant",
      widgetTitle: "Sen Việt AI Concierge",
      widgetGreeting:
        "Hello! I am Sen Việt AI Concierge. I can assist you with hotel details, room bookings, and special offers in multiple languages. How may I help you today?",
      placeholder: "Type your question in any language...",
      quickBook: "Book a room",
      quickOffer: "Current promotions",
      quickLocation: "Hotel locations",
      quickSupport: "Check-in & policies",
      genericReply:
        "Thank you for contacting Sen Việt Hotels! I am here to help you find the best rooms, rates, and amenities across all our branches.",
    },
    cta: {
      title: "Sign up for exclusive member perks",
      subtitle: "Sen Việt members unlock preferential rates and points with every stay.",
      button: "Sign up now",
    },
    testimonials: {
      title: "What our guests say",
    },
    footer: {
      tagline: "Authentic Vietnamese hospitality, powered by AI concierge technology.",
      explore: "Explore",
      company: "Company",
      contact: "Contact",
      rights: "All rights reserved.",
    },
    auth: {
      loginTitle: "Log in to your account",
      loginSubtitle: "Welcome back to Sen Việt Hotels.",
      registerTitle: "Create your account",
      registerSubtitle: "Join to book rooms and enjoy member privileges.",
      name: "Full name",
      cccd: "Citizen ID",
      email: "Email address",
      password: "Password",
      confirmPassword: "Confirm password",
      loginButton: "Log in",
      registerButton: "Create account",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      registerLink: "Sign up",
      loginLink: "Log in",
      requireLoginTitle: "Please log in to book",
      requireLoginDesc: "You need to log in or create an account before completing your booking.",
    },
    profile: {
      title: "Profile",
      personalInfo: "Personal information",
      bookingHistory: "Booking history",
      noBookings: "You have no bookings yet.",
      bookNow: "Book now",
      save: "Save changes",
      phone: "Phone number",
    },
    placeholder: {
      title: "Page under construction",
      desc: "Detailed content for this page is coming soon. Keep prompting to fill it in.",
      back: "Back to home",
    },
    common: {
      language: "Language",
      theme: "Theme",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
    },
  },
  zh: {
    nav: {
      home: "首页",
      hotels: "酒店列表",
      offers: "特别优惠",
      services: "酒店服务",
      about: "关于我们",
      contact: "联系我们",
      admin: "连锁管理",
      login: "登录",
      register: "注册",
      profile: "个人资料",
      account: "我的账户",
      loyalty: "会员忠诚计划",
      myBookings: "我的预订",
      logout: "退出登录",
    },
    hero: {
      badge: "越南领先的豪华度假酒店",
      title: "莲越酒店与度假村",
      subtitle:
        "遍布越南各地的6家豪华酒店，由24/7全天候AI助手提供预订建议与客房关怀。",
      ctaPrimary: "探索酒店",
      ctaSecondary: "立即预订",
      statHotels: "家酒店",
      statProvinces: "个省市",
      statSupport: "全天候AI支持",
      statGuests: "满意客户",
    },
    hotels: {
      sectionTitle: "莲越酒店连锁网络",
      sectionSubtitle:
        "从前江水乡到平定海滨，每家酒店都拥有独特的东方风韵与奢华体验。",
      viewAll: "查看全部酒店",
      viewDetail: "查看详情",
      book: "预订客房",
      from: "起价仅",
      night: "/晚",
      filterAll: "全部",
      filterNorth: "北部",
      filterCentral: "中部",
      filterSouth: "南部",
      pageTitle: "我们的酒店",
      pageSubtitle:
        "遍布越南各地的6处尊贵落脚点，随时恭候您的光临。",
      regionsTitle: "按区域探索",
      searchLocation: "目的地",
      searchCheckIn: "入住日期",
      searchCheckOut: "退房日期",
      searchRooms: "客房数量",
      searchPromo: "优惠代码",
      searchButton: "查找客房",
      statHotels: "家酒店",
      roomLabel: "间客房",
    },
    ai: {
      badge: "智能AI助手",
      title: "AI智能顾问时刻为您服务",
      subtitle:
        "从房型推荐到入住后的贴心支持，莲越AI助手随时伴您左右。",
      point1Title: "智能客房咨询",
      point1Desc: "根据您的需求和预算推荐最合适的酒店和房型。",
      point2Title: "24/7全天候响应",
      point2Desc: "随时解答有关预订、政策和专属优惠的任何疑问。",
      point3Title: "贴心入住关怀",
      point3Desc: "行程提醒、变更退改支持及入住期间的贴心协助。",
      cta: "与AI助手对话",
      widgetTitle: "莲越AI智能助手",
      widgetGreeting:
        "您好！我是莲越AI智能顾问。我精通多国语言，可以为您查询房态、推荐房型并解答酒店政策。请问今天有什么可以帮您？",
      placeholder: "请输入您的问题（支持任何语言）...",
      quickBook: "我想预订客房",
      quickOffer: "查看当前优惠",
      quickLocation: "酒店分布位置",
      quickSupport: "入住与退房时间",
      genericReply:
        "感谢您的咨询！我是莲越AI智能助手，随时为您解答关于客房、价格及预订政策的问题。",
    },
    cta: {
      title: "注册会员尊享专属礼遇",
      subtitle: "莲越会员每次入住均可享受会员专享价与积分累积。",
      button: "立即注册",
    },
    testimonials: {
      title: "客人对我们的评价",
    },
    footer: {
      tagline: "地道越南待客之道，结合前沿AI智能关怀。",
      explore: "探索",
      company: "公司",
      contact: "联系",
      rights: "版权所有。",
    },
    auth: {
      loginTitle: "登录账户",
      loginSubtitle: "欢迎回到莲越酒店。",
      registerTitle: "创建新账户",
      registerSubtitle: "注册会员尊享预订特权与积分奖励。",
      name: "姓名",
      cccd: "身份证/护照号",
      email: "电子邮箱",
      password: "密码",
      confirmPassword: "确认密码",
      loginButton: "立即登录",
      registerButton: "立即注册",
      noAccount: "还没有账户？",
      hasAccount: "已有账户？",
      registerLink: "立即注册",
      loginLink: "立即登录",
      requireLoginTitle: "请先登录以完成预订",
      requireLoginDesc: "在完成客房预订前，您需要登录或注册账户。",
    },
    profile: {
      title: "个人资料",
      personalInfo: "基本信息",
      bookingHistory: "预订历史",
      noBookings: "暂无预订记录。",
      bookNow: "立即预订",
      save: "保存更改",
      phone: "联系电话",
    },
    placeholder: {
      title: "页面建设中",
      desc: "该页面的详细内容即将上线，敬请期待。",
      back: "返回首页",
    },
    common: {
      language: "语言",
      theme: "外观主题",
      lightMode: "明亮模式",
      darkMode: "深色模式",
    },
  },
  ko: {
    nav: {
      home: "홈",
      hotels: "호텔",
      offers: "프로모션",
      services: "서비스",
      about: "소개",
      contact: "고객센터",
      admin: "체인 관리",
      login: "로그인",
      register: "회원가입",
      profile: "내 프로필",
      account: "내 계정",
      loyalty: "멤버십",
      myBookings: "내 예약",
      logout: "로그아웃",
    },
    hero: {
      badge: "베트남 최고의 럭셔리 호텔 체인",
      title: "센비엣 호텔 & 리조트",
      subtitle:
        "전국 6개 지점의 프리미엄 호텔, 24/7 AI 컨시어지가 완벽한 객실 추천과 예약 케어를 제공합니다.",
      ctaPrimary: "호텔 둘러보기",
      ctaSecondary: "지금 예약하기",
      statHotels: "개 호텔",
      statProvinces: "개 도시",
      statSupport: "AI 24시간 지원",
      statGuests: "만족 고객",
    },
    hotels: {
      sectionTitle: "센비엣 호텔 컬렉션",
      sectionSubtitle:
        "티엔장 수상 지역부터 빈딘의 해변까지, 각 지점마다 특별한 휴식과 감동을 선사합니다.",
      viewAll: "모든 호텔 보기",
      viewDetail: "상세보기",
      book: "객실 예약",
      from: "최저가",
      night: "/박",
      filterAll: "전체",
      filterNorth: "북부",
      filterCentral: "중부",
      filterSouth: "남부",
      pageTitle: "호텔 목록",
      pageSubtitle:
        "베트남 전역의 6개 럭셔리 휴양지가 여러분을 기다립니다.",
      regionsTitle: "지역별 탐색",
      searchLocation: "여행지",
      searchCheckIn: "체크인",
      searchCheckOut: "체크아웃",
      searchRooms: "객실 수",
      searchPromo: "할인 코드",
      searchButton: "객실 검색",
      statHotels: "개 호텔",
      roomLabel: "개 객실",
    },
    ai: {
      badge: "스마트 AI 컨시어지",
      title: "언제나 준비된 24/7 AI 어시스턴트",
      subtitle:
        "맞춤 객실 추천부터 체크아웃까지, 센비엣 AI가 전 과정을 함께합니다.",
      point1Title: "스마트 예약 상담",
      point1Desc: "고객님의 예산과 일정에 최적화된 호텔과 객실을 제안합니다.",
      point2Title: "24/7 실시간 응대",
      point2Desc: "객실 정보, 프로모션 및 호텔 정책에 대해 언제든 문의하세요.",
      point3Title: "예약 후 맞춤 케어",
      point3Desc: "체크인 알림, 일정 변경 및 투숙 중 필요한 지원을 제공합니다.",
      cta: "AI 컨시어지와 대화하기",
      widgetTitle: "센비엣 AI 컨시어지",
      widgetGreeting:
        "안녕하세요! 센비엣 AI 컨시어지입니다. 다국어 객실 추천 및 호텔 안내를 도와드립니다. 무엇을 도와드릴까요?",
      placeholder: "한국어 또는 편한 언어로 질문을 입력하세요...",
      quickBook: "객실 예약하고 싶어요",
      quickOffer: "진행 중인 할인 혜택",
      quickLocation: "호텔 지점 위치 안내",
      quickSupport: "체크인 / 체크아웃 규정",
      genericReply:
        "센비엣 호텔에 문의해 주셔서 감사합니다! 전 지점 객실 예약 및 부대시설 정보를 친절히 안내해 드리겠습니다.",
    },
    cta: {
      title: "회원 가입하고 전용 혜택을 누리세요",
      subtitle: "센비엣 회원은 투숙 시마다 전용 할인율과 포인트 적립 혜택을 받습니다.",
      button: "지금 가입하기",
    },
    testimonials: {
      title: "고객 투숙 후기",
    },
    footer: {
      tagline: "베트남 정통 환대 문화와 스마트 AI 테크놀로지의 만남.",
      explore: "둘러보기",
      company: "회사 소개",
      contact: "문의하기",
      rights: "All rights reserved.",
    },
    auth: {
      loginTitle: "계정 로그인",
      loginSubtitle: "센비엣 호텔에 다시 오신 것을 환영합니다.",
      registerTitle: "새 계정 만들기",
      registerSubtitle: "회원가입 후 특별 혜택으로 예약하세요.",
      name: "이름",
      cccd: "신분증 / 여권 번호",
      email: "이메일 주소",
      password: "비밀번호",
      confirmPassword: "비밀번호 확인",
      loginButton: "로그인",
      registerButton: "회원가입",
      noAccount: "아직 계정이 없으신가요?",
      hasAccount: "이미 계정이 있으신가요?",
      registerLink: "회원가입하기",
      loginLink: "로그인하기",
      requireLoginTitle: "예약을 위해 로그인이 필요합니다",
      requireLoginDesc: "객실 예약 완료 전 로그인 또는 회원가입을 진행해 주세요.",
    },
    profile: {
      title: "내 프로필",
      personalInfo: "기본 정보",
      bookingHistory: "예약 내역",
      noBookings: "진행 중인 예약이 없습니다.",
      bookNow: "지금 예약하기",
      save: "변경사항 저장",
      phone: "전화번호",
    },
    placeholder: {
      title: "준비 중인 페이지입니다",
      desc: "곧 더 많은 정보가 업데이트될 예정입니다.",
      back: "홈으로 돌아가기",
    },
    common: {
      language: "언어",
      theme: "화면 모드",
      lightMode: "라이트 모드",
      darkMode: "다크 모드",
    },
  },
  ja: {
    nav: {
      home: "ホーム",
      hotels: "ホテル一覧",
      offers: "特別優待",
      services: "館内サービス",
      about: "ホテルについて",
      contact: "お問い合わせ",
      admin: "チェーン管理",
      login: "ログイン",
      register: "会員登録",
      profile: "プロフィール",
      account: "マイアカウント",
      loyalty: "会員特典",
      myBookings: "予約履歴",
      logout: "ログアウト",
    },
    hero: {
      badge: "ベトナムを代表する高級ホテルチェーン",
      title: "セン・ヴィエット・ホテル＆リゾート",
      subtitle:
        "ベトナム全土6つの拠点。24時間対応のAIコンシェルジュが快適なご宿泊をご案内いたします。",
      ctaPrimary: "ホテルを見る",
      ctaSecondary: "今すぐ予約",
      statHotels: "ホテル",
      statProvinces: "都市",
      statSupport: "24時間AIサポート",
      statGuests: "ご満足いただいたお客様",
    },
    hotels: {
      sectionTitle: "セン・ヴィエット・コレクション",
      sectionSubtitle:
        "メコンの美しい水郷からビンディンの海岸沿いまで、唯一無二の洗練されたおもてなしをお届けします。",
      viewAll: "すべてのホテルを見る",
      viewDetail: "詳細を見る",
      book: "お部屋を予約",
      from: "1泊あたり",
      night: "/泊",
      filterAll: "すべて",
      filterNorth: "北部",
      filterCentral: "中部",
      filterSouth: "南部",
      pageTitle: "ホテル一覧",
      pageSubtitle:
        "ベトナム各地の6つの優雅な滞在先が、皆様のお越しを心よりお待ちしております。",
      regionsTitle: "エリアから探す",
      searchLocation: "目的地",
      searchCheckIn: "チェックイン",
      searchCheckOut: "チェックアウト",
      searchRooms: "部屋数",
      searchPromo: "割引コード",
      searchButton: "空室を検索",
      statHotels: "軒のホテル",
      roomLabel: "室",
    },
    ai: {
      badge: "スマートAIコンシェルジュ",
      title: "24時間いつでも寄り添うAIアシスタント",
      subtitle:
        "お部屋のご提案からチェックアウト後のサポートまで、多言語でいつでもお手伝いします。",
      point1Title: "スマート宿泊相談",
      point1Desc: "ご予算や旅のスタイルに最適なホテルとお部屋をご案内します。",
      point2Title: "24時間いつでも即答",
      point2Desc: "客室設備、限定プラン、宿泊規定についていつでもお尋ねください。",
      point3Title: "安心のアフターサポート",
      point3Desc: "日程リマインド、変更キャンセル、滞在中のご相談をサポートします。",
      cta: "AIコンシェルジュと話す",
      widgetTitle: "セン・ヴィエットAIコンシェルジュ",
      widgetGreeting:
        "こんにちは！セン・ヴィエットAIコンシェルジュです。空室検索や宿泊プランのご相談など、日本語をはじめ多言語でお応えします。何かお手伝いできることはございますか？",
      placeholder: "日本語またはお好みの言語でご質問ください...",
      quickBook: "客室を予約したい",
      quickOffer: "利用可能な限定割引",
      quickLocation: "ホテルの所在地一覧",
      quickSupport: "チェックイン・アウト時間",
      genericReply:
        "お問い合わせいただきありがとうございます！セン・ヴィエット各ホテルの宿泊プランやサービスをご案内いたします。",
    },
    cta: {
      title: "会員登録で特別優待をお届け",
      subtitle: "会員限定の特別レートや宿泊ごとのポイント獲得をご利用いただけます。",
      button: "今すぐ無料会員登録",
    },
    testimonials: {
      title: "お客様からの声",
    },
    footer: {
      tagline: "ベトナムの温かいおもてなしと最新AIテクノロジーの融合。",
      explore: "探検する",
      company: "会社情報",
      contact: "お問い合わせ",
      rights: "無断転載を禁じます。",
    },
    auth: {
      loginTitle: "アカウントログイン",
      loginSubtitle: "セン・ヴィエット・ホテルズへのお帰りをお待ちしておりました。",
      registerTitle: "新規アカウント作成",
      registerSubtitle: "会員登録をして限定優待でスマートにご予約ください。",
      name: "氏名",
      cccd: "身分証明書 / パスポート番号",
      email: "メールアドレス",
      password: "パスワード",
      confirmPassword: "パスワード確認",
      loginButton: "ログイン",
      registerButton: "アカウント作成",
      noAccount: "アカウントをお持ちでないですか？",
      hasAccount: "すでにアカウントをお持ちですか？",
      registerLink: "今すぐ登録",
      loginLink: "ログイン",
      requireLoginTitle: "ご予約にはログインが必要です",
      requireLoginDesc: "客室のご予約を完了するには、ログインまたは新規登録を行ってください。",
    },
    profile: {
      title: "プロフィール",
      personalInfo: "お客様情報",
      bookingHistory: "予約履歴",
      noBookings: "現在のご予約はありません。",
      bookNow: "今すぐ予約する",
      save: "変更を保存",
      phone: "電話番号",
    },
    placeholder: {
      title: "準備中のページです",
      desc: "詳細コンテンツを近日公開予定です。",
      back: "ホームに戻る",
    },
    common: {
      language: "言語",
      theme: "テーマ",
      lightMode: "ライトモード",
      darkMode: "ダークモード",
    },
  },
} as const;

function getValue(obj: any, path: string) {
  if (!obj) return undefined;
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "vi";
    const saved = localStorage.getItem("senviet_lang") as Language;
    if (saved && ["vi", "en", "zh", "ko", "ja"].includes(saved)) {
      return saved;
    }
    return "vi";
  });

  const setLanguageAndPersist = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("senviet_lang", lang);
    }
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageAndPersist,
      t: (path: string) => {
        const langDict = (dictionaries as any)[language];
        const val = getValue(langDict, path);
        if (val !== undefined && val !== null) return String(val);

        // Fallback to English, then Vietnamese, then key
        const enVal = getValue(dictionaries.en, path);
        if (enVal !== undefined && enVal !== null) return String(enVal);

        const viVal = getValue(dictionaries.vi, path);
        if (viVal !== undefined && viVal !== null) return String(viVal);

        return path;
      },
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
