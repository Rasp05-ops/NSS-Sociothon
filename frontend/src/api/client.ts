import type { components } from './types'
import { API_BASE, TZ_DISPLAY } from '../../../shared/constants'

// Static fixtures as fallback when backend is offline
import binsFixture from '../../../shared/fixtures/bins.json'
import compareFixture from '../../../shared/fixtures/compare.json'
import forecastFixture from '../../../shared/fixtures/forecast.json'
import kpisFixture from '../../../shared/fixtures/kpis.json'
import ragAnswerFixture from '../../../shared/fixtures/rag_answer.json'
import readingsSampleFixture from '../../../shared/fixtures/readings_sample.json'
import routePlanFixture from '../../../shared/fixtures/route_plan.json'
import traceEventsFixture from '../../../shared/fixtures/trace_events.json'
import trendsFixture from '../../../shared/fixtures/trends.json'
import workOrderFixture from '../../../shared/fixtures/work_order.json'

export type Bin = components['schemas']['Bin']
export type Reading = components['schemas']['Reading']
export type ForecastResponse = components['schemas']['ForecastResponse']
export type ForecastPoint = components['schemas']['ForecastPoint']
export type RoutePlanRequest = components['schemas']['RoutePlanRequest']
export type RoutePlanResponse = components['schemas']['RoutePlanResponse']
export type Route = components['schemas']['Route']
export type RouteStop = components['schemas']['RouteStop']
export type WorkOrder = components['schemas']['WorkOrder']
export type WorkOrderCreate = components['schemas']['WorkOrderCreate']
export type Decision = components['schemas']['Decision']
export type KPIs = components['schemas']['KPIs']
export type TrendResponse = components['schemas']['TrendResponse']
export type TrendPoint = components['schemas']['TrendPoint']
export type CompareResponse = components['schemas']['CompareResponse']
export type BuildingComparison = components['schemas']['BuildingComparison']
export type RagAnswer = components['schemas']['RagAnswer']
export type Citation = components['schemas']['Citation']

export interface TraceEvent {
  trace_id: string
  ts: string
  agent: 'planner' | 'critic' | 'dispatcher' | 'rag' | 'system' | string
  type: 'tool_call' | 'tool_result' | 'message' | 'approval_request' | 'error' | 'done'
  payload: Record<string, any>
}

export interface ApiStatus {
  online: boolean
  source: 'mock' | 'real'
  baseUrl: string
  error?: string
}

// Convert UTC ISO timestamp to IST (Asia/Kolkata) display string
export function formatToIST(utcIso: string | Date | undefined): string {
  if (!utcIso) return 'N/A'
  try {
    const d = typeof utcIso === 'string' ? new Date(utcIso) : utcIso
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TZ_DISPLAY,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return String(utcIso)
  }
}

export function formatTimeOnlyIST(utcIso: string | Date | undefined): string {
  if (!utcIso) return 'N/A'
  try {
    const d = typeof utcIso === 'string' ? new Date(utcIso) : utcIso
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TZ_DISPLAY,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d)
  } catch {
    return String(utcIso)
  }
}

// In-memory work orders state for optimistic updates during offline demo
let localWorkOrders: WorkOrder[] = [workOrderFixture as unknown as WorkOrder]

