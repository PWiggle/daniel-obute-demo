/**
 * Shop + crypto payment config — Daniel Obute portfolio demo
 * CRYPTO ONLY — no cards, Paystack, bank, or PayPal.
 *
 * TO GO LIVE: replace DEMO wallet addresses with Daniel’s real wallets.
 * USDT (TRC20) is the usual pick for Nigeria + international clients.
 */
window.OBUTE_CONFIG = {
  artistName: "Daniel Obute",
  artistEmail: "danielobute21@gmail.com",
  artistPhone: "+2349012475726",

  /** Approximate NGN display (informational only) */
  ngnPerUsd: 1600,
  displayCurrency: "USD",

  /**
   * Wallet addresses — REPLACE before accepting real payments.
   * Labels must match the network you actually use (TRC20 ≠ ERC20).
   */
  wallets: {
    usdt_trc20: {
      id: "usdt_trc20",
      symbol: "USDT",
      name: "USDT",
      network: "TRC20 (Tron)",
      address: "TDemoUsdtTrc20AddressReplaceMeWithRealWallet1",
      preferred: true,
      note: "Recommended — low fees"
    },
    usdt_erc20: {
      id: "usdt_erc20",
      symbol: "USDT",
      name: "USDT",
      network: "ERC20 (Ethereum)",
      address: "0xDemoUsdtErc20ReplaceMeWithDanielRealWallet0001",
      preferred: false,
      note: "Higher gas fees"
    },
    eth: {
      id: "eth",
      symbol: "ETH",
      name: "ETH",
      network: "Ethereum",
      address: "0xDemoEthWalletReplaceMeWithDanielRealAddress0002",
      preferred: false,
      note: "Ethereum mainnet only"
    },
    btc: {
      id: "btc",
      symbol: "BTC",
      name: "BTC",
      network: "Bitcoin",
      address: "bc1qdemobtcwalletreplacemewithdanielrealaddr00",
      preferred: false,
      note: "Bitcoin network only"
    }
  },

  products: {
    portraits: {
      id: "portraits",
      name: "Character Portraits",
      tier: "Portraits",
      priceUsd: 350,
      description: "Striking character portraits that capture personality and emotion."
    },
    "half-body": {
      id: "half-body",
      name: "Half Body",
      tier: "Half Body",
      priceUsd: 450,
      description: "Expressive half body illustrations perfect for animation and comics."
    },
    "full-body": {
      id: "full-body",
      name: "Full Body",
      tier: "Full Body",
      priceUsd: 525,
      description: "Complete full body designs with story-driven details and flair."
    }
  }
};
