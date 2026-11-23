import { useEffect, useRef, useState } from 'react';
import HoursField from '../components/HoursField.jsx';
import CapacityBar from '../components/CapacityBar.jsx';
import ChangesTable from '../components/ChangesTable.jsx';
import SourceTag from '../components/SourceTag.jsx';
import Callout from '../components/Callout.jsx';
import SaveStatus from './SaveStatus.jsx';
import DemoControls from './DemoControls.jsx';
import {
  evaluatePlan,
  releasedFromTriage,
  todaySegments,
  proposedSegments,
  teamTotalShare,
  overflowMarks,
  PLAN_STATUS,
  INPUT_ERROR,
} from '../logic/capacity.js';
import { HOURS_LIMITS, PROVENANCE, TEAM, UNKNOWNS } from '../data/teamCapacity.js';
import { hours } from '../format.js';
import { releaseSentence, conflictMessage, totalsAnnouncement, NOT_YET_ASSIGNED } from '../text/planText.js';

// Wait for typing or dragging to settle before speaking, so screen-reader users
// hear one update rather than one per keystroke or slider step.
const ANNOUNCE_DELAY_MS = 750;

const HINT = `Whole hours, ${HOURS_LIMITS.min} to ${HOURS_LIMITS.max}`;

const FIELD_LABELS = {
  triage: 'Proposed triage hours',
  exceptions: 'Extra hours to exceptions',
  knowledge: 'Extra hours to the knowledge base',
};

// Words for each kind of invalid entry. The logic only reports a code.
const { min: MIN, max: MAX } = HOURS_LIMITS;
const ERROR_TEXT = {
  [INPUT_ERROR.EMPTY]: `Enter a number of whole hours, from ${MIN} to ${MAX}.`,
  [INPUT_ERROR.NOT_A_NUMBER]: 'Use numbers only, like 24.',
  [INPUT_ERROR.NEGATIVE]: `Hours can't be negative. Enter ${MIN} to ${MAX}.`,
  [INPUT_ERROR.NOT_WHOLE]: 'Use whole hours, like 12 rather than 12.5.',
  [INPUT_ERROR.OUT_OF_RANGE]: `Enter a number from ${MIN} to ${MAX}.`,
};

const SKILLS_NOTE =
  "Writing skills for this work haven't been assessed, so it isn't assumed to be staffed or feasible.";

const { baseline, estimate } = PROVENANCE;
const ESTIMATE_TAG_ID = 'source-estimate';

// Jump to the Estimate tag and move focus there, so keyboard and screen-reader users land in the
// right place. Handled here rather than by the browser so the address bar doesn't gain "#source-estimate".
function goToEstimate(event) {
  event.preventDefault();
  const tag = document.getElementById(ESTIMATE_TAG_ID);
  tag.scrollIntoView({ block: 'center' });
  tag.focus({ preventScroll: true });
}
const SOURCES = [
  {
    kind: 'baseline',
    description: `${baseline.revision}, supplied by ${baseline.suppliedBy} on ${baseline.dateLabel}. ${baseline.description}`,
  },
  {
    kind: 'estimate',
    // The legend's "*" links here.
    id: ESTIMATE_TAG_ID,
    marker: '*',
    description: `Internal planning estimate, ${estimate.dateLabel}. Projects triage at ${estimate.toHours} hours a week instead of ${estimate.fromHours}, with AI assistance. ${estimate.description}`,
  },
  // No measured outcomes exist, so this tag is deliberately empty.
  { kind: 'measured', description: PROVENANCE.measured ?? 'None yet' },
];

function ReleaseSentence({ released }) {
  return (
    <p className={`sentence${released === null ? ' sentence--placeholder' : ''}`}>{releaseSentence(released)}</p>
  );
}

