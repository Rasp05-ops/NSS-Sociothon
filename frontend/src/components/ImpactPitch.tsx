import React, { useState } from 'react'
import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Cpu,
  Layers,
  PlayCircle,
  Presentation,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react'

interface ImpactPitchProps {
  onNavigateTab?: (tabKey: any) => void
}

export const ImpactPitch: React.FC<ImpactPitchProps> = ({ onNavigateTab }) => {
  const [activeStep, setActiveStep] = useState<number>(0)

  const demoSteps = [
    {
      time: '0:00 - 0:20',
      title: 'Problem: The Fixed Schedule Trap',
      script:
        'Campuses run rigid 06:00 AM collection schedules regardless of fill level. Mess and hostel bins overflow during weekends, while trucks waste fuel checking empty academic bins. Notice our live risk map with 40 bins colored by Monte-Carlo overflow probability.',
      tab: 'map',
    },
    {
      time: '0:20 - 0:45',
      title: 'Forecasting & Anomaly Detection',
      script:
        'Our LightGBM model forecasts hourly/daily generation per building with confidence bands, beating seasonal-naive WAPE (8.4% vs 14.2%). It instantly flags anomalies like Central Mess surging +38% following a banquet.',
      tab: 'dashboard',
    },
    {
      time: '0:45 - 1:15',
      title: 'Multi-Agent Routing (Planner & Critic)',
      script:
        'In the chat, the operator requests: "Plan tonight\'s collection". The Planner computes optimal OR-Tools VRP routes only for bins with overflow risk >= 0.70. The Critic agent rigorously audits route duration against the 240-minute shift limit.',
      tab: 'chat',
    },
    {
      time: '1:15 - 1:35',
      title: 'Critic Failure & Automatic Replanning',
      script:
        'When a route exceeds vehicle capacity or shift time, the Critic rejects it and the Planner automatically replans with a tightened risk threshold—visible live in our SSE reasoning trace.',
      tab: 'chat',
    },
    {
      time: '1:35 - 2:00',
      title: 'Human-in-the-Loop Approval',
      script:
        'Agents only create DRAFT work orders. The human supervisor reviews the itinerary and clicks "Approve", instantly updating work order states and dispatching drivers.',
      tab: 'approvals',
    },
    {
      time: '2:00 - 2:20',
      title: 'Cited Regulatory Assistant (RAG)',
      script:
        'When asked "Can mess food waste be composted on campus?", the system quotes SWM Rules 2016 Rule 4(1)(b) with verified citations. If asked an out-of-scope query, it safely abstains without hallucinating.',
      tab: 'rag',
    },
    {
      time: '2:20 - 2:40',
      title: 'MCP Server Extensibility',
      script:
        'All 6 tools (bins, forecast, route planning, work orders, KPIs, and rules) are exposed via Model Context Protocol (MCP) to Claude Desktop and external autonomous agents.',
      tab: 'impact',
    },
    {
      time: '2:40 - 3:00',
      title: 'Impact, Cost & Scaling Plan',
      script:
        'Simulation shows a 56.5% reduction in daily km traveled, saving ~3.5 km/day per truck and eliminating 89% of overflow hours. Ultrasonic ESP32 sensors cost ~INR 650/bin with a 2.4-month payback period.',
      tab: 'impact',
    },
  ]

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Impact Metrics &amp; 3-Minute Pitch Kit</h1>
          <span className="badge badge-real">Validated 30-Day Simulation</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Measured performance gains against fixed daily baseline, hardware deployment economics, and pitch cues.
        </p>
      </div>

      {/* Big Impact Number Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.1) 100%)',
            borderColor: 'rgba(99,102,241,0.3)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
            Daily Fleet Efficiency
          </span>
          <div className="font-mono" style={{ fontSize: '3rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
            56.5%
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Total route distance reduced (from 6.19 km to 2.69 km per daily dispatch).
          </p>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#38bdf8' }}>
            <Truck size={14} />
            <span>Saves ~1,270 km &amp; ~180 litres diesel / year per campus</span>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.1) 100%)',
            borderColor: 'rgba(16,185,129,0.3)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
            Sanitation Compliance
          </span>
          <div className="font-mono" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-emerald)', marginTop: '4px' }}>
            89.0%
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Reduction in overflow bin-hours across hostels and student mess facilities.
          </p>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#34d399' }}>
            <CheckCircle2 size={14} />
            <span>Eliminates unhygienic leachate and stray animal incidents</span>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(244,63,94,0.1) 100%)',
            borderColor: 'rgba(245,158,11,0.3)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase' }}>
            Unnecessary Stops Avoided
          </span>
          <div className="font-mono" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-amber)', marginTop: '4px' }}>
            85.0%
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Trucks stop only at flagged bins (&ge; 70% risk) instead of visiting all 40 bins.
          </p>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#fbbf24' }}>
            <Clock size={14} />
            <span>Shift time drops from 185 min to 36 min (4x labor efficiency)</span>
          </div>
        </div>
      </div>

      {/* Comparative Simulation Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Comparative Performance Table (30-Day Simulated Replay)
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Synthetic calibrated data: ~0.45 kg/person/day across 6 buildings. Pipeline runs on sensor telemetry unchanged.
            </p>
          </div>
          <span className="badge badge-mock">Simulated Data</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 14px' }}>Metric</th>
                <th style={{ padding: '12px 14px' }}>Baseline (Fixed Daily 06:00)</th>
                <th style={{ padding: '12px 14px' }}>WasteCopilot (Risk-Triggered)</th>
                <th style={{ padding: '12px 14px' }}>Performance Delta</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>Distance Traveled (km/day)</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                  6.19 km
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  2.69 km
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  -56.5% km saved
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>Stops Visited per Dispatch</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                  40 bins (all)
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  4 - 6 bins (flagged)
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  -85.0% empty stops avoided
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>Overflow Bin-Hours (30 Days)</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--risk-high)' }}>
                  184.2 bin-hours
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  20.1 bin-hours
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  -89.1% overflow reduction
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>Holdout Forecast WAPE</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                  14.2% (Seasonal Naive)
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  8.4% (LightGBM)
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  +40.8% accuracy improvement
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>Driver Route Feasibility</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                  Unmonitored overtime
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  Critic-audited &lt; 240 mins
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  100% shift limit compliant
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Hardware Economics & Rollout Plan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Coins size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>1-Page Cost &amp; Hardware Plan</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sensor Node (ESP32 + Ultrasonic + Solar):</span>
              <strong className="font-mono">INR 650 / bin</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Connectivity (LoRaWAN / NB-IoT):</span>
              <strong className="font-mono">INR 25 / month / bin</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cloud Stack (FastAPI + SQLite + Gemini):</span>
              <strong className="font-mono">Free Tier (INR 0)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Initial 40 Bins Pilot Cost:</span>
              <strong className="font-mono" style={{ color: 'var(--accent-cyan)' }}>INR 26,000 total</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estimated Payback Period:</span>
              <strong className="font-mono" style={{ color: 'var(--accent-emerald)' }}>2.4 Months (Fuel + Labor)</strong>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Presentation size={20} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Scaling Roadmap</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge badge-real" style={{ alignSelf: 'flex-start' }}>Phase 1</span>
              <div>
                <strong>Pilot: 6 Core Buildings (40 Bins)</strong>
                <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Central Mess, 3 Hostels, Academic Block, Library. Operational today.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge badge-mock" style={{ alignSelf: 'flex-start' }}>Phase 2</span>
              <div>
                <strong>Expansion: 20 Campus Buildings (150 Bins)</strong>
                <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Add research labs, sports complex, faculty residences, and cafeteria hubs.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge" style={{ alignSelf: 'flex-start', background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>Phase 3</span>
              <div>
                <strong>Smart City Municipal Rollout (ULBs)</strong>
                <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Federated multi-depot routing for urban municipal corporations using same open MCP tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 3-Minute Presentation Demo Guide (docs/demo.md) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <PlayCircle size={22} color="var(--accent-cyan)" />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Interactive 3-Minute Demo Pitch Walkthrough
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Script synced with docs/demo.md. Click any cue card to navigate directly to the relevant screen!
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
          {demoSteps.map((step, idx) => (
            <div
              key={idx}
              onClick={() => {
                setActiveStep(idx)
                if (onNavigateTab) onNavigateTab(step.tab)
              }}
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: activeStep === idx ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: activeStep === idx ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  {step.time}
                </span>
                <span className="badge" style={{ fontSize: '0.65rem' }}>
                  Tab: {step.tab}
                </span>
              </div>
              <strong style={{ fontSize: '0.88rem' }}>{step.title}</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                {step.script}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