export const apiClient = {
  async checkHealth(): Promise<ApiStatus> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return {
        online: true,
        source: data.use_mocks ? 'mock' : 'real',
        baseUrl: API_BASE,
      }
    } catch (err: any) {
      return {
        online: false,
        source: 'mock',
        baseUrl: API_BASE,
        error: err?.message ?? 'Offline',
      }
    }
  },

  async getBins(buildingId?: string, minRisk: number = 0.0): Promise<{ data: Bin[]; source: 'mock' | 'real' }> {
    try {
      const params = new URLSearchParams()
      if (buildingId) params.set('building_id', buildingId)
      if (minRisk > 0) params.set('min_risk', String(minRisk))
      const url = `${API_BASE}/bins${params.toString() ? `?${params.toString()}` : ''}`
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        const data = await res.json()
        return { data, source: 'real' }
      }
    } catch {
      // Fallback to fixture
    }

    let filtered = (binsFixture as unknown as Bin[]).filter((b) => b.risk_overflow >= minRisk)
    if (buildingId) {
      filtered = filtered.filter((b) => b.building_id === buildingId)
    }
    return { data: filtered, source: 'mock' }
  },

  async getBinReadings(binId: string): Promise<{ data: Reading[]; source: 'mock' | 'real' }> {
    try {
      const res = await fetch(`${API_BASE}/bins/${encodeURIComponent(binId)}/readings`, {
        signal: AbortSignal.timeout(3000),
      })
      if (res.ok) {
        const data = await res.json()
        return { data, source: 'real' }
      }
    } catch {
      // Fallback
    }

    const readings = (readingsSampleFixture as unknown as Reading[]).filter((r) => r.bin_id === binId)
    if (readings.length > 0) {
      return { data: readings, source: 'mock' }
    }

    // Generate realistic 24-hr sparkline points if specific bin not in sample fixture
    const now = new Date()
    const fallbackReadings: Reading[] = []
    let currentPct = 40 + (binId.charCodeAt(binId.length - 1) % 50)
    for (let i = 24; i >= 0; i--) {
      const ts = new Date(now.getTime() - i * 3600 * 1000).toISOString()
      const noise = ((i * 7) % 11) - 4
      currentPct = Math.min(100, Math.max(10, currentPct + noise))
      fallbackReadings.push({
        bin_id: binId,
        ts,
        fill_pct: Math.round(currentPct * 10) / 10,
        weight_kg: Math.round(currentPct * 0.288 * 10) / 10,
      })
    }
    return { data: fallbackReadings, source: 'mock' }
  },

  async getForecast(buildingId: string = 'H01', days: number = 7): Promise<ForecastResponse> {
    try {
      const res = await fetch(`${API_BASE}/forecast?building_id=${buildingId}&days=${days}`, {
        signal: AbortSignal.timeout(3000),
      })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Fallback
    }
    const fc = forecastFixture as unknown as ForecastResponse
    return {
      ...fc,
      building_id: buildingId,
      source: 'mock',
    }
  },

  async planRoutes(req: RoutePlanRequest = { horizon_h: 12, trucks: 2, risk_threshold: 0.7 }): Promise<RoutePlanResponse> {
    try {
      const res = await fetch(`${API_BASE}/routes/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: AbortSignal.timeout(4000),
      })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Fallback
    }
    return routePlanFixture as unknown as RoutePlanResponse
  },

  async getWorkOrders(status?: string): Promise<{ data: WorkOrder[]; source: 'mock' | 'real' }> {
    try {
      const url = `${API_BASE}/work-orders${status ? `?status=${status}` : ''}`
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        const data = await res.json()
        return { data, source: 'real' }
      }
    } catch {
      // Fallback
    }
    const filtered = status ? localWorkOrders.filter((w) => w.status === status) : localWorkOrders
    return { data: [...filtered], source: 'mock' }
  },

  async createWorkOrder(data: WorkOrderCreate): Promise<WorkOrder> {
    try {
      const res = await fetch(`${API_BASE}/work-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Local mock update
    }
    const newWo: WorkOrder = {
      work_order_id: `WO-${Date.now().toString().slice(-6)}`,
      route_id: data.route_id,
      status: 'DRAFT',
      created_ts: new Date().toISOString(),
      notes: data.notes,
      route: data.route,
    }
    localWorkOrders.unshift(newWo)
    return newWo
  },

  async decideWorkOrder(id: string, decision: Decision): Promise<WorkOrder> {
    const endpoint = decision.approved ? 'approve' : 'reject'
    try {
      const res = await fetch(`${API_BASE}/work-orders/${encodeURIComponent(id)}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decision),
      })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Fallback mock update
    }
    const idx = localWorkOrders.findIndex((w) => w.work_order_id === id)
    if (idx >= 0) {
      localWorkOrders[idx] = {
        ...localWorkOrders[idx],
        status: decision.approved ? 'APPROVED' : 'REJECTED',
        decided_by: decision.decided_by,
        notes: decision.comment ?? localWorkOrders[idx].notes,
      }
      return localWorkOrders[idx]
    }
    return {
      work_order_id: id,
      route_id: 'R-LOCAL',
      status: decision.approved ? 'APPROVED' : 'REJECTED',
      created_ts: new Date().toISOString(),
      decided_by: decision.decided_by,
    }
  },

  async getKPIs(buildingId?: string): Promise<KPIs> {
    try {
      const url = `${API_BASE}/kpis${buildingId ? `?building_id=${buildingId}` : ''}`
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Fallback
    }
    const kpi = kpisFixture as unknown as KPIs
    return {
      ...kpi,
      building_id: buildingId ?? null,
      source: 'mock',
    }
  },

  async getTrends(buildingId?: string, granularity: 'day' | 'week' = 'day', days: number = 30): Promise<TrendResponse> {
    try {
      const params = new URLSearchParams()
      if (buildingId) params.set('building_id', buildingId)
      params.set('granularity', granularity)
      params.set('days', String(days))
      const res = await fetch(`${API_BASE}/trends?${params.toString()}`, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Fallback
    }
    return trendsFixture as unknown as TrendResponse
  },

  async getCompare(days: number = 7): Promise<CompareResponse> {
    try {
      const res = await fetch(`${API_BASE}/compare?days=${days}`, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Fallback
    }
    return compareFixture as unknown as CompareResponse
  },

  async askRag(question: string): Promise<RagAnswer> {
    try {
      const res = await fetch(`${API_BASE}/rag/ask?q=${encodeURIComponent(question)}`, { signal: AbortSignal.timeout(4000) })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Fallback
    }

    // Context-sensitive demo answer
    const qLower = question.toLowerCase()
    if (qLower.includes('compost') || qLower.includes('food') || qLower.includes('mess')) {
      return {
        question,
        answer:
          'Under the Solid Waste Management Rules (2016) Rule 4(1)(b) and Campus Green Protocol Clause 6.2, all institutional messes and canteens must compost or bio-methanate wet biodegradable food waste on-site. Untreated wet waste disposal in landfills is strictly prohibited.',
        citations: [
          {
            doc_id: 'swm-rules-2016',
            title: 'Solid Waste Management Rules, 2016 (MoEFCC)',
            clause: 'Rule 4(1)(b) - Waste Generators Duties',
            snippet:
              'All resident welfare and market associations, gated communities, institutions shall ensure segregation of waste at source and facilitate collection of segregated waste in separate streams.',
            score: 0.94,
          },
          {
            doc_id: 'campus-green-policy',
            title: 'IIT/NIT Campus Sustainability Protocol 2024',
            clause: 'Section 6.2 - Decentralized Food Composting',
            snippet:
              'Central messes generate approx. 400-800 kg/day organic waste. This must be routed to the campus vermicomposting pit or biogas digester within 4 hours of generation.',
            score: 0.89,
          },
        ],
        abstained: false,
      }
    } else if (qLower.includes('battery') || qLower.includes('hazard') || qLower.includes('lab') || qLower.includes('chemical')) {
      return {
        question,
        answer:
          'Hazardous laboratory chemicals and e-waste batteries must be placed in yellow hazardous/e-waste containers and scheduled for hazardous logistics pickup per Campus E-Waste Guidelines Clause 11. They must never enter municipal dry/wet bins.',
        citations: [
          {
            doc_id: 'hazardous-waste-guidelines-2022',
            title: 'Campus Hazardous & Electronic Waste Standard',
            clause: 'Clause 11 - Special Disposal Workflows',
            snippet:
              'Chemical solvent containers and lithium-ion batteries must be logged with lab safety coordinators and collected via dedicated HAZMAT dispatch requests.',
            score: 0.91,
          },
        ],
        abstained: false,
      }
    } else if (qLower.includes('cricket') || qLower.includes('weather') || qLower.includes('movie') || qLower.includes('bitcoin')) {
      // Out of scope query demonstrates the abstain mechanism (B5, C6)
      return {
        question,
        answer: 'The system cannot answer this query because it is out of scope of the indexed campus waste management regulations and guidelines.',
        citations: [],
        abstained: true,
      }
    }

    return ragAnswerFixture as unknown as RagAnswer
  },

  async streamChat(
    message: string,
    threadId: string = 'default',
    onEvent: (event: TraceEvent) => void,
    onError: (err: any) => void,
    onDone: () => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, thread_id: threadId }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`SSE stream failed: HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue
          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.slice(5).trim()
            try {
              const ev = JSON.parse(jsonStr) as TraceEvent
              onEvent(ev)
              if (ev.type === 'done') {
                onDone()
                return
              }
            } catch (pErr) {
              console.warn('Could not parse SSE JSON:', jsonStr, pErr)
            }
          }
        }
      }
      onDone()
      return
    } catch {
      // Replay mock trace events realistically with progressive delays
      const events = traceEventsFixture as unknown as TraceEvent[]
      let idx = 0
      const timer = setInterval(() => {
        if (idx < events.length) {
          const ev = { ...events[idx], ts: new Date().toISOString() }
          onEvent(ev)
          if (ev.type === 'done') {
            clearInterval(timer)
            onDone()
          }
          idx++
        } else {
          clearInterval(timer)
          onDone()
        }
      }, 750)
    }
  },
}
