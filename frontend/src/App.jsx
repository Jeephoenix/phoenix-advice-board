import { useState, useEffect, useCallback } from "react";
import { ethers }               from "ethers";
import ConnectWallet            from "./components/ConnectWallet";
import PostQuestion             from "./components/PostQuestion";
import AnswerQuestion           from "./components/AnswerQuestion";
import QuestionCard             from "./components/QuestionCard";
import deploymentInfo           from "./utils/deploymentInfo.json";
import "./App.css";

export default function App() {
  const [provider,    setProvider]    = useState(null);
  const [signer,      setSigner]      = useState(null);
  const [contract,    setContract]    = useState(null);
  const [account,     setAccount]     = useState(null);
  const [questions,   setQuestions]   = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [stats,       setStats]       = useState(null);
  const [view,        setView]        = useState("board");

  // ── Disconnect Wallet ─────────────────────────────
  // Wrapped in useCallback so it has a stable reference
  // for the useEffect dependency array, preventing stale closures.
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount(null);
    setQuestions([]);
    setStats(null);
    setView("board");
  }, []);

  // ── Connect Wallet ────────────────────────────────
  const connectWallet = async (walletName = "MetaMask") => {
    try {
      if (!window.ethereum && !window.okxwallet) {
        setError("No wallet found. Please install a wallet first.");
        return;
      }

      setLoading(true);
      setError(""); // Clear stale errors before each new action

      let _provider;

      if (walletName === "OKX Wallet" && window.okxwallet) {
        _provider = new ethers.BrowserProvider(window.okxwallet);
      } else if (window.ethereum) {
        _provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        setError("Selected wallet not found. Please install it first.");
        setLoading(false); // Ensure loading resets on early return
        return;
      }

      // Validate the user is on the correct chain (Base = 8453, Base Sepolia = 84532)
      const network = await _provider.getNetwork();
      const allowedChains = [8453n, 84532n];
      if (!allowedChains.includes(network.chainId)) {
        setError("Please switch to Base or Base Sepolia network.");
        setLoading(false);
        return;
      }

      const accounts  = await _provider.send("eth_requestAccounts", []);
      const _signer   = await _provider.getSigner();
      const _contract = new ethers.Contract(
        deploymentInfo.contractAddress,
        deploymentInfo.abi,
        _signer
      );

      setProvider(_provider);
      setSigner(_signer);
      setContract(_contract);
      setAccount(accounts[0]);

      await loadData(_contract);
    } catch (err) {
      setError("Wallet connection failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Load All Data ─────────────────────────────────
  const loadData = async (_contract) => {
    try {
      setLoading(true);
      const count   = await _contract.getQuestionCount();
      const loaded  = [];

      for (let i = 1; i <= Number(count); i++) {
        const q       = await _contract.getQuestion(i);
        const answers = [];

        for (let j = 1; j <= Number(q.answerCount); j++) {
          const a = await _contract.getAnswer(i, j);
          answers.push({
            id        : Number(a.id),
            answerer  : a.answerer,
            content   : a.content,
            tipAmount : ethers.formatEther(a.tipAmount),
            isBest    : a.isBest,
            createdAt : new Date(
              Number(a.createdAt) * 1000
            ).toLocaleString()
          });
        }

        loaded.push({
          id                : Number(q.id),
          asker             : q.asker,
          content           : q.content,
          category          : q.category,
          tipPool           : ethers.formatEther(q.tipPool),
          isOpen            : q.isOpen,
          bestAnswerPicked  : q.bestAnswerPicked,
          answerCount       : Number(q.answerCount),
          createdAt         : new Date(
            Number(q.createdAt) * 1000
          ).toLocaleString(),
          answers
        });
      }

      const reversed = loaded.reverse();
      setQuestions(reversed);

      // Sync `selected` with freshly loaded data so it's never stale
      setSelected(prev =>
        prev ? reversed.find(q => q.id === prev.id) ?? null : null
      );

      const s = await _contract.getStats();
      setStats({
        total   : Number(s.totalQuestions),
        fees    : ethers.formatEther(s.feesCollected),
        tips    : ethers.formatEther(s.tipsDistributed),
        balance : ethers.formatEther(s.contractBalance)
      });
    } catch (err) {
      setError("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Post Question ─────────────────────────────────
  const postQuestion = async (content, category, fee) => {
    try {
      setLoading(true);
      setError("");
      const tx = await contract.postQuestion(content, category, {
        value: ethers.parseEther(fee)
      });
      await tx.wait();
      await loadData(contract);
      setView("board");
    } catch (err) {
      setError("Failed to post question: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Post Answer ───────────────────────────────────
  const postAnswer = async (questionId, content) => {
    try {
      setLoading(true);
      setError("");
      const tx = await contract.postAnswer(questionId, content);
      await tx.wait();
      await loadData(contract); // selected is synced inside loadData
      setView("board");
    } catch (err) {
      setError("Failed to post answer: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Pick Best Answer ──────────────────────────────
  const pickBestAnswer = async (questionId, answerId) => {
    try {
      setLoading(true);
      setError("");
      const tx = await contract.pickBestAnswer(questionId, answerId);
      await tx.wait();
      await loadData(contract);
    } catch (err) {
      setError("Failed to pick best answer: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Listen for Account / Chain Changes ───────────────────────────
  // disconnectWallet is now stable (useCallback), safe in dependency array.
  // Cleanup function removes listeners on unmount to prevent memory leaks.
  useEffect(() => {
    const handleEthAccountsChanged = (accs) => {
      if (accs.length === 0) disconnectWallet();
      else setAccount(accs[0]);
    };
    const handleChainChanged = () => window.location.reload();
    const handleOkxAccountsChanged = (accs) => {
      if (accs.length === 0) disconnectWallet();
      else setAccount(accs[0]);
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleEthAccountsChanged);
      window.ethereum.on("chainChanged",    handleChainChanged);
    }
    if (window.okxwallet) {
      window.okxwallet.on("accountsChanged", handleOkxAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleEthAccountsChanged);
        window.ethereum.removeListener("chainChanged",    handleChainChanged);
      }
      if (window.okxwallet) {
        window.okxwallet.removeListener("accountsChanged", handleOkxAccountsChanged);
      }
    };
  }, [disconnectWallet]);

  return (
    <div className="app">

      {/* ── Header ───────────────────────────── */}
      <header className="header">
        <div className="header-left">
          <span className="logo">🔥</span>
          <div>
            <h1>Phoenix Advice Board</h1>
            <p>Ask. Answer. Earn on Base.</p>
          </div>
        </div>
        <ConnectWallet
          account={account}
          onConnect={connectWallet}
          onDisconnect={disconnectWallet}
          loading={loading}
        />
      </header>

      {/* ── Error Banner ──────────────────────── */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      {/* ── Stats Bar ────────────────────────── */}
      {stats && (
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.fees} ETH</span>
            <span className="stat-label">Fees Collected</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.tips} ETH</span>
            <span className="stat-label">Tips Distributed</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.balance} ETH</span>
            <span className="stat-label">Contract Balance</span>
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────── */}
      {account ? (
        <main className="main">

          {/* Nav Tabs */}
          <div className="tabs">
            <button
              className={`tab ${view === "board" ? "active" : ""}`}
              onClick={() => setView("board")}
            >
              📋 Board
            </button>
            <button
              className={`tab ${view === "ask" ? "active" : ""}`}
              onClick={() => setView("ask")}
            >
              ❓ Ask
            </button>
            {selected && (
              <button
                className={`tab ${view === "answer" ? "active" : ""}`}
                onClick={() => setView("answer")}
              >
                💬 Answer
              </button>
            )}
          </div>

          {/* Board View */}
          {view === "board" && (
            <div className="board">
              {loading && (
                <div className="loading">⏳ Loading questions...</div>
              )}
              {questions.length === 0 && !loading && (
                <div className="empty">
                  <p>🔥 No questions yet.</p>
                  <p>Be the first to ask!</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setView("ask")}
                  >
                    Ask a Question
                  </button>
                </div>
              )}
              {questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  account={account}
                  onAnswer={() => {
                    setSelected(q);
                    setView("answer");
                  }}
                  onPickBest={pickBestAnswer}
                />
              ))}
            </div>
          )}

          {/* Ask View */}
          {view === "ask" && (
            <PostQuestion
              onPost={postQuestion}
              loading={loading}
            />
          )}

          {/* Answer View */}
          {view === "answer" && selected && (
            <AnswerQuestion
              question={selected}
              onAnswer={postAnswer}
              loading={loading}
              onBack={() => setView("board")}
            />
          )}
        </main>
      ) : (
        <div className="welcome">
          <div className="welcome-card">
            <span className="welcome-icon">🔥</span>
            <h2>Welcome to Phoenix Advice Board</h2>
            <p>
              The decentralized advice platform on Base blockchain.
              Pay to ask. Answer to earn. Fully on-chain.
            </p>
            <div className="welcome-steps">
              <div className="step">
                <span>1️⃣</span>
                <p>Connect your wallet — MetaMask, Rabby, OKX, or Base App</p>
              </div>
              <div className="step">
                <span>2️⃣</span>
                <p>Pay 0.0001 ETH to post a question</p>
              </div>
              <div className="step">
                <span>3️⃣</span>
                <p>Best answerer earns 80% of the tip pool</p>
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => connectWallet("MetaMask")}
              disabled={loading}
            >
              {loading ? "Connecting..." : "🔗 Connect Wallet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
