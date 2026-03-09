/**
 * Calculate interest based on type.
 * Simple: principal * rate * days / 365
 * Compound: principal * ((1 + rate/12)^months - 1)
 */
export function calculateInterest(
  principal: number,
  rate: number,
  days: number,
  interestType: "simple" | "compound"
): number {
  const rateDecimal = rate / 100;

  if (interestType === "simple") {
    return (principal * rateDecimal * days) / 365;
  } else {
    const months = days / 30;
    return principal * (Math.pow(1 + rateDecimal / 12, months) - 1);
  }
}

/**
 * Calculate days between two dates
 */
export function calculateDaysBetween(
  startDate: Date | string,
  endDate: Date | string
): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end - start) / msPerDay);
}
