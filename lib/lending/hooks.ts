"use client";

/**
 * lib/lending/hooks.ts — market data for the landing page.
 */

import { useEffect, useMemo } from "react";
import type { Asset, OraclePrice, RiskParams } from "@/shared/types";
import { COLLATERAL_ASSETS, LOAN_ASSET, RISK_TIERS } from "@/config/lending";
import { fetchChainlinkPrices } from "./prices";
import { useLendingStore, type PriceStatus } from "./store";

export interface MarketView extends RiskParams {
  id: string;             // "nvda-usdg"
  collateral: Asset;
  loan: Asset;
  price: OraclePrice;
}

/** Placeholder while live prices load. Sections show skeletons while isLoading, so it never renders. */
const PENDING_PRICE: OraclePrice = { usdCents: 0, change24hBps: null, updatedAt: new Date(0).toISOString() };

const PRICE_REFRESH_MS = 60_000;
const RETRY_MS = 5_000;

/** Starts live Chainlink price updates. Mount once on the page. */
export function useLendingBootstrap() {
  const setLivePrices = useLendingStore((s) => s.setLivePrices);

  useEffect(() => {
    let cancelled = false;
    let next: ReturnType<typeof setTimeout> | undefined;
    const loadPrices = async () => {
      try {
        const live = await fetchChainlinkPrices((latest) => {
          if (!cancelled) setLivePrices(latest, false);
        });
        if (!cancelled) setLivePrices(live, true);
      } catch {
        if (!cancelled) setLivePrices({}, true);
      }
      if (cancelled) return;
      // Retry quickly until every feed has a price, then refresh on the normal cadence.
      const live = useLendingStore.getState().priceStatus === "live";
      next = setTimeout(loadPrices, live ? PRICE_REFRESH_MS : RETRY_MS);
    };
    loadPrices();
    return () => {
      cancelled = true;
      clearTimeout(next);
    };
  }, [setLivePrices]);
}

/** "live" once every feed has a price; "error" while the feeds can't be reached. */
export function usePriceStatus(): PriceStatus {
  return useLendingStore((s) => s.priceStatus);
}

/** Every collateral market with its risk parameters and live price. */
export function useMarkets(): { markets: MarketView[]; isLoading: boolean } {
  const prices = useLendingStore((s) => s.prices);
  const priceStatus = useLendingStore((s) => s.priceStatus);
  const markets = useMemo(
    () =>
      COLLATERAL_ASSETS.map(({ tier, ...collateral }) => ({
        id: `${collateral.symbol.toLowerCase()}-${LOAN_ASSET.symbol.toLowerCase()}`,
        collateral,
        loan: LOAN_ASSET,
        ...RISK_TIERS[tier],
        price: prices[collateral.symbol] ?? PENDING_PRICE,
      })),
    [prices],
  );
  return { markets, isLoading: priceStatus !== "live" };
}
