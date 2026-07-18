import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { useQuery } from '@tanstack/react-query';
import { FiHome, FiMessageSquare, FiGrid, FiMap, FiGlobe, FiLogOut, FiSettings, FiUser, FiCheck, FiTrendingUp } from 'react-icons/fi';
import { useStadium } from '../contexts/StadiumContext';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { Dropdown } from '../components/Dropdown';
import type { AccessibilityPreference, CountryNode, LanguageCode, StadiumNode } from '../types/stadium';

const fetchHierarchy = async () => {
  const res = await fetch(`${API_BASE_URL}/api/hierarchy`);
  if (!res.ok) throw new Error('Failed to load hierarchy');
  return res.json();
};

const translations = {
  en: {
    home: 'Home',
    assistant: 'AI Assistant',
    dashboard: 'Live Dashboard',
    maps: 'Stadium Maps',
    settings: 'Profile Settings',
    globalContext: 'Global Context',
    selectCountry: 'Select Country',
    selectStadium: 'Select Stadium',
    logout: 'Secure Logout',
    admin: 'Admin User',
    ops: 'Operations',
    save: 'Save Profile',
    nameLabel: 'Spectator Name',
    langLabel: 'Preferred Language',
    accessLabel: 'Accessibility Needs',
    sectionLabel: 'Ticket Stand / Section',
    seatLabel: 'Seat Number',
    none: 'None (Standard Access)',
    stepFree: 'Step-Free Access (Ramps/Elevators)',
    visual: 'Visual Assistance (High Contrast)',
    skipLink: 'Skip to main content',
    analytics: 'Analytics',
  },
  es: {
    home: 'Inicio',
    assistant: 'Asistente IA',
    dashboard: 'Panel en Vivo',
    maps: 'Mapas del Estadio',
    settings: 'Perfil y Ajustes',
    globalContext: 'Contexto Global',
    selectCountry: 'Seleccionar País',
    selectStadium: 'Seleccionar Estadio',
    logout: 'Cierre Seguro',
    admin: 'Usuario Admin',
    ops: 'Operaciones',
    save: 'Guardar Perfil',
    nameLabel: 'Nombre del Espectador',
    langLabel: 'Idioma Preferido',
    accessLabel: 'Necesidades de Accesibilidad',
    sectionLabel: 'Tribuna / Sección',
    seatLabel: 'Número de Asiento',
    none: 'Ninguna (Acceso Estándar)',
    stepFree: 'Acceso sin Escalones (Rampas/Elevadores)',
    visual: 'Asistencia Visual (Alto Contraste)',
    skipLink: 'Saltar al contenido principal',
    analytics: 'Analíticas',
  },
  fr: {
    home: 'Accueil',
    assistant: 'Assistant IA',
    dashboard: 'Tableau de Bord',
    maps: 'Cartes du Stade',
    settings: 'Profil & Réglages',
    globalContext: 'Contexte Global',
    selectCountry: 'Choisir le Pays',
    selectStadium: 'Choisir le Stade',
    logout: 'Déconnexion',
    admin: 'Administrateur',
    ops: 'Opérations',
    save: 'Enregistrer le Profil',
    nameLabel: 'Nom du Spectateur',
    langLabel: 'Langue Préférée',
    accessLabel: 'Besoins d\'Accessibilité',
    sectionLabel: 'Tribune / Section',
    seatLabel: 'Numéro de Siège',
    none: 'Aucun (Accès Standard)',
    stepFree: 'Accès sans Marche (Rampes/Ascenseurs)',
    visual: 'Assistance Visuelle (Contraste Élevé)',
    skipLink: 'Passer au contenu principal',
    analytics: 'Analyses',
  }
};

