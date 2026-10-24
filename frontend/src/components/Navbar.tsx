import React, { useEffect, useState } from 'react'
import {
  MapPin,
  LayoutDashboard,
  TrendingUp,
  MessageSquareCode,
  CheckCircle2,
  BookOpen,
  Award,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react'
import { apiClient, type ApiStatus } from '../api/client'
import { TZ_DISPLAY } from '../../../shared/constants'

export type TabKey = 'map' | 'dashboard' | 'trends' | 'chat' | 'approvals' | 'rag' | 'impact'

interface NavbarProps {
  activeTab: TabKey
  onSelectTab: (tab: TabKey) => void
  onQuickPlan: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, onQuickPlan }) => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    online: false,
    source: 'mock',
    baseUrl: 'http://localhost:8000/api/v1',
  })
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    // Health polling
    const check = () => {
      apiClient.checkHealth().then(setApiStatus)
    }
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // IST Live Clock
    const updateTime = () => {
      const now = new Date()
      const formatted = new Intl.DateTimeFormat('en-IN', {
        timeZone: TZ_DISPLAY,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now)
      setCurrentTime(formatted)
    }
    updateTime()
    const tInterval = setInterval(updateTime, 1000)
    return () => clearInterval(tInterval)
  }, [])

  const navItems: { key: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'map', label: 'Risk Map', icon: <MapPin size={16} /> },
    { key: 'dashboard', label: 'Dashboard & Forecast', icon: <LayoutDashboard size={16} /> },
    { key: 'trends', label: 'Trends & Comparison', icon: <TrendingUp size={16} />, badge: 'Area 4' },
    { key: 'chat', label: 'Agent Chat & Trace', icon: <MessageSquareCode size={16} /> },
    { key: 'approvals', label: 'Approval Inbox', icon: <CheckCircle2 size={16} /> },
    { key: 'rag', label: 'Rules RAG', icon: <BookOpen size={16} /> },
    { key: 'impact', label: 'Impact & Demo', icon: <Award size={16} />, badge: 'Pitch' },
  ]

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(7, 10, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          maxWidth: '1600px',
          margin: '0 auto',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Waste<span style={{ color: 'var(--accent-cyan)' }}>Copilot</span>
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                SOCIOTHON '26
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Agentic Campus Waste Orchestrator
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Live Clock IST */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
            }}
          >
            <Clock size={14} color="var(--accent-cyan)" />
            <span className="font-mono">{currentTime} IST</span>
          </div>

          {/* Backend Connection Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: apiStatus.online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${apiStatus.online ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <Radio
              size={14}
              color={apiStatus.online ? 'var(--accent-emerald)' : 'var(--accent-amber)'}
              className={apiStatus.online ? 'pulse-emerald' : ''}
            />
            <span style={{ color: apiStatus.online ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
              {apiStatus.online ? 'API LIVE' : 'FIXTURE MOCK'}
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                marginLeft: '4px',
              }}
            >
              ({apiStatus.source})
            </span>
          </div>

          {/* Quick Action Plan Trigger */}
          <button
            onClick={onQuickPlan}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            <Sparkles size={14} />
            <span>Plan Tonight</span>
          </button>
        </div>
      </div>

      {/* Nav Tabs Bar */}
      <nav
        style={{
          display: 'flex',
          gap: '4px',
          padding: '0 24px',
          maxWidth: '1600px',
          margin: '0 auto',
          overflowX: 'auto',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.key
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.84rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: isActive ? 'var(--accent-cyan)' : 'inherit' }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)',
                    color: '#ffffff',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
