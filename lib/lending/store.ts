"use client";

/**
 * lib/lending/store.ts — live Chainlink prices shared by the landing sections.
 */

import { create } from "zustand";
import type { OraclePrice } from "@/shared/types";
import { PRICED_SYMBOLS } from "./prices";

/**
 * loading: no complete set of live prices yet. live: every feed has a price.
 * error: a load finished without a complete set (retrying).
 */
export type PriceStatus = "loading" | "live" | "error";

interface PriceState {
  prices: Record<string, OraclePrice>;
  priceStatus: PriceStatus;
  /** final: this load is done, so an incomplete set means the feeds are unavailable. */
  setLivePrices: (prices: Record<string, OraclePrice>, final: boolean) => void;
}

export const useLendingStore = create<PriceState>()((set) => ({
  prices: {},
  priceStatus: "loading",

  setLivePrices: (live, final) =>
    set((s) => {
      const prices = { ...s.prices, ...live };
      const complete = PRICED_SYMBOLS.every((symbol) => prices[symbol]);
      // Once live, a failed refresh keeps the last real prices (their updatedAt shows the age).
      const priceStatus: PriceStatus = complete ? "live" : final && s.priceStatus !== "live" ? "error" : s.priceStatus;
      return { prices, priceStatus };
    }),
}));
