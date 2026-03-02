import { useState } from "react";

export default function AnswerQuestion({
  question, onAnswer, loading, onBack
}) {
  const [content,   setContent]   = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = async () => {
    if (!content.trim()) return alert("Please write your answer.");
    if (content.trim().length < 20)
      return alert("Please write a more detailed answer (min 20 characters).");
    await onAnswer(question.id, content);
    setContent("");
    setSubmitted(true);
  };

  const answererEarning = (parseFloat(question.tipPool) * 0.8).toFixed(6);
  const isAsker = false; // Handled in parent — askers cannot answer

  return (
    <div className="answer-question">

      {/* ── Back Button ──────────────────────── */}
      <button className="btn-back" onClick={onBack}>
        ← Back to Board
      </button>

      {/* ── Question Preview ─────────────────── */}
      <div className="question-preview">
        <div className="question-preview-header">
          <span className="category-tag">{question.category}</span>
          <span className={`status-badge ${question.isOpen ? "open" : "closed"}`}>
            {question.isOpen ? "🟢 Open" : "🔴 Closed"}
          </span>
        </div>
        <h3>{question.content}</h3>
        <div className="question-meta">
          <span>👤 {question.asker.slice(0, 10)}...</span>
          <span>💬 {question.answerCount} answer{question.answerCount !== 1 ? "s" : ""}</span>
          <span>🕐 {question.createdAt}</span>
        </div>

        {/* Tip Pool Highlight */}
        <div className="earning-highlight">
          <div className="earning-left">
            <span className="earning-label">🏆 Prize Pool</span>
            <span className="earning-amount">{question.tipPool} ETH</span>
          </div>
          <div className="earning-right">
            <span className="earning-label">💸 You Could Earn</span>
            <span className="earning-you">{answererEarning} ETH</span>
          </div>
        </div>
      </div>

      {/* ── Existing Answers ─────────────────── */}
      {question.answers.length > 0 && (
        <div className="existing-answers">
          <h4>
            💬 {question.answers.length} Existing Answer{question.answers.length !== 1 ? "s" : ""}
          </h4>
          {question.answers.map((a) => (
            <div
              key={a.id}
              className={`answer-preview ${a.isBest ? "best" : ""}`}
            >
              {a.isBest && (
                <span className="best-badge">
                  🏆 Best Answer — Earned {a.tipAmount} ETH
                </span>
              )}
              <p>{a.content}</p>
              <div className="answer-meta-row">
                <span>👤 {a.answerer.slice(0, 10)}...</span>
                <span>🕐 {a.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Answer Form or Closed Notice ─────── */}
      {question.isOpen ? (
        <div className="answer-form">
          <div className="answer-form-header">
            <h4>✍️ Write Your Answer</h4>
            <span className="earning-badge">
              Earn up to {answererEarning} ETH
            </span>
          </div>

          <p className="answer-hint">
            Write a clear, detailed, and helpful answer.
            The asker will pick the best one and you will
            earn {answererEarning} ETH directly to your wallet.
          </p>

          {/* Answer Tips */}
          <div className="answer-tips">
            <p className="answer-tips-title">💡 Tips for a great answer:</p>
            <ul>
              <li>Be specific and give concrete examples</li>
              <li>Back up your advice with reasoning</li>
              <li>Keep it clear and easy to understand</li>
              <li>Address the question directly</li>
            </ul>
          </div>

          {/* Textarea */}
          <div className="form-group">
            <label>Your Answer</label>
            <textarea
              placeholder="Write a clear, helpful, and detailed answer here. The more value you provide, the more likely you are to be picked as the best answer..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={7}
              maxLength={1000}
              disabled={loading || submitted}
            />
            <div className="textarea-footer">
              <span className={`char-count ${content.length < 20 ? "warn" : ""}`}>
                {content.length} / 1000
                {content.length < 20 && content.length > 0 && (
                  <span className="min-warn"> (min 20 chars)</span>
                )}
              </span>
              {content.length >= 20 && (
                <span className="ready-check">✅ Ready to submit</span>
              )}
            </div>
          </div>

          {/* Payout Breakdown */}
          <div className="payout-breakdown">
            <p className="fee-title">💰 Payout If You Win</p>
            <div className="fee-row success">
              <span>🏆 Your Earnings</span>
              <span>{answererEarning} ETH (80% of pool)</span>
            </div>
            <div className="fee-row muted">
              <span>⚙️ Platform Fee</span>
              <span>
                {(parseFloat(question.tipPool) * 0.2).toFixed(6)} ETH (20%)
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            className="btn btn-primary btn-full"
            onClick={handleAnswer}
            disabled={
              loading ||
              submitted ||
              !content.trim() ||
              content.trim().length < 20
            }
          >
            {loading    ? "⏳ Submitting to Base..." :
             submitted  ? "✅ Answer Submitted!" :
             "💬 Submit Answer"}
          </button>

          {/* Success Message */}
          {submitted && (
            <div className="submit-success">
              <span>🎉</span>
              <div>
                <p className="success-title">Answer submitted successfully!</p>
                <p className="success-sub">
                  Your answer is now live on Base. The asker will
                  review all answers and pick the best one.
                  Good luck earning {answererEarning} ETH! 🔥
                </p>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="post-disclaimer">
            ⚠️ Answers are stored on Base blockchain and cannot be edited
            or deleted after submission.
          </p>
        </div>
      ) : (
        <div className="closed-section">
          <div className="closed-notice">
            🔒 This question is closed.
          </div>

          {/* Show winner if best answer exists */}
          {question.answers.some((a) => a.isBest) && (
            <div className="winner-card">
              <p className="winner-title">🏆 Best Answer Winner</p>
              {question.answers
                .filter((a) => a.isBest)
                .map((a) => (
                  <div key={a.id} className="winner-info">
                    <div className="winner-address">
                      <span>👤 {a.answerer.slice(0, 16)}...</span>
                      <span className="winner-earned">
                        Earned {a.tipAmount} ETH
                      </span>
                    </div>
                    <p className="winner-answer">{a.content}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
                }
