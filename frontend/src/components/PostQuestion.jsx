import { useState } from "react";

export default function PostQuestion({ onPost, loading }) {
  const [content,   setContent]   = useState("");
  const [category,  setCategory]  = useState("General");
  const [fee,       setFee]       = useState("0.0001");

  const categories = [
    "General",
    "DeFi",
    "Security",
    "Trading",
    "NFTs",
    "Development",
    "Wallets",
    "Legal",
    "Tax"
  ];

  const handlePost = async () => {
    if (!content.trim()) return alert("Please enter your question.");
    if (parseFloat(fee) < 0.0001)
      return alert("Minimum fee is 0.0001 ETH.");
    await onPost(content, category, fee);
    setContent("");
    setFee("0.0001");
  };

  const estimatedTipPool  = (parseFloat(fee || 0) * 0.8).toFixed(6);
  const ownerCut          = (parseFloat(fee || 0) * 0.2).toFixed(6);

  return (
    <div className="post-question">
      <h2>❓ Ask a Question</h2>
      <p className="subtitle">
        Pay a minimum of 0.0001 ETH to post your question.
        80% of your payment goes directly to the best answerer.
      </p>

      {/* Question Input */}
      <div className="form-group">
        <label>Your Question</label>
        <textarea
          placeholder="What do you want to know? Be clear and specific for better answers..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={500}
        />
        <span className="char-count">{content.length} / 500</span>
      </div>

      {/* Category & Fee */}
      <div className="form-row">
        <div className="form-group">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tip Amount (ETH)</label>
          <input
            type="number"
            min="0.0001"
            step="0.0001"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="0.0001"
          />
          <span className="hint">
            Min: 0.0001 ETH · Answerer earns {estimatedTipPool} ETH
          </span>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="fee-breakdown">
        <p className="fee-title">💰 Fee Breakdown</p>
        <div className="fee-row">
          <span>💸 You Pay</span>
          <span>{parseFloat(fee || 0).toFixed(6)} ETH</span>
        </div>
        <div className="fee-row success">
          <span>🏆 Best Answerer Earns</span>
          <span>{estimatedTipPool} ETH (80%)</span>
        </div>
        <div className="fee-row muted">
          <span>⚙️ Platform Fee</span>
          <span>{ownerCut} ETH (20%)</span>
        </div>
        <div className="fee-divider" />
        <div className="fee-row muted small">
          <span>ℹ️ Platform fee goes to contract owner</span>
          <span>immediately on posting</span>
        </div>
      </div>

      {/* How It Works */}
      <div className="how-it-works">
        <p className="how-title">📋 How It Works</p>
        <div className="how-steps">
          <div className="how-step">
            <span className="how-num">1</span>
            <p>You pay ETH to post your question publicly on Base</p>
          </div>
          <div className="how-step">
            <span className="how-num">2</span>
            <p>Anyone can answer your question for free</p>
          </div>
          <div className="how-step">
            <span className="how-num">3</span>
            <p>You pick the best answer and 80% of your tip goes to them</p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        className="btn btn-primary btn-full"
        onClick={handlePost}
        disabled={loading || !content.trim() || parseFloat(fee) < 0.0001}
      >
        {loading ? "⏳ Posting to Base..." : "🔥 Post Question"}
      </button>

      {/* Disclaimer */}
      <p className="post-disclaimer">
        ⚠️ Transactions on Base are irreversible.
        Double check your question before posting.
      </p>
    </div>
  );
      }
