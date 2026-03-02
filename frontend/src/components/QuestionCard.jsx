import { useState } from "react";

export default function QuestionCard({
  question, account, onAnswer, onPickBest
}) {
  const [expanded,    setExpanded]    = useState(false);
  const [pickingId,   setPickingId]   = useState(null);

  const isAsker         = account?.toLowerCase() === question.asker.toLowerCase();
  const tipPool         = parseFloat(question.tipPool).toFixed(6);
  const answererEarning = (parseFloat(question.tipPool) * 0.8).toFixed(6);
  const hasAnswers      = question.answers.length > 0;
  const bestAnswer      = question.answers.find((a) => a.isBest);

  const handlePickBest = async (questionId, answerId) => {
    setPickingId(answerId);
    await onPickBest(questionId, answerId);
    setPickingId(null);
  };

  return (
    <div className={`question-card ${!question.isOpen ? "closed" : ""}`}>

      {/* ── Card Header ──────────────────────── */}
      <div className="card-header">
        <div className="card-header-left">
          <span className="category-tag">{question.category}</span>
          <span className="question-id">#{question.id}</span>
        </div>
        <span className={`status-badge ${question.isOpen ? "open" : "closed"}`}>
          {question.isOpen ? "🟢 Open" : "🔴 Closed"}
        </span>
      </div>

      {/* ── Question Content ─────────────────── */}
      <p className="question-content">
        {question.content.length > 120 && !expanded
          ? question.content.slice(0, 120) + "..."
          : question.content}
      </p>
      {question.content.length > 120 && (
        <button
          className="read-more"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less ↑" : "Read more ↓"}
        </button>
      )}

      {/* ── Card Meta ────────────────────────── */}
      <div className="card-meta">
        <span>👤 {question.asker.slice(0, 10)}...</span>
        <span>💬 {question.answerCount} answer{question.answerCount !== 1 ? "s" : ""}</span>
        <span>🕐 {question.createdAt}</span>
        {isAsker && <span className="your-question">✏️ Your Question</span>}
      </div>

      {/* ── Tip Pool ─────────────────────────── */}
      <div className="tip-pool">
        <div className="tip-pool-left">
          <span className="tip-label">🏆 Prize Pool</span>
          <span className="tip-amount">{tipPool} ETH</span>
        </div>
        <div className="tip-pool-right">
          <span className="tip-label">💸 Answerer Earns</span>
          <span className="tip-earn">{answererEarning} ETH</span>
        </div>
      </div>

      {/* ── Best Answer Highlight ─────────────── */}
      {bestAnswer && (
        <div className="best-answer-highlight">
          <p className="best-answer-label">🏆 Best Answer</p>
          <p className="best-answer-text">
            {bestAnswer.content.length > 100
              ? bestAnswer.content.slice(0, 100) + "..."
              : bestAnswer.content}
          </p>
          <div className="best-answer-meta">
            <span>👤 {bestAnswer.answerer.slice(0, 10)}...</span>
            <span className="best-earned">Earned {bestAnswer.tipAmount} ETH</span>
          </div>
        </div>
      )}

      {/* ── Answers List ─────────────────────── */}
      {hasAnswers && question.isOpen && (
        <div className="answers-list">
          <button
            className="toggle-answers"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? `▲ Hide Answers`
              : `▼ View ${question.answers.length} Answer${question.answers.length !== 1 ? "s" : ""}`}
          </button>

          {expanded && question.answers.map((a) => (
            <div
              key={a.id}
              className={`answer-item ${a.isBest ? "best-answer" : ""}`}
            >
              {/* Best Answer Badge */}
              {a.isBest && (
                <div className="best-answer-badge">
                  🏆 Best Answer — Earned {a.tipAmount} ETH
                </div>
              )}

              {/* Answer Content */}
              <p>{a.content}</p>

              {/* Answer Footer */}
              <div className="answer-footer">
                <span>👤 {a.answerer.slice(0, 10)}...</span>
                <span>🕐 {a.createdAt}</span>

                {/* Pick Best Button — only visible to asker */}
                {isAsker &&
                  question.isOpen &&
                  !question.bestAnswerPicked &&
                  !a.isBest && (
                    <button
                      className="btn btn-pick"
                      onClick={() => handlePickBest(question.id, a.id)}
                      disabled={pickingId === a.id}
                    >
                      {pickingId === a.id
                        ? "⏳ Picking..."
                        : "✅ Pick as Best"}
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Asker Prompt — no answers yet ────── */}
      {isAsker && question.isOpen && !hasAnswers && (
        <div className="waiting-notice">
          ⏳ Waiting for answers... Share your question to get responses faster!
        </div>
      )}

      {/* ── Asker Prompt — has answers ───────── */}
      {isAsker &&
        question.isOpen &&
        hasAnswers &&
        !question.bestAnswerPicked && (
          <div className="pick-prompt">
            🎯 You have {question.answerCount} answer{question.answerCount !== 1 ? "s" : ""}!
            Expand to review and pick the best one to release the prize pool.
          </div>
        )}

      {/* ── Answer Button — for non-askers ───── */}
      {question.isOpen && !isAsker && (
        <button className="btn btn-answer" onClick={onAnswer}>
          💬 Answer & Earn {answererEarning} ETH
        </button>
      )}

      {/* ── Closed Footer ────────────────────── */}
      {!question.isOpen && (
        <div className="closed-footer">
          🔒 Closed · Prize distributed ·
          {bestAnswer && (
            <span> Winner earned {bestAnswer.tipAmount} ETH</span>
          )}
        </div>
      )}
    </div>
  );
          }
