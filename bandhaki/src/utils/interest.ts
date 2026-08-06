/**
 * Client-side port of backend/src/utils/interest.ts (source of truth — no
 * shared package exists between the two repos; duplication is the pragmatic
 * choice for v1). Used for the loan-detail read and the payment-entry
 * interest preview.
 */

export type InterestType = "simple" | "compound";

export function calculateInterest(
  principal: number,
  rate: number,
  days: number,
  interestType: InterestType
): number {
  const rateDecimal = rate / 100;

  if (interestType === "simple") {
    return (principal * rateDecimal * days) / 365;
  } else {
    const months = days / 30;
    return principal * (Math.pow(1 + rateDecimal / 12, months) - 1);
  }
}

export function calculateDaysBetween(
  startDate: Date | string,
  endDate: Date | string
): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end - start) / msPerDay);
}
