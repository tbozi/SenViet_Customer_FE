import type { PublicHotelClosure } from "@/services/hotelClosureApi";

export const isClosedHotelDate = (
  date: string,
  closures: PublicHotelClosure[],
) => closures.some((closure) => date >= closure.startDate && date <= closure.endDate);

export const stayOverlapsHotelClosure = (
  checkIn: string,
  checkOut: string,
  closures: PublicHotelClosure[],
) =>
  Boolean(checkIn && checkOut && checkOut > checkIn)
  && closures.some(
    (closure) => closure.startDate < checkOut && closure.endDate >= checkIn,
  );
