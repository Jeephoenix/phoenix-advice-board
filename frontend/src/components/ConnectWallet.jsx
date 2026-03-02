import { useState } from "react";

export default function ConnectWallet({ account, onConnect, loading }) {
  const [showOptions, setShowOptions] = useState(false);

  const short = (addr) =>
    addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";

  const wallets = [
    {
      name    : "MetaMask",
      icon    : "🦊",
      color   : "#f6851b",
      check   : () => window.ethereum?.isMetaMask,
      install : "https://metamask.io"
    },
    {
      name    : "Rabby Wallet",
      icon    : "🐰",
      color   : "#8697ff",
      check   : () => window.ethereum?.isRabby,
      install : "https://rabby.io"
    },
    {
      name    : "OKX Wallet",
      icon    : "⬛",
      color   : "#ffffff",
      check   : () => window.okxwallet,
      install : "https://www.okx.com/web3"
    },
    {
      name    : "Base App",
      icon    : "🔷",
      color   : "#0052ff",
      check   : () => window.ethereum?.isCoinbaseWallet,
      install : "https://www.coinbase.com/wallet"
    }
  ];

  const handleConnect = async (wallet) => {
    const isAvailable = wallet.check();
    if (!isAvailable) {
      window.open(wallet.install, "_blank");
      return;
    }
    setShowOptions(false);
    await onConnect(wallet.name);
  };

  if (account) {
    return (
      <div className="wallet-badge">
        <span className="dot" />
        <span>{short(account)}</span>
        <span className="network-tag">Base</span>
      </div>
    );
  }

  return (
    <div className="wallet-selector">
      <button
        className="btn btn-primary"
        onClick={() => setShowOptions(!showOptions)}
        disabled={loading}
      >
        {loading ? "Connecting..." : "🔗 Connect Wallet"}
      </button>

      {showOptions && (
        <div className="wallet-dropdown">
          <p className="wallet-dropdown-title">Choose your wallet</p>
          {wallets.map((wallet) => {
            const available = wallet.check();
            return (
              <button
                key={wallet.name}
                className="wallet-option"
                onClick={() => handleConnect(wallet)}
              >
                <span className="wallet-icon">{wallet.icon}</span>
                <span className="wallet-name">{wallet.name}</span>
                <span className={`wallet-status ${available ? "available" : "install"}`}>
                  {available ? "✅ Detected" : "Install →"}
                </span>
              </button>
            );
          })}
          <button
            className="wallet-cancel"
            onClick={() => setShowOptions(false)}
          >
            ✕ Cancel
          </button>
        </div>
      )}
    </div>
  );
}
