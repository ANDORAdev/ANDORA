# ANDORA

**Borrow against your stocks. Keep the upside.**

ANDORA is a lending protocol for tokenized stocks and ETFs on Robinhood Chain. Deposit stock tokens like NVDA or SPY as collateral and borrow USDG, or lend USDG and earn the interest borrowers pay. Self-custody, onchain, 24/7.

[Website](https://andora-nu.vercel.app) · [X](https://x.com/ANDORArwa)

## How it works

**Borrow.** Connect a self-custody wallet on Robinhood Chain and deposit a stock token as collateral. Borrow USDG up to the market's max LTV, as long as lenders have enough USDG in that market. For example, with a 50% max LTV and $10,000 of collateral you can borrow up to $5,000. Interest accrues continuously; there is no fixed term and no early repayment fee. Once the loan is smaller or repaid, withdraw collateral as long as your LTV stays under the market's maximum.

**Earn.** Deposit USDG into a vault. A vault lends it across several stock markets and you receive the interest borrowers pay, minus the vault's performance fee. APY is not guaranteed; it moves with borrow demand.

**Isolated markets.** Every stock and ETF is its own market. Only that stock backs loans in it, so a crash in one stock can't spread to another.

## Risk tiers

Riskier stocks get lower loan limits and a bigger liquidation penalty.

| Tier | Examples | Max LTV | Liquidation LTV | Penalty |
|---|---|---|---|---|
| Index ETFs | SPY, QQQ | 70% | 77% | 4% |
| Mega caps | AAPL, MSFT, AMZN, META, GOOGL | 60% | 70% | 5% |
| High beta | NVDA, TSLA, COIN | 50% | 62.5% | 7.5% |

Risk parameters are reviewed as markets grow and can change.

## Health factor & liquidation

```
health factor = collateral value × liquidation LTV ÷ debt
```

| Health factor | Status |
|---|---|
| 1.50 or more | Safe |
| 1.10 to 1.50 | Watch: consider repaying or adding collateral |
| Below 1.10 | At risk |
| Below 1.00 | Can be liquidated |

When the health factor falls below 1.00, anyone can repay part of the debt and receive part of the collateral at a discount, the liquidation penalty. The borrower keeps the rest of the collateral and the USDG they borrowed. Liquidations can happen at any time, including when the US market is closed.

The **liquidation price** is the token price at which the health factor reaches 1.00. Example in a market with a 62.5% liquidation LTV: 10 tokens at $200 ($2,000) with $800 borrowed (40% LTV) have a health factor of 1.56 and a liquidation price of about $128.00.

## Interest rates

Rates are variable and set by **utilization**: the share of a market's USDG that is borrowed.

- **Borrow APY** starts at 1% and rises steadily to 7% at 90% utilization.
- Above 90% it climbs quickly, up to 47% at 100%. This pulls in lenders and encourages repayment, so lenders can withdraw.
- **Lender APY** = borrow APY × utilization, minus a 10% protocol reserve.

Withdrawals need free liquidity: if most of a vault is lent out, lenders may have to wait for repayments.

## Prices

Prices come from the **Chainlink** feeds on Robinhood Chain, the same feeds that decide borrow limits and liquidations. Each feed returns the price of one token: the share price times a multiplier that includes reinvested dividends, so a token can be worth slightly more than one share. Feeds update 24/5, from Sunday 8:00 PM to Friday 8:00 PM ET, when the price moves 0.5% or more. Over the weekend and on US market holidays they hold the last price.

Stock tokens trade onchain 24/7. The underlying shares trade from Sunday 8:00 PM to Friday 8:00 PM ET (overnight, pre-market, regular session and after-hours), with fewer trades outside the regular session. Over weekends and holidays they don't trade, and prices can jump when trading resumes, so keep a buffer above your liquidation price.

## Assets

| Asset | Token | Chainlink feed |
|---|---|---|
| USDG | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` | — |
| SPY | `0x117cc2133c37B721F49dE2A7a74833232B3B4C0C` | `0x319724394D3A0e3669269846abE664Cd621f9f6A` |
| QQQ | `0xD5f3879160bc7c32ebb4dC785F8a4F505888de68` | `0x80901d846d5D7B030F26B480776EE3b29374C2ae` |
| NVDA | `0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC` | `0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15` |
| AAPL | `0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9` | `0x6B22A786bAa607d76728168703a39Ea9C99f2cD0` |
| MSFT | `0xe93237C50D904957Cf27E7B1133b510C669c2e74` | `0x45C3C877C15E6BA2EBB19eA114Ea508d14C1Af2E` |
| TSLA | `0x322F0929c4625eD5bAd873c95208D54E1c003b2d` | `0x4A1166a659A55625345e9515b32adECea5547C38` |
| AMZN | `0x12f190a9F9d7D37a250758b26824B97CE941bF54` | `0xD5a1508ceD74c084eBf3cBe853e2C968fB2a651C` |
| META | `0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35` | `0x7C38C00C30BEe9378381E7B6135d7283356D71b1` |
| GOOGL | `0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3` | `0xF6f373a037c30F0e5010d854385cA89185AE638b` |
| COIN | `0x6330D8C3178a418788dF01a47479c0ce7CCF450b` | `0xA3a468A452940B7D6b69991207B508c609a98Ef2` |

Network: Robinhood Chain (Arbitrum Orbit L2), chain ID 4663.

## Fees

| Fee | Amount |
|---|---|
| Borrow interest | Variable, see Interest rates |
| Liquidation penalty | 4%–7.5%, paid only if a position is liquidated |
| Vault performance fee | 10%–15% of the interest a vault earns |
| Network fees (gas) | Paid in ETH on Robinhood Chain for each transaction |
| Deposit, withdrawal, account fees | None |

## Who can use it

Stock tokens are not offered to people in the US, Canada, the UK, Switzerland, the UAE or sanctioned regions. You must be at least 18 and allowed to use these assets where you live. ANDORA never holds your funds: only your wallet can move your collateral, unless a position is liquidated.

## Risks

You can lose some or all of what you deposit. The main risks:

- **Liquidation:** sharp price drops or gaps at market open.
- **Smart contracts:** bugs or exploits in the lending contracts.
- **Oracles:** stale or wrong prices, or pauses during corporate actions.
- **Issuers:** problems at the stock token issuer, the custodian of the shares, or the USDG issuer.
- **Network:** outages or congestion on Robinhood Chain.
- **Regulation:** rule changes that limit access to stock tokens.

Nothing here is financial advice.
