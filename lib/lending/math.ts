/**
 * lib/lending/math.ts — interest rate model (kinked).
 *
 * Borrow APY rises slowly up to the kink, then steeply, so lenders can always
 * withdraw. Rates are basis points.
 */

export const RATE_MODEL = {
  baseBps: 100,
  slope1Bps: 600,
  slope2Bps: 4000,
  kinkBps: 9000,
  reserveFactorBps: 1000,
};

export function borrowApyAt(utilizationBps: number): number {
  const { baseBps, slope1Bps, slope2Bps, kinkBps } = RATE_MODEL;
  if (utilizationBps <= kinkBps) {
    return Math.round(baseBps + (utilizationBps / kinkBps) * slope1Bps);
  }
  const over = (utilizationBps - kinkBps) / (10_000 - kinkBps);
  return Math.round(baseBps + slope1Bps + over * slope2Bps);
}

export function supplyApyAt(utilizationBps: number): number {
  const borrow = borrowApyAt(utilizationBps);
  return Math.round((borrow * utilizationBps * (10_000 - RATE_MODEL.reserveFactorBps)) / 1e8);
}
