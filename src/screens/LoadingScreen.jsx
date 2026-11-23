// Simulated loading: shown for about 1.5 seconds when the page opens (about 4 with ?state=loading).
// Nothing is actually fetched; the data is already in the data file.
// Grey blocks sit roughly where the real content appears, so the page doesn't jump when it does.
export default function LoadingScreen() {
  return (
    <main className="page">
      <h1>Support team capacity proposal</h1>
      <p className="draft-label">Draft, not approved</p>

      {/* Announced to screen readers; the blocks below are decoration only. */}
      <p role="status" className="loading-message">
        Loading the team's baseline…
      </p>

      <div aria-hidden="true">
        <div className="placeholder placeholder--sentence" />
        <div className="plan-layout">
          <div className="placeholder placeholder--plan" />
          <div>
            <div className="placeholder placeholder--line" />
            <div className="placeholder placeholder--bar" />
            <div className="placeholder placeholder--bar" />
            <div className="placeholder placeholder--table" />
          </div>
        </div>
      </div>
    </main>
  );
}
