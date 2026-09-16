/**
 * LENDING CONFIG — assets, price feeds and risk tiers.
 *
 * Live prices do NOT belong here — they come from lib/lending/hooks.ts.
 *
 * Token addresses are the canonical tokens on Robinhood Chain mainnet: USDG from
 * docs.robinhood.com/chain/contracts, stock tokens from Robinhood's asset registry
 * (api.robinhood.com/rhj/assets). Symbols and decimals verified onchain 2026-09-14.
 * Logos are single-color marks in /public/logos, rendered as CSS masks.
 */

import type { Asset, RiskParams } from "@/shared/types";

/** Asset users borrow and lend. */
export const LOAN_ASSET: Asset = {
  symbol: "USDG",
  name: "Global Dollar",
  kind: "stablecoin",
  address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  decimals: 6,
  logo: "/logos/usdg.png",
};

export type RiskTier = "index" | "megacap" | "highbeta";

/** Riskier stocks get lower borrow limits and a bigger liquidation penalty. */
export const RISK_TIERS: Record<RiskTier, RiskParams> = {
  index: { maxLtvBps: 7000, liquidationLtvBps: 7700, liquidationPenaltyBps: 400 },
  megacap: { maxLtvBps: 6000, liquidationLtvBps: 7000, liquidationPenaltyBps: 500 },
  highbeta: { maxLtvBps: 5000, liquidationLtvBps: 6250, liquidationPenaltyBps: 750 },
};

/**
 * Stock and ETF tokens accepted as collateral, each with its risk tier.
 * priceFeed: Chainlink feed proxies on Robinhood Chain mainnet, from Chainlink's
 * reference data (feeds-robinhood-mainnet.json), verified onchain 2026-09-14.
 * Each feed returns the price of one token (share price × dividend multiplier), 8 decimals.
 */
export const COLLATERAL_ASSETS: (Asset & { tier: RiskTier })[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF", kind: "etf", address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C", decimals: 18, logo: "/logos/spy.png", logoAspect: 3.47, priceFeed: "0x319724394D3A0e3669269846abE664Cd621f9f6A", tradingViewSymbol: "AMEX:SPY", tier: "index" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", kind: "etf", address: "0xD5f3879160bc7c32ebb4dC785F8a4F505888de68", decimals: 18, logo: "/logos/qqq.png", logoAspect: 1.59, priceFeed: "0x80901d846d5D7B030F26B480776EE3b29374C2ae", tradingViewSymbol: "NASDAQ:QQQ", tier: "index" },
  { symbol: "NVDA", name: "NVIDIA", kind: "stock", address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC", decimals: 18, logo: "/logos/nvda.svg", priceFeed: "0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15", tradingViewSymbol: "NASDAQ:NVDA", tier: "highbeta" },
  { symbol: "AAPL", name: "Apple", kind: "stock", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9", decimals: 18, logo: "/logos/aapl.svg", priceFeed: "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0", tradingViewSymbol: "NASDAQ:AAPL", tier: "megacap" },
  { symbol: "MSFT", name: "Microsoft", kind: "stock", address: "0xe93237C50D904957Cf27E7B1133b510C669c2e74", decimals: 18, logo: "/logos/msft.png", priceFeed: "0x45C3C877C15E6BA2EBB19eA114Ea508d14C1Af2E", tradingViewSymbol: "NASDAQ:MSFT", tier: "megacap" },
  { symbol: "TSLA", name: "Tesla", kind: "stock", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d", decimals: 18, logo: "/logos/tsla.svg", priceFeed: "0x4A1166a659A55625345e9515b32adECea5547C38", tradingViewSymbol: "NASDAQ:TSLA", tier: "highbeta" },
  { symbol: "AMZN", name: "Amazon", kind: "stock", address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54", decimals: 18, logo: "/logos/amzn.png", logoAspect: 1.18, priceFeed: "0xD5a1508ceD74c084eBf3cBe853e2C968fB2a651C", tradingViewSymbol: "NASDAQ:AMZN", tier: "megacap" },
  { symbol: "META", name: "Meta Platforms", kind: "stock", address: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35", decimals: 18, logo: "/logos/meta.svg", priceFeed: "0x7C38C00C30BEe9378381E7B6135d7283356D71b1", tradingViewSymbol: "NASDAQ:META", tier: "megacap" },
  { symbol: "GOOGL", name: "Alphabet", kind: "stock", address: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3", decimals: 18, logo: "/logos/googl.svg", priceFeed: "0xF6f373a037c30F0e5010d854385cA89185AE638b", tradingViewSymbol: "NASDAQ:GOOGL", tier: "megacap" },
  { symbol: "COIN", name: "Coinbase Global", kind: "stock", address: "0x6330D8C3178a418788dF01a47479c0ce7CCF450b", decimals: 18, logo: "/logos/coin.svg", watermark: "/logos/coin-wordmark.svg", watermarkAspect: 5.56, priceFeed: "0xA3a468A452940B7D6b69991207B508c609a98Ef2", tradingViewSymbol: "NASDAQ:COIN", tier: "highbeta" },
];

/**
 * Health factor bands. Health factor = (collateral value × liquidation LTV) / debt.
 * Below 1.0 a position can be liquidated. `watch` must not exceed the lowest
 * liquidation LTV ÷ max LTV (index ETFs: 77/70 = 1.10), so a fresh loan at
 * max LTV shows Watch, not At risk.
 */
export const HEALTH_THRESHOLDS = {
  safe: 1.5,
  watch: 1.1,
} as const;

/** Countries where stock tokens are not offered (Robinhood Chain terms). */
export const RESTRICTED_REGIONS = ["United States", "Canada", "United Kingdom", "Switzerland", "UAE"];
