/**
 * lib/lending/format.ts — display formatting. Only used at the UI edge.
 */

import { formatUnits, parseUnits } from "viem";

type CentsInput = number | bigint;

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  // Explicit minimum: Node and browsers default currency fractions differently,
  // which caused hydration mismatches ("$260.00K" vs "$260K").
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** "$12,345.67" — or "$4.2M" with compact. */
export function formatUsd(cents: CentsInput, opts: { compact?: boolean } = {}): string {
  const dollars = Number(cents) / 100;
  if (opts.compact && Math.abs(dollars) >= 10_000) return usdCompact.format(dollars);
  return usd.format(dollars);
}

/** Token amount from base units, trimmed to a sensible precision. */
export function formatToken(
  amount: bigint | string,
  decimals: number,
  opts: { maxFraction?: number; compact?: boolean } = {},
): string {
  const value = Number(formatUnits(BigInt(amount), decimals));
  if (opts.compact && Math.abs(value) >= 10_000) {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
  }
  const maxFraction = opts.maxFraction ?? (Math.abs(value) >= 1000 ? 2 : 4);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFraction }).format(value);
}

/** Exact decimal string for inputs ("MAX" fills this). */
export function tokenToInput(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}

/** Parse a user-typed amount. Returns null when not a valid positive number. */
export function parseTokenInput(value: string, decimals: number): bigint | null {
  const trimmed = value.trim();
  if (!trimmed || !/^\d*\.?\d*$/.test(trimmed) || trimmed === ".") return null;
  const [, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) return null;
  try {
    return parseUnits(trimmed, decimals);
  } catch {
    return null;
  }
}

/** Basis points to percent: 612 → "6.12%". */
export function formatBps(bps: number, opts: { sign?: boolean; digits?: number } = {}): string {
  if (!Number.isFinite(bps)) return "—";
  const digits = opts.digits ?? 2;
  const pct = (bps / 100).toFixed(digits);
  const sign = opts.sign && bps > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

export function formatHealth(healthFactor: number): string {
  if (!Number.isFinite(healthFactor)) return "∞";
  if (healthFactor >= 100) return ">100";
  return healthFactor.toFixed(2);
}

export function shortAddress(address: string): string {
  return address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export function shortHash(hash: string): string {
  return hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;
}
