// All capacity calculations. Plain functions only: no screen code, no wording.
// Problems are returned as short codes so the interface owns the words people read.

import { TASKS, TEAM, HOURS_LIMITS, PROVENANCE } from '../data/teamCapacity.js';

export const PLAN_STATUS = {
  INVALID: 'invalid',
  OVER_ALLOCATED: 'overAllocated',
  READY: 'ready',
};

export const INPUT_ERROR = {
  EMPTY: 'empty',
  NOT_A_NUMBER: 'notANumber',
  NEGATIVE: 'negative',
  NOT_WHOLE: 'notWhole',
  OUT_OF_RANGE: 'outOfRange',
};

const baselineHours = (id) => TASKS.find((task) => task.id === id).hoursToday;

export const BASELINE_TRIAGE = baselineHours('triage');
export const ESTIMATE_TRIAGE = PROVENANCE.estimate.toHours;

// Only plain decimal numbers count. This rejects things people don't type on purpose,
// like "1e1", "0x10", "+5" or "Infinity", which JavaScript would otherwise accept.
const PLAIN_NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;

/**
 * Check one typed value.
 * Returns { ok: true, value } or { ok: false, error }.
 * The caller keeps the original text, so "12.0" stays on screen while 12 is used here.
 */
export function readHours(raw, { min, max } = HOURS_LIMITS) {
  const text = String(raw ?? '').trim();

  if (text === '') return { ok: false, error: INPUT_ERROR.EMPTY };
  if (!PLAIN_NUMBER.test(text)) return { ok: false, error: INPUT_ERROR.NOT_A_NUMBER };

  const number = Number(text);
  if (number < 0) return { ok: false, error: INPUT_ERROR.NEGATIVE };
  if (!Number.isInteger(number)) return { ok: false, error: INPUT_ERROR.NOT_WHOLE };
  if (number < min || number > max) return { ok: false, error: INPUT_ERROR.OUT_OF_RANGE };

  // "-0" would otherwise survive as negative zero.
  return { ok: true, value: number === 0 ? 0 : number };
}

/**
 * Released hours from the triage entry alone, or null if triage can't be used.
 * The live sentence only depends on triage, so it can stay visible
 * while an extra-hours field is being corrected.
 */
export function releasedFromTriage(rawTriage) {
  const check = readHours(rawTriage);
  return check.ok ? BASELINE_TRIAGE - check.value : null;
}

/**
 * Turn the three typed inputs into a plan.
 * inputs: { triage, exceptions, knowledge } as typed (strings or numbers).
 *
 * Returns one of:
 *   { status: 'invalid', ready: false, errors }
 *       At least one field can't be used. No figures at all.
 *   { status: 'overAllocated', ready: false, values, released, allocated, overBy, tasks, proposedTaskTotal }
 *       More allocated than released. Gives proposed task figures so the bar can show the overflow,
 *       but no unallocated hours, no table rows and no summary.
 *   { status: 'ready', ready: true, values, released, allocated, unallocated, tasks, proposedTaskTotal,
 *     total, unallocatedRow, totalRow }
 *
 * A bad value can never reach the sentence, the bars or the summary.
 */
export function evaluatePlan(inputs) {
  const checks = {
    triage: readHours(inputs.triage),
    exceptions: readHours(inputs.exceptions),
    knowledge: readHours(inputs.knowledge),
  };

  const errors = {};
  for (const [field, check] of Object.entries(checks)) {
    if (!check.ok) errors[field] = check.error;
  }
  if (Object.keys(errors).length > 0) {
    return { status: PLAN_STATUS.INVALID, ready: false, errors };
  }

  const values = {
    triage: checks.triage.value,
    exceptions: checks.exceptions.value,
    knowledge: checks.knowledge.value,
  };

  const released = BASELINE_TRIAGE - values.triage;
  const allocated = values.exceptions + values.knowledge;

  const extra = { exceptions: values.exceptions, knowledge: values.knowledge };
  const tasks = TASKS.map((task) => {
    let proposed = task.hoursToday;
    if (task.id === 'triage') proposed = values.triage;
    else if (task.id in extra) proposed = task.hoursToday + extra[task.id];
    return { ...task, today: task.hoursToday, proposed, change: proposed - task.hoursToday };
  });
  const proposedTaskTotal = tasks.reduce((sum, task) => sum + task.proposed, 0);

  if (allocated > released) {
    return {
      status: PLAN_STATUS.OVER_ALLOCATED,
      ready: false,
      values,
      released,
      allocated,
      overBy: allocated - released,
      // For drawing the overflow only. Totals past 160, e.g. 168.
      tasks,
      proposedTaskTotal,
      // No automatic fixes: the user's entries are never changed here.
    };
  }

  const unallocated = released - allocated;
  const total = proposedTaskTotal + unallocated;
  const todayTotal = tasks.reduce((sum, task) => sum + task.today, 0);

  return {
    status: PLAN_STATUS.READY,
    ready: true,
    values,
    released,
    allocated,
    unallocated,
    tasks,
    proposedTaskTotal,
    total,
    teamTotal: TEAM.totalHours,
    // Extra rows for the table. Nothing is unallocated today.
    unallocatedRow: { today: 0, proposed: unallocated, change: unallocated },
    totalRow: { today: todayTotal, proposed: total, change: total - todayTotal },
  };
}

