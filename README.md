# 🔥 Phoenix Advice Board

> A decentralized paid advice platform built on Base blockchain.
> Pay to ask. Answer to earn. Fully on-chain. No middlemen.

---

## 🌐 Live Demo

> 🚀 [phoenix-advice-board.vercel.app](https://phoenix-advice-board.vercel.app)
> *(Update this link after deployment)*

---

## 📌 What Is Phoenix Advice Board?

Phoenix Advice Board is a decentralized application (DApp) built
on Base blockchain where:

- **Askers** pay a small ETH fee to post a question publicly
- **Answerers** respond for free competing for the prize pool
- **Best answer** is picked by the asker and earns 80% of the pool
- **Everything** is recorded permanently on Base — transparent and trustless

No accounts. No passwords. Just connect your wallet and go.

---

## ✨ Features

- 🔗 Multi-wallet support — MetaMask, Rabby, OKX Wallet, Base App
- ❓ Pay to ask questions with a custom ETH tip pool
- 💬 Free to answer any open question
- 🏆 Asker picks the best answer to release the prize
- 💰 80% of tip pool goes to best answerer automatically
- 📊 Live stats — questions, fees, tips distributed
- 🗂️ Question categories — DeFi, Security, Trading, NFTs and more
- 📋 Collapsible answers to keep the board clean
- 🔒 Closed questions show winner and prize earned
- ⛓️ Fully on-chain — no backend, no database, no central server

---

## 💡 How It Works
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Asker pays 0.0001+ ETH to post question            │
│              │                                      │
│              ▼                                      │
│   20% → Owner wallet (instantly)                    │
│   80% → Locked in smart contract (tip pool)         │
│              │                                      │
│              ▼                                      │
│   Answerers post answers for free                   │
│              │                                      │
│              ▼                                      │
│   Asker reviews and picks best answer               │
│              │                                      │
│              ▼                                      │
│   80% of tip pool → Best answerer wallet            │
│   20% of tip pool → Owner wallet                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Smart Contract | Solidity 0.8.19 | On-chain logic & storage |
| Blockchain | Base (L2) | Fast & cheap transactions |
| Dev Environment | Hardhat | Compile, test & deploy |
| Frontend | React + Vite | User interface |
| Blockchain Library | Ethers.js v6 | Contract interaction |
| Wallets | MetaMask, Rabby, OKX, Base App | Transaction signing |
| Testnet | Base Sepolia | Safe testing environment |
| Hosting | Vercel | Frontend deployment |
| Verification | BaseScan | Contract transparency |

---

## 📁 Project Structure
```
phoenix-advice-board/
│
├── contracts/
│   └── PhoenixAdviceBoard.sol        ← Smart contract
│
├── scripts/
│   └── deploy.js                     ← Deployment script
│
├── test/
│   └── PhoenixAdviceBoard.test.js    ← Unit tests
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   ← Main React app
│   │   ├── App.css                   ← Full UI styles
│   │   ├── components/
│   │   │   ├── ConnectWallet.jsx     ← Multi-wallet connector
│   │   │   ├── PostQuestion.jsx      ← Ask a question form
│   │   │   ├── AnswerQuestion.jsx    ← Answer a question form
│   │   │   └── QuestionCard.jsx      ← Question display card
│   │   └── utils/
│   │       └── deploymentInfo.json   ← Contract ABI & address
│   └── package.json
│
├── hardhat.config.js                 ← Hardhat + Base config
├── package.json                      ← Root dependencies
├── .env.example                      ← Environment variable template
└── README.md                         ← This file
```

---

## ⚙️ Smart Contract

### Contract Details

| Property | Value |
|---|---|
| Name | PhoenixAdviceBoard |
| Language | Solidity 0.8.19 |
| Network | Base Mainnet / Base Sepolia |
| Ask Fee | 0.0001 ETH minimum |
| Owner Share | 20% of every payment |
| Answerer Share | 80% of tip pool |

### Functions

| Function | Description | Who Can Call |
|---|---|---|
| `postQuestion()` | Post a question with ETH tip | Anyone |
| `postAnswer()` | Answer an open question | Anyone except asker |
| `pickBestAnswer()` | Pick best answer & pay out | Asker only |
| `addTip()` | Add more ETH to tip pool | Anyone |
| `getQuestion()` | Fetch question details | Anyone |
| `getAnswer()` | Fetch answer details | Anyone |
| `getQuestionCount()` | Total questions posted | Anyone |
| `getStats()` | Contract statistics | Anyone |

### Events

| Event | When It Fires |
|---|---|
| `QuestionPosted` | New question is created |
| `AnswerPosted` | New answer is submitted |
| `BestAnswerPicked` | Asker picks winner & pays out |
| `TipAdded` | Extra tip added to pool |

### Security Features

- ✅ One answer per wallet per question (no spam)
- ✅ Asker cannot answer their own question
- ✅ Only asker can pick the best answer
- ✅ Best answer can only be picked once
- ✅ Voting/answering blocked on closed questions
- ✅ Minimum fee enforced on-chain
- ✅ Payouts happen automatically via smart contract

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher — [nodejs.org](https://nodejs.org)
- npm v9 or higher
- MetaMask, Rabby, OKX Wallet, or Base App installed
- Git — [git-scm.com](https://git-scm.com)

### Installation

**1. Clone the repo:**
```bash
git clone https://github.com/Jeephoenix/phoenix-advice-board.git
cd phoenix-advice-board
```

**2. Install root dependencies:**
```bash
npm install
```

**3. Install frontend dependencies:**
```bash
cd frontend && npm install && cd ..
```

**4. Set up environment variables:**
```bash
cp .env.example .env
# Open .env and fill in your values
```

---

## 🔨 Development

### Compile the contract
```bash
npm run compile
```

### Run unit tests
```bash
npm run test
```

Expected output:
```
  PhoenixAdviceBoard
    Deployment
      ✅ Should set the right owner
      ✅ Should start with zero questions
      ✅ Should have correct ask fee
    Post Question
      ✅ Should post a question successfully
      ✅ Should reject question below minimum fee
      ✅ Should reject empty question
      ✅ Should emit QuestionPosted event
      ✅ Should split fee — owner gets 20%
    Post Answer
      ✅ Should post an answer successfully
      ✅ Should reject empty answer
      ✅ Should prevent asker from answering own question
      ✅ Should emit AnswerPosted event
    Pick Best Answer
      ✅ Should pick best answer and close question
      ✅ Should pay out 80% of tip pool to answerer
      ✅ Should prevent non-asker from picking best answer
      ✅ Should prevent picking best answer twice
      ✅ Should emit BestAnswerPicked event

  17 passing ✅
```

### Start local blockchain
```bash
# Terminal 1
npm run node

# Terminal 2
npm run deploy:local
```

### Run the frontend
```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

---

## 🌐 Deployment

### Deploy to Base Sepolia Testnet

**Step 1 — Get free Base Sepolia ETH:**
- Visit [faucet.quicknode.com/base/sepolia](https://faucet.quicknode.com/base/sepolia)
- Paste your wallet address and receive test ETH

**Step 2 — Get free RPC URL:**
- Sign up at [alchemy.com](https://alchemy.com)
- Create app → Select Base Sepolia
- Copy HTTPS URL to your `.env`

**Step 3 — Add Base Sepolia to MetaMask:**

| Field | Value |
|---|---|
| Network Name | Base Sepolia |
| RPC URL | https://sepolia.base.org |
| Chain ID | 84532 |
| Symbol | ETH |
| Explorer | https://sepolia.basescan.org |

**Step 4 — Deploy:**
```bash
npm run deploy:testnet
```

**Step 5 — Verify contract:**
```bash
npm run verify:testnet YOUR_CONTRACT_ADDRESS
```

---

### Deploy to Base Mainnet
```bash
npm run deploy:base
npm run verify:base YOUR_CONTRACT_ADDRESS
```

> ⚠️ Only deploy to mainnet after thorough testnet testing.

---

### Deploy Frontend to Vercel

**Option A — Vercel CLI:**
```bash
cd frontend
npm run build
npm install -g vercel
vercel
```

**Option B — Vercel Dashboard:**
1. Go to [vercel.com](https://vercel.com)
2. Import your `phoenix-advice-board` repo
3. Set root directory to `frontend`
4. Click Deploy

---

## 🔗 Supported Wallets

| Wallet | Detection | Install |
|---|---|---|
| 🦊 MetaMask | `window.ethereum.isMetaMask` | [metamask.io](https://metamask.io) |
| 🐰 Rabby Wallet | `window.ethereum.isRabby` | [rabby.io](https://rabby.io) |
| ⬛ OKX Wallet | `window.okxwallet` | [okx.com/web3](https://okx.com/web3) |
| 🔷 Base App | `window.ethereum.isCoinbaseWallet` | [coinbase.com/wallet](https://coinbase.com/wallet) |

---

## 🐛 Common Issues & Fixes

**MetaMask not detected:**
Install MetaMask from [metamask.io](https://metamask.io) and refresh.

**Wrong network error:**
Switch MetaMask to Base Sepolia (Chain ID: 84532) or Base Mainnet
(Chain ID: 8453).

**Insufficient funds:**
Get free Base Sepolia ETH from
[faucet.quicknode.com/base/sepolia](https://faucet.quicknode.com/base/sepolia).

**Contract not found:**
Make sure `deploymentInfo.json` has the correct contract address
after running the deploy script.

**Nonce mismatch:**
Go to MetaMask → Settings → Advanced → Reset Account.

**Transaction underpriced:**
Base usually has very low fees. If this error appears, increase
gas price slightly in MetaMask settings.

---

## 🗺️ Roadmap

- [ ] Add tip boosting — anyone can add ETH to any question pool
- [ ] Question search and filtering
- [ ] User profile page showing questions asked and answered
- [ ] Leaderboard of top earners
- [ ] Token-gated categories for verified experts
- [ ] Mobile-optimized PWA version
- [ ] Multi-language support
- [ ] Farcaster Frame integration

---

## 📚 Resources

| Resource | Link |
|---|---|
| Base Docs | [docs.base.org](https://docs.base.org) |
| Base Sepolia Faucet | [faucet.quicknode.com/base/sepolia](https://faucet.quicknode.com/base/sepolia) |
| BaseScan Explorer | [basescan.org](https://basescan.org) |
| Hardhat Docs | [hardhat.org](https://hardhat.org) |
| Ethers.js v6 Docs | [docs.ethers.org](https://docs.ethers.org) |
| Alchemy (RPC) | [alchemy.com](https://alchemy.com) |
| Vercel Hosting | [vercel.com](https://vercel.com) |

---

## ⚠️ Disclaimer

This project is for **educational and experimental purposes**.
Smart contracts on mainnet handle real funds — always test
thoroughly on testnet first. No professional audit has been
performed on this contract. Use at your own risk.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch:
```bash
   git checkout -b feature/your-feature-name
```
3. Commit your changes:
```bash
   git commit -m "Add your feature description"
```
4. Push and open a Pull Request

---

## 📄 License

MIT License — free to use, share, and build upon.

---

## 👤 Author

Built with 💙 by Jee Phoenix on Base blockchain.
**Ask boldly. Answer well. Earn on-chain.**

---

## ⭐ Support

If you found this project useful give it a ⭐ on GitHub
and share it with the Web3 community!
