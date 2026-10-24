import React, { useState } from 'react'
import { Navbar, type TabKey } from './components/Navbar'
import { RiskMap } from './components/RiskMap'
import { Dashboard } from './components/Dashboard'
import { TrendsComparison } from './components/TrendsComparison'
import { AgentChat } from './components/AgentChat'
import { ApprovalInbox } from './components/ApprovalInbox'
import { RulesAssistant } from './components/RulesAssistant'
import { ImpactPitch } from './components/ImpactPitch'
import type { Route } from './api/client'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('map')
  const [previewRoutes, setPreviewRoutes] = useState<Route[]>([])

  const handleQuickPlan = () => {
    setActiveTab('chat')
  }

  const handlePreviewRouteOnMap = (routes: Route[]) => {
    setPreviewRoutes(routes)
    setActiveTab('map')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onQuickPlan={handleQuickPlan}
      />

      {/* Main Content View */}
      <main style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'map' && (
          <RiskMap
            previewRoutes={previewRoutes}
            onOpenChatWithPlan={handleQuickPlan}
          />
        )}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'trends' && <TrendsComparison />}
        {activeTab === 'chat' && (
          <AgentChat
            onRouteApproved={() => {
              // Refresh or notify
            }}
          />
        )}
        {activeTab === 'approvals' && (
          <ApprovalInbox
            onPreviewRouteOnMap={handlePreviewRouteOnMap}
          />
        )}
        {activeTab === 'rag' && <RulesAssistant />}
        {activeTab === 'impact' && (
          <ImpactPitch />
        )}
      </main>
    </div>
  )
}

export default App
