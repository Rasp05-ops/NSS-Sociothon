import React, { useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { apiClient, type RagAnswer } from '../api/client'

export const RulesAssistant: React.FC = () => {
  const [query, setQuery] = useState<string>('Can mess food waste be composted on campus?')
  const [answerData, setAnswerData] = useState<RagAnswer | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const exampleQuestions = [
    'Can mess food waste be composted on campus?',
    'What is the procedure for disposing hazardous lab chemicals and batteries?',
    'What are the mandatory duties of bulk waste generators under SWM Rules 2016?',
    'Who is the current prime minister of Australia? (Out-of-Scope Demo)',
  ]

  const handleAsk = async (questionToAsk?: string) => {
    const q = questionToAsk ?? query
    if (!q.trim() || loading) return
    setLoading(true)
    const res = await apiClient.askRag(q)
    setAnswerData(res)
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Cited Rules Assistant (Agentic RAG)</h1>
          <span className="badge badge-real">BM25 + BGE Embeddings + RRF</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Answers strictly synthesized from verified campus environmental guidelines and SWM Rules 2016 with clause citations. Safely abstains on out-of-scope queries.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAsk()
          }}
          style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask any campus waste regulation or compliance rule..."
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 16px 12px 46px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.9rem' }}
          >
            {loading ? 'Searching...' : 'Ask Rules'}
          </button>
        </form>

        {/* Suggestion Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            Try queries:
          </span>
          {exampleQuestions.map((eq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(eq)
                handleAsk(eq)
              }}
              style={{
                background: eq.includes('Out-of-Scope') ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${eq.includes('Out-of-Scope') ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-subtle)'}`,
                color: eq.includes('Out-of-Scope') ? 'var(--risk-high)' : 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      {/* Answer & Citation Card */}
      {answerData && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Abstained state banner vs Answer */}
          {answerData.abstained ? (
            <div
              style={{
                padding: '20px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              <ShieldAlert size={28} color="var(--risk-high)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '1rem', color: 'var(--risk-high)' }}>
                  Out of Scope — Safe Abstention Triggered
                </strong>
                <p style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {answerData.answer}
                </p>
                <div
                  style={{
                    marginTop: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                  }}
                >
                  <AlertCircle size={12} />
                  <span>RRF similarity score fell below ABSTAIN_THRESHOLD. Agent refrains from hallucinating.</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={20} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
                  Grounded &amp; Cited Regulatory Answer
                </span>
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {answerData.answer}
              </p>
            </div>
          )}

          {/* Citations List */}
          {answerData.citations && answerData.citations.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <BookOpen size={16} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  Verified Regulatory Citations ({answerData.citations.length})
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                {answerData.citations.map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>{c.title}</strong>
                      <span className="badge badge-low" style={{ fontSize: '0.68rem' }}>
                        {(c.score * 100).toFixed(0)}% match
                      </span>
                    </div>

                    {c.clause && (
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--accent-cyan)',
                          background: 'rgba(6, 182, 212, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          alignSelf: 'flex-start',
                        }}
                      >
                        {c.clause}
                      </span>
                    )}

                    <blockquote
                      style={{
                        margin: '4px 0 0',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        fontStyle: 'italic',
                        borderLeft: '2px solid var(--accent-primary)',
                        paddingLeft: '10px',
                      }}
                    >
                      &ldquo;{c.snippet}&rdquo;
                    </blockquote>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
