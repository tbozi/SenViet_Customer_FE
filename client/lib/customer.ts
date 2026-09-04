export interface CustomerReview { id: string; bookingId: string; userEmail: string; hotelSlug: string; rating: number; comment: string; createdAt: string; status: "pending" | "published"; }
const REVIEWS_KEY = "senviet_reviews";
export function getReviews() { try { return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]") as CustomerReview[]; } catch { return []; } }
export function saveReview(review: CustomerReview) { localStorage.setItem(REVIEWS_KEY, JSON.stringify([review, ...getReviews()])); }
export function getCustomerPoints(totalSpend: number) { return Math.floor(totalSpend / 10000); }
export function getLoyaltyTier(points: number) { if (points >= 5000) return { name: "Lotus Gold", next: null, progress: 100 }; if (points >= 2000) return { name: "Lotus Silver", next: 5000, progress: Math.round((points / 5000) * 100) }; return { name: "Lotus Member", next: 2000, progress: Math.round((points / 2000) * 100) }; }