export const Layout = () => {
  const { activeStadiumId, setActiveStadiumId } = useStadium();
  const { isAuthenticated, logout, userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const { data } = useQuery({ queryKey: ['hierarchy'], queryFn: fetchHierarchy });
  
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Local settings states
  const [tempName, setTempName] = useState(userProfile.name);
  const [tempLanguage, setTempLanguage] = useState(userProfile.preferredLanguage);
  const [tempAccessibility, setTempAccessibility] = useState(userProfile.accessibilityPreference);
  const [tempSection, setTempSection] = useState(userProfile.ticketSection);
  const [tempSeat, setTempSeat] = useState(userProfile.seatNumber);

  const countries = useMemo(() => data?.data || [], [data]);
  const t = translations[userProfile.preferredLanguage] || translations.en;
  
  // Auto-select first country and stadium if none selected
  useEffect(() => {
    if (countries.length > 0 && !selectedCountryId) {
      setSelectedCountryId(countries[0].id);
      if (!activeStadiumId && countries[0].cities[0]?.stadiums[0]) {
        setActiveStadiumId(countries[0].cities[0].stadiums[0].id);
      }
    }
  }, [countries, selectedCountryId, activeStadiumId, setActiveStadiumId]);

  // Update temp state when userProfile changes
  useEffect(() => {
    setTempName(userProfile.name);
    setTempLanguage(userProfile.preferredLanguage);
    setTempAccessibility(userProfile.accessibilityPreference);
    setTempSection(userProfile.ticketSection);
    setTempSeat(userProfile.seatNumber);
  }, [userProfile, isSettingsOpen]);

  // Accessibility: Close settings modal on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isSettingsOpen]);

  const selectedCountry = countries.find((country: CountryNode) => country.id === selectedCountryId);
  const availableStadiums: StadiumNode[] = selectedCountry?.cities.flatMap((city: CountryNode['cities'][number]) => city.stadiums) || [];

  const countryOptions = countries.map((country: CountryNode) => ({ id: country.id, label: country.name }));
  const stadiumOptions = availableStadiums.map((stadium: StadiumNode) => ({ id: stadium.id, label: stadium.name }));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: tempName,
      preferredLanguage: tempLanguage,
      accessibilityPreference: tempAccessibility,
      ticketSection: tempSection,
      seatNumber: tempSeat,
    });
    setIsSettingsOpen(false);
  };

  return (
    <div className="app-container">
      {/* Accessibility Skip Link */}
      <a href="#main-content-landmark" className="skip-to-content">
        {t.skipLink}
      </a>

      <nav className="sidebar-nav" aria-label="Main Navigation">
        <div className="sidebar-brand">
          <h1 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            FIFA 2026<br/>Assistant
          </h1>
        </div>
        
        {isAuthenticated && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.35)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-blue)' }}>
              <FiGlobe /> <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>{t.globalContext}</span>
            </div>
            
            <Dropdown
              value={selectedCountryId}
              options={countryOptions}
              placeholder={t.selectCountry}
              onChange={(id) => {
                setSelectedCountryId(id);
                const newCountry = countries.find((country: CountryNode) => country.id === id);
                const firstStadium = newCountry?.cities[0]?.stadiums[0];
                if (firstStadium) setActiveStadiumId(firstStadium.id);
              }}
            />

            <div style={{ marginTop: '0.5rem' }}>
              <Dropdown
                value={activeStadiumId || ''}
                options={stadiumOptions}
                placeholder={t.selectStadium}
                disabled={!selectedCountryId}
                onChange={(id) => setActiveStadiumId(id)}
              />
            </div>
          </div>
        )}

        <ul className="nav-links" style={{ flex: 1 }}>
          <li>
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} end>
              <FiHome /> {t.home}
            </NavLink>
          </li>
          {isAuthenticated && (
            <>
              <li>
                <NavLink to="/assistant" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  <FiMessageSquare /> {t.assistant}
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  <FiGrid /> {t.dashboard}
                </NavLink>
              </li>
              <li>
                <NavLink to="/maps" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  <FiMap /> {t.maps}
                </NavLink>
              </li>
              <li>
                <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  <FiTrendingUp /> {t.analytics}
                </NavLink>
              </li>
              <li>
                <button 
                  onClick={() => setIsSettingsOpen(true)} 
                  className="nav-link" 
                  style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
                  aria-haspopup="dialog"
                  aria-expanded={isSettingsOpen}
                >
                  <FiSettings /> {t.settings}
                </button>
              </li>
            </>
          )}
        </ul>

        {isAuthenticated && (
          <div className="auth-profile">
            <div className="auth-avatar">{userProfile.name.charAt(0)}</div>
            <div className="auth-info">
              <span className="auth-name">{userProfile.name}</span>
              <span className="auth-role">{userProfile.ticketSection} | {userProfile.seatNumber}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn" title={t.logout} aria-label={t.logout}>
              <FiLogOut size={20} />
            </button>
          </div>
        )}
      </nav>
      
      <main id="main-content-landmark" className="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Glassmorphic Settings Dialog */}
      {isSettingsOpen && (
        <div className="settings-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <div className="settings-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 id="settings-title" style={{ fontSize: '1.75rem', margin: 0 }} className="text-gradient">
                <FiUser style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> {t.settings}
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.75rem' }}
                aria-label="Close Settings"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSettings}>
              <div className="settings-form-group">
                <label htmlFor="pref-name">{t.nameLabel}</label>
                <input 
                  id="pref-name" 
                  type="text" 
                  className="settings-input"
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)} 
                  required
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="pref-lang">{t.langLabel}</label>
                <select 
                  id="pref-lang" 
                  className="settings-select"
                  value={tempLanguage} 
                  onChange={(e) => setTempLanguage(e.target.value as LanguageCode)}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label htmlFor="pref-access">{t.accessLabel}</label>
                <select 
                  id="pref-access" 
                  className="settings-select"
                  value={tempAccessibility} 
                  onChange={(e) => setTempAccessibility(e.target.value as AccessibilityPreference)}
                >
                  <option value="none">{t.none}</option>
                  <option value="step-free">{t.stepFree}</option>
                  <option value="visual-assistance">{t.visual}</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="settings-form-group">
                  <label htmlFor="pref-section">{t.sectionLabel}</label>
                  <select 
                    id="pref-section" 
                    className="settings-select"
                    value={tempSection}
                    onChange={(e) => setTempSection(e.target.value)}
                  >
                    <option value="North Stand">North Stand</option>
                    <option value="South Stand">South Stand</option>
                    <option value="East Stand">East Stand</option>
                    <option value="West Stand">West Stand</option>
                    <option value="VIP Lounge">VIP Lounge</option>
                    <option value="Fan Zone">Fan Zone</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label htmlFor="pref-seat">{t.seatLabel}</label>
                  <input 
                    id="pref-seat" 
                    type="text" 
                    className="settings-input"
                    value={tempSeat} 
                    onChange={(e) => setTempSeat(e.target.value)} 
                    placeholder="e.g. A-12"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}
              >
                <FiCheck /> {t.save}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
