import { useState, useMemo, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiMap, FiClock, FiUsers, FiCoffee, FiPlusSquare, FiShoppingBag, FiInfo, FiAlertCircle, FiFilter, FiCpu } from 'react-icons/fi';
import { useStadium } from '../contexts/StadiumContext';
import { useAuth } from '../contexts/AuthContext';

interface Facility {
  id: string;
  name: string;
  type: string;
  location: string;
  isOpen: boolean;
  waitingTime: number;
}

interface Zone {
  id: string;
  name: string;
  description: string;
  density: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskLevel: string;
  waitingTime: number;
  facilities: Facility[];
}

const fetchStadiumData = async (stadiumId: string | null) => {
  if (!stadiumId) throw new Error('No stadium selected');
  const res = await fetch(`${API_BASE_URL}/api/stadium?stadiumId=${stadiumId}`);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

const getDensityColor = (density: string, isEmergency: boolean) => {
  if (isEmergency) return 'rgba(239, 68, 68, 0.45)'; // High warning red under SOS
  switch (density) {
    case 'LOW': return 'rgba(34, 197, 94, 0.3)';
    case 'MEDIUM': return 'rgba(245, 158, 11, 0.3)';
    case 'HIGH': return 'rgba(239, 68, 68, 0.3)';
    case 'CRITICAL': return 'rgba(153, 27, 27, 0.4)';
    default: return 'var(--glass-border)';
  }
};

const getFacilityIcon = (type: string) => {
  switch (type) {
    case 'RESTROOM': return <FiUsers aria-hidden="true" />;
    case 'MEDICAL': return <FiPlusSquare aria-hidden="true" />;
    case 'FOOD': return <FiCoffee aria-hidden="true" />;
    case 'MERCHANDISE': return <FiShoppingBag aria-hidden="true" />;
    default: return <FiInfo aria-hidden="true" />;
  }
};

const translations = {
  en: {
    title: 'Smart Operational Map',
    subtitle: 'Interactive command center for real-time crowd density and facility management.',
    filterAll: 'ALL',
    filterRestroom: 'RESTROOM',
    filterMedical: 'MEDICAL',
    filterFood: 'FOOD',
    triggerSOS: 'TRIGGER SOS',
    disableSOS: 'DISABLE SOS',
    densityLabel: 'Crowd Density',
    waitLabel: 'Avg Wait',
    facilitiesHeader: 'Facilities in Zone',
    noFacilities: 'No facilities match the current filter.',
    selectZonePrompt: 'Select a zone on the map to view real-time operations data.',
    legendLow: 'Low',
    legendMed: 'Med',
    legendHigh: 'High',
    userSeatTooltip: 'Your Seat ({seat})',
    stepFreeExit: 'Elevator/Ramp Exit (Step-free)',
    standardExit: 'Main Stairs Exit',
    evacuationAlert: 'EVACUATION ROUTE ACTIVE: Proceed to the closest exit. Ramps and elevators are highlighted for your profile.',
    standardEvacuationAlert: 'EVACUATION ROUTE ACTIVE: Proceed to the nearest stairs or exit gate.',
    pitch: 'THE PITCH',
    insightBar: 'Operational Insight',
    insightEmergency: 'CRITICAL ALERT: Stadium Evacuation Protocol Initiated. All spectators must proceed to the nearest marked exits.',
    insightCongestion: 'Operational Insight: {zone} is experiencing heavy congestion. Redirecting crowd flow.',
    insightNominal: 'Operational Insight: Stadium traffic is flowing nominally. All zones reporting safe crowd density.',
    reportBtn: 'Report Stand Issue',
    reportTitle: 'Report Stand Issue',
    reportSuccess: 'Incident Dispatched.',
    reportFail: 'Failed to report incident.',
    cancel: 'Cancel',
    sendReport: 'Send Alert'
  },
  es: {
    title: 'Mapa Operativo Inteligente',
    subtitle: 'Centro de comando interactivo para densidad de multitud y gestión de servicios.',
    filterAll: 'TODO',
    filterRestroom: 'BAÑOS',
    filterMedical: 'MÉDICO',
    filterFood: 'COMIDA',
    triggerSOS: 'ACTIVAR SOS',
    disableSOS: 'DESACTIVAR SOS',
    densityLabel: 'Densidad de Multitud',
    waitLabel: 'Espera Promedio',
    facilitiesHeader: 'Servicios en la Zona',
    noFacilities: 'No hay servicios que coincidan con el filtro actual.',
    selectZonePrompt: 'Seleccione una zona en el mapa para ver datos en tiempo real.',
    legendLow: 'Bajo',
    legendMed: 'Medio',
    legendHigh: 'Alto',
    userSeatTooltip: 'Su Asiento ({seat})',
    stepFreeExit: 'Salida de Rampa/Elevador (PMR)',
    standardExit: 'Salida de Escaleras Principal',
    evacuationAlert: 'RUTA DE EVACUACIÓN ACTIVA: Diríjase a la salida. Rampas y ascensores destacados para su perfil.',
    standardEvacuationAlert: 'RUTA DE EVACUACIÓN ACTIVA: Diríjase a la escalera o puerta de salida más cercana.',
    pitch: 'EL CAMPO',
    insightBar: 'Información Operativa',
    insightEmergency: 'ALERTA CRÍTICA: Protocolo de evacuación iniciado. Proceda a las salidas marcadas.',
    insightCongestion: 'Información Operativa: {zone} tiene alta congestión. Redirigiendo el flujo.',
    insightNominal: 'Información Operativa: El tráfico del estadio fluye nominalmente. Zonas seguras.',
    reportBtn: 'Reportar Problema de Grada',
    reportTitle: 'Reportar Incidente',
    reportSuccess: 'Incidente despachado.',
    reportFail: 'Error al enviar reporte.',
    cancel: 'Cancelar',
    sendReport: 'Enviar Alerta'
  },
  fr: {
    title: 'Carte Opérationnelle Intelligente',
    subtitle: 'Centre de commandement interactif pour la densité de foule et la gestion des services.',
    filterAll: 'TOUT',
    filterRestroom: 'TOILETTES',
    filterMedical: 'MÉDICAL',
    filterFood: 'NOURRITURE',
    triggerSOS: 'DÉCLENCHER SOS',
    disableSOS: 'DÉSACTIVER SOS',
    densityLabel: 'Densité de Foule',
    waitLabel: 'Attente Moyenne',
    facilitiesHeader: 'Services dans la Zone',
    noFacilities: 'Aucun service ne correspond au filtre actuel.',
    selectZonePrompt: 'Sélectionnez une zone sur la carte pour voir les données opérationnelles.',
    legendLow: 'Faible',
    legendMed: 'Moyen',
    legendHigh: 'Élevé',
    userSeatTooltip: 'Votre Siège ({seat})',
    stepFreeExit: 'Sortie Rampe/Ascenseur (PMR)',
    standardExit: 'Sortie Escaliers Principaux',
    evacuationAlert: 'PLAN D\'ÉVACUATION ACTIF : Procédez vers la sortie. Ramps et ascenseurs mis en évidence.',
    standardEvacuationAlert: 'PLAN D\'ÉVACUATION ACTIF : Procédez vers les escaliers ou issues les plus proches.',
    pitch: 'LE TERRAIN',
    insightBar: 'Informations Opérationnelles',
    insightEmergency: 'ALERTE CRITIQUE : Protocole d\'évacuation lancé. Dirigez-vous vers les sorties.',
    insightCongestion: 'Informations Opérationnelles : {zone} est encombrée. Redirection des foules.',
    insightNominal: 'Informations Opérationnelles : Circulation fluide dans tout le stade. Densités normales.',
    reportBtn: 'Signaler un problème',
    reportTitle: 'Signaler un incident',
    reportSuccess: 'Incident signalé.',
    reportFail: 'Erreur de signalement.',
    cancel: 'Annuler',
    sendReport: 'Envoyer l\'alerte'
  }
};

export const Maps = () => {
  const { activeStadiumId } = useStadium();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const t = translations[userProfile.preferredLanguage] || translations.en;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['stadium', activeStadiumId],
    queryFn: () => fetchStadiumData(activeStadiumId),
    refetchInterval: 30000,
    enabled: !!activeStadiumId,
  });

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Incident form local states
  const [showReportForm, setShowReportForm] = useState(false);
  const [incType, setIncType] = useState('SPILL');
  const [incDesc, setIncDesc] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');

  const zones: Zone[] = useMemo(() => data?.data?.zones || [], [data]);

  // Audio Evacuation Broadcaster (TTS)
  useEffect(() => {
    if (isEmergency) {
      // Stop any active speak
      window.speechSynthesis.cancel();
      
      const announceText = userProfile.accessibilityPreference === 'step-free'
        ? t.evacuationAlert
        : t.standardEvacuationAlert;
      
      const utterance = new SpeechSynthesisUtterance(announceText);
      utterance.lang = userProfile.preferredLanguage === 'es' 
        ? 'es-ES' 
        : userProfile.preferredLanguage === 'fr' 
          ? 'fr-FR' 
          : 'en-US';
      
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isEmergency, userProfile.accessibilityPreference, userProfile.preferredLanguage, t]);

  // Generate coordinates for user seat dot based on their ticket stand
  const userSeatCoords = useMemo(() => {
    const stand = userProfile.ticketSection.toLowerCase();
    if (stand.includes('north')) return { cx: 200, cy: 70 };
    if (stand.includes('south')) return { cx: 200, cy: 330 };
    if (stand.includes('east')) return { cx: 330, cy: 200 };
    if (stand.includes('west')) return { cx: 70, cy: 200 };
    if (stand.includes('vip')) return { cx: 200, cy: 125 };
    if (stand.includes('fan')) return { cx: 200, cy: 275 };
    return null;
  }, [userProfile.ticketSection]);

  // Generate evacuation path based on accessibility preference
  const evacuationPathD = useMemo(() => {
    if (!userSeatCoords) return '';
    const stand = userProfile.ticketSection.toLowerCase();
    const isStepFree = userProfile.accessibilityPreference === 'step-free';

    if (isStepFree) {
      if (stand.includes('north')) return 'M 200 70 L 200 20';
      if (stand.includes('south')) return 'M 200 330 L 200 380';
      if (stand.includes('east')) return 'M 330 200 L 380 200';
      if (stand.includes('west')) return 'M 70 200 L 20 200';
      if (stand.includes('vip')) return 'M 200 125 L 200 20';
      if (stand.includes('fan')) return 'M 200 275 L 200 380';
    } else {
      if (stand.includes('north')) return 'M 200 70 L 80 40 L 20 20';
      if (stand.includes('south')) return 'M 200 330 L 320 360 L 380 380';
      if (stand.includes('east')) return 'M 330 200 L 360 80 L 380 20';
      if (stand.includes('west')) return 'M 70 200 L 40 320 L 20 380';
      if (stand.includes('vip')) return 'M 200 125 L 80 40 L 20 20';
      if (stand.includes('fan')) return 'M 200 275 L 320 360 L 380 380';
    }
    return '';
  }, [userSeatCoords, userProfile.ticketSection, userProfile.accessibilityPreference]);

  // Generate an AI Insight based on live data
  const aiInsight = useMemo(() => {
    if (isEmergency) {
      return t.insightEmergency;
    }
    const criticalZone = zones.find(z => z.density === 'CRITICAL' || z.density === 'HIGH');
    if (criticalZone) {
      return t.insightCongestion.replace('{zone}', criticalZone.name);
    }
    return t.insightNominal;
  }, [zones, isEmergency, t]);

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDesc.trim() || !selectedZone) return;
    setIsReporting(true);
    setReportSuccessMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/incident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: incType,
          description: incDesc.trim(),
          zoneId: selectedZone.id
        })
      });

      if (response.ok) {
        setReportSuccessMsg(t.reportSuccess);
        setIncDesc('');
        setShowReportForm(false);
        queryClient.invalidateQueries({ queryKey: ['stadium', activeStadiumId] });
        setTimeout(() => setReportSuccessMsg(''), 4000);
      } else {
        alert(t.reportFail);
      }
    } catch (err) {
      console.error(err);
      alert(t.reportFail);
    } finally {
      setIsReporting(false);
    }
  };

  // Render SVG representation for a zone based on its database seeded name
  const renderZonePath = (zone: Zone) => {
    const name = zone.name.toLowerCase();
    const isSelected = selectedZone?.id === zone.id;
    const isUserStand = userProfile.ticketSection === zone.name;
    const fill = getDensityColor(zone.density, isEmergency);
    const stroke = isSelected ? 'var(--accent-blue)' : (isUserStand ? 'var(--accent-purple)' : 'var(--glass-border)');
    const strokeWidth = isSelected ? 3 : (isUserStand ? 2.5 : 1.5);
    const strokeDash = isUserStand ? '4,4' : 'none';

    const handleClick = () => {
      setSelectedZone(zone);
      setShowReportForm(false); // Reset form visibility when changing zones
    };

    if (name.includes('north stand')) {
      return (
        <path
          key={zone.id}
          d="M 80 40 L 320 40 L 280 100 L 120 100 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          className={`stadium-stand ${isSelected ? 'active-stand' : ''}`}
          onClick={handleClick}
        >
          <title>{zone.name} - {zone.density} Density</title>
        </path>
      );
    }
    if (name.includes('south stand')) {
      return (
        <path
          key={zone.id}
          d="M 120 300 L 280 300 L 320 360 L 80 360 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          className={`stadium-stand ${isSelected ? 'active-stand' : ''}`}
          onClick={handleClick}
        >
          <title>{zone.name} - {zone.density} Density</title>
        </path>
      );
    }
    if (name.includes('east stand')) {
      return (
        <path
          key={zone.id}
          d="M 300 120 L 360 80 L 360 320 L 300 280 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          className={`stadium-stand ${isSelected ? 'active-stand' : ''}`}
          onClick={handleClick}
        >
          <title>{zone.name} - {zone.density} Density</title>
        </path>
      );
    }
    if (name.includes('west stand')) {
      return (
        <path
          key={zone.id}
          d="M 40 80 L 100 120 L 100 280 L 40 320 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          className={`stadium-stand ${isSelected ? 'active-stand' : ''}`}
          onClick={handleClick}
        >
          <title>{zone.name} - {zone.density} Density</title>
        </path>
      );
    }
    if (name.includes('vip')) {
      return (
        <rect
          key={zone.id}
          x="125"
          y="110"
          width="150"
          height="25"
          rx="4"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          className={`stadium-stand ${isSelected ? 'active-stand' : ''}`}
          onClick={handleClick}
        >
          <title>{zone.name} - VIP Section</title>
        </rect>
      );
    }
    if (name.includes('fan')) {
      return (
        <rect
          key={zone.id}
          x="125"
          y="265"
          width="150"
          height="25"
          rx="4"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          className={`stadium-stand ${isSelected ? 'active-stand' : ''}`}
          onClick={handleClick}
        >
          <title>{zone.name} - Fan Zone</title>
        </rect>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="typing-indicator" style={{ transform: 'scale(1.5)' }} aria-label="Loading map data">...</div>
      </div>
    );
  }

  if (isError) {
    return <div className="page-container text-muted" role="alert">Error loading stadium data. Is the backend running?</div>;
  }

  return (
    <article className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Helmet>
        <title>{t.title} | FIFA World Cup 2026™</title>
        <meta name="description" content="Interactive operational stadium map featuring real-time crowd density, facility wait times, and emergency evacuation protocols." />
      </Helmet>

      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>{t.title}</h2>
          <p className="text-muted">{t.subtitle}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="filters" style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <FiFilter className="text-muted" style={{ margin: 'auto 0.5rem' }} aria-hidden="true" />
            {['ALL', 'RESTROOM', 'MEDICAL', 'FOOD'].map(filter => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className="filter-btn"
                style={{ 
                  background: activeFilter === filter ? 'var(--accent-blue)' : 'transparent',
                  color: activeFilter === filter ? '#000' : 'var(--text-main)',
                  border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'
                }}
                aria-pressed={activeFilter === filter}
              >
                {filter === 'ALL' ? t.filterAll : filter === 'RESTROOM' ? t.filterRestroom : filter === 'MEDICAL' ? t.filterMedical : t.filterFood}
              </button>
            ))}
          </div>

          <button 
            className={`btn-primary ${isEmergency ? 'emergency-active' : ''}`}
            onClick={() => setIsEmergency(!isEmergency)}
            style={{ 
              background: isEmergency ? 'transparent' : 'var(--danger)', 
              border: isEmergency ? '2px solid var(--danger)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: isEmergency ? '0 0 15px var(--danger)' : 'none'
            }}
            aria-label="Toggle Emergency Evacuation Mode"
          >
            <FiAlertCircle aria-hidden="true" />
            {isEmergency ? t.disableSOS : t.triggerSOS}
          </button>
        </div>
      </header>
      
      {isEmergency && (
        <div 
          role="alert" 
          style={{ 
            background: 'rgba(239, 68, 68, 0.2)', 
            border: '2px solid var(--danger)', 
            borderRadius: 'var(--radius-md)', 
            padding: '1rem 1.5rem', 
            marginBottom: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            animation: 'pulse-glow-danger 1.5s infinite' 
          }}
        >
          <FiAlertCircle size={28} style={{ color: 'var(--danger)' }} />
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-main)' }}>
            {userProfile.accessibilityPreference === 'step-free' ? t.evacuationAlert : t.standardEvacuationAlert}
          </p>
        </div>
      )}

      <section style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }} aria-label="Map Interaction Area">
        
        {/* SVG Interactive Map Area */}
        <div className={`glass-panel map-container ${isEmergency ? 'emergency-pulse-bg' : ''}`} style={{ flex: 2, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          
          <div className="stadium-map-wrapper">
            <svg viewBox="0 0 400 400" className="stadium-svg" role="img" aria-label="Interactive Stadium Map">
              
              {/* Ground Pitch */}
              <rect x="120" y="145" width="160" height="110" rx="10" fill="#1e3a1e" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
              <line x1="200" y1="145" x2="200" y2="255" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
              <circle cx="200" cy="200" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
              <text x="200" y="204" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">
                {t.pitch}
              </text>

              {/* Render dynamic zone paths */}
              {zones.map(renderZonePath)}

              {/* Stand Exits representation */}
              {/* Corner Staircases */}
              <rect x="10" y="10" width="15" height="15" rx="2" fill={isEmergency ? 'var(--danger)' : '#1e293b'} stroke="var(--glass-border)" />
              <text x="17" y="21" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">E</text>
              
              <rect x="375" y="10" width="15" height="15" rx="2" fill={isEmergency ? 'var(--danger)' : '#1e293b'} stroke="var(--glass-border)" />
              <text x="382" y="21" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">E</text>
              
              <rect x="10" y="375" width="15" height="15" rx="2" fill={isEmergency ? 'var(--danger)' : '#1e293b'} stroke="var(--glass-border)" />
              <text x="17" y="386" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">E</text>
              
              <rect x="375" y="375" width="15" height="15" rx="2" fill={isEmergency ? 'var(--danger)' : '#1e293b'} stroke="var(--glass-border)" />
              <text x="382" y="386" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">E</text>

              {/* Step-free elevator exits (Middle Edges) */}
              <circle cx="200" cy="15" r="9" fill={isEmergency ? 'var(--success)' : '#1e293b'} stroke="var(--accent-blue)" strokeWidth="1" />
              <text x="200" y="18" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">♿</text>
              
              <circle cx="200" cy="385" r="9" fill={isEmergency ? 'var(--success)' : '#1e293b'} stroke="var(--accent-blue)" strokeWidth="1" />
              <text x="200" y="388" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">♿</text>

              <circle cx="15" cy="200" r="9" fill={isEmergency ? 'var(--success)' : '#1e293b'} stroke="var(--accent-blue)" strokeWidth="1" />
              <text x="15" y="203" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">♿</text>

              <circle cx="385" cy="200" r="9" fill={isEmergency ? 'var(--success)' : '#1e293b'} stroke="var(--accent-blue)" strokeWidth="1" />
              <text x="385" y="203" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">♿</text>

              {/* Evacuation Path */}
              {isEmergency && evacuationPathD && (
                <path 
                  d={evacuationPathD} 
                  className="evacuation-path active" 
                  aria-label="Evacuation route"
                />
              )}

              {/* User Seat Dot */}
              {userSeatCoords && (
                <g>
                  <circle 
                    cx={userSeatCoords.cx} 
                    cy={userSeatCoords.cy} 
                    className="user-seat-dot" 
                  />
                  <title>{t.userSeatTooltip.replace('{seat}', userProfile.seatNumber)}</title>
                </g>
              )}
            </svg>
          </div>

          <div className="map-legend" style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.85)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }}></div> {t.legendLow}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--warning)' }}></div> {t.legendMed}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)' }}></div> {t.legendHigh}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-purple)' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-purple)' }}></div> Seat</span>
          </div>

          {/* GenAI Insight Bar */}
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', background: isEmergency ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 240, 255, 0.08)', border: `1px solid ${isEmergency ? 'var(--danger)' : 'var(--accent-blue)'}`, padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FiCpu size={20} style={{ color: isEmergency ? 'var(--danger)' : 'var(--accent-blue)', flexShrink: 0 }} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: '1.4' }}>{aiInsight}</p>
          </div>
        </div>

        {/* Dynamic Side Panel */}
        <aside className={`glass-panel side-panel ${selectedZone ? 'open' : ''}`} style={{ flex: selectedZone ? 1.1 : 0, transition: 'all 0.3s ease', overflowY: 'auto' }} aria-hidden={!selectedZone}>
          {selectedZone ? (
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h3 className="text-gradient" style={{ fontSize: '1.5rem' }}>{selectedZone.name}</h3>
                <button onClick={() => setSelectedZone(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }} aria-label="Close panel">&times;</button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                  <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{t.densityLabel}</p>
                  <p style={{ color: getDensityColor(selectedZone.density, isEmergency), fontWeight: 'bold', fontSize: '1.15rem', marginTop: '0.25rem' }}>{isEmergency ? 'EVACUATING' : selectedZone.density}</p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                  <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{t.waitLabel}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem', fontWeight: 'bold', color: isEmergency ? 'var(--danger)' : 'inherit', marginTop: '0.25rem' }}>
                    <FiClock aria-hidden="true" /> {isEmergency ? 'N/A' : `${selectedZone.waitingTime}m`}
                  </p>
                </div>
              </div>

              <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.facilitiesHeader}</h4>
              
              {selectedZone.facilities.filter(f => activeFilter === 'ALL' || f.type === activeFilter).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedZone.facilities
                    .filter(f => activeFilter === 'ALL' || f.type === activeFilter)
                    .map(facility => (
                    <div key={facility.id} style={{ background: 'var(--surface-color)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: facility.type === 'MEDICAL' && isEmergency ? 'var(--danger)' : 'var(--accent-blue)', padding: '0.5rem', background: facility.type === 'MEDICAL' && isEmergency ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 240, 255, 0.1)', borderRadius: 'var(--radius-sm)', display: 'flex' }}>
                          {getFacilityIcon(facility.type)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{facility.name}</p>
                          <p className="text-muted" style={{ fontSize: '0.8rem' }}>{facility.location}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: facility.isOpen ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {facility.isOpen ? 'OPEN' : 'CLOSED'}
                        </p>
                        {facility.isOpen && !isEmergency && (
                          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>Wait: {facility.waitingTime}m</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center" style={{ padding: '2rem 0', fontSize: '0.9rem' }}>{t.noFacilities}</p>
              )}

              {/* Stand Issue Reporting Form */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                {reportSuccessMsg && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>
                    {reportSuccessMsg}
                  </p>
                )}

                {!showReportForm ? (
                  <button
                    onClick={() => setShowReportForm(true)}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: 'var(--danger)',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    {t.reportBtn}
                  </button>
                ) : (
                  <form onSubmit={handleReportIncident} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--danger)', textTransform: 'uppercase' }}>
                      {t.reportTitle}
                    </p>
                    
                     <label htmlFor="map-inc-type" className="sr-only">Incident Type</label>
                     <select
                       id="map-inc-type"
                       value={incType}
                       onChange={(e) => setIncType(e.target.value)}
                       className="settings-select"
                       style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.35)' }}
                     >
                       <option value="SPILL">Spill / Clean Request</option>
                       <option value="MEDICAL">Medical assistance</option>
                       <option value="SAFETY">Safety / Crowd hazard</option>
                       <option value="MAINTENANCE">Maintenance issue</option>
                     </select>

                     <label htmlFor="map-inc-desc" className="sr-only">Incident Description</label>
                     <input
                       id="map-inc-desc"
                       type="text"
                       value={incDesc}
                       onChange={(e) => setIncDesc(e.target.value)}
                       placeholder="e.g. Broken seats at row 5"
                       required
                       className="settings-input"
                       style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.35)' }}
                     />

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button 
                        type="submit" 
                        disabled={isReporting || !incDesc.trim()} 
                        className="btn-primary" 
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                      >
                        {isReporting ? '...' : t.sendReport}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowReportForm(false)} 
                        className="filter-btn" 
                        style={{ 
                          flex: 1, 
                          padding: '0.5rem', 
                          fontSize: '0.8rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--text-main)'
                        }}
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          ) : (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FiMap size={44} style={{ opacity: 0.3, marginBottom: '1rem' }} aria-hidden="true" />
              <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{t.selectZonePrompt}</p>
            </div>
          )}
        </aside>
      </section>
    </article>
  );
};