// Under the fields: the "Not yet assigned" (unallocated) line, or the conflict message in its place.
function PlanStatus({ plan }) {
  if (plan.status === PLAN_STATUS.READY) {
    return (
      <p className="unallocated">
        {NOT_YET_ASSIGNED}: {hours(plan.unallocated)}
      </p>
    );
  }
  if (plan.status === PLAN_STATUS.OVER_ALLOCATED) {
    return (
      <div className="plan-status">
        {/* tabIndex -1: "Review summary" can move focus here, but it isn't an extra Tab stop. */}
        <Callout kind="error" title={conflictMessage(plan.overBy).title} id="plan-conflict" tabIndex={-1}>
          <p>{conflictMessage(plan.overBy).body}</p>
        </Callout>
      </div>
    );
  }
  // Invalid: each field shows its own message, so this line stays plain.
  return <p className="unallocated">{NOT_YET_ASSIGNED}: can't be worked out until every field has whole hours</p>;
}

// What the polite live region says once changes settle.
function announcementFor(plan) {
  const totals = totalsAnnouncement(plan);
  if (totals) return totals;
  // Invalid: say the first problem, so someone who can't see the field message still hears it.
  const [field, code] = Object.entries(plan.errors)[0];
  return `${FIELD_LABELS[field]}: ${ERROR_TEXT[code]}`;
}

const FIELD_ORDER = ['triage', 'exceptions', 'knowledge'];

/**
 * Screen 1. Shows and edits what App holds; it keeps nothing of its own that matters,
 * so leaving for the summary and coming back loses nothing.
 */
