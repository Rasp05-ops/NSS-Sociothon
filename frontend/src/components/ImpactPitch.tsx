import React from 'react'
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  Layers,
  Presentation,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react'

export const ImpactPitch: React.FC = () => {
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
            29.0%
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Simulated average distance reduced from 2.62 km to 1.86 km per day.
          </p>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#38bdf8' }}>
            <Truck size={14} />
            <span>30-day synthetic replay; live savings depend on route density and policy.</span>
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
            78.0%
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Simulated reduction in overflow bin-hours: 1,535 to 337 over 30 days.
          </p>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#34d399' }}>
            <CheckCircle2 size={14} />
            <span>Lower overflow exposure; production impact requires live telemetry.</span>
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
            57.0%
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Simulated stops reduced from 40 to 17.2 per day.
          </p>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#fbbf24' }}>
            <Clock size={14} />
            <span>Fewer unnecessary visits; routes remain capacity- and shift-constrained.</span>
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
                <th style={{ padding: '12px 14px' }}>Binlytics (Risk-Triggered)</th>
                <th style={{ padding: '12px 14px' }}>Performance Delta</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>Distance Traveled (km/day)</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                  2.62 km
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  1.86 km
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  -29.0% km saved
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>Stops Visited per Dispatch</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                  40 bins (all)
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  17.2 stops/day average
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  -57.0% stops
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>Overflow Bin-Hours (30 Days)</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--risk-high)' }}>
                  1,535 bin-hours
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  337 bin-hours
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  -78.0% overflow reduction
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>Holdout Forecast WAPE</td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                  32.7% (Seasonal Naive)
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  28.2% (LightGBM)
                </td>
                <td className="font-mono" style={{ padding: '12px 14px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  -13.8% forecast error
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
              <strong className="font-mono" style={{ color: 'var(--accent-emerald)' }}>To be measured in pilot</strong>
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

    </div>
  )
}
