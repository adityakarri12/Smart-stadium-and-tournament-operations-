export const RouteLoader = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg-main)',
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderRadius: '1.25rem' }}>
        <div className="typing-indicator" style={{ transform: 'scale(1.3)' }} aria-label="Loading route" />
        <p className="text-muted" style={{ margin: '0.75rem 0 0', textAlign: 'center' }}>
          Loading stadium operations interface...
        </p>
      </div>
    </div>
  );
};
