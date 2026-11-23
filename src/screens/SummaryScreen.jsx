import Callout from '../components/Callout.jsx';
import ChangesTable from '../components/ChangesTable.jsx';
import CapacityBar from '../components/CapacityBar.jsx';
import { UNKNOWNS } from '../data/teamCapacity.js';
import { proposalSentence, teamIntro, provenanceLine } from '../text/summaryText.js';
import SaveStatus from './SaveStatus.jsx';

/**
 * Screen 2: a read-only summary the team and the manager's manager can both read.
 * `summary` comes only from buildSummary, so it exists only for a ready plan.
 */
export default function SummaryScreen({ summary, rationale, onBack, onSave, saveState, onRetrySave }) {
  const reason = rationale.trim();

  return (
    <main className="page page--summary">
      {/* tabIndex -1 lets focus move here when the screen opens, without adding a tab stop. */}
      <h1 id="summary-heading" tabIndex={-1}>
        Support team capacity proposal: review summary
      </h1>
      <p className="draft-label">Draft, not approved</p>

      <Callout kind="info">
        Draft for discussion. This has not been approved. No roles or live work have changed, and no savings have been
        measured.
      </Callout>

      <section className="summary-section" aria-labelledby="summary-proposal">
        <h2 id="summary-proposal">The proposal</h2>
        <p>{proposalSentence(summary)}</p>
      </section>

      <section className="summary-section" aria-labelledby="summary-hours">
        <h2 id="summary-hours">Where the hours would go</h2>
        <p className="section-intro">{teamIntro()}</p>
        {/* The same bars as the plan screen, read-only, on the same fixed scale. A summary only
            exists for a ready plan, so there's never an overflow or 160 line here. */}
        <CapacityBar title="Today" segments={summary.bars.today} />
        <CapacityBar title="Proposed" segments={summary.bars.proposed} />
        {/* Explains the dashes, as on the plan screen, but with no "*" link: the summary has no
            "Where the numbers come from" section to point to. */}
        {summary.bars.proposed.some((segment) => segment.projected) && (
          <p className="bar-key">
            <span className="swatch" data-projected aria-hidden="true" />
            Dashed outline: projected hours
          </p>
        )}
        <ChangesTable plan={summary} showSources />
      </section>

      <section className="summary-section" aria-labelledby="summary-reason">
        <h2 id="summary-reason">Why this is suggested</h2>
        {reason ? <p className="rationale-text">{reason}</p> : <p className="muted">No reason entered yet.</p>}
      </section>

      <section className="summary-section" aria-labelledby="summary-unknowns">
        <h2 id="summary-unknowns">What we still need to find out</h2>
        <ul className="unknowns-list">
          {UNKNOWNS.map((unknown) => (
            <li key={unknown.id}>{unknown.text}</li>
          ))}
        </ul>
      </section>

      <p className="provenance">{provenanceLine()}</p>

      <div className="actions">
        <button type="button" className="button button--secondary" onClick={onBack}>
          Back to edit
        </button>
        <button type="button" className="button button--primary" onClick={onSave}>
          Save draft
        </button>
      </div>
      <SaveStatus saveState={saveState} onRetry={onRetrySave} />
    </main>
  );
}
