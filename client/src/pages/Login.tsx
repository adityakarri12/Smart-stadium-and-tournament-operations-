import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStadium } from '../contexts/StadiumContext';
import { API_BASE_URL } from '../config/api';
import { Helmet } from 'react-helmet-async';
import {
  FiLock, FiMail, FiShield, FiArrowRight, FiCheck,
  FiUser, FiGlobe, FiMapPin, FiCpu, FiChevronRight
} from 'react-icons/fi';

type Step = 'auth' | 'profile';

export const Login = () => {
  const { isAuthenticated, login, isLoading, updateUserProfile } = useAuth();
  const { setActiveStadiumId } = useStadium();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Step management ───────────────────────────────────────────────
  const [step, setStep] = useState<Step>('auth');

  // ── Step 1: Auth ──────────────────────────────────────────────────
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError]     = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Step 2: Profile ───────────────────────────────────────────────
  const [name, setName]               = useState('');
  const [language, setLanguage]       = useState<'en' | 'es' | 'fr'>('en');
  const [accessibility, setAccessibility] = useState<'none' | 'step-free' | 'visual-assistance'>('none');
  const [seatNumber, setSeatNumber]   = useState('');

  // Hierarchy fetched from live API
  const [hierarchy, setHierarchy]             = useState<any[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedStadiumId, setSelectedStadiumId] = useState('');
  const [stadiumZones, setStadiumZones]       = useState<any[]>([]);
  const [selectedZoneName, setSelectedZoneName] = useState('');
  const [isFetchingHierarchy, setIsFetchingHierarchy] = useState(false);
  const [isFetchingZones, setIsFetchingZones] = useState(false);
  const [isSaving, setIsSaving]               = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // ── Fetch hierarchy when we move to profile step ──────────────────
  useEffect(() => {
    if (step !== 'profile') return;
    const load = async () => {
      setIsFetchingHierarchy(true);
      try {
        const res  = await fetch(`${API_BASE_URL}/api/hierarchy`);
        const json = await res.json();
        const data = json.data || [];
        setHierarchy(data);
        if (data.length > 0) {
          const firstCountry  = data[0];
          const firstStadium  = firstCountry.cities?.[0]?.stadiums?.[0];
          setSelectedCountryId(firstCountry.id);
          if (firstStadium) setSelectedStadiumId(firstStadium.id);
        }
      } catch {
        /* silent */
      } finally {
        setIsFetchingHierarchy(false);
      }
    };
    load();
  }, [step]);

  // ── Fetch zones whenever stadium changes ──────────────────────────
  useEffect(() => {
    if (!selectedStadiumId) return;
    const load = async () => {
      setIsFetchingZones(true);
      try {
        const res  = await fetch(`${API_BASE_URL}/api/stadium?stadiumId=${selectedStadiumId}`);
        const json = await res.json();
        const zones: any[] = json.data?.zones || [];
        setStadiumZones(zones);
        if (zones.length > 0) setSelectedZoneName(zones[0].name);
      } catch {
        /* silent */
      } finally {
        setIsFetchingZones(false);
      }
    };
    load();
  }, [selectedStadiumId]);

  // ── Guards ────────────────────────────────────────────────────────
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={from} replace />;

  // ── Derived lists ─────────────────────────────────────────────────
  const selectedCountry   = hierarchy.find((c: any) => c.id === selectedCountryId);
  const availableStadiums = selectedCountry?.cities?.flatMap((city: any) => city.stadiums) ?? [];

  const handleCountryChange = (id: string) => {
    setSelectedCountryId(id);
    const country = hierarchy.find((c: any) => c.id === id);
    const first   = country?.cities?.[0]?.stadiums?.[0];
    setSelectedStadiumId(first?.id ?? '');
    setStadiumZones([]);
    setSelectedZoneName('');
  };

  // ── Step 1 submit ─────────────────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      const ok = await login(password);
      if (ok) {
        setStep('profile');
      } else {
        setAuthError('Invalid credentials. Password must be at least 4 characters.');
      }
    } catch {
      setAuthError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2 submit ─────────────────────────────────────────────────
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    updateUserProfile({
      name:                   name.trim() || 'Spectator',
      preferredLanguage:      language,
      accessibilityPreference: accessibility,
      ticketSection:          selectedZoneName || 'General Concourse',
      seatNumber:             seatNumber.trim() || 'GA',
    });

    if (selectedStadiumId) setActiveStadiumId(selectedStadiumId);

    setTimeout(() => navigate(from, { replace: true }), 500);
  };

  // ── Shared input style ────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '0.6rem', color: 'var(--text-main)',
    fontSize: '0.95rem', outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.8px', display: 'block', marginBottom: '0.4rem',
  };

  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="login-container">
      <Helmet>
        <title>Command Center Authentication | FIFA World Cup 2026™</title>
        <meta name="description" content="Secure login to the FIFA World Cup 2026 Smart Stadium Platform." />
      </Helmet>

      <div className="mesh-bg" />

      <main className="login-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>

        {/* ── STEP INDICATOR ── */}
        <div style={{ width: '100%', maxWidth: step === 'profile' ? '580px' : '460px' }}>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            {(['auth', 'profile'] as Step[]).map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: step === s ? 'var(--accent-blue)' : (i === 0 && step === 'profile') ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                  transition: 'all 0.3s', border: step === s ? '2px solid rgba(0,240,255,0.4)' : 'none',
                }}>
                  {i === 0 && step === 'profile' ? <FiCheck size={14} /> : i + 1}
                </div>
                {i < 1 && <div style={{ width: '40px', height: '2px', background: step === 'profile' ? 'var(--success)' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />}
              </div>
            ))}
          </div>

          {/* ── STEP 1: AUTH ───────────────────────────────────────────── */}
          {step === 'auth' && (
            <div className="glass-panel" style={{ padding: '3rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div className="shield-icon" style={{ width: '64px', height: '64px', margin: '0 auto 1.25rem', border: '1px solid rgba(0,240,255,0.4)' }}>
                  <FiShield size={30} className="text-gradient" />
                </div>
                <h2 style={{ fontSize: '1.9rem', letterSpacing: '-0.5px', margin: 0 }}>Command Center</h2>
                <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
                  Authenticate to access the FIFA 2026 stadium network.
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label htmlFor="email" style={labelStyle}>Work Email</label>
                  <div className="input-with-icon">
                    <FiMail className="input-icon" />
                    <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="admin@fifa2026.org" disabled={isSubmitting} autoComplete="username" required />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" style={labelStyle}>Access Code / Password</label>
                  <div className="input-with-icon">
                    <FiLock className="input-icon" />
                    <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Enter any code (min 4 chars)" disabled={isSubmitting} autoComplete="current-password" required />
                  </div>
                </div>

                {authError && (
                  <div className="login-error" role="alert">{authError}</div>
                )}

                <button type="submit" className={`btn-primary login-btn ${isSubmitting ? 'loading' : ''}`}
                  disabled={isSubmitting || !password.trim() || !email.trim()}
                  style={{ padding: '1rem', borderRadius: '0.75rem', fontWeight: 600, marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {isSubmitting ? 'Verifying...' : <><span>Continue</span><FiArrowRight /></>}
                </button>
              </form>

              <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', textAlign: 'center', color: 'var(--success)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <FiCheck /> AES-256 Encrypted Connection
              </div>
            </div>
          )}

          {/* ── STEP 2: PROFILE ONBOARDING ─────────────────────────────── */}
          {step === 'profile' && (
            <div className="glass-panel" style={{ padding: '3rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <FiUser size={26} color="#fff" />
                </div>
                <h2 style={{ fontSize: '1.7rem', margin: 0 }}>Set Up Your Profile</h2>
                <p className="text-muted" style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
                  Tell us about you and your stadium. We'll personalise your experience.
                </p>
              </div>

              {isFetchingHierarchy ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <div className="typing-indicator" style={{ margin: '0 auto 1rem' }}>...</div>
                  <p style={{ fontSize: '0.9rem' }}>Loading stadium network...</p>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Name */}
                  <div>
                    <label style={labelStyle}><FiUser style={{ marginRight: '0.3rem' }} />Your Name</label>
                    <input style={inputStyle} value={name} onChange={e => setName(e.target.value)}
                      placeholder="e.g. Alex Johnson" required />
                  </div>

                  {/* Language */}
                  <div>
                    <label style={labelStyle}><FiGlobe style={{ marginRight: '0.3rem' }} />Preferred Language</label>
                    <select style={inputStyle} value={language} onChange={e => setLanguage(e.target.value as any)}>
                      <option value="en">🇬🇧 English</option>
                      <option value="es">🇪🇸 Español</option>
                      <option value="fr">🇫🇷 Français</option>
                    </select>
                  </div>

                  {/* Country → Stadium */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}><FiGlobe style={{ marginRight: '0.3rem' }} />Country</label>
                      <select style={inputStyle} value={selectedCountryId} onChange={e => handleCountryChange(e.target.value)}>
                        {hierarchy.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}><FiMapPin style={{ marginRight: '0.3rem' }} />Stadium</label>
                      <select style={inputStyle} value={selectedStadiumId} onChange={e => setSelectedStadiumId(e.target.value)}>
                        {availableStadiums.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Section → Seat */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}><FiMapPin style={{ marginRight: '0.3rem' }} />
                        Stand / Section {isFetchingZones && <span style={{ color: 'var(--accent-blue)', fontSize: '0.7rem' }}>loading…</span>}
                      </label>
                      <select style={inputStyle} value={selectedZoneName} onChange={e => setSelectedZoneName(e.target.value)} disabled={isFetchingZones || stadiumZones.length === 0}>
                        {stadiumZones.length === 0
                          ? <option>Loading zones…</option>
                          : stadiumZones.map((z: any) => (
                            <option key={z.id} value={z.name}>{z.name}</option>
                          ))
                        }
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Seat Number</label>
                      <input style={inputStyle} value={seatNumber} onChange={e => setSeatNumber(e.target.value)}
                        placeholder="e.g. A-12 or GA" required />
                    </div>
                  </div>

                  {/* Accessibility */}
                  <div>
                    <label style={labelStyle}>Accessibility Needs</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                      {[
                        { value: 'none', label: '♿ None (Standard)' },
                        { value: 'step-free', label: '🛗 Step-Free' },
                        { value: 'visual-assistance', label: '👁️ Visual Aid' },
                      ].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setAccessibility(opt.value as any)}
                          style={{
                            padding: '0.65rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.78rem', cursor: 'pointer',
                            border: accessibility === opt.value ? '1.5px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.1)',
                            background: accessibility === opt.value ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.04)',
                            color: accessibility === opt.value ? 'var(--accent-blue)' : 'var(--text-muted)',
                            fontWeight: accessibility === opt.value ? 700 : 400, transition: 'all 0.2s',
                          }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected stadium summary */}
                  {selectedStadiumId && availableStadiums.length > 0 && (
                    <div style={{ padding: '0.85rem 1rem', borderRadius: '0.6rem', background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.2)', fontSize: '0.82rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiCpu size={14} />
                      <span>
                        <strong>Active Stadium:</strong> {availableStadiums.find((s: any) => s.id === selectedStadiumId)?.name} — {selectedZoneName || 'General Concourse'}, Seat {seatNumber || 'GA'}
                      </span>
                    </div>
                  )}

                  <button type="submit" className="btn-primary"
                    disabled={isSaving || !name.trim() || !seatNumber.trim() || !selectedStadiumId}
                    style={{ padding: '1rem', borderRadius: '0.75rem', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '1rem' }}>
                    {isSaving
                      ? 'Entering Command Center…'
                      : <><FiChevronRight />Enter Command Center</>
                    }
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
