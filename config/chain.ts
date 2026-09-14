/**
 * CHAIN CONFIG — Robinhood Chain (Arbitrum Orbit L2).
 *
 * Source: https://docs.robinhood.com/chain/connecting
 * Switch networks with NEXT_PUBLIC_CHAIN_ENV=testnet (default: mainnet).
 */

import { defineChain } from "viem";

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
});

export const robinhoodChainTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.testnet.chain.robinhood.com" },
  },
  testnet: true,
});

/** Robinhood feather mark, rendered as a single-color mask. */
export const CHAIN_LOGO = "/logos/robinhood.svg";

export const ACTIVE_CHAIN =
  process.env.NEXT_PUBLIC_CHAIN_ENV === "testnet"
    ? robinhoodChainTestnet
    : robinhoodChain;

export function explorerTxUrl(hash: string): string {
  return `${ACTIVE_CHAIN.blockExplorers.default.url}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${ACTIVE_CHAIN.blockExplorers.default.url}/address/${address}`;
}
