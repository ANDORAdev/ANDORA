"use client";

/**
 * lib/lending/rpc.ts — shared read-only client for Robinhood Chain.
 *
 * Used for reads that don't need a connected wallet (price feeds, token
 * balances). JSON-RPC batching groups concurrent reads into one request.
 */

import { createPublicClient, http } from "viem";
import { ACTIVE_CHAIN } from "@/config/chain";

let client: ReturnType<typeof createPublicClient> | null = null;

export function publicClient() {
  // NEXT_PUBLIC_ROBINHOOD_RPC_URL lets production use a keyed RPC (e.g. Alchemy);
  // the public RPC is rate-limited but fine for a handful of batched reads.
  client ??= createPublicClient({
    transport: http(process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL || ACTIVE_CHAIN.rpcUrls.default.http[0], {
      batch: true,
    }),
  });
  return client;
}