export default function PlanScreen({
  entries,
  onEntryChange,
  rationale,
  onRationaleChange,
  plan,
  onOpenSummary,
  onSave,
  saveState,
  onRetrySave,
  restored,
}) {
  const [announcement, setAnnouncement] = useState('');
  const hasChanged = useRef(false);

  const released = releasedFromTriage(entries.triage);
  const proposed = proposedSegments(plan);
  // The dashed-outline key only explains something if a dashed piece is on screen
  // (added hours or unallocated hours both count).
  const hasProjected = proposed?.some((segment) => segment.projected) ?? false;

  const update = (field) => (text) => {
    hasChanged.current = true;
    onEntryChange(field, text);
  };

  // Never a disabled button: if the plan isn't ready, take the manager to what needs fixing.
  function handleReviewSummary() {
    if (plan.status === PLAN_STATUS.READY) {
      onOpenSummary();
      return;
    }
    if (plan.status === PLAN_STATUS.OVER_ALLOCATED) {
      const message = document.getElementById('plan-conflict');
      message.scrollIntoView({ block: 'center' });
      message.focus({ preventScroll: true });
      return;
    }
    const firstProblem = FIELD_ORDER.find((field) => plan.errors[field]);
    document.getElementById(`field-${firstProblem}`).focus();
  }

  useEffect(() => {
    if (!hasChanged.current) return; // Don't speak on first load.
    const timer = setTimeout(() => setAnnouncement(announcementFor(evaluatePlan(entries))), ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [entries]);

  const fieldProps = { hint: HINT, min: HOURS_LIMITS.min, max: HOURS_LIMITS.max };
  const errorFor = (field) =>
    plan.status === PLAN_STATUS.INVALID && plan.errors[field] ? ERROR_TEXT[plan.errors[field]] : undefined;

  return (
    <main className="page">
      <h1>Support team capacity proposal</h1>
      <p className="draft-label">Draft, not approved</p>

      <ReleaseSentence released={released} />

      {/* Explains why the numbers may not be the starting ones. Goes away after the first change. */}
      {restored && (
        <div className="restored-note">
          <Callout kind="info" size="small">
            Your saved draft from this device is loaded.
          </Callout>
        </div>
      )}

      <div className="plan-layout">
        <fieldset className="plan-layout__plan">
          {/* A heading inside the legend: the group keeps its name, and heading navigation finds it. */}
          <legend>
            <h2 className="legend-heading">Your plan</h2>
          </legend>
          <HoursField
            {...fieldProps}
            id="field-triage"
            label={FIELD_LABELS.triage}
            value={entries.triage}
            onChange={update('triage')}
            error={errorFor('triage')}
          />
          <HoursField
            {...fieldProps}
            id="field-exceptions"
            label={FIELD_LABELS.exceptions}
            value={entries.exceptions}
            onChange={update('exceptions')}
            error={errorFor('exceptions')}
          />
          <HoursField
            {...fieldProps}
            id="field-knowledge"
            label={FIELD_LABELS.knowledge}
            value={entries.knowledge}
            onChange={update('knowledge')}
            error={errorFor('knowledge')}
            note={SKILLS_NOTE}
          />
          <PlanStatus plan={plan} />
        </fieldset>

        <section className="plan-layout__changes" aria-labelledby="changes-heading">
          <h2 id="changes-heading">What changes</h2>
          <p className="section-intro">Team hours per week, {TEAM.totalHours} in total.</p>

          {/* Both bars share one fixed scale, so Today always ends at the 160 line and nothing moves while dragging. */}
          <CapacityBar title="Today" segments={todaySegments()} />

          {proposed ? (
            <>
              <CapacityBar
                title="Proposed"
                segments={proposed}
                limit={{ teamTotal: TEAM.totalHours, share: teamTotalShare() }}
                overflow={overflowMarks(plan)}
              />
              {hasProjected && (
                <p className="bar-key">
                  <span className="swatch" data-projected aria-hidden="true" />
                  <span>
                    Dashed outline: projected hours
                    <a href={`#${ESTIMATE_TAG_ID}`} className="footnote-link" onClick={goToEstimate}>
                      <span aria-hidden="true">*</span>
                      <span className="visually-hidden">, see Estimate under Where the numbers come from</span>
                    </a>
                  </span>
                </p>
              )}
              {plan.status === PLAN_STATUS.READY ? (
                <ChangesTable plan={plan} />
              ) : (
                <p className="not-ready">
                  The table appears once the proposed hours fit within the team's {TEAM.totalHours}.
                </p>
              )}
            </>
          ) : (
            <div className="bar">
              <h3 className="bar__title">Proposed</h3>
              <p className="not-ready">
                The proposed bar and table appear once every entry is whole hours from {HOURS_LIMITS.min} to{' '}
                {HOURS_LIMITS.max}.
              </p>
            </div>
          )}
        </section>

        {/* After "What changes" in the page, so at narrow widths the bars come straight after the fields.
            At wide widths it's placed back under the fields, joined to the "Your plan" box. */}
        <div className="rationale plan-layout__reason">
          <label htmlFor="rationale" className="field-label">
            Why do you suggest this?
          </label>
          <p id="rationale-hint" className="field-hint">
            Optional. In your own words, for your team and your manager.
          </p>
          <textarea
            id="rationale"
            className="text-box"
            rows={4}
            value={rationale}
            onChange={(event) => onRationaleChange(event.target.value)}
            aria-describedby="rationale-hint"
          />
        </div>
      </div>

      <section className="page-section" aria-labelledby="sources-heading">
        <h2 id="sources-heading">Where the numbers come from</h2>
        <ul className="source-list">
          {SOURCES.map((source) => (
            <li key={source.kind}>
              <SourceTag kind={source.kind} description={source.description} id={source.id} marker={source.marker} />
            </li>
          ))}
        </ul>
      </section>

      <section className="page-section" aria-labelledby="unknowns-heading">
        <h2 id="unknowns-heading">What we don't know yet</h2>
        <ul className="unknowns-list">
          {UNKNOWNS.map((unknown) => (
            <li key={unknown.id}>{unknown.text}</li>
          ))}
        </ul>
      </section>

      <div className="actions">
        <button type="button" id="review-summary-button" className="button button--primary" onClick={handleReviewSummary}>
          Review summary
        </button>
        <button type="button" className="button button--secondary" onClick={onSave}>
          Save draft
        </button>
      </div>
      <SaveStatus saveState={saveState} onRetry={onRetrySave} />

      <DemoControls />

      {/* Speaks the totals once changes settle. Always on the page (empty until needed). */}
      <div className="visually-hidden" role="status" aria-live="polite" data-testid="totals-announcer">
        {announcement}
      </div>
    </main>
  );
}
