import { TASKS } from '../data/teamCapacity.js';
import { CalloutIcon } from './Callout.jsx';
import { NOT_YET_ASSIGNED } from '../text/planText.js';

const shortName = (taskId) => TASKS.find((task) => task.id === taskId).shortName;

// Pieces and chips carry their task id; base.css maps it to that task's colour token.
// Unallocated has no task, so it stays neutral.
const pieceProps = (segment) => ({
  'data-task': segment.taskId,
  'data-projected': segment.projected || undefined,
});

function labelFor(segment) {
  if (segment.type === 'added') return `+${segment.hours} ${shortName(segment.taskId).toLowerCase()}`;
  if (segment.type === 'unallocated') return `${NOT_YET_ASSIGNED} ${segment.hours}`;
  return `${shortName(segment.taskId)} ${segment.hours}`;
}

/**
 * One horizontal bar of the team's weekly hours, on a fixed scale shared by both bars.
 * The strip is purely visual; the label row underneath carries every piece's name and exact hours,
 * so thin pieces never need to fit text and nothing depends on reading the strip.
 *
 * limit: { teamTotal, share } where the team's total sits. Its solid line and label are drawn only
 *   alongside an overflow; when the plan fits, the bar already ends there. It never moves.
 * overflow (over-allocated plans only): { overBy, proposedTotal, startShare, endShare, capped, breakShare }
 *   draws a red overflow past the line, an "N over" label, and a break mark if the bar was shortened.
 *   Solid, never dashed, because dashed means projected.
 */
export default function CapacityBar({ title, segments, limit, overflow }) {
  const percent = (share) => `${share * 100}%`;

  return (
    <div className={`bar${overflow ? ' bar--over' : ''}`}>
      <h3 className="bar__title">{title}</h3>

      {/* The line and its label only matter in a conflict, where they show where the overflow starts.
          When the plan fits, the label keeps its space (invisible) so the bar doesn't jump up and down. */}
      {limit && (
        <p
          className={`bar__limit-label${overflow ? '' : ' bar__limit-label--reserved'}`}
          style={{ width: percent(limit.share) }}
          aria-hidden="true"
        >
          {limit.teamTotal} hours: the team's total
        </p>
      )}

      <div className="bar__track">
        <div className="bar__strip" aria-hidden="true">
          {segments.map((segment) => (
            <span
              key={segment.key}
              className="bar__piece"
              {...pieceProps(segment)}
              style={{ width: percent(segment.share) }}
            />
          ))}
        </div>
        {overflow && (
          <span
            className="bar__overflow"
            style={{ left: percent(overflow.startShare), width: percent(overflow.endShare - overflow.startShare) }}
            aria-hidden="true"
          />
        )}
        {overflow?.capped && (
          <span className="bar__break" style={{ left: percent(overflow.breakShare) }} aria-hidden="true" />
        )}
        {limit && overflow && (
          <span className="bar__limit" style={{ left: percent(limit.share) }} aria-hidden="true" />
        )}
      </div>

      {overflow && (
        <>
          <p className="bar__over-label" style={{ width: percent(overflow.endShare) }} aria-hidden="true">
            <CalloutIcon kind="error" className="bar__over-icon" />
            {overflow.overBy} over{overflow.capped && ' (bar shortened)'}
          </p>
          {/* The line, overflow, break and label are visual, so say the same thing in words. */}
          <p className="visually-hidden">
            Proposed hours total {overflow.proposedTotal}, which is {overflow.overBy} over the team's{' '}
            {limit.teamTotal}.{overflow.capped && ' The bar is shortened to fit.'}
          </p>
        </>
      )}
      <ul className="bar__labels">
        {segments.map((segment) => (
          <li key={segment.key} className="bar__label">
            <span className="swatch" {...pieceProps(segment)} aria-hidden="true" />
            {labelFor(segment)}
            {/* The dashed outline is visual only, so say it in words for screen readers. */}
            {segment.projected && <span className="visually-hidden">, projected</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
