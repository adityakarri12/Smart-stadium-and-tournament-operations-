import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api';
import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiPieChart, FiBarChart2, FiActivity, FiAlertOctagon, FiCpu, FiTrendingUp } from 'react-icons/fi';
import { useStadium } from '../contexts/StadiumContext';
import { useAuth } from '../contexts/AuthContext';

interface DashboardData {
  stadiumName: string;
  zones: any[];
  events: any[];
  incidents: any[];
  kpis: {
    totalSpectators: number;
    occupancyPercent: number;
    activeIncidents: number;
    openFacilities: number;
    avgWaitTime: number;
  };
}

const fetchDashboardData = async (stadiumId: string | null): Promise<{ data: DashboardData }> => {
  if (!stadiumId) throw new Error('No stadium selected');
  const res = await fetch(`${API_BASE_URL}/api/dashboard?stadiumId=${stadiumId}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
};

const fetchAnalyticsDigest = async (stadiumId: string | null, lang: string): Promise<{ success: boolean; data: { digest: string } }> => {
  if (!stadiumId) throw new Error('No stadium selected');
  const res = await fetch(`${API_BASE_URL}/api/analytics/digest?stadiumId=${stadiumId}&lang=${lang}`);
  if (!res.ok) throw new Error('Failed to fetch analytics digest');
  return res.json();
};

const translations = {
  en: {
    title: 'Operational Analytics',
    subtitle: 'Real-time resource utilization, safety pictograms, and crowd telemetry.',
    summary: 'GenAI Analytics Digest',
    waitTimes: 'Concourse Wait Times (Minutes)',
    distribution: 'Stand Allocation & Capacity',
    incidentMatrix: 'Active Safety Matrix (Pictogram)',
    matrixLegendActive: 'Active Hazard',
    matrixLegendResolved: 'Resolved',
    matrixLegendSafe: 'Nominal Sector',
    avgWaitTime: 'Avg Wait Time',
    occupancy: 'Occupancy Rate',
    safetyStatus: 'Safety Incidents',
    stadiumSelector: 'Active Telemetry'
  },
  es: {
    title: 'Analíticas Operativas',
    subtitle: 'Uso de recursos en tiempo real, pictogramas de seguridad y telemetría de multitud.',
    summary: 'Resumen de Analítica GenAI',
    waitTimes: 'Tiempos de Espera en Pasillos (Minutos)',
    distribution: 'Asignación de Gradas y Capacidad',
    incidentMatrix: 'Matriz de Seguridad Activa (Pictograma)',
    matrixLegendActive: 'Peligro Activo',
    matrixLegendResolved: 'Resuelto',
    matrixLegendSafe: 'Sector Nominal',
    avgWaitTime: 'Espera Promedio',
    occupancy: 'Tasa de Ocupación',
    safetyStatus: 'Incidentes de Seguridad',
    stadiumSelector: 'Telemetría Activa'
  },
  fr: {
    title: 'Analyses Opérationnelles',
    subtitle: 'Utilisation des ressources en temps réel, pictogrammes de sécurité et télémétrie.',
    summary: 'Synthèse d\'Analyse GenAI',
    waitTimes: 'Temps d\'Attente dans les Halls (Minutes)',
    distribution: 'Allocation des Tribunes & Capacité',
    incidentMatrix: 'Matrice de Sécurité Active (Pictogramme)',
    matrixLegendActive: 'Danger Actif',
    matrixLegendResolved: 'Résolu',
    matrixLegendSafe: 'Secteur Nominal',
    avgWaitTime: 'Attente Moyenne',
    occupancy: 'Taux d\'Occupation',
    safetyStatus: 'Incidents de Sécurité',
    stadiumSelector: 'Télémétrie Active'
  }
};

export const Analytics = () => {
  const { activeStadiumId } = useStadium();
  const { userProfile } = useAuth();
  
  const t = translations[userProfile.preferredLanguage] || translations.en;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', activeStadiumId],
    queryFn: () => fetchDashboardData(activeStadiumId),
    refetchInterval: 15000,
    enabled: !!activeStadiumId,
  });

  const { data: digestData } = useQuery({
    queryKey: ['analyticsDigest', activeStadiumId, userProfile.preferredLanguage],
    queryFn: () => fetchAnalyticsDigest(activeStadiumId, userProfile.preferredLanguage),
    refetchInterval: 30000,
    enabled: !!activeStadiumId,
  });

  const dashboardData = data?.data;

  // Process data for charts
  const zones = useMemo(() => dashboardData?.zones || [], [dashboardData]);
  const kpis = useMemo(() => dashboardData?.kpis || { totalSpectators: 0, occupancyPercent: 0, activeIncidents: 0, openFacilities: 0, avgWaitTime: 0 }, [dashboardData]);

  // SVG Chart Computations
  // 1. Wait Times (Vertical Bar Chart SVG coordinates)
  const barChartData = useMemo(() => {
    if (zones.length === 0) return [];
    const maxWait = Math.max(...zones.map((z: any) => z.waitingTime), 15);
    return zones.map((zone: any, index: number) => {
      const height = (zone.waitingTime / maxWait) * 120; // max height 120px
      const x = 60 + index * 70;
      return {
        name: zone.name.replace(' Stand', ''),
        value: zone.waitingTime,
        height,
        x,
        y: 160 - height
      };
    });
  }, [zones]);

  // 2. Stand Distribution (Circle Gauges)
  const standDistributionData = useMemo(() => {
    return zones.map((zone: any) => {
      let densityPercent = 30;
      if (zone.density === 'MEDIUM') densityPercent = 60;
      if (zone.density === 'HIGH') densityPercent = 85;
      if (zone.density === 'CRITICAL') densityPercent = 95;
      
      const r = 32;
      const circ = 2 * Math.PI * r; // ~201
      const offset = circ - (circ * densityPercent) / 100;
      
      return {
        name: zone.name,
        density: zone.density,
        percent: densityPercent,
        circ,
        offset
      };
    });
  }, [zones]);

  // 3. GenAI Telemetry Analysis Summary
  const genAiAnalysis = digestData?.data?.digest || 'Analyzing stadium operations...';

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="typing-indicator" style={{ transform: 'scale(1.5)' }} aria-label="Loading analytics data">...</div>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return <div className="page-container text-danger" role="alert">Error loading operational analytics data.</div>;
  }

  // Safety Pictogram matrix (50 dots representing sections)
  // Red: active incidents, Green: solved simulated/DB incidents, Gray: nominal
  const pictogramDots = Array.from({ length: 50 }).map((_, i) => {
    if (i < kpis.activeIncidents) return 'active';
    if (i < kpis.activeIncidents + 3) return 'resolved'; // Simulated solved
    return 'nominal';
  });

  return (
    <article className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Helmet>
        <title>{t.title} | FIFA World Cup 2026™</title>
        <meta name="description" content="Operational analytics and interactive SVG charts mapping spectator distribution, incident logs, and facility wait times." />
      </Helmet>

      <header>
        <h2>{t.title}</h2>
        <p className="text-muted">{t.subtitle}</p>
      </header>

      {/* KPI Cards Row */}
      <section className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }} aria-label="KPI Metrics">
        <div className="glass-panel kpi-item" style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '1.25rem' }}>
          <div>
            <span className="kpi-label">{t.occupancy}</span>
            <span className="kpi-value text-gradient" style={{ fontSize: '2rem', display: 'block', marginTop: '0.25rem' }}>{kpis.occupancyPercent}%</span>
          </div>
          <FiTrendingUp size={36} style={{ color: 'var(--accent-blue)', opacity: 0.8 }} />
        </div>

        <div className="glass-panel kpi-item" style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '1.25rem' }}>
          <div>
            <span className="kpi-label">{t.avgWaitTime}</span>
            <span className="kpi-value" style={{ fontSize: '2rem', display: 'block', marginTop: '0.25rem' }}>{kpis.avgWaitTime}m</span>
          </div>
          <FiActivity size={36} style={{ color: 'var(--accent-purple)', opacity: 0.8 }} />
        </div>

        <div className="glass-panel kpi-item" style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '1.25rem' }}>
          <div>
            <span className="kpi-label">{t.safetyStatus}</span>
            <span className="kpi-value" style={{ fontSize: '2rem', display: 'block', marginTop: '0.25rem', color: kpis.activeIncidents > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {kpis.activeIncidents}
            </span>
          </div>
          <FiAlertOctagon size={36} style={{ color: kpis.activeIncidents > 0 ? 'var(--danger)' : 'var(--success)', opacity: 0.8 }} />
        </div>
      </section>

      {/* GenAI Advice Panel */}
      <section className="glass-panel" style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(0, 240, 255, 0.05)', border: '1px solid var(--accent-blue)', padding: '1rem 1.5rem' }} aria-labelledby="ai-title">
        <FiCpu size={24} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} aria-hidden="true" />
        <div>
          <h4 id="ai-title" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-blue)', margin: 0 }}>{t.summary}</h4>
          <p style={{ margin: 0, fontSize: '0.95rem', marginTop: '0.15rem' }}>{genAiAnalysis}</p>
        </div>
      </section>

      {/* Analytics Visualization Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }} aria-label="Data Charts">
        
        {/* Donut Allocation Gauges */}
        <div className="glass-panel dashboard-widget" style={{ padding: '1.5rem' }}>
          <h3 className="widget-title" style={{ fontSize: '1.1rem' }}><FiPieChart className="text-gradient" /> {t.distribution}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1rem', marginTop: '1rem', justifyItems: 'center' }}>
            {standDistributionData.map((stand, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle 
                      cx="40" cy="40" r="32" fill="none" 
                      stroke={stand.percent > 80 ? 'var(--danger)' : stand.percent > 50 ? 'var(--warning)' : 'var(--success)'} 
                      strokeWidth="6"
                      strokeDasharray={stand.circ}
                      strokeDashoffset={stand.offset}
                      strokeLinecap="round"
                      transform="rotate(-90 40 40)"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{stand.percent}%</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', textAlign: 'center' }}>{stand.name.replace(' Stand', '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wait Times Bar Graph */}
        <div className="glass-panel dashboard-widget" style={{ padding: '1.5rem' }}>
          <h3 className="widget-title" style={{ fontSize: '1.1rem' }}><FiBarChart2 className="text-gradient" /> {t.waitTimes}</h3>
          
          <div style={{ width: '100%', marginTop: '1rem' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: 'auto', background: 'transparent' }} aria-label="Bar chart showing wait times per stand concourse">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Grid y-lines */}
              <line x1="40" y1="30" x2="480" y2="30" stroke="rgba(255,255,255,0.06)" />
              <line x1="40" y1="95" x2="480" y2="95" stroke="rgba(255,255,255,0.06)" />
              <line x1="40" y1="160" x2="480" y2="160" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

              {/* Y Axis Legend values */}
              <text x="30" y="34" fill="var(--text-muted)" fontSize="9" textAnchor="end">Max</text>
              <text x="30" y="99" fill="var(--text-muted)" fontSize="9" textAnchor="end">Med</text>
              <text x="30" y="164" fill="var(--text-muted)" fontSize="9" textAnchor="end">0m</text>

              {/* Map bars */}
              {barChartData.map((bar, i) => (
                <g key={i}>
                  <rect 
                    x={bar.x} 
                    y={bar.y} 
                    width="35" 
                    height={bar.height} 
                    rx="4" 
                    fill="url(#barGrad)" 
                    stroke="var(--accent-purple)"
                    strokeWidth="1"
                    style={{ transition: 'height 0.8s ease, y 0.8s ease' }}
                  />
                  {/* Wait minutes value on top of bar */}
                  <text 
                    x={bar.x + 17.5} 
                    y={bar.y - 8} 
                    fill="var(--text-main)" 
                    fontSize="10" 
                    fontWeight="bold" 
                    textAnchor="middle"
                  >
                    {bar.value}m
                  </text>
                  {/* Concourse stand name label below bar */}
                  <text 
                    x={bar.x + 17.5} 
                    y="180" 
                    fill="var(--text-muted)" 
                    fontSize="9.5" 
                    fontWeight="500" 
                    textAnchor="middle"
                  >
                    {bar.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Safety Incident Pictogram Matrix */}
        <div className="glass-panel dashboard-widget col-span-12" style={{ padding: '1.5rem' }}>
          <h3 className="widget-title" style={{ fontSize: '1.1rem' }}><FiAlertOctagon className="text-gradient" /> {t.incidentMatrix}</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
              {pictogramDots.map((status, index) => {
                let color = 'rgba(255,255,255,0.1)'; // nominal
                let isPulsing = false;
                if (status === 'active') {
                  color = 'var(--danger)';
                  isPulsing = true;
                } else if (status === 'resolved') {
                  color = 'var(--success)';
                }
                
                return (
                  <div 
                    key={index} 
                    style={{ 
                      width: '18px', 
                      height: '18px', 
                      borderRadius: '50%', 
                      background: color, 
                      border: '1px solid rgba(255,255,255,0.05)',
                      animation: isPulsing ? 'pulse-glow-danger 1s infinite' : 'none'
                    }}
                    title={`Sector ${index + 1}: ${status === 'active' ? 'Hazard Active' : status === 'resolved' ? 'Resolved Incident' : 'Nominal'}`}
                  />
                );
              })}
            </div>

            {/* Pictogram Legend */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--danger)', animation: 'pulse-glow-danger 1s infinite' }} />
                {t.matrixLegendActive}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--success)' }} />
                {t.matrixLegendResolved} (Seeded)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                {t.matrixLegendSafe}
              </span>
            </div>
          </div>
        </div>

      </section>
    </article>
  );
};
