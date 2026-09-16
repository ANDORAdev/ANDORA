/**
 * shared/types.ts — asset and price types.
 *
 * Conventions:
 *   - Token amounts are base units (bigint-safe).
 *   - USD values are integer cents. Rates and ratios are basis points.
 */

export type Address = `0x${string}`;

export type AssetKind = "stock" | "etf" | "stablecoin";

export interface Asset {
  symbol: string;               // "NVDA"
  name: string;                 // "NVIDIA"
  kind: AssetKind;
  address: Address;
  decimals: number;
  logo?: string;                // single-color mark in /public/logos (used as a mask)
  logoAspect?: number;          // width / height of the mark, default 1
  watermark?: string;           // larger logo for card backgrounds, defaults to logo
  watermarkAspect?: number;     // width / height of watermark, default 1
  priceFeed?: Address;          // Chainlink price feed proxy on Robinhood Chain (price of one token)
  tradingViewSymbol?: string;   // underlying stock for charts, e.g. "NASDAQ:NVDA"
}

export interface OraclePrice {
  usdCents: number;             // price of one whole token
  change24hBps: number | null;  // signed, e.g. -125 = -1.25%; null while the 24h reference loads
  updatedAt: string;            // ISO
}

/** Risk parameters of one isolated market (collateral token → USDG). */
export interface RiskParams {
  maxLtvBps: number;
  liquidationLtvBps: number;
  liquidationPenaltyBps: number;
}
