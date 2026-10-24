import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  FileCheck,
  Filter,
  MapPin,
  MessageSquare,
  Navigation,
  Sparkles,
  Truck,
  X,
  XCircle,
} from 'lucide-react'
import { apiClient, type Decision, type Route, type WorkOrder, formatToIST } from '../api/client'

const TRUCK_SHIFT_MIN = 240 // Max minutes per truck shift (Critic constraint)

interface ApprovalInboxProps {
  onPreviewRouteOnMap?: (routes: Route[]) => void
}

export const ApprovalInbox: React.FC<ApprovalInboxProps> = ({ onPreviewRouteOnMap }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState<boolean>(true)
  const [commentInputs, setCommentInputs] = useState<{ [id: string]: string }>({})
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    const filter = statusFilter === 'all' ? undefined : statusFilter
    const { data } = await apiClient.getWorkOrders(filter)
    setWorkOrders(data)
    if (data.length > 0 && !selectedOrder) {
      setSelectedOrder(data[0])
    }
    setLoading(false)
  }

  const handleDecision = async (woId: string, approved: boolean) => {
    const comment = commentInputs[woId] || (approved ? 'Approved by campus supervisor' : 'Rejected for route replanning')
    const decision: Decision = {
      approved,
      comment,
      decided_by: 'supervisor-1',
    }
    const updated = await apiClient.decideWorkOrder(woId, decision)
    setWorkOrders((prev) => prev.map((w) => (w.work_order_id === woId ? updated : w)))
    if (selectedOrder?.work_order_id === woId) {
      setSelectedOrder(updated)
    }

    if (approved && updated.route && onPreviewRouteOnMap) {
      onPreviewRouteOnMap([updated.route])
    }
  }

  const handleCreateDraft = async () => {
    const plan = await apiClient.planRoutes()
    if (plan.routes.length > 0) {
      const created = await apiClient.createWorkOrder({
        route_id: plan.routes[0].route_id,
        notes: `AI Generated plan: ${plan.flagged_bin_count} flagged bins, ${plan.km_saved_pct.toFixed(1)}% km saved`,
        route: plan.routes[0],
      })
      setWorkOrders((prev) => [created, ...prev])
      setSelectedOrder(created)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-low">Approved</span>
      case 'REJECTED':
        return <span className="badge badge-high">Rejected</span>
      case 'DISPATCHED':
        return <span className="badge cat-ewaste">Dispatched</span>
      case 'DRAFT':
      case 'PENDING_APPROVAL':
        return <span className="badge badge-medium">Pending Sign-off</span>
      default:
        return <span className="badge">{status}</span>
    }
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Human-in-the-Loop Dispatch Inbox</h1>
            <span className="badge badge-real">P0 Work Orders</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
            Agents create DRAFT work orders only. Route dispatch strictly requires human operator approval.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Status Filter */}
          <div
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              fontSize: '0.8rem',
            }}
          >
            <Filter size={14} color="var(--accent-cyan)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ background: '#0f172a' }}>All Statuses</option>
              <option value="DRAFT" style={{ background: '#0f172a' }}>DRAFT</option>
              <option value="APPROVED" style={{ background: '#0f172a' }}>APPROVED</option>
              <option value="REJECTED" style={{ background: '#0f172a' }}>REJECTED</option>
            </select>
          </div>

          <button onClick={handleCreateDraft} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
            <Sparkles size={14} />
            Generate New Route Order
          </button>
        </div>
      </div>

      {/* Main Grid: Orders List & Detailed Viewer */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '20px' }}>
        {/* Left: Work Orders List */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '700px', overflowY: 'auto' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Work Orders ({workOrders.length})
          </span>

          {workOrders.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No work orders match the filter.
            </div>
          ) : (
            workOrders.map((wo) => {
              const isSelected = selectedOrder?.work_order_id === wo.work_order_id
              return (
                <div
                  key={wo.work_order_id}
                  onClick={() => setSelectedOrder(wo)}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong className="font-mono" style={{ fontSize: '0.9rem' }}>
                      {wo.work_order_id}
                    </strong>
                    {getStatusBadge(wo.status)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <Truck size={13} color="var(--accent-cyan)" />
                    <span>Route: <strong className="font-mono">{wo.route_id}</strong></span>
                    {wo.route && <span>({wo.route.stops.length} stops, {wo.route.km} km)</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    <span>Created: {formatToIST(wo.created_ts)}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right: Selected Work Order Details & Map Preview */}
        {selectedOrder ? (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                    {selectedOrder.work_order_id}
                  </h2>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
                  Target Route: <strong className="font-mono">{selectedOrder.route_id}</strong> · Created {formatToIST(selectedOrder.created_ts)}
                </p>
              </div>

              {/* Action Buttons */}
              {selectedOrder.status === 'DRAFT' || selectedOrder.status === 'PENDING_APPROVAL' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleDecision(selectedOrder.work_order_id, true)}
                    className="btn btn-success"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <Check size={16} />
                    Approve &amp; Dispatch Truck
                  </button>
                  <button
                    onClick={() => handleDecision(selectedOrder.work_order_id, false)}
                    className="btn btn-danger"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  Decided by: <strong>{selectedOrder.decided_by ?? 'admin'}</strong>
                </div>
              )}
            </div>

            {/* Shift Constraints Check */}
            {selectedOrder.route && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ASSIGNED TRUCK</span>
                  <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>
                    {selectedOrder.route.truck_id}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL DISTANCE</span>
                  <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>
                    {selectedOrder.route.km} km
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>EST. SHIFT DURATION</span>
                  <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px', color: 'var(--accent-emerald)' }}>
                    {selectedOrder.route.est_min} mins
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Limit: {TRUCK_SHIFT_MIN} mins (OK)
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>STOPS SCHEDULED</span>
                  <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>
                    {selectedOrder.route.stops.length} bins
                  </div>
                </div>
              </div>
            )}

            {/* Route Stops Sequence Timeline */}
            {selectedOrder.route && (
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>
                  Collection Stops Itinerary (Depot &rarr; Stops &rarr; Depot)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.route.stops.map((stop) => (
                    <div
                      key={stop.seq}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          {stop.seq}
                        </span>
                        <div>
                          <strong className="font-mono">{stop.bin_id}</strong>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                            ({stop.building_id})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                          ETA: +{stop.eta_min}m
                        </span>
                        <span
                          className="font-mono"
                          style={{
                            color: stop.expected_fill_pct >= 90 ? 'var(--risk-high)' : 'var(--text-primary)',
                            fontWeight: 700,
                          }}
                        >
                          Expected Fill: {stop.expected_fill_pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes / Comments input */}
            {(selectedOrder.status === 'DRAFT' || selectedOrder.status === 'PENDING_APPROVAL') && (
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Dispatcher / Supervisor Comment:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved. Priority collection for Central Mess wet waste."
                  value={commentInputs[selectedOrder.work_order_id] || ''}
                  onChange={(e) =>
                    setCommentInputs({ ...commentInputs, [selectedOrder.work_order_id]: e.target.value })
                  }
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a work order from the left to view details and approve.
          </div>
        )}
      </div>
    </div>
  )
}