/**
 * The only way to get the contents of a review summary.
 * Returns null unless the plan is ready, so a conflicted or invalid plan can never become a summary.
 */
export function buildSummary(plan) {
  if (plan.status !== PLAN_STATUS.READY) return null;
  const { released, allocated, unallocated, tasks, unallocatedRow, totalRow } = plan;
  // The same bar pieces as the plan screen, on the same fixed scale.
  const bars = { today: todaySegments(), proposed: proposedSegments(plan) };
  return { released, allocated, unallocated, tasks, unallocatedRow, totalRow, bars };
}

// Tasks that can receive released hours.
const RECEIVING_TASKS = ['exceptions', 'knowledge'];

// Room past the team's 160 for showing an overflow to scale. Bigger overflows are shortened with a break.
const OVERFLOW_ROOM_HOURS = 40;

/**
 * The fixed number of hours the full width of every bar stands for (160 + 40 = 200).
 * Fixed in every state, so the 160 line never moves and the bars never resize while dragging.
 */
export const BAR_SCALE_HOURS = TEAM.totalHours + OVERFLOW_ROOM_HOURS;

export function barScale() {
  return BAR_SCALE_HOURS;
}

// Where the team's 160 falls along the bar, as a fraction of its width (always 0.8).
export function teamTotalShare() {
  return TEAM.totalHours / BAR_SCALE_HOURS;
}

/**
 * Where a point N hours along the bar is drawn, as a fraction of the bar's width.
 * Up to the team's 160 it's always to scale. Past 160 it's to scale too, unless the overflow
 * is bigger than the room left; then only the overflow is squeezed into that room (the bar shows a break).
 */
function positionOf(hoursAlong, totalHours) {
  const team = TEAM.totalHours;
  const overflow = totalHours - team;
  if (hoursAlong <= team || overflow <= OVERFLOW_ROOM_HOURS) return hoursAlong / BAR_SCALE_HOURS;
  return (team + ((hoursAlong - team) * OVERFLOW_ROOM_HOURS) / overflow) / BAR_SCALE_HOURS;
}

// Give each piece its drawn width, in order, from a running total of hours.
function placeAlongBar(segments, totalHours) {
  let along = 0;
  return segments.map((segment) => {
    const start = positionOf(along, totalHours);
    along += segment.hours;
    return { ...segment, share: positionOf(along, totalHours) - start };
  });
}

/**
 * Pieces of the "Today" bar, in task order. All baseline, so none are projected.
 * Each piece: { key, type: 'task', taskId, hours, projected, share } where share is its fraction of the bar.
 * Same fixed scale as Proposed, so Today always ends at the 160 line.
 */
export function todaySegments() {
  const segments = TASKS.map((task) => ({
    key: task.id,
    type: 'task',
    taskId: task.id,
    hours: task.hoursToday,
    projected: false,
  }));
  return placeAlongBar(segments, TEAM.totalHours);
}

/**
 * Pieces of the "Proposed" bar, or null if any entry is invalid.
 * Order, in every state: the five tasks at their base hours (triage at its proposed hours),
 * then the added hours (projected), then unallocated hours (projected, ready plans only).
 * So whatever crosses the 160 line in a conflict is always added hours.
 * `hours` is always exact, for labels; `share` is the drawn width.
 * Zero-hour pieces are left out of the bar; the table still lists them.
 */
export function proposedSegments(plan) {
  if (plan.status === PLAN_STATUS.INVALID) return null;

  const base = plan.tasks.map((task) => ({
    key: task.id,
    type: 'task',
    taskId: task.id,
    hours: RECEIVING_TASKS.includes(task.id) ? task.today : task.proposed,
    projected: false,
  }));
  const added = plan.tasks
    .filter((task) => RECEIVING_TASKS.includes(task.id))
    .map((task) => ({ key: `${task.id}-added`, type: 'added', taskId: task.id, hours: task.change, projected: true }));
  const unallocated =
    plan.status === PLAN_STATUS.READY
      ? [{ key: 'unallocated', type: 'unallocated', hours: plan.unallocated, projected: true }]
      : [];

  const segments = [...base, ...added, ...unallocated].filter((segment) => segment.hours > 0);
  return placeAlongBar(segments, plan.proposedTaskTotal + (plan.unallocated ?? 0));
}

/**
 * What to draw for an over-allocated plan, or null otherwise:
 * the red overflow from the 160 line to the end of the bar, the "N over" label,
 * and whether the bar was shortened (with where its break mark goes).
 */
export function overflowMarks(plan) {
  if (plan.status !== PLAN_STATUS.OVER_ALLOCATED) return null;
  const total = plan.proposedTaskTotal;
  const capped = total - TEAM.totalHours > OVERFLOW_ROOM_HOURS;
  const startShare = teamTotalShare();
  const endShare = positionOf(total, total);
  return {
    teamTotal: TEAM.totalHours,
    proposedTotal: total,
    overBy: plan.overBy,
    startShare,
    endShare,
    capped,
    breakShare: capped ? (startShare + endShare) / 2 : null,
  };
}
