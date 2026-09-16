"use client";

/**
 * lib/lending/prices.ts — live stock token prices from Chainlink on Robinhood Chain.
 *
 * These are the same feeds lending contracts on Robinhood Chain read, so the
 * prices users see match what liquidations use. Read directly from the chain
 * in the browser: no API key, no backend.
 *
 * Feeds update 24/5 (Sunday 8 PM to Friday 8 PM ET) with a 0.5% deviation
 * threshold and hold the last price over weekends and holidays (check `updatedAt`).
 */

import { parseAbi, type Address } from "viem";
import type { OraclePrice } from "@/shared/types";
import { COLLATERAL_ASSETS } from "@/config/lending";
import { publicClient } from "./rpc";

const FEED_ABI = parseAbi([
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function getRoundData(uint80 roundId) view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
]);

/** All Robinhood equity feeds report 8 decimals (Chainlink reference data). */
const FEED_DECIMALS = 8n;
/** Recompute the 24h reference price at most this often. */
const REFERENCE_TTL_MS = 30 * 60_000;
const DAY_SECONDS = 86_400;

type RoundData = readonly [bigint, bigint, bigint, bigint, bigint];

interface LatestRound {
  symbol: string;
  feed: Address;
  roundId: bigint;
  answer: bigint;
  updatedAt: number;
}

/** Collateral assets that have a Chainlink feed. */
export const PRICED_SYMBOLS = COLLATERAL_ASSETS.filter((a) => a.priceFeed).map((a) => a.symbol);

function toCents(answer: bigint): number {
  const div = 10n ** (FEED_DECIMALS - 2n);
  return Number((answer + div / 2n) / div);
}

function changeBps(answer: bigint, reference: bigint | null): number {
  return reference && reference > 0n ? Number(((answer - reference) * 10_000n) / reference) : 0;
}

function toPrice(round: LatestRound, change24hBps: number | null): OraclePrice {
  return {
    usdCents: toCents(round.answer),
    change24hBps,
    updatedAt: new Date(round.updatedAt * 1000).toISOString(),
  };
}

async function readRound(feed: Address, roundId: bigint): Promise<RoundData | null> {
  try {
    return (await publicClient().readContract({
      address: feed,
      abi: FEED_ABI,
      functionName: "getRoundData",
      args: [roundId],
    })) as RoundData;
  } catch {
    return null; // round ids can have gaps
  }
}

/**
 * Price (answer) of the last round published at or before `target` (unix seconds),
 * found by binary search over the current phase's round ids.
 */
async function answerAt(feed: Address, latestRoundId: bigint, target: number): Promise<bigint | null> {
  const phase = latestRoundId >> 64n;
  let lo = 1n;
  let hi = latestRoundId & ((1n << 64n) - 1n);
  let best: bigint | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) / 2n;
    const round = await readRound(feed, (phase << 64n) | mid);
    if (round && Number(round[3]) <= target) {
      best = round[1];
      lo = mid + 1n;
    } else {
      hi = mid - 1n;
    }
  }
  return best;
}

const referenceCache = new Map<string, { answer: bigint | null; forUpdatedAt: number; at: number }>();

async function readLatest(): Promise<LatestRound[]> {
  const rounds = await Promise.all(
    COLLATERAL_ASSETS.map(async (asset): Promise<LatestRound | null> => {
      if (!asset.priceFeed) return null;
      try {
        const [roundId, answer, , updatedAt] = (await publicClient().readContract({
          address: asset.priceFeed,
          abi: FEED_ABI,
          functionName: "latestRoundData",
        })) as RoundData;
        if (answer <= 0n) return null;
        return { symbol: asset.symbol, feed: asset.priceFeed, roundId, answer, updatedAt: Number(updatedAt) };
      } catch {
        return null; // caller keeps the previous price for this asset
      }
    }),
  );
  return rounds.filter((r): r is LatestRound => r !== null);
}

/**
 * Latest price for every collateral asset with a feed.
 *
 * The latest rounds take one round trip, but the 24h change needs a search
 * through older rounds (a few seconds on first load). So `onLatest` receives
 * the prices first, with `change24hBps: null` until a reference is known,
 * and the returned promise resolves once the changes are computed.
 *
 * The 24h change compares against the price 24h before the latest update, so
 * on weekends it shows the last trading day's move instead of 0%.
 */
export async function fetchChainlinkPrices(
  onLatest?: (prices: Record<string, OraclePrice>) => void,
): Promise<Record<string, OraclePrice>> {
  const rounds = await readLatest();

  onLatest?.(
    Object.fromEntries(
      rounds.map((r) => {
        const cached = referenceCache.get(r.symbol);
        return [r.symbol, toPrice(r, cached ? changeBps(r.answer, cached.answer) : null)];
      }),
    ),
  );

  const prices = await Promise.all(
    rounds.map(async (r) => {
      const cached = referenceCache.get(r.symbol);
      let reference = cached?.answer ?? null;
      if (!cached || cached.forUpdatedAt !== r.updatedAt || Date.now() - cached.at > REFERENCE_TTL_MS) {
        reference = await answerAt(r.feed, r.roundId, r.updatedAt - DAY_SECONDS);
        referenceCache.set(r.symbol, { answer: reference, forUpdatedAt: r.updatedAt, at: Date.now() });
      }
      return [r.symbol, toPrice(r, changeBps(r.answer, reference))] as const;
    }),
  );

  return Object.fromEntries(prices);
}
