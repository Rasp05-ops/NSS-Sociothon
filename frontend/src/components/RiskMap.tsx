import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  Truck,
  X,
  Zap,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { apiClient, type Bin, type Reading, type Route, formatToIST } from '../api/client'
import { DEPOT, BUILDING_IDS } from '../../../shared/constants'

// Custom depot pin icon
const depotIcon = L.divIcon({
  className: 'custom-depot-pin',
  html: `<div style="
    background: #6366f1;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 15px rgba(99,102,241,0.7);
    border: 2px solid white;
    font-weight: bold;
    font-size: 14px;
  ">🚛</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

interface RiskMapProps {
  previewRoutes?: Route[]
  onOpenChatWithPlan?: () => void
}

export const RiskMap: React.FC<RiskMapProps> = ({ previewRoutes, onOpenChatWithPlan }) => {
  const [bins, setBins] = useState<Bin[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [sourceBadge, setSourceBadge] = useState<'mock' | 'real'>('mock')
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all')
  const [minRisk, setMinRisk] = useState<number>(0.0)
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null)
  const [binReadings, setBinReadings] = useState<Reading[]>([])
  const [readingsLoading, setReadingsLoading] = useState<boolean>(false)

  // Center on campus coordinates
  const campusCenter: [number, number] = [29.865, 77.897]

  useEffect(() => {
    loadBins()
  }, [selectedBuilding, minRisk])

  const loadBins = async () => {
    setLoading(true)
    const bid = selectedBuilding === 'all' ? undefined : selectedBuilding
    const { data, source } = await apiClient.getBins(bid, minRisk)
    setBins(data)
    setSourceBadge(source)
    setLoading(false)
  }

  const handleSelectBin = async (bin: Bin) => {
    setSelectedBin(bin)
    setReadingsLoading(true)
    const { data } = await apiClient.getBinReadings(bin.bin_id)
    setBinReadings(data)
    setReadingsLoading(false)
  }

  // Calculate statistics
  const totalCount = bins.length
  const highRiskCount = bins.filter((b) => b.risk_level === 'high').length
  const mediumRiskCount = bins.filter((b) => b.risk_level === 'medium').length
  const lowRiskCount = bins.filter((b) => b.risk_level === 'low').length

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#f43f5e'
      case 'medium':
        return '#f59e0b'
      default:
        return '#10b981'
    }
  }

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 110px)', width: '100%', overflow: 'hidden' }}>
      {/* Top Filter and Risk Stats Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 500,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          maxWidth: '90%',
        }}
      >
        {/* Filter Panel */}
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 14px',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <Filter size={14} color="var(--accent-cyan)" />
            <span>Building:</span>
          </div>
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Buildings (40 bins)</option>
            {BUILDING_IDS.map((bid) => (
              <option key={bid} value={bid}>
                {bid}
              </option>
            ))}
          </select>

          <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <span>Min Risk:</span>
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.1"
              value={minRisk}
              onChange={(e) => setMinRisk(parseFloat(e.target.value))}
              style={{ width: '70px', cursor: 'pointer' }}
            />
            <span className="font-mono" style={{ color: minRisk > 0 ? 'var(--accent-rose)' : 'inherit' }}>
              {minRisk.toFixed(1)}
            </span>
          </div>

          <span className={`badge badge-${sourceBadge}`}>{sourceBadge}</span>
        </div>

        {/* Risk Breakdown Counts */}
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 14px',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--risk-high)',
              }}
              className="pulse-high"
            />
            <span style={{ color: 'var(--text-secondary)' }}>High Risk:</span>
            <strong style={{ color: 'var(--risk-high)' }}>{highRiskCount}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--risk-med)',
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>Medium:</span>
            <strong style={{ color: 'var(--risk-med)' }}>{mediumRiskCount}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--risk-low)',
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>Low:</span>
            <strong style={{ color: 'var(--risk-low)' }}>{lowRiskCount}</strong>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>({totalCount} shown)</span>
        </div>

        {highRiskCount > 0 && onOpenChatWithPlan && (
          <button
            onClick={onOpenChatWithPlan}
            className="btn btn-primary"
            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
          >
            <Sparkles size={13} />
            <span>Optimize Routes for {highRiskCount} Bins</span>
          </button>
        )}
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={campusCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        className="dark-tiles"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Central Waste Depot */}
        <Marker position={[DEPOT.lat, DEPOT.lon]} icon={depotIcon}>
          <Popup>
            <div style={{ fontSize: '0.85rem' }}>
              <strong>{DEPOT.name}</strong>
              <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>Central logistics hub & truck depot</p>
              <p className="font-mono" style={{ margin: '2px 0 0', fontSize: '0.75rem' }}>
                Lat: {DEPOT.lat}, Lon: {DEPOT.lon}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* 40 Bins as Dynamic Circle Markers */}
        {bins.map((bin) => {
          const isSelected = selectedBin?.bin_id === bin.bin_id
          const color = getRiskColor(bin.risk_level)
          const radius = Math.max(6, Math.min(14, (bin.fill_pct / 100) * 12 + 4))

          return (
            <CircleMarker
              key={bin.bin_id}
              center={[bin.lat, bin.lon]}
              radius={radius}
              pathOptions={{
                color: isSelected ? '#ffffff' : color,
                fillColor: color,
                fillOpacity: bin.risk_level === 'high' ? 0.9 : 0.7,
                weight: isSelected ? 3 : 1.5,
              }}
              eventHandlers={{
                click: () => handleSelectBin(bin),
              }}
            >
              <Popup>
                <div style={{ fontSize: '0.82rem', minWidth: '160px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong className="font-mono">{bin.bin_id}</strong>
                    <span className={`badge badge-${bin.risk_level}`}>{bin.risk_level}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>
                    Building: <strong>{bin.building_id}</strong>
                  </p>
                  <p style={{ margin: '2px 0 0' }}>
                    Fill: <strong>{bin.fill_pct.toFixed(1)}%</strong>
                  </p>
                  <p style={{ margin: '2px 0 0' }}>
                    Overflow Risk: <strong>{(bin.risk_overflow * 100).toFixed(0)}%</strong>
                  </p>
                  <button
                    onClick={() => handleSelectBin(bin)}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      background: 'var(--accent-primary)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '4px',
                      padding: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    View Details & Sparkline
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}

        {/* Optional Route Polylines preview */}
        {previewRoutes &&
          previewRoutes.map((route, rIdx) => {
            const positions: [number, number][] = [
              [DEPOT.lat, DEPOT.lon],
              ...route.stops.map((s) => [s.lat, s.lon] as [number, number]),
              [DEPOT.lat, DEPOT.lon],
            ]
            const routeColors = ['#06b6d4', '#a855f7', '#3b82f6', '#10b981']
            const rColor = routeColors[rIdx % routeColors.length]

            return (
              <Polyline
                key={route.route_id}
                positions={positions}
                pathOptions={{
                  color: rColor,
                  weight: 3.5,
                  opacity: 0.85,
                  dashArray: '6, 6',
                }}
              />
            )
          })}
      </MapContainer>

      {/* Selected Bin Side Panel Drawer */}
      {selectedBin && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            bottom: '16px',
            width: '380px',
            maxWidth: 'calc(100% - 32px)',
            zIndex: 600,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {selectedBin.bin_id}
                </h3>
                <span className={`badge badge-${selectedBin.risk_level}`}>
                  {selectedBin.risk_level} risk
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Campus Building: <strong>{selectedBin.building_id}</strong>
              </p>
            </div>
            <button
              onClick={() => setSelectedBin(null)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: 'var(--text-muted)',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CURRENT FILL</span>
              <div
                className="font-mono"
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: getRiskColor(selectedBin.risk_level),
                  marginTop: '4px',
                }}
              >
                {selectedBin.fill_pct.toFixed(1)}%
              </div>
              {/* Visual fill meter */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                  marginTop: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${selectedBin.fill_pct}%`,
                    height: '100%',
                    background: getRiskColor(selectedBin.risk_level),
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>P(OVERFLOW 12H)</span>
              <div
                className="font-mono"
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: selectedBin.risk_overflow >= 0.7 ? 'var(--risk-high)' : 'var(--text-primary)',
                  marginTop: '4px',
                }}
              >
                {(selectedBin.risk_overflow * 100).toFixed(0)}%
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {selectedBin.risk_overflow >= 0.7 ? 'Flagged for truck' : 'Within threshold'}
              </span>
            </div>
          </div>

          {/* Details Specifications */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Category:</span>
              <span className={`badge cat-${selectedBin.category}`}>{selectedBin.category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Bin Capacity:</span>
              <span className="font-mono">{selectedBin.capacity_l} Litres</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Weight:</span>
              <span className="font-mono">
                {((selectedBin.fill_pct / 100) * selectedBin.capacity_l * 0.12).toFixed(1)} kg
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Reading (IST):</span>
              <span className="font-mono" style={{ fontSize: '0.78rem' }}>
                {formatToIST(selectedBin.last_reading_ts)}
              </span>
            </div>
          </div>

          {/* 24-Hour Sensor Readings Sparkline */}
          <div style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>24-Hour Fill History</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>hourly telemetry</span>
            </div>

            <div
              style={{
                height: '150px',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '8px',
                padding: '8px 4px 4px',
              }}
            >
              {readingsLoading ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Loading sparkline...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={binReadings}>
                    <defs>
                      <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={getRiskColor(selectedBin.risk_level)} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={getRiskColor(selectedBin.risk_level)} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="ts" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload as Reading
                          return (
                            <div
                              style={{
                                background: '#0f172a',
                                border: '1px solid rgba(255,255,255,0.15)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                              }}
                            >
                              <div style={{ color: '#94a3b8' }}>{formatToIST(p.ts)}</div>
                              <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                                Fill: {p.fill_pct.toFixed(1)}% ({p.weight_kg.toFixed(1)} kg)
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="fill_pct"
                      stroke={getRiskColor(selectedBin.risk_level)}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#fillGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Action Trigger in Drawer */}
          {selectedBin.risk_level === 'high' && (
            <div
              style={{
                marginTop: 'auto',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertTriangle size={20} color="var(--risk-high)" />
              <div style={{ fontSize: '0.78rem' }}>
                <strong style={{ color: 'var(--risk-high)' }}>Urgent Dispatch Recommended</strong>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Monte-Carlo model predicts overflow within next 6 hours.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
