// Words for the plan screen that change with the numbers, kept apart from the screen so they can be tested.

import { hours } from '../format.js';
import { PLAN_STATUS } from '../logic/capacity.js';

// Plain-language names, everywhere the manager reads or hears them.
// The code, data and tests keep the brief's terms: "unallocated" and "allocated".
export const NOT_YET_ASSIGNED = 'Not yet assigned';

// After "Save draft". Both use banned words only to deny them, as the spec's own wording does.
export const SAVED_MESSAGE = 'Draft saved on this device. Nothing has been approved or changed.';
export const SAVE_FAILED_MESSAGE = "Your draft couldn't be saved. Your entries are still here.";

/**
 * The conflict message when more hours are assigned than released.
 * No "Your entries haven't been changed": the manager can see their own entries.
 */
export function conflictMessage(overBy) {
  return {
    title: `${hours(overBy)} too many`,
    body: `Lower the extra hours by ${overBy} in total.`,
  };
}

/**
 * What screen readers hear once changes settle, for a plan that fits or is over.
 * Returns null for an invalid plan; the screen speaks the field's own message instead.
 */
export function totalsAnnouncement(plan) {
  if (plan.status === PLAN_STATUS.READY) {
    return `${hours(plan.released)} released, ${plan.allocated} assigned, ${plan.unallocated} ${NOT_YET_ASSIGNED.toLowerCase()}.`;
  }
  if (plan.status === PLAN_STATUS.OVER_ALLOCATED) {
    return `${hours(plan.released)} released, ${plan.allocated} assigned. That's ${plan.overBy} more than released.`;
  }
  return null;
}

/**
 * The sentence at the top of the plan screen.
 * released: hours released from triage, or null if the triage entry can't be used.
 */
export function releaseSentence(released) {
  if (released === null) return 'Enter whole hours for proposed triage to see what could be released.';
  if (released === 0) return 'At this setting, no hours would be released from triage.';
  return `Up to ${hours(released)} a week could be released from triage. This is a projection, not a measured result.`;
}
