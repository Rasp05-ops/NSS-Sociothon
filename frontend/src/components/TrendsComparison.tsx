import React, { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import {
  Award,
  Calendar,
  ChevronDown,
  Info,
  Medal,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { apiClient, type BuildingComparison, type CompareResponse, type TrendResponse } from '../api/client'
import { BUILDING_IDS } from '../../../shared/constants'

export const TrendsComparison: React.FC = () => {
  const [granularity, setGranularity] = useState<'day' | 'week'>('day')
  const [trendBuilding, setTrendBuilding] = useState<string>('all')
  const [trendData, setTrendData] = useState<TrendResponse | null>(null)
  const [compareData, setCompareData] = useState<CompareResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadTrends()
  }, [granularity, trendBuilding])

  useEffect(() => {
    loadCompare()
  }, [])

  const loadTrends = async () => {
    setLoading(true)
    const bid = trendBuilding === 'all' ? undefined : trendBuilding
    const res = await apiClient.getTrends(bid, granularity, 30)
    setTrendData(res)
    setLoading(false)
  }

  const loadCompare = async () => {
    const res = await apiClient.getCompare(7)
    setCompareData(res)
  }

  // Format trend chart points
  const formattedTrendPoints = (trendData?.points ?? []).map((pt, i) => {
    const d = new Date(pt.ts)
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    const label =
      granularity === 'day'
        ? d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
        : `Week of ${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
    return {
      date: label,
      kg: Math.round(pt.kg * 10) / 10,
      isWeekend,
      isSpike: pt.kg > 550, // Highlight festival/banquet spike
    }
  })

  // Sort comparison buildings by rank (1 to 6)
  const sortedBuildings = [...(compareData?.buildings ?? [])].sort((a, b) => a.rank - b.rank)

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Campus Trends & Building Comparison
          </h1>
          <span className="badge badge-real">Area-4 Core Feature</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Normalized waste footprint per person/day, longitudinal trends, and hostel eco-benchmarking.
        </p>
      </div>

      {/* Section 1: Historical Trends (C10) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Waste Generation Trends</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
              Historical volume aggregated across Public and Hostel Bins.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Building scope */}
            <select
              value={trendBuilding}
              onChange={(e) => setTrendBuilding(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            >
              <option value="all" style={{ background: '#0f172a' }}>Campus-Wide</option>
              {BUILDING_IDS.map((bid) => (
                <option key={bid} value={bid} style={{ background: '#0f172a' }}>
                  {bid}
                </option>
              ))}
            </select>

            {/* Daily / Weekly toggle */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                onClick={() => setGranularity('day')}
                style={{
                  background: granularity === 'day' ? 'var(--accent-primary)' : 'transparent',
                  color: granularity === 'day' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Daily
              </button>
              <button
                onClick={() => setGranularity('week')}
                style={{
                  background: granularity === 'week' ? 'var(--accent-primary)' : 'transparent',
                  color: granularity === 'week' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Weekly
              </button>
            </div>
          </div>
        </div>

        {/* Trend Bar Chart */}
        <div style={{ height: '280px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedTrendPoints} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} angle={-30} textAnchor="end" />
              <YAxis stroke="#64748b" fontSize={12} unit=" kg" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload
                    return (
                      <div
                        style={{
                          background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div style={{ color: '#94a3b8' }}>{d.date}</div>
                        <div style={{ fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                          Collected: {d.kg} kg
                        </div>
                        {d.isWeekend && (
                          <div style={{ color: '#fbbf24', fontSize: '0.72rem', marginTop: '2px' }}>
                            Weekend Activity
                          </div>
                        )}
                        {d.isSpike && (
                          <div style={{ color: '#f43f5e', fontSize: '0.72rem', fontWeight: 600, marginTop: '2px' }}>
                            Spike Event Surge
                          </div>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="kg" radius={[4, 4, 0, 0]}>
                {formattedTrendPoints.map((entry, index) => {
                  let fillColor = '#6366f1'
                  if (entry.isSpike) fillColor = '#f43f5e'
                  else if (entry.isWeekend) fillColor = '#a855f7'
                  return <Cell key={`cell-${index}`} fill={fillColor} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', background: '#6366f1', borderRadius: '2px' }} />
            <span>Regular Weekday</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', background: '#a855f7', borderRadius: '2px' }} />
            <span>Weekend Surge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', background: '#f43f5e', borderRadius: '2px' }} />
            <span>Event / Banquet Outlier</span>
          </div>
        </div>
      </div>

      {/* Section 2: Building Footprint Benchmark (C11) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Footprint Bar Chart: kg per person day */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Waste per Person / Day</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Normalized by resident population. Lower is better (Rank 1).
              </p>
            </div>
            <span className="badge badge-low">Best: LIB01 (0.169 kg)</span>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedBuildings}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#64748b" fontSize={11} unit=" kg" domain={[0, 0.25]} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={110} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as BuildingComparison
                      return (
                        <div
                          style={{
                            background: '#0f172a',
                            border: '1px solid rgba(255,255,255,0.15)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                          }}
                        >
                          <strong>{d.name} ({d.building_id})</strong>
                          <div style={{ color: '#38bdf8', marginTop: '4px' }}>
                            Rate: <strong>{d.kg_per_person_day.toFixed(3)} kg/person/day</strong>
                          </div>
                          <div style={{ color: '#94a3b8' }}>Rank: #{d.rank} of 6</div>
                          <div style={{ color: '#94a3b8' }}>Segregation: {d.segregation_pct.toFixed(1)}%</div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="kg_per_person_day" radius={[0, 4, 4, 0]}>
                  {sortedBuildings.map((entry, index) => {
                    let fillColor = '#6366f1'
                    if (entry.rank === 1) fillColor = '#10b981' // Best in green
                    else if (entry.rank === 6) fillColor = '#f43f5e' // Worst in red
                    else if (entry.rank === 2) fillColor = '#06b6d4'
                    return <Cell key={`cell-comp-${index}`} fill={fillColor} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Highlights / Nudge Simulator Notice */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Hostel Eco-Nudge Insights</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
              Area-4 Behavioural feedback and segregation performance.
            </p>
          </div>

          {/* Leader Spotlight Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.1) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={24} color="#34d399" />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                Eco Leader of the Week
              </span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Library &amp; Hostel 2</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Lowest waste intensity (0.169 - 0.182 kg/person/day) and 84.1% source segregation compliance.
              </p>
            </div>
          </div>

          {/* Intervention Needed Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={24} color="var(--risk-high)" />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--risk-high)', fontWeight: 700, textTransform: 'uppercase' }}>
                Behavioral Nudge Target
              </span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Central Mess (MESS01)</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Generates 0.222 kg/person/day (highest on campus). Food waste bio-composting nudge deployed after Day 15 yields -8% reduction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Detailed Comparison Table (C11) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
          Campus Building League Table (7-Day Audits)
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 14px' }}>Rank</th>
                <th style={{ padding: '12px 14px' }}>Building</th>
                <th style={{ padding: '12px 14px' }}>Type</th>
                <th style={{ padding: '12px 14px' }}>7d Total (kg)</th>
                <th style={{ padding: '12px 14px' }}>kg / Person / Day</th>
                <th style={{ padding: '12px 14px' }}>WoW Change</th>
                <th style={{ padding: '12px 14px' }}>Source Segregation</th>
                <th style={{ padding: '12px 14px' }}>Recycling Share</th>
              </tr>
            </thead>
            <tbody>
              {sortedBuildings.map((b) => {
                const isBest = b.rank === 1
                const isWorst = b.rank === 6
                return (
                  <tr
                    key={b.building_id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isBest
                        ? 'rgba(16, 185, 129, 0.05)'
                        : isWorst
                        ? 'rgba(244, 63, 94, 0.04)'
                        : 'transparent',
                    }}
                  >
                    <td style={{ padding: '14px', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {b.rank === 1 && <Medal size={16} color="#fbbf24" />}
                        {b.rank === 2 && <Medal size={16} color="#94a3b8" />}
                        {b.rank === 3 && <Medal size={16} color="#b45309" />}
                        <span>#{b.rank}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', fontWeight: 600 }}>
                      <div>{b.name}</div>
                      <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {b.building_id}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {b.kind}
                    </td>
                    <td className="font-mono" style={{ padding: '14px', fontWeight: 600 }}>
                      {b.kg_period.toFixed(1)} kg
                    </td>
                    <td className="font-mono" style={{ padding: '14px', fontWeight: 700, color: isBest ? 'var(--accent-emerald)' : 'inherit' }}>
                      {b.kg_per_person_day.toFixed(3)}
                    </td>
                    <td className="font-mono" style={{ padding: '14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: b.wow_change_pct <= 0 ? 'var(--accent-emerald)' : 'var(--risk-high)',
                          fontWeight: 600,
                        }}
                      >
                        {b.wow_change_pct <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                        {b.wow_change_pct.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-mono" style={{ minWidth: '42px' }}>
                          {b.segregation_pct.toFixed(1)}%
                        </span>
                        <div
                          style={{
                            width: '80px',
                            height: '6px',
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${b.segregation_pct}%`,
                              height: '100%',
                              background: 'var(--accent-emerald)',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="font-mono" style={{ padding: '14px', color: 'var(--accent-cyan)' }}>
                      {b.recycling_pct.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
