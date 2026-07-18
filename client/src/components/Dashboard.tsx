import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { FiUsers, FiActivity, FiClock, FiAlertTriangle, FiCheckCircle, FiCpu, FiCalendar, FiSun, FiCloud } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';

import { useStadium } from '../contexts/StadiumContext';
import type { DashboardApiResponse, StadiumIncident, StadiumZone } from '../types/stadium';

const fetchDashboardData = async (stadiumId: string | null): Promise<DashboardApiResponse> => {
  if (!stadiumId) throw new Error('No stadium selected');
  const res = await fetch(`${API_BASE_URL}/api/dashboard?stadiumId=${stadiumId}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
};

export const Dashboard = () => {
  const { activeStadiumId } = useStadium();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', activeStadiumId],
    queryFn: () => fetchDashboardData(activeStadiumId),
    refetchInterval: 15000,
    enabled: !!activeStadiumId, // Only fetch if stadium is selected
  });

  const dashboardData = data?.data;

  // Incident dispatch states
  const [incType, setIncType] = useState('SPILL');
  const [incDesc, setIncDesc] = useState('');
  const [incZoneId, setIncZoneId] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');
  
  // Local state to track solved/dismissed simulated alerts
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const handleResolveIncident = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/incident/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['dashboard', activeStadiumId] });
      } else {
        alert('Failed to resolve incident.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to resolve incident.');
    }
  };

  // Auto-set the first zone as selected default in incident form
  useEffect(() => {
    if (dashboardData?.zones && dashboardData.zones.length > 0 && !incZoneId) {
      setIncZoneId(dashboardData.zones[0].id);
    }
  }, [dashboardData, incZoneId]);

  const aiInsight = useMemo(() => {
    if (!dashboardData) return 'Analyzing stadium telemetry...';
    
    // Check database incidents first
    if (dashboardData.incidents && dashboardData.incidents.length > 0) {
      const latest = dashboardData.incidents[0];
      return `Operational Dispatch: Active ${latest.type} hazard in ${latest.zone.name} (${latest.description}). Response teams notified.`;
    }

    const highDensityZone = dashboardData.zones.find((zone: StadiumZone) => zone.density === 'CRITICAL' || zone.density === 'HIGH');
    if (highDensityZone) {
      return `Crowd density in ${highDensityZone.name} is increasing. Recommend redirecting spectators toward adjacent gates.`;
    }
    return 'All zones operating optimally. No congestion detected.';
  }, [dashboardData]);

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDesc.trim() || !incZoneId) return;
    setIsReporting(true);
    setReportSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/incident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: incType,
          description: incDesc.trim(),
          zoneId: incZoneId
        })
      });

      if (response.ok) {
        setReportSuccess('Incident dispatched and logged in command center.');
        setIncDesc('');
        // Invalidate queries to refresh dashboard data instantly
        queryClient.invalidateQueries({ queryKey: ['dashboard', activeStadiumId] });
        setTimeout(() => setReportSuccess(''), 4000);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit incident report');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit incident. Check connection.');
    } finally {
      setIsReporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="typing-indicator" style={{ transform: 'scale(1.5)', margin: '4rem auto' }} aria-label="Loading dashboard data">...</div>
    );
  }

  if (isError || !dashboardData) {
    return <div className="text-danger" role="alert">Error loading dashboard telemetry.</div>;
  }

  const { zones, events, incidents, kpis } = dashboardData;

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'LOW': return 'var(--success)';
      case 'MEDIUM': return 'var(--warning)';
      case 'HIGH': return 'var(--danger)';
      case 'CRITICAL': return '#991b1b';
      default: return 'var(--text-muted)';
    }
  };

  const getDensityPercentage = (density: string) => {
    switch (density) {
      case 'LOW': return 35;
      case 'MEDIUM': return 65;
      case 'HIGH': return 85;
      case 'CRITICAL': return 98;
      default: return 0;
    }
  };

  return (
    <div className="dashboard-grid">
      
      {/* Stadium Health Overview (KPIs) */}
      <section className="glass-panel dashboard-widget kpi-widget hover-lift col-span-12" aria-labelledby="health-overview">
        <h3 id="health-overview" className="widget-title"><FiActivity className="text-gradient" /> Stadium Health</h3>
        <div className="kpi-grid">
          {/* KPI 1: Spectators */}
          <div className="kpi-card" tabIndex={0}>
            <div className="kpi-card-inner">
              <div className="kpi-card-front">
                <span className="kpi-label">Total Spectators</span>
                <span className="kpi-value text-gradient">{kpis.totalSpectators.toLocaleString()}</span>
              </div>
              <div className="kpi-card-back">
                <span className="kpi-label" style={{ fontSize: '0.75rem' }}>Gate Analysis</span>
                <span style={{ fontSize: '0.85rem', marginTop: '6px', textAlign: 'center', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  Gates active: 100%<br />Peak Flow: Gates A & D<br />Flow rate: nominal
                </span>
              </div>
            </div>
          </div>

          {/* KPI 2: Occupancy */}
          <div className="kpi-card" tabIndex={0}>
            <div className="kpi-card-inner">
              <div className="kpi-card-front">
                <span className="kpi-label">Occupancy</span>
                <span className="kpi-value">{kpis.occupancyPercent}%</span>
              </div>
              <div className="kpi-card-back">
                <span className="kpi-label" style={{ fontSize: '0.75rem' }}>Capacity Details</span>
                <span style={{ fontSize: '0.85rem', marginTop: '6px', textAlign: 'center', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  Max Cap: 60,000<br />Reserved: 100%<br />Public tickets: sold
                </span>
              </div>
            </div>
          </div>

          {/* KPI 3: Active Incidents */}
          <div className="kpi-card" tabIndex={0}>
            <div className="kpi-card-inner">
              <div className="kpi-card-front">
                <span className="kpi-label">Active Incidents</span>
                <span className="kpi-value" style={{ color: kpis.activeIncidents > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {kpis.activeIncidents}
                </span>
              </div>
              <div className="kpi-card-back">
                <span className="kpi-label" style={{ fontSize: '0.75rem' }}>Dispatch Summary</span>
                <span style={{ fontSize: '0.85rem', marginTop: '6px', textAlign: 'center', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  Response: active<br />Staff deployed: 14<br />Security status: Safe
                </span>
              </div>
            </div>
          </div>

          {/* KPI 4: Avg Wait Time */}
          <div className="kpi-card" tabIndex={0}>
            <div className="kpi-card-inner">
              <div className="kpi-card-front">
                <span className="kpi-label">Avg Wait Time</span>
                <span className="kpi-value">{kpis.avgWaitTime}m</span>
              </div>
              <div className="kpi-card-back">
                <span className="kpi-label" style={{ fontSize: '0.75rem' }}>Concourse Wait</span>
                <span style={{ fontSize: '0.85rem', marginTop: '6px', textAlign: 'center', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  Fastest stand: East<br />Slower stand: North<br />Reroutes: none
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Insights Panel */}
      <section className="glass-panel dashboard-widget ai-widget hover-lift col-span-12" aria-labelledby="ai-insights">
        <h3 id="ai-insights" className="widget-title"><FiCpu style={{ color: 'var(--accent-purple)' }} /> GenAI Operational Insight</h3>
        <div className="ai-insight-content">
          <p>{aiInsight}</p>
        </div>
      </section>

      {/* Incident Report Center Form */}
      <section className="glass-panel dashboard-widget hover-lift col-span-6" aria-labelledby="report-dispatch">
        <h3 id="report-dispatch" className="widget-title"><FiAlertTriangle className="text-gradient" /> Log Incident (Dispatch)</h3>
        <form onSubmit={handleReportIncident} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="inc-type" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Type</label>
            <select
              id="inc-type"
              value={incType}
              onChange={(e) => setIncType(e.target.value)}
              style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', outline: 'none' }}
            >
              <option value="SPILL">Spill (Clean request)</option>
              <option value="MEDICAL">Medical assistance</option>
              <option value="SAFETY">Safety / Crowd control</option>
              <option value="MAINTENANCE">Maintenance issue</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="inc-zone" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Stand / Section</label>
            <select
              id="inc-zone"
              value={incZoneId}
              onChange={(e) => setIncZoneId(e.target.value)}
              style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', outline: 'none' }}
            >
              {zones.map((z: StadiumZone) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="inc-desc" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Description</label>
            <input
              id="inc-desc"
              type="text"
              value={incDesc}
              onChange={(e) => setIncDesc(e.target.value)}
              placeholder="Describe issue (e.g. Water spill near gate 4)"
              required
              style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', outline: 'none' }}
            />
          </div>

          {reportSuccess && (
            <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 'bold' }}>{reportSuccess}</span>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isReporting || !incDesc.trim()}
            style={{ padding: '0.65rem', marginTop: '0.25rem', fontSize: '0.85rem' }}
          >
            {isReporting ? 'Dispatching...' : 'Dispatch Alert Response'}
          </button>
        </form>
      </section>

      {/* Live Crowd Heatmap */}
      <section className="glass-panel dashboard-widget hover-lift col-span-6" aria-labelledby="crowd-heatmap">
        <h3 id="crowd-heatmap" className="widget-title"><FiUsers className="text-gradient" /> Crowd Density Heatmap</h3>
        <div className="heatmap-list">
          {zones.map((zone: StadiumZone) => {
            const percent = getDensityPercentage(zone.density);
            return (
              <div key={zone.id} className="heatmap-item">
                <div className="heatmap-label">
                  <span>{zone.name}</span>
                  <span style={{ color: getDensityColor(zone.density), fontWeight: 'bold' }}>{zone.density}</span>
                </div>
                <div className="progress-bg">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${percent}%`, backgroundColor: getDensityColor(zone.density) }}
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Occupancy for ${zone.name} is ${percent}%`}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Match Operations Timeline */}
      <section className="glass-panel dashboard-widget hover-lift col-span-6" aria-labelledby="match-timeline">
        <h3 id="match-timeline" className="widget-title"><FiCalendar className="text-gradient" /> Operations Timeline</h3>
        <ul className="timeline-list">
          {events.slice(0, 4).map((event) => {
            const date = new Date(event.time);
            const isPast = date < new Date();
            return (
              <li key={event.id} className={`timeline-item ${isPast ? 'past' : ''}`}>
                <div className="timeline-icon">
                  {isPast ? <FiCheckCircle style={{ color: 'var(--success)' }} /> : <div className="timeline-dot"></div>}
                </div>
                <div className="timeline-content">
                  <p className="timeline-time">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="timeline-title">{event.title}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Queue Intelligence */}
      <section className="glass-panel dashboard-widget hover-lift col-span-6" aria-labelledby="queue-intel">
        <h3 id="queue-intel" className="widget-title"><FiClock className="text-gradient" /> Queue Intelligence</h3>
        <div className="queue-list">
          {zones.map((zone: StadiumZone) => (
            <div key={zone.id} className="queue-item">
              <span className="queue-name">{zone.name} Concourse</span>
              <span className="queue-time">{zone.waitingTime}m wait</span>
            </div>
          ))}
        </div>
      </section>

      {/* Live Weather Integration */}
      <section className="glass-panel dashboard-widget hover-lift col-span-6" aria-labelledby="weather-widget">
        <h3 id="weather-widget" className="widget-title"><FiCloud className="text-gradient" /> Live Weather</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', height: 'calc(100% - 2.5rem)', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <FiSun size={48} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.45))' }} />
            <div>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', lineHeight: 1 }}>22°C</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Clear Sky & Calm</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1.25rem' }}>
            <p style={{ margin: 0 }}>💨 Wind: <strong>12 km/h</strong></p>
            <p style={{ margin: 0 }}>💧 Humidity: <strong>45%</strong></p>
            <p style={{ margin: 0 }}>☂️ Rain Prob: <strong>5%</strong></p>
          </div>
        </div>
      </section>

      {/* Operational Alerts */}
      <section className="glass-panel dashboard-widget hover-lift col-span-12" aria-labelledby="ops-alerts">
        <h3 id="ops-alerts" className="widget-title"><FiAlertTriangle className="text-gradient" /> Live Alerts</h3>
        <div className="alerts-list">
          {/* Active Database Reported Incidents */}
          {incidents && incidents.length > 0 && (
            incidents.map((inc: StadiumIncident) => (
              <div key={inc.id} className="alert-card critical" style={{ borderLeft: '3px solid var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{inc.type} (ACTIVE)</strong>
                  <p style={{ margin: 0, marginTop: '2px' }}>{inc.description} - <strong>{inc.zone.name}</strong></p>
                </div>
                <button 
                  onClick={() => handleResolveIncident(inc.id)}
                  className="resolve-btn"
                >
                  Resolve
                </button>
              </div>
            ))
          )}

          {/* Default Critical Alert */}
          {kpis.activeIncidents > 0 && !dismissedAlerts.includes('critical-default') && (
            <div className="alert-card critical" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid var(--danger)' }}>
              <div>
                <strong>CRITICAL</strong>
                <p style={{ margin: 0, marginTop: '2px' }}>Medical assistance deployed to South Stand. Evacuation routes cleared.</p>
              </div>
              <button 
                onClick={() => setDismissedAlerts(prev => [...prev, 'critical-default'])}
                className="resolve-btn"
              >
                Resolve
              </button>
            </div>
          )}

          {/* Standard Simulated Alerts */}
          {!dismissedAlerts.includes('parking') && (
            <div className="alert-card warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>WARNING</strong>
                <p style={{ margin: 0, marginTop: '2px' }}>Parking Sector B is at 95% capacity. Redirecting to Sector C.</p>
              </div>
              <button 
                onClick={() => setDismissedAlerts(prev => [...prev, 'parking'])}
                className="resolve-btn"
              >
                Resolve
              </button>
            </div>
          )}

          {!dismissedAlerts.includes('weather') && (
            <div className="alert-card info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>INFO</strong>
                <p style={{ margin: 0, marginTop: '2px' }}>All stadium systems nominal. Weather conditions ideal for kickoff.</p>
              </div>
              <button 
                onClick={() => setDismissedAlerts(prev => [...prev, 'weather'])}
                className="resolve-btn"
              >
                Resolve
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
