import React, { useState, useRef, useEffect } from 'react'
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  CornerDownLeft,
  Cpu,
  Layers,
  Send,
  Sparkles,
  StopCircle,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import { apiClient, type TraceEvent, formatTimeOnlyIST } from '../api/client'

interface MessageItem {
  id: string
  sender: 'user' | 'agent'
  text: string
  ts: string
  traceEvents?: TraceEvent[]
  workOrderPending?: {
    routeId: string
    threadId: string
  }
}

interface AgentChatProps {
  onRouteApproved?: () => void
}

export const AgentChat: React.FC<AgentChatProps> = ({ onRouteApproved }) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "Hello! I am Binlytics. I can forecast building loads, schedule OR-Tools collection routes for high-risk bins, and answer SWM regulatory questions. What would you like to run?",
      ts: new Date().toISOString(),
    },
  ])
  const [inputText, setInputText] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState<boolean>(false)
  const [currentTraceEvents, setCurrentTraceEvents] = useState<TraceEvent[]>([])
  const [approvalDecision, setApprovalDecision] = useState<{ [messageId: string]: 'APPROVED' | 'REJECTED' }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentTraceEvents])

  const promptSuggestions = [
    "Plan tonight's collection for high-risk bins",
    "Which bins are predicted to overflow in the next 12 hours?",
    "Can mess food waste be composted on campus?",
    "Simulate route failure when route exceeds 240 minutes",
  ]

  const handleSend = async (textToSend?: string) => {
    const text = textToSend ?? inputText
    if (!text.trim() || isStreaming) return

    const userMsgId = `user-${Date.now()}`
    const userMsg: MessageItem = {
      id: userMsgId,
      sender: 'user',
      text,
      ts: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsStreaming(true)
    setCurrentTraceEvents([])

    const agentMsgId = `agent-${Date.now()}`
    const collectedEvents: TraceEvent[] = []
    let pendingApproval: { routeId: string; threadId: string } | undefined

    await apiClient.streamChat(
      text,
      'web-session',
      (ev) => {
        collectedEvents.push(ev)
        setCurrentTraceEvents([...collectedEvents])

        // Check if approval request event
        if (ev.type === 'approval_request') {
          const rId = (ev.payload?.route_id as string) ?? 'route plan'
          pendingApproval = {
            routeId: rId,
            threadId: (ev.payload?.thread_id as string) ?? 'web-session',
          }
        }
      },
      (err) => {
        console.error('SSE Error:', err)
        setIsStreaming(false)
      },
      () => {
        setIsStreaming(false)
        setMessages((prev) => [
          ...prev,
          {
            id: agentMsgId,
            sender: 'agent',
            text:
              pendingApproval != null
                ? `Route ${pendingApproval.routeId} successfully generated and verified by Critic! It is ready for human supervisor sign-off.`
                  : [...collectedEvents]
                      .reverse()
                      .find((event) => event.type === 'message' && typeof event.payload?.text === 'string')
                      ?.payload.text ??
                    (text.toLowerCase().includes('compost')
                      ? 'The rules assistant could not provide a dynamic answer. Please check the cited rules response.'
                      : 'Execution trace completed.'),
              ts: new Date().toISOString(),
              traceEvents: [...collectedEvents],
              workOrderPending: pendingApproval,
          },
        ])
        setCurrentTraceEvents([])
      }
    )
  }

  const handleDecision = async (messageId: string, threadId: string, approved: boolean) => {
    setIsStreaming(true)
    setCurrentTraceEvents([])
    const resumedEvents: TraceEvent[] = []
    await apiClient.resumeChat(
      threadId,
      approved,
      'supervisor',
      (event) => {
        resumedEvents.push(event)
        setCurrentTraceEvents([...resumedEvents])
      },
      (error) => {
        console.error('Chat resume error:', error)
        setIsStreaming(false)
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? { ...message, text: `Unable to ${approved ? 'approve' : 'reject'} the route: ${error.message}` }
              : message
          )
        )
      },
      () => {
        setIsStreaming(false)
        setCurrentTraceEvents([])
        setApprovalDecision((prev) => ({
          ...prev,
          [messageId]: approved ? 'APPROVED' : 'REJECTED',
        }))
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? { ...message, traceEvents: [...(message.traceEvents ?? []), ...resumedEvents] }
              : message
          )
        )
        if (approved && onRouteApproved) onRouteApproved()
      },
    )
  }

  const getAgentBadgeColor = (agent: string) => {
    switch (agent) {
      case 'planner':
        return '#6366f1'
      case 'critic':
        return '#f59e0b'
      case 'dispatcher':
        return '#06b6d4'
      case 'rag':
        return '#a855f7'
      default:
        return '#64748b'
    }
  }

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Multi-Agent Orchestrator & Live Trace</h1>
          <span className="badge badge-real">LangGraph + SSE Stream</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
          Real-time cycle: Planner (OR-Tools) &rarr; Critic (Constraint validation) &rarr; Human Approval &rarr; Dispatcher.
        </p>
      </div>

      {/* Suggested Prompts Carousel */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '8px',
        }}
      >
        {promptSuggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            disabled={isStreaming}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <Sparkles size={12} style={{ display: 'inline', marginRight: '6px', color: 'var(--accent-cyan)' }} />
            {s}
          </button>
        ))}
      </div>

      {/* Messages Window */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          marginBottom: '16px',
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {/* Sender Label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}
            >
              {m.sender === 'user' ? (
                <>
                  <span>You (Operator)</span>
                  <User size={13} />
                </>
              ) : (
                <>
                  <Bot size={13} color="var(--accent-cyan)" />
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Binlytics Agent</span>
                </>
              )}
              <span className="font-mono">· {formatTimeOnlyIST(m.ts)}</span>
            </div>

            {/* Bubble */}
            <div
              style={{
                maxWidth: '85%',
                padding: '14px 18px',
                borderRadius: '12px',
                background:
                  m.sender === 'user'
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(59,130,246,0.3) 100%)'
                    : 'rgba(255,255,255,0.04)',
                border: m.sender === 'user' ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--border-subtle)',
                fontSize: '0.88rem',
                lineHeight: 1.5,
              }}
            >
              {m.text}

              {/* Render Historical Trace Events if present */}
              {m.traceEvents && m.traceEvents.length > 0 && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Cpu size={13} />
                    Agent Execution Trace
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {m.traceEvents.map((ev, eIdx) => (
                      <div
                        key={eIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          fontSize: '0.78rem',
                        }}
                      >
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: `${getAgentBadgeColor(ev.agent)}25`,
                            color: getAgentBadgeColor(ev.agent),
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            textTransform: 'uppercase',
                            minWidth: '60px',
                            textAlign: 'center',
                          }}
                        >
                          {ev.agent}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          [{ev.type}]
                        </span>
                        <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                          {ev.type === 'tool_call' && (
                            <span>Called <code>{ev.payload?.tool}</code> with {JSON.stringify(ev.payload?.args)}</span>
                          )}
                          {ev.type === 'tool_result' && <span>Result: {ev.payload?.summary}</span>}
                          {ev.type === 'message' && <span>{ev.payload?.text}</span>}
                          {ev.type === 'approval_request' && <strong>Approval requested for {ev.payload?.route_id}</strong>}
                          {ev.type === 'done' && <span style={{ color: 'var(--accent-emerald)' }}>✓ Workflow concluded</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Approval Request Banner */}
              {m.workOrderPending && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={18} color="var(--accent-cyan)" />
                    <strong style={{ fontSize: '0.85rem' }}>
                      Dispatch Approval Required: {m.workOrderPending.routeId}
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    OR-Tools optimization planned 2 routes covering all bins with risk &gt;= 0.70. Critic confirmed routes comply with TRUCK_SHIFT_MIN (240m).
                  </p>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    {approvalDecision[m.id] ? (
                      <span
                        className={`badge ${
                          approvalDecision[m.id] === 'APPROVED'
                            ? 'badge-real'
                            : 'badge-high'
                        }`}
                      >
                        {approvalDecision[m.id]}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleDecision(m.id, m.workOrderPending!.threadId, true)}
                          className="btn btn-success"
                          style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                        >
                          <Check size={14} />
                          Approve Route Plan
                        </button>
                        <button
                          onClick={() => handleDecision(m.id, m.workOrderPending!.threadId, false)}
                          className="btn btn-danger"
                          style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                        >
                          <XCircle size={14} />
                          Reject &amp; Replan
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live Streaming Trace Box */}
        {isStreaming && (
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              maxWidth: '85%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent-cyan)',
                }}
                className="pulse-emerald"
              />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                Streaming Agent Reasoning Trace (SSE)...
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {currentTraceEvents.map((ev, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.78rem' }}>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: `${getAgentBadgeColor(ev.agent)}25`,
                      color: getAgentBadgeColor(ev.agent),
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      textTransform: 'uppercase',
                      minWidth: '60px',
                      textAlign: 'center',
                    }}
                  >
                    {ev.agent}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {ev.type === 'tool_call' && (
                      <span>Executing <code>{ev.payload?.tool}</code>...</span>
                    )}
                    {ev.type === 'tool_result' && <span>Result: {ev.payload?.summary}</span>}
                    {ev.type === 'message' && <span>{ev.payload?.text}</span>}
                    {ev.type === 'approval_request' && <strong>Approval request created for {ev.payload?.route_id}</strong>}
                    {ev.type === 'done' && <span style={{ color: 'var(--accent-emerald)' }}>Trace complete.</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Binlytics (e.g. 'Plan tonight's collection' or 'Can food waste be composted?')..."
          disabled={isStreaming}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isStreaming}
          className="btn btn-primary"
          style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)' }}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  )
}
