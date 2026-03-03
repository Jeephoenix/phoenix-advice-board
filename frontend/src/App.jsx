import { useState, useEffect, useCallback, useRef } from "react";
import { ethers }               from "ethers";
import ConnectWallet            from "./components/ConnectWallet";
import PostQuestion             from "./components/PostQuestion";
import AnswerQuestion           from "./components/AnswerQuestion";
import QuestionCard             from "./components/QuestionCard";
import deploymentInfo           from "./utils/deploymentInfo.json";
import "./App.css";

export default function App() {
  const [account,   setAccount]   = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [stats,     setStats]     = useState(null);
  const [view,      setView]      = useState("board");

  const contractRef = useRef(null);

  // ── Disconnect Wallet ─────────────────────────────
  const disconnectWallet = useCallback(() => {
    contractRef.current = null;
    setAccount(null);
    setSelected(null);
    setQuestions([]);
    setStats(null);
    setView("board");
  }, []);

  // ── Load All Data ─────────────────────────────────
  const loadData = useCallback(async (_contract) => {
    try {
      setLoading(true);
      const count  = await _contract.getQuestionCount();
      const loaded = [];

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
            createdAt : new Date(Number(a.createdAt) * 1000).toLocaleString()
          });
        }

        loaded.push({
          id               : Number(q.id),
          asker            : q.asker,
          content          : q.content,
          category         : q.category,
          tipPool          : ethers.formatEther(q.tipPool),
          isOpen           : q.isOpen,
          bestAnswerPicked : q.bestAnswerPicked,
          answerCount      : Number(q.answerCount),
          createdAt        : new Date(Number(q.createdAt) * 1000).toLocaleString(),
          answers
        });
      }

      const reversed = loaded.reverse();
      setQuestions(reversed);
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
  }, []);

  // ── Build Contract for a Given Provider ──────────
  const buildContract = useCallback(async (_provider) => {
    const _signer   = await _provider.getSigner();
    const _contract = new ethers.Contract(
      deploymentInfo.contractAddress,
      deploymentInfo.abi,
      _signer
    );
    contractRef.current = _contract;
    return _contract;
  }, []);

  // ── Chain Validator Helper ────────────────────────
  const validateChain = useCallback(async (_provider) => {
    const network       = await _provider.getNetwork();
    const allowedChains = [8453n, 84532n];
    return allowedChains.includes(network.chainId);
  }, []);

  // ── Connect Wallet ────────────────────────────────
  const connectWallet = useCallback(async (walletName = "MetaMask") => {
    try {
      if (!window.ethereum && !window.okxwallet) {
        setError("No wallet found. Please install a wallet first.");
        return;
      }

      setLoading(true);
      setError("");

      let _provider;

      if (walletName === "OKX Wallet" && window.okxwallet) {
        _provider = new ethers.BrowserProvider(window.okxwallet);
      } else if (window.ethereum) {
        _provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        setError("Selected wallet not found. Please install it first.");
        return;
      }

      if (!(await validateChain(_provider))) {
        setError("Please switch to Base or Base Sepolia network.");
        return;
      }

      const accounts  = await _provider.send("eth_requestAccounts", []);
      const _contract = await buildContract(_provider);

      setAccount(accounts[0]);
      await loadData(_contract);
    } catch (err) {
      setError("Wallet connection failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [loadData, buildContract, validateChain]);

  // ── Post Question ─────────────────────────────────
  const postQuestion = useCallback(async (content, category, fee) => {
    if (!contractRef.current) {
      setError("Wallet not connected.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const tx = await contractRef.current.postQuestion(content, category, {
        value: ethers.parseEther(fee)
      });
      await tx.wait();
      await loadData(contractRef.current);
      setView("board");
    } catch (err) {
      setError("Failed to post question: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  // ── Post Answer ───────────────────────────────────
  const postAnswer = useCallback(async (questionId, content) => {
    if (!contractRef.current) {
      setError("Wallet not connected.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const tx = await contractRef.current.postAnswer(questionId, content);
      await tx.wait();
      await loadData(contractRef.current);
      setView("board");
    } catch (err) {
      setError("Failed to post answer: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  // ── Pick Best Answer ──────────────────────────────
  const pickBestAnswer = useCallback(async (questionId, answerId) => {
    if (!contractRef.current) {
      setError("Wallet not connected.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const tx = await contractRef.current.pickBestAnswer(questionId, answerId);
      await tx.wait();
      await loadData(contractRef.current);
    } catch (err) {
      setError("Failed to pick best answer: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  // ── Listen for Account / Chain Changes ───────────────────────────
  useEffect(() => {
    const handleEthAccountsChanged = async (accs) => {
      if (accs.length === 0) {
        disconnectWallet();
      } else {
        try {
          const _provider = new ethers.BrowserProvider(window.ethereum);
          if (!(await validateChain(_provider))) {
            setError("Please switch to Base or Base Sepolia network.");
            disconnectWallet();
            return;
          }
          setAccount(accs[0]);
          const _contract = await buildContract(_provider);
          await loadData(_contract);
        } catch (err) {
          setError("Failed to switch account: " + err.message);
        }
      }
    };

    const handleChainChanged = () => window.location.reload();

    const handleOkxAccountsChanged = async (accs) => {
      if (accs.length === 0) {
        disconnectWallet();
      } else {
        try {
          const _provider = new ethers.BrowserProvider(window.okxwallet);
          if (!(await validateChain(_provider))) {
            setError("Please switch to Base or Base Sepolia network.");
            disconnectWallet();
            return;
          }
          setAccount(accs[0]);
          const _contract = await buildContract(_provider);
          await loadData(_contract);
        } catch (err) {
          setError("Failed to switch account: " + err.message);
        }
      }
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
  }, [disconnectWallet, loadData, buildContract, validateChain]);

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
